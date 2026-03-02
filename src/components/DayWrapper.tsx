import type { ReactNode } from "react";

interface DayWrapperProps {
  // Day number (1–31)
  day: number;
  // Short title for the component or interaction
  title: string;
  // One or two sentence description of what was built
  description: string;
  // The day's component or interaction
  children: ReactNode;
}

// Wraps each day's entry: metadata header + a centered stage for the component
const DayWrapper = ({ day, title, description, children }: DayWrapperProps) => (
  <section className="pt-16">
    {/* ── Day metadata ──────────────────────────────────────────────── */}
    <div className="mb-8">
      {/* Day counter */}
      <span className="font-body text-xs text-muted tracking-widest uppercase">
        Day {String(day).padStart(2, "0")}
      </span>

      {/* Component title */}
      <h2 className="font-headline italic text-2xl text-ink mt-2 leading-snug">
        {title}
      </h2>

      {/* Description */}
      <p className="font-body text-muted text-sm mt-3 max-w-xl leading-relaxed">
        {description}
      </p>
    </div>

    {/* ── Component stage — children are centered inside ────────────── */}
    <div className="bg-surface border-2 border-line rounded-2xl flex items-center justify-center min-h-96 p-12">
      {children}
    </div>
  </section>
);

export default DayWrapper;
