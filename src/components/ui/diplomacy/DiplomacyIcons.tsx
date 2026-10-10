import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
}

export const PeacePactIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size }}
  >
    <path d="M12 4 C14 7 16 9 20 9 C18 13 14 15 10 16 C8 16.5 6 15.5 5 14 C3.5 12 4.5 9 6.5 8 C7.5 7.5 9 7.8 10 8.5 C10.5 7 11 5.5 12 4 Z" fill="currentColor" fillOpacity="0.25" />
    <path d="M10 16 C10 18 8 20 5 21" strokeWidth="1.5" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
  </svg>
);

export const MilitaryPassageIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size }}
  >
    <path d="M4 21 V7 L12 3 L20 7 V21" fill="currentColor" fillOpacity="0.15" />
    <path d="M9 21 V13 C9 11.5 10.5 10 12 10 C13.5 10 15 11.5 15 13 V21" fill="currentColor" fillOpacity="0.3" />
    <line x1="12" y1="3" x2="12" y2="10" strokeDasharray="1.5 1.5" />
  </svg>
);

export const WarSwordsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size }}
  >
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
    <line x1="3" y1="8" x2="7" y2="4" strokeWidth="2.2" />
    <line x1="21" y1="8" x2="17" y2="4" strokeWidth="2.2" />
    <circle cx="4" cy="20" r="1.5" fill="currentColor" />
    <circle cx="20" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

export const ClaimBannerIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size }}
  >
    <line x1="5" y1="21" x2="5" y2="3" strokeWidth="2.2" />
    <path d="M5 4 L18 8 L14 11 L19 14 L5 16 Z" fill="currentColor" fillOpacity="0.3" />
    <circle cx="5" cy="3" r="1.2" fill="currentColor" />
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
