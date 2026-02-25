"""SQLite database module for AI RESCUE - persists users and analysis jobs."""

import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent / "ai_rescue.db"


def get_db() -> sqlite3.Connection:
    """Get a database connection with row_factory set."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist."""
    logger.info("Initializing database at %s", DB_PATH)
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            plan TEXT NOT NULL DEFAULT 'free',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'queued',
            created_at TEXT NOT NULL,
            completed_at TEXT,
            error TEXT,
            summary_json TEXT,
            results_json TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
    """)
    conn.commit()
    conn.close()
    logger.info("Database initialized")


# ── User operations ──────────────────────────────────────────

def upsert_user(user_id: str, name: str, email: str, plan: str = "free") -> dict:
    """Insert or update a user. Returns user dict."""
    logger.debug("Upserting user: id=%s, name=%s", user_id, name)
    conn = get_db()
    now = datetime.now().isoformat()

    existing = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if existing:
        conn.execute(
            "UPDATE users SET name = ?, email = ? WHERE id = ?",
            (name, email, user_id),
        )
    else:
        conn.execute(
            "INSERT INTO users (id, name, email, plan, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, email, plan, now),
        )
    conn.commit()

    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(user)


def get_user(user_id: str) -> Optional[dict]:
    """Get user by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def update_user_plan(user_id: str, plan: str) -> Optional[dict]:
    """Update user's plan. Returns updated user dict."""
    logger.info("Updating plan: user_id=%s, plan=%s", user_id, plan)
    conn = get_db()
    conn.execute("UPDATE users SET plan = ? WHERE id = ?", (plan, user_id))
    conn.commit()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ── Job operations ───────────────────────────────────────────

def create_job(job_id: str, user_id: str, filename: str) -> dict:
    """Create a new analysis job."""
    logger.debug("Creating job: id=%s, user_id=%s, filename=%s", job_id, user_id, filename)
    conn = get_db()
    now = datetime.now().isoformat()
    conn.execute(
        "INSERT INTO jobs (id, user_id, filename, status, created_at) VALUES (?, ?, ?, 'queued', ?)",
        (job_id, user_id, filename, now),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    conn.close()
    return _job_to_dict(row)


def update_job_status(job_id: str, status: str, error: str = None):
    """Update job status (queued -> analyzing -> complete/failed)."""
    logger.debug("Updating job status: id=%s, status=%s", job_id, status)
    conn = get_db()
    conn.execute(
        "UPDATE jobs SET status = ?, error = ? WHERE id = ?",
        (status, error, job_id),
    )
    conn.commit()
    conn.close()


def complete_job(job_id: str, summary: dict, results: list):
    """Mark job as complete with results."""
    logger.debug("Completing job: id=%s", job_id)
    conn = get_db()
    conn.execute(
        "UPDATE jobs SET status = 'complete', completed_at = ?, summary_json = ?, results_json = ? WHERE id = ?",
        (datetime.now().isoformat(), json.dumps(summary, ensure_ascii=False), json.dumps(results, ensure_ascii=False), job_id),
    )
    conn.commit()
    conn.close()


def get_job(job_id: str) -> Optional[dict]:
    """Get job by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    conn.close()
    return _job_to_dict(row) if row else None


def get_user_jobs(user_id: str) -> List[dict]:
    """Get all jobs for a user, ordered by creation time desc."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [_job_to_dict(r) for r in rows]


def _job_to_dict(row: sqlite3.Row) -> dict:
    """Convert a job Row to a dict, parsing JSON fields."""
    d = dict(row)
    if d.get("summary_json"):
        d["summary"] = json.loads(d["summary_json"])
    else:
        d["summary"] = None
    if d.get("results_json"):
        d["results"] = json.loads(d["results_json"])
    else:
        d["results"] = None
    # Remove raw JSON fields from output
    d.pop("summary_json", None)
    d.pop("results_json", None)
    return d
