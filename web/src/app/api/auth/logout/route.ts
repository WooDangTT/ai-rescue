export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { logger } from "@/utils/logger";

export async function GET() {
  logger.info("[auth] User logged out");
  await clearSession();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5050"));
}
