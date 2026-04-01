import { useCallback, useRef } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";

type ConfettiInstance = (opts: Record<string, unknown>) => void;

interface ShotOptions {
  spread?: number;
  decay?: number;
  startVelocity?: number;
  scalar?: number;
}

const Day31 = () => {
  const refAnimationInstance = useRef<ConfettiInstance | null>(null);
  const getInstance = useCallback((instance: ConfettiInstance) => {
    refAnimationInstance.current = instance;
  }, []);

  const makeShot = useCallback((particleRatio: number, opts: ShotOptions) => {
    refAnimationInstance.current?.({
      ...opts,
      origin: { y: 0.7 },
      particleCount: Math.floor(200 * particleRatio),
    });
  }, []);

  const fire = useCallback(() => {
    makeShot(0.25, { spread: 26, startVelocity: 55 });
    makeShot(0.2, { spread: 60 });
    makeShot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  }, [makeShot]);

  return (
    <div>
      <ReactCanvasConfetti
        onInit={({ confetti }) => getInstance(confetti as ConfettiInstance)}
        style={{
          position: "fixed",
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
        }}
      />
      <button
        onClick={fire}
        className="group flex items-center justify-center gap-1.5 rounded-full bg-white pl-3 pr-4 h-8 sm-shadow cursor-pointer text-sm font-medium text-ink transition-[colors,transform] hover:bg-canvas active:scale-[0.97] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0.5 16 16"
          fill="#000000"
          id="Confetti--Streamline-Phosphor"
          height="18"
          width="18"
          className="
      transition-transform transform-gpu duration-200 ease-[cubic-bezier(0.165,0.85,0.45,1)]
      group-hover:rotate-12 group-hover:scale-110
      group-active:rotate-0 group-active:scale-95
    "
        >
          <desc>Confetti Streamline Icon: https://streamlinehq.com</desc>
          <path
            d="M6.968125 3.289375a0.9875 0.9875 0 0 0 -1.625 0.360625L2.0625 12.67375A0.989375 0.989375 0 0 0 2.985 14a1 1 0 0 0 0.34125 -0.0625l9.023125 -3.28125a0.9875 0.9875 0 0 0 0.36125 -1.625Zm-0.520625 8.450625 -2.1875 -2.1875 0.8225 -2.263125 3.628125 3.628125Zm-3.4375 1.25 0.875 -2.400625 1.528125 1.528125ZM9.75 10.54 5.46 6.25l0.8125 -2.241875 5.714375 5.714375ZM10 4.5a2.3625 2.3625 0 0 1 0.24 -0.97375C10.57125 2.864375 11.19625 2.5 12 2.5c0.41875 0 0.6875 -0.143125 0.853125 -0.450625a1.375 1.375 0 0 0 0.146875 -0.553125 0.5 0.5 0 0 1 1 0.00375c0 0.80375 -0.5325 2 -2 2 -0.41875 0 -0.6875 0.143125 -0.853125 0.450625a1.375 1.375 0 0 0 -0.146875 0.553125 0.5 0.5 0 0 1 -1 -0.00375Zm-1.5 -2V1a0.5 0.5 0 0 1 1 0v1.5a0.5 0.5 0 0 1 -1 0Zm6.35375 5.14625a0.5 0.5 0 1 1 -0.7075 0.706875l-1 -1a0.5 0.5 0 0 1 0.7075 -0.7075Zm0.304375 -2.671875 -1.5 0.5a0.5 0.5 0 0 1 -0.31625 -0.94875l1.5 -0.5a0.5 0.5 0 0 1 0.31625 0.94875Z"
            strokeWidth="0.0625"
          ></path>
        </svg>
        <span className="transition-transform duration-200 group-hover:translate-x-px">
          Celebrate!
        </span>
      </button>
    </div>
  );
};

export default Day31;
