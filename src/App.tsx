import { useState } from "react";
import { getProfile, updateProfileNotes, addTask, addSessionRecord, getSessionRecords } from "./lib/storage";
import { getRecommendation, sendFeedback } from "./lib/api";
import type { Profile, Recommendation } from "./types";
import Onboarding from "./components/Onboarding";
import CheckIn from "./components/CheckIn";
import Session from "./components/Session";
import InsightCard from "./components/InsightCard";

type Stage = "onboarding" | "checkin" | "loading" | "session" | "thanks" | "insights";
type AccentMode = "scattered" | "foggy" | "mixed" | "deep-spiral";

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(getProfile());
  const [stage, setStage] = useState<Stage>(profile ? "checkin" : "onboarding");
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [accentMode, setAccentMode] = useState<AccentMode>("mixed");
  const [lastTask, setLastTask] = useState("");
  const [lastEnergy, setLastEnergy] = useState(50);
  const [loadError, setLoadError] = useState("");

  async function handleCheckIn(energy: number, avoiding: string) {
    if (!profile) return;
    const { isShameSpiral, spiralCount } = addTask(avoiding);
    setLastTask(avoiding);
    setLastEnergy(energy);

    let mode: AccentMode;
    if (spiralCount >= 3) {
      mode = "deep-spiral";
    } else {
      mode = energy < 40 ? "foggy" : energy >= 65 ? "scattered" : "mixed";
    }
    setAccentMode(mode);
    setLoadError("");
    setStage("loading");

    try {
      const recommendation = await getRecommendation(profile, energy, avoiding, isShameSpiral, spiralCount);
      setRec(recommendation);
      setStage("session");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load your session. Is the backend running?");
      setStage("checkin");
    }
  }

  async function handleFinish(didIt: boolean) {
    if (!profile || !rec) return;

    addSessionRecord({
      task: lastTask,
      soundType: rec.soundType,
      energy: lastEnergy,
      didIt,
      timestamp: Date.now(),
      hour: new Date().getHours(),
    });

    try {
      const { updatedNotes } = await sendFeedback(profile, rec, didIt);
      if (updatedNotes) updateProfileNotes(updatedNotes);
    } catch {
      /* session still counts even if feedback update fails */
    }

    const records = getSessionRecords();
    if (records.length >= 3 && records.length % 3 === 0) {
      setStage("insights");
    } else {
      setStage("thanks");
    }
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
    return (
      <>
        {loadError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl shadow">
            {loadError}
          </div>
        )}
        <CheckIn onSubmit={handleCheckIn} />
      </>
    );
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5FA]">
        <p className="text-[#7C5FA0]">Figuring out what you need...</p>
      </div>
    );
  }

  if (stage === "session" && rec) {
    return <Session rec={rec} accentMode={accentMode} onFinish={handleFinish} />;
  }

  if (stage === "insights") {
    return <InsightCard onContinue={() => setStage("checkin")} />;
  }

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
