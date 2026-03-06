import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── Palette texture ─────────────────────────────────────────────────────────
// Builds a 512×1 canvas gradient in Stripe's color palette:
// dark navy → blurple → cyan → pink → blurple → dark navy
function createPaletteTexture(): THREE.CanvasTexture {
  const cvs = document.createElement("canvas");
  cvs.width = 512;
  cvs.height = 1;
  const ctx = cvs.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, "#C4CCFF"); // soft periwinkle
  g.addColorStop(0.25, "#FFA030"); // warm amber
  g.addColorStop(0.48, "#FF3575"); // hot pink
  g.addColorStop(0.64, "#FF5540"); // coral
  g.addColorStop(0.82, "#8030D8"); // vivid purple
  g.addColorStop(1, "#C4CCFF"); // back to periwinkle
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 1);
  return new THREE.CanvasTexture(cvs);
}

// ── Vertex shader ────────────────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  attribute vec3 tangent;

  uniform float u_time;
  uniform float u_speed;
  uniform vec2 u_resolution;
  uniform float u_twistFrequencyX;
  uniform float u_twistFrequencyY;
  uniform float u_twistFrequencyZ;
  uniform float u_spinSpeed;
  uniform float u_twistPowerY;
  uniform float u_displaceFrequencyX;
  uniform float u_displaceFrequencyZ;
  uniform float u_displaceAmount;

  varying vec2 v_uv;
  varying vec3 v_position;
  varying vec4 v_clipPosition;
  varying vec2 v_resolution;

  // ── xxhash / simplex noise ───────────────────────────────────────────────
  float xxhash(vec2 x) {
    uvec2 t = floatBitsToUint(x);
    uint h = 0xc2b2ae3du * t.x + 0x165667b9u;
    h = (h << 17u | h >> 15u) * 0x27d4eb2fu;
    h += 0xc2b2ae3du * t.y;
    h = (h << 17u | h >> 15u) * 0x27d4eb2fu;
    h ^= h >> 15u;
    h *= 0x85ebca77u;
    h ^= h >> 13u;
    h *= 0xc2b2ae3du;
    h ^= h >> 16u;
    return uintBitsToFloat(h >> 9u | 0x3f800000u) - 1.0;
  }

  vec2 hash(vec2 x) {
    float k = 6.283185307 * xxhash(x);
    return vec2(cos(k), sin(k));
  }

  float simplexNoise(in vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(32.99));
  }

  // ── Shaping / utility functions ──────────────────────────────────────────
  float expStep(float x, float n) {
    return exp2(-exp2(n) * pow(x, n));
  }

  float mapLinear(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(
      oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
      0.0, 0.0, 0.0, 1.0
    );
  }

  // ── Displacement ─────────────────────────────────────────────────────────
  vec3 displace(vec2 uv, vec3 position, float time, float frequencyX, float frequencyY, float amount) {
    float noise = simplexNoise(vec2(position.x * frequencyX + time, position.z * frequencyY + time));
    position.y += amount * noise;
    return position;
  }

  void main(void) {
    v_uv = uv;
    v_resolution = u_resolution;

    // rotationA: cross-width tilt for ribbon thickness illusion
    mat4 rotationA = rotationMatrix(vec3(0.5, 0.0, 0.5), u_twistFrequencyY * expStep(v_uv.x, u_twistPowerY));
    // rotationB: primary twizzler twist — linear ramp along ribbon length
    mat4 rotationB = rotationMatrix(vec3(0.0, 1.0, 0.0), u_twistFrequencyX * v_uv.y + u_time * u_spinSpeed);
    // rotationC: secondary axis bend — also linear along length
    mat4 rotationC = rotationMatrix(vec3(1.0, 0.0, 0.0), u_twistFrequencyZ * v_uv.y);

    vec3 displacedPosition = displace(uv, position.xyz, u_time * u_speed, u_displaceFrequencyX, u_displaceFrequencyZ, u_displaceAmount);

    v_position = displacedPosition;
    v_position = (vec4(v_position, 1.0) * rotationA).xyz;
    v_position = (vec4(v_position, 1.0) * rotationB).xyz;
    v_position = (vec4(v_position, 1.0) * rotationC).xyz;

    v_clipPosition = projectionMatrix * modelViewMatrix * vec4(v_position, 1.0);
    gl_Position = v_clipPosition;
  }
`;

// ── Fragment shader ──────────────────────────────────────────────────────────
const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 v_uv;
  varying vec3 v_position;
  varying vec2 v_resolution;

  uniform sampler2D u_paletteTexture;
  uniform float u_colorSaturation;
  uniform float u_colorContrast;
  uniform float u_colorHueShift;
  uniform float u_glowAmount;
  uniform float u_glowPower;
  uniform float u_glowRamp;
  uniform float u_shimmerStrength;
  uniform float u_shimmerPower;
  uniform float u_time;
  uniform float u_speed;
  uniform float u_displaceFrequencyX;

  // ── xxhash / simplex noise ───────────────────────────────────────────────
  float xxhash(vec2 x) {
    uvec2 t = floatBitsToUint(x);
    uint h = 0xc2b2ae3du * t.x + 0x165667b9u;
    h = (h << 17u | h >> 15u) * 0x27d4eb2fu;
    h += 0xc2b2ae3du * t.y;
    h = (h << 17u | h >> 15u) * 0x27d4eb2fu;
    h ^= h >> 15u;
    h *= 0x85ebca77u;
    h ^= h >> 13u;
    h *= 0xc2b2ae3du;
    h ^= h >> 16u;
    return uintBitsToFloat(h >> 9u | 0x3f800000u) - 1.0;
  }

  vec2 hash(vec2 x) {
    float k = 6.283185307 * xxhash(x);
    return vec2(cos(k), sin(k));
  }

  float simplexNoise(in vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(32.99));
  }

  // ── Shaping / color functions ─────────────────────────────────────────────
  float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
  }

  float mapLinear(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  vec3 contrast(in vec3 v, in float a) {
    return (v - 0.5) * a + 0.5;
  }

  vec3 desaturate(vec3 color, float factor) {
    vec3 lum = vec3(0.299, 0.587, 0.114);
    vec3 gray = vec3(dot(lum, color));
    return mix(color, gray, factor);
  }

  vec3 hueShift(vec3 color, float shift) {
    vec3 gray = vec3(0.57735);
    vec3 projection = gray * dot(gray, color);
    vec3 U = color - projection;
    vec3 V = cross(gray, U);
    return U * cos(shift) + V * sin(shift) + projection;
  }

  // ── Surface color ─────────────────────────────────────────────────────────
  vec3 surfaceColor(vec2 uv, vec3 pos, float pdy) {
    vec3 color = texture2D(u_paletteTexture, vec2(uv.x, uv.y)).rgb;

    float p = 1.0 - parabola(uv.x, 3.0);
    float n0 = simplexNoise(vec2(v_uv.x * 0.1, v_uv.y * 0.5));
    float n1 = simplexNoise(vec2(v_uv.x * (600.0 + (300.0 * n0)), v_uv.y * 4.0 * n0));
    n1 = mapLinear(n1, -1.0, 1.0, 0.0, 1.0);

    vec3 textureColor = color;
    textureColor += (n1 * 0.2 * (1.0 - textureColor.b * 0.9) * pdy * p);
    color = textureColor;
    return color;
  }

  void main(void) {
    vec2 dy = dFdy(v_uv);
    float pdy = dy.y * v_resolution.y * u_glowAmount;
    pdy = mapLinear(pdy, -1.0, 1.0, 0.0, 1.0);
    pdy = clamp(pdy, 0.0, 1.0);
    pdy = pow(pdy, u_glowPower);
    pdy = smoothstep(0.0, u_glowRamp, pdy);
    pdy = clamp(pdy, 0.0, 1.0);

    vec4 color = vec4(surfaceColor(v_uv, v_position, pdy), 1.0);

    color.rgb = contrast(color.rgb, u_colorContrast);
    color.rgb = desaturate(color.rgb, 1.0 - u_colorSaturation);
    color.rgb = hueShift(color.rgb, u_colorHueShift);

    // Shimmer: sample the same noise as the vertex displacement so peaks are smooth
    // (dFdx/dFdy are per-triangle constants and show polygon edges)
    float localX = (v_uv.x - 0.5) * 10.0;
    float dispNoise = simplexNoise(vec2(localX * u_displaceFrequencyX + u_time * u_speed,
                                        u_time * u_speed));
    float shimmer = pow(clamp(dispNoise, 0.0, 1.0), u_shimmerPower) * u_shimmerStrength;

    color += (1.0 - pdy) * 0.25;
    color.rgb += shimmer;
    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`;

// ── Inner R3F scene ───────────────────────────────────────────────────────────
// Must live inside <Canvas> to access R3F context hooks.
function RibbonScene() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const paletteTexture = useMemo(() => createPaletteTexture(), []);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_speed: { value: 0.1 },
      u_resolution: { value: new THREE.Vector2(size.width, size.height) },
      // twist
      u_twistFrequencyX: { value: 18.56 },
      u_twistFrequencyY: { value: 0.3 },
      u_twistFrequencyZ: { value: 0.6 },
      u_spinSpeed: { value: 0.175 },
      u_twistPowerY: { value: 3.5 },
      // displacement
      u_displaceFrequencyX: { value: 1.25 },
      u_displaceFrequencyZ: { value: 1.25 },
      u_displaceAmount: { value: 1.0 },
      // textures
      u_paletteTexture: { value: paletteTexture },
      // color grading
      u_colorSaturation: { value: 1.2 },
      u_colorContrast: { value: 1.0 },
      u_colorHueShift: { value: 0.0 },
      // glow
      u_glowAmount: { value: 1.0 },
      u_glowPower: { value: 0.6 },
      u_glowRamp: { value: 1.0 },
      u_shimmerStrength: { value: 0.6 },
      u_shimmerPower: { value: 12.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paletteTexture],
  );

  // Keep u_resolution in sync with canvas size
  useEffect(() => {
    if (matRef.current) {
      matRef.current.uniforms.u_resolution.value.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  // Advance time uniform every frame
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[3, 0, 0]} rotation={[0, 0, 0.5]}>
      <planeGeometry args={[10, 75, 256, 256]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Day 05 export ─────────────────────────────────────────────────────────────
const Day05 = () => (
  // isolation: isolate creates a stacking context so z-index: -1 on the Canvas
  // keeps it behind any future overlay content within this container.
  <div
    style={{
      width: "100%",
      height: "480px",
      position: "relative",
      isolation: "isolate",
    }}
  >
    <Canvas
      style={{ position: "absolute", inset: 0, zIndex: -1 }}
      dpr={[1, 2]}
      camera={{ position: [0, -2, 10], fov: 75 }}
    >
      <RibbonScene />
    </Canvas>
  </div>
);

export default Day05;
