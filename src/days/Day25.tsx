import { useRef, useEffect, useCallback } from "react";

// ── Types ───────────────────────────────────────────────────────────────────
interface Dot {
  // Grid (rest) position
  gx: number;
  gy: number;
  // Current animated position
  x: number;
  y: number;
  // Velocity for spring physics
  vx: number;
  vy: number;
  // Current opacity (0-1)
  opacity: number;
}

// ── Constants ───────────────────────────────────────────────────────────────
const CURSOR_RADIUS = 360;
const REPEL_STRENGTH = 20;
const SPRING = 0.035;
const DAMPING = 0.82;
const DWELL_MAX = 8; // max dwell multiplier
const DWELL_UP = 0.005; // slow ramp up when still
const DWELL_DOWN = 0.85; // faster drain when moving
const NOISE_STRENGTH = 0.15; // subtle jitter on repelled dots
const DOT_COLOR = "160, 160, 170"; // neutral gray RGB

// ── Component ───────────────────────────────────────────────────────────────
const Day25 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const prevMouseRef = useRef({ x: -9999, y: -9999 });
  const dwellRef = useRef(0);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const dotSize = 2;
  const spacing = 14;

  // Build the dot grid
  const buildGrid = useCallback(
    (width: number, height: number) => {
      const dots: Dot[] = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      // Center the grid within the canvas
      const offsetX = (width - (cols - 1) * spacing) / 2;
      const offsetY = (height - (rows - 1) * spacing) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gx = offsetX + c * spacing;
          const gy = offsetY + r * spacing;
          dots.push({ gx, gy, x: gx, y: gy, vx: 0, vy: 0, opacity: 1 });
        }
      }
      dotsRef.current = dots;
    },
    [spacing],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d")!;
    let width = 0;
    let height = 0;

    // Size canvas to container
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid(width, height);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Track mouse relative to the canvas
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    // ── Animation loop ────────────────────────────────────────────────────
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const dots = dotsRef.current;
      const r2 = CURSOR_RADIUS * CURSOR_RADIUS;

      // Dwell: slowly builds when cursor is still, drains faster when moving
      const pmx = prevMouseRef.current.x;
      const pmy = prevMouseRef.current.y;
      const onCanvas = mx > -9000 && pmx > -9000;
      const speed = onCanvas ? Math.sqrt((mx - pmx) ** 2 + (my - pmy) ** 2) : 0;
      const target = Math.max(0, DWELL_MAX * (1 - speed / 30));
      // Asymmetric lerp — slow build, faster drain
      const rate = target > dwellRef.current ? DWELL_UP : DWELL_DOWN;
      dwellRef.current += (target - dwellRef.current) * rate;
      prevMouseRef.current = { x: mx, y: my };
      const dwell = dwellRef.current;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // Vector from cursor to dot's rest position
        const dxRest = d.gx - mx;
        const dyRest = d.gy - my;
        const distSq = dxRest * dxRest + dyRest * dyRest;

        if (distSq < r2 && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const t = 1 - dist / CURSOR_RADIUS; // 0 at edge, 1 at center
          // Steep power curve — dots near center get pushed hard, edge barely moves
          const force = (REPEL_STRENGTH * dwell * t * t) / dist;
          d.vx += dxRest * force * 0.016;
          d.vy += dyRest * force * 0.016;
          // Subtle noise jitter — stronger closer to cursor
          const jitter = NOISE_STRENGTH * t;
          d.vx += (Math.random() - 0.5) * jitter;
          d.vy += (Math.random() - 0.5) * jitter;
          // Fade: closer to cursor = more transparent
          d.opacity = Math.max(0, Math.pow(dist / CURSOR_RADIUS, 0.6));
        } else {
          // Restore opacity
          d.opacity += (1 - d.opacity) * 0.18;
        }

        // Spring back toward grid position
        const sx = d.gx - d.x;
        const sy = d.gy - d.y;
        d.vx += sx * SPRING;
        d.vy += sy * SPRING;
        d.vx *= DAMPING;
        d.vy *= DAMPING;
        d.x += d.vx;
        d.y += d.vy;

        // Draw
        ctx.beginPath();
        ctx.arc(d.x, d.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${DOT_COLOR}, ${d.opacity * 0.55})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [dotSize, spacing, buildGrid]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-100">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};

export default Day25;
