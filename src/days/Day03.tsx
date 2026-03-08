import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { useState } from "react";

interface CardRotateProps {
  children: React.ReactNode;
  onSendToBack: () => void;
}

function CardRotate({ children, onSendToBack }: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const threshold = 90;

    if (
      Math.abs(info.offset.x) > threshold ||
      Math.abs(info.offset.y) > threshold
    ) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 cursor-grab"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

const Day03 = () => {
  const initialCards = [
    {
      id: 1,
      z: 4,
      img: "https://i.pinimg.com/1200x/bf/f0/56/bff05633bd82918f61bf0f4418a8292b.jpg",
    },
    {
      id: 2,
      z: 3,
      img: "https://i.pinimg.com/1200x/83/1d/15/831d152b264e7ab4dd17e0ed857e8260.jpg",
    },
    {
      id: 3,
      z: 2,
      img: "https://i.pinimg.com/1200x/8f/96/a7/8f96a7c196c0184db6cb376c73122b3a.jpg",
    },
    {
      id: 4,
      z: 1,
      img: "https://i.pinimg.com/736x/0f/79/15/0f79155456c76bbec84b2f4c183957e8.jpg",
    },
    {
      id: 5,
      z: 0,
      img: "https://i.pinimg.com/736x/b0/d7/9c/b0d79caebac5096c09f6727309cd8427.jpg",
    },
  ];
  const [cards, setCards] = useState(initialCards);

  const onSendToBack = (id: number) => {
    setCards((prev) => {
      const newCards = [...prev];
      const index = newCards.findIndex((card) => card.id === id);
      const [card] = newCards.splice(index, 1);
      newCards.unshift(card);
      return newCards;
    });
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative h-52 w-52 sm:-translate-x-13 lg:-translate-x-16"
        style={{
          perspective: 600,
        }}
      >
        {cards.map((card, index) => {
          return (
            <CardRotate
              key={card.id}
              onSendToBack={() => onSendToBack(card.id)}
            >
              <motion.div
                className="w-full h-full rounded-lg"
                animate={{
                  rotateZ: (cards.length - index - 1) * 8,
                  scale: 1 + index * 0.06 - cards.length * 0.06,
                  transformOrigin: "90% 90%",
                }}
                initial={false}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <img
                  src={card.img}
                  alt="card"
                  className="pointer-events-none w-full h-full rounded-lg object-cover shadow-sm"
                ></img>
              </motion.div>
            </CardRotate>
          );
        })}
      </div>
    </div>
  );
};

export default Day03;
