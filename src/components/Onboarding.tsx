import { useState } from "react";
import { onboardingTurn } from "../lib/api";
import { saveProfile } from "../lib/storage";
import type { OnboardingTurn } from "../types";

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [history, setHistory] = useState<OnboardingTurn[]>([]);
  const [question, setQuestion] = useState(
    "When you get stuck, does your brain feel racing and scattered, or heavy and empty?"
  );
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!answer.trim()) return;
    setLoading(true);
    const newHistory = [...history, { question, answer }];
    const result = await onboardingTurn(newHistory);
    setHistory(newHistory);
    setAnswer("");
    if (result.done) {
      saveProfile({ ...result.profile, createdAt: new Date().toISOString() });
      onComplete();
    } else {
      setQuestion(result.question);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF5FA] px-6">
      <div className="max-w-md w-full">
        <p className="text-xs uppercase tracking-widest text-[#7C5FA0] mb-3">Getting to know you</p>
        <p className="text-lg text-[#4A2D6F] mb-5">{question}</p>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="w-full border border-[#C9AEFF]/40 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9AEFF]"
          rows={3}
          placeholder="Type your answer..."
          autoFocus
        />
        <button
          onClick={submit}
          disabled={loading || !answer.trim()}
          className="mt-4 px-5 py-2.5 rounded-full bg-gradient-to-br from-[#C9AEFF] to-[#FFB5C8] text-white font-medium disabled:opacity-40"
        >
          {loading ? "..." : "Continue"}
        </button>
      </div>
    </div>
  );
}