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
import Day13 from "./days/Day13";
import Day14 from "./days/Day14";
import Day15 from "./days/Day15";
import Day16 from "./days/Day16";
import Day17 from "./days/Day17";
import Day18 from "./days/Day18";
import Day19 from "./days/Day19";
import Day20 from "./days/Day20";
import Day21 from "./days/Day21";
import Day22 from "./days/Day22";
import Day23 from "./days/Day23";
import Day24 from "./days/Day24";
import Day25 from "./days/Day25";
import Day26 from "./days/Day26";
import Day27 from "./days/Day27";

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
  {
    day: 13,
    title: "Pill Tabs",
    description: "Nice pill tabs, with a subtle spring.",
    component: <Day13 />,
  },
  {
    day: 14,
    title: "Options Menu",
    description:
      "A popover dropdown with a scale + fade + blur enter transition.",
    component: <Day14 />,
  },
  {
    day: 15,
    title: "Clip Path Buttons",
    description:
      "Using clip path for dynamic button interactions. Press and hold to confirm the action.",
    component: <Day15 />,
  },
  {
    day: 16,
    title: "Infinite Grid",
    description: "Take a look around, forever.",
    component: <Day16 />,
  },
  {
    day: 17,
    title: "Sheet",
    description: "An Apple-esque sheet component.",
    component: <Day17 />,
  },
  {
    day: 18,
    title: "Globe",
    description:
      "A Stripe-inspired 3D globe with twinkling land dots and traveling connection arcs.",
    component: <Day18 />,
    fullBleed: true,
  },
  {
    day: 19,
    title: "Accordion",
    description:
      "A clean FAQ accordion built with Base UI — unstyled, accessible, animated.",
    component: <Day19 />,
  },
  {
    day: 20,
    title: "Number Field",
    description: "Styling a Base UI number field.",
    component: <Day20 />,
  },
  {
    day: 21,
    title: "Gooey Button",
    description:
      "A button with a gooey SVG filter — an arrow circle blob-merges out on hover.",
    component: <Day21 />,
  },
  {
    day: 22,
    title: "Switch",
    description: "A satisfying switch.",
    component: <Day22 />,
  },
  {
    day: 23,
    title: "Cover Flow",
    description:
      "An Apple Cover Flow-style carousel with 3D perspective and infinite looping.",
    component: <Day23 />,
  },
  {
    day: 24,
    title: "Floating Action Button",
    description:
      "A draggable FAB that expands into a staggered vertical menu with spring physics and floating tooltip labels.",
    component: <Day24 />,
  },
  {
    day: 25,
    title: "Dot Grid",
    description:
      "A canvas dot grid with cursor repulsion — dots push away radially and fade near the pointer, then spring back.",
    component: <Day25 />,
    fullBleed: true,
  },
  {
    day: 26,
    title: "Tooltip",
    description: "Exploring the Base UI render prop for pleasing interactions.",
    component: <Day26 />,
  },
  {
    day: 27,
    title: "Gradient Distortion",
    description:
      "An animated multi-center gradient with mouse-driven water distortion, powered by GLSL shaders and React Three Fiber.",
    component: <Day27 />,
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
