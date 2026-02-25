"""Report generation module - creates readable output from analysis results."""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Tuple

logger = logging.getLogger(__name__)

DIMENSION_LABELS = {
    "scalability": "확장성 (Scalability)",
    "stability": "안정성 (Stability)",
    "maintainability": "유지보수성 (Maintainability)",
    "security": "보안성 (Security)",
}

SCORE_EMOJI = {
    5: "★★★★★",
    4: "★★★★☆",
    3: "★★★☆☆",
    2: "★★☆☆☆",
    1: "★☆☆☆☆",
}

GRADE_TABLE = {
    (4.5, 5.1): ("A+", "Production-Ready Excellence"),
    (4.0, 4.5): ("A", "Production-Ready"),
    (3.5, 4.0): ("B+", "Good with Minor Issues"),
    (3.0, 3.5): ("B", "Acceptable with Improvements Needed"),
    (2.5, 3.0): ("C+", "Below Average"),
    (2.0, 2.5): ("C", "Significant Issues"),
    (1.5, 2.0): ("D", "Major Concerns"),
    (0.0, 1.5): ("F", "Critical - Needs Overhaul"),
}


def _get_grade(score: float) -> Tuple[str, str]:
    for (low, high), (grade, desc) in GRADE_TABLE.items():
        if low <= score < high:
            return grade, desc
    return "?", "Unknown"


def _score_bar(score: float, width: int = 20) -> str:
    filled = round(score / 5.0 * width)
    return "█" * filled + "░" * (width - filled)


def generate_report(results: list[dict], repo_url: str, repo_path: str) -> str:
    """Generate a formatted text report from analysis results.

    Args:
        results: List of analysis result dicts
        repo_url: Original GitHub URL
        repo_path: Local clone path

    Returns:
        Formatted report string
    """
    logger.info("Generating report for %s", repo_url)

    # Sort results by dimension order
    dim_order = ["scalability", "stability", "maintainability", "security"]
    results_by_dim = {r["dimension"]: r for r in results if "dimension" in r}

    lines = []
    lines.append("=" * 70)
    lines.append("  AI RESCUE - Code Maturity Assessment Report")
    lines.append("=" * 70)
    lines.append(f"  Repository : {repo_url}")
    lines.append(f"  Analyzed   : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("=" * 70)

    # Collect scores for summary
    scores = {}
    all_critical = []
    all_recommendations = []

    for dim in dim_order:
        result = results_by_dim.get(dim)
        if not result or "error" in result:
            error_msg = result.get("error", "Unknown error") if result else "No result"
            lines.append(f"\n{'─' * 70}")
            lines.append(f"  {DIMENSION_LABELS.get(dim, dim)}")
            lines.append(f"  ⚠ Analysis failed: {error_msg}")
            scores[dim] = 0
            continue

        overall = result.get("overall_score", 0)
        scores[dim] = overall
        grade, grade_desc = _get_grade(overall)
        sub_scores = result.get("sub_scores", {})
        critical = result.get("critical_issues", [])
        recs = result.get("recommendations", [])

        all_critical.extend([(dim, c) for c in critical])
        all_recommendations.extend([(dim, r) for r in recs])

        lines.append(f"\n{'─' * 70}")
        lines.append(f"  {DIMENSION_LABELS.get(dim, dim)}")
        lines.append(f"  Overall: {overall:.1f}/5.0  [{grade}] {grade_desc}")
        lines.append(f"  {_score_bar(overall)}")
        lines.append("")

        for sub_name, sub_data in sub_scores.items():
            sub_score = sub_data.get("score", 0)
            sub_label = sub_name.replace("_", " ").title()
            stars = SCORE_EMOJI.get(sub_score, "?")
            lines.append(f"    {sub_label:.<30} {sub_score}/5 {stars}")
            for finding in sub_data.get("findings", []):
                lines.append(f"      - {finding}")
            lines.append("")

        if critical:
            lines.append("    ⚠ Critical Issues:")
            for issue in critical:
                lines.append(f"      ✗ {issue}")
            lines.append("")

        if recs:
            lines.append("    → Recommendations:")
            for rec in recs:
                lines.append(f"      • {rec}")

    # Summary section
    valid_scores = {k: v for k, v in scores.items() if v > 0}
    if valid_scores:
        avg_score = sum(valid_scores.values()) / len(valid_scores)
        min_dim = min(valid_scores, key=valid_scores.get)
        min_score = valid_scores[min_dim]
        grade, grade_desc = _get_grade(avg_score)

        lines.append(f"\n{'=' * 70}")
        lines.append("  SUMMARY")
        lines.append(f"{'=' * 70}")
        lines.append("")

        # Score overview
        for dim in dim_order:
            score = scores.get(dim, 0)
            label = DIMENSION_LABELS.get(dim, dim)
            if score > 0:
                lines.append(f"    {label:.<35} {score:.1f}/5.0  {_score_bar(score, 15)}")
            else:
                lines.append(f"    {label:.<35} N/A   (analysis failed)")

        lines.append(f"\n    {'Average Score':.<35} {avg_score:.1f}/5.0  [{grade}] {grade_desc}")
        lines.append(f"    {'Weakest Area':.<35} {DIMENSION_LABELS.get(min_dim, min_dim)} ({min_score:.1f})")
        lines.append("")

        # Liebig's law reminder
        lines.append(f"    ※ Liebig's Law: Overall maturity is limited by the weakest dimension ({min_score:.1f})")

        if all_critical:
            lines.append(f"\n    Total Critical Issues: {len(all_critical)}")
            for dim, issue in all_critical[:5]:
                dim_label = DIMENSION_LABELS.get(dim, dim).split("(")[0].strip()
                lines.append(f"      [{dim_label}] ✗ {issue}")
            if len(all_critical) > 5:
                lines.append(f"      ... and {len(all_critical) - 5} more")

    lines.append(f"\n{'=' * 70}")
    lines.append("  Powered by AI RESCUE (github.com/ai-rescue)")
    lines.append(f"{'=' * 70}")

    report = "\n".join(lines)
    logger.info("Report generated: %d lines", len(lines))
    return report


def save_json_report(results: list[dict], repo_url: str, output_path: str) -> None:
    """Save raw analysis results as JSON.

    Args:
        results: List of analysis result dicts
        repo_url: Original GitHub URL
        output_path: Path to write JSON file
    """
    report_data = {
        "repo_url": repo_url,
        "analyzed_at": datetime.now().isoformat(),
        "dimensions": results,
    }

    # Calculate summary
    valid = [r for r in results if "error" not in r and "overall_score" in r]
    if valid:
        scores = [r["overall_score"] for r in valid]
        report_data["summary"] = {
            "average_score": round(sum(scores) / len(scores), 2),
            "min_score": min(scores),
            "max_score": max(scores),
            "dimensions_analyzed": len(valid),
            "dimensions_failed": len(results) - len(valid),
        }

    Path(output_path).write_text(json.dumps(report_data, indent=2, ensure_ascii=False))
    logger.info("JSON report saved to %s", output_path)
