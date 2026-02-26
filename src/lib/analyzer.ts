import { execFile, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { completeJob, updateJobStatus } from "./db";
import { getGrade } from "./grades";
import { logger } from "@/utils/logger";

const DIMENSIONS = [
  "scalability",
  "stability",
  "maintainability",
  "security",
] as const;

type Dimension = (typeof DIMENSIONS)[number];

const PROMPTS_DIR = path.resolve(process.cwd(), "prompts");
const TIMEOUT_MS = 600_000; // 10 minutes

function findClaudeCli(): string {
  if (process.env.CLAUDE_CLI_PATH) {
    return process.env.CLAUDE_CLI_PATH;
  }
  try {
    const resolved = execSync("which claude", { encoding: "utf-8" }).trim();
    if (resolved) {
      logger.info(`[analyzer] Claude CLI found at: ${resolved}`);
      return resolved;
    }
  } catch {
    // which failed
  }
  const fallbacks = [
    path.join(process.env.HOME || "", ".local", "bin", "claude"),
    "/usr/local/bin/claude",
    "/usr/bin/claude",
  ];
  for (const p of fallbacks) {
    if (fs.existsSync(p)) {
      logger.info(`[analyzer] Claude CLI found at fallback: ${p}`);
      return p;
    }
  }
  logger.error("[analyzer] Claude CLI not found anywhere");
  return "claude"; // last resort: hope it's in PATH
}

let _claudeCli: string | null = null;
function getClaudeCli(): string {
  if (!_claudeCli) {
    _claudeCli = findClaudeCli();
  }
  return _claudeCli;
}

function loadPrompt(dimension: Dimension): string {
  const promptPath = path.join(PROMPTS_DIR, `${dimension}.txt`);
  return fs.readFileSync(promptPath, "utf-8");
}

function extractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();

  // Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // Try extracting from markdown code block
  if (trimmed.includes("```")) {
    const lines = trimmed.split("\n");
    const jsonLines: string[] = [];
    let inBlock = false;
    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        if (inBlock) break;
        inBlock = true;
        continue;
      }
      if (inBlock) jsonLines.push(line);
    }
    if (jsonLines.length > 0) {
      try {
        return JSON.parse(jsonLines.join("\n"));
      } catch {
        // continue
      }
    }
  }

  // Try finding JSON object boundaries
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      // continue
    }
  }

  return null;
}

function runClaudeCli(
  dimension: Dimension,
  repoPath: string,
  prompt: string
): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    // Build clean env (remove nested Claude session vars)
    const env = { ...process.env };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE_ENTRYPOINT;

    const child = execFile(
      getClaudeCli(),
      ["--print", "--model", "sonnet", "-p", prompt],
      {
        cwd: repoPath,
        env,
        timeout: TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed || error.code === "ETIMEDOUT") {
            logger.error(
              `[analyzer] Claude CLI timeout: dimension=${dimension}`
            );
            resolve({
              dimension,
              error: `Analysis timed out (${TIMEOUT_MS / 1000}s limit)`,
            });
            return;
          }
          logger.error(
            `[analyzer] Claude CLI error: dimension=${dimension}, error=${error.message}, stderr=${stderr?.slice(0, 500)}`
          );
          resolve({
            dimension,
            error: `Claude CLI failed: ${error.message}`,
          });
          return;
        }

        const parsed = extractJson(stdout);
        if (!parsed) {
          logger.error(
            `[analyzer] Failed to parse JSON: dimension=${dimension}, output=${stdout.slice(0, 500)}`
          );
          resolve({
            dimension,
            error: "Failed to parse JSON from Claude output",
            raw_output: stdout.slice(0, 1000),
          });
          return;
        }

        logger.info(
          `[analyzer] Analysis complete: dimension=${dimension}, score=${(parsed as Record<string, number>).overall_score?.toFixed(1)}`
        );
        resolve(parsed);
      }
    );

    // Ensure stdin is closed
    child.stdin?.end();
  });
}

async function analyzeDimension(
  dimension: Dimension,
  repoPath: string
): Promise<Record<string, unknown>> {
  logger.info(
    `[analyzer] Starting analysis: dimension=${dimension}, repo=${repoPath}`
  );
  const prompt = loadPrompt(dimension);

  let result = await runClaudeCli(dimension, repoPath, prompt);

  // Retry once if first attempt failed
  if ("error" in result) {
    logger.warn(
      `[analyzer] First attempt failed for dimension=${dimension}, retrying...`
    );
    result = await runClaudeCli(dimension, repoPath, prompt);
    if (!("error" in result)) {
      logger.info(`[analyzer] Retry succeeded for dimension=${dimension}`);
    } else {
      logger.error(
        `[analyzer] Retry also failed for dimension=${dimension}`
      );
    }
  }

  return result;
}

async function analyzeAll(
  repoPath: string
): Promise<Record<string, unknown>[]> {
  logger.info(
    `[analyzer] Starting parallel analysis for all dimensions: repo=${repoPath}`
  );

  const results = await Promise.all(
    DIMENSIONS.map((dim) => analyzeDimension(dim, repoPath))
  );

  logger.info(
    `[analyzer] All analyses complete: ${results.length} results collected`
  );
  return results;
}

/** Run analysis in background. Returns immediately. */
export function analyzeInBackground(
  jobId: string,
  codeDirPath: string
): void {
  (async () => {
    logger.info(`[analyzer] Background analysis started: job_id=${jobId}`);
    updateJobStatus(jobId, "analyzing");

    try {
      const results = await analyzeAll(codeDirPath);

      // Calculate summary
      const valid = results.filter(
        (r) => !("error" in r) && "overall_score" in r
      );
      const failed = results.filter((r) => "error" in r);

      const scores: Record<string, number> = {};
      for (const r of valid) {
        const dim = (r.dimension as string) || "unknown";
        scores[dim] = (r.overall_score as number) || 0;
      }

      const failedDims = failed.map(
        (r) => (r.dimension as string) || "unknown"
      );

      if (failedDims.length > 0) {
        logger.warn(
          `[analyzer] Some dimensions failed: ${failedDims.join(", ")} (job_id=${jobId})`
        );
      }

      const scoreValues = Object.values(scores);
      const avgScore =
        scoreValues.length > 0
          ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
          : 0;

      const [grade, gradeDesc] = getGrade(avgScore);

      const weakestDim =
        scoreValues.length > 0
          ? Object.entries(scores).reduce((a, b) =>
              a[1] < b[1] ? a : b
            )[0]
          : null;

      const summary = {
        scores,
        average: Math.round(avgScore * 100) / 100,
        grade,
        grade_desc: gradeDesc,
        weakest: weakestDim,
        weakest_score: weakestDim ? scores[weakestDim] : 0,
        failed_dimensions: failedDims,
      };

      completeJob(
        jobId,
        summary,
        results as Record<string, unknown>[]
      );
      logger.info(
        `[analyzer] Analysis complete: job_id=${jobId}, grade=${grade}`
      );
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      logger.error(
        `[analyzer] Analysis failed: job_id=${jobId}, error=${errorMsg}`
      );
      updateJobStatus(jobId, "failed", errorMsg);
    } finally {
      // Cleanup code directory
      logger.info(`[analyzer] Cleaning up code directory: ${codeDirPath}`);
      fs.rmSync(codeDirPath, { recursive: true, force: true });
    }
  })();
}
