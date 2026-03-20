import { Accordion } from "@base-ui/react/accordion";

function PlusIcon() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-all duration-150 ease-out hover:bg-gray-200 active:scale-90">
      <svg
        width="10"
        height="10"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="transition-transform duration-200 ease-out group-data-panel-open:rotate-45"
      >
        <path
          d="M6 0.5V11.5"
          stroke="#999999"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0.5 6H11.5"
          stroke="#999999"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

const items = [
  {
    value: "what",
    question: "What is design engineering?",
    answer:
      "It's the craft of bridging design and code — turning static mockups into polished, interactive experiences with real motion, layout, and feel.",
  },
  {
    value: "why",
    question: "Why one component per day?",
    answer:
      "Constraints sharpen decisions. A daily cadence keeps scope tight, encourages experimentation, and builds a library of patterns you can draw from later.",
  },
  {
    value: "stack",
    question: "What's the tech stack?",
    answer:
      "React and TypeScript for the UI, Tailwind v4 for styling, and the Motion library for animations — all bundled with Vite.",
  },
  {
    value: "accessible",
    question: "Are the components accessible?",
    answer:
      "Yes. This accordion, for example, uses Base UI under the hood — keyboard navigation, ARIA attributes, and focus management are all handled automatically.",
  },
];

const Day19 = () => {
  return (
    <Accordion.Root className="flex w-full max-w-md flex-col self-start overflow-hidden rounded-2xl bg-white sm-shadow text-ink">
      {items.map(({ value, question, answer }) => (
        <Accordion.Item
          key={value}
          value={value}
          className="border-b border-line last:border-b-0"
        >
          <Accordion.Header>
            <Accordion.Trigger className="group relative flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink hover:bg-surface/60 data-panel-open:border-b data-panel-open:border-line focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-accent">
              {question}
              <PlusIcon />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="h-(--accordion-panel-height) overflow-hidden text-sm text-muted transition-[height] ease-out duration-200 data-ending-style:h-0 data-starting-style:h-0">
            <div className="px-5 pt-3 pb-5">{answer}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};

export default Day19;
