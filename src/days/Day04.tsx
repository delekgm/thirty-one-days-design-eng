import { useState } from "react";

const Day04 = () => {
  const [on, setOn] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="relative grid h-10 w-10 place-items-center rounded-lg bg-white shadow-sm shadow-ink/5 transition-colors hover:bg-canvas cursor-pointer border border-line active:scale-[0.97] transition-transform duration-150 ease-out"
      tabIndex={0}
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-pressed={on}
    >
      {/* Icon A (outgoing) */}
      <span
        className={[
          "absolute h-6 w-6 pointer-events-none",
          "transition-[opacity,transform,filter] duration-220 ease-out",
          "will-change-[opacity,transform,filter]",
          on ? "opacity-0 scale-97 blur-[2px]" : "opacity-100 scale-100 blur-0",
        ].join(" ")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {/* Icon B (incoming) */}
      <span
        className={[
          "absolute h-6 w-6 pointer-events-none",
          "transition-[opacity,transform,filter] duration-220 ease-out",
          "will-change-[opacity,transform,filter]",
          on
            ? "opacity-100 scale-100 blur-0"
            : "opacity-0 scale-103 blur-[2px]",
        ].join(" ")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM15.774 10.1333C16.1237 9.70582 16.0607 9.0758 15.6332 8.72607C15.2058 8.37635 14.5758 8.43935 14.226 8.86679L10.4258 13.5116L9.20711 12.2929C8.81658 11.9024 8.18342 11.9024 7.79289 12.2929C7.40237 12.6834 7.40237 13.3166 7.79289 13.7071L9.79289 15.7071C9.99267 15.9069 10.2676 16.0129 10.5498 15.9988C10.832 15.9847 11.095 15.8519 11.274 15.6333L15.774 10.1333Z"
            fill="black"
          />
        </svg>
      </span>
    </button>
  );
};

export default Day04;
