import { useState, useRef, useEffect, useMemo } from "react";

// Deterministic hash — returns 0–1 for consistent card content per grid cell
const hash = (x: number, y: number): number => {
  let h = (x * 374761393 + y * 668265263 + 1274126177) & 0xffffffff;
  h = ((h ^ (h >> 13)) * 1103515245 + 12345) & 0xffffffff;
  return (h >>> 0) / 0xffffffff;
};

const CARD_W = 180;
const CARD_H = 240;
const GAP = 18;
const CELL_W = CARD_W + GAP;
const CELL_H = CARD_H + GAP;

const LABELS = [
  "Signal",
  "Drift",
  "Pulse",
  "Echo",
  "Wave",
  "Bloom",
  "Node",
  "Arc",
  "Glyph",
  "Core",
  "Flux",
  "Shard",
  "Void",
  "Ember",
  "Fuse",
  "Nova",
  "Prism",
  "Orbit",
  "Surge",
  "Loop",
] as const;

type CardProps = {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
};

const SVG_W = CARD_W - 32;
const SVG_H = CARD_H - 64;

// Generative dot matrix — hash drives grid size, dot radius, gaps, and opacity
const dotMatrix = (x: number, y: number) => {
  const cols = 5 + Math.floor(hash(x + 13, y + 17) * 10); // 5-10
  const rows = 5 + Math.floor(hash(x + 19, y + 23) * 10); // 5-10
  const dotR = 2 + hash(x + 29, y + 31) * 1.5;
  const spacingX = SVG_W / (cols + 1);
  const spacingY = SVG_H / (rows + 1);
  const dots: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (hash(x + c * 7, y + r * 13) < 0.25) continue;
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={spacingX * (c + 1)}
          cy={spacingY * (r + 1)}
          r={dotR}
          fill="currentColor"
          opacity={0.12 + hash(x + c, y + r) * 0.16}
        />,
      );
    }
  }
  return dots;
};

const Card = ({ x, y, screenX, screenY }: CardProps) => {
  const label = LABELS[Math.floor(hash(x + 31, y + 53) * LABELS.length)];
  const composition = dotMatrix(x, y);
  // Small per-card rotation: -3° to 3°
  const hoverRotate = (hash(x + 71, y + 73) * 6 - 3).toFixed(1);

  return (
    <div
      className="absolute rounded-xl select-none border-line bg-canvas shadow-sm text-ink overflow-hidden"
      style={{
        left: screenX,
        top: screenY,
        width: CARD_W,
        height: CARD_H,
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = `rotate(${hoverRotate}deg) translateY(-2px)`;
        e.currentTarget.style.zIndex = "10";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "";
        e.currentTarget.style.zIndex = "";
      }}
    >
      <svg
        className="m-auto mt-4"
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        {composition}
      </svg>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <span className="text-sm text-muted font-medium">{label}</span>
      </div>
    </div>
  );
};

const Day16 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 800, h: 600 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cancel any in-flight momentum on unmount
  useEffect(() => {
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  // Momentum / inertia loop
  const momentumLoop = () => {
    const vx = velocity.current.x;
    const vy = velocity.current.y;
    if (Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) {
      velocity.current = { x: 0, y: 0 };
      return;
    }
    velocity.current = { x: vx * 0.94, y: vy * 0.94 };
    setOffset((prev) => ({ x: prev.x + vx, y: prev.y + vy }));
    animFrame.current = requestAnimationFrame(momentumLoop);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    // Lock all pointer events to the container for the drag duration
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: dx, y: dy };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grab";
    animFrame.current = requestAnimationFrame(momentumLoop);
  };

  // Compute visible cards
  const cards = useMemo(() => {
    const buffer = 1;
    const startCol = Math.floor(-offset.x / CELL_W) - buffer;
    const endCol = Math.floor((-offset.x + size.w) / CELL_W) + buffer;
    const startRow = Math.floor(-offset.y / CELL_H) - buffer;
    const endRow = Math.floor((-offset.y + size.h) / CELL_H) + buffer;

    const result = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const screenX = col * CELL_W + offset.x;
        const screenY = row * CELL_H + offset.y;
        result.push(
          <Card
            key={`${col},${row}`}
            x={col}
            y={row}
            screenX={screenX}
            screenY={screenY}
          />,
        );
      }
    }
    return result;
  }, [offset.x, offset.y, size.w, size.h]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-96 cursor-grab"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {cards}
    </div>
  );
};

export default Day16;
