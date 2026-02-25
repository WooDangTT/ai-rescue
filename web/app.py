"""AI RESCUE Web Service - Code Maturity Assessment SaaS"""

import json
import logging
import os
import shutil
import tempfile
import uuid
import zipfile
from datetime import datetime
from pathlib import Path
from threading import Thread

from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

# Add parent directory to path for analyzer/reporter imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from analyzer import analyze_all
from reporter import DIMENSION_LABELS, GRADE_TABLE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "ai-rescue-dev-secret-key-change-in-prod")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max upload

# In-memory store for analysis jobs (would be DB in production)
analysis_jobs = {}

MOCK_USER = {
    "id": "mock-user-001",
    "name": "Demo User",
    "email": "demo@airescue.dev",
    "avatar": None,
    "plan": "free",
}


def _get_grade(score: float):
    """Get letter grade and description from score."""
    for (low, high), (grade, desc) in GRADE_TABLE.items():
        if low <= score < high:
            return grade, desc
    return "?", "Unknown"


def _allowed_file(filename: str) -> bool:
    """Check if uploaded file is an allowed archive type."""
    return filename.lower().endswith((".zip",))


def _extract_upload(file_storage, target_dir: str) -> bool:
    """Extract uploaded zip file to target directory.

    Returns True on success.
    """
    logger.info("Extracting uploaded file to %s", target_dir)
    try:
        tmp_zip = os.path.join(target_dir, "_upload.zip")
        file_storage.save(tmp_zip)

        with zipfile.ZipFile(tmp_zip, "r") as zf:
            zf.extractall(target_dir)

        os.remove(tmp_zip)

        # If zip contained a single root folder, use that as the repo root
        entries = [e for e in os.listdir(target_dir) if not e.startswith(".")]
        if len(entries) == 1 and os.path.isdir(os.path.join(target_dir, entries[0])):
            inner = os.path.join(target_dir, entries[0])
            for item in os.listdir(inner):
                shutil.move(os.path.join(inner, item), os.path.join(target_dir, item))
            os.rmdir(inner)
            logger.debug("Flattened single root folder: %s", entries[0])

        logger.info("Extraction complete: %d files", len(os.listdir(target_dir)))
        return True
    except zipfile.BadZipFile:
        logger.error("Invalid zip file uploaded")
        return False
    except Exception as e:
        logger.error("Extraction failed: %s", e)
        return False


def _run_analysis(job_id: str, code_dir: str):
    """Run analysis in background thread, update job status, then cleanup."""
    logger.info("Background analysis started: job_id=%s", job_id)
    analysis_jobs[job_id]["status"] = "analyzing"

    try:
        results = analyze_all(code_dir)

        # Calculate summary
        valid = [r for r in results if "error" not in r and "overall_score" in r]
        scores = {}
        for r in valid:
            dim = r.get("dimension", "unknown")
            scores[dim] = r.get("overall_score", 0)

        avg_score = sum(scores.values()) / len(scores) if scores else 0
        grade, grade_desc = _get_grade(avg_score)
        weakest_dim = min(scores, key=scores.get) if scores else None

        analysis_jobs[job_id].update({
            "status": "complete",
            "completed_at": datetime.now().isoformat(),
            "results": results,
            "summary": {
                "scores": scores,
                "average": round(avg_score, 2),
                "grade": grade,
                "grade_desc": grade_desc,
                "weakest": weakest_dim,
                "weakest_score": scores.get(weakest_dim, 0) if weakest_dim else 0,
            },
        })
        logger.info("Analysis complete: job_id=%s, grade=%s", job_id, grade)

    except Exception as e:
        logger.error("Analysis failed: job_id=%s, error=%s", job_id, e)
        analysis_jobs[job_id].update({
            "status": "failed",
            "error": str(e),
        })
    finally:
        # Always cleanup uploaded files
        logger.info("Cleaning up code directory: %s", code_dir)
        shutil.rmtree(code_dir, ignore_errors=True)


# ── Routes ──────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Landing page."""
    user = session.get("user")
    return render_template("index.html", user=user)


@app.route("/auth/google/login")
def google_login():
    """Mock Google OAuth login - always logs in as demo user."""
    logger.info("Mock Google login triggered")
    session["user"] = MOCK_USER
    return redirect(url_for("dashboard"))


@app.route("/auth/logout")
def logout():
    """Logout - clear session."""
    session.pop("user", None)
    logger.info("User logged out")
    return redirect(url_for("index"))


@app.route("/dashboard")
def dashboard():
    """User dashboard - shows past analyses."""
    user = session.get("user")
    if not user:
        return redirect(url_for("index"))

    # Get user's analysis jobs
    user_jobs = [
        {**job, "id": jid}
        for jid, job in analysis_jobs.items()
        if job.get("user_id") == user["id"]
    ]
    user_jobs.sort(key=lambda j: j.get("created_at", ""), reverse=True)

    return render_template("dashboard.html", user=user, jobs=user_jobs)


@app.route("/analyze", methods=["POST"])
def analyze():
    """Handle file upload and start analysis."""
    user = session.get("user")
    if not user:
        return jsonify({"error": "Login required"}), 401

    if "code_file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["code_file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not _allowed_file(file.filename):
        return jsonify({"error": "Only .zip files are accepted"}), 400

    # Create temp directory and extract
    code_dir = tempfile.mkdtemp(prefix="ai_rescue_web_")
    if not _extract_upload(file, code_dir):
        shutil.rmtree(code_dir, ignore_errors=True)
        return jsonify({"error": "Failed to extract zip file"}), 400

    # Create analysis job
    job_id = str(uuid.uuid4())[:8]
    analysis_jobs[job_id] = {
        "user_id": user["id"],
        "filename": file.filename,
        "created_at": datetime.now().isoformat(),
        "status": "queued",
    }

    # Start background analysis
    thread = Thread(target=_run_analysis, args=(job_id, code_dir), daemon=True)
    thread.start()

    logger.info("Analysis queued: job_id=%s, filename=%s", job_id, file.filename)
    return jsonify({"job_id": job_id, "status": "queued"})


@app.route("/api/job/<job_id>")
def job_status(job_id):
    """Poll analysis job status."""
    user = session.get("user")
    if not user:
        return jsonify({"error": "Login required"}), 401

    job = analysis_jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.get("user_id") != user["id"]:
        return jsonify({"error": "Access denied"}), 403

    # For free plan users, strip detailed results
    response = {
        "job_id": job_id,
        "status": job["status"],
        "filename": job.get("filename"),
        "created_at": job.get("created_at"),
    }

    if job["status"] == "complete":
        summary = job.get("summary", {})
        response["summary"] = summary

        # Free plan: only grades, no details
        if user.get("plan") == "free":
            response["plan_limited"] = True
        else:
            response["results"] = job.get("results")

    elif job["status"] == "failed":
        response["error"] = job.get("error")

    return jsonify(response)


@app.route("/report/<job_id>")
def report_page(job_id):
    """Report view page."""
    user = session.get("user")
    if not user:
        return redirect(url_for("index"))

    job = analysis_jobs.get(job_id)
    if not job or job.get("user_id") != user["id"]:
        return redirect(url_for("dashboard"))

    return render_template("report.html", user=user, job_id=job_id, job=job)


@app.route("/pricing")
def pricing():
    """Pricing page."""
    user = session.get("user")
    return render_template("pricing.html", user=user)


if __name__ == "__main__":
    logger.info("Starting AI RESCUE Web Service on http://localhost:5050")
    app.run(debug=True, host="0.0.0.0", port=5050)
