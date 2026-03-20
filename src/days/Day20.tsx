import { NumberField } from "@base-ui/react/number-field";
import { useId } from "react";

const Day20 = () => {
  const id = useId();
  return (
    <NumberField.Root
      id={id}
      defaultValue={100}
      className="flex flex-col items-start gap-1"
    >
      <NumberField.ScrubArea className="cursor-ew-resize">
        <label
          htmlFor={id}
          className="cursor-ew-resize text-sm font-medium text-ink"
        >
          Amount
        </label>
        <NumberField.ScrubAreaCursor className="drop-shadow-[0_1px_1px_#0008] filter">
          <CursorGrowIcon />
        </NumberField.ScrubAreaCursor>
      </NumberField.ScrubArea>

      <NumberField.Group className="flex items-center gap-1">
        <NumberField.Decrement className="flex size-8 items-center justify-center bg-white rounded-full bg-clip-padding text-gray-500 select-none sm-shadow hover:bg-canvas active:bg-surface/60 transition-transform active:scale-[0.97] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]">
          <MinusIcon className="active:scale-[0.9] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]" />
        </NumberField.Decrement>
        <NumberField.Input className="h-10 w-24 rounded-full bg-canvas/25 px-3 text-center text-base tracking-[-0.01em] text-ink tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_0px_1px_rgba(0,0,0,0.5)] transition-all duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)] focus:z-1 focus:scale-[1.02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.08)]" />
        <NumberField.Increment className="flex size-8 items-center justify-center bg-white rounded-full bg-clip-padding text-gray-500 select-none sm-shadow hover:bg-canvas active:bg-surface/60 transition-transform active:scale-[0.97] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)]">
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
};

export default Day20;

function CursorGrowIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="26"
      height="14"
      viewBox="0 0 24 14"
      fill="black"
      stroke="white"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}
    >
      <line x1="6" y1="2" x2="6" y2="10" />
      <line x1="2" y1="6" x2="10" y2="6" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}
    >
      <line x1="2" y1="6" x2="10" y2="6" />
    </svg>
  );
}
