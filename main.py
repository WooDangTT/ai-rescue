#!/usr/bin/env python3
"""AI RESCUE - Code Maturity Assessment Tool

Analyzes a GitHub repository across 4 dimensions:
  1. Scalability  - Can it handle growth?
  2. Stability    - Can it survive and recover from failures?
  3. Maintainability - Can developers safely change the code?
  4. Security     - Is it protected from attacks?

Usage:
    python3 main.py <github_repo_url> [--output <dir>] [--keep-clone]
    python3 main.py https://github.com/user/repo
    python3 main.py https://github.com/user/repo --output ./reports
"""

import argparse
import logging
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from analyzer import analyze_all
from reporter import generate_report, save_json_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def clone_repo(repo_url: str, target_dir: str, branch: str = None) -> bool:
    """Clone a GitHub repository to target directory.

    Args:
        repo_url: GitHub repository URL
        target_dir: Directory to clone into
        branch: Optional branch name to checkout

    Returns:
        True if clone succeeded
    """
    logger.info("Cloning repository: %s → %s (branch=%s)", repo_url, target_dir, branch)

    # Normalize URL: support shorthand like "user/repo"
    if not repo_url.startswith(("http://", "https://", "git@")):
        repo_url = f"https://github.com/{repo_url}"
        logger.info("Normalized URL: %s", repo_url)

    cmd = ["git", "clone", "--depth", "1"]
    if branch:
        cmd.extend(["--branch", branch])
    cmd.extend([repo_url, target_dir])

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            logger.error("Git clone failed: %s", result.stderr.strip())
            return False
        logger.info("Clone complete")
        return True
    except subprocess.TimeoutExpired:
        logger.error("Git clone timed out (120s)")
        return False
    except FileNotFoundError:
        logger.error("Git is not installed")
        return False


def print_banner():
    """Print the tool banner."""
    print("""
    ╔═══════════════════════════════════════════════════╗
    ║           AI RESCUE                               ║
    ║           Code Maturity Assessment Tool            ║
    ║                                                   ║
    ║   Analyzing: Scalability · Stability              ║
    ║              Maintainability · Security            ║
    ╚═══════════════════════════════════════════════════╝
    """)


def main():
    parser = argparse.ArgumentParser(
        description="AI RESCUE - Analyze GitHub repos for long-term code maturity",
    )
    parser.add_argument(
        "repo_url",
        help="GitHub repository URL (e.g., https://github.com/user/repo or user/repo)",
    )
    parser.add_argument(
        "--output", "-o",
        default=".",
        help="Output directory for reports (default: current directory)",
    )
    parser.add_argument(
        "--keep-clone",
        action="store_true",
        help="Keep the cloned repository after analysis",
    )
    parser.add_argument(
        "--json-only",
        action="store_true",
        help="Output only JSON report (no text report)",
    )
    parser.add_argument(
        "--branch", "-b",
        default=None,
        help="Specific branch to analyze (default: default branch)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable debug logging",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    print_banner()

    # Create temp directory for clone
    clone_dir = tempfile.mkdtemp(prefix="ai_rescue_")
    logger.debug("Temp clone directory: %s", clone_dir)

    try:
        # Step 1: Clone
        print(f"  [1/3] Cloning repository...")
        if not clone_repo(args.repo_url, clone_dir, branch=args.branch):
            print("\n  ✗ Failed to clone repository. Check the URL and try again.")
            sys.exit(1)
        print(f"  [1/3] Clone complete ✓")

        # Step 2: Analyze (4 parallel Claude CLI calls)
        print(f"  [2/3] Analyzing code (4 dimensions in parallel)...")
        print(f"         This may take a few minutes...\n")
        results = analyze_all(clone_dir)

        # Count successes
        successes = sum(1 for r in results if "error" not in r)
        failures = len(results) - successes
        print(f"  [2/3] Analysis complete: {successes} succeeded, {failures} failed ✓")

        # Step 3: Generate reports
        print(f"  [3/3] Generating report...")

        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Extract repo name for filenames
        repo_name = args.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        json_path = output_dir / f"{repo_name}_report.json"
        text_path = output_dir / f"{repo_name}_report.txt"

        # Save JSON report
        save_json_report(results, args.repo_url, str(json_path))
        print(f"         JSON: {json_path}")

        # Generate and save text report
        if not args.json_only:
            report = generate_report(results, args.repo_url, clone_dir)
            text_path.write_text(report, encoding="utf-8")
            print(f"         Text: {text_path}")
            print(f"\n{report}")

        print(f"\n  [3/3] Reports saved ✓")

    finally:
        # Cleanup clone
        if not args.keep_clone:
            logger.debug("Cleaning up clone directory: %s", clone_dir)
            shutil.rmtree(clone_dir, ignore_errors=True)
        else:
            print(f"\n  Clone kept at: {clone_dir}")

    print("\n  Done!")


if __name__ == "__main__":
    main()
