import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";

type CityNode = {
  id: string;
  lat: number;
  lon: number;
};

type ArcSpec = {
  from: string;
  to: string;
  delay: number;
};

type GlobeControls = {
  dragging: boolean;
  targetPitch: number;
  targetYaw: number;
  lastInteraction: number;
  pitchVelocity: number;
  yawVelocity: number;
  autoRotateBlend: number;
};

type DragState = {
  active: boolean;
  pitchVelocity: number;
  pointerId: number | null;
  time: number;
  x: number;
  yawVelocity: number;
  y: number;
};

type DragSignal = {
  kind: "idle" | "start" | "move" | "end";
  at: number;
  pitchDelta: number;
  pitchVelocity: number;
  yawDelta: number;
  yawVelocity: number;
};

type MaskData = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

type DotField = {
  geometry: THREE.BufferGeometry;
  count: number;
};

type ArcGeometryData = {
  geometry: THREE.TubeGeometry;
};

const GLOBE_RADIUS = 1.34;
const DOT_RADIUS = 1.35;
const ARC_RADIUS = 1.395;
const INITIAL_PITCH = 0.28;
const INITIAL_YAW = -0.72;
const DRAG_SENSITIVITY = 0.0055;
const MAX_PITCH = 0.7;
const AUTO_ROTATE_SPEED = 0.12;
const AUTO_ROTATE_DELAY_MS = 1100;
const AUTO_ROTATE_EASE_IN = 2.2;
const AUTO_ROTATE_EASE_OUT = 10;
const DRAG_MOMENTUM_DAMPING = 4.4;
const PITCH_MOMENTUM_DAMPING = 6;
const POINTER_VELOCITY_BLEND = 0.35;
const LAND_MASK_TEXTURE = "/day18/8081_earthspec2k.jpg";
const LAND_MASK_INVERT = true;
const LAND_MASK_THRESHOLD = 120;
const DOT_CANDIDATE_COUNT = 80000;
const ACCENT_COLOR_VALUE = "rgb(43, 98, 239)";
const ARC_REVEAL_DURATION = 2.5;
const ARC_FADE_DURATION = 1.8;
const ARC_CYCLE_DURATION = ARC_REVEAL_DURATION + ARC_FADE_DURATION;
const MIN_SOURCE_ARC_GAP_SECONDS = 1;
const MIN_SOURCE_ARC_GAP = MIN_SOURCE_ARC_GAP_SECONDS / ARC_CYCLE_DURATION;
const MARKER_PULSE_HEAD_START = 0.02;
const MARKER_PULSE_HEAD_END = 0.34;
const MARKER_SECOND_RING_DELAY = 0.2;

const CITY_NODES: CityNode[] = [
  { id: "sf", lat: 37.7749, lon: -122.4194 },
  { id: "nyc", lat: 40.7128, lon: -74.006 },
  { id: "sao", lat: -23.5505, lon: -46.6333 },
  { id: "lon", lat: 51.5072, lon: -0.1276 },
  { id: "ams", lat: 52.3676, lon: 4.9041 },
  { id: "lag", lat: 6.5244, lon: 3.3792 },
  { id: "dub", lat: 25.2048, lon: 55.2708 },
  { id: "mum", lat: 19.076, lon: 72.8777 },
  { id: "sin", lat: 1.3521, lon: 103.8198 },
  { id: "tok", lat: 35.6764, lon: 139.65 },
  { id: "syd", lat: -33.8688, lon: 151.2093 },
];

const ARC_SPECS: ArcSpec[] = [
  { from: "sf", to: "tok", delay: 0.02 },
  { from: "nyc", to: "lon", delay: 0.38 },
  { from: "lon", to: "lag", delay: 0.71 },
  { from: "ams", to: "dub", delay: 0.12 },
  { from: "dub", to: "sin", delay: 0.43 },
  { from: "mum", to: "sin", delay: 0.64 },
  { from: "sin", to: "syd", delay: 0.84 },
  { from: "tok", to: "syd", delay: 0.28 },
  { from: "lon", to: "tok", delay: 0.97 },
  { from: "sao", to: "lag", delay: 0.5 },
];

const SCHEDULED_ARC_SPECS: ArcSpec[] = (() => {
  const lastDelayBySource = new Map<string, number>();

  return ARC_SPECS.map((spec) => {
    const lastDelay = lastDelayBySource.get(spec.from);
    const nextDelay =
      lastDelay === undefined
        ? spec.delay
        : Math.max(spec.delay, lastDelay + MIN_SOURCE_ARC_GAP);

    lastDelayBySource.set(spec.from, nextDelay);

    return {
      ...spec,
      delay: nextDelay,
    };
  });
})();

const oceanVertexShader = `
  varying vec3 vNormalWorld;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const oceanFragmentShader = `
  uniform float uTime;
  uniform float uMotion;

  varying vec3 vNormalWorld;
  varying vec3 vViewDirection;

  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormalWorld), normalize(vViewDirection)), 0.0), 2.5);
    float latitude = smoothstep(-0.65, 0.8, vNormalWorld.y);
    float shimmer = sin(uTime * 0.45 + vNormalWorld.y * 7.0 + vNormalWorld.x * 4.0) * 0.5 + 0.5;
    shimmer = mix(0.5, shimmer, uMotion);

    vec3 deep = vec3(0.32, 0.35, 0.40);
    vec3 shallow = vec3(0.56, 0.59, 0.64);
    vec3 glow = vec3(0.88, 0.90, 0.93);

    vec3 color = mix(deep, shallow, latitude);
    color += glow * fresnel * 0.32;
    color += vec3(0.08, 0.09, 0.11) * shimmer * 0.08;

    float alpha = 0.8 + fresnel * 0.18;
    gl_FragColor = vec4(color, alpha);
  }
`;

const atmosphereVertexShader = `
  varying vec3 vNormalWorld;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormalWorld;
  varying vec3 vViewDirection;

  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormalWorld), normalize(vViewDirection)), 0.0), 3.8);
    vec3 color = vec3(0.86, 0.88, 0.92) * fresnel;
    gl_FragColor = vec4(color, fresnel * 0.18);
  }
`;

const dotsVertexShader = `
  attribute float aPhase;
  attribute float aSize;
  attribute float aIntensity;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMotion;

  varying float vIntensity;
  varying float vTwinkle;
  varying float vVisibility;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 normalWorld = normalize(mat3(modelMatrix) * normalize(position));
    vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);
    float frontness = smoothstep(-0.12, 0.08, dot(normalWorld, viewDirection));
    float visibility = mix(0.18, 1.0, frontness);
    float twinkle = 0.9 + 0.1 * sin(uTime * 1.2 + aPhase);
    twinkle = mix(1.0, twinkle, uMotion);
    vTwinkle = twinkle;
    vIntensity = aIntensity;
    vVisibility = visibility;
    gl_PointSize = aSize * uPixelRatio * twinkle * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const dotsFragmentShader = `
  varying float vIntensity;
  varying float vTwinkle;
  varying float vVisibility;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float core = smoothstep(0.5, 0.0, dist);
    float bloom = smoothstep(0.55, 0.2, dist);
    vec3 base = mix(vec3(0.72, 0.75, 0.80), vec3(0.95, 0.96, 0.98), vIntensity);
    vec3 color = base * (0.96 + vTwinkle * 0.08);
    float alpha = (bloom * 0.08 + core * 0.64) * vVisibility;
    gl_FragColor = vec4(color, alpha);
  }
`;

const arcVertexShader = `
  varying vec2 vUv;
  varying float vVisibility;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec3 radialNormal = normalize(worldPosition.xyz);
    vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);
    float frontness = smoothstep(-0.1, 0.1, dot(radialNormal, viewDirection));
    vUv = uv;
    vVisibility = mix(0.14, 1.0, frontness);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const arcFragmentShader = `
  uniform vec3 uColor;
  uniform float uHead;
  uniform float uTail;

  varying vec2 vUv;
  varying float vVisibility;

  void main() {
    float body = pow(sin(vUv.x * 3.14159265), 0.9);
    float taper = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
    float edge = 0.05;
    float reveal = smoothstep(uTail, uTail + edge, vUv.x);
    float trim = 1.0 - smoothstep(uHead - edge, uHead, vUv.x);
    float segment = reveal * trim;
    vec3 color = uColor * (0.32 + body * 0.9) * mix(0.75, 1.0, vVisibility);
    float alpha = body * taper * segment * 0.7 * vVisibility;

    gl_FragColor = vec4(color, alpha);
  }
`;

const clampPitch = (pitch: number) =>
  THREE.MathUtils.clamp(pitch, -MAX_PITCH, MAX_PITCH);

const hash = (a: number, b: number, seed = 0) => {
  const sinValue = Math.sin(a * 127.1 + b * 311.7 + seed * 191.3) * 43758.5453;
  return sinValue - Math.floor(sinValue);
};

const latLonToVector = (lat: number, lon: number, radius: number) => {
  const latRad = THREE.MathUtils.degToRad(lat);
  const lonRad = THREE.MathUtils.degToRad(lon);
  const cosLat = Math.cos(latRad);

  return new THREE.Vector3(
    radius * cosLat * Math.sin(lonRad),
    radius * Math.sin(latRad),
    radius * cosLat * Math.cos(lonRad),
  );
};

const interpolateGreatArc = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  t: number,
) => {
  const from = start.clone().normalize();
  const to = end.clone().normalize();
  const dot = THREE.MathUtils.clamp(from.dot(to), -1, 1);
  const omega = Math.acos(dot);

  if (omega < 1e-5) {
    return from;
  }

  const sinOmega = Math.sin(omega);
  const scaleA = Math.sin((1 - t) * omega) / sinOmega;
  const scaleB = Math.sin(t * omega) / sinOmega;

  return from.multiplyScalar(scaleA).add(to.multiplyScalar(scaleB));
};

const createAccentColor = () => new THREE.Color(ACCENT_COLOR_VALUE);

const maskSample = (mask: MaskData, lat: number, lon: number) => {
  const x = Math.floor(
    THREE.MathUtils.euclideanModulo((lon + 180) / 360, 1) * (mask.width - 1),
  );
  const y = Math.floor(
    THREE.MathUtils.clamp((90 - lat) / 180, 0, 1) * (mask.height - 1),
  );
  const index = (y * mask.width + x) * 4;

  return mask.data[index];
};

const getImageDimension = (
  value: number | SVGAnimatedLength | undefined | null,
) => {
  if (typeof value === "number") return value;
  if (value?.baseVal) return value.baseVal.value;
  return 0;
};

const createMaskData = (
  image: HTMLImageElement | SVGImageElement | ImageBitmap,
) => {
  const width =
    "naturalWidth" in image && typeof image.naturalWidth === "number"
      ? image.naturalWidth
      : getImageDimension("width" in image ? image.width : 0);
  const height =
    "naturalHeight" in image && typeof image.naturalHeight === "number"
      ? image.naturalHeight
      : getImageDimension("height" in image ? image.height : 0);
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image as CanvasImageSource, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);

  return {
    data: imageData.data,
    width,
    height,
  } satisfies MaskData;
};

const createDotField = (mask: MaskData) => {
  const positions: number[] = [];
  const phases: number[] = [];
  const sizes: number[] = [];
  const intensities: number[] = [];
  const vector = new THREE.Vector3();

  for (let i = 0; i < DOT_CANDIDATE_COUNT; i += 1) {
    const t = i / (DOT_CANDIDATE_COUNT - 1);
    const phi = Math.acos(-1 + 2 * t);
    const theta = Math.sqrt(DOT_CANDIDATE_COUNT * Math.PI) * phi;

    vector.setFromSphericalCoords(DOT_RADIUS, phi, theta);

    const lat = 90 - THREE.MathUtils.radToDeg(phi);
    const lon = THREE.MathUtils.radToDeg(Math.atan2(vector.x, vector.z));
    const maskValue = maskSample(mask, lat, lon);
    const landValue = LAND_MASK_INVERT ? 255 - maskValue : maskValue;
    if (landValue < LAND_MASK_THRESHOLD) continue;

    positions.push(vector.x, vector.y, vector.z);
    phases.push(hash(i, 17, 4) * Math.PI * 2);
    sizes.push(0.055 + hash(i, 23, 5) * 0.03);
    intensities.push(0.7 + hash(i, 31, 6) * 0.12);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute(
    "aIntensity",
    new THREE.Float32BufferAttribute(intensities, 1),
  );

  return {
    geometry,
    count: positions.length / 3,
  } satisfies DotField;
};

const createArcGeometry = (from: CityNode, to: CityNode) => {
  const start = latLonToVector(from.lat, from.lon, ARC_RADIUS);
  const end = latLonToVector(to.lat, to.lon, ARC_RADIUS);
  const distance = start.distanceTo(end);
  const arcHeight = ARC_RADIUS + distance * 0.5;
  const controlA = interpolateGreatArc(start, end, 0.25).setLength(arcHeight);
  const controlB = interpolateGreatArc(start, end, 0.75).setLength(arcHeight);
  const curve = new THREE.CubicBezierCurve3(start, controlA, controlB, end);
  const geometry = new THREE.TubeGeometry(curve, 44, 0.0024, 8, false);

  return {
    geometry,
  } satisfies ArcGeometryData;
};

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
};

const Ocean = ({ motionEnabled }: { motionEnabled: boolean }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMotion: { value: motionEnabled ? 1 : 0 },
    }),
    [motionEnabled],
  );

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uMotion.value = motionEnabled ? 1 : 0;
  }, [motionEnabled]);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    if (!motionEnabled) return;
    material.uniforms.uTime.value += Math.min(delta, 0.033);
  });

  return (
    <>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.07, 48, 48]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
        />
      </mesh>
    </>
  );
};

const LandDots = ({ motionEnabled }: { motionEnabled: boolean }) => {
  const maskTexture = useTexture(LAND_MASK_TEXTURE);
  const maskData = useMemo(() => {
    const image = maskTexture.image as
      | HTMLImageElement
      | SVGImageElement
      | ImageBitmap
      | undefined;
    if (!image) return null;

    return createMaskData(image);
  }, [maskTexture.image]);

  const dotField = useMemo(() => {
    if (!maskData) return null;
    return createDotField(maskData);
  }, [maskData]);

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: {
        value:
          typeof window === "undefined"
            ? 1
            : Math.min(window.devicePixelRatio || 1, 1.5),
      },
      uMotion: { value: motionEnabled ? 1 : 0 },
    }),
    [motionEnabled],
  );

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uMotion.value = motionEnabled ? 1 : 0;
  }, [motionEnabled]);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    if (!motionEnabled) return;
    material.uniforms.uTime.value += Math.min(delta, 0.033);
  });

  useEffect(() => {
    return () => {
      dotField?.geometry.dispose();
    };
  }, [dotField]);

  if (!dotField || dotField.count === 0) return null;

  return (
    <points geometry={dotField.geometry} renderOrder={2}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={dotsVertexShader}
        fragmentShader={dotsFragmentShader}
      />
    </points>
  );
};

const ArcMesh = ({
  spec,
  from,
  to,
  motionEnabled,
}: {
  spec: ArcSpec;
  from: CityNode;
  to: CityNode;
  motionEnabled: boolean;
}) => {
  const arcData = useMemo(() => createArcGeometry(from, to), [from, to]);
  const accentColor = useMemo(() => createAccentColor(), []);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: accentColor.clone() },
      uHead: { value: motionEnabled ? 0 : 1 },
      uTail: { value: 0 },
    }),
    [accentColor, motionEnabled],
  );

  useFrame((state) => {
    const material = materialRef.current;
    if (!material) return;

    if (!motionEnabled) {
      material.uniforms.uHead.value = 1;
      material.uniforms.uTail.value = 0;
      return;
    }

    const cycleTime =
      (state.clock.elapsedTime + spec.delay * ARC_CYCLE_DURATION) %
      ARC_CYCLE_DURATION;

    if (cycleTime < ARC_REVEAL_DURATION) {
      const progress = cycleTime / ARC_REVEAL_DURATION;
      material.uniforms.uHead.value = progress;
      material.uniforms.uTail.value = 0;
      return;
    }

    const fadeProgress = (cycleTime - ARC_REVEAL_DURATION) / ARC_FADE_DURATION;
    material.uniforms.uHead.value = 1;
    material.uniforms.uTail.value = fadeProgress;
  });

  useEffect(() => {
    return () => {
      arcData.geometry.dispose();
    };
  }, [arcData.geometry]);

  return (
    <mesh geometry={arcData.geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        uniforms={uniforms}
        vertexShader={arcVertexShader}
        fragmentShader={arcFragmentShader}
      />
    </mesh>
  );
};

const PulseMarker = ({
  node,
  outgoingArcDelays,
  motionEnabled,
}: {
  node: CityNode;
  outgoingArcDelays: number[];
  motionEnabled: boolean;
}) => {
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const accentColor = useMemo(() => createAccentColor(), []);
  const position = useMemo(
    () => latLonToVector(node.lat, node.lon, GLOBE_RADIUS + 0.012),
    [node.lat, node.lon],
  );
  const quaternion = useMemo(() => {
    const normal = position.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
  }, [position]);

  useFrame((state) => {
    const cycleTime = state.clock.elapsedTime % ARC_CYCLE_DURATION;

    const getPulseProgress = (delayOffset: number) => {
      for (const delay of outgoingArcDelays) {
        const arcTime =
          (cycleTime + delay * ARC_CYCLE_DURATION) % ARC_CYCLE_DURATION;
        if (arcTime >= ARC_REVEAL_DURATION) continue;

        const headProgress = arcTime / ARC_REVEAL_DURATION;
        const pulseProgress =
          (headProgress - MARKER_PULSE_HEAD_START - delayOffset) /
          (MARKER_PULSE_HEAD_END - MARKER_PULSE_HEAD_START);

        if (pulseProgress >= 0 && pulseProgress <= 1) {
          return pulseProgress;
        }
      }

      return null;
    };

    const updateRing = (
      mesh: THREE.Mesh | null,
      delayOffset: number,
      minScale: number,
      maxScale: number,
      baseOpacity: number,
    ) => {
      if (!mesh) return;

      const material = mesh.material as THREE.MeshBasicMaterial;
      if (!motionEnabled) {
        mesh.scale.setScalar(minScale);
        material.opacity = 0;
        return;
      }

      const progress = getPulseProgress(delayOffset);
      if (progress === null) {
        mesh.scale.setScalar(minScale);
        material.opacity = 0;
        return;
      }

      const eased = progress * progress * (3 - 2 * progress);
      const scale = THREE.MathUtils.lerp(minScale, maxScale, eased);
      const opacity = baseOpacity * Math.pow(1 - eased, 1.15);

      mesh.scale.setScalar(scale);
      material.opacity = opacity;
    };

    updateRing(ringARef.current, 0, 0.18, 1.05, 0.42);
    updateRing(ringBRef.current, MARKER_SECOND_RING_DELAY, 0.1, 1.28, 0.26);
  });

  return (
    <group position={position} quaternion={quaternion} renderOrder={4}>
      <mesh scale={0.3}>
        <circleGeometry args={[0.05, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      <mesh ref={ringARef} scale={0.18}>
        <ringGeometry args={[0.12, 0.15, 48]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.42}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      <mesh ref={ringBRef} scale={0.1}>
        <ringGeometry args={[0.08, 0.11, 48]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.26}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
};

const GlobeLoader = () => {
  return (
    <Html center>
      <div className="pointer-events-none flex items-center justify-center rounded-full border border-slate-300/60 bg-white/80 p-4 shadow-[0_18px_48px_rgba(40,48,74,0.12)] backdrop-blur-sm">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          className="text-surface animate-[spin_0.3s_linear_infinite]"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="rgba(100,116,139,0.28)"
            strokeWidth="2.5"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </Html>
  );
};

const GlobeScene = ({
  dragSignal,
  visible,
  reducedMotion,
}: {
  dragSignal: DragSignal;
  visible: boolean;
  reducedMotion: boolean;
}) => {
  const globeRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<GlobeControls>({
    dragging: false,
    targetPitch: INITIAL_PITCH,
    targetYaw: INITIAL_YAW,
    lastInteraction: 0,
    pitchVelocity: 0,
    yawVelocity: AUTO_ROTATE_SPEED,
    autoRotateBlend: 1,
  });
  const motionEnabled = visible && !reducedMotion;
  const nodeMap = useMemo(
    () => new Map(CITY_NODES.map((node) => [node.id, node])),
    [],
  );
  const outgoingArcDelays = useMemo(() => {
    const delays = new Map<string, number[]>();

    SCHEDULED_ARC_SPECS.forEach((spec) => {
      const next = delays.get(spec.from) ?? [];
      next.push(spec.delay);
      delays.set(spec.from, next);
    });

    return delays;
  }, []);
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    SCHEDULED_ARC_SPECS.forEach((spec) => {
      ids.add(spec.from);
      ids.add(spec.to);
    });
    return [...ids];
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;

    if (dragSignal.kind === "idle") return;

    if (dragSignal.kind === "start") {
      controls.dragging = true;
      controls.lastInteraction = dragSignal.at;
      return;
    }

    if (dragSignal.kind === "move") {
      controls.dragging = true;
      controls.lastInteraction = dragSignal.at;
      controls.targetYaw += dragSignal.yawDelta;
      controls.targetPitch = clampPitch(
        controls.targetPitch + dragSignal.pitchDelta,
      );
      controls.yawVelocity = THREE.MathUtils.lerp(
        controls.yawVelocity,
        dragSignal.yawVelocity,
        POINTER_VELOCITY_BLEND,
      );
      controls.pitchVelocity = THREE.MathUtils.lerp(
        controls.pitchVelocity,
        dragSignal.pitchVelocity,
        POINTER_VELOCITY_BLEND,
      );
      return;
    }

    controls.dragging = false;
    controls.lastInteraction = dragSignal.at;
    controls.yawVelocity = THREE.MathUtils.lerp(
      controls.yawVelocity,
      dragSignal.yawVelocity,
      POINTER_VELOCITY_BLEND,
    );
    controls.pitchVelocity = THREE.MathUtils.lerp(
      controls.pitchVelocity,
      dragSignal.pitchVelocity,
      POINTER_VELOCITY_BLEND,
    );
  }, [dragSignal]);

  useFrame((_, delta) => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = controlsRef.current;
    const dt = Math.min(delta, 0.033);
    const shouldAutoRotate =
      motionEnabled &&
      !controls.dragging &&
      performance.now() - controls.lastInteraction > AUTO_ROTATE_DELAY_MS;

    controls.autoRotateBlend = THREE.MathUtils.damp(
      controls.autoRotateBlend,
      shouldAutoRotate ? 1 : 0,
      shouldAutoRotate ? AUTO_ROTATE_EASE_IN : AUTO_ROTATE_EASE_OUT,
      dt,
    );

    if (!controls.dragging) {
      const targetYawVelocity = controls.autoRotateBlend * AUTO_ROTATE_SPEED;

      controls.yawVelocity = THREE.MathUtils.damp(
        controls.yawVelocity,
        targetYawVelocity,
        DRAG_MOMENTUM_DAMPING,
        dt,
      );
      controls.pitchVelocity = THREE.MathUtils.damp(
        controls.pitchVelocity,
        0,
        PITCH_MOMENTUM_DAMPING,
        dt,
      );

      controls.targetYaw += controls.yawVelocity * dt;
      controls.targetPitch = clampPitch(
        controls.targetPitch + controls.pitchVelocity * dt,
      );
    }

    globe.rotation.x = THREE.MathUtils.damp(
      globe.rotation.x,
      controls.targetPitch,
      6,
      dt,
    );
    globe.rotation.y = THREE.MathUtils.damp(
      globe.rotation.y,
      controls.targetYaw,
      5.5,
      dt,
    );
  });

  return (
    <>
      <group ref={globeRef} rotation={[INITIAL_PITCH, INITIAL_YAW, 0]}>
        <Ocean motionEnabled={motionEnabled} />
        <LandDots motionEnabled={motionEnabled} />

        {SCHEDULED_ARC_SPECS.map((spec) => {
          const from = nodeMap.get(spec.from);
          const to = nodeMap.get(spec.to);
          if (!from || !to) return null;

          return (
            <ArcMesh
              key={`${spec.from}-${spec.to}`}
              spec={spec}
              from={from}
              to={to}
              motionEnabled={motionEnabled}
            />
          );
        })}

        {activeNodeIds.map((id) => {
          const node = nodeMap.get(id);
          if (!node) return null;

          return (
            <PulseMarker
              key={id}
              node={node}
              outgoingArcDelays={outgoingArcDelays.get(id) ?? []}
              motionEnabled={motionEnabled}
            />
          );
        })}
      </group>
    </>
  );
};

const Day18 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({
    active: false,
    pitchVelocity: 0,
    pointerId: null,
    time: 0,
    x: 0,
    yawVelocity: 0,
    y: 0,
  });
  const [dragSignal, setDragSignal] = useState<DragSignal>({
    kind: "idle",
    at: 0,
    pitchDelta: 0,
    pitchVelocity: 0,
    yawDelta: 0,
    yawVelocity: 0,
  });
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.12 },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;

    dragRef.current.active = false;
    setDragSignal({
      kind: "end",
      at: performance.now(),
      pitchDelta: 0,
      pitchVelocity: dragRef.current.pitchVelocity,
      yawDelta: 0,
      yawVelocity: dragRef.current.yawVelocity,
    });
    setDragging(false);

    if (
      dragRef.current.pointerId !== null &&
      event.currentTarget.hasPointerCapture(dragRef.current.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(dragRef.current.pointerId);
    }
  };

  return (
    <div
      ref={containerRef}
      className={[
        "relative h-135 w-full overflow-hidden bg-surface select-none",
        "sm:h-150",
        dragging ? "cursor-grabbing" : "cursor-grab",
      ].join(" ")}
      style={{ touchAction: "pan-y" }}
      onPointerDown={(event) => {
        dragRef.current.active = true;
        dragRef.current.pointerId = event.pointerId;
        dragRef.current.time = event.timeStamp;
        dragRef.current.x = event.clientX;
        dragRef.current.y = event.clientY;
        dragRef.current.yawVelocity = 0;
        dragRef.current.pitchVelocity = 0;
        setDragSignal({
          kind: "start",
          at: performance.now(),
          pitchDelta: 0,
          pitchVelocity: 0,
          yawDelta: 0,
          yawVelocity: 0,
        });
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragRef.current.active) return;

        const dx = event.clientX - dragRef.current.x;
        const dy = event.clientY - dragRef.current.y;
        const dt = Math.max(
          (event.timeStamp - dragRef.current.time) / 1000,
          1 / 120,
        );
        const yawDelta = dx * DRAG_SENSITIVITY;
        const pitchDelta = dy * DRAG_SENSITIVITY;
        const yawVelocity = yawDelta / dt;
        const pitchVelocity = pitchDelta / dt;
        dragRef.current.x = event.clientX;
        dragRef.current.y = event.clientY;
        dragRef.current.time = event.timeStamp;
        dragRef.current.yawVelocity = yawVelocity;
        dragRef.current.pitchVelocity = pitchVelocity;
        setDragSignal({
          kind: "move",
          at: performance.now(),
          pitchDelta,
          pitchVelocity,
          yawDelta,
          yawVelocity,
        });
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.82) 15%, rgba(220,228,255,0.35) 36%, rgba(239,241,247,0) 64%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-10 mx-auto h-28 w-[70%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(62,72,116,0.18) 0%, rgba(62,72,116,0.10) 35%, rgba(62,72,116,0.02) 70%, transparent 100%)",
        }}
      />

      <Canvas
        className="absolute inset-0"
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.06, 6.0], fov: 28, near: 0.1, far: 20 }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <Suspense fallback={<GlobeLoader />}>
          <GlobeScene
            dragSignal={dragSignal}
            visible={visible}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Day18;
