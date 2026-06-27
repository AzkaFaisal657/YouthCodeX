import { useState, useRef } from "react";

type AccentTheme = {
  bg: string; card: string; border: string; label: string;
  badge: string; badgeText: string; input: string;
  inputFocus: string; button: string;
};

function getTheme(energy: number): AccentTheme {
  if (energy < 40) return {
    bg: "bg-[#FFFBF0]", card: "bg-amber-50/90", border: "border-amber-200/60",
    label: "text-amber-700", badge: "bg-amber-100", badgeText: "text-amber-800",
    input: "bg-[#FFFBF0] border-amber-200/60", inputFocus: "focus:ring-amber-300",
    button: "from-[#FBBF24] to-[#F97316]",
  };
  if (energy >= 65) return {
    bg: "bg-[#F0F5FF]", card: "bg-blue-50/90", border: "border-blue-200/60",
    label: "text-blue-700", badge: "bg-blue-100", badgeText: "text-blue-900",
    input: "bg-[#F0F5FF] border-blue-200/60", inputFocus: "focus:ring-blue-300",
    button: "from-[#60A5FA] to-[#818CF8]",
  };
  return {
    bg: "bg-[#FFF5FA]", card: "bg-white/90", border: "border-[#C9AEFF]/40",
    label: "text-[#7C5FA0]", badge: "bg-[#F3EEFF]", badgeText: "text-[#4A2D6F]",
    input: "bg-[#FFF5FA] border-[#C9AEFF]/40", inputFocus: "focus:ring-[#C9AEFF]",
    button: "from-[#C9AEFF] to-[#FFB5C8]",
  };
}

const SpeechRecognitionAPI: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

function speechErrorMessage(error: string): string {
  switch (error) {
    case "not-allowed":
      return "Microphone access denied. Allow mic permission for this site in browser settings.";
    case "service-not-allowed":
    case "insecure-context":
      return "Voice input requires HTTPS. Open https://your-ip:5173 instead of http://.";
    case "no-speech":
      return "No speech detected. Try again and speak clearly.";
    case "network":
      return "Speech recognition needs an internet connection.";
    case "aborted":
      return "";
    default:
      return "Could not start voice input. Try typing instead.";
  }
}

export default function CheckIn({
  onSubmit,
}: {
  onSubmit: (energy: number, avoiding: string) => void;
}) {
  const [energy, setEnergy] = useState(50);
  const [avoiding, setAvoiding] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [speechError, setSpeechError] = useState("");
  const recogRef = useRef<any>(null);
  const label = energy < 40 ? "Foggy & slow" : energy < 65 ? "Mid-energy" : "Scattered & wired";
  const t = getTheme(energy);

  function startListening() {
    setSpeechError("");

    if (!SpeechRecognitionAPI) {
      setSpeechError("Voice input is not supported in this browser.");
      return;
    }

    if (!window.isSecureContext) {
      const host = window.location.hostname;
      setSpeechError(`Voice input requires HTTPS. Use https://${host}:5173 instead of http://.`);
      return;
    }

    if (recogRef.current) recogRef.current.stop();

    const recog = new SpeechRecognitionAPI();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = "en-US";
    recogRef.current = recog;

    recog.onstart = () => {
      setListening(true);
      setInterim("");
      setSpeechError("");
    };
    recog.onresult = (e: any) => {
      let final = "";
      let interimText = "";
      for (const result of Array.from(e.results) as any[]) {
        if (result.isFinal) final += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (final) setAvoiding((prev) => (prev ? prev + " " + final : final).trim());
      setInterim(interimText);
    };
    recog.onend = () => {
      setListening(false);
      setInterim("");
    };
    recog.onerror = (e: any) => {
      setListening(false);
      setInterim("");
      const msg = speechErrorMessage(e.error);
      if (msg) setSpeechError(msg);
    };
    recog.start();
  }

  function stopListening() {
    if (recogRef.current) recogRef.current.stop();
    setListening(false);
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${t.bg} px-6 accent-transition`}>
      <div className={`max-w-md w-full ${t.card} rounded-3xl p-7 shadow-lg border ${t.border} accent-transition`}>
        <p className={`text-xs uppercase tracking-widest ${t.label} mb-6`}>Quick check-in</p>

        <div className="mb-7">
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs font-medium ${t.label} uppercase tracking-wide`}>Energy right now</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${t.badge} ${t.badgeText}`}>{label}</span>
          </div>
          <input
            type="range" min={0} max={100} value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full"
          />
          <div className={`flex justify-between mt-1 text-[11px] ${t.label}`}>
            <span>Foggy</span><span>Scattered</span>
          </div>
        </div>

        <div className="mb-7">
          <p className={`text-xs font-medium ${t.label} uppercase tracking-wide mb-2`}>
            What's the thing you're avoiding?
          </p>
          <div className="relative">
            <input
              value={avoiding}
              onChange={(e) => {
                setAvoiding(e.target.value);
                if (speechError) setSpeechError("");
              }}
              placeholder={listening ? "Listening…" : "Type or speak it…"}
              className={`w-full border ${t.input} rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 ${t.inputFocus} accent-transition`}
            />
            {SpeechRecognitionAPI && (
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                title={listening ? "Stop listening" : "Speak instead"}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  listening
                    ? "bg-red-400 text-white animate-pulse"
                    : `${t.badge} ${t.label} opacity-60 hover:opacity-100`
                }`}
              >
                {listening ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="5" y="5" width="10" height="10" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a3 3 0 00-3 3v5a3 3 0 006 0V5a3 3 0 00-3-3z" />
                    <path d="M7 15.93A6 6 0 0116 10h-1a5 5 0 01-10 0H4a6 6 0 003 5.93V18H5v1h10v-1h-2v-2.07z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          {(listening || interim) && (
            <p className={`text-xs ${t.label} opacity-60 mt-1.5 italic`}>
              {interim || "Say what you're avoiding…"}
            </p>
          )}
          {speechError && (
            <p className="text-xs text-red-600 mt-1.5">{speechError}</p>
          )}
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
