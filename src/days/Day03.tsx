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
  const CARD_SIZE = 208; // w-52 = 13rem
  const ORIGIN_X = 0.9;
  const ORIGIN_Y = 0.9;

  const offsetX = (ORIGIN_X - 0.65) * CARD_SIZE; // 83.2
  const offsetY = (ORIGIN_Y - 0.9) * CARD_SIZE; // 83.2

  const initialCards = [
    {
      id: 1,
      z: 4,
      img: "https://i.pinimg.com/736x/d7/bd/94/d7bd94a0231456ac7f6885de1eccd943.jpg",
    },
    {
      id: 2,
      z: 3,
      img: "https://i.pinimg.com/236x/fd/5d/14/fd5d146cf06e32d30139e4e3f37c993c.jpg",
    },
    {
      id: 3,
      z: 2,
      img: "https://i.pinimg.com/564x/c6/f8/e9/c6f8e988912e469686c431cc680ef49e.jpg",
    },
    {
      id: 4,
      z: 1,
      img: "https://i.pinimg.com/564x/1a/d6/b1/1ad6b124fee1e478689a9fda0c74e92f.jpg",
    },
    {
      id: 5,
      z: 0,
      img: "https://i.pinimg.com/236x/bf/1d/d9/bf1dd9251d0e7f1936bdb9d95a480295.jpg",
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
        className="relative h-52 w-52"
        style={{
          perspective: 600,
          transform: `translate(${-offsetX}px, ${-offsetY}px)`,
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
                  className="pointer-events-none w-full h-full rounded-lg object-cover"
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
