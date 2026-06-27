import { useState, useEffect, useRef, useCallback } from "react";
import { audioEngine } from "../lib/audio";
import { speakRecommendation } from "../lib/api";
import Timer from "./Timer";
import SoundVisualizer from "./SoundVisualizer";
import type { Recommendation } from "../types";

const DURATIONS = [10, 15, 25];

type AccentMode = "scattered" | "foggy" | "mixed" | "deep-spiral";

type OrbTheme = {
  bg: string; card: string; border: string; label: string; subtext: string;
  button: string; durationBtn: string; durationHover: string;
  orbGlow: string; orbGlowOuter: string; orbGradient: string;
  breatheDuration: string;
};

function getOrbTheme(mode: AccentMode, soundType: Recommendation["soundType"]): OrbTheme {
  if (mode === "deep-spiral") return {
    bg: "bg-[#FFF5F5]", card: "bg-red-50/90", border: "border-red-200/50",
    label: "text-red-700", subtext: "text-red-500",
    button: "from-[#F87171] to-[#FB923C]",
    durationBtn: "border-red-200/50 text-red-800", durationHover: "hover:bg-red-50",
    orbGlow: "rgba(248, 113, 113, 0.45)", orbGlowOuter: "rgba(251, 146, 60, 0.18)",
    orbGradient: "radial-gradient(circle at 40% 35%, #FEE2E2, #F87171 55%, #FB923C)",
    breatheDuration: "6.5s",
  };

  const effective = soundType === "brown" ? "scattered" : soundType === "pink" ? "foggy" : mode;

  if (effective === "foggy") return {
    bg: "bg-[#FFFBF0]", card: "bg-amber-50/90", border: "border-amber-200/50",
    label: "text-amber-700", subtext: "text-amber-600",
    button: "from-[#FBBF24] to-[#F97316]",
    durationBtn: "border-amber-200/50 text-amber-900", durationHover: "hover:bg-amber-100",
    orbGlow: "rgba(251, 191, 36, 0.45)", orbGlowOuter: "rgba(251, 191, 36, 0.18)",
    orbGradient: "radial-gradient(circle at 40% 35%, #FEF9C3, #FBBF24 55%, #F97316)",
    breatheDuration: "4.5s",
  };
  if (effective === "scattered") return {
    bg: "bg-[#F0F5FF]", card: "bg-blue-50/90", border: "border-blue-200/50",
    label: "text-blue-700", subtext: "text-blue-600",
    button: "from-[#60A5FA] to-[#818CF8]",
    durationBtn: "border-blue-200/50 text-blue-900", durationHover: "hover:bg-blue-100",
    orbGlow: "rgba(96, 165, 250, 0.45)", orbGlowOuter: "rgba(96, 165, 250, 0.18)",
    orbGradient: "radial-gradient(circle at 40% 35%, #EFF6FF, #60A5FA 55%, #818CF8)",
    breatheDuration: "4.5s",
  };
  return {
    bg: "bg-[#FFF5FA]", card: "bg-white/90", border: "border-[#C9AEFF]/40",
    label: "text-[#7C5FA0]", subtext: "text-[#7C5FA0]",
    button: "from-[#C9AEFF] to-[#FFB5C8]",
    durationBtn: "border-[#C9AEFF]/40 text-[#4A2D6F]", durationHover: "hover:bg-[#F3EEFF]",
    orbGlow: "rgba(180, 140, 255, 0.45)", orbGlowOuter: "rgba(180, 140, 255, 0.18)",
    orbGradient: "radial-gradient(circle at 40% 35%, #f3eeff, #C9AEFF 55%, #a78bfa)",
    breatheDuration: "4.5s",
  };
}

function BreathingOrb({
  theme,
  orbRef,
}: {
  theme: OrbTheme;
  orbRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div
        ref={orbRef}
        className="breathing-orb rounded-full"
        style={{
          width: 120, height: 120,
          background: theme.orbGradient,
          animationDuration: theme.breatheDuration,
          ["--orb-glow" as string]: theme.orbGlow,
          ["--orb-glow-outer" as string]: theme.orbGlowOuter,
        }}
      />
      <p className={`text-xs ${theme.subtext} tracking-widest uppercase`}>breathe with it</p>
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
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [orbCenter, setOrbCenter] = useState<{ x: number; y: number } | null>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  const theme = getOrbTheme(accentMode, rec.soundType);

  useEffect(() => {
    const timer = setTimeout(() => speakRecommendation(rec), 600);
    return () => clearTimeout(timer);
  }, []);

  const measureOrb = useCallback(() => {
    if (!orbRef.current) return;
    const rect = orbRef.current.getBoundingClientRect();
    setOrbCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = requestAnimationFrame(measureOrb);
    window.addEventListener("resize", measureOrb);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measureOrb);
    };
  }, [running, measureOrb]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const a = audioEngine.getAnalyser();
      if (a) { setAnalyser(a); clearInterval(id); }
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  function start(mins: number) {
    window.speechSynthesis?.cancel();
    setDuration(mins);
    setRunning(true);
    void audioEngine.start(rec.soundType);
  }

  function handleTimerComplete() {
    audioEngine.stop();
    setRunning(false);
    setAnalyser(null);
    setOrbCenter(null);
    setDone(true);
  }

  if (done) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg} px-6 accent-transition`}>
        <div className="max-w-md w-full text-center" style={{ position: "relative", zIndex: 1 }}>
          <p className={`text-2xl ${theme.label} mb-6`}>Did you do it?</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => onFinish(true)}
              className="px-6 py-3 rounded-full bg-gradient-to-br from-[#B5F0D4] to-[#B5DCFF] text-[#4A2D6F]">
              Yes
            </button>
            <button onClick={() => onFinish(false)}
              className={`px-6 py-3 rounded-full bg-white border ${theme.border} ${theme.subtext}`}>
              Not quite
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (running && duration) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${theme.bg} px-6 text-center accent-transition`}
        style={{ position: "relative" }}
      >
        {analyser && (
          <SoundVisualizer
            analyser={analyser}
            soundType={rec.soundType}
            orbCenter={orbCenter}
          />
        )}
        <div style={{ position: "relative", zIndex: 1 }}>
          <BreathingOrb theme={theme} orbRef={orbRef} />
          <Timer seconds={duration * 60} onComplete={handleTimerComplete} />
          <p className={`mt-8 text-base ${theme.subtext} max-w-sm`}>{rec.microAction}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.bg} px-6 accent-transition`}>
      <div
        className={`max-w-md w-full ${theme.card} rounded-3xl p-7 shadow-sm border ${theme.border}`}
        style={{ position: "relative", zIndex: 1 }}
      >
        <p className={`text-xs uppercase tracking-widest ${theme.label} mb-4`}>Your session</p>
        <BreathingOrb theme={theme} />
        <p className={`text-sm ${theme.subtext} mb-1`}>{rec.soundReason}</p>
        <p className={`text-base ${theme.label} mb-2`}>{rec.microAction}</p>
        <p className={`text-sm ${theme.subtext} mb-6`}>{rec.framing}</p>
        <p className={`text-xs ${theme.label} uppercase tracking-wide mb-2`}>Pick a duration</p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => start(d)}
              className={`flex-1 px-4 py-3 rounded-xl border ${theme.durationBtn} ${theme.durationHover} transition-colors`}>
              {d} min
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}