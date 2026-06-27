import { useState, useEffect } from "react";
import { getSessionRecords } from "../lib/storage";
import { getInsights } from "../lib/api";

export default function InsightCard({ onContinue }: { onContinue: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    insights: string[];
    headline: string;
    strength: string;
  } | null>(null);

  useEffect(() => {
    const records = getSessionRecords();
    getInsights(records)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0812] px-6">
        <p className="text-purple-300 text-sm animate-pulse">Reading your pattern...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5FA] px-6 gap-6 text-center">
        <p className="text-2xl text-[#4A2D6F]">Nice. One session at a time.</p>
        <button onClick={onContinue} className="px-6 py-3 rounded-full bg-gradient-to-br from-[#C9AEFF] to-[#FFB5C8] text-white font-medium">
          Start another
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a060f] px-6 py-10">
      <div className="max-w-lg w-full">
        <p className="text-xs uppercase tracking-widest text-purple-400 mb-3 text-center">
          Your Focus Pattern
        </p>
        <h2 className="text-2xl font-semibold text-white text-center mb-8 leading-snug">
          {data.headline}
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          {data.insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
            >
              <span className="text-purple-400 mt-0.5 text-sm shrink-0">◆</span>
              <p className="text-purple-100 text-sm leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/40 border border-purple-500/30 rounded-2xl px-5 py-4 mb-8">
          <p className="text-xs uppercase tracking-widest text-pink-300 mb-1">What's working</p>
          <p className="text-white text-sm leading-relaxed">{data.strength}</p>
        </div>

        <button
          onClick={onContinue}
          className="w-full px-5 py-3 rounded-full bg-gradient-to-br from-[#C9AEFF] to-[#FFB5C8] text-white font-medium"
        >
          Start another session
        </button>
      </div>
    </div>
  );
}
