export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upsertGoogleUser } from "@/lib/db";
import { logger } from "@/utils/logger";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;

  // Handle Google OAuth errors
  if (error) {
    logger.warn("[auth] Google OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_denied`);
  }

  if (!code || !state) {
    logger.warn("[auth] Missing code or state in callback");
    return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
  }

  // Verify CSRF state (read-only from cookies, don't modify via cookies() API)
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  if (!savedState || savedState !== state) {
    logger.warn("[auth] CSRF state mismatch");
    return NextResponse.redirect(`${baseUrl}/?error=invalid_state`);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.error("[auth] Google OAuth credentials not configured");
    return NextResponse.redirect(`${baseUrl}/?error=server_error`);
  }

  try {
    // Exchange authorization code for tokens
    const redirectUri = `${baseUrl}/api/auth/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      logger.error("[auth] Token exchange failed:", errBody);
      return NextResponse.redirect(`${baseUrl}/?error=token_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();
    logger.debug("[auth] Token exchange successful");

    // Get user info from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoRes.ok) {
      logger.error("[auth] Failed to fetch user info");
      return NextResponse.redirect(`${baseUrl}/?error=userinfo_failed`);
    }

    const userInfo: GoogleUserInfo = await userInfoRes.json();
    logger.info("[auth] Google user authenticated:", userInfo.email);

    // Upsert user in database
    const user = upsertGoogleUser(
      userInfo.sub,
      userInfo.name,
      userInfo.email,
      userInfo.picture ?? null
    );
    logger.info("[auth] User upserted:", user.id);

    // Set session cookie directly on redirect response
    const redirectUrl = `${baseUrl}/dashboard`;
    const response = NextResponse.redirect(redirectUrl);
    const useSecure = process.env.COOKIE_SECURE === "true";
    response.cookies.set("ai_rescue_user_id", user.id, {
      httpOnly: true,
      secure: useSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    // Clean up oauth_state cookie
    response.cookies.delete("oauth_state");

    logger.info("[auth] Redirect to:", redirectUrl, "secure:", useSecure);
    logger.info("[auth] Set-Cookie headers:", response.headers.getSetCookie());

    return response;
  } catch (err) {
    logger.error("[auth] OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?error=server_error`);
  }
}
