import { useRef, useEffect, useState, RefObject } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

/* ─── Palette ─────────────────────────────────────────────────────────── */
const C = {
  canvas: "#FFF5FA",
  surface: "#FFFFFF",
  mist: "#F3EEFF",
  lilac: "#C9AEFF",
  blush: "#FFB5C8",
  sky: "#B5DCFF",
  mint: "#B5F0D4",
  peach: "#FFD6B5",
  plum: "#4A2D6F",
  mauve: "#7C5FA0",
  whisper: "#B89FCC",
};

/* ─── Real SVG Cloud ───────────────────────────────────────────────────── */
function Cloud({
  seed, w, h, tint, op,
}: { seed: number; w: number; h: number; tint: string; op: number }) {
  const id = `cl${seed}`;
  const cx = w / 2;
  const cy = h * 0.62;
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <filter id={`f${id}`} x="-30%" y="-50%" width="160%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028 0.022" numOctaves="5" seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" result="disp" />
          <feGaussianBlur in="disp" stdDeviation="2.5" />
        </filter>
        <radialGradient id={`g${id}`} cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="50%" stopColor={tint} stopOpacity="0.88" />
          <stop offset="100%" stopColor={tint} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g filter={`url(#f${id})`} opacity={op}>
        <ellipse cx={cx} cy={cy + h * 0.04} rx={w * 0.46} ry={h * 0.24} fill={`url(#g${id})`} />
        <circle cx={cx - w * 0.32} cy={cy - h * 0.06} r={h * 0.33} fill={`url(#g${id})`} />
        <circle cx={cx - w * 0.14} cy={cy - h * 0.24} r={h * 0.40} fill={`url(#g${id})`} />
        <circle cx={cx + w * 0.06} cy={cy - h * 0.31} r={h * 0.44} fill={`url(#g${id})`} />
        <circle cx={cx + w * 0.27} cy={cy - h * 0.22} r={h * 0.37} fill={`url(#g${id})`} />
        <circle cx={cx + w * 0.44} cy={cy - h * 0.08} r={h * 0.28} fill={`url(#g${id})`} />
      </g>
    </svg>
  );
}

/* ─── Cloud data ────────────────────────────────────────────────────────── */
const CLOUDS = [
  { seed: 1,  left: "-5%",  top: "2%",  w: 680, h: 280, tint: "#B5DCFF", op: 0.55, blur: 10, speed: 0.05, animDx: 12,  animDy: 6 },
  { seed: 2,  left: "50%",  top: "10%", w: 520, h: 210, tint: "#F3EEFF", op: 0.50, blur: 10, speed: 0.05, animDx: -10, animDy: 5 },
  { seed: 3,  left: "15%",  top: "60%", w: 600, h: 240, tint: "#C9AEFF", op: 0.48, blur: 10, speed: 0.07, animDx: 9,   animDy: 7 },
  { seed: 4,  left: "65%",  top: "68%", w: 480, h: 190, tint: "#B5DCFF", op: 0.45, blur: 12, speed: 0.06, animDx: -8,  animDy: 5 },
  { seed: 5,  left: "8%",   top: "15%", w: 400, h: 160, tint: "#F3EEFF", op: 0.60, blur: 5,  speed: 0.14, animDx: 15,  animDy: 8 },
  { seed: 6,  left: "60%",  top: "5%",  w: 360, h: 145, tint: "#C9AEFF", op: 0.55, blur: 5,  speed: 0.12, animDx: -12, animDy: 6 },
  { seed: 7,  left: "28%",  top: "50%", w: 420, h: 170, tint: "#B5DCFF", op: 0.52, blur: 6,  speed: 0.15, animDx: 10,  animDy: 9 },
  { seed: 8,  left: "-3%",  top: "45%", w: 300, h: 120, tint: "#FFB5C8", op: 0.35, blur: 7,  speed: 0.13, animDx: 8,   animDy: 6 },
  { seed: 9,  left: "72%",  top: "40%", w: 340, h: 138, tint: "#B5F0D4", op: 0.38, blur: 6,  speed: 0.14, animDx: -9,  animDy: 7 },
  { seed: 10, left: "4%",   top: "4%",  w: 240, h: 95,  tint: "#ffffff", op: 0.70, blur: 1,  speed: 0.28, animDx: 18,  animDy: 9 },
  { seed: 11, left: "68%",  top: "9%",  w: 200, h: 80,  tint: "#F3EEFF", op: 0.65, blur: 1,  speed: 0.25, animDx: -14, animDy: 7 },
  { seed: 12, left: "22%",  top: "38%", w: 260, h: 105, tint: "#ffffff", op: 0.62, blur: 2,  speed: 0.30, animDx: 12,  animDy: 10 },
  { seed: 13, left: "55%",  top: "55%", w: 220, h: 88,  tint: "#B5DCFF", op: 0.58, blur: 2,  speed: 0.27, animDx: -11, animDy: 8 },
];

/* ─── Cloud Scene ───────────────────────────────────────────────────────── */
function CloudScene({
  scrollY,
  cloudOpacity,
}: {
  scrollY: ReturnType<typeof useScroll>["scrollY"];
  cloudOpacity: MotionValue<number>;
}) {
  return (
    <motion.div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", opacity: cloudOpacity }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(175deg, #ddf0ff 0%, #F3EEFF 35%, #FFF5FA 70%, #ffe8f5 100%)",
      }} />
      {CLOUDS.map((cl, i) => {
        const yParallax = useTransform(scrollY, [0, 6000], [0, -6000 * cl.speed]);
        return (
          <motion.div key={cl.seed} style={{ position: "absolute", left: cl.left, top: cl.top, filter: `blur(${cl.blur}px)`, y: yParallax }}
            animate={{ x: [0, cl.animDx, 0], y: [0, cl.animDy, 0] }}
            transition={{ duration: 9 + i * 1.3, repeat: Infinity, ease: "easeInOut" }}>
            <Cloud seed={cl.seed} w={cl.w} h={cl.h} tint={cl.tint} op={cl.op} />
          </motion.div>
        );
      })}
      {Array.from({ length: 22 }, (_, i) => ({
        id: i, x: (i * 7 + 3) % 100, y: (i * 11 + 7) % 100,
        size: 2.5 + (i % 3), dur: 7 + (i % 6), delay: (i * 0.4) % 5,
        color: [C.lilac, C.sky, C.blush, C.mint, C.peach][i % 5],
      })).map(p => (
        <motion.div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: p.color, opacity: 0 }}
          animate={{ y: [0, -50, 0], x: [0, 15 * (p.id % 2 ? 1 : -1), 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </motion.div>
  );
}

/* ─── Cinematic Overlays ────────────────────────────────────────────────── */
function CinematicOverlays() {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 8, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 48%, transparent 38%, rgba(24,6,48,0.32) 100%)" }} />
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 9, pointerEvents: "none", opacity: 0.055 }} xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
    </>
  );
}

/* ─── useInView ──────────────────────────────────────────────────────────── */
function useInView(ref: RefObject<HTMLDivElement | null>, root: RefObject<HTMLDivElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { root: root.current, threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, root]);
  return visible;
}

/* ─── Pill ───────────────────────────────────────────────────────────────── */
function Pill({ text, color }: { text: string; color: string }) {
  return (
    <div style={{
      display: "inline-block", padding: "5px 18px", borderRadius: 100,
      background: color + "28", border: `1px solid ${color}50`,
      color: C.mauve, fontSize: "0.73rem", letterSpacing: "0.11em",
      fontFamily: "system-ui, sans-serif", textTransform: "uppercase" as const, marginBottom: 18,
    }}>{text}</div>
  );
}

/* ─── Section 1: Hero ────────────────────────────────────────────────────── */
function Section1({ scrollY }: { scrollY: ReturnType<typeof useScroll>["scrollY"] }) {
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, -60]);
  return (
    <motion.div style={{ opacity, y, textAlign: "center", padding: "0 32px", position: "relative", zIndex: 2 }}>
      <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 44px" }}>
        <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(from 0deg, ${C.lilac}, ${C.blush}, ${C.peach}, ${C.sky}, ${C.mint}, ${C.lilac})`, opacity: 0.18 }}
          animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div style={{ position: "absolute", inset: 14, borderRadius: "50%", background: `radial-gradient(circle at 35% 32%, ${C.lilac}, ${C.blush} 55%, ${C.peach})`, boxShadow: `0 0 40px ${C.lilac}88, 0 0 80px ${C.blush}44` }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(from 0deg, ${C.lilac}88, ${C.blush}88, ${C.mint}88, ${C.lilac}88)`, boxShadow: "inset 0 0 20px rgba(255,255,255,0.4)" }}
          animate={{ rotate: 360 }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }} />
      </div>
      <motion.h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "clamp(2rem, 4.5vw, 3.4rem)", color: C.plum, lineHeight: 1.2, marginBottom: 20, letterSpacing: "-0.025em" }}
        initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9, ease: "easeOut" }}>
        The moment right before starting.
      </motion.h1>
      <motion.p style={{ fontFamily: "system-ui, sans-serif", fontSize: "1.12rem", color: C.mauve, lineHeight: 1.72, maxWidth: 460, margin: "0 auto 44px" }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.9, ease: "easeOut" }}>
        Tether is a focus ritual for brains that freeze before they begin.
      </motion.p>
    </motion.div>
  );
}

/* ─── Section 2: Problem ─────────────────────────────────────────────────── */
function Section2({ inView }: { inView: boolean }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 780, margin: "0 auto", padding: "0 40px", position: "relative", zIndex: 2 }}>
      <motion.div initial={{ opacity: 0, y: 48 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.85, ease: "easeOut" }}>
        <Pill text="The problem" color={C.blush} />
        <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "clamp(1.9rem, 4.8vw, 3.6rem)", color: C.plum, lineHeight: 1.18, letterSpacing: "-0.03em", marginBottom: 24 }}>
          You're not lazy.{" "}
          <span style={{ background: `linear-gradient(135deg, ${C.blush}, ${C.lilac})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Your brain just can't generate the push to start.
          </span>
        </h2>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "1.08rem", color: C.mauve, lineHeight: 1.72, maxWidth: 500, margin: "0 auto" }}>
          Executive function isn't willpower. It's a system — and some brains need a gentler way in.
        </p>
      </motion.div>
    </div>
  );
}

/* ─── Section 3: Chat ────────────────────────────────────────────────────── */
function Section3({ inView }: { inView: boolean }) {
  const bubbles = [
    { text: "When you try to start something, what happens first?", fromRight: false },
    { text: "My brain goes completely blank and I just… stare.", fromRight: true },
    { text: "Got it — is this more like fog, or more like chaos?", fromRight: false },
    { text: "Definitely fog. Heavy and slow.", fromRight: true },
  ];
  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 2 }}>
      <motion.div style={{ textAlign: "center", marginBottom: 32 }} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
        <Pill text="How it works" color={C.sky} />
        <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.plum, letterSpacing: "-0.02em", lineHeight: 1.28, marginBottom: 9 }}>How it learns you</h2>
        <p style={{ fontFamily: "system-ui, sans-serif", color: C.mauve, fontSize: "0.94rem", lineHeight: 1.65 }}>A 2-minute conversation, once. Then it knows your pattern.</p>
      </motion.div>
      <motion.div style={{ background: "rgba(255,255,255,0.88)", borderRadius: 22, padding: "24px 26px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 8px 40px rgba(74,45,111,0.13)", border: `1px solid ${C.mist}` }}
        initial={{ opacity: 0, y: 38, scale: 0.97 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ delay: 0.18, duration: 0.8, ease: "easeOut" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingBottom: 15, borderBottom: `1px solid ${C.mist}` }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.lilac}, ${C.blush})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
          </div>
          <div>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600, color: C.plum, margin: 0 }}>Tether Setup</p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", color: C.whisper, margin: 0 }}>one conversation · always learning</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {[C.blush, C.peach, C.mint].map((c, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />)}
          </div>
        </div>
        {bubbles.map((b, i) => (
          <motion.div key={i} style={{ display: "flex", justifyContent: b.fromRight ? "flex-end" : "flex-start", marginBottom: 12 }}
            initial={{ opacity: 0, x: b.fromRight ? 30 : -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.16, duration: 0.55, ease: "easeOut" }}>
            <div style={{ background: b.fromRight ? `linear-gradient(135deg, ${C.lilac}22, ${C.blush}22)` : "rgba(255,255,255,0.9)", border: `1px solid ${b.fromRight ? C.lilac + "44" : C.mist}`, borderRadius: b.fromRight ? "18px 4px 18px 18px" : "4px 18px 18px 18px", padding: "11px 16px", maxWidth: "74%", boxShadow: "0 2px 12px rgba(74,45,111,0.07)" }}>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.88rem", color: C.plum, lineHeight: 1.55, margin: 0 }}>{b.text}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Section 4: Session inputs ──────────────────────────────────────────── */
function Section4({ inView }: { inView: boolean }) {
  const [val, setVal] = useState(28);
  const color = val < 40 ? C.sky : val < 65 ? C.peach : C.blush;
  const label = val < 40 ? "Foggy & slow" : val < 65 ? "Mid-energy" : "Scattered & wired";
  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 2 }}>
      <motion.div style={{ textAlign: "center", marginBottom: 32 }} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
        <Pill text="The session" color={C.lilac} />
        <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.plum, letterSpacing: "-0.02em", lineHeight: 1.28, marginBottom: 9 }}>Two inputs. Ten seconds.</h2>
        <p style={{ fontFamily: "system-ui, sans-serif", color: C.mauve, fontSize: "0.94rem", lineHeight: 1.65 }}>The AI does the thinking.</p>
      </motion.div>
      <motion.div style={{ background: "rgba(255,255,255,0.90)", borderRadius: 24, padding: "28px", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 8px 40px rgba(74,45,111,0.12)", border: `1px solid ${C.mist}` }}
        initial={{ opacity: 0, y: 36 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.8 }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.76rem", color: C.mauve, fontWeight: 500, margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Energy right now</p>
            <motion.span key={label} style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.76rem", color, fontWeight: 500, padding: "3px 10px", borderRadius: 100, background: color + "22" }}
              initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>{label}</motion.span>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ height: 8, borderRadius: 8, background: `linear-gradient(to right, ${C.sky}, ${C.peach}, ${C.blush})` }} />
            <input type="range" min={0} max={100} value={val} onChange={e => setVal(+e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
            <motion.div style={{ position: "absolute", top: "50%", width: 20, height: 20, borderRadius: "50%", border: "3px solid white", pointerEvents: "none" }}
              animate={{ left: `calc(${val}% - 10px)`, translateY: "-50%", background: color, boxShadow: `0 0 14px ${color}bb` }}
              transition={{ type: "spring", stiffness: 230, damping: 28 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.71rem", color: C.sky, fontWeight: 500 }}>Foggy</span>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.71rem", color: C.blush, fontWeight: 500 }}>Scattered</span>
          </div>
        </div>
        <div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.76rem", color: C.mauve, fontWeight: 500, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>What needs doing?</p>
          <div style={{ background: C.canvas, border: `1.5px solid ${C.lilac}40`, borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: `0 0 0 3px ${C.lilac}10` }}>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: C.whisper, margin: 0, fontStyle: "italic" }}>Write the intro to my essay...</p>
            <motion.div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.lilac}, ${C.blush})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Section 5: Features ────────────────────────────────────────────────── */
function Section5({ inView }: { inView: boolean }) {
  const cards = [
    { title: "Sound environment", desc: "Brown noise, pink noise, or silence. Tuned to your brain state, not your playlist.", grad: `linear-gradient(135deg, ${C.sky}, ${C.mint})`, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg> },
    { title: "One micro-action", desc: "A single, impossibly small step. Small enough your brain says yes before the freeze kicks in.", grad: `linear-gradient(135deg, ${C.blush}, ${C.peach})`, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
    { title: "Brain framing", desc: "Words matched to how your specific brain works — not generic cheerleading.", grad: `linear-gradient(135deg, ${C.lilac}, ${C.blush})`, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
  ];
  return (
    <div style={{ width: "100%", maxWidth: 820, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 2 }}>
      <motion.div style={{ textAlign: "center", marginBottom: 34 }} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
        <Pill text="What you get" color={C.mint} />
        <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.plum, letterSpacing: "-0.02em", lineHeight: 1.28 }}>Three things. Ready in seconds.</h2>
      </motion.div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
        {cards.map((card, i) => (
          <motion.div key={i} style={{ background: "rgba(255,255,255,0.88)", borderRadius: 22, padding: "24px 20px", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 6px 28px rgba(74,45,111,0.1)", border: `1px solid ${C.mist}`, flex: "1 1 0", minWidth: 200 }}
            initial={{ opacity: 0, y: 36 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.18 + i * 0.13, duration: 0.7 }}
            whileHover={{ y: -5, boxShadow: "0 14px 44px rgba(74,45,111,0.16)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: card.grad, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{card.icon}</div>
            <h3 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: "0.96rem", color: C.plum, marginBottom: 7, letterSpacing: "-0.01em" }}>{card.title}</h3>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.83rem", color: C.mauve, lineHeight: 1.62, margin: 0 }}>{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section 6: CTA ─────────────────────────────────────────────────────── */
function Section6({ inView }: { inView: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "0 32px", position: "relative", zIndex: 2 }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 55%, ${C.mint}55 0%, ${C.sky}33 40%, transparent 68%)` }} />
      <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: "easeOut" }} style={{ position: "relative" }}>
        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 40px" }}>
          {[120, 88, 56, 32].map((size, i) => (
            <motion.div key={i} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle, ${[C.mint + "55", C.sky + "66", C.lilac + "88", "rgba(255,255,255,0.9)"][i]}, transparent)` }}
              animate={{ scale: [1, 1.12, 1], opacity: [[0.28, 0.38, 0.50, 0.63][i], [0.4, 0.55, 0.72, 0.9][i], [0.28, 0.38, 0.50, 0.63][i]] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }} />
          ))}
          <motion.div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 36, height: 36, borderRadius: "50%", background: `conic-gradient(from 0deg, ${C.mint}, ${C.sky}, ${C.lilac}, ${C.mint})` }}
            animate={{ rotate: 360, scale: [1, 1.14, 1] }} transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } }} />
        </div>
        <motion.h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)", color: C.plum, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.18 }}
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.8 }}>
          Ready when you are.
        </motion.h2>
        <motion.p style={{ fontFamily: "system-ui, sans-serif", fontSize: "1.08rem", color: C.mauve, lineHeight: 1.72, maxWidth: 340, margin: "0 auto 44px" }}
          initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.34, duration: 0.7 }}>
          No setup. No account. Just the moment you've been waiting for.
        </motion.p>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.5, duration: 0.7 }}>
          <motion.button style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "17px 46px", borderRadius: 100, background: `linear-gradient(135deg, ${C.lilac}, ${C.blush})`, border: "none", color: "white", fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "1.05rem", letterSpacing: "0.01em", cursor: "pointer", boxShadow: `0 8px 32px ${C.lilac}66`, position: "relative", overflow: "hidden" }}
            whileHover={{ scale: 1.03, boxShadow: `0 12px 48px ${C.lilac}88` }} whileTap={{ scale: 0.97 }}>
            <motion.div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.30) 50%, transparent 60%)", borderRadius: "inherit" }}
              animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }} />
            <span>Start Session</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </motion.button>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.76rem", color: C.whisper, marginTop: 14, letterSpacing: "0.04em" }}>No account needed.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}


/* ─── Home Page ──────────────────────────────────────────────────────────── */
export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const s2 = useRef<HTMLDivElement>(null);
  const s3 = useRef<HTMLDivElement>(null);
  const s4 = useRef<HTMLDivElement>(null);
  const s5 = useRef<HTMLDivElement>(null);
  const s6 = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({ container: containerRef });
  const cloudOpacity = useTransform(scrollY, [0, 3500], [1, 0.16]);

  const s2v = useInView(s2, containerRef);
  const s3v = useInView(s3, containerRef);
  const s4v = useInView(s4, containerRef);
  const s5v = useInView(s5, containerRef);
  const s6v = useInView(s6, containerRef);

  const [VH, setVH] = useState(900);
  useEffect(() => { setVH(window.innerHeight); }, []);

  const SEC = 1.5;

  const centered: React.CSSProperties = {
    position: "sticky",
    top: 0,
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  };

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflowY: "scroll", background: C.canvas, position: "relative", fontFamily: "system-ui, sans-serif" }}>
      <CloudScene scrollY={scrollY} cloudOpacity={cloudOpacity} />
      <CinematicOverlays />

      <div style={{ height: `${SEC * VH}px` }}>
        <div style={centered}><Section1 scrollY={scrollY} /></div>
      </div>
      <div ref={s2} style={{ height: `${SEC * VH}px` }}>
        <div style={centered}><Section2 inView={s2v} /></div>
      </div>
      <div ref={s3} style={{ height: `${SEC * VH}px` }}>
        <div style={centered}><Section3 inView={s3v} /></div>
      </div>
      <div ref={s4} style={{ height: `${SEC * VH}px` }}>
        <div style={centered}><Section4 inView={s4v} /></div>
      </div>
      <div ref={s5} style={{ height: `${SEC * VH}px` }}>
        <div style={centered}><Section5 inView={s5v} /></div>
      </div>
      <div ref={s6} style={{ height: `${SEC * VH}px` }}>
        <div style={centered}><Section6 inView={s6v} /></div>
      </div>
    </div>
  );
}
