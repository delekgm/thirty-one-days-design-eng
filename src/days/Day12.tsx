import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

// ── Card data ────────────────────────────────────────────────────────────────
type CardData = {
  id: number;
  title: string;
  category: string;
  year: string;
};

const CARDS: CardData[] = [
  { id: 1, title: "Orbital Interface", category: "UI Design", year: "2026" },
  { id: 2, title: "Flux Dashboard", category: "Product", year: "2026" },
  { id: 3, title: "Prism System", category: "Design System", year: "2025" },
  { id: 4, title: "Solstice App", category: "Mobile", year: "2025" },
  { id: 5, title: "Meridian Brand", category: "Branding", year: "2024" },
];

// ── Constants ────────────────────────────────────────────────────────────────
const VISIBLE = 4;
const CARD_W = 300;
const CARD_H = 400;

// ── Main component ───────────────────────────────────────────────────────────
const Day12 = () => {
  const [cards, setCards] = useState(CARDS);
  const isAnimating = useRef(false);
  const [exitDir, setExitDir] = useState(1);

  // Lock duration matches the exit animation (0.5s) + spring settle
  const cycleCard = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setCards((prev) => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
    setExitDir((d) => d * -1);
    setTimeout(() => {
      isAnimating.current = false;
    }, 600);
  }, []);

  const visible = cards.slice(0, VISIBLE);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Stack container */}
      <div
        className="relative"
        style={{ width: CARD_W, height: CARD_H + (VISIBLE - 1) * 15 }}
      >
        <AnimatePresence mode="popLayout">
          {visible.map((card, index) => {
            const scale = 1 - index * 0.05;
            const y = index * 15;
            const zIndex = VISIBLE - index;

            return (
              <motion.div
                key={card.id}
                style={{
                  position: "absolute",
                  width: CARD_W,
                  height: CARD_H,
                  top: 0,
                  left: 0,
                  zIndex,
                }}
                initial={false}
                animate={{ scale, y, opacity: 1 }}
                exit={{
                  y: -CARD_H * 1.5,
                  rotate: exitDir * 6,
                  zIndex: VISIBLE + 1,
                  transition: {
                    y: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                    rotate: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                  },
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.15,
                }}
              >
                <div
                  className="w-full h-full rounded-lg bg-canvas border border-line flex flex-col justify-between p-5 select-none"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Top section */}
                  <div>
                    <span className="text-xs font-medium uppercase tracking-widest text-muted">
                      {card.category}
                    </span>

                    <h3 className="font-body font-bold text-2xl text-ink leading-snug">
                      {card.title}
                    </h3>

                    <p className="text-xs text-muted pt-1">{card.year}</p>
                  </div>

                  {/* Bottom section */}
                  <div className="flex items-center justify-between">
                    <button className="rounded-full bg-ink/80 px-3 h-8 sm-shadow cursor-pointer text-canvas text-sm font-medium transition-transform active:scale-[0.97] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]">
                      Read More
                    </button>

                    <span className="text-xs font-medium text-muted">
                      {String(card.id).padStart(2, "0")} /{" "}
                      {String(CARDS.length).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Next button */}
      <button
        onClick={cycleCard}
        className="rounded-lg bg-white px-3 h-8 sm-shadow cursor-pointer text-sm font-medium text-ink transition-[colors,transform] hover:bg-canvas active:scale-[0.97] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]"
      >
        Next Card
      </button>
    </div>
  );
};

export default Day12;
