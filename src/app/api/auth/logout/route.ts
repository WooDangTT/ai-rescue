export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { logger } from "@/utils/logger";

export async function GET() {
  logger.debug("[auth] User logged out");
  await clearSession();
  return new NextResponse(null, {
    status: 302,
    headers: { Location: "/" },
  });
}
