import { NextRequest, NextResponse } from "next/server";
import { getUser, updateUserPlan } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const user = getUser(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const body = await request.json();
  const plan = body.plan as string;

  if (plan !== "free" && plan !== "pro") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const updated = updateUserPlan(user.id, plan);
  console.log(`[plan] User plan updated: user_id=${user.id}, plan=${plan}`);

  return NextResponse.json({
    plan: updated?.plan,
    message: plan === "pro" ? "Upgraded to Pro!" : "Downgraded to Free",
  });
}
