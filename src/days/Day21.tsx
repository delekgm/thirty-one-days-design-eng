import { useRef } from "react";

// SVG filter that creates the gooey blob-merge effect
const GooeyFilter = () => (
  <svg className="absolute w-0 h-0" aria-hidden="true">
    <defs>
      <filter id="gooey">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 20 -10"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
);

// Reusable arrow icon pointing right
const ArrowRight = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GooeyButton = ({ label = "Get Started" }: { label?: string }) => {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    const el = ref.current;
    if (!el || el.dataset.clicked) return;
    el.dataset.clicked = "";
    setTimeout(() => delete el.dataset.clicked, 220);
  };

  return (
  <button
    ref={ref}
    onClick={handleClick}
    className="relative cursor-pointer bg-transparent border-none p-0 group
               active:scale-97 transition-transform duration-220 ease-out
               after:content-[''] after:absolute after:inset-y-0 after:left-full after:w-16"
    style={{ filter: "url(#gooey)" }}
  >
    <div className="flex items-center">
      {/* Main pill */}
      <div
        className="relative z-10 bg-ink text-canvas font-body font-semibold
                    text-base px-7 py-3.5 rounded-full"
      >
        {label}
      </div>

      {/* Arrow circle — sits behind the pill at rest, slides out on hover */}
      <div
        className="absolute right-0 z-0 w-12 h-12 rounded-full bg-ink
                    overflow-hidden translate-x-0 scale-90 group-hover:translate-x-[120%] group-hover:scale-100
                    transition-transform duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)]"
      >
        {/* Two stacked arrows — on click, one exits right while the other enters from left */}
        {/* duration-0 base = instant snap-back; group-data-clicked:duration-220 = smooth slide-out */}
        <div className="grid place-items-center w-full h-full text-canvas">
          <span
            className="col-start-1 row-start-1 -translate-x-[170%] group-data-clicked:translate-x-0
                       transition-transform duration-0 group-data-clicked:duration-220
                       ease-[cubic-bezier(0.785,0.135,0.15,0.86)]"
          >
            <span
              className="block opacity-0 -rotate-45 group-hover:opacity-100 group-hover:rotate-0
                         transition-[opacity,rotate] duration-300 ease"
            >
              {ArrowRight}
            </span>
          </span>
          <span
            className="col-start-1 row-start-1 translate-x-0 group-data-clicked:translate-x-[170%]
                       transition-transform duration-0 group-data-clicked:duration-220
                       ease-[cubic-bezier(0.785,0.135,0.15,0.86)]"
          >
            <span
              className="block opacity-0 -rotate-45 group-hover:opacity-100 group-hover:rotate-0
                         transition-[opacity,rotate] duration-300 ease"
            >
              {ArrowRight}
            </span>
          </span>
        </div>
      </div>
    </div>
  </button>
  );
};

const Day21 = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <GooeyFilter />
      <GooeyButton />
      <GooeyButton label="Learn More" />
    </div>
  );
};

export default Day21;
