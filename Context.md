# Context — 31 Days of Design Engineering

A handoff document for resuming work across sessions. Covers current progress,
architecture decisions, conventions, and the exact workflow for adding new days.

---

## The challenge

One designed and engineered component or interaction per day throughout March 2026.
Everything lives on a single scrolling homepage — no routing, no separate pages.

---

## Current progress

| Day | Title            | Status    | File                    |
|-----|------------------|-----------|-------------------------|
| 01  | A Simple Button  | Complete  | `src/days/Day01.tsx`    |
| 02–31 | —             | Not started | —                     |

**Day 01** is a pill-shaped "Add to Cart" button with a shopping cart icon. The
interaction is a satisfying `active:scale-95` press using CSS transitions
(`transition-transform duration-150 ease-out`). No Motion library used yet —
pure Tailwind active-state utilities.

---

## Stack

| Tool | Version | Notes |
|---|---|---|
| React | 19 | Via `@vitejs/plugin-react` |
| TypeScript | 5 | Strict mode |
| Vite | 7 | Dev server + build |
| Tailwind | v4 | CSS-first — **no** `tailwind.config.js` |
| Motion | latest | Installed, not yet used — available for any day |
| Google Fonts | — | Loaded via `<link>` in `index.html` |

---

## File structure

```
├── index.html                  ← Google Fonts preconnect + link tags here
├── vite.config.ts              ← @tailwindcss/vite plugin registered
├── src/
│   ├── main.tsx                ← Untouched Vite entrypoint
│   ├── index.css               ← Tailwind @import + @theme tokens
│   ├── App.tsx                 ← days[] registry — the only file to edit when adding a day
│   ├── components/
│   │   ├── Header.tsx          ← Site title + month subtitle
│   │   └── DayWrapper.tsx      ← Reusable section: day number, title, description, stage
│   └── days/
│       └── Day01.tsx           ← Add DayNN.tsx here for each new day
```

---

## Design system

### Fonts

Loaded from Google Fonts in `index.html`. Two faces only:

- **`font-headline`** — Instrument Serif, italic only. Used for the site `<h1>`
  and each day's `<h2>`.
- **`font-body`** — Inter (400, 500, 600). Used for all body copy, labels,
  meta text.

### Color tokens (`src/index.css` → `@theme {}`)

All values are OKLCH. The hue `240` (cool blue-neutral) runs throughout.
To re-theme, change the hue on `--color-accent` and optionally the neutrals.

| Token             | OKLCH value              | Tailwind utilities generated        |
|-------------------|--------------------------|-------------------------------------|
| `--color-canvas`  | `oklch(98% 0.003 240)`   | `bg-canvas`, `text-canvas`, …       |
| `--color-surface` | `oklch(95% 0.006 240)`   | `bg-surface`, …                     |
| `--color-ink`     | `oklch(12% 0.020 240)`   | `text-ink`, …                       |
| `--color-muted`   | `oklch(50% 0.010 240)`   | `text-muted`, …                     |
| `--color-line`    | `oklch(88% 0.010 240)`   | `border-line`, …                    |
| `--color-accent`  | `oklch(55% 0.220 264)`   | `bg-accent`, `text-accent`, …       |

Add new tokens by appending `--color-*` variables inside `@theme {}`.

### Layout

- Max content width: `max-w-5xl` (64rem / 1024px)
- Horizontal padding: `px-6` (1.5rem / 24px), applied **on the same element** as
  `max-w-5xl mx-auto` — both `Header` and `<main>` follow this pattern. This was
  a bug fix: putting `px-6` on an outer wrapper while `max-w-5xl mx-auto` was on
  an inner wrapper caused the header text to be 24px left of the day content on
  medium/large screens.

---

## Component details

### `Header.tsx`

Simple typographic header. No interactivity. The `<header>` element has no
horizontal padding — padding lives on the inner `<div>` alongside `max-w-5xl mx-auto`.

```tsx
<header className="py-10">
  <div className="max-w-5xl mx-auto px-6">
    <h1 className="font-headline italic text-2xl ...">31 Days of Design Engineering</h1>
    <p className="font-body text-muted text-xs mt-3 tracking-widest uppercase">March 2026</p>
  </div>
</header>
```

### `DayWrapper.tsx`

Accepts `day`, `title`, `description`, and `children`. Renders:

1. A metadata block (day counter, title, description)
2. A `bg-surface` stage with `border-2 border-line rounded-2xl` — children are
   centered inside via `flex items-center justify-center min-h-96 p-12`

The `border-t border-line` separator between days was removed from DayWrapper
during Day 01 work — the `pt-16` spacing + the stage border provide enough
visual separation.

### `App.tsx` — the days registry

```tsx
const days = [
  {
    day: 1,
    title: "A Simple Button",
    description: "Crafting a satisfying button press with scale.",
    component: <Day01 />,
  },
  // add new entries here
]
```

---

## How to add Day N

1. Create `src/days/DayNN.tsx` — export a default component, no props needed.
2. Import it in `App.tsx` and add an entry to `days[]`.
3. Update title and description in the `days[]` entry.

That's it. The wrapper, layout, and spacing are handled automatically.

---

## Conventions

- Comments: `//` style only — no `/* */` block comments in TSX files
- No default exports with `export default function` — use `const Foo = () =>` then `export default Foo`
- Each day's file is self-contained — no shared state or context between days
- Day-specific colors (e.g. `bg-blue-500` in Day 01) are fine inline — the
  design token palette is for the chrome (header, wrapper, stage background),
  not the components themselves
- The `motion` package is installed and ready — import from `"motion/react"` for
  React components

---

## Commands

```bash
npm run dev      # start dev server (localhost:5173)
npm run build    # production build
npm run preview  # preview production build locally
```
