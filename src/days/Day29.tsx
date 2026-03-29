import {
  type MotionValue,
  motion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

const FONT_SIZE = 72;
const DIGIT_PADDING = 12;
const DIGIT_HEIGHT = FONT_SIZE + DIGIT_PADDING;
const DRAG_STEP = 24;
const FLING_DIVISOR = 240;
const MAX_FLING = 12;

function Counter({ value }: { value: number }) {
  return (
    <div
      style={{ fontSize: FONT_SIZE, padding: `${DIGIT_PADDING / 2}px 0` }}
      className="flex overflow-hidden leading-none font-body font-bold text-ink"
    >
      <Digit place={100} value={value} />
      <Digit place={10} value={value} />
      <Digit place={1} value={value} />
    </div>
  );
}

function Digit({ place, value }: { place: number; value: number }) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace, {
    stiffness: 300,
    damping: 30,
  });

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div
      style={{ height: DIGIT_HEIGHT }}
      className="relative w-[1ch] tabular-nums"
    >
      {Array.from({ length: 10 }, (_, number) => (
        <Number key={number} mv={animatedValue} number={number} />
      ))}
    </div>
  );
}

function Number({ mv, number }: { mv: MotionValue<number>; number: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = ((latest % 10) + 10) % 10;
    const offset = (10 + number - placeValue) % 10;
    return (offset > 5 ? offset - 10 : offset) * DIGIT_HEIGHT;
  });
  const filter = useTransform(y, (latest) => {
    const blur = Math.min(Math.abs(latest) / DIGIT_HEIGHT, 1) * 1.2;
    return `blur(${blur.toFixed(2)}px)`;
  });

  return (
    <motion.span
      style={{ y, filter }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}

const Day29 = () => {
  const [value, setValue] = useState(0);
  const dragStartValue = useRef(0);

  return (
    <div className="flex flex-col items-center select-none touch-none">
      <div className="relative">
        <motion.div
          className="cursor-grab active:cursor-grabbing"
          onPanStart={() => {
            dragStartValue.current = value;
          }}
          onPan={(_, info) => {
            setValue(
              dragStartValue.current + Math.trunc(info.offset.x / DRAG_STEP),
            );
          }}
          onPanEnd={(_, info) => {
            const fling = Math.round(info.velocity.x / FLING_DIVISOR);
            const boundedFling = Math.max(
              -MAX_FLING,
              Math.min(MAX_FLING, fling),
            );

            if (boundedFling !== 0) {
              setValue((current) => current + boundedFling);
            }
          }}
        >
          <Counter value={value} />
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-surface to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-surface to-transparent" />
      </div>

      <p className="mt-2 text-xs font-body tracking-widest text-muted uppercase">
        Drag to count
      </p>
    </div>
  );
};

export default Day29;
