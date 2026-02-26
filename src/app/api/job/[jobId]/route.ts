export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getJob, getUser } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const user = getUser(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.user_id !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const response: Record<string, unknown> = {
    job_id: jobId,
    status: job.status,
    filename: job.filename,
    created_at: job.created_at,
  };

  if (job.status === "complete") {
    response.summary = job.summary;

    if (user.plan === "pro") {
      response.results = job.results;
      response.plan_limited = false;
    } else {
      response.plan_limited = true;
    }
  } else if (job.status === "failed") {
    response.error = job.error;
  }

  return NextResponse.json(response);
}
