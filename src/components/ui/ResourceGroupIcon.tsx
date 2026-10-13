import type { SVGProps } from 'react';

export type ResourceGroupKind = 'construction' | 'food' | 'farm' | 'materials' | 'goods';

export function ResourceGroupIcon({ kind, ...props }: SVGProps<SVGSVGElement> & { kind: ResourceGroupKind }) {
  const drawing = (() => {
    switch (kind) {
      case 'construction': return <>
        <path d="M4 19h15v9H4Z" fill="#ae6a4c" stroke="#e2b184" strokeWidth="1.6" />
        <path d="M4 23h15M11 19v4m4 0v5" stroke="#72442f" strokeWidth="1.5" />
        <path d="m9 5 3-2 8 8-3 3Z" fill="#aab5b3" stroke="#e1e0cb" strokeWidth="1.4" />
        <path d="m18 12 4-4 7 7-4 4Z" fill="#b9854f" stroke="#5c493a" strokeWidth="1.5" />
        <path d="m24 18 4 4" stroke="#d9b987" strokeWidth="2.5" strokeLinecap="round" />
      </>;
      case 'food': return <>
        <path d="M4 17h24l-3 10H7Z" fill="#9e7546" stroke="#e8c686" strokeWidth="1.7" />
        <path d="M8 17q8-12 16 0" stroke="#e3bd77" strokeWidth="2.5" />
        <path d="M9 14q0-7 7-7t7 7q0 5-7 5t-7-5Z" fill="#c88945" stroke="#f0d093" strokeWidth="1.7" />
        <path d="m13 11 2-2m2 3 2-2" stroke="#f8e4b2" strokeWidth="1.4" strokeLinecap="round" />
      </>;
      case 'farm': return <>
        <path d="M16 29V5m0 20-8-8m8 8 8-8" stroke="#b18443" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 5q-5-5-5 0 0 4 5 6 5-6 5-6 0-5-5 0Zm-3 8q-8-6-8-1 1 4 9 6Zm6 0q8-6 8-1-1 4-9 6Z" fill="#e0b854" stroke="#f5dc8b" strokeWidth="1.4" />
        <path d="M7 29h18" stroke="#d9c79d" strokeWidth="2" strokeLinecap="round" />
      </>;
      case 'materials': return <>
        <path d="m3 22 5-14 8-4 8 9-2 15H8Z" fill="#758586" stroke="#d2d2c2" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m8 8 8 9 8-4m-8 4-8 11" stroke="#515f60" strokeWidth="1.6" />
        <path d="m14 6 2 11 5-4" stroke="#bd7f60" strokeWidth="2" />
        <path d="M23 21h6l-2 7h-7Z" fill="#aa694e" stroke="#d6a27a" strokeWidth="1.3" />
      </>;
      case 'goods': return <>
        <path d="M5 10h22v18H5Z" fill="#a17849" stroke="#e5c58d" strokeWidth="1.7" />
        <path d="m5 10 11-6 11 6M16 4v24M5 17h22" stroke="#e7c68d" strokeWidth="1.6" />
        <path d="m19 17 5 2v4c0 3-2 5-5 6-3-1-5-3-5-6v-4Z" fill="#8f4840" stroke="#f0d29a" strokeWidth="1.2" />
        <path d="M19 19v8m-3-4h6" stroke="#f7dc9d" strokeWidth="1.2" />
      </>;
    }
  })();
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>{drawing}</svg>;
}
