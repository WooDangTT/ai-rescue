export const dynamic = "force-dynamic";

import { upsertGoogleUser } from "@/lib/db";
import { logger } from "@/utils/logger";

// Parse a specific cookie from the raw Cookie header.
// Avoids Next.js cookies() API which can interfere with
// manual Set-Cookie headers on the response.
function parseCookie(request: Request, name: string): string | undefined {
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

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
    return Response.redirect(`${baseUrl}/?error=oauth_denied`, 302);
  }

  if (!code || !state) {
    logger.warn("[auth] Missing code or state in callback");
    return Response.redirect(`${baseUrl}/?error=invalid_callback`, 302);
  }

  // Verify CSRF state by reading raw Cookie header directly.
  // Avoids cookies() API which interferes with Set-Cookie on the response.
  const savedState = parseCookie(request, "oauth_state");

  if (!savedState || savedState !== state) {
    logger.warn("[auth] CSRF state mismatch, saved:", savedState?.substring(0, 8), "got:", state.substring(0, 8));
    return Response.redirect(`${baseUrl}/?error=invalid_state`, 302);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.error("[auth] Google OAuth credentials not configured");
    return Response.redirect(`${baseUrl}/?error=server_error`, 302);
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
      return Response.redirect(`${baseUrl}/?error=token_failed`, 302);
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
      return Response.redirect(`${baseUrl}/?error=userinfo_failed`, 302);
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

    // Return 200 HTML with Set-Cookie headers + JS redirect.
    // Browsers ignore Set-Cookie on 307 responses that arrive via
    // cross-origin redirect chains (Google OAuth → our callback).
    // A 200 response guarantees the browser processes Set-Cookie.
    const useSecure = process.env.COOKIE_SECURE === "true";
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    const securePart = useSecure ? "; Secure" : "";
    const sessionCookie = `ai_rescue_user_id=${user.id}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${securePart}`;
    const deleteOauth = `oauth_state=; Path=/; Max-Age=0`;

    const dashboardUrl = `${baseUrl}/dashboard`;
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${dashboardUrl}"></head><body><script>window.location.replace("${dashboardUrl}")</script></body></html>`;

    const headers = new Headers();
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.append("Set-Cookie", sessionCookie);
    headers.append("Set-Cookie", deleteOauth);

    logger.info("[auth] 200 HTML redirect to dashboard, cookie:", sessionCookie);

    return new Response(html, { status: 200, headers });
  } catch (err) {
    logger.error("[auth] OAuth callback error:", err);
    return Response.redirect(`${baseUrl}/?error=server_error`, 302);
  }
}
