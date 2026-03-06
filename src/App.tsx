import Header from "./components/Header";
import DayWrapper from "./components/DayWrapper";
import Day01 from "./days/Day01";
import Day02 from "./days/Day02";
import Day03 from "./days/Day03";
import Day04 from "./days/Day04";
import Day05 from "./days/Day05";

// ── Day registry ──────────────────────────────────────────────────────────
// Add each new day here as the month progresses.
// The `component` field accepts any React element.
const days = [
  {
    day: 1,
    title: "A Simple Button",
    description: "Crafting a satisfying button press with scale.",
    component: <Day01 />,
  },
  {
    day: 2,
    title: "Infinite Slider",
    description:
      "Exploration on how to create an elegant and responsive infinite slider using Tailwind CSS",
    component: <Day02 />,
  },
  {
    day: 3,
    title: "Card Stack",
    description: "Centered card stack.",
    component: <Day03 />,
  },
  {
    day: 4,
    title: "Icon Transition Button",
    description: "A pleasing icon transition using blur.",
    component: <Day04 />,
  },
  {
    day: 5,
    title: "Ribbon",
    description:
      "Animated 3D ribbon using GLSL shaders, rendered via React Three Fiber.",
    component: <Day05 />,
    fullBleed: true,
  },
];
// ──────────────────────────────────────────────────────────────────────────

const App = () => (
  <div className="min-h-screen bg-canvas text-ink">
    {/* Site header */}
    <Header />

    {/* One section per day, stacked vertically with generous spacing */}
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-24">
      {days.map(({ day, title, description, component, fullBleed }) => (
        <DayWrapper
          key={day}
          day={day}
          title={title}
          description={description}
          fullBleed={fullBleed}
        >
          {component}
        </DayWrapper>
      ))}
    </main>
  </div>
);

export default App;
