"""Core analysis module - runs 4 parallel Claude CLI calls for each dimension."""

import json
import logging
import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

DIMENSIONS = ["scalability", "stability", "maintainability", "security"]
PROMPTS_DIR = Path(__file__).parent / "prompts"
CLAUDE_CLI = "/Users/grooverider/.local/bin/claude"


def _build_env() -> dict:
    """Build clean environment for Claude CLI subprocess (remove nested session vars)."""
    env = os.environ.copy()
    env.pop("CLAUDECODE", None)
    env.pop("CLAUDE_CODE_ENTRYPOINT", None)
    return env


def _load_prompt(dimension: str) -> str:
    """Load prompt template for a given dimension."""
    prompt_file = PROMPTS_DIR / f"{dimension}.txt"
    logger.debug("Loading prompt for dimension=%s from %s", dimension, prompt_file)
    return prompt_file.read_text(encoding="utf-8")


def _extract_json(text: str) -> Optional[dict]:
    """Extract JSON from Claude CLI output, handling markdown code blocks."""
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    if "```" in text:
        lines = text.split("\n")
        json_lines = []
        in_block = False
        for line in lines:
            if line.strip().startswith("```"):
                if in_block:
                    break
                in_block = True
                continue
            if in_block:
                json_lines.append(line)
        if json_lines:
            try:
                return json.loads("\n".join(json_lines))
            except json.JSONDecodeError:
                pass

    # Try finding JSON object boundaries
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    return None


TIMEOUT_SECONDS = 600  # 10 minutes per dimension


def _run_claude_cli(dimension: str, repo_path: str, prompt: str) -> dict:
    """Execute a single Claude CLI call for a dimension.

    Returns:
        Parsed JSON result dict, or error dict on failure.
    """
    try:
        result = subprocess.run(
            [CLAUDE_CLI, "--print", "--model", "sonnet", "-p", prompt],
            cwd=repo_path,
            env=_build_env(),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=TIMEOUT_SECONDS,
            text=True,
        )
        logger.debug(
            "Claude CLI finished: dimension=%s, exit_code=%d, stdout_len=%d",
            dimension, result.returncode, len(result.stdout),
        )

        if result.returncode != 0:
            logger.error(
                "Claude CLI error: dimension=%s, stderr=%s",
                dimension, result.stderr[:500],
            )
            return {
                "dimension": dimension,
                "error": f"Claude CLI exited with code {result.returncode}",
                "stderr": result.stderr[:500],
            }

        parsed = _extract_json(result.stdout)
        if parsed is None:
            logger.error(
                "Failed to parse JSON: dimension=%s, output=%s",
                dimension, result.stdout[:500],
            )
            return {
                "dimension": dimension,
                "error": "Failed to parse JSON from Claude output",
                "raw_output": result.stdout[:1000],
            }

        logger.info(
            "Analysis complete: dimension=%s, score=%.1f",
            dimension, parsed.get("overall_score", 0),
        )
        return parsed

    except subprocess.TimeoutExpired:
        logger.error("Claude CLI timeout: dimension=%s (limit=%ds)", dimension, TIMEOUT_SECONDS)
        return {
            "dimension": dimension,
            "error": f"Analysis timed out ({TIMEOUT_SECONDS}s limit)",
        }
    except Exception as e:
        logger.error("Unexpected error: dimension=%s, error=%s", dimension, e)
        return {
            "dimension": dimension,
            "error": str(e),
        }


def analyze_dimension(dimension: str, repo_path: str) -> dict:
    """Run Claude CLI analysis for a single dimension with 1 retry on failure.

    Args:
        dimension: One of 'scalability', 'stability', 'maintainability', 'security'
        repo_path: Absolute path to the cloned repository

    Returns:
        Parsed JSON result dict, or error dict on failure
    """
    logger.info("Starting analysis: dimension=%s, repo=%s", dimension, repo_path)
    prompt = _load_prompt(dimension)

    result = _run_claude_cli(dimension, repo_path, prompt)

    # Retry once if first attempt failed
    if "error" in result:
        logger.warning(
            "First attempt failed for dimension=%s, retrying... (error: %s)",
            dimension, result.get("error", "unknown"),
        )
        result = _run_claude_cli(dimension, repo_path, prompt)
        if "error" not in result:
            logger.info("Retry succeeded for dimension=%s", dimension)
        else:
            logger.error(
                "Retry also failed for dimension=%s: %s",
                dimension, result.get("error", "unknown"),
            )

    return result


def analyze_all(repo_path: str) -> List[dict]:
    """Run all 4 dimension analyses in parallel.

    Args:
        repo_path: Absolute path to the cloned repository

    Returns:
        List of 4 result dicts (one per dimension)
    """
    logger.info("Starting parallel analysis for all dimensions: repo=%s", repo_path)
    results = []

    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_dim = {
            executor.submit(analyze_dimension, dim, repo_path): dim
            for dim in DIMENSIONS
        }
        for future in as_completed(future_to_dim):
            dim = future_to_dim[future]
            try:
                result = future.result()
                results.append(result)
                logger.info("Collected result: dimension=%s", dim)
            except Exception as e:
                logger.error("Future failed: dimension=%s, error=%s", dim, e)
                results.append({"dimension": dim, "error": str(e)})

    logger.info("All analyses complete: %d results collected", len(results))
    return results
