export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html><html><body><h1>Cookie Test</h1><p>Cookie set! <a href="/">Go Home</a></p></body></html>`;
  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
  response.cookies.set("test_cookie", "hello_world", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  response.cookies.set("test_visible", "can_see_me", {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
