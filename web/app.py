"""AI RESCUE Web Service - Code Maturity Assessment SaaS"""

import logging
import os
import shutil
import tempfile
import uuid
import zipfile
from pathlib import Path
from threading import Thread
from typing import Optional

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
from database import (
    complete_job,
    create_job,
    get_job,
    get_user,
    get_user_jobs,
    init_db,
    update_job_status,
    update_user_plan,
    upsert_user,
)
from reporter import GRADE_TABLE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "ai-rescue-dev-secret-key-change-in-prod")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max upload

MOCK_USER_ID = "mock-user-001"
MOCK_USER_NAME = "Demo User"
MOCK_USER_EMAIL = "demo@airescue.dev"


def _get_grade(score: float):
    """Get letter grade and description from score."""
    for (low, high), (grade, desc) in GRADE_TABLE.items():
        if low <= score < high:
            return grade, desc
    return "?", "Unknown"


def _current_user() -> Optional[dict]:
    """Get current user from session, refreshing from DB."""
    user_id = session.get("user_id")
    if not user_id:
        return None
    return get_user(user_id)


def _allowed_file(filename: str) -> bool:
    """Check if uploaded file is an allowed archive type."""
    return filename.lower().endswith((".zip",))


def _extract_upload(file_storage, target_dir: str) -> bool:
    """Extract uploaded zip file to target directory."""
    logger.info("Extracting uploaded file to %s", target_dir)
    try:
        tmp_zip = os.path.join(target_dir, "_upload.zip")
        file_storage.save(tmp_zip)

        with zipfile.ZipFile(tmp_zip, "r") as zf:
            zf.extractall(target_dir)

        os.remove(tmp_zip)

        # If zip contained a single root folder, flatten it
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
    """Run analysis in background thread, persist to DB, then cleanup."""
    logger.info("Background analysis started: job_id=%s", job_id)
    update_job_status(job_id, "analyzing")

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

        summary = {
            "scores": scores,
            "average": round(avg_score, 2),
            "grade": grade,
            "grade_desc": grade_desc,
            "weakest": weakest_dim,
            "weakest_score": scores.get(weakest_dim, 0) if weakest_dim else 0,
        }

        complete_job(job_id, summary, results)
        logger.info("Analysis complete: job_id=%s, grade=%s", job_id, grade)

    except Exception as e:
        logger.error("Analysis failed: job_id=%s, error=%s", job_id, e)
        update_job_status(job_id, "failed", error=str(e))
    finally:
        logger.info("Cleaning up code directory: %s", code_dir)
        shutil.rmtree(code_dir, ignore_errors=True)


# ── Routes ──────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Landing page."""
    user = _current_user()
    return render_template("index.html", user=user)


@app.route("/auth/google/login")
def google_login():
    """Mock Google OAuth login."""
    logger.info("Mock Google login triggered")
    user = upsert_user(MOCK_USER_ID, MOCK_USER_NAME, MOCK_USER_EMAIL)
    session["user_id"] = user["id"]
    return redirect(url_for("dashboard"))


@app.route("/auth/logout")
def logout():
    """Logout - clear session."""
    session.pop("user_id", None)
    logger.info("User logged out")
    return redirect(url_for("index"))


@app.route("/dashboard")
def dashboard():
    """User dashboard - shows past analyses."""
    user = _current_user()
    if not user:
        return redirect(url_for("index"))

    jobs = get_user_jobs(user["id"])
    return render_template("dashboard.html", user=user, jobs=jobs)


@app.route("/analyze", methods=["POST"])
def analyze():
    """Handle file upload and start analysis."""
    user = _current_user()
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

    # Create job in DB
    job_id = str(uuid.uuid4())[:8]
    create_job(job_id, user["id"], file.filename)

    # Start background analysis
    thread = Thread(target=_run_analysis, args=(job_id, code_dir), daemon=True)
    thread.start()

    logger.info("Analysis queued: job_id=%s, filename=%s", job_id, file.filename)
    return jsonify({"job_id": job_id, "status": "queued"})


@app.route("/api/job/<job_id>")
def job_status(job_id):
    """Poll analysis job status."""
    user = _current_user()
    if not user:
        return jsonify({"error": "Login required"}), 401

    job = get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.get("user_id") != user["id"]:
        return jsonify({"error": "Access denied"}), 403

    response = {
        "job_id": job_id,
        "status": job["status"],
        "filename": job.get("filename"),
        "created_at": job.get("created_at"),
    }

    if job["status"] == "complete":
        response["summary"] = job.get("summary")

        # Pro plan: include full results
        if user.get("plan") == "pro":
            response["results"] = job.get("results")
            response["plan_limited"] = False
        else:
            response["plan_limited"] = True

    elif job["status"] == "failed":
        response["error"] = job.get("error")

    return jsonify(response)


@app.route("/report/<job_id>")
def report_page(job_id):
    """Report view page."""
    user = _current_user()
    if not user:
        return redirect(url_for("index"))

    job = get_job(job_id)
    if not job or job.get("user_id") != user["id"]:
        return redirect(url_for("dashboard"))

    return render_template("report.html", user=user, job_id=job_id, job=job)


@app.route("/pricing")
def pricing():
    """Pricing page."""
    user = _current_user()
    return render_template("pricing.html", user=user)


@app.route("/api/upgrade-pro", methods=["POST"])
def upgrade_pro():
    """Mock upgrade to Pro plan."""
    user = _current_user()
    if not user:
        return jsonify({"error": "Login required"}), 401

    updated = update_user_plan(user["id"], "pro")
    logger.info("User upgraded to Pro: user_id=%s", user["id"])
    return jsonify({"plan": updated["plan"], "message": "Upgraded to Pro!"})


@app.route("/api/downgrade-free", methods=["POST"])
def downgrade_free():
    """Mock downgrade back to Free plan."""
    user = _current_user()
    if not user:
        return jsonify({"error": "Login required"}), 401

    updated = update_user_plan(user["id"], "free")
    logger.info("User downgraded to Free: user_id=%s", user["id"])
    return jsonify({"plan": updated["plan"], "message": "Downgraded to Free"})


if __name__ == "__main__":
    init_db()
    logger.info("Starting AI RESCUE Web Service on http://localhost:5050")
    app.run(debug=True, host="0.0.0.0", port=5050)
