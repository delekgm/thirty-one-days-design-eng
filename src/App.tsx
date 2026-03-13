import Header from "./components/Header";
import DayWrapper from "./components/DayWrapper";
import Day01 from "./days/Day01";
import Day02 from "./days/Day02";
import Day03 from "./days/Day03";
import Day04 from "./days/Day04";
import Day05 from "./days/Day05";
import Day06 from "./days/Day06";
import Day07 from "./days/Day07";
import Day08 from "./days/Day08";
import Day09 from "./days/Day09";
import Day10 from "./days/Day10";
import Day11 from "./days/Day11";
import Day12 from "./days/Day12";

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
  {
    day: 6,
    title: "Toaster",
    description: "A simple toast component.",
    component: <Day06 />,
  },
  {
    day: 7,
    title: "Icon Hover",
    description: "A tiny delight.",
    component: <Day07 />,
  },
  {
    day: 8,
    title: "Timeline",
    description: "A tasty timeline.",
    component: <Day08 />,
  },
  {
    day: 9,
    title: "Draggables",
    description: "Draggable elements, just for fun.",
    component: <Day09 />,
  },
  {
    day: 10,
    title: "Content Load",
    description: "The now classic way to load in content on your webpage.",
    component: <Day10 />,
  },
  {
    day: 11,
    title: "Magnifying Glass",
    description:
      "Drag the glass lens to explore the scene through a physics-inspired optical simulation with edge refraction and specular highlights.",
    component: <Day11 />,
    fullBleed: true,
  },
  {
    day: 12,
    title: "Infinite Card Stack",
    description:
      "A swipeable, recycling card stack with tethered spring physics.",
    component: <Day12 />,
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
