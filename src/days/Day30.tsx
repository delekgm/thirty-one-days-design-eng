import { Suspense, useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// ── Images ────────────────────────────────────────────────────────────────────

// Replace these with any CORS-enabled image URLs (Pexels, Unsplash, etc.)
const IMAGES = [
  "https://picsum.photos/seed/depth1/600/750",
  "https://picsum.photos/seed/depth2/600/750",
  "https://picsum.photos/seed/depth3/600/750",
  "https://picsum.photos/seed/depth4/600/750",
  "https://picsum.photos/seed/depth5/600/750",
];

// Kick off texture loading immediately so they're ready when Canvas mounts
useTexture.preload(IMAGES);

// ── Constants ─────────────────────────────────────────────────────────────────

const PLANE_GAP = 5; // z-world-units between planes
const PLANE_W = 3.0; // plane width in world units
const PLANE_H = 3.75; // plane height in world units (4:5)
const PLANE_OFFSET_X = 2.0; // left/right stagger per alternating plane
const CAMERA_Z_START = 6; // camera z at scroll=0
// Extra end travel so the previous plane is fully gone when the gallery stops.
const END_SCROLL_PADDING = Math.max(CAMERA_Z_START / PLANE_GAP - 1, 0);
const MAX_SCROLL = IMAGES.length - 1 + END_SCROLL_PADDING;
const INITIAL_SCROLL = MAX_SCROLL * 0.05;

const SCROLL_SPEED = 0.004; // wheel delta → scroll units (lower = heavier)
const TOUCH_SPEED = 0.004; // touch pixel delta → scroll units
const LERP_SCROLL = 0.05; // scroll smoothing (lower = more momentum/friction)
const LERP_BREATH = 0.12; // breath animation smoothing
const LERP_PARALLAX = 0.08; // parallax smoothing

const VELOCITY_CLAMP = 0.2; // max smoothed velocity magnitude

const BREATH_SCALE = 0.04; // max extra scale fraction from velocity
const BREATH_TILT = 0.05; // max x-rotation (radians) from velocity

const PARALLAX_X = 0.16; // horizontal displacement strength
const PARALLAX_Y = 0.08; // vertical displacement strength

// ── Utilities ─────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function smoothstep01(t: number): number {
  return t * t * (3 - 2 * t);
}

// Fade-in for a plane given camera→plane distance (positive = camera is in front).
// Starts at distance 11 and reaches full opacity by distance 6.
function planeFadeIn(distance: number): number {
  const fadeInT = clamp((11 - distance) / 5, 0, 1);
  return smoothstep01(fadeInT);
}

// Opacity for a plane given camera→plane distance (positive = camera is in front).
// Fades in from distance 11→6 so the next image starts appearing as soon as
// the current one begins to move away, then fades out from 3→0.
function planeOpacity(distance: number): number {
  if (distance <= 0) return 0;
  const fadeIn = planeFadeIn(distance);
  const t = clamp(distance / 3, 0, 1);
  const fadeOut = smoothstep01(t);
  return fadeIn * fadeOut;
}

// ── Types ─────────────────────────────────────────────────────────────────────

// Input from the DOM layer — Gallery only reads this, never writes
interface Input {
  scrollTarget: number;
  mouseX: number;
  mouseY: number;
}

// Internal animation state — owned and mutated only by Gallery
interface Anim {
  scrollCurrent: number;
  prevScroll: number;
  velocitySmooth: number;
  parallaxX: number;
  parallaxY: number;
  breathScale: number;
  breathTilt: number;
}

// ── ImagePlane ────────────────────────────────────────────────────────────────

function ImagePlane({
  url,
  index,
  anim,
}: {
  url: string;
  index: number;
  anim: { current: Anim | null };
}) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const texture = useTexture(url);

  useFrame(() => {
    const mesh = meshRef.current;
    const a = anim.current;
    if (!mesh || !a) return;

    // Camera z derived from current scroll
    const cameraZ = CAMERA_Z_START - a.scrollCurrent * PLANE_GAP;
    const planeZ = -index * PLANE_GAP;
    const distance = cameraZ - planeZ;

    // Fade opacity based on distance from camera
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = planeOpacity(distance);

    // Alternating left/right base position + parallax offset on top
    const baseX = index % 2 === 0 ? -PLANE_OFFSET_X : PLANE_OFFSET_X;
    mesh.position.set(baseX + a.parallaxX, a.parallaxY, planeZ);

    // Velocity-driven breath: scale swell + forward tilt
    mesh.scale.setScalar(1 + a.breathScale);
    mesh.rotation.x = a.breathTilt;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -index * PLANE_GAP]}>
      <planeGeometry args={[PLANE_W, PLANE_H]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Gallery (owns camera movement + animation state) ──────────────────────────

function Gallery({
  input,
  onProgress,
}: {
  input: { current: Input };
  onProgress: (scroll: number) => void;
}) {
  // Animation state is owned here — local refs avoid triggering immutability lint rules
  const anim = useRef<Anim>({
    scrollCurrent: INITIAL_SCROLL,
    prevScroll: INITIAL_SCROLL,
    velocitySmooth: 0,
    parallaxX: 0,
    parallaxY: 0,
    breathScale: 0,
    breathTilt: 0,
  });

  // state.camera comes from the useFrame callback arg — safe to mutate
  useFrame((state) => {
    const a = anim.current;
    const inp = input.current;

    // 1. Smooth scroll toward target
    a.prevScroll = a.scrollCurrent;
    a.scrollCurrent = lerp(a.scrollCurrent, inp.scrollTarget, LERP_SCROLL);

    // 2. Velocity: frame-to-frame scroll delta, scaled to ±1 range and smoothed
    const rawVel = (a.scrollCurrent - a.prevScroll) * 100;
    a.velocitySmooth = lerp(a.velocitySmooth, rawVel, 0.12);
    const vel = clamp(a.velocitySmooth, -VELOCITY_CLAMP, VELOCITY_CLAMP);

    // 3. Move camera along the Z tunnel
    state.camera.position.z = CAMERA_Z_START - a.scrollCurrent * PLANE_GAP;

    // 4. Parallax: smooth toward mouse position
    a.parallaxX = lerp(a.parallaxX, inp.mouseX * PARALLAX_X, LERP_PARALLAX);
    a.parallaxY = lerp(a.parallaxY, inp.mouseY * PARALLAX_Y, LERP_PARALLAX);

    // 5. Breath: velocity drives scale swell and forward tilt
    a.breathScale = lerp(
      a.breathScale,
      (Math.abs(vel) / VELOCITY_CLAMP) * BREATH_SCALE,
      LERP_BREATH,
    );
    a.breathTilt = lerp(
      a.breathTilt,
      (vel / VELOCITY_CLAMP) * BREATH_TILT,
      LERP_BREATH,
    );

    onProgress(a.scrollCurrent);
  });

  return (
    <>
      {IMAGES.map((url, i) => (
        <ImagePlane key={url} url={url} index={i} anim={anim} />
      ))}
    </>
  );
}

// ── Day30 ─────────────────────────────────────────────────────────────────────

const Day30 = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heroCopyRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef(0);

  // Input ref: Day30 writes, Gallery reads — plain object ref avoids lint issues
  const input = useRef<Input>({
    scrollTarget: INITIAL_SCROLL,
    mouseX: 0,
    mouseY: 0,
  });

  // Update progress dots directly via DOM — no React state, no re-renders
  const onProgress = useCallback((scroll: number) => {
    dotRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = Math.abs(i - scroll);
      el.style.opacity = String(clamp(1 - dist * 1.5, 0.15, 1));
      el.style.transform = `scale(${dist < 0.4 ? 1.5 : 1})`;
    });

    if (heroCopyRef.current) {
      const secondPlaneDistance =
        CAMERA_Z_START - scroll * PLANE_GAP + PLANE_GAP;
      heroCopyRef.current.style.opacity = String(
        1 - planeFadeIn(secondPlaneDistance),
      );
    }
  }, []);

  // Capture wheel events with passive:false so we can preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const inp = input.current;
      inp.scrollTarget = clamp(
        inp.scrollTarget + e.deltaY * SCROLL_SPEED,
        0,
        MAX_SCROLL,
      );
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Normalize pointer position to -1…+1
    input.current.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    input.current.mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const onPointerLeave = () => {
    input.current.mouseX = 0;
    input.current.mouseY = 0;
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const delta = touchStartY.current - e.touches[0].clientY;
    touchStartY.current = e.touches[0].clientY;
    const inp = input.current;
    inp.scrollTarget = clamp(
      inp.scrollTarget + delta * TOUCH_SPEED,
      0,
      MAX_SCROLL,
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none touch-none"
      style={{ height: 500 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* Three.js canvas — fills the container */}
      <Canvas
        camera={{ position: [0, 0, CAMERA_Z_START], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <Gallery input={input} onProgress={onProgress} />
        </Suspense>
      </Canvas>

      <div
        ref={heroCopyRef}
        className="pointer-events-none absolute top-1/2 right-16 sm:right-48 max-w-36 -translate-y-1/2 text-left text-ink"
        style={{
          opacity:
            1 -
            planeFadeIn(
              CAMERA_Z_START - INITIAL_SCROLL * PLANE_GAP + PLANE_GAP,
            ),
        }}
      >
        <p className="font-headline text-3xl leading-[0.88] italic sm:text-4xl">
          Passing
          <br />
          Light
        </p>
      </div>

      {/* Scroll-progress dots */}
      {/* <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none bg-gray-500/40 rounded-full p-3">
        {IMAGES.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            className="w-1.5 h-1.5 rounded-full bg-white transition-transform duration-150"
            style={{ opacity: i === 0 ? 1 : 0.15 }}
          />
        ))}
      </div> */}
    </div>
  );
};

export default Day30;
