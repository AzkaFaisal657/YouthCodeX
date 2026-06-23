import { useState } from "react";
import { audioEngine } from "../lib/audio";
import Timer from "./Timer";
import type { Recommendation } from "../types";

const DURATIONS = [10, 15, 25];

export default function Session({
  rec,
  onFinish,
}: {
  rec: Recommendation;
  onFinish: (didIt: boolean) => void;
}) {
  const [duration, setDuration] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function start(mins: number) {
    setDuration(mins);
    setRunning(true);
    // must be inside a click handler — AudioContext needs a user gesture
    void audioEngine.start(rec.soundType);
  }

  function handleTimerComplete() {
    audioEngine.stop();
    setRunning(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5FA] px-6">
        <div className="max-w-md w-full text-center">
          <p className="text-2xl text-[#4A2D6F] mb-6">Did you do it?</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onFinish(true)}
              className="px-6 py-3 rounded-full bg-gradient-to-br from-[#B5F0D4] to-[#B5DCFF] text-[#4A2D6F] font-medium"
            >
              Yes
            </button>
            <button
              onClick={() => onFinish(false)}
              className="px-6 py-3 rounded-full bg-white border border-[#C9AEFF]/40 text-[#7C5FA0] font-medium"
            >
              Not quite
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (running && duration) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5FA] px-6 text-center">
        <Timer seconds={duration * 60} onComplete={handleTimerComplete} />
        <p className="mt-8 text-lg text-[#4A2D6F] max-w-sm">{rec.microAction}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF5FA] px-6">
      <div className="max-w-md w-full bg-white/90 rounded-3xl p-7 shadow-lg border border-[#F3EEFF]">
        <p className="text-xs uppercase tracking-widest text-[#7C5FA0] mb-3">Your session</p>
        <p className="text-sm text-[#7C5FA0] mb-1">{rec.soundReason}</p>
        <p className="text-lg text-[#4A2D6F] font-medium mb-2">{rec.microAction}</p>
        <p className="text-sm text-[#7C5FA0] mb-6">{rec.framing}</p>

        <p className="text-xs font-medium text-[#7C5FA0] uppercase tracking-wide mb-2">Pick a duration</p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => start(d)}
              className="flex-1 px-4 py-3 rounded-xl border border-[#C9AEFF]/40 text-[#4A2D6F] font-medium hover:bg-[#F3EEFF]"
            >
              {d} min
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}