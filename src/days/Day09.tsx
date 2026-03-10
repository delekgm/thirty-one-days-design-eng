import { useState } from "react";
import { motion } from "motion/react";

type Card = {
  id: number;
  content: string;
  top: number;
  left: number;
  rotation: number;
  width: number; // px
  height: number; // px
  img: string;
};

const cards: Card[] = [
  {
    id: 1,
    content: "Collage 01",
    top: 50,
    left: 125,
    rotation: 3,
    width: 200,
    height: 200,
    img: "https://i.pinimg.com/1200x/bf/f0/56/bff05633bd82918f61bf0f4418a8292b.jpg",
  },
  {
    id: 2,
    content: "Collage 02",
    top: 150,
    left: 225,
    rotation: -2,
    width: 200,
    height: 200,
    img: "https://i.pinimg.com/1200x/83/1d/15/831d152b264e7ab4dd17e0ed857e8260.jpg",
  },
  {
    id: 3,
    content: "Collage 03",
    top: 100,
    left: 350,
    rotation: 4,
    width: 200,
    height: 200,
    img: "https://i.pinimg.com/736x/0f/79/15/0f79155456c76bbec84b2f4c183957e8.jpg",
  },
];

const Day09 = () => {
  const [zOrder, setZorder] = useState(cards.map((item) => item.id));

  const bringToFront = (id: number) => {
    setZorder((prevOrder) => {
      const filtered = prevOrder.filter((itemId) => itemId !== id);
      return [...filtered, id];
    });
  };

  return (
    <div className="relative w-full h-96">
      {cards.map((card) => {
        const currentZIndex = zOrder.indexOf(card.id) + 1;

        return (
          <motion.div
            key={card.id}
            drag
            dragMomentum={false}
            whileDrag={{
              cursor: "grabbing",
              scale: 1.05,
              //   boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
              rotate: card.rotation + 2,
            }}
            onPointerDown={() => bringToFront(card.id)}
            className="absolute cursor-grab"
            style={{
              top: card.top,
              left: card.left,
              zIndex: currentZIndex,
              rotate: card.rotation,
            }}
          >
            <div
              className="flex flex-col bg-canvas border border-line shadow-sm rounded-lg transition-shadow duration-200 ease active:shadow-md shadow-ink/10 overflow-hidden"
              style={{ width: card.width, height: card.height }}
            >
              <div className="px-3 pt-3 pb-2 text-sm font-medium text-ink shrink-0">
                {card.content}
              </div>
              <div className="relative flex-1 min-h-0 pt-1">
                <div className="relative h-full overflow-hidden shadow-sm shadow-ink/40">
                  <img
                    src={card.img}
                    alt={card.content}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Day09;
