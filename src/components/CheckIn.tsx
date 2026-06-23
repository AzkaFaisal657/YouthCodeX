import { useState } from "react";

export default function CheckIn({
  onSubmit,
}: {
  onSubmit: (energy: number, avoiding: string) => void;
}) {
  const [energy, setEnergy] = useState(50);
  const [avoiding, setAvoiding] = useState("");

  const label = energy < 40 ? "Foggy & slow" : energy < 65 ? "Mid-energy" : "Scattered & wired";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF5FA] px-6">
      <div className="max-w-md w-full bg-white/90 rounded-3xl p-7 shadow-lg border border-[#F3EEFF]">
        <p className="text-xs uppercase tracking-widest text-[#7C5FA0] mb-6">Quick check-in</p>

        <div className="mb-7">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#7C5FA0] uppercase tracking-wide">Energy right now</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F3EEFF] text-[#4A2D6F]">{label}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-1 text-[11px] text-[#7C5FA0]">
            <span>Foggy</span>
            <span>Scattered</span>
          </div>
        </div>

        <div className="mb-7">
          <p className="text-xs font-medium text-[#7C5FA0] uppercase tracking-wide mb-2">
            What's the thing you're avoiding?
          </p>
          <input
            value={avoiding}
            onChange={(e) => setAvoiding(e.target.value)}
            placeholder="Write the intro to my essay..."
            className="w-full border border-[#C9AEFF]/40 rounded-xl p-3 bg-[#FFF5FA] focus:outline-none focus:ring-2 focus:ring-[#C9AEFF]"
          />
        </div>

        <button
          onClick={() => avoiding.trim() && onSubmit(energy, avoiding)}
          disabled={!avoiding.trim()}
          className="w-full px-5 py-3 rounded-full bg-gradient-to-br from-[#C9AEFF] to-[#FFB5C8] text-white font-medium disabled:opacity-40"
        >
          Start Session
        </button>
      </div>
    </div>
  );
}