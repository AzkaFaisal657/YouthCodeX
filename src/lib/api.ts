import type { OnboardingTurn, Profile, Recommendation } from "../types";

const BASE = "/api";

export async function onboardingTurn(history: OnboardingTurn[]) {
  const res = await fetch(`${BASE}/onboarding/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history }),
  });
  return res.json() as Promise<
    { done: false; question: string } | { done: true; profile: Profile }
  >;
}

export async function getRecommendation(
  profile: Profile,
  energy: number,
  avoiding: string,
  shameSpiral = false
) {
  const res = await fetch(`${BASE}/session/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, energy, avoiding, shameSpiral }),
  });
  return res.json() as Promise<Recommendation>;
}

export async function sendFeedback(
  profile: Profile,
  lastRecommendation: Recommendation,
  didIt: boolean
) {
  const res = await fetch(`${BASE}/session/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, lastRecommendation, didIt }),
  });
  return res.json() as Promise<{ updatedNotes: string }>;
}