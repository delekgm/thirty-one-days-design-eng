import { Switch } from "@base-ui/react/switch";

const Day22 = () => {
  return (
    <label className="flex items-center gap-3 text-base text-ink font-medium select-none">
      <Switch.Root
        defaultChecked
        className="relative flex h-7 w-12 cursor-pointer rounded-full sm-shadow bg-line p-0.5 ransition-[background-color,outline-color] duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)] before:absolute before:rounded-full before:outline-offset-2 before:outline-accent focus-visible:before:inset-0 focus-visible:before:outline data-checked:bg-[#22c55e] data-checked:outline-[#22c55e]"
      >
        <Switch.Thumb className="aspect-square h-full rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.34,1.5,0.64,1)] data-checked:translate-x-5" />
      </Switch.Root>
      Notifications
    </label>
  );
};

export default Day22;
