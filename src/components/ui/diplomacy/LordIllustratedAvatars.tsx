import React from 'react';

interface LordAvatarProps {
  className?: string;
  size?: number;
}

export const BaronBergAvatar: React.FC<LordAvatarProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: size, height: size }}
  >
    <defs>
      <linearGradient id="bergBg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#450a0a" />
        <stop offset="100%" stopColor="#1c0404" />
      </linearGradient>
      <linearGradient id="bergSteel" x1="20" y1="15" x2="60" y2="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="50%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="bergGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="12" fill="url(#bergBg)" />
    <path d="M12 76 C12 60 22 54 40 54 C58 54 68 60 68 76 Z" fill="#991b1b" />
    <path d="M40 54 L36 76 H44 Z" fill="url(#bergGold)" />
    <path d="M26 56 L30 76 H24 Z" fill="#7f1d1d" />
    <path d="M54 56 L50 76 H56 Z" fill="#7f1d1d" />
    <path d="M22 42 C22 30 26 22 40 22 C54 22 58 30 58 42 C58 52 50 56 40 56 C30 56 22 52 22 42 Z" fill="#475569" />
    <circle cx="28" cy="34" r="1.2" fill="#94a3b8" />
    <circle cx="34" cy="34" r="1.2" fill="#94a3b8" />
    <circle cx="46" cy="34" r="1.2" fill="#94a3b8" />
    <circle cx="52" cy="34" r="1.2" fill="#94a3b8" />
    <circle cx="28" cy="40" r="1.2" fill="#94a3b8" />
    <circle cx="34" cy="40" r="1.2" fill="#94a3b8" />
    <circle cx="46" cy="40" r="1.2" fill="#94a3b8" />
    <circle cx="52" cy="40" r="1.2" fill="#94a3b8" />
    <path d="M28 32 C28 26 32 25 40 25 C48 25 52 26 52 32 C52 44 46 48 40 48 C34 48 28 44 28 32 Z" fill="#fbcfe8" fillOpacity="0.85" />
    <path d="M30 38 C30 46 34 50 40 50 C46 50 50 46 50 38 C46 42 34 42 30 38 Z" fill="#451a03" />
    <path d="M34 41 C37 43 43 43 46 41 C44 44 36 44 34 41 Z" fill="#290e02" />
    <ellipse cx="35" cy="33" rx="2" ry="1.2" fill="#1e293b" />
    <ellipse cx="45" cy="33" rx="2" ry="1.2" fill="#1e293b" />
    <path d="M32 30 C34 29 37 30 38 31" stroke="#371b07" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M48 30 C46 29 43 30 42 31" stroke="#371b07" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M40 33 L39 37 H41 Z" fill="#e2a7b8" />
    <path d="M18 20 C18 10 30 7 40 7 C50 7 62 10 62 20 L58 23 C50 20 30 20 22 23 Z" fill="url(#bergSteel)" stroke="#1e293b" strokeWidth="1.2" />
    <path d="M38 7 L40 3 L42 7 Z" fill="url(#bergGold)" />
    <path d="M24 21 L56 21" stroke="url(#bergGold)" strokeWidth="1.8" />
    <rect x="0.5" y="0.5" width="79" height="79" rx="11.5" stroke="#7f1d1d" strokeWidth="1" opacity="0.8" />
  </svg>
);

export const LadyHildegardAvatar: React.FC<LordAvatarProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: size, height: size }}
  >
    <defs>
      <linearGradient id="hildBg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#172554" />
        <stop offset="100%" stopColor="#080e1e" />
      </linearGradient>
      <linearGradient id="hildGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="hildDress" x1="20" y1="50" x2="60" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="12" fill="url(#hildBg)" />
    <path d="M14 76 C14 58 24 52 40 52 C56 52 66 58 66 76 Z" fill="url(#hildDress)" />
    <path d="M34 52 L36 76 H44 L46 52 Z" fill="url(#hildGold)" opacity="0.8" />
    <circle cx="40" cy="58" r="1.5" fill="#ef4444" />
    <circle cx="40" cy="65" r="1.5" fill="#3b82f6" />
    <circle cx="40" cy="72" r="1.5" fill="#ef4444" />
    <path d="M22 28 C22 18 28 14 40 14 C52 14 58 18 58 28 C58 48 52 56 40 56 C28 56 22 48 22 28 Z" fill="#f8fafc" />
    <path d="M28 26 C28 20 32 18 40 18 C48 18 52 20 52 26 C52 40 48 44 40 44 C32 44 28 40 28 26 Z" fill="#ffe4e6" />
    <ellipse cx="35" cy="27" rx="1.8" ry="1.1" fill="#1e3a8a" />
    <ellipse cx="45" cy="27" rx="1.8" ry="1.1" fill="#1e3a8a" />
    <path d="M33 24 C35 23 37 24 38 25" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M47 24 C45 23 43 24 42 25" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M40 28 L39.5 32 H40.5 Z" fill="#fda4af" />
    <path d="M37 36 C38.5 37.5 41.5 37.5 43 36" stroke="#e11d48" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M26 18 C26 15 32 12 40 12 C48 12 54 15 54 18 L55 21 C48 19 32 19 25 21 Z" fill="url(#hildGold)" />
    <polygon points="31,14 33,10 35,14" fill="url(#hildGold)" />
    <polygon points="38,13 40,8 42,13" fill="url(#hildGold)" />
    <polygon points="45,14 47,10 49,14" fill="url(#hildGold)" />
    <circle cx="40" cy="9.5" r="1" fill="#ef4444" />
    <path d="M21 26 C20 40 18 54 16 66 L22 68 C24 54 26 40 26 28 Z" fill="#e2e8f0" opacity="0.9" />
    <path d="M59 26 C60 40 62 54 64 66 L58 68 C56 54 54 40 54 28 Z" fill="#e2e8f0" opacity="0.9" />
    <rect x="0.5" y="0.5" width="79" height="79" rx="11.5" stroke="#1d4ed8" strokeWidth="1" opacity="0.8" />
  </svg>
);

export const DukeWilhelmAvatar: React.FC<LordAvatarProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: size, height: size }}
  >
    <defs>
      <linearGradient id="wilBg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#052e16" />
        <stop offset="100%" stopColor="#02140a" />
      </linearGradient>
      <linearGradient id="wilFur" x1="15" y1="46" x2="65" y2="76" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="50%" stopColor="#451a03" />
        <stop offset="100%" stopColor="#1c0d02" />
      </linearGradient>
      <linearGradient id="wilSteel" x1="20" y1="10" x2="60" y2="25" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="50%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="wilBronze" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="12" fill="url(#wilBg)" />
    <path d="M12 76 C12 56 22 50 40 50 C58 50 68 56 68 76 Z" fill="#15803d" />
    <path d="M16 54 C20 48 28 52 40 52 C52 52 60 48 64 54 C68 62 66 72 66 76 C58 74 54 62 40 62 C26 62 22 74 14 76 C14 72 12 62 16 54 Z" fill="url(#wilFur)" />
    <circle cx="40" cy="54" r="3.5" fill="url(#wilBronze)" stroke="#451a03" strokeWidth="1" />
    <polygon points="40,52 38,55 42,55" fill="#451a03" />
    <path d="M26 26 C26 18 32 15 40 15 C48 15 54 18 54 26 C54 36 50 42 40 42 C30 42 26 36 26 26 Z" fill="#fed7aa" />
    <path d="M24 28 C23 42 28 54 40 55 C52 54 57 42 56 28 C53 32 50 30 47 28 C45 38 35 38 33 28 C30 30 27 32 24 28 Z" fill="#382213" />
    <path d="M33 38 C37 40 43 40 47 38 C45 42 35 42 33 38 Z" fill="#211308" />
    <ellipse cx="35" cy="25" rx="1.8" ry="1.2" fill="#1c1917" />
    <ellipse cx="45" cy="25" rx="1.8" ry="1.2" fill="#1c1917" />
    <path d="M32 22 C34 21 37 22 38 23" stroke="#211308" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M48 22 C46 21 43 22 42 23" stroke="#211308" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M40 25 L39 29 H41 Z" fill="#fca5a5" />
    <path d="M25 18 C25 13 31 10 40 10 C49 10 55 13 55 18 L56 20 C48 18 32 18 24 20 Z" fill="url(#wilSteel)" />
    <path d="M28 17 L30 13 L32 17" stroke="url(#wilBronze)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M38 16 L40 11 L42 16" stroke="url(#wilBronze)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M48 17 L50 13 L52 17" stroke="url(#wilBronze)" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="0.5" y="0.5" width="79" height="79" rx="11.5" stroke="#15803d" strokeWidth="1" opacity="0.8" />
  </svg>
);

export function getLordAvatar(lordId: string, className = 'w-10 h-10') {
  if (lordId === 'bot-1') return <BaronBergAvatar className={className} />;
  if (lordId === 'bot-2') return <LadyHildegardAvatar className={className} />;
  return <DukeWilhelmAvatar className={className} />;
}
