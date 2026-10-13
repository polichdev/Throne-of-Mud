import type { BackyardExtensionType } from '../../../types/game';

export function BackyardExtensionIcon({ kind, size = 38 }: { kind: BackyardExtensionType; size?: number }) {
  const art = (() => {
    switch (kind) {
      case 'none': return <>
        <path d="M5 17h38M5 31h38M9 12v25m10-25v25m10-25v25m10-25v25" stroke="#b89765" strokeWidth="3" strokeLinecap="round" />
        <path d="M7 38q17-5 34 0" stroke="#73805b" strokeWidth="3" />
        <path d="m15 35 2-5 3 5m9 0 3-5 2 5" fill="#6d8958" />
      </>;
      case 'vegetable_garden': return <>
        <path d="M6 39h36" stroke="#936944" strokeWidth="3" strokeLinecap="round" />
        <path d="m13 17 3-9m-3 9-7-6m7 6 7-7m13 7 3-9m-3 9-7-7m7 7 6-6" stroke="#6f9a58" strokeWidth="3" strokeLinecap="round" />
        <path d="M7 18q6-4 12 0l-4 17-4 6-3-8Zm20 0q6-4 12 0l-4 17-4 6-3-8Z" fill="#d48142" stroke="#8b5335" strokeWidth="2" />
        <path d="m12 24 3 3m17-3 3 3" stroke="#f0b46a" strokeWidth="2" />
      </>;
      case 'chicken_coop': return <>
        <path d="M9 31q-4-9 4-15 7-7 15 0l6 8-4 11H14Z" fill="#e7dbbd" stroke="#9f8a6a" strokeWidth="2" />
        <path d="m23 16 1-7 5 3 3-3 3 5-4 5" fill="#a9443a" stroke="#71382f" strokeWidth="1.5" />
        <path d="m34 21 8 4-8 3" fill="#ddaa5c" stroke="#8e6940" strokeWidth="1.5" />
        <circle cx="29" cy="21" r="1.8" fill="#352e27" />
        <path d="M18 35v6m10-6v6m-13-4h7m4 0h7" stroke="#aa7850" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 31 3 26l4-4m4 8-5 5" stroke="#d8c9aa" strokeWidth="3" strokeLinecap="round" />
      </>;
      case 'goat_shed': return <>
        <path d="M7 18q7-8 23-3l8 7-2 13H11L6 27Z" fill="#b69a75" stroke="#685741" strokeWidth="2" />
        <path d="m31 16 3-8 4 7 5 3-2 11-7 3" fill="#c6aa83" stroke="#685741" strokeWidth="2" />
        <path d="m33 11-2-7m7 10 4-7" stroke="#eee1bc" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="37" cy="21" r="1.5" fill="#2f3029" />
        <path d="M12 35v8m8-8v8m11-8v8m6-8v8" stroke="#66513b" strokeWidth="3" strokeLinecap="round" />
      </>;
      case 'artisan_bowyer': return <>
        <path d="M9 5q26 19 0 38" stroke="#a97745" strokeWidth="5" strokeLinecap="round" />
        <path d="M9 5v38" stroke="#f2dfb7" strokeWidth="1.6" />
        <path d="M6 24h35m-8-5 8 5-8 5" stroke="#bfc8be" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m18 21-2 3 2 3" stroke="#dcaf72" strokeWidth="3" strokeLinecap="round" />
      </>;
      case 'artisan_shields': return <>
        <path d="M24 4 40 9v14c0 10-7 16-16 21C15 39 8 33 8 23V9Z" fill="#914740" stroke="#e3b879" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 8v31M12 23h24" stroke="#e7c688" strokeWidth="2" />
        <circle cx="24" cy="23" r="5" fill="#c5c8bd" stroke="#5f655c" strokeWidth="2" />
        <path d="m21 20 6 6m0-6-6 6" stroke="#6b503d" strokeWidth="1.5" />
      </>;
      case 'artisan_brewery': return <>
        <path d="M10 16h28l-3 25H13Z" fill="#a56f3e" stroke="#e3ba78" strokeWidth="2.5" />
        <path d="M11 21h26m-25 13h24M18 17v22m12-22v22" stroke="#6c4930" strokeWidth="2.5" />
        <path d="M9 17q-4-8 3-10 4-5 10 0 7-5 11 0 8 0 6 10Z" fill="#eee4c7" stroke="#a79d80" strokeWidth="1.8" />
        <path d="M16 10q3-5 6 0m7-1q4-2 5 3" stroke="#fff8df" strokeWidth="2" strokeLinecap="round" />
      </>;
    }
  })();
  return <svg viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true">{art}</svg>;
}
