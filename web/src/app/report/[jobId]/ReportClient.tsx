"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface DimensionMeta {
  label: string;
  labelKo: string;
  icon: string;
  color: string;
}

const DIMENSION_META: Record<string, DimensionMeta> = {
  scalability: { label: "Scalability", labelKo: "확장성", icon: "\u21C5", color: "#7c4dff" },
  stability: { label: "Stability", labelKo: "안정성", icon: "\u2764", color: "#00c9a7" },
  maintainability: { label: "Maintainability", labelKo: "유지보수성", icon: "\u270E", color: "#4da6ff" },
  security: { label: "Security", labelKo: "보안성", icon: "\uD83D\uDD12", color: "#ff5c8a" },
};

const DIM_ORDER = ["scalability", "stability", "maintainability", "security"];

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#00c9a7";
  if (grade.startsWith("B")) return "#4da6ff";
  if (grade.startsWith("C")) return "#ffb020";
  return "#ff4466";
}

function scoreToGrade(score: number): string {
  if (score >= 4.5) return "A+";
  if (score >= 4.0) return "A";
  if (score >= 3.5) return "B+";
  if (score >= 3.0) return "B";
  if (score >= 2.5) return "C+";
  if (score >= 2.0) return "C";
  if (score >= 1.5) return "D";
  return "F";
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ReportClientProps {
  jobId: string;
}

export default function ReportClient({ jobId }: ReportClientProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const resp = await fetch(`/api/job/${jobId}`);
        const json = await resp.json();

        if (json.status === "analyzing" || json.status === "queued") {
          setTimeout(loadReport, 3000);
          return;
        }

        if (json.status === "failed") {
          setData({ failed: true, error: json.error || "Unknown error" });
          setLoading(false);
          return;
        }

        if (json.status === "complete") {
          setData(json);
          setLoading(false);
        }
      } catch {
        setTimeout(loadReport, 5000);
      }
    }

    loadReport();
  }, [jobId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <div
          className="spinner"
          style={{ width: 40, height: 40, margin: "0 auto 20px", borderWidth: 3 }}
        ></div>
        <p style={{ color: "var(--text-secondary)" }}>
          Loading analysis results...
        </p>
      </div>
    );
  }

  if (data?.failed) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <p style={{ color: "var(--accent-danger)" }}>
          Analysis failed: {data.error}
        </p>
      </div>
    );
  }

  const summary = data.summary;
  const gc = getGradeColor(summary.grade);
  const failedDims: string[] = summary.failed_dimensions || [];

  return (
    <>
      {/* Header */}
      <div className="report-header">
        <div
          className="report-grade-circle"
          style={{ borderColor: gc, color: gc, boxShadow: `0 0 40px ${gc}33` }}
        >
          <span className="grade-letter">{summary.grade}</span>
          <span className="grade-score">
            {summary.average.toFixed(1)}/5.0
          </span>
        </div>
        <h1>{summary.grade_desc}</h1>
        <p className="report-filename">{data.filename}</p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            marginTop: "8px",
          }}
        >
          Analyzed: {data.created_at?.replace("T", " ").substring(0, 16)}
        </p>
      </div>

      {/* Score Cards */}
      <div className="score-cards">
        {DIM_ORDER.map((dim) => {
          const meta = DIMENSION_META[dim];
          const score = summary.scores[dim] as number | undefined;
          const isFailed = failedDims.includes(dim) || score === undefined;

          if (isFailed) {
            return (
              <div
                key={dim}
                className="score-card"
                style={{ opacity: 0.7, border: "1.5px dashed #ffb020" }}
              >
                <div className="score-card-header">
                  <span className="score-card-label">
                    {meta.icon} {meta.labelKo} ({meta.label})
                  </span>
                  <span
                    className="score-card-grade"
                    style={{ background: "#fff0e0", color: "#cc7700" }}
                  >
                    ERROR
                  </span>
                </div>
                <div
                  className="score-card-value"
                  style={{ color: "#cc7700", fontSize: "0.95rem" }}
                >
                  분석 실패 (시간 초과)
                </div>
                <div className="score-bar">
                  <div
                    className="score-bar-fill"
                    style={{ width: "0%", background: "#ffb020" }}
                  ></div>
                </div>
              </div>
            );
          }

          const dimGrade = scoreToGrade(score);
          const dimColor = getGradeColor(dimGrade);
          const pct = ((score / 5.0) * 100).toFixed(0);

          return (
            <div key={dim} className="score-card">
              <div className="score-card-header">
                <span className="score-card-label">
                  {meta.icon} {meta.labelKo} ({meta.label})
                </span>
                <span
                  className="score-card-grade"
                  style={{ background: `${dimColor}22`, color: dimColor }}
                >
                  {dimGrade}
                </span>
              </div>
              <div className="score-card-value" style={{ color: dimColor }}>
                {score.toFixed(1)}
                <span style={{ fontSize: "0.9rem", opacity: 0.5 }}>/5.0</span>
              </div>
              <div className="score-bar">
                <div
                  className="score-bar-fill"
                  style={{ width: `${pct}%`, background: dimColor }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Liebig's Law */}
      <div
        style={{
          background: "#fff7ee",
          border: "1.5px solid #ffddb3",
          borderRadius: "var(--radius)",
          padding: "20px 24px",
          marginBottom: "40px",
          fontSize: "0.88rem",
        }}
      >
        <span style={{ color: "var(--accent-warning)" }}>&#x26A0;</span>{" "}
        <strong>Liebig&apos;s Law</strong>{" "}
        <span style={{ color: "var(--text-secondary)" }}>
          — Overall maturity is limited by the weakest dimension:{" "}
          {DIMENSION_META[summary.weakest]?.labelKo || summary.weakest} (
          {summary.weakest_score.toFixed(1)}/5.0)
        </span>
      </div>

      {/* Pro: Detailed Results */}
      {!data.plan_limited && data.results && (
        <ProDetails results={data.results} />
      )}

      {/* Free: Paywall */}
      {data.plan_limited && (
        <div className="paywall-section" style={{ display: "block" }}>
          <div className="paywall-blur">
            <div className="section-label">// Detailed Analysis</div>
            <h2
              className="section-title"
              style={{ marginBottom: "24px" }}
            >
              Critical Issues &amp; Recommendations
            </h2>
            <div
              style={{
                background: "white",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "24px",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ marginBottom: "12px" }}>
                Scalability - Critical Issues (4)
              </h3>
              <p style={{ color: "var(--text-secondary)" }}>
                No rate limiting on public API routes. Zero code splitting
                across modules...
              </p>
            </div>
            <div
              style={{
                background: "white",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "24px",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ marginBottom: "12px" }}>
                Security - Critical Issues (5)
              </h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Secrets committed to repository. Missing security headers...
              </p>
            </div>
          </div>
          <div className="paywall-overlay">
            <div className="lock-icon">&#x1F512;</div>
            <h3>Detailed Analysis Available on Pro Plan</h3>
            <p>
              Get critical issues, sub-scores, specific code findings, and
              <br />
              actionable recommendations for each dimension.
            </p>
            <Link href="/pricing" className="btn btn-upgrade">
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function ProDetails({ results }: { results: any[] }) {
  return (
    <div className="detail-section" style={{ marginTop: "48px" }}>
      <div className="section-label">// Detailed Analysis</div>
      <h2 className="section-title" style={{ marginBottom: "24px" }}>
        Full Report
      </h2>

      {DIM_ORDER.map((dim) => {
        const result = results.find((r: any) => r.dimension === dim);
        const meta = DIMENSION_META[dim];

        // Error card for failed dimensions
        if (!result || result.error) {
          return (
            <div
              key={dim}
              className="detail-dimension"
              style={{ borderColor: "#ffb020", opacity: 0.8 }}
            >
              <div className="detail-dimension-header">
                <div className="detail-dimension-title">
                  {meta.icon} {meta.labelKo} ({meta.label})
                </div>
                <div
                  className="detail-dimension-score"
                  style={{ color: "#cc7700" }}
                >
                  분석 실패
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "#fff8ef",
                  borderRadius: "var(--radius-sm)",
                  color: "#8b6914",
                  fontSize: "0.88rem",
                }}
              >
                이 차원의 분석이 실패했습니다:{" "}
                {result ? result.error : "결과 없음"}. 다시 분석을 시도해
                주세요.
              </div>
            </div>
          );
        }

        const overallScore = result.overall_score || 0;
        const dimGrade = scoreToGrade(overallScore);
        const dimColor = getGradeColor(dimGrade);
        const subScores = result.sub_scores || {};
        const criticals: string[] = result.critical_issues || [];
        const recs: string[] = result.recommendations || [];

        return (
          <div key={dim} className="detail-dimension">
            <div className="detail-dimension-header">
              <div className="detail-dimension-title">
                {meta.icon} {meta.labelKo} ({meta.label})
              </div>
              <div
                className="detail-dimension-score"
                style={{ color: dimColor }}
              >
                {overallScore.toFixed(1)}/5.0{" "}
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: `${dimColor}18`,
                  }}
                >
                  {dimGrade}
                </span>
              </div>
            </div>

            {/* Sub-scores */}
            {Object.entries(subScores).length > 0 && (
              <div className="sub-score-grid">
                {Object.entries(subScores).map(
                  ([subName, subData]: [string, any]) => {
                    const subScore = subData.score || 0;
                    const subColor = getGradeColor(scoreToGrade(subScore));
                    const subLabel = subName
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase());
                    const subPct = ((subScore / 5.0) * 100).toFixed(0);
                    const findings: string[] = subData.findings || [];

                    return (
                      <div key={subName} className="sub-score-item">
                        <div className="sub-score-label">{subLabel}</div>
                        <div
                          className="sub-score-value"
                          style={{ color: subColor }}
                        >
                          {subScore}/5
                        </div>
                        <div className="sub-score-bar">
                          <div
                            className="sub-score-bar-fill"
                            style={{
                              width: `${subPct}%`,
                              background: subColor,
                            }}
                          ></div>
                        </div>
                        {findings.length > 0 && (
                          <ul
                            className="findings-list"
                            style={{ marginTop: "10px" }}
                          >
                            {findings.map((f, i) => (
                              <li
                                key={i}
                                dangerouslySetInnerHTML={{
                                  __html: escapeHtml(f),
                                }}
                              />
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* Critical issues */}
            {criticals.length > 0 && (
              <div className="critical-issues">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    marginBottom: "10px",
                    color: "#d4364f",
                  }}
                >
                  Critical Issues ({criticals.length})
                </div>
                {criticals.map((c, i) => (
                  <div key={i} className="critical-item">
                    <span className="critical-icon">&#x2717;</span>
                    <span
                      dangerouslySetInnerHTML={{ __html: escapeHtml(c) }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {recs.length > 0 && (
              <div className="recommendations">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    marginBottom: "10px",
                    color: "#0a6b58",
                  }}
                >
                  Recommendations ({recs.length})
                </div>
                {recs.map((r, i) => (
                  <div key={i} className="rec-item">
                    <span className="rec-icon">&#x2192;</span>
                    <span
                      dangerouslySetInnerHTML={{ __html: escapeHtml(r) }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
