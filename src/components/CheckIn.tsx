import { useState } from "react";

type AccentTheme = {
  bg: string;
  card: string;
  border: string;
  label: string;
  badge: string;
  badgeText: string;
  input: string;
  inputFocus: string;
  button: string;
  trackLeft: string;
  trackRight: string;
  heading: string;
};

function getTheme(energy: number): AccentTheme {
  if (energy < 40) {
    return {
      bg: "bg-[#FFFBF0]",
      card: "bg-amber-50/90",
      border: "border-amber-200/60",
      label: "text-amber-700",
      badge: "bg-amber-100",
      badgeText: "text-amber-800",
      input: "bg-[#FFFBF0] border-amber-200/60",
      inputFocus: "focus:ring-amber-300",
      button: "from-[#FBBF24] to-[#F97316]",
      trackLeft: "Foggy",
      trackRight: "Scattered",
      heading: "text-amber-900",
    };
  }
  if (energy >= 65) {
    return {
      bg: "bg-[#F0F5FF]",
      card: "bg-blue-50/90",
      border: "border-blue-200/60",
      label: "text-blue-700",
      badge: "bg-blue-100",
      badgeText: "text-blue-900",
      input: "bg-[#F0F5FF] border-blue-200/60",
      inputFocus: "focus:ring-blue-300",
      button: "from-[#60A5FA] to-[#818CF8]",
      trackLeft: "Foggy",
      trackRight: "Scattered",
      heading: "text-blue-900",
    };
  }
  return {
    bg: "bg-[#FFF5FA]",
    card: "bg-white/90",
    border: "border-[#C9AEFF]/40",
    label: "text-[#7C5FA0]",
    badge: "bg-[#F3EEFF]",
    badgeText: "text-[#4A2D6F]",
    input: "bg-[#FFF5FA] border-[#C9AEFF]/40",
    inputFocus: "focus:ring-[#C9AEFF]",
    button: "from-[#C9AEFF] to-[#FFB5C8]",
    trackLeft: "Foggy",
    trackRight: "Scattered",
    heading: "text-[#4A2D6F]",
  };
}

export default function CheckIn({
  onSubmit,
}: {
  onSubmit: (energy: number, avoiding: string) => void;
}) {
  const [energy, setEnergy] = useState(50);
  const [avoiding, setAvoiding] = useState("");

  const label =
    energy < 40 ? "Foggy & slow" : energy < 65 ? "Mid-energy" : "Scattered & wired";
  const t = getTheme(energy);

  return (
    <div className={`min-h-screen flex items-center justify-center ${t.bg} px-6 accent-transition`}>
      <div className={`max-w-md w-full ${t.card} rounded-3xl p-7 shadow-lg border ${t.border} accent-transition`}>
        <p className={`text-xs uppercase tracking-widest ${t.label} mb-6 accent-transition`}>
          Quick check-in
        </p>

        <div className="mb-7">
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs font-medium ${t.label} uppercase tracking-wide accent-transition`}>
              Energy right now
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${t.badge} ${t.badgeText} accent-transition`}>
              {label}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full"
          />
          <div className={`flex justify-between mt-1 text-[11px] ${t.label} accent-transition`}>
            <span>{t.trackLeft}</span>
            <span>{t.trackRight}</span>
          </div>
        </div>

        <div className="mb-7">
          <p className={`text-xs font-medium ${t.label} uppercase tracking-wide mb-2 accent-transition`}>
            What's the thing you're avoiding?
          </p>
          <input
            value={avoiding}
            onChange={(e) => setAvoiding(e.target.value)}
            placeholder="Write the intro to my essay..."
            className={`w-full border ${t.input} rounded-xl p-3 focus:outline-none focus:ring-2 ${t.inputFocus} accent-transition`}
          />
        </div>

        <button
          onClick={() => avoiding.trim() && onSubmit(energy, avoiding)}
          disabled={!avoiding.trim()}
          className={`w-full px-5 py-3 rounded-full bg-gradient-to-br ${t.button} text-white font-medium disabled:opacity-40 accent-transition`}
        >
          Start Session
        </button>
      </div>
    </div>
  );
}