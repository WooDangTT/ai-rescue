export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { logger } from "@/utils/logger";

export async function GET(request: NextRequest) {
  logger.info("[auth] User logged out");
  await clearSession();
  return NextResponse.redirect(new URL("/", request.url));
}
