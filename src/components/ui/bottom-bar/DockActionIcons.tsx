import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = { viewBox: '0 0 48 48', fill: 'none', 'aria-hidden': true } as const;

export function DockRoadIcon(props: IconProps) {
  return <svg {...base} {...props}>
    <path d="M18 4C13 12 12 18 19 24c7 6 5 12-2 20h14c7-8 8-15 1-22-6-6-4-12 1-18Z" fill="#aa8b60" stroke="#e5cf9f" strokeWidth="2" />
    <path d="M20 10h10M17 18h11M20 28h13M18 37h14" stroke="#423a2e" strokeWidth="2.5" strokeLinecap="round" />
    <path d="m7 16 3-3 3 3v9H7ZM36 28l3-3 3 3v10h-6Z" fill="#d7c7a2" stroke="#3b392f" strokeWidth="1.5" />
    <path d="M10 16v4m29 8v5" stroke="#766c52" strokeWidth="1.5" />
  </svg>;
}

export function DockBuildIcon(props: IconProps) {
  return <svg {...base} {...props}>
    <path d="M6 21 24 7l18 14v4H6Z" fill="#a65a37" stroke="#e5b77b" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m10 22 14-11 14 11" stroke="#543b2b" strokeWidth="2" />
    <path d="M11 24h26v18H11Z" fill="#c8ac77" stroke="#e8d4a6" strokeWidth="1.8" />
    <path d="M11 29h26M17 24v18m14-18v18" stroke="#765638" strokeWidth="2" />
    <path d="M21 42V31h6v11" fill="#4c392b" stroke="#e0bc82" strokeWidth="1.5" />
    <path d="m34 9 5-4 5 6-4 3-2-3-11 12-3-3 11-11Z" fill="#c1c8bd" stroke="#424b46" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>;
}

export function DockMilitaryIcon(props: IconProps) {
  return <svg {...base} {...props}>
    <path d="M24 8 38 13v12c0 9-6 14-14 18-8-4-14-9-14-18V13Z" fill="#8d3e32" stroke="#e0b780" strokeWidth="2" strokeLinejoin="round" />
    <path d="M24 11v28M13 24h22" stroke="#deb780" strokeWidth="1.8" />
    <path d="M22 6h4l1 22-3 6-3-6Z" fill="#dce1d9" stroke="#51564e" strokeWidth="1.5" />
    <path d="M17 27h14M24 34v8" stroke="#f2d195" strokeWidth="3" strokeLinecap="round" />
    <circle cx="24" cy="28" r="2.4" fill="#d7b369" stroke="#513b2d" strokeWidth="1" />
  </svg>;
}

export function DockTradeIcon(props: IconProps) {
  return <svg {...base} {...props}>
    <path d="M24 7v31M11 40h26M18 37h12" stroke="#e8d3a0" strokeWidth="3" strokeLinecap="round" />
    <path d="M7 15h34M24 8l-4 7h8Z" stroke="#d9c28d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m12 16-6 15h12Zm24 0-6 15h12Z" fill="#bd8c43" stroke="#f2d58e" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M7 31c2 6 9 6 11 0m12 0c2 6 9 6 11 0" stroke="#f5dca4" strokeWidth="2" />
    <circle cx="24" cy="15" r="3.2" fill="#e2b95e" stroke="#5e4227" strokeWidth="1.4" />
  </svg>;
}

export function DockDiplomacyIcon(props: IconProps) {
  return <svg {...base} {...props}>
    <path d="M10 8h27v29H10Z" fill="#d9c79e" stroke="#f4e2ba" strokeWidth="2" />
    <path d="M10 8c-4 0-5 4-5 7v26c0-4 2-6 5-6h27V8" stroke="#9d835d" strokeWidth="2" strokeLinejoin="round" />
    <path d="M15 16h17M15 22h17M15 28h11" stroke="#705d45" strokeWidth="2" strokeLinecap="round" />
    <circle cx="30" cy="32" r="6" fill="#a63b35" stroke="#eab583" strokeWidth="1.6" />
    <path d="m28 30 2-2 2 2-2 3Z" fill="#e8c389" />
    <path d="m26 37-2 7 6-3 6 3-2-7" fill="#8a332f" stroke="#d9a47a" strokeWidth="1.5" />
  </svg>;
}

export function DockSettingsIcon(props: IconProps) {
  return <svg {...base} {...props}>
    <path d="m20 5 8 0 1 5 3 1 4-3 5 6-3 4 1 3 5 2v7l-5 2-1 3 3 4-5 6-4-3-3 1-1 5h-8l-1-5-3-1-4 3-5-6 3-4-1-3-5-2v-7l5-2 1-3-3-4 5-6 4 3 3-1Z" fill="#8e947e" stroke="#e4d3a4" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="24" cy="26" r="10" fill="#3b443d" stroke="#d6bd83" strokeWidth="2" />
    <circle cx="24" cy="26" r="4" fill="#d4ab65" stroke="#f1deb2" strokeWidth="1.5" />
  </svg>;
}
