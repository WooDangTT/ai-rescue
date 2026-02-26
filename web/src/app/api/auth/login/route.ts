export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { upsertUser } from "@/lib/db";
import { setSessionUserId } from "@/lib/session";
import { logger } from "@/utils/logger";

const MOCK_USER_ID = "mock-user-001";
const MOCK_USER_NAME = "Demo User";
const MOCK_USER_EMAIL = "demo@airescue.dev";

export async function GET() {
  logger.info("[auth] Mock Google login triggered");
  upsertUser(MOCK_USER_ID, MOCK_USER_NAME, MOCK_USER_EMAIL);
  await setSessionUserId(MOCK_USER_ID);
  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5050"));
}
