import type { OnboardingTurn, Profile, Recommendation } from "../types";
import type { SessionRecord } from "./storage";

const BASE = "/api";
const SOUND_TYPES = ["brown", "pink", "binaural"] as const;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `Request failed (${res.status})`
    );
  }
  return data as T;
}

function normalizeRecommendation(data: unknown, energy: number): Recommendation {
  const r = (data ?? {}) as Partial<Recommendation>;
  let soundType = r.soundType;
  if (!soundType || !SOUND_TYPES.includes(soundType)) {
    soundType = energy < 40 ? "pink" : energy >= 65 ? "brown" : "binaural";
  }
  return {
    soundType,
    soundReason: r.soundReason?.trim() || "A focus sound matched to how you feel right now.",
    microAction: r.microAction?.trim() || "Take one breath, then open your task.",
    framing: r.framing?.trim() || "Start tiny. One step is enough.",
  };
}

export async function onboardingTurn(history: OnboardingTurn[]) {
  return postJson<
    { done: false; question: string } | { done: true; profile: Profile }
  >("/onboarding/turn", { history });
}

export async function getRecommendation(
  profile: Profile,
  energy: number,
  avoiding: string,
  shameSpiral = false,
  spiralCount = 0
) {
  const data = await postJson<Partial<Recommendation>>("/session/recommend", {
    profile,
    energy,
    avoiding,
    shameSpiral,
    spiralCount,
  });
  return normalizeRecommendation(data, energy);
}

export async function sendFeedback(
  profile: Profile,
  lastRecommendation: Recommendation,
  didIt: boolean
) {
  return postJson<{ updatedNotes: string }>("/session/feedback", {
    profile,
    lastRecommendation,
    didIt,
  });
}

export async function getInsights(sessions: SessionRecord[]): Promise<{
  insights: string[];
  headline: string;
  strength: string;
}> {
  return postJson("/insights", { sessions });
}

export function speakRecommendation(rec: Recommendation) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const text = `${rec.microAction} ${rec.framing}`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.82;
  utterance.pitch = 0.88;
  utterance.volume = 0.9;
  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes("Samantha") ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Karen") ||
        v.name.includes("Moira") ||
        (v.lang === "en-US" && v.localService)
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  };
  if (window.speechSynthesis.getVoices().length > 0) {
    setVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = setVoice;
  }
}
