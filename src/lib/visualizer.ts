type SoundType = "brown" | "pink" | "binaural";

export function startVisualizer(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode,
  soundType: SoundType,
  orbCenter: { x: number; y: number } | null
): () => void {
  const ctx = canvas.getContext("2d")!;
  let rafId = 0;
  let frame = 0;

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

  function getOrbXY(W: number, H: number): { cx: number; cy: number } {
    if (orbCenter) return { cx: orbCenter.x, cy: orbCenter.y };
    return { cx: W * 0.5, cy: H * 0.38 };
  }

  // ── BROWN ─────────────────────────────────────────────────────────────────
  let brownScroll = 0;

  function drawBrown(W: number, H: number) {
    analyser.getFloatTimeDomainData(timeData);
    analyser.getByteFrequencyData(freqData);
    ctx.clearRect(0, 0, W, H);

    brownScroll += 0.6;
    const bass   = avg(freqData, 0, 6);
    const mid    = avg(freqData, 6, 20);
    const energy = bass * 0.7 + mid * 0.3;
    const { cx, cy } = getOrbXY(W, H);

    const cols = 28, rows = 14;
    const gx = W / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx   = Math.floor(((c / cols) * 0.4 + (r / rows) * 0.6) * bufferLength * 0.5);
        const amp   = freqData[idx] / 255;
        const baseY = cy - H * 0.45 + (H * 0.9) * (r / (rows - 1));
        const wave  = Math.sin(brownScroll * 0.025 + c * 0.45 + r * 0.7) * H * 0.018;
        const x     = gx * (c + 0.5);
        const y     = baseY + wave * (1 + amp * 1.8);
        ctx.beginPath();
        ctx.arc(x, y, 1.1 + amp * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 90, 25, ${0.06 + amp * 0.18})`;
        ctx.fill();
      }
    }

    const waves = [
      { color: "rgba(200, 100, 30, 0.13)", yOff: -H * 0.28, amp: 0.09, freq: 2.8, sp: 1.0 },
      { color: "rgba(240, 140, 45, 0.10)", yOff: -H * 0.10, amp: 0.07, freq: 1.9, sp: 0.6 },
      { color: "rgba(255, 175, 60, 0.08)", yOff:  H * 0.10, amp: 0.11, freq: 3.6, sp: 1.3 },
      { color: "rgba(160,  60, 15, 0.09)", yOff:  H * 0.28, amp: 0.06, freq: 1.5, sp: 0.4 },
    ];

    for (const w of waves) {
      ctx.beginPath();
      ctx.strokeStyle = w.color;
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= W; x += 2) {
        const t          = (x / W) * Math.PI * w.freq + brownScroll * 0.005 * w.sp;
        const sIdx       = Math.floor((x / W) * timeData.length);
        const audioNudge = (timeData[sIdx] || 0) * H * 0.04;
        const extraSwell = energy * H * 0.035;
        const y = cy + w.yOff + Math.sin(t) * H * (w.amp + energy * 0.04) + audioNudge + extraSwell;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.42);
    glow.addColorStop(0, `rgba(255, 200, 80, ${0.07 + energy * 0.08})`);
    glow.addColorStop(1, "rgba(255, 200, 80, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // ── PINK ──────────────────────────────────────────────────────────────────
  const pinkRings: { r: number; alpha: number; speed: number }[] = [];

  function spawnPinkRing(energy: number) {
    pinkRings.push({ r: 60, alpha: 0.22 + energy * 0.18, speed: 0.7 + energy * 1.1 });
  }

  function drawPink(W: number, H: number) {
    analyser.getByteFrequencyData(freqData);
    ctx.clearRect(0, 0, W, H);

    const mid    = avg(freqData, 5, 40);
    const treble = avg(freqData, 40, 120);
    const energy = mid * 0.65 + treble * 0.35;
    const { cx, cy } = getOrbXY(W, H);

    if (frame % Math.max(18, Math.round(35 - energy * 25)) === 0) spawnPinkRing(energy);

    const maxR = Math.min(W, H) * 0.55;

    for (let i = pinkRings.length - 1; i >= 0; i--) {
      const ring = pinkRings[i];
      ring.r     += ring.speed;
      ring.alpha *= 0.987;
      if (ring.r > maxR || ring.alpha < 0.005) { pinkRings.splice(i, 1); continue; }
      const hue = 340 + (ring.r / maxR) * 22;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, 72%, 68%, ${ring.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    const now   = Date.now() * 0.001;
    const blobs = [
      { seed: 0.0, hue: 342, baseR: 0.20 },
      { seed: 1.4, hue: 318, baseR: 0.16 },
      { seed: 2.7, hue: 355, baseR: 0.14 },
      { seed: 4.1, hue: 328, baseR: 0.17 },
      { seed: 5.8, hue: 310, baseR: 0.13 },
    ];
    const minDim = Math.min(W, H);

    for (const b of blobs) {
      const spread = minDim * 0.38;
      const px = cx + Math.sin(now * 0.07 + b.seed * 1.8) * spread;
      const py = cy + Math.cos(now * 0.055 + b.seed * 2.2) * spread * 0.7;
      const r  = minDim * (b.baseR + energy * 0.04);
      const g  = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0,   `hsla(${b.hue}, 75%, 74%, 0.13)`);
      g.addColorStop(0.5, `hsla(${b.hue}, 70%, 70%, 0.06)`);
      g.addColorStop(1,   `hsla(${b.hue}, 65%, 66%, 0)`);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    for (let i = 0; i < 60; i++) {
      const freqIdx = Math.floor((i / 60) * bufferLength * 0.35);
      const amp   = freqData[freqIdx] / 255;
      const angle = (i / 60) * Math.PI * 2 + now * 0.06;
      const dist  = minDim * (0.18 + (i % 4) * 0.09 + Math.sin(now * 0.15 + i) * 0.03);
      const px    = cx + Math.cos(angle) * dist;
      const py    = cy + Math.sin(angle) * dist * 0.75;
      const hue   = 330 + (i % 5) * 8;
      ctx.beginPath();
      ctx.arc(px, py, 1.0 + amp * 3.2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 70%, 70%, ${0.05 + amp * 0.14})`;
      ctx.fill();
    }
  }

  // ── BINAURAL ──────────────────────────────────────────────────────────────
  function drawBinaural(W: number, H: number) {
    analyser.getByteFrequencyData(freqData);
    ctx.clearRect(0, 0, W, H);

    const now       = Date.now() * 0.001;
    const beatPhase = now * Math.PI * 2 * 0.4;
    const energy    = avg(freqData, 0, 30);
    const high      = avg(freqData, 30, 80);
    const scale     = Math.min(W, H) / 650;
    const { cx, cy } = getOrbXY(W, H);

    const spread = W * 0.12;
    const cx1 = cx - spread, cx2 = cx + spread;

    for (let ring = 0; ring < 6; ring++) {
      const phase = beatPhase + ring * 0.55;
      const pulse = Math.sin(phase) * (16 + energy * 38);
      const r1    = (55 + ring * 48 + pulse) * scale;
      const r2    = (55 + ring * 48 + Math.sin(phase + Math.PI * 0.25) * (16 + energy * 38)) * scale;
      const alpha = Math.max(0, 0.14 - ring * 0.02);

      ctx.beginPath();
      ctx.arc(cx1, cy, Math.max(1, r1), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(110, 70, 220, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx2, cy, Math.max(1, r2), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 130, 255, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    const interR = (60 + energy * 80 + Math.sin(beatPhase * 1.3) * 25) * scale;
    const interG = ctx.createRadialGradient(cx, cy, 0, cx, cy, interR);
    interG.addColorStop(0,    `rgba(200, 160, 255, ${0.12 + energy * 0.10})`);
    interG.addColorStop(0.55, `rgba(180, 130, 255, ${0.05 + energy * 0.04})`);
    interG.addColorStop(1,    "rgba(180, 130, 255, 0)");
    ctx.beginPath();
    ctx.arc(cx, cy, interR, 0, Math.PI * 2);
    ctx.fillStyle = interG;
    ctx.fill();

    for (let ring = 0; ring < 4; ring++) {
      const driftX = Math.sin(now * 0.18 + ring * 1.1) * W * 0.04;
      const driftY = Math.cos(now * 0.14 + ring * 0.9) * H * 0.03;
      const r      = (90 + ring * 65 + Math.sin(beatPhase + ring * 0.8) * (12 + high * 28)) * scale;
      const alpha  = Math.max(0, 0.06 - ring * 0.013);
      ctx.beginPath();
      ctx.arc(cx + driftX, cy + driftY, Math.max(1, r), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220, 190, 255, ${alpha})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    for (let i = 0; i < 70; i++) {
      const freqIdx = Math.floor((i / 70) * bufferLength * 0.5);
      const amp   = freqData[freqIdx] / 255;
      const angle = (i / 70) * Math.PI * 2 + now * 0.04;
      const dist  = (0.22 + (i % 5) * 0.06 + Math.sin(now * 0.3 + i) * 0.03) * Math.min(W, H);
      const px    = cx + Math.cos(angle) * dist;
      const py    = cy + Math.sin(angle) * dist * 0.65;
      ctx.beginPath();
      ctx.arc(px, py, 0.9 + amp * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150, 100, 240, ${0.04 + amp * 0.13})`;
      ctx.fill();
    }
  }

  // ── main loop ─────────────────────────────────────────────────────────────
  function draw() {
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (W === 0 || H === 0) { rafId = requestAnimationFrame(draw); return; }
    frame++;

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