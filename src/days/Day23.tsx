import { motion, type PanInfo } from "motion/react";
import { useState } from "react";

// ── Slide data ───────────────────────────────────────────────────────────────
type Slide = { id: number; src: string; label: string };

const SLIDES: Slide[] = [
  { id: 0, src: "https://picsum.photos/seed/cflow-a/480/640", label: "Alpine" },
  { id: 1, src: "https://picsum.photos/seed/cflow-b/480/640", label: "Drift" },
  { id: 2, src: "https://picsum.photos/seed/cflow-c/480/640", label: "Ember" },
  { id: 3, src: "https://picsum.photos/seed/cflow-d/480/640", label: "Solace" },
  { id: 4, src: "https://picsum.photos/seed/cflow-e/480/640", label: "Verve" },
  { id: 5, src: "https://picsum.photos/seed/cflow-f/480/640", label: "Mirage" },
  { id: 6, src: "https://picsum.photos/seed/cflow-g/480/640", label: "Breeze" },
  {
    id: 7,
    src: "https://picsum.photos/seed/cflow-h/480/640",
    label: "Cascade",
  },
  { id: 8, src: "https://picsum.photos/seed/cflow-i/480/640", label: "Lucent" },
];

const N = SLIDES.length;

// ── Layout constants ─────────────────────────────────────────────────────────
const CARD_W = 260;
const CARD_H = 280;
const SPACING = 250; // px between side items
const PULL_IN = 250; // how close the first side item sits to center
const ROTATE_Y = 55; // degrees of Y rotation for side items
const VISIBLE_COUNT = 3; // items visible on each side of center

// ── Transform helpers ────────────────────────────────────────────────────────
function getTransforms(offset: number) {
  const absOffset = Math.abs(offset);
  const sign = Math.sign(offset);

  if (offset === 0) {
    return { x: 0, rotateY: 0, z: 0, scale: 1, opacity: 1 };
  }

  return {
    x: sign * (PULL_IN + (absOffset - 1) * SPACING),
    rotateY: sign * -ROTATE_Y,
    z: -100 * absOffset,
    scale: 0.85 - absOffset * 0.03,
    opacity: Math.max(0, 1 - (absOffset - 1) * 0.35),
  };
}

// ── Mod helper (always positive) ─────────────────────────────────────────────
const mod = (n: number, m: number) => ((n % m) + m) % m;

// ── Component ────────────────────────────────────────────────────────────────
const Day23 = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const navigate = (delta: number) => {
    if (animating) return;
    setAnimating(true);
    setActiveIndex((prev) => prev + delta);
    setTimeout(() => setAnimating(false), 450);
  };

  // Compute each slide's signed offset from center (shortest wrap distance)
  const getOffset = (slideIndex: number) => {
    const current = mod(activeIndex, N);
    let offset = slideIndex - current;
    if (offset > N / 2) offset -= N;
    if (offset < -N / 2) offset += N;
    return offset;
  };

  return (
    <div
      className="relative flex flex-col items-center select-none outline-none w-full"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") navigate(-1);
        if (e.key === "ArrowRight") navigate(1);
      }}
    >
      {/* Carousel stage */}
      <div
        className="relative flex items-center justify-center overflow-hidden
          before:absolute before:left-0 before:top-0 before:bottom-0 before:w-8 sm:before:w-36 before:z-10 before:pointer-events-none before:bg-linear-to-r before:from-surface before:to-transparent
          after:absolute after:right-0 after:top-0 after:bottom-0 after:w-8 sm:after:w-36 after:z-10 after:pointer-events-none after:bg-linear-to-l after:from-surface after:to-transparent"
        style={{
          perspective: 800,
          width: "100%",
          height: CARD_H + 80,
        }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          onPanEnd={(_, info: PanInfo) => {
            const dx = info.offset.x;
            const vx = info.velocity.x;
            if (Math.abs(dx) > 50 || Math.abs(vx) > 300) {
              navigate(dx > 0 ? -1 : 1);
            }
          }}
        >
          {SLIDES.map((slide, i) => {
            const offset = getOffset(i);

            // Hide slides outside the visible range
            if (Math.abs(offset) > VISIBLE_COUNT) return null;

            const t = getTransforms(offset);
            const zIndex = VISIBLE_COUNT + 1 - Math.abs(offset);
            const isCenter = offset === 0;

            const target = {
              x: t.x - CARD_W / 2,
              rotateY: t.rotateY,
              z: t.z,
              scale: t.scale,
              opacity: 1.0,
            };

            return (
              <motion.div
                key={slide.id}
                className="absolute left-1/2 top-0"
                initial={target}
                animate={target}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  zIndex,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  willChange: "transform",
                }}
                onClick={() => {
                  if (offset !== 0) navigate(offset);
                }}
              >
                {/* Card */}
                <div
                  className={`w-full h-full rounded-xl overflow-hidden border border-white/20 shadow-lg ${
                    isCenter ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <img
                    src={slide.src}
                    alt={slide.label}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* Reflection */}
                <div
                  className="absolute top-full left-0 w-full overflow-hidden rounded-xl pointer-events-none"
                  style={{
                    height: CARD_H * 0.35,
                    transform: "scaleY(-1)",
                    maskImage:
                      "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 70%)",
                    WebkitMaskImage:
                      "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 70%)",
                  }}
                >
                  <img
                    src={slide.src}
                    alt=""
                    className="w-full object-cover pointer-events-none"
                    style={{ height: CARD_H }}
                    draggable={false}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Label for active slide */}
      <motion.p
        key={mod(activeIndex, N)}
        className="text-base font-medium text-ink"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {SLIDES[mod(activeIndex, N)].label}
      </motion.p>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-canvas sm-shadow text-ink transition-[colors, transform] active:scale-97 duration-220 ease-out cursor-pointer"
          aria-label="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const current = mod(activeIndex, N);
                let delta = i - current;
                if (delta > N / 2) delta -= N;
                if (delta < -N / 2) delta += N;
                if (delta !== 0) navigate(delta);
              }}
              className={`w-2 h-2 rounded-full border border-line transition-colors cursor-pointer ${
                mod(activeIndex, N) === i
                  ? "bg-ink"
                  : "bg-ink/20 hover:bg-ink/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => navigate(1)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-canvas sm-shadow text-ink transition-[colors, transform] active:scale-97 duration-220 ease-out cursor-pointer"
          aria-label="Next"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Day23;
