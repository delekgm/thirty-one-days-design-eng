import { useState, useRef, useLayoutEffect } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";

const LENS_SIZE = 190;
const LENS_RADIUS = LENS_SIZE / 2;
const MAG = 2.5;

// Rich scene — rendered once in background, once clipped+scaled inside the lens
const Scene = () => (
  <div className="absolute inset-0 overflow-hidden bg-canvas flex flex-col justify-left gap-3 p-10">
    {/* Dot grid texture */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle, oklch(70% 0.01 240) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        opacity: 0.45,
      }}
    />

    {/* Large serif headline */}
    <h1 className="font-semibold text-6xl text-ink leading-none tracking-tight relative">
      Every
      <br />
      detail
      <br />
      matters.
    </h1>

    {/* Body copy — fine print to magnify */}
    <div className="max-w-65 relative">
      <p className="font-body text-[11px] text-muted leading-relaxed">
        The difference between good and great often lives in the pixels most
        people never notice. Good typography breathes. Great typography
        disappears entirely.
      </p>
      <p className="font-body text-[9px] text-muted/50 mt-2 uppercase tracking-[0.18em]">
        Day 11 · Magnifying Glass
      </p>
    </div>

    {/* Right-side decorative specimen */}
    <div className="absolute right-10 top-8 text-right">
      <div className="font-headline italic text-[72px] text-ink/10 leading-none">
        Aa
      </div>
      <div className="font-body text-[9px] tracking-[0.22em] uppercase text-muted/50 mt-1">
        Instrument Serif
      </div>
    </div>
  </div>
);

const Day11 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  // Motion values for drag offset — drive DOM updates directly, no re-renders on drag
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setContainerSize({ w: width, h: height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Derive inner content transform from live drag position.
  // containerSize is captured from the render closure — updates correctly on resize.
  const innerTransform = useTransform([dragX, dragY], ([dx, dy]: number[]) => {
    const cx = containerSize.w / 2 + dx;
    const cy = containerSize.h / 2 + dy;
    return `translate(${LENS_RADIUS - cx * MAG}px, ${LENS_RADIUS - cy * MAG}px) scale(${MAG})`;
  });

  return (
    <div ref={containerRef} className="relative w-full min-h-96 select-none">
      {/* ── Background scene ── */}
      <Scene />

      {/* ── Magnifier lens ── */}
      {containerSize.w > 0 && (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          className="absolute cursor-grab active:cursor-grabbing"
          style={{
            x: dragX,
            y: dragY,
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: containerSize.w / 2 - LENS_RADIUS,
            top: containerSize.h / 2 - LENS_RADIUS,
            zIndex: 10,
          }}
        >
          {/* Layer 1 — magnified content, clipped to circle */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ zIndex: 1 }}
          >
            <motion.div
              style={{
                position: "absolute",
                width: containerSize.w,
                height: containerSize.h,
                transformOrigin: "0 0",
                transform: innerTransform,
              }}
            >
              <Scene />
            </motion.div>
          </div>

          {/* Layer 2a — chromatic aberration: conic gradient masked to edge ring only.
              Blue fringe on upper-left (light entry side), orange on lower-right. */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              zIndex: 2,
              background: `conic-gradient(
                from 110deg,
                rgba(40, 160, 255, 0.22) 0deg,
                rgba(80, 200, 255, 0.10) 55deg,
                transparent 110deg,
                transparent 200deg,
                rgba(255, 75, 20, 0.14) 260deg,
                rgba(255, 140, 40, 0.08) 310deg,
                rgba(40, 160, 255, 0.22) 360deg
              )`,
              WebkitMaskImage: `radial-gradient(circle at center, transparent ${LENS_RADIUS - 14}px, black ${LENS_RADIUS - 10}px)`,
              maskImage: `radial-gradient(circle at center, transparent ${LENS_RADIUS - 14}px, black ${LENS_RADIUS - 10}px)`,
            }}
          />

          {/* Layer 2b — radial refraction halo at edge */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              zIndex: 2,
              background: `radial-gradient(
                circle at 50% 50%,
                transparent 60%,
                rgba(160, 190, 255, 0.07) 70%,
                rgba(100, 150, 255, 0.13) 80%,
                rgba(255, 110, 60, 0.08) 88%,
                rgba(255, 200, 140, 0.04) 94%,
                transparent 100%
              )`,
            }}
          />

          {/* Layer 3a — primary specular: upper-left glare */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              zIndex: 3,
              background:
                "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.30) 20%, transparent 50%)",
            }}
          />

          {/* Layer 3b — secondary bounce light: lower-right */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              zIndex: 3,
              background:
                "radial-gradient(ellipse at 74% 82%, rgba(255,255,255,0.20) 0%, transparent 44%)",
            }}
          />

          {/* Layer 4 — inner glass rim: white inset ring + depth shadows */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              zIndex: 4,
              boxShadow: `
                inset 0 0 0 1.5px rgba(255, 255, 255, 0.95),
                inset 0 0 0 3.5px rgba(255, 255, 255, 0.20),
                inset 0 2px 8px rgba(255, 255, 255, 0.42),
                inset 0 -5px 10px rgba(0, 0, 0, 0.08)
              `,
            }}
          />

          {/* Layer 5 — outer bezel ring.
              Extends 13px beyond lens; mask cuts out the lens interior.
              Gradient + layered shadows simulate a rounded dark-metal torus:
              bright catch on top surface, hard shadow underneath. */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -10,
              zIndex: 5,
              // Multi-stop gradient: light catch → deep shadow → faint lift
              background:
                "linear-gradient(145deg, rgba(98,100,112,0.98) 0%, rgba(72,74,84,0.98) 18%, rgba(38,40,47,0.99) 52%, rgba(30,32,38,0.99) 68%, rgba(55,57,65,0.97) 100%)",
              WebkitMaskImage: `radial-gradient(circle at center, transparent ${LENS_RADIUS}px, black ${LENS_RADIUS + 1.5}px)`,
              maskImage: `radial-gradient(circle at center, transparent ${LENS_RADIUS}px, black ${LENS_RADIUS + 1.5}px)`,
              boxShadow: `
                inset 0 2px 0 rgba(255,255,255,0.28),
                inset 0 1px 3px rgba(255,255,255,0.12),
                inset 0 -2px 0 rgba(0,0,0,0.70),
                inset 0 -1px 4px rgba(0,0,0,0.40),
                inset 2px 0 0 rgba(255,255,255,0.08),
                inset -2px 0 0 rgba(0,0,0,0.35),
                0 0 0 0.5px rgba(255,255,255,0.10),
                0 26px 72px rgba(0, 0, 0, 0.45),
                0 10px 28px rgba(0, 0, 0, 0.30),
                0 3px 8px rgba(0, 0, 0, 0.22),
                0 0 0 1px rgba(0, 0, 0, 0.20)
              `,
            }}
          />

          {/* Inner edge highlight — thin bright ring at the seam between bezel and glass */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              zIndex: 5,
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 0 0 2px rgba(255,255,255,0.06)",
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default Day11;
