import Header from "./components/Header";
import DayWrapper from "./components/DayWrapper";
import Day01 from "./days/Day01";
import Day02 from "./days/Day02";

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
];
// ──────────────────────────────────────────────────────────────────────────

const App = () => (
  <div className="min-h-screen bg-canvas text-ink">
    {/* Site header */}
    <Header />

    {/* One section per day, stacked vertically with generous spacing */}
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-24">
      {days.map(({ day, title, description, component }) => (
        <DayWrapper key={day} day={day} title={title} description={description}>
          {component}
        </DayWrapper>
      ))}
    </main>
  </div>
);

export default App;
