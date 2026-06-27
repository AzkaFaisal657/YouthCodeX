import { useEffect, useRef } from "react";
import { startVisualizer } from "../lib/visualizer";

type SoundType = "brown" | "pink" | "binaural";

export default function SoundVisualizer({
  analyser,
  soundType,
}: {
  analyser: AnalyserNode;
  soundType: SoundType;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stop = startVisualizer(canvas, analyser, soundType);
    return stop;
  }, [analyser, soundType]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
