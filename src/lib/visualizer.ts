type SoundType = "brown" | "pink" | "binaural";

export function startVisualizer(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode,
  soundType: SoundType
): () => void {
  const ctx = canvas.getContext("2d")!;
  let rafId = 0;

  const resize = () => {
    const dpr = devicePixelRatio;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const bufferLength = analyser.frequencyBinCount;
  const freqData = new Uint8Array(bufferLength);
  const timeData = new Float32Array(analyser.fftSize);

  let scrollOffset = 0;

  // --- Brown: slow rolling warm waves ---
  function drawBrown(W: number, H: number) {
    analyser.getFloatTimeDomainData(timeData);
    scrollOffset += 0.4;

    ctx.fillStyle = "rgba(12, 5, 2, 0.07)";
    ctx.fillRect(0, 0, W, H);

    const waveLayers = [
      { color: "rgba(200, 90, 20, 0.18)", yFrac: 0.25, amp: 0.12, freq: 3.2, speed: 1.0 },
      { color: "rgba(240, 130, 40, 0.12)", yFrac: 0.42, amp: 0.09, freq: 2.1, speed: 0.7 },
      { color: "rgba(255, 170, 60, 0.10)", yFrac: 0.58, amp: 0.14, freq: 4.1, speed: 1.3 },
      { color: "rgba(180, 60, 10, 0.13)", yFrac: 0.72, amp: 0.08, freq: 1.8, speed: 0.5 },
    ];

    for (const layer of waveLayers) {
      ctx.beginPath();
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = 1.5;

      for (let x = 0; x <= W; x++) {
        const t = (x / W) * Math.PI * layer.freq + scrollOffset * 0.005 * layer.speed;
        const sampleIdx = Math.floor((x / W) * timeData.length);
        const audioWiggle = (timeData[sampleIdx] || 0) * H * 0.06;
        const y = H * layer.yFrac + Math.sin(t) * H * layer.amp + audioWiggle;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // --- Binaural: two interference rings pulsing at beat frequency ---
  function drawBinaural(W: number, H: number) {
    analyser.getByteFrequencyData(freqData);
    ctx.fillStyle = "rgba(6, 3, 16, 0.07)";
    ctx.fillRect(0, 0, W, H);

    const now = Date.now() * 0.001;
    const beatPhase = now * Math.PI * 2 * 0.6; // ~0.6Hz visual beat (calmer than 10Hz)

    const avgEnergy = freqData.slice(0, 20).reduce((a, b) => a + b, 0) / (20 * 255);

    const cx1 = W * 0.38;
    const cx2 = W * 0.62;
    const cy = H * 0.5;

    for (let ring = 0; ring < 5; ring++) {
      const phase = beatPhase + ring * 0.4;
      const r1 = (60 + ring * 45 + Math.sin(phase) * (20 + avgEnergy * 40)) * Math.min(W, H) / 600;
      const r2 = (60 + ring * 45 + Math.sin(phase + Math.PI * 0.3) * (20 + avgEnergy * 40)) * Math.min(W, H) / 600;
      const alpha = Math.max(0, 0.18 - ring * 0.03);

      ctx.beginPath();
      ctx.arc(cx1, cy, r1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(110, 70, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx2, cy, r2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 120, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // interference arc between them
      if (ring < 3) {
        const midX = (cx1 + cx2) / 2;
        const interR = Math.abs(r1 - r2) * 0.5 + ring * 15;
        ctx.beginPath();
        ctx.arc(midX, cy, interR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220, 180, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  // --- Pink: slow floating warm particles ---
  function drawPink(W: number, H: number) {
    analyser.getByteFrequencyData(freqData);
    ctx.fillStyle = "rgba(10, 4, 8, 0.06)";
    ctx.fillRect(0, 0, W, H);

    const now = Date.now() * 0.001;
    const numParticles = 50;

    for (let i = 0; i < numParticles; i++) {
      const freqIdx = Math.floor((i / numParticles) * bufferLength * 0.3);
      const energy = freqData[freqIdx] / 255;

      const px = W * (0.05 + 0.9 * ((Math.sin(now * 0.25 + i * 1.7) + 1) / 2));
      const py = H * (0.05 + 0.9 * ((Math.cos(now * 0.18 + i * 2.3) + 1) / 2));
      const radius = (1.5 + energy * 10) * Math.min(W, H) / 600;
      const alpha = 0.08 + energy * 0.18;

      const hue = 320 + i * 1.2;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 70%, 75%, ${alpha})`;
      ctx.fill();
    }
  }

  function draw() {
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (W === 0 || H === 0) { rafId = requestAnimationFrame(draw); return; }

    if (soundType === "brown") drawBrown(W, H);
    else if (soundType === "binaural") drawBinaural(W, H);
    else drawPink(W, H);

    rafId = requestAnimationFrame(draw);
  }

  draw();

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
  };
}
