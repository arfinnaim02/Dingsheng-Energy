import type { ReactNode, SVGProps } from "react";

const paths: Record<string, ReactNode> = {
  shield: <><path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 10 4.2-2.2 7-5.5 7-10V6l-7-3Z"/><path d="m9.4 12 1.7 1.7 3.8-4"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21M12 3C9.7 5.5 8.5 8.5 8.5 12S9.7 18.5 12 21"/></>,
  gear: <><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.5a7 7 0 0 0-.8-1.8l1.1-1.8-2.1-2.1-1.8 1.1A7 7 0 0 0 11.5 4L11 2H8l-.5 2a7 7 0 0 0-1.8.8L3.9 3.7 1.8 5.8l1.1 1.8A7 7 0 0 0 2.1 9.5L0 10v3l2 .5c.2.7.5 1.3.8 1.9l-1.1 1.8 2.1 2.1 1.8-1.1c.6.4 1.2.6 1.9.8L8 21h3l.5-2c.7-.2 1.3-.5 1.9-.8l1.8 1.1 2.1-2.1-1.1-1.8c.4-.6.6-1.2.8-1.9l2-.5Z" transform="translate(2 1) scale(.84)"/></>,
  handshake: <><path d="M8 12 5.5 9.5a2 2 0 0 1 0-2.8l1.2-1.2a2 2 0 0 1 2.8 0l1.2 1.2M16 12l2.5-2.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L12 8"/><path d="m8 12 4.5 4.5a1.4 1.4 0 0 0 2-2L12 12l3.4 3.4a1.4 1.4 0 0 0 2-2L14 10"/></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  box: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
  wrench: <><path d="M14 6a4 4 0 0 0-5-3l2.5 2.5-6 6L3 9a4 4 0 0 0 5 5l6-6 2.5 2.5A4 4 0 0 0 14 6Z"/><path d="m13 13 7 7"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
  flame: <path d="M13 2c1 4-2 5-2 8 0 2 1 3 2 4-4 0-6-2-6-5-3 3-4 6-3 9 1 3 4 5 8 5 5 0 9-3 9-8 0-5-4-8-8-13Z"/>,
  factory: <><path d="M3 21V10l6 3V9l6 3V5h4v16Z"/><path d="M3 21h18M7 17h2M12 17h2M17 17h2M17 5V2h2v3"/></>,
  ship: <><path d="M4 14 6 8h12l2 6M8 8V5h8v3M12 5V2M3 14h18l-2 5H6Z"/><path d="M4 21c1.3-1 2.7-1 4 0 1.3-1 2.7-1 4 0 1.3-1 2.7-1 4 0 1.3-1 2.7-1 4 0"/></>,
  tank: <><path d="M5 8a7 4 0 0 1 14 0v8a7 4 0 0 1-14 0Z"/><path d="M5 8a7 4 0 0 0 14 0M8 20v-2M16 20v-2M6 20h4M14 20h4"/></>,
  building: <><path d="M4 21V6h10v15M14 11h6v10M2 21h20"/><path d="M7 9h2M11 9h1M7 13h2M11 13h1M7 17h2M17 14h1M17 17h1"/></>,
  bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6Z"/>,
  pump: <><circle cx="9" cy="12" r="5"/><circle cx="9" cy="12" r="2"/><path d="M14 10h5v4h-5M4 12H2M7 17v3M11 17v3M5 20h8"/></>,
  gauge: <><circle cx="12" cy="12" r="8"/><path d="M12 12 16 8M7 15a6 6 0 0 1 10 0M12 4v2"/></>,
  pipeline: <><path d="M3 8h6v8H3M15 8h6v8h-6M9 12h6M6 5v3M18 5v3M6 16v3M18 16v3"/></>,
  tools: <><path d="m4 4 6 6m4 4 6 6"/><path d="M14 6a4 4 0 0 0 5-3l-3 3-2-2 3-3a4 4 0 0 0-5 5L5 13a3 3 0 1 0 4 4l7-7"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  phone: <path d="M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4c0 1.1-.9 2-2 2C10.2 21 3 13.8 3 5c0-1.1.9-2 2-2Z"/>,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  cart: <><path d="M3 4h2l2.2 10h10.6l2-7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "", ...props }: { name: IconName; className?: string } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>{paths[name]}</svg>;
}
