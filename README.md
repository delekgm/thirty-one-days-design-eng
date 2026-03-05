# 31 Days of Design Engineering

A daily design engineering challenge for March 2026. Each day, one tuned component or interaction — designed and engineered from scratch.

## Stack

- **React** + **TypeScript** — component authoring
- **Vite** — dev server and build tooling
- **Tailwind v4** — CSS-first utility styling via `@tailwindcss/vite` (no config file)
- **Motion** — animations and interactions
- **Google Fonts** — Instrument Serif (italic, headlines) + Inter (body)

## Getting started

```bash
npm install
npm run dev
```

## Project structure

```
src/
├── index.css           ← Tailwind v4 @theme tokens (OKLCH colors + fonts)
├── main.tsx            ← untouched
├── App.tsx             ← days[] registry — add each new day here
├── components/
│   ├── Header.tsx      ← "31 Days of Design Engineering" title
│   └── DayWrapper.tsx  ← reusable day section with metadata + stage
└── days/
    └── Day01.tsx       ← placeholder — replace with your Day 1 component
```

## Adding each new day

1. Create `src/days/DayNN.tsx` with your component
2. Add one entry to the `days` array in `App.tsx`:

```tsx
{ day: 2, title: 'Your Title', description: 'What you built.', component: <Day02 /> }
```

## Color tokens

Extend the palette by adding new `--color-*` variables inside `@theme {}` in `src/index.css`. Each variable automatically generates Tailwind utilities (`bg-*`, `text-*`, `border-*`).

| Variable          | Role                  |
| ----------------- | --------------------- |
| `--color-canvas`  | page background       |
| `--color-surface` | day stage background  |
| `--color-ink`     | primary text          |
| `--color-muted`   | meta / secondary text |
| `--color-line`    | borders               |
| `--color-accent`  | accent color          |

All colors use **OKLCH** for perceptual uniformity. To re-theme the site, adjust the chroma and hue of `--color-accent`.

Option B: React Three Fiber (declarative, more ergonomic)

npm install three @react-three/fiber @react-three/drei
npm install -D @types/three

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh } from "three";

const Knot = () => {
const ref = useRef<Mesh>(null!);
useFrame((\_, delta) => {
ref.current.rotation.x += delta _ 0.5;
ref.current.rotation.y += delta _ 0.5;
});
return (
<mesh ref={ref}>
<torusKnotGeometry args={[0.8, 0.25, 120, 16]} />
<meshNormalMaterial />
</mesh>
);
};

const DayNN = () => (
<Canvas camera={{ position: [0, 0, 3] }}>
<Knot />
</Canvas>
);

export default DayNN;
