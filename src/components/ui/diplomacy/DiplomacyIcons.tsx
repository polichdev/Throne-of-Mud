import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
}

export const DiplomacySealIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={{ width: size, height: size }} aria-hidden="true">
    <path d="M5 5h22v21H5Z" fill="#e5d3ab" stroke="#f7e8c4" strokeWidth="1.6" />
    <path d="m5 7 11 9L27 7" stroke="#94734e" strokeWidth="1.8" />
    <circle cx="16" cy="19" r="6" fill="#9c423b" stroke="#e5b27d" strokeWidth="1.6" />
    <path d="m16 15 1.3 2.4 2.7.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.7-.4Z" fill="#f2d69a" />
    <path d="m12 24-2 6 6-2 6 2-2-6" fill="#78322f" stroke="#d99f71" strokeWidth="1.2" />
  </svg>
);

export const PeacePactIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={{ width: size, height: size }} aria-hidden="true">
    <circle cx="16" cy="16" r="12" fill="#365747" stroke="#b6d1a3" strokeWidth="1.5" />
    <path d="M7 23c8-1 15-6 19-15" stroke="#e9ddb1" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 19c-4 0-5-3-4-5 3 0 5 1 6 3m3-2c-1-4 1-6 4-7 1 4 0 6-2 8m1-3c4-1 6 0 7 2-2 2-5 2-8 1M9 23c-2 3-4 3-6 2 0-3 2-4 6-4" fill="#91b77e" stroke="#d6daa6" strokeWidth="1" />
    <circle cx="16" cy="16" r="2.2" fill="#e9d6a2" />
  </svg>
);

export const MilitaryPassageIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={{ width: size, height: size }} aria-hidden="true">
    <path d="M4 27V11L16 4l12 7v16h-6V15H10v12Z" fill="#8b8f87" stroke="#d9d5bd" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M11 27v-9a5 5 0 0 1 10 0v9" fill="#326279" stroke="#b4d8d7" strokeWidth="1.8" />
    <path d="M16 18v11m-4-4 4 4 4-4" stroke="#e9d9a9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11h18M7 15h4m10 0h4" stroke="#555d5d" strokeWidth="1.3" />
  </svg>
);

export const WarSwordsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={{ width: size, height: size }} aria-hidden="true">
    <path d="m4 5 3-1 14 16-2 2L4 8Zm24 0-3-1L11 20l2 2L28 8Z" fill="#cfd5ca" stroke="#f3dfb0" strokeWidth="1.2" />
    <path d="m7 20 5 5m-1-7-6 6m20-4-5 5m1-7 6 6" stroke="#d6ac69" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M16 10 23 13v7c0 4-3 7-7 9-4-2-7-5-7-9v-7Z" fill="#943e3c" stroke="#e2b378" strokeWidth="1.6" />
    <path d="M16 14v10m-4-5h8" stroke="#f3dfae" strokeWidth="1.7" />
  </svg>
);

export const ClaimBannerIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={{ width: size, height: size }} aria-hidden="true">
    <path d="M8 29V4" stroke="#e6d2a1" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="8" cy="4" r="2" fill="#f3d78f" />
    <path d="M10 6h18l-4 8 4 7H10Z" fill="#b68a45" stroke="#f2d593" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="m19 9 1.5 2.5 3 .5-2.2 2 .5 3-2.8-1.4-2.8 1.4.5-3-2.2-2 3-.5Z" fill="#f7e8b7" />
    <path d="M3 29h11" stroke="#b4a382" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const WaxSealStampIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size }}
  >
    <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity="0.25" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="5" strokeDasharray="2 1.5" />
    <path d="M12 9 L13 11 L15 11.5 L13.5 13 L14 15 L12 14 L10 15 L10.5 13 L9 11.5 L11 11 Z" fill="currentColor" />
  </svg>
);

export const LetterEnvelopeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size }}
  >
    <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.2" />
    <path d="M3 7 L12 13 L21 7" />
  </svg>
);

export const CloseCrossIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size }}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
