import type { ReactNode } from "react";

const paths = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="7.5" />
      <path d="m16 16 5.5 5.5" />
    </>
  ),
  send: (
    <>
      <path d="M22 3 2.5 9.5l7.8 3.6L14 21z" />
      <path d="M22 3 10.3 13.1" />
    </>
  ),
  heart: (
    <path d="M12 20.8S2.5 15.3 2.5 8.7A5.2 5.2 0 0 1 12 5.9a5.2 5.2 0 0 1 9.5 2.8c0 6.6-9.5 12.1-9.5 12.1Z" />
  ),
  create: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <path d="M12 7v10M7 12h10" />
    </>
  ),
  menu: <path d="M3 5.5h18M3 12h18M3 18.5h18" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </>
  ),
  arrow: <path d="M20 12H4M11 5l-7 7 7 7" />,
  chevron: <path d="m15 5-7 7 7 7" />,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  check: <path d="m6 12.5 4 4 8-9" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  close: <path d="m5 5 14 14M19 5 5 19" />,
  mail: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="11" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

// These two are line drawings, so the "active" look is a heavier stroke, not a fill.
const STROKE_ONLY: ReadonlySet<IconName> = new Set(["search", "create"]);

export function Icon({
  name,
  size = 24,
  filled = false,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      fill={filled && !STROKE_ONLY.has(name) ? "currentColor" : "none"}
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={filled ? 2.6 : 2}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}
