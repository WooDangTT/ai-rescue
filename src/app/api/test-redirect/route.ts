export const dynamic = "force-dynamic";

export async function GET() {
  const headers = new Headers();
  headers.set("Location", "/");
  headers.append(
    "Set-Cookie",
    "test_redirect_cookie=it_works; Path=/; Max-Age=86400; SameSite=Lax"
  );
  return new Response(null, { status: 307, headers });
}
