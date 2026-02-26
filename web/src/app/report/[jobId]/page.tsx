import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getUser, getJob } from "@/lib/db";
import ReportClient from "./ReportClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobId: string }>;
}): Promise<Metadata> {
  const { jobId } = await params;
  return {
    title: `Report #${jobId}`,
    description: "코드 분석 리포트 - 4가지 차원별 등급과 상세 점수를 확인하세요.",
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const user = getUser(userId);
  if (!user) redirect("/");

  const job = getJob(jobId);
  if (!job || job.user_id !== user.id) redirect("/dashboard");

  return (
    <div className="report-page">
      <ReportClient jobId={jobId} />
    </div>
  );
}
