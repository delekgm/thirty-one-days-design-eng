import { useEffect, useRef } from "react";
import {
  FigmaLogoIcon,
  FramerLogoIcon,
  SketchLogoIcon,
  TwitterLogoIcon,
  GitHubLogoIcon,
  VercelLogoIcon,
  NotionLogoIcon,
  DiscordLogoIcon,
  InstagramLogoIcon,
  LinkedInLogoIcon,
} from "@radix-ui/react-icons";

const LOGOS = [
  <FigmaLogoIcon width={24} height={24} className="text-ink cursor-pointer" />,
  <FramerLogoIcon width={24} height={24} className="text-ink cursor-pointer" />,
  <SketchLogoIcon width={24} height={24} className="text-ink cursor-pointer" />,
  <TwitterLogoIcon
    width={24}
    height={24}
    className="text-ink cursor-pointer"
  />,
  <GitHubLogoIcon width={24} height={24} className="text-ink cursor-pointer" />,
  <VercelLogoIcon width={24} height={24} className="text-ink cursor-pointer" />,
  <NotionLogoIcon width={24} height={24} className="text-ink cursor-pointer" />,
  <DiscordLogoIcon
    width={24}
    height={24}
    className="text-ink cursor-pointer"
  />,
  <InstagramLogoIcon
    width={24}
    height={24}
    className="text-ink cursor-pointer"
  />,
  <LinkedInLogoIcon
    width={24}
    height={24}
    className="text-ink cursor-pointer"
  />,
];

const FAST_SPEED = 48;
const SLOW_SPEED = 24;
const EASING = 0.08;

const Day02 = () => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const speedRef = useRef(FAST_SPEED);
  const targetSpeedRef = useRef(FAST_SPEED);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    let frameId = 0;
    let previousTime = performance.now();

    const step = (time: number) => {
      const deltaSeconds = (time - previousTime) / 1000;
      previousTime = time;

      speedRef.current += (targetSpeedRef.current - speedRef.current) * EASING;

      const loopWidth = track.scrollWidth / 2;

      if (loopWidth > 0) {
        offsetRef.current =
          (offsetRef.current + speedRef.current * deltaSeconds) % loopWidth;
        track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      className="
        relative m-auto w-full overflow-hidden bg-surface
        before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-[100px]
        before:bg-[linear-gradient(to_right,var(--color-surface)_0%,transparent_100%)]
        before:content-['']
        after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-[100px]
        after:-scale-x-100
        after:bg-[linear-gradient(to_right,var(--color-surface)_0%,transparent_100%)]
        after:content-['']
      "
      onPointerEnter={() => {
        targetSpeedRef.current = SLOW_SPEED;
      }}
      onPointerLeave={() => {
        targetSpeedRef.current = FAST_SPEED;
      }}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        {[...LOGOS, ...LOGOS].map((logo, index) => (
          <div
            key={index}
            className="flex w-[125px] items-center justify-center"
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Day02;
