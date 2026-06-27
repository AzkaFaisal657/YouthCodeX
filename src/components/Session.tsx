import { useState, useMemo } from "react";
import { audioEngine } from "../lib/audio";
import Timer from "./Timer";
import type { Recommendation } from "../types";

const DURATIONS = [10, 15, 25];

type AccentMode = "scattered" | "foggy" | "mixed";

type OrbTheme = {
  bg: string;
  card: string;
  border: string;
  label: string;
  subtext: string;
  button: string;
  durationBtn: string;
  durationHover: string;
  orbGlow: string;
  orbGlowOuter: string;
  orbGradient: string;
};

function getOrbTheme(mode: AccentMode, soundType: Recommendation["soundType"]): OrbTheme {
  const effective = soundType === "brown" ? "scattered" : soundType === "pink" ? "foggy" : mode;
  if (effective === "foggy") {
    return {
      bg: "bg-[#FFFBF0]",
      card: "bg-amber-50/90",
      border: "border-amber-200/50",
      label: "text-amber-700",
      subtext: "text-amber-600",
      button: "from-[#FBBF24] to-[#F97316]",
      durationBtn: "border-amber-200/50 text-amber-900",
      durationHover: "hover:bg-amber-100",
      orbGlow: "rgba(251, 191, 36, 0.45)",
      orbGlowOuter: "rgba(251, 191, 36, 0.18)",
      orbGradient: "radial-gradient(circle at 40% 35%, #FEF9C3, #FBBF24 55%, #F97316)",
    };
  }
  if (effective === "scattered") {
    return {
      bg: "bg-[#F0F5FF]",
      card: "bg-blue-50/90",
      border: "border-blue-200/50",
      label: "text-blue-700",
      subtext: "text-blue-600",
      button: "from-[#60A5FA] to-[#818CF8]",
      durationBtn: "border-blue-200/50 text-blue-900",
      durationHover: "hover:bg-blue-100",
      orbGlow: "rgba(96, 165, 250, 0.45)",
      orbGlowOuter: "rgba(96, 165, 250, 0.18)",
      orbGradient: "radial-gradient(circle at 40% 35%, #EFF6FF, #60A5FA 55%, #818CF8)",
    };
  }
  return {
    bg: "bg-[#FFF5FA]",
    card: "bg-white/90",
    border: "border-[#C9AEFF]/40",
    label: "text-[#7C5FA0]",
    subtext: "text-[#7C5FA0]",
    button: "from-[#C9AEFF] to-[#FFB5C8]",
    durationBtn: "border-[#C9AEFF]/40 text-[#4A2D6F]",
    durationHover: "hover:bg-[#F3EEFF]",
    orbGlow: "rgba(180, 140, 255, 0.45)",
    orbGlowOuter: "rgba(180, 140, 255, 0.18)",
    orbGradient: "radial-gradient(circle at 40% 35%, #f3eeff, #C9AEFF 55%, #a78bfa)",
  };
}

function BreathingOrb({ theme }: { theme: OrbTheme }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div
        className="breathing-orb rounded-full"
        style={{
          width: 120,
          height: 120,
          background: theme.orbGradient,
          ["--orb-glow" as string]: theme.orbGlow,
          ["--orb-glow-outer" as string]: theme.orbGlowOuter,
        }}
      />
      <p className={`text-xs ${theme.subtext} tracking-widest uppercase`}>breathe with it</p>
    </div>
  );
}

const FOCUS_LINES = [
  (n: number) => `${n} people are focusing right now`,
  (n: number) => `${n} others started a session in the last hour`,
  (n: number) => `you're not alone — ${n} people are in a session right now`,
  (n: number) => `${n} people opened this app instead of spiraling. same.`,
  (n: number) => `${n} people chose to try anyway today`,
  (n: number) => `${n} sessions running right now, including yours`,
  (n: number) => `somewhere, ${n} people are also staring at a blank page`,
];

function BodyDoublingBadge({ theme }: { theme: OrbTheme }) {
  const line = useMemo(() => {
    const n = Math.floor(Math.random() * 17) + 7;
    const template = FOCUS_LINES[Math.floor(Math.random() * FOCUS_LINES.length)];
    return template(n);
  }, []);

  return (
    <div className="fixed bottom-5 left-0 right-0 flex justify-center pointer-events-none">
      <span className={`text-xs ${theme.subtext} opacity-60 tracking-wide`}>
        {line}
      </span>
    </div>
  );
}

export default function Session({
  rec,
  accentMode,
  onFinish,
}: {
  rec: Recommendation;
  accentMode: AccentMode;
  onFinish: (didIt: boolean) => void;
}) {
  const [duration, setDuration] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const theme = getOrbTheme(accentMode, rec.soundType);

  function start(mins: number) {
    setDuration(mins);
    setRunning(true);
    void audioEngine.start(rec.soundType);
  }

  function handleTimerComplete() {
    audioEngine.stop();
    setRunning(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg} px-6 accent-transition`}>
        <div className="max-w-md w-full text-center">
          <p className={`text-2xl ${theme.label} mb-6`}>Did you do it?</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onFinish(true)}
              className="px-6 py-3 rounded-full bg-gradient-to-br from-[#B5F0D4] to-[#B5DCFF] text-[#4A2D6F] font-medium"
            >
              Yes
            </button>
            <button
              onClick={() => onFinish(false)}
              className={`px-6 py-3 rounded-full bg-white border ${theme.border} ${theme.subtext} font-medium`}
            >
              Not quite
            </button>
          </div>
        </div>
        <BodyDoublingBadge theme={theme} />
      </div>
    );
  }

  if (running && duration) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme.bg} px-6 text-center accent-transition`}>
        <BreathingOrb theme={theme} />
        <Timer seconds={duration * 60} onComplete={handleTimerComplete} />
        <p className={`mt-8 text-lg ${theme.label} max-w-sm`}>{rec.microAction}</p>
        <BodyDoublingBadge theme={theme} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.bg} px-6 accent-transition`}>
      <div className={`max-w-md w-full ${theme.card} rounded-3xl p-7 shadow-lg border ${theme.border}`}>
        <p className={`text-xs uppercase tracking-widest ${theme.label} mb-4`}>Your session</p>

        <BreathingOrb theme={theme} />

        <p className={`text-sm ${theme.subtext} mb-1`}>{rec.soundReason}</p>
        <p className={`text-lg ${theme.label} font-medium mb-2`}>{rec.microAction}</p>
        <p className={`text-sm ${theme.subtext} mb-6`}>{rec.framing}</p>

        <p className={`text-xs font-medium ${theme.label} uppercase tracking-wide mb-2`}>
          Pick a duration
        </p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => start(d)}
              className={`flex-1 px-4 py-3 rounded-xl border ${theme.durationBtn} font-medium ${theme.durationHover}`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>
      <BodyDoublingBadge theme={theme} />
    </div>
  );
}