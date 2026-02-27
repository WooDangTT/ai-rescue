export const dynamic = "force-dynamic";

import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();

  // Also read raw Cookie header
  const rawCookie = request.headers.get("cookie") ?? "(none)";

  return Response.json({
    cookiesApi: all.map((c) => ({ name: c.name, value: c.value.substring(0, 20) })),
    rawCookieHeader: rawCookie.substring(0, 200),
  });
}
