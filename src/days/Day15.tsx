import { useState, useRef, useEffect, type ReactNode } from "react";

// Phase type for the button state machine
type Phase = "idle" | "holding" | "spinning" | "success";

interface ClipPathButtonProps {
  icon: ReactNode;
  holdIcon: ReactNode;
  color: string;
}

const HOLD_DURATION = 600;
const SPIN_DURATION = 800;

// Shared transition classes for the three overlay icon states
const overlayIconBase = "absolute flex items-center justify-center transition-[opacity,transform,filter] duration-200 ease";
const visible = "opacity-100 scale-100 blur-0";
const hiddenShrink = "opacity-0 scale-95 blur-[2px]";
const hiddenGrow = "opacity-0 scale-105 blur-[2px]";

function ClipPathButton({ icon, holdIcon, color }: ClipPathButtonProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const startHold = () => {
    if (phase !== "idle") return;
    setPhase("holding");
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current!;
      const p = Math.min(elapsed / HOLD_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(intervalRef.current!);
        setPhase("spinning");
        spinTimeoutRef.current = setTimeout(() => {
          setPhase("success");
          successTimeoutRef.current = setTimeout(() => {
            setPhase("idle");
            setProgress(0);
          }, 1200);
        }, SPIN_DURATION);
      }
    }, 10);
  };

  const endHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (phase === "holding") {
      setPhase("idle");
      setProgress(0);
    }
  };

  const pressing = phase === "holding";
  const filled = phase === "spinning" || phase === "success";

  // clip-path: inset rising from bottom (stays full once filled)
  const effectiveProgress = filled ? 1 : progress;
  const insetTop = `${(1 - effectiveProgress) * 100}%`;
  const clipValue = `inset(${insetTop} 0% 0% 0%)`;

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      className={`relative inline-flex items-center justify-center w-16 h-16 border-2 rounded-full cursor-pointer overflow-hidden select-none outline-none transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${pressing ? "scale-[0.96]" : "scale-100"}`}
      style={{
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}30`,
      }}
    >
      {/* Default icon */}
      <span
        className={`flex items-center justify-center relative z-1 transition-opacity duration-200 ease-out ${filled ? "opacity-0" : "opacity-100"}`}
      >
        {icon}
      </span>

      {/* Clip-path overlay — the hold effect */}
      <span
        className="absolute inset-0 flex items-center justify-center text-white z-2 pointer-events-none"
        style={{
          background: color,
          clipPath: clipValue,
          transition: filled
            ? "clip-path 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
            : pressing
              ? "none"
              : "clip-path 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* White icon — visible during hold, exits into spinner */}
        <span className={`${overlayIconBase} ${phase === "holding" ? visible : hiddenShrink}`}>
          {icon}
        </span>

        {/* Spinner — exits with scale-down + blur */}
        <span className={`${overlayIconBase} ${phase === "spinning" ? visible : hiddenShrink}`}>
          <Spinner />
        </span>

        {/* Success icon — enters with scale-up + blur */}
        <span className={`${overlayIconBase} ${phase === "success" ? visible : hiddenGrow}`}>
          {holdIcon}
        </span>
      </span>
    </button>
  );
}

const Day15 = () => {
  return (
    <div className="flex flex-wrap gap-8 justify-center">
      {BUTTONS.map((btn, i) => (
        <ClipPathButton key={i} {...btn} />
      ))}
    </div>
  );
};

export default Day15;

// ── Icon data ────────────────────────────────────────────────────────────────

const checkIcon = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const BUTTONS: ClipPathButtonProps[] = [
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
    holdIcon: checkIcon,
    color: "#22c55e",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    ),
    holdIcon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    color: "#ef4444",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    holdIcon: checkIcon,
    color: "#3b82f6",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
    holdIcon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
    ),
    color: "#a855f7",
  },
];

function Spinner() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-[spin_0.5s_linear_infinite]"
    >
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
