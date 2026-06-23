import { useState } from "react";
import { getProfile, updateProfileNotes } from "./lib/storage";
import { getRecommendation, sendFeedback } from "./lib/api";
import type { Profile, Recommendation } from "./types";
import Onboarding from "./components/Onboarding";
import CheckIn from "./components/CheckIn";
import Session from "./components/Session";

type Stage = "onboarding" | "checkin" | "loading" | "session" | "thanks";

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(getProfile());
  const [stage, setStage] = useState<Stage>(profile ? "checkin" : "onboarding");
  const [rec, setRec] = useState<Recommendation | null>(null);

  async function handleCheckIn(energy: number, avoiding: string) {
    if (!profile) return;
    setStage("loading");
    const recommendation = await getRecommendation(profile, energy, avoiding);
    setRec(recommendation);
    setStage("session");
  }

  async function handleFinish(didIt: boolean) {
    if (!profile || !rec) return;
    const { updatedNotes } = await sendFeedback(profile, rec, didIt);
    updateProfileNotes(updatedNotes);
    setStage("thanks");
  }

  if (stage === "onboarding") {
    return (
      <Onboarding
        onComplete={() => {
          setProfile(getProfile());
          setStage("checkin");
        }}
      />
    );
  }

  if (stage === "checkin") {
    return <CheckIn onSubmit={handleCheckIn} />;
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5FA]">
        <p className="text-[#7C5FA0]">Figuring out what you need...</p>
      </div>
    );
  }

  if (stage === "session" && rec) {
    return <Session rec={rec} onFinish={handleFinish} />;
  }

  if (stage === "thanks") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5FA] px-6 text-center gap-6">
        <p className="text-2xl text-[#4A2D6F]">Nice. One session at a time.</p>
        <button
          onClick={() => setStage("checkin")}
          className="px-6 py-3 rounded-full bg-gradient-to-br from-[#C9AEFF] to-[#FFB5C8] text-white font-medium"
        >
          Start another
        </button>
      </div>
    );
  }

  return null;
}