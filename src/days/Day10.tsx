import { useState } from "react";

const Day10 = () => {
  const [animate, setAnimate] = useState(true);

  return (
    <div className="relative w-full min-h-96 sm:min-h-72">
      <div className="flex flex-col max-w-lg gap-2 antialiased [--delay:100ms]">
        <h1
          className={`text-4xl text-ink font-bold text-balance tracking-tight ${animate ? "animate-enter [--stagger:0]" : "opacity-0"}`}
        >
          Let Your Creativity Shine, Everyday
        </h1>
        <div
          className={`text-base text-ink/60 font-regular text-balance ${animate ? "animate-enter [--stagger:1]" : "opacity-0"}`}
        >
          Creativity starts with action. Focus on what matters and keep building
          what works.
        </div>
        <div
          className={`flex gap-3 pt-3 ${animate ? "animate-enter [--stagger:2]" : "opacity-0"}`}
        >
          <button className="rounded-full bg-canvas px-3 h-8 sm-shadow text-sm cursor-pointer font-medium transition-transform active:scale-[0.97] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]">
            Primary
          </button>
          <button className="rounded-full bg-ink/80 px-3 h-8 sm-shadow cursor-pointer shadow-canvas text-canvas text-sm font-medium transition-transform active:scale-[0.97] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]">
            Secondary
          </button>
        </div>
      </div>

      <button
        className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 h-8 px-3 select-none cursor-pointer rounded-lg bg-white sm-shadow text-sm font-medium text-ink transition-[colors,transform] hover:bg-canvas active:scale-[0.97] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]"
        onClick={() => {
          setAnimate(false);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setAnimate(true));
          });
        }}
      >
        Play Animation
      </button>
    </div>
  );
};

export default Day10;
