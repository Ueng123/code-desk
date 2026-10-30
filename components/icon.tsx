import type { CSSProperties } from "react";

type Name =
  | "play"
  | "spinner"
  | "sun"
  | "moon"
  | "terminal"
  | "command"
  | "check"
  | "chevron";
export function Icon({
  name,
  className,
  style,
}: {
  name: Name;
  className?: string;
  style?: CSSProperties;
}) {
  const paths: Record<Name, React.ReactNode> = {
    play: <path d="m8 5 11 7-11 7Z" />,
    spinner: <path d="M20 12a8 8 0 1 1-8-8" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    moon: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />,
    terminal: (
      <>
        <path d="m4 6 6 6-6 6m9 0h7" />
      </>
    ),
    command: (
      <path d="M9 7V4a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v16a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2V7Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
  };
  return (
    <svg
      className={className}
      style={style}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
