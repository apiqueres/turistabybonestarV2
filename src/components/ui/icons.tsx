import type { FC, SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base: P = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const ArrowRight: FC<P> = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const MapPin: FC<P> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s-6-5.2-6-11a6 6 0 0 1 12 0c0 5.8-6 11-6 11z" />
    <circle cx="12" cy="10" r="2.2" />
  </svg>
);

export const Calendar: FC<P> = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const Users: FC<P> = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 4.6a3.2 3.2 0 0 1 0 6.3M17.5 14.7c2.2.5 3.5 2.3 3.5 5" />
  </svg>
);

export const Star: FC<P> = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" />
  </svg>
);

export const Compass: FC<P> = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </svg>
);

export const Route: FC<P> = (p) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <path d="M8.5 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5" />
  </svg>
);

export const Check: FC<P> = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.7 2.7L16.5 9.5" />
  </svg>
);

export const Plane: FC<P> = (p) => (
  <svg {...base} {...p}>
    <path d="M10.5 13.5L3 11l1.2-1.2 8.3 1.7 5.2-5.2a1.6 1.6 0 0 1 2.3 2.3l-5.2 5.2 1.7 8.3L15.3 21l-2.5-7.5-3.6 3.6.3 2.6-1.2 1.2-1.6-3.4-3.4-1.6 1.2-1.2 2.6.3z" />
  </svg>
);

export const Close: FC<P> = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Menu: FC<P> = (p) => (
  <svg {...base} {...p}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);
