import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getUser, getJob } from "@/lib/db";
import ReportClient from "./ReportClient";

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
