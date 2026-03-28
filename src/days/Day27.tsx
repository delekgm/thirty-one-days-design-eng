import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── TouchTexture ────────────────────────────────────────────────────────────
// Generates a canvas-based texture that encodes mouse velocity + intensity.
// The GPU shader samples this to produce water-like distortion.
interface TrailPoint {
  x: number;
  y: number;
  age: number;
  force: number;
  vx: number;
  vy: number;
}

class TouchTexture {
  size = 64;
  width = 64;
  height = 64;
  maxAge = 64;
  radius: number;
  speed: number;
  trail: TrailPoint[] = [];
  last: { x: number; y: number } | null = null;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  texture!: THREE.Texture;

  constructor() {
    this.radius = 0.25 * this.size;
    this.speed = 1 / this.maxAge;
    this.initTexture();
  }

  initTexture() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.clear();
    const speed = this.speed;
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i];
      const f = point.force * speed * (1 - point.age / this.maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > this.maxAge) {
        this.trail.splice(i, 1);
      } else {
        this.drawPoint(point);
      }
    }
    this.texture.needsUpdate = true;
  }

  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addTouch(point: { x: number; y: number }) {
    let force = 0;
    let vx = 0;
    let vy = 0;
    const last = this.last;
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      const d = Math.sqrt(dd);
      vx = dx / d;
      vy = dy / d;
      force = Math.min(dd * 20000, 2.0);
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  drawPoint(point: TrailPoint) {
    const pos = {
      x: point.x * this.width,
      y: (1 - point.y) * this.height,
    };

    let intensity: number;
    if (point.age < this.maxAge * 0.3) {
      intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
    } else {
      const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
      intensity = -t * (t - 2);
    }
    intensity *= point.force;

    const radius = this.radius;
    const color = `${((point.vx + 1) / 2) * 255}, ${
      ((point.vy + 1) / 2) * 255
    }, ${intensity * 255}`;
    const offset = this.size * 5;
    this.ctx.shadowOffsetX = offset;
    this.ctx.shadowOffsetY = offset;
    this.ctx.shadowBlur = radius * 1;
    this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;

    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,1)";
    this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  dispose() {
    this.texture.dispose();
  }
}

// ── Shaders ─────────────────────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vec3 pos = position.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
    vUv = uv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform vec3 uColor5;
  uniform vec3 uColor6;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform sampler2D uTouchTexture;
  uniform float uGrainIntensity;
  uniform float uZoom;
  uniform vec3 uDarkNavy;
  uniform float uGradientSize;
  uniform float uGradientCount;
  uniform float uColor1Weight;
  uniform float uColor2Weight;
  uniform float uWarpStrength;
  uniform float uWarpSpeed;
  uniform float uWarpScale;

  varying vec2 vUv;

  #define PI 3.14159265359

  // ── Simplex-style 2D noise for liquid domain warping ──────────────────────
  // Permutation helper
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,   // (3.0-sqrt(3.0))/6.0
      0.366025403784439,   // 0.5*(sqrt(3.0)-1.0)
     -0.577350269189626,   // -1.0 + 2.0 * C.x
      0.024390243902439    // 1.0 / 41.0
    );
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Two-layer domain warp — distorts UV so the gradient feels liquid
  vec2 liquidWarp(vec2 uv, float time) {
    float t = time * uWarpSpeed;
    // First warp layer — large, slow swirl
    float wx = snoise(uv * uWarpScale + vec2(t * 0.7, -t * 0.5));
    float wy = snoise(uv * uWarpScale + vec2(-t * 0.6, t * 0.8) + 50.0);
    // Second warp layer — finer detail, faster (2× the base scale)
    wx += snoise(uv * uWarpScale * 2.0 + vec2(t * 1.1, t * 0.9) + 100.0) * 0.4;
    wy += snoise(uv * uWarpScale * 2.0 + vec2(-t * 0.8, t * 1.2) + 150.0) * 0.4;
    return uv + vec2(wx, wy) * uWarpStrength;
  }

  // Film grain
  float grain(vec2 uv, float time) {
    vec2 grainUv = uv * uResolution * 0.5;
    float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
    return grainValue * 2.0 - 1.0;
  }

  vec3 getGradientColor(vec2 uv, float time) {
    float gradientRadius = uGradientSize;

    // 12 animated gradient centers with different orbital speeds
    vec2 center1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
    vec2 center2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
    vec2 center3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
    vec2 center4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
    vec2 center5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
    vec2 center6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);
    vec2 center7 = vec2(0.5 + sin(time * uSpeed * 0.55) * 0.38, 0.5 + cos(time * uSpeed * 0.48) * 0.42);
    vec2 center8 = vec2(0.5 + cos(time * uSpeed * 0.65) * 0.36, 0.5 + sin(time * uSpeed * 0.52) * 0.44);
    vec2 center9 = vec2(0.5 + sin(time * uSpeed * 0.42) * 0.41, 0.5 + cos(time * uSpeed * 0.58) * 0.39);
    vec2 center10 = vec2(0.5 + cos(time * uSpeed * 0.48) * 0.37, 0.5 + sin(time * uSpeed * 0.62) * 0.43);
    vec2 center11 = vec2(0.5 + sin(time * uSpeed * 0.68) * 0.33, 0.5 + cos(time * uSpeed * 0.44) * 0.46);
    vec2 center12 = vec2(0.5 + cos(time * uSpeed * 0.38) * 0.39, 0.5 + sin(time * uSpeed * 0.56) * 0.41);

    float dist1 = length(uv - center1);
    float dist2 = length(uv - center2);
    float dist3 = length(uv - center3);
    float dist4 = length(uv - center4);
    float dist5 = length(uv - center5);
    float dist6 = length(uv - center6);
    float dist7 = length(uv - center7);
    float dist8 = length(uv - center8);
    float dist9 = length(uv - center9);
    float dist10 = length(uv - center10);
    float dist11 = length(uv - center11);
    float dist12 = length(uv - center12);

    float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
    float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
    float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
    float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
    float influence5 = 1.0 - smoothstep(0.0, gradientRadius, dist5);
    float influence6 = 1.0 - smoothstep(0.0, gradientRadius, dist6);
    float influence7 = 1.0 - smoothstep(0.0, gradientRadius, dist7);
    float influence8 = 1.0 - smoothstep(0.0, gradientRadius, dist8);
    float influence9 = 1.0 - smoothstep(0.0, gradientRadius, dist9);
    float influence10 = 1.0 - smoothstep(0.0, gradientRadius, dist10);
    float influence11 = 1.0 - smoothstep(0.0, gradientRadius, dist11);
    float influence12 = 1.0 - smoothstep(0.0, gradientRadius, dist12);

    // Rotating UV layers for depth
    vec2 rotatedUv1 = uv - 0.5;
    float angle1 = time * uSpeed * 0.15;
    rotatedUv1 = vec2(
      rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
      rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
    );
    rotatedUv1 += 0.5;

    vec2 rotatedUv2 = uv - 0.5;
    float angle2 = -time * uSpeed * 0.12;
    rotatedUv2 = vec2(
      rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
      rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
    );
    rotatedUv2 += 0.5;

    float radialGradient1 = length(rotatedUv1 - 0.5);
    float radialGradient2 = length(rotatedUv2 - 0.5);
    float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, radialGradient1);
    float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, radialGradient2);

    // Blend colors with dynamic intensities
    vec3 color = vec3(0.0);
    color += uColor1 * influence1 * (0.55 + 0.45 * sin(time * uSpeed)) * uColor1Weight;
    color += uColor2 * influence2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * uColor2Weight;
    color += uColor3 * influence3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * uColor1Weight;
    color += uColor4 * influence4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * uColor2Weight;
    color += uColor5 * influence5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * uColor1Weight;
    color += uColor6 * influence6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * uColor2Weight;

    // Extra centers when uGradientCount > 6
    if (uGradientCount > 6.0) {
      color += uColor1 * influence7 * (0.55 + 0.45 * sin(time * uSpeed * 1.4)) * uColor1Weight;
      color += uColor2 * influence8 * (0.55 + 0.45 * cos(time * uSpeed * 1.5)) * uColor2Weight;
      color += uColor3 * influence9 * (0.55 + 0.45 * sin(time * uSpeed * 1.6)) * uColor1Weight;
      color += uColor4 * influence10 * (0.55 + 0.45 * cos(time * uSpeed * 1.7)) * uColor2Weight;
    }
    if (uGradientCount > 10.0) {
      color += uColor5 * influence11 * (0.55 + 0.45 * sin(time * uSpeed * 1.8)) * uColor1Weight;
      color += uColor6 * influence12 * (0.55 + 0.45 * cos(time * uSpeed * 1.9)) * uColor2Weight;
    }

    // Radial overlays
    color += mix(uColor1, uColor3, radialInfluence1) * 0.45 * uColor1Weight;
    color += mix(uColor2, uColor4, radialInfluence2) * 0.4 * uColor2Weight;

    color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;

    // Enhanced saturation
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luminance), color, 1.35);
    color = pow(color, vec3(0.92));

    // Navy blue base for low-intensity areas
    float brightness1 = length(color);
    float mixFactor1 = max(brightness1 * 1.2, 0.15);
    color = mix(uDarkNavy, color, mixFactor1);

    // Cap max brightness
    float maxBrightness = 1.0;
    float brightness = length(color);
    if (brightness > maxBrightness) {
      color = color * (maxBrightness / brightness);
    }

    return color;
  }

  void main() {
    vec2 uv = vUv;

    // Continuous liquid domain warp — always active, gives the gradient a fluid feel
    uv = liquidWarp(uv, uTime);

    // Water distortion from touch texture (layered on top of liquid warp)
    vec4 touchTex = texture2D(uTouchTexture, vUv);
    float vx = -(touchTex.r * 2.0 - 1.0);
    float vy = -(touchTex.g * 2.0 - 1.0);
    float intensity = touchTex.b;
    uv.x += vx * 0.8 * intensity;
    uv.y += vy * 0.8 * intensity;

    // Ripple + wave effect
    vec2 center = vec2(0.5);
    float dist = length(uv - center);
    float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * intensity;
    float wave = sin(dist * 15.0 - uTime * 2.0) * 0.03 * intensity;
    uv += vec2(ripple + wave);

    vec3 color = getGradientColor(uv, uTime);

    // Film grain
    float grainValue = grain(uv, uTime);
    color += grainValue * uGrainIntensity;

    // Subtle color shifting
    float timeShift = uTime * 0.5;
    color.r += sin(timeShift) * 0.02;
    color.g += cos(timeShift * 1.4) * 0.02;
    color.b += sin(timeShift * 1.2) * 0.02;

    // Navy blue base for low-intensity areas
    float brightness2 = length(color);
    float mixFactor2 = max(brightness2 * 1.2, 0.15);
    color = mix(uDarkNavy, color, mixFactor2);

    color = clamp(color, vec3(0.0), vec3(1.0));

    // Cap max brightness
    float maxBrightness = 1.0;
    float brightness = length(color);
    if (brightness > maxBrightness) {
      color = color * (maxBrightness / brightness);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ── Helper: compute view-space plane size to fill the camera frustum ────────
function getViewSize(camera: THREE.PerspectiveCamera) {
  const fovInRadians = (camera.fov * Math.PI) / 180;
  const height = Math.abs(camera.position.z * Math.tan(fovInRadians / 2) * 2);
  return { width: height * camera.aspect, height };
}

// ── Inner scene component (must live inside <Canvas>) ───────────────────────
function GradientScene({ touchTexture }: { touchTexture: TouchTexture }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera, size } = useThree();

  // Scheme 1 defaults: Orange + Navy Blue, with 12 gradient centers
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 }, // elapsed time in seconds
      uResolution: { value: new THREE.Vector2(size.width, size.height) }, // viewport size in px
      uColor1: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // #F15A22 — orange (odd centers)
      uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // #0a0e27 — navy (even centers)
      uColor3: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // #F15A22 — orange (center 3)
      uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // #0a0e27 — navy (center 4)
      uColor5: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // #F15A22 — orange (center 5)
      uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // #0a0e27 — navy (center 6)
      uSpeed: { value: 0.5 }, // orbital speed multiplier for gradient centers
      uIntensity: { value: 1.8 }, // overall color brightness multiplier
      uTouchTexture: { value: touchTexture.texture }, // canvas texture encoding mouse velocity + intensity
      uGrainIntensity: { value: 0.03 }, // film grain strength (0 = none)
      uZoom: { value: 1.0 }, // UV scale factor (lower = more zoomed out)
      uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // base color for low-intensity areas
      uGradientSize: { value: 0.75 }, // smoothstep radius for each gradient blob
      uGradientCount: { value: 12.0 }, // how many gradient centers are active (6 / 10 / 12)
      uColor1Weight: { value: 0.5 }, // blend weight for odd-color centers (orange)
      uColor2Weight: { value: 1.8 }, // blend weight for even-color centers (navy)
      uWarpStrength: { value: 0.445 }, // continuous liquid warp amplitude
      uWarpSpeed: { value: 0.15 }, // how fast the warp field evolves
      uWarpScale: { value: 0.75 }, // noise frequency — lower = broader swirls, higher = tighter ripples
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Resize plane geometry to fill the camera frustum
  useEffect(() => {
    if (!meshRef.current) return;
    const viewSize = getViewSize(camera as THREE.PerspectiveCamera);
    meshRef.current.geometry.dispose();
    meshRef.current.geometry = new THREE.PlaneGeometry(
      viewSize.width,
      viewSize.height,
      1,
      1,
    );
    uniforms.uResolution.value.set(size.width, size.height);
  }, [camera, size, uniforms]); // uniforms is stable (useMemo), no need to track

  // Animation loop — update time + touch texture each frame
  useFrame((_, delta) => {
    const clamped = Math.min(delta, 0.1);
    touchTexture.update();
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += clamped;
    }
  });

  const viewSize = getViewSize(camera as THREE.PerspectiveCamera);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[viewSize.width, viewSize.height, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

// ── Day27 ───────────────────────────────────────────────────────────────────
const Day27 = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable instance — created once, never recreated across renders
  const touchTexture = useMemo(() => new TouchTexture(), []);

  // Mouse / touch handler — normalized 0-1 coordinates, matching CodePen
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    touchTexture.addTouch({ x, y });
  };

  // Cleanup texture on unmount
  useEffect(() => {
    return () => {
      touchTexture.dispose();
    };
  }, [touchTexture]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-120 sm:h-120"
      onPointerMove={onPointerMove}
      style={{ touchAction: "pan-y" }}
    >
      <Canvas
        className="absolute inset-0"
        gl={{
          antialias: true,
          alpha: false,
          stencil: false,
          depth: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        camera={{ fov: 45, position: [0, 0, 50], near: 0.1, far: 10000 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(0x0a0e27);
        }}
      >
        <GradientScene touchTexture={touchTexture} />
      </Canvas>
    </div>
  );
};

export default Day27;
