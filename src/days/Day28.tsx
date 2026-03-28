import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

// ── Config ───────────────────────────────────────────────────────────────
const MAGNETIC_RADIUS = 150; // px — how far the pull reaches
const MAGNETIC_STRENGTH = 0.35; // 0-1 — how far the button travels toward cursor
const SPRING = { damping: 18, stiffness: 130, mass: 0.4 };

// ── MagneticButton ───────────────────────────────────────────────────────
// A button that gravitates toward the cursor when it enters a proximity zone,
// then springs back when the cursor leaves.
const MagneticButton = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Raw offsets — these drive the springs
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  // Subtle scale + glow when within the magnetic zone
  const scale = useSpring(1, SPRING);

  // Text follows at a slightly higher ratio for a parallax feel
  const textX = useTransform(springX, (v) => v * 0.2);
  const textY = useTransform(springY, (v) => v * 0.2);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < MAGNETIC_RADIUS) {
      x.set(dx * MAGNETIC_STRENGTH);
      y.set(dy * MAGNETIC_STRENGTH);
      scale.set(1.05);
      setHovered(true);
    } else {
      x.set(0);
      y.set(0);
      scale.set(1);
      setHovered(false);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    scale.set(1);
    setHovered(false);
  };

  return (
    // Invisible hit area — larger than the visible button
    <div
      className="relative flex items-center justify-center"
      style={{ padding: MAGNETIC_RADIUS / 2 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={ref}
        className={[
          "relative cursor-pointer select-none rounded-full",
          "flex items-center justify-center",
          "transition-shadow duration-300",
          hovered ? "shadow-[0_4px_12px_rgba(0,0,0,0.25)]" : "",
          className,
        ].join(" ")}
        style={{ x: springX, y: springY, scale }}
      >
        {/* Inner text with parallax offset */}
        <motion.span
          className="relative z-10 pointer-events-none flex items-center justify-center gap-2"
          style={{ x: textX, y: textY }}
        >
          {children}
        </motion.span>
      </motion.div>
    </div>
  );
};

// ── Arrow icon ───────────────────────────────────────────────────────────
const ArrowUpRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 14 14"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
      d="m4 10 6-6M5.5 4H10M10 4v4.5"
    />
  </svg>
);

// ── Day28 ────────────────────────────────────────────────────────────────
const Day28 = () => (
  <MagneticButton className="bg-ink text-canvas font-body font-semibold text-base pl-6 pr-5 py-3.5 gap-2 active:scale-97 transition-transform duration-220 ease-out">
    Hover near me
    <ArrowUpRight />
  </MagneticButton>
);

export default Day28;
