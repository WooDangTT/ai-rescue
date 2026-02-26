import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getUser, getUserJobs, Job } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "코드 분석 결과를 확인하고 새로운 프로젝트를 업로드하세요.",
};

function getGradeClass(grade: string): string {
  if (grade.startsWith("A")) return "grade-a";
  if (grade.startsWith("B")) return "grade-b";
  if (grade.startsWith("C")) return "grade-c";
  return "grade-d";
}

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const user = getUser(userId);
  if (!user) redirect("/");

  const jobs = getUserJobs(user.id);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <span className={`tag tag-${user.plan}`}>
          {user.plan.toUpperCase()} PLAN
        </span>
      </div>

      <DashboardClient />

      {/* Job History */}
      <div className="section-label" style={{ marginBottom: "16px" }}>
        // Analysis History
      </div>

      {jobs.length > 0 ? (
        <div className="job-list">
          {jobs.map((job: Job) => {
            const summary = job.summary as Record<string, unknown> | null;
            const grade = summary?.grade as string | undefined;
            const scores = summary?.scores as Record<string, number> | undefined;

            return (
              <Link
                key={job.id}
                href={`/report/${job.id}`}
                className="job-card"
              >
                {job.status === "complete" && grade ? (
                  <div className={`job-grade ${getGradeClass(grade)}`}>
                    {grade}
                  </div>
                ) : job.status === "analyzing" || job.status === "queued" ? (
                  <div
                    className="job-grade"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="job-grade grade-f">!</div>
                )}

                <div className="job-info">
                  <div className="job-filename">{job.filename}</div>
                  <div className="job-meta">
                    {job.created_at.slice(0, 16)} &middot;{" "}
                    {job.status.toUpperCase()}
                  </div>
                </div>

                {job.status === "complete" && scores && (
                  <div className="job-scores">
                    {Object.entries(scores).map(([dim, score]) => (
                      <div key={dim} className="score-item">
                        <span className="score-value">
                          {(score as number).toFixed(1)}
                        </span>
                        <span>{dim.slice(0, 4).toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" id="emptyState">
          <div className="empty-icon">&#x1F50D;</div>
          <p>No analyses yet. Upload a project to get started.</p>
        </div>
      )}
    </div>
  );
}
