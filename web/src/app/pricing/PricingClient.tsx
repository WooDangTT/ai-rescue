"use client";

import { useRouter } from "next/navigation";

interface PricingClientProps {
  currentPlan: string;
}

export default function PricingClient({ currentPlan }: PricingClientProps) {
  const router = useRouter();

  async function switchPlan(plan: string) {
    try {
      const resp = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await resp.json();
      if (data.plan) {
        router.refresh();
      }
    } catch (err) {
      alert("Failed: " + (err as Error).message);
    }
  }

  return { switchPlan, currentPlan };
}

export function FreePlanButton({ currentPlan }: { currentPlan: string }) {
  const router = useRouter();

  async function handleClick() {
    const resp = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "free" }),
    });
    const data = await resp.json();
    if (data.plan) router.refresh();
  }

  if (currentPlan === "free") {
    return (
      <button className="btn btn-ghost" style={{ width: "100%" }} disabled>
        Current Plan
      </button>
    );
  }
  return (
    <button
      className="btn btn-ghost"
      style={{ width: "100%" }}
      onClick={handleClick}
    >
      Switch to Free
    </button>
  );
}

export function ProPlanButton({ currentPlan }: { currentPlan: string }) {
  const router = useRouter();

  async function handleClick() {
    const resp = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "pro" }),
    });
    const data = await resp.json();
    if (data.plan) router.refresh();
  }

  if (currentPlan === "pro") {
    return (
      <button
        className="btn btn-upgrade"
        style={{ width: "100%", opacity: 0.7 }}
        disabled
      >
        Current Plan
      </button>
    );
  }
  return (
    <button
      className="btn btn-upgrade"
      style={{ width: "100%" }}
      onClick={handleClick}
    >
      Upgrade to Pro
    </button>
  );
}
