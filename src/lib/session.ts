import { cookies } from "next/headers";

const COOKIE_NAME = "ai_rescue_user_id";

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function setSessionUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
