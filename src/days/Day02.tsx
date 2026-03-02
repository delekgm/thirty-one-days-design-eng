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

const Day02 = () => {
  return (
    <div className="group relative m-auto w-full overflow-hidden bg-surface before:absolute before:left-0 before:top-0 before:z-2 before:h-full before:w-[100px] before:bg-[linear-gradient(to_right,var(--color-surface)_0%,transparent_100%)] before:content-[''] after:absolute after:right-0 after:top-0 after:z-2 after:h-full after:w-[100px] after:-scale-x-100 after:bg-[linear-gradient(to_right,var(--color-surface)_0%,transparent_100%)] after:content-['']">
      <div className="animate-infinite-slider group-hover:[animation-play-state:paused] flex w-[calc(250px*10)]">
        {LOGOS.map((logo, index) => (
          <div
            className="slide flex w-[125px] items-center justify-center"
            key={index}
          >
            {logo}
          </div>
        ))}
        {LOGOS.map((logo, index) => (
          <div
            className="slide flex w-[125px] items-center justify-center"
            key={index}
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Day02;
