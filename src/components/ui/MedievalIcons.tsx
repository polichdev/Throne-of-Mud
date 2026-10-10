import React from 'react';

export interface MedievalIconProps {
  className?: string;
  size?: number | string;
  color?: string;
  title?: string;
}

export const WoodIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 17 L17 4 C18.5 2.5 20.5 4.5 19 6 L6 19 C4.5 20.5 2.5 18.5 4 17 Z" fill="currentColor" fillOpacity="0.15" />
    <ellipse cx="5" cy="18" rx="2" ry="1.2" transform="rotate(-45 5 18)" stroke="currentColor" fill="currentColor" fillOpacity="0.3" />
    <ellipse cx="18" cy="5" rx="1.5" ry="0.9" transform="rotate(-45 18 5)" />
    <line x1="8" y1="13" x2="14" y2="7" opacity="0.6" />
    <path d="M17 19 L4 6 C2.5 4.5 4.5 2.5 6 4 L19 17 C20.5 18.5 18.5 20.5 17 19 Z" fill="currentColor" fillOpacity="0.2" />
    <ellipse cx="18" cy="18" rx="2" ry="1.2" transform="rotate(45 18 18)" stroke="currentColor" fill="currentColor" fillOpacity="0.4" />
    <ellipse cx="5" cy="5" rx="1.5" ry="0.9" transform="rotate(45 5 5)" />
  </svg>
);

export const PlanksIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <polygon points="3,6 18,3 21,5 6,8" fill="currentColor" fillOpacity="0.25" />
    <polygon points="3,6 6,8 6,10 3,8" fill="currentColor" fillOpacity="0.4" />
    <polygon points="6,8 21,5 21,7 6,10" fill="currentColor" fillOpacity="0.15" />
    <polygon points="3,11 18,8 21,10 6,13" fill="currentColor" fillOpacity="0.25" />
    <polygon points="3,11 6,13 6,15 3,13" fill="currentColor" fillOpacity="0.4" />
    <polygon points="6,13 21,10 21,12 6,15" fill="currentColor" fillOpacity="0.15" />
    <polygon points="3,16 18,13 21,15 6,18" fill="currentColor" fillOpacity="0.25" />
    <polygon points="3,16 6,18 6,20 3,18" fill="currentColor" fillOpacity="0.4" />
    <polygon points="6,18 21,15 21,17 6,20" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

export const StoneIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <polygon points="12,3 21,7.5 12,12 3,7.5" fill="currentColor" fillOpacity="0.35" />
    <polygon points="3,7.5 12,12 12,21 3,16.5" fill="currentColor" fillOpacity="0.15" />
    <polygon points="12,12 21,7.5 21,16.5 12,21" fill="currentColor" fillOpacity="0.5" />
    <line x1="7.5" y1="5.2" x2="16.5" y2="9.8" strokeWidth="1" opacity="0.4" />
    <line x1="7.5" y1="14.2" x2="7.5" y2="18.8" strokeWidth="1" opacity="0.4" />
    <line x1="16.5" y1="14.2" x2="16.5" y2="18.8" strokeWidth="1" opacity="0.4" />
  </svg>
);

export const ClayIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <polygon points="4,11 16,8 20,10 8,13" fill="currentColor" fillOpacity="0.3" />
    <polygon points="4,11 8,13 8,18 4,16" fill="currentColor" fillOpacity="0.5" />
    <polygon points="8,13 20,10 20,15 8,18" fill="currentColor" fillOpacity="0.2" />
    <path d="M14 3 C14 3 13 4 13 5 C11 5.5 10 7 10 9 C10 11 11.5 12 13 12 C14.5 12 16 11 16 9 C16 7 15 5.5 13 5" fill="currentColor" fillOpacity="0.2" />
    <line x1="12" y1="3" x2="14" y2="3" />
  </svg>
);

export const BreadIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M3 15 C3 9 7 6 12 6 C17 6 21 9 21 15 C21 17.5 19 19 12 19 C5 19 3 17.5 3 15 Z"
      fill="currentColor"
      fillOpacity="0.25"
    />
    <path d="M7 11 C8 9.5 9 9.5 10 11" strokeWidth="1.5" />
    <path d="M11 10 C12 8.5 13 8.5 14 10" strokeWidth="1.5" />
    <path d="M15 11 C16 9.5 17 9.5 18 11" strokeWidth="1.5" />
    <path d="M4.5 15.5 C8 17 16 17 19.5 15.5" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

export const WheatIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <line x1="12" y1="21" x2="12" y2="3" strokeWidth="1.6" />
    <ellipse cx="12" cy="4" rx="1.4" ry="2" fill="currentColor" fillOpacity="0.4" />
    <ellipse cx="9.5" cy="7" rx="1.3" ry="2" transform="rotate(-25 9.5 7)" fill="currentColor" fillOpacity="0.4" />
    <ellipse cx="14.5" cy="7" rx="1.3" ry="2" transform="rotate(25 14.5 7)" fill="currentColor" fillOpacity="0.4" />
    <ellipse cx="9" cy="11" rx="1.3" ry="2" transform="rotate(-30 9 11)" fill="currentColor" fillOpacity="0.4" />
    <ellipse cx="15" cy="11" rx="1.3" ry="2" transform="rotate(30 15 11)" fill="currentColor" fillOpacity="0.4" />
    <ellipse cx="9" cy="15" rx="1.3" ry="2" transform="rotate(-35 9 15)" fill="currentColor" fillOpacity="0.4" />
    <ellipse cx="15" cy="15" rx="1.3" ry="2" transform="rotate(35 15 15)" fill="currentColor" fillOpacity="0.4" />
    <path d="M10 18 C11 17.5 13 17.5 14 18" strokeWidth="2" stroke="currentColor" />
  </svg>
);

export const FlourIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M7 8 C5 10 4 14 5 18 C6 20 8 21 12 21 C16 21 18 20 19 18 C20 14 19 10 17 8 C16 7 15 6 15 4 L9 4 C9 6 8 7 7 8 Z"
      fill="currentColor"
      fillOpacity="0.25"
    />
    <ellipse cx="12" cy="7" rx="3.5" ry="1.2" strokeWidth="1.8" fill="currentColor" fillOpacity="0.4" />
    <circle cx="12" cy="14" r="2.5" strokeWidth="1.2" opacity="0.6" />
    <path d="M12 12.5 L12 15.5 M10.5 14 L13.5 14" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

export const AleIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M6 7 L7 20 C7 21 8 21 13 21 C18 21 19 21 19 20 L20 7 Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M6 9 C3 9 3 17 6 18" strokeWidth="2" strokeLinecap="round" />
    <path d="M6.3 11 C10 11.8 16 11.8 19.7 11" opacity="0.6" />
    <path d="M6.7 16 C10 16.8 16 16.8 19.3 16" opacity="0.6" />
    <path
      d="M5.5 7 C5.5 5 8 4 10 5 C11 3.5 14 3.5 15.5 4.8 C17 3.8 20 4.5 20.5 7 Z"
      fill="currentColor"
      fillOpacity="0.45"
    />
  </svg>
);

export const OxIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 4 C6 8 8 9 9.5 9" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M20 4 C18 8 16 9 14.5 9" strokeWidth="2.2" strokeLinecap="round" />
    <path
      d="M9.5 8 C9.5 8 8 11 8 13 C8 17 10 19 12 19 C14 19 16 17 16 13 C16 11 14.5 8 14.5 8 Z"
      fill="currentColor"
      fillOpacity="0.3"
    />
    <ellipse cx="12" cy="16.5" rx="2.5" ry="1.8" fill="currentColor" fillOpacity="0.5" />
    <circle cx="11" cy="16.5" r="0.6" fill="currentColor" />
    <circle cx="13" cy="16.5" r="0.6" fill="currentColor" />
    <path d="M9.5 8 L14.5 8" strokeWidth="2" />
  </svg>
);

export const StorageIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <ellipse cx="12" cy="4" rx="3.5" ry="1" fill="currentColor" fillOpacity="0.4" />
    <path d="M10 4.5 L10 7 C7 9 6 12 6 16 C6 19.5 9 21 12 21 C15 21 18 19.5 18 16 C18 12 17 9 14 7 L14 4.5" fill="currentColor" fillOpacity="0.25" />
    <path d="M10 6 C7 6 6 8 7 11 C8 12 9 12 10 11" strokeWidth="1.4" />
    <path d="M14 6 C17 6 18 8 17 11 C16 12 15 12 14 11" strokeWidth="1.4" />
    <path d="M8 14 C10 15 14 15 16 14" opacity="0.6" />
  </svg>
);

export const GoldIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.2" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="7" strokeDasharray="1.5 1.5" strokeWidth="1" opacity="0.7" />
    <path d="M12 7 L12 17 M7 12 L17 12" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="9.5" cy="9.5" r="0.6" fill="currentColor" />
    <circle cx="14.5" cy="9.5" r="0.6" fill="currentColor" />
    <circle cx="9.5" cy="14.5" r="0.6" fill="currentColor" />
    <circle cx="14.5" cy="14.5" r="0.6" fill="currentColor" />
  </svg>
);

export const WeaponsIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <line x1="5" y1="5" x2="19" y2="19" strokeWidth="1.8" />
    <line x1="16" y1="20" x2="20" y2="16" strokeWidth="2.2" />
    <circle cx="20.5" cy="20.5" r="1" fill="currentColor" />
    <line x1="19" y1="5" x2="5" y2="19" strokeWidth="1.8" />
    <line x1="4" y1="16" x2="8" y2="20" strokeWidth="2.2" />
    <circle cx="3.5" cy="20.5" r="1" fill="currentColor" />
  </svg>
);

export const FlameIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <line x1="4" y1="20" x2="20" y2="20" strokeWidth="2" />
    <line x1="6" y1="21" x2="18" y2="18" strokeWidth="1.5" opacity="0.6" />
    <path
      d="M12 3 C12 3 8 7 8 11 C8 13.5 9.5 15.5 11 16.5 C10 14.5 10.5 12 12 10.5 C13 12 13.5 13 13 15 C15 14 16 12 16 10 C16 7 12 3 12 3 Z"
      fill="currentColor"
      fillOpacity="0.35"
    />
    <path
      d="M12 11 C11.2 12.5 11.2 14.5 12 16 C12.8 14.5 12.8 12.5 12 11 Z"
      fill="currentColor"
      fillOpacity="0.8"
    />
  </svg>
);

export const CrownIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 18 L20 18 L19 15 L5 15 Z" fill="currentColor" fillOpacity="0.35" />
    <circle cx="8" cy="16.5" r="0.6" fill="currentColor" />
    <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
    <circle cx="16" cy="16.5" r="0.6" fill="currentColor" />
    <path
      d="M4 15 L5 7 L9 12 L12 5 L15 12 L19 7 L20 15"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <circle cx="5" cy="6.5" r="1" fill="currentColor" />
    <circle cx="12" cy="4.5" r="1.2" fill="currentColor" />
    <circle cx="19" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

export const ScalesIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.8" />
    <path d="M8 21 L16 21" strokeWidth="2" />
    <circle cx="12" cy="3" r="1" fill="currentColor" />
    <line x1="5" y1="7" x2="19" y2="7" strokeWidth="2" />
    <line x1="5" y1="7" x2="3" y2="13" strokeWidth="1.2" />
    <line x1="5" y1="7" x2="7" y2="13" strokeWidth="1.2" />
    <path d="M2.5 13 C3.5 15 6.5 15 7.5 13 Z" fill="currentColor" fillOpacity="0.4" />
    <line x1="19" y1="7" x2="17" y2="13" strokeWidth="1.2" />
    <line x1="19" y1="7" x2="21" y2="13" strokeWidth="1.2" />
    <path d="M16.5 13 C17.5 15 20.5 15 21.5 13 Z" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

export const PeasantsIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="9" cy="7" r="3" fill="currentColor" fillOpacity="0.35" />
    <path d="M9 4 C7 4 6 5.5 6 7.5 C6 8.5 7 9.5 9 10 C11 9.5 12 8.5 12 7.5 C12 5.5 11 4 9 4 Z" fill="currentColor" fillOpacity="0.5" />
    <path d="M3.5 20 C3.5 15 6 13 9 13 C12 13 14.5 15 14.5 20" fill="currentColor" fillOpacity="0.2" />
    <path d="M15 7 A 2.5 2.5 0 0 1 18.5 9.5" strokeWidth="1.4" />
    <path d="M14.5 14 C16.5 14 19.5 15.5 20.5 20" strokeWidth="1.4" />
  </svg>
);

export const InfluenceIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M8 21 L16 21 L17 14 L7 14 Z" fill="currentColor" fillOpacity="0.3" />
    <line x1="7" y1="17" x2="17" y2="17" strokeWidth="1.2" opacity="0.6" />
    <path
      d="M7 14 C7 11 8 9 9 9 C9.5 9 10 9.5 10 11 L10 7 C10 6 11 6 11.5 6 C12 6 12.5 6.5 12.5 7.5 L12.5 7 C12.5 6 13.5 6 14 6 C14.5 6 15 6.5 15 7.5 L15 8 C15 7 16 7 16.5 7.5 C17 8 17 9 17 14 Z"
      fill="currentColor"
      fillOpacity="0.4"
    />
  </svg>
);

export const MonarchIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M7 8 L8 4 L10.5 6.5 L12 3 L13.5 6.5 L16 4 L17 8 Z" fill="currentColor" fillOpacity="0.5" />
    <circle cx="12" cy="11" r="3.5" fill="currentColor" fillOpacity="0.25" />
    <path d="M5 21 C5 16 8 15 12 15 C16 15 19 16 19 21 Z" fill="currentColor" fillOpacity="0.35" />
    <path d="M8 17 C10 19 14 19 16 17" strokeWidth="1.8" />
  </svg>
);

export const RoadIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M8 21 C10 16 7 11 11 3" strokeWidth="1.8" />
    <path d="M16 21 C18 16 13 11 15 3" strokeWidth="1.8" />
    <path d="M10 17 L14 17" strokeWidth="1.2" strokeDasharray="1 2" />
    <path d="M8.5 12 L13.5 12" strokeWidth="1.2" strokeDasharray="1 2" />
    <path d="M11 7 L14 7" strokeWidth="1.2" strokeDasharray="1 2" />
    <path d="M8 21 C10 16 7 11 11 3 L15 3 C13 11 18 16 16 21 Z" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

export const HammerIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <polygon points="14,4 20,10 18,12 12,6" fill="currentColor" fillOpacity="0.4" strokeWidth="1.8" />
    <line x1="15" y1="9" x2="6" y2="18" strokeWidth="2.4" />
    <path d="M5 17 L7 19" strokeWidth="2" />
    <path d="M4 8 L4 14 L10 14" strokeWidth="1.4" opacity="0.7" />
  </svg>
);

export const ShieldIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M12 3 L20 4 C20 12 17 18 12 21 C7 18 4 12 4 4 Z"
      fill="currentColor"
      fillOpacity="0.25"
      strokeWidth="1.8"
    />
    <line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.4" opacity="0.6" />
    <line x1="4.5" y1="9" x2="19.5" y2="9" strokeWidth="1.4" opacity="0.6" />
    <circle cx="12" cy="9" r="1.5" fill="currentColor" />
  </svg>
);

export const ScrollIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M6 6 C6 4.5 8 3.5 10 3.5 L19 3.5 C20.5 3.5 21.5 4.5 21.5 6 C21.5 7.5 20.5 8.5 19 8.5 L6 8.5" fill="currentColor" fillOpacity="0.3" />
    <path d="M6 8.5 L6 18 C6 19.5 5 20.5 3.5 20.5 C2 20.5 2 19 3.5 18 L17 18 C18.5 18 20 19 20 20.5" fill="currentColor" fillOpacity="0.15" />
    <line x1="9" y1="11" x2="16" y2="11" strokeWidth="1.2" opacity="0.6" />
    <line x1="9" y1="13.5" x2="15" y2="13.5" strokeWidth="1.2" opacity="0.6" />
    <line x1="9" y1="16" x2="13" y2="16" strokeWidth="1.2" opacity="0.6" />
    <circle cx="17.5" cy="15.5" r="2" fill="currentColor" fillOpacity="0.6" strokeWidth="1" />
  </svg>
);

export const DiplomacyDeskIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 9 L17 4 L21 7 L8 12 Z" fill="currentColor" fillOpacity="0.35" />
    <path d="M8 12 L8 17 L21 12 L21 7" />
    <path d="M10 7 L17 4.5" strokeWidth="1.2" opacity="0.75" />
    <path d="M11 9 L17 6.7" strokeWidth="1.2" opacity="0.75" />
    <line x1="7" y1="14" x2="5" y2="20" strokeWidth="1.8" />
    <line x1="5" y1="20" x2="9" y2="20" strokeWidth="1.8" />
    <line x1="18" y1="13" x2="20" y2="20" strokeWidth="1.8" />
    <circle cx="17.5" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

export const SettingsIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="5" strokeWidth="1.8" fill="currentColor" fillOpacity="0.25" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="12" y1="3" x2="12" y2="6" strokeWidth="2.2" />
    <line x1="12" y1="18" x2="12" y2="21" strokeWidth="2.2" />
    <line x1="3" y1="12" x2="6" y2="12" strokeWidth="2.2" />
    <line x1="18" y1="12" x2="21" y2="12" strokeWidth="2.2" />
    <line x1="5.6" y1="5.6" x2="7.8" y2="7.8" strokeWidth="2.2" />
    <line x1="16.2" y1="16.2" x2="18.4" y2="18.4" strokeWidth="2.2" />
    <line x1="5.6" y1="18.4" x2="7.8" y2="16.2" strokeWidth="2.2" />
    <line x1="16.2" y1="7.8" x2="18.4" y2="5.6" strokeWidth="2.2" />
  </svg>
);

export const EraserIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M18 4 L20 6 L9 17 L5 17 L5 13 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="1.8" />
    <line x1="14" y1="8" x2="16" y2="10" strokeWidth="1.2" />
    <path d="M3 21 L9 21" strokeWidth="2" />
    <line x1="5" y1="17" x2="3" y2="21" strokeWidth="1.6" strokeDasharray="1 1" />
  </svg>
);

export const CrossCloseIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
    <circle cx="6" cy="6" r="0.8" fill="currentColor" />
    <circle cx="18" cy="18" r="0.8" fill="currentColor" />
    <circle cx="18" cy="6" r="0.8" fill="currentColor" />
    <circle cx="6" cy="18" r="0.8" fill="currentColor" />
  </svg>
);

export const TownCenterIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M5 21 L5 9 L7 9 L7 7 L9 7 L9 9 L11 9 L11 7 L13 7 L13 9 L15 9 L15 7 L17 7 L17 9 L19 9 L19 21 Z" fill="currentColor" fillOpacity="0.25" />
    <path d="M10 21 L10 15 C10 13.9 10.9 13 12 13 C13.1 13 14 13.9 14 15 L14 21" fill="currentColor" fillOpacity="0.5" />
    <line x1="8" y1="12" x2="8" y2="14" strokeWidth="1.5" />
    <line x1="16" y1="12" x2="16" y2="14" strokeWidth="1.5" />
    <line x1="12" y1="9" x2="12" y2="11" strokeWidth="1.5" />
  </svg>
);

export const ClarionHornIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M3 13 L8 13 L17 8 L17 18 L8 13" fill="currentColor" fillOpacity="0.3" strokeWidth="1.8" />
    <ellipse cx="18" cy="13" rx="1.5" ry="5" fill="currentColor" fillOpacity="0.5" />
    <line x1="3" y1="12" x2="3" y2="14" strokeWidth="2" />
    <path d="M9 13 L9 19 L13 17 L13 13" fill="currentColor" fillOpacity="0.4" strokeWidth="1.2" />
  </svg>
);

export const ClarionMutedIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M3 13 L8 13 L17 8 L17 18 L8 13" fill="currentColor" fillOpacity="0.15" strokeWidth="1.8" />
    <ellipse cx="18" cy="13" rx="1.5" ry="5" />
    <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" stroke="currentColor" />
  </svg>
);

export const SpringSeasonIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 20 C8 17 12 14 17 5" strokeWidth="1.8" />
    <path d="M17 5 C15 4 13 6 14 8 C15 10 18 8 17 5 Z" fill="currentColor" fillOpacity="0.4" />
    <path d="M11 11 C8 10 8 13 10 14 C12 15 13 13 11 11 Z" fill="currentColor" fillOpacity="0.4" />
    <path d="M7 16 C5 16 5 18 7 19 C9 19 9 17 7 16 Z" fill="currentColor" fillOpacity="0.4" />
    <circle cx="19" cy="4" r="1" fill="currentColor" />
  </svg>
);

export const SummerSeasonIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="4.5" fill="currentColor" fillOpacity="0.35" strokeWidth="1.8" />
    <line x1="12" y1="2" x2="12" y2="5" strokeWidth="1.8" />
    <line x1="12" y1="19" x2="12" y2="22" strokeWidth="1.8" />
    <line x1="2" y1="12" x2="5" y2="12" strokeWidth="1.8" />
    <line x1="19" y1="12" x2="22" y2="12" strokeWidth="1.8" />
    <path d="M17 7 C18 6 19 6 20 4" strokeWidth="1.5" />
    <path d="M7 17 C6 18 5 18 4 20" strokeWidth="1.5" />
    <path d="M17 17 C18 18 19 18 20 20" strokeWidth="1.5" />
    <path d="M7 7 C6 6 5 6 4 4" strokeWidth="1.5" />
  </svg>
);

export const AutumnSeasonIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M17 5 C10 4 6 9 6 14 C6 17 8 19 11 19 C14 19 17 16 17 14 C17 11 13 9 10 11 C11 7 14 6 17 5 Z"
      fill="currentColor"
      fillOpacity="0.35"
      strokeWidth="1.6"
    />
    <path d="M11 19 L13 22" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const WinterSeasonIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.8" />
    <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" strokeWidth="1.8" />
    <line x1="4.2" y1="16.5" x2="19.8" y2="7.5" strokeWidth="1.8" />
    <path d="M10 5 L12 3 L14 5" strokeWidth="1.4" />
    <path d="M10 19 L12 21 L14 19" strokeWidth="1.4" />
    <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.5" strokeWidth="1.2" />
  </svg>
);

export const WeatherClearIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <SummerSeasonIcon className={className} size={size} color={color} />
);

export const WeatherRainIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M7 14 C5.3 14 4 12.7 4 11 C4 9.5 5 8.2 6.5 8 C7.2 5.7 9.4 4 12 4 C15.1 4 17.6 6.3 17.9 9.3 C19.2 9.7 20 10.8 20 12 C20 13.7 18.7 14 17 14 Z"
      fill="currentColor"
      fillOpacity="0.25"
    />
    <line x1="8" y1="16" x2="6" y2="20" strokeWidth="1.6" />
    <line x1="12" y1="16" x2="10" y2="20" strokeWidth="1.6" />
    <line x1="16" y1="16" x2="14" y2="20" strokeWidth="1.6" />
  </svg>
);

export const WeatherStormIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M7 13 C5.3 13 4 11.7 4 10 C4 8.5 5 7.2 6.5 7 C7.2 4.7 9.4 3 12 3 C15.1 3 17.6 5.3 17.9 8.3 C19.2 8.7 20 9.8 20 11 C20 12.7 18.7 13 17 13 Z"
      fill="currentColor"
      fillOpacity="0.3"
    />
    <polygon points="13,11 9,17 13,17 11,22 17,15 13,15" fill="currentColor" strokeWidth="1.4" />
  </svg>
);

export const WeatherSnowIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M7 13 C5.3 13 4 11.7 4 10 C4 8.5 5 7.2 6.5 7 C7.2 4.7 9.4 3 12 3 C15.1 3 17.6 5.3 17.9 8.3 C19.2 8.7 20 9.8 20 11 C20 12.7 18.7 13 17 13 Z"
      fill="currentColor"
      fillOpacity="0.25"
    />
    <circle cx="8" cy="18" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1.2" fill="currentColor" />
    <circle cx="16" cy="17.5" r="1" fill="currentColor" />
  </svg>
);

export const CompassIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="6" strokeWidth="1" strokeDasharray="1 1.5" opacity="0.6" />
    <polygon points="12,4 13.5,10.5 12,12 10.5,10.5" fill="currentColor" />
    <polygon points="12,20 13.5,13.5 12,12 10.5,13.5" fill="currentColor" fillOpacity="0.4" />
    <polygon points="20,12 13.5,13.5 12,12 13.5,10.5" fill="currentColor" fillOpacity="0.4" />
    <polygon points="4,12 10.5,13.5 12,12 10.5,10.5" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

export const HourglassIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M6 3 L18 3 M6 21 L18 21" strokeWidth="2" />
    <path
      d="M7 3 C7 9 11 11 12 12 C13 11 17 9 17 3"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M7 21 C7 15 11 13 12 12 C13 13 17 15 17 21"
      fill="currentColor"
      fillOpacity="0.45"
    />
  </svg>
);

export const MapParchmentIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" fill="currentColor" fillOpacity="0.25" strokeWidth="1.8" />
    <line x1="9" y1="3" x2="9" y2="18" strokeWidth="1.5" opacity="0.6" />
    <line x1="15" y1="6" x2="15" y2="21" strokeWidth="1.5" opacity="0.6" />
    <path d="M6 10 C7 9 11 11 13 10" strokeWidth="1.2" strokeDasharray="1 1.5" />
  </svg>
);

export const SlumberMoonIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M12 3 C7 3 3 7 3 12 C3 17 7 21 12 21 C14 21 15.8 20.3 17.3 19.2 C12.8 18.6 9.4 14.8 9.4 10 C9.4 6.8 11 4 13.6 3.2 C13.1 3.1 12.5 3 12 3 Z"
      fill="currentColor"
      fillOpacity="0.35"
    />
    <circle cx="17" cy="6" r="0.8" fill="currentColor" />
    <circle cx="19" cy="11" r="0.8" fill="currentColor" />
  </svg>
);

export const DiplomacyPactIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M2 13 L6 10 L10 12 L8 15 Z" fill="currentColor" fillOpacity="0.3" />
    <path d="M22 13 L18 10 L14 12 L16 15 Z" fill="currentColor" fillOpacity="0.3" />
    <path d="M10 12 C10.5 10.5 13.5 10.5 14 12 C14 14 10 14 10 12 Z" fill="currentColor" fillOpacity="0.6" strokeWidth="1.8" />
  </svg>
);

export const FleurDeLisIcon: React.FC<MedievalIconProps> = ({ className = 'w-3 h-3', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M12 2 C11.5 5 9.5 7 9.5 9 C9.5 11 11 12 12 12 C13 12 14.5 11 14.5 9 C14.5 7 12.5 5 12 2 Z" />
    <path d="M7 8 C5 9 3 11 3 13 C3 15 5 16 7 15 C8.5 14 8.5 12.5 9 12 C7.5 11.5 7 10 7 8 Z" />
    <path d="M17 8 C19 9 21 11 21 13 C21 15 19 16 17 15 C15.5 14 15.5 12.5 15 12 C16.5 11.5 17 10 17 8 Z" />
    <path d="M5 14.5 L19 14.5 L18 16.5 L6 16.5 Z" />
    <path d="M12 17 C11 19 10 21 8 22 C12 22 12 18 12 17 C12 18 12 22 16 22 C14 21 13 19 12 17 Z" />
  </svg>
);

export const MedievalAlertIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M12 3 L22 20 L2 20 Z" fill="currentColor" fillOpacity="0.25" strokeWidth="1.8" />
    <line x1="12" y1="9" x2="12" y2="14" strokeWidth="2" />
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const MedievalCheckIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="9" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
    <polyline points="7.5 12 10.5 15 16.5 9" />
  </svg>
);

export const MedievalInfoIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    <line x1="12" y1="11" x2="12" y2="16.5" strokeWidth="2" />
    <line x1="10.5" y1="11" x2="12" y2="11" strokeWidth="1.6" />
    <line x1="10" y1="16.5" x2="14" y2="16.5" strokeWidth="1.6" />
  </svg>
);

export const CastleKeepIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 21 L20 21 L20 9 L17 9 L17 6 L15 6 L15 9 L9 9 L9 6 L7 6 L7 9 L4 9 Z" fill="currentColor" fillOpacity="0.3" />
    <line x1="4" y1="5" x2="4" y2="9" />
    <line x1="20" y1="5" x2="20" y2="9" />
    <line x1="4" y1="5" x2="6" y2="5" />
    <line x1="18" y1="5" x2="20" y2="5" />
    <path d="M10 21 L10 15 C10 13.9 10.9 13 12 13 C13.1 13 14 13.9 14 15 L14 21 Z" fill="currentColor" fillOpacity="0.6" />
    <line x1="7" y1="12" x2="7" y2="14" strokeWidth="1.5" />
    <line x1="17" y1="12" x2="17" y2="14" strokeWidth="1.5" />
  </svg>
);

export const PlayCrestIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <polygon points="7 4 19 12 7 20 7 4" />
  </svg>
);
