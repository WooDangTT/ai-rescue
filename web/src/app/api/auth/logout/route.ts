import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function GET() {
  console.log("[auth] User logged out");
  await clearSession();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5050"));
}
