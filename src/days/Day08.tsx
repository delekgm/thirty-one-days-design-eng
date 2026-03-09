import { useState } from "react";
import { motion } from "motion/react";

const YEARS = Array.from(
  { length: 2026 - 1997 + 1 },
  (_, i) => 2026 - i,
).reverse();

const Day08 = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const calculateScale = (index: number) => {
    if (hoveredIndex === null) return 0.4;
    const distance = Math.abs(index - hoveredIndex);
    return Math.max(1 - distance * 0.2, 0.4);
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col">
        {YEARS.map((year, i) => {
          const isSelected = selected === i;

          return (
            <button
              className="relative inline-flex items-end justify-center py-1"
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                if (selected === i) {
                  setSelected(null);
                } else {
                  setSelected(i);
                }
              }}
              onTouchStart={() => handleMouseEnter(i)}
              onTouchEnd={handleMouseLeave}
            >
              <motion.div
                key={i}
                className={`h-1 w-10 rounded-sm sm-shadow ${
                  selected === i
                    ? "bg-accent"
                    : "bg-line dark:bg-primary-dark-11"
                }`}
                animate={{
                  scale: calculateScale(i),
                }}
                initial={{ scale: 0.4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
              {hoveredIndex === i || selected === i ? (
                <motion.span
                  className={`absolute -top-0.5 left-12 text-xs font-bold ${
                    isSelected ? "text-accent" : "text-ink"
                  }`}
                  initial={{ opacity: 0, filter: `blur(4px)`, scale: 0.4 }}
                  animate={{ opacity: 1, filter: `blur(0px)`, scale: 1 }}
                  transition={{ duration: 0.15, delay: 0.1 }}
                >
                  {year}
                </motion.span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Day08;
