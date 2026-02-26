import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createJob, getUser } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { analyzeInBackground } from "@/lib/analyzer";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const user = getUser(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("code_file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json(
      { error: "Only .zip files are accepted" },
      { status: 400 }
    );
  }

  // Create temp directory and extract
  const codeDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai_rescue_web_"));
  console.log(`[analyze] Extracting uploaded file to ${codeDir}`);

  try {
    const zipPath = path.join(codeDir, "_upload.zip");
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(zipPath, buffer);

    // Extract using system unzip
    execSync(`unzip -o "${zipPath}" -d "${codeDir}"`, {
      stdio: "pipe",
    });
    fs.unlinkSync(zipPath);

    // If zip contained a single root folder, flatten it
    const entries = fs
      .readdirSync(codeDir)
      .filter((e) => !e.startsWith(".") && e !== "__MACOSX");
    if (
      entries.length === 1 &&
      fs.statSync(path.join(codeDir, entries[0])).isDirectory()
    ) {
      const inner = path.join(codeDir, entries[0]);
      for (const item of fs.readdirSync(inner)) {
        fs.renameSync(
          path.join(inner, item),
          path.join(codeDir, item)
        );
      }
      fs.rmdirSync(inner);
      console.log(`[analyze] Flattened single root folder: ${entries[0]}`);
    }

    console.log(
      `[analyze] Extraction complete: ${fs.readdirSync(codeDir).length} files`
    );
  } catch (e) {
    fs.rmSync(codeDir, { recursive: true, force: true });
    console.error(`[analyze] Extraction failed: ${e}`);
    return NextResponse.json(
      { error: "Failed to extract zip file" },
      { status: 400 }
    );
  }

  // Create job in DB
  const jobId = uuidv4().slice(0, 8);
  createJob(jobId, user.id, file.name);

  // Start background analysis
  analyzeInBackground(jobId, codeDir);

  console.log(
    `[analyze] Analysis queued: job_id=${jobId}, filename=${file.name}`
  );
  return NextResponse.json({ job_id: jobId, status: "queued" });
}
