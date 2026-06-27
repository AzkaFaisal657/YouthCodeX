import { useEffect, useState, useRef, useCallback } from "react";

export default function Timer({
  seconds,
  onComplete,
}: {
  seconds: number;
  onComplete: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (remaining <= 0) {
      finish();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, finish]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="text-4xl font-medium text-[#4A2D6F] tabular-nums">
      {mins}:{secs.toString().padStart(2, "0")}
    </div>
  );
}