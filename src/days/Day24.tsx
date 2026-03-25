import { useState, useRef, type FC, type SVGProps } from "react";
import { motion, AnimatePresence } from "motion/react";

// ── Icon components (Feather-style, 24×24 stroke) ───────────────────────────
type IconProps = SVGProps<SVGSVGElement>;

const PlusIcon: FC<IconProps> = (props) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    aria-hidden="true"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ShareIcon: FC<IconProps> = (props) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const HeartIcon: FC<IconProps> = (props) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BookmarkIcon: FC<IconProps> = (props) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const EditIcon: FC<IconProps> = (props) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ── Constants ────────────────────────────────────────────────────────────────
const FAB_SIZE = 56;
const ITEM_SIZE = 44;
const ITEM_GAP = 12;
const ITEM_SPACING = ITEM_SIZE + ITEM_GAP;
const SPRING = { type: "spring" as const, stiffness: 400, damping: 26 };
// Horizontal arc — bottom item centered, each higher item curves further left
const CURVE_MAX = 48;
const curveX = (index: number, count: number) =>
  Math.sin((index / (count - 1)) * (Math.PI / 2)) * CURVE_MAX * -1;

const ACTION_ITEMS = [
  { id: "share", label: "Share", Icon: ShareIcon },
  { id: "favorite", label: "Favorite", Icon: HeartIcon },
  { id: "bookmark", label: "Bookmark", Icon: BookmarkIcon },
  { id: "edit", label: "Edit", Icon: EditIcon },
];

// ── Main component ───────────────────────────────────────────────────────────
const Day24 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full h-80">
      {/* Click-catcher overlay — closes menu when clicking outside */}
      {isOpen && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Draggable FAB group — starts bottom-center */}
      <motion.div
        drag
        dragConstraints={containerRef}
        dragElastic={0.15}
        dragMomentum={false}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        {/* Staggered menu items */}
        <AnimatePresence>
          {isOpen &&
            ACTION_ITEMS.map((item, index) => (
              <motion.div
                key={item.id}
                className="absolute left-1/2 flex items-center"
                style={{
                  marginLeft: -(ITEM_SIZE / 2) - FAB_SIZE / 2,
                  bottom: FAB_SIZE,
                  zIndex: ACTION_ITEMS.length - index,
                }}
                initial={{ opacity: 0, x: 0, y: ITEM_SPACING, scale: 0.3 }}
                animate={{
                  opacity: 1,
                  x: curveX(index, ACTION_ITEMS.length),
                  y: -(index * ITEM_SPACING + ITEM_GAP),
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: 0,
                  y: ITEM_SPACING,
                  scale: 0.3,
                  transition: { ...SPRING },
                }}
                transition={{
                  ...SPRING,
                  delay: index * 0.07,
                  opacity: { delay: index * 0.07 + 0.1 },
                }}
              >
                {/* Tooltip label — floats to the left */}
                <motion.span
                  className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-canvas sm-shadow px-3 py-1.5 text-xs font-medium text-ink"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, transition: { duration: 0.1 } }}
                  transition={{ ...SPRING, delay: index * 0.07 + 0.02 }}
                >
                  {item.label}
                </motion.span>

                {/* Circular icon button */}
                <button
                  type="button"
                  aria-label={item.label}
                  className="flex items-center justify-center rounded-full bg-white sm-shadow text-ink cursor-pointer hover:bg-canvas active:scale-95 transition-[background-color,transform] duration-150"
                  style={{
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                  }}
                >
                  <item.Icon />
                </button>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* FAB button */}
        <motion.button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onTap={() => setIsOpen((prev) => !prev)}
          className="relative z-10 flex items-center sm-shadow justify-center rounded-full bg-accent text-white cursor-pointer"
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={SPRING}>
            <PlusIcon />
          </motion.div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Day24;
