export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import crypto from "crypto";
import { cookies } from "next/headers";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export async function GET(request: Request) {
  if (!GOOGLE_CLIENT_ID) {
    logger.error("[auth] GOOGLE_CLIENT_ID is not configured");
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 }
    );
  }

  // Use consistent base URL to avoid 127.0.0.1 vs localhost cookie mismatch
  const fallbackUrl = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${fallbackUrl.protocol}//${fallbackUrl.host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  logger.info("[auth] Redirecting to Google OAuth");

  return NextResponse.redirect(googleAuthUrl);
}
