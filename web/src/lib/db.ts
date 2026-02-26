import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "ai_rescue.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    _db.pragma("synchronous = NORMAL");
    _db.pragma("busy_timeout = 5000");
    _db.pragma("cache_size = -20000");
    initDb(_db);
  }
  return _db;
}

function initDb(db: Database.Database): void {
  db.exec(`
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
  `);
  logger.info("[db] Database initialized at", DB_PATH);
}

// ── User operations ──────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  created_at: string;
}

export function upsertUser(
  userId: string,
  name: string,
  email: string,
  plan = "free"
): User {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId) as User | undefined;

  if (existing) {
    db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(
      name,
      email,
      userId
    );
  } else {
    db.prepare(
      "INSERT INTO users (id, name, email, plan, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, name, email, plan, new Date().toISOString());
  }

  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User;
}

export function getUser(userId: string): User | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId) as User | undefined;
  return row ?? null;
}

export function updateUserPlan(userId: string, plan: string): User | null {
  const db = getDb();
  db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, userId);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    | User
    | undefined ?? null;
}

// ── Job operations ───────────────────────────────────────

interface JobRow {
  id: string;
  user_id: string;
  filename: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  summary_json: string | null;
  results_json: string | null;
}

export interface Job {
  id: string;
  user_id: string;
  filename: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  summary: Record<string, unknown> | null;
  results: Record<string, unknown>[] | null;
}

function jobRowToJob(row: JobRow): Job {
  return {
    id: row.id,
    user_id: row.user_id,
    filename: row.filename,
    status: row.status,
    created_at: row.created_at,
    completed_at: row.completed_at,
    error: row.error,
    summary: row.summary_json ? JSON.parse(row.summary_json) : null,
    results: row.results_json ? JSON.parse(row.results_json) : null,
  };
}

export function createJob(
  jobId: string,
  userId: string,
  filename: string
): Job {
  const db = getDb();
  db.prepare(
    "INSERT INTO jobs (id, user_id, filename, status, created_at) VALUES (?, ?, ?, 'queued', ?)"
  ).run(jobId, userId, filename, new Date().toISOString());
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as JobRow;
  return jobRowToJob(row);
}

export function updateJobStatus(
  jobId: string,
  status: string,
  error?: string
): void {
  const db = getDb();
  db.prepare("UPDATE jobs SET status = ?, error = ? WHERE id = ?").run(
    status,
    error ?? null,
    jobId
  );
}

export function completeJob(
  jobId: string,
  summary: Record<string, unknown>,
  results: Record<string, unknown>[]
): void {
  const db = getDb();
  db.prepare(
    "UPDATE jobs SET status = 'complete', completed_at = ?, summary_json = ?, results_json = ? WHERE id = ?"
  ).run(
    new Date().toISOString(),
    JSON.stringify(summary),
    JSON.stringify(results),
    jobId
  );
}

export function getJob(jobId: string): Job | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM jobs WHERE id = ?")
    .get(jobId) as JobRow | undefined;
  return row ? jobRowToJob(row) : null;
}

export function getUserJobs(userId: string): Job[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as JobRow[];
  return rows.map(jobRowToJob);
}
