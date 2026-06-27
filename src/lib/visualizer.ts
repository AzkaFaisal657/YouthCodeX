type SoundType = "brown" | "pink" | "binaural";

export function startVisualizer(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode,
  soundType: SoundType,
  orbCenter: { x: number; y: number } | null
): () => void {
  const ctx = canvas.getContext("2d")!;
  let rafId = 0;
  let scroll = 0;

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const bufferLength = analyser.frequencyBinCount;
  const freqData = new Uint8Array(bufferLength);
  const timeData = new Float32Array(analyser.fftSize);

  function avg(data: Uint8Array, lo: number, hi: number) {
    let s = 0;
    for (let i = lo; i < hi; i++) s += data[i];
    return s / ((hi - lo) * 255);
  }

  /**
   * Draws a converging ribbon wave — multiple thin lines that all meet at the
   * left/right edges and spread apart in the middle, exactly like the references.
   *
   * @param W            canvas logical width
   * @param H            canvas logical height
   * @param yBase        vertical centre of the ribbon
   * @param numBands     how many parallel lines to draw
   * @param maxSpread    max pixel spread at the ribbon's widest point
   * @param waveFn       returns the wave y-displacement for a given x (0..W)
   * @param colorFn      (bandRatio 0-1, alpha) → css color string
   * @param glowColor    shadow color for the centre glow
   */
  function drawRibbon(
    W: number,
    H: number,
    yBase: number,
    numBands: number,
    maxSpread: number,
    waveFn: (x: number) => number,
    colorFn: (ratio: number, alpha: number) => string,
    glowColor: string
  ) {
    for (let b = 0; b < numBands; b++) {
      const ratio = b / Math.max(numBands - 1, 1);
      const centerDist = Math.abs(ratio - 0.5) * 2; // 0 = centre band, 1 = edge band
      const alpha = (1 - centerDist * 0.72) * 0.85;
      const lineWidth = 1.8 - centerDist * 1.0;

      ctx.beginPath();
      ctx.strokeStyle = colorFn(ratio, alpha);
      ctx.lineWidth = Math.max(0.4, lineWidth);
      ctx.shadowBlur = centerDist < 0.35 ? 18 : 4;
      ctx.shadowColor = glowColor;

      for (let x = 0; x <= W; x += 2) {
        // spreadFactor: 0 at both edges, peaks at x = W/2  →  converging ribbon
        const spreadFactor = Math.sin((x / W) * Math.PI);
        const yOff = (ratio - 0.5) * maxSpread * spreadFactor;
        const y = yBase + yOff + waveFn(x);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // ── PINK (foggy / low-energy) ────────────────────────────────────────────
  function drawPink(W: number, H: number) {
    analyser.getByteFrequencyData(freqData);
    analyser.getFloatTimeDomainData(timeData);
    ctx.clearRect(0, 0, W, H);
    scroll += 0.35;

    const energy = avg(freqData, 5, 60);
    const yBase = H * 0.5;

    drawRibbon(
      W, H, yBase,
      20,
      H * 0.022,
      (x) => {
        const t1 = (x / W) * Math.PI * 2.4 + scroll * 0.013;
        const t2 = (x / W) * Math.PI * 1.1 - scroll * 0.007;
        const freqIdx = Math.floor((x / W) * bufferLength * 0.4);
        const audioAmp = freqData[freqIdx] / 255;
        const timeIdx = Math.floor((x / W) * timeData.length);
        const timeAmp = timeData[timeIdx] || 0;
        return (
          Math.sin(t1) * H * (0.072 + energy * 0.038) +
          Math.sin(t2) * H * 0.018 +
          audioAmp * H * 0.026 +
          timeAmp * H * 0.012
        );
      },
      (ratio, alpha) => {
        const hue = 330 + ratio * 25;
        return `hsla(${hue}, 82%, 65%, ${alpha})`;
      },
      "rgba(255, 120, 180, 0.9)"
    );
  }

  // ── BROWN (scattered / high-energy) ─────────────────────────────────────
  function drawBrown(W: number, H: number) {
    analyser.getByteFrequencyData(freqData);
    analyser.getFloatTimeDomainData(timeData);
    ctx.clearRect(0, 0, W, H);
    scroll += 0.55;

    const bass = avg(freqData, 0, 8);
    const mid = avg(freqData, 8, 30);
    const energy = bass * 0.55 + mid * 0.45;
    const yBase = H * 0.5;

    // Vertical tick marks — kept close to wave centre
    const tickStep = Math.max(6, Math.floor(W / 60));
    for (let x = 0; x <= W; x += tickStep) {
      const freqIdx = Math.floor((x / W) * bufferLength * 0.5);
      const amp = freqData[freqIdx] / 255;
      const t = (x / W) * Math.PI * 3.5 + scroll * 0.02;
      const waveY = yBase + Math.sin(t) * H * (0.04 + energy * 0.02);
      const tickH = (4 + amp * H * 0.032) * (0.5 + energy * 0.5);
      const alpha = 0.15 + amp * 0.20;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 165, 55, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.moveTo(x, waveY - tickH);
      ctx.lineTo(x, waveY + tickH);
      ctx.stroke();
    }

    drawRibbon(
      W, H, yBase,
      18,
      H * 0.020,
      (x) => {
        const t1 = (x / W) * Math.PI * 3.5 + scroll * 0.02;
        const t2 = (x / W) * Math.PI * 1.7 - scroll * 0.011;
        const t3 = (x / W) * Math.PI * 5.8 + scroll * 0.028;
        const freqIdx = Math.floor((x / W) * bufferLength * 0.5);
        const audioAmp = freqData[freqIdx] / 255;
        const timeIdx = Math.floor((x / W) * timeData.length);
        const timeAmp = timeData[timeIdx] || 0;
        return (
          Math.sin(t1) * H * (0.065 + energy * 0.032) +
          Math.sin(t2) * H * 0.018 +
          Math.sin(t3) * H * 0.008 +
          audioAmp * H * 0.026 +
          timeAmp * H * 0.012
        );
      },
      (ratio, alpha) => {
        const hue = 26 + ratio * 18;
        return `hsla(${hue}, 88%, 60%, ${alpha})`;
      },
      "rgba(255, 150, 40, 0.9)"
    );
  }

  // ── BINAURAL (mixed / mid-energy) ────────────────────────────────────────
  function drawBinaural(W: number, H: number) {
    analyser.getByteFrequencyData(freqData);
    ctx.clearRect(0, 0, W, H);
    scroll += 0.45;

    const now = Date.now() * 0.001;
    const beatPhase = now * Math.PI * 2 * 0.4;
    const energy = avg(freqData, 0, 30);
    const pulse = Math.sin(beatPhase) * 0.5 + 0.5;

    // First ribbon
    drawRibbon(
      W, H, H * 0.5,
      18,
      H * 0.020,
      (x) => {
        const t1 = (x / W) * Math.PI * 2.9 + scroll * 0.016;
        const freqIdx = Math.floor((x / W) * bufferLength * 0.4);
        const audioAmp = freqData[freqIdx] / 255;
        return (
          Math.sin(t1) * H * (0.068 + energy * 0.028 + pulse * 0.014) +
          audioAmp * H * 0.022
        );
      },
      (ratio, alpha) => {
        const hue = 258 + ratio * 30;
        return `hsla(${hue}, 78%, 68%, ${alpha * (0.7 + pulse * 0.3)})`;
      },
      "rgba(170, 110, 255, 0.9)"
    );

    // Second ribbon — phase-shifted
    drawRibbon(
      W, H, H * 0.5,
      12,
      H * 0.013,
      (x) => {
        const t2 = (x / W) * Math.PI * 2.9 - scroll * 0.016 + beatPhase * 0.35;
        const freqIdx = Math.floor((x / W) * bufferLength * 0.35);
        const audioAmp = freqData[freqIdx] / 255;
        return (
          Math.sin(t2) * H * (0.022 + energy * 0.010 + pulse * 0.006) +
          audioAmp * H * 0.010
        );
      },
      (ratio, alpha) => {
        const hue = 288 + ratio * 20;
        return `hsla(${hue}, 72%, 72%, ${alpha * (0.5 + pulse * 0.5)})`;
      },
      "rgba(210, 160, 255, 0.8)"
    );
  }

  // ── main loop ─────────────────────────────────────────────────────────────
  function draw() {
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (W === 0 || H === 0) { rafId = requestAnimationFrame(draw); return; }

    if (soundType === "brown")         drawBrown(W, H);
    else if (soundType === "binaural") drawBinaural(W, H);
    else                               drawPink(W, H);

    rafId = requestAnimationFrame(draw);
  }

  draw();

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
  };
}
