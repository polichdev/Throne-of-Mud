import React from 'react';
import { IlluminatedIcon } from './IlluminatedIcons';

export interface MedievalIconProps {
  className?: string;
  size?: number | string;
  color?: string;
  title?: string;
}

export const WoodIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='wood' {...props} />;

export const PlanksIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='planks' {...props} />;

export const StoneIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='stone' {...props} />;

export const ClayIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='clay' {...props} />;

export const BreadIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='bread' {...props} />;

export const WheatIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='wheat' {...props} />;

export const FlourIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M7 8 C5 10 4 14 5 18 C6 20 8 21 12 21 C16 21 18 20 19 18 C20 14 19 10 17 8 C16 7 15 6 15 4 L9 4 C9 6 8 7 7 8 Z"
      fill="#e9dbb9"
      fillOpacity="0.25"
    />
    <ellipse cx="12" cy="7" rx="3.5" ry="1.2" strokeWidth="1.8" fill="#e9dbb9" fillOpacity="0.4" />
    <circle cx="12" cy="14" r="2.5" strokeWidth="1.2" opacity="0.6" />
    <path d="M12 12.5 L12 15.5 M10.5 14 L13.5 14" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

export const AleIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='ale' {...props} />;

export const OxIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='ox' {...props} />;

export const StorageIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='storage' {...props} />;

export const GoldIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='gold' {...props} />;

export const WeaponsIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='weapons' {...props} />;

export const FlameIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='flame' {...props} />;

export const CrownIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 18 L20 18 L19 15 L5 15 Z" fill="#d4a84f" fillOpacity="0.35" />
    <circle cx="8" cy="16.5" r="0.6" fill="#d4a84f" />
    <circle cx="12" cy="16.5" r="0.6" fill="#d4a84f" />
    <circle cx="16" cy="16.5" r="0.6" fill="#d4a84f" />
    <path
      d="M4 15 L5 7 L9 12 L12 5 L15 12 L19 7 L20 15"
      fill="#d4a84f"
      fillOpacity="0.2"
    />
    <circle cx="5" cy="6.5" r="1" fill="#d4a84f" />
    <circle cx="12" cy="4.5" r="1.2" fill="#d4a84f" />
    <circle cx="19" cy="6.5" r="1" fill="#d4a84f" />
  </svg>
);

export const ScalesIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.8" />
    <path d="M8 21 L16 21" strokeWidth="2" />
    <circle cx="12" cy="3" r="1" fill="#c9a667" />
    <line x1="5" y1="7" x2="19" y2="7" strokeWidth="2" />
    <line x1="5" y1="7" x2="3" y2="13" strokeWidth="1.2" />
    <line x1="5" y1="7" x2="7" y2="13" strokeWidth="1.2" />
    <path d="M2.5 13 C3.5 15 6.5 15 7.5 13 Z" fill="#c9a667" fillOpacity="0.4" />
    <line x1="19" y1="7" x2="17" y2="13" strokeWidth="1.2" />
    <line x1="19" y1="7" x2="21" y2="13" strokeWidth="1.2" />
    <path d="M16.5 13 C17.5 15 20.5 15 21.5 13 Z" fill="#c9a667" fillOpacity="0.4" />
  </svg>
);

export const PeasantsIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='peasants' {...props} />;

export const InfluenceIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='influence' {...props} />;

export const MonarchIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M7 8 L8 4 L10.5 6.5 L12 3 L13.5 6.5 L16 4 L17 8 Z" fill="#984d3d" fillOpacity="0.5" />
    <circle cx="12" cy="11" r="3.5" fill="#984d3d" fillOpacity="0.25" />
    <path d="M5 21 C5 16 8 15 12 15 C16 15 19 16 19 21 Z" fill="#984d3d" fillOpacity="0.35" />
    <path d="M8 17 C10 19 14 19 16 17" strokeWidth="1.8" />
  </svg>
);

export const RoadIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='road' {...props} />;

export const HammerIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='hammer' {...props} />;

export const ShieldIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='shield' {...props} />;

export const ScrollIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M6 6 C6 4.5 8 3.5 10 3.5 L19 3.5 C20.5 3.5 21.5 4.5 21.5 6 C21.5 7.5 20.5 8.5 19 8.5 L6 8.5" fill="#e0cda0" fillOpacity="0.3" />
    <path d="M6 8.5 L6 18 C6 19.5 5 20.5 3.5 20.5 C2 20.5 2 19 3.5 18 L17 18 C18.5 18 20 19 20 20.5" fill="#e0cda0" fillOpacity="0.15" />
    <line x1="9" y1="11" x2="16" y2="11" strokeWidth="1.2" opacity="0.6" />
    <line x1="9" y1="13.5" x2="15" y2="13.5" strokeWidth="1.2" opacity="0.6" />
    <line x1="9" y1="16" x2="13" y2="16" strokeWidth="1.2" opacity="0.6" />
    <circle cx="17.5" cy="15.5" r="2" fill="#e0cda0" fillOpacity="0.6" strokeWidth="1" />
  </svg>
);

export const DiplomacyDeskIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 9 L17 4 L21 7 L8 12 Z" fill="#a8794b" fillOpacity="0.35" />
    <path d="M8 12 L8 17 L21 12 L21 7" />
    <path d="M10 7 L17 4.5" strokeWidth="1.2" opacity="0.75" />
    <path d="M11 9 L17 6.7" strokeWidth="1.2" opacity="0.75" />
    <line x1="7" y1="14" x2="5" y2="20" strokeWidth="1.8" />
    <line x1="5" y1="20" x2="9" y2="20" strokeWidth="1.8" />
    <line x1="18" y1="13" x2="20" y2="20" strokeWidth="1.8" />
    <circle cx="17.5" cy="18" r="1.5" fill="#a8794b" />
  </svg>
);

export const SettingsIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="5" strokeWidth="1.8" fill="#9ba6a2" fillOpacity="0.25" />
    <circle cx="12" cy="12" r="2" fill="#9ba6a2" />
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
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M18 4 L20 6 L9 17 L5 17 L5 13 Z" fill="#ba816c" fillOpacity="0.3" strokeWidth="1.8" />
    <line x1="14" y1="8" x2="16" y2="10" strokeWidth="1.2" />
    <path d="M3 21 L9 21" strokeWidth="2" />
    <line x1="5" y1="17" x2="3" y2="21" strokeWidth="1.6" strokeDasharray="1 1" />
  </svg>
);

export const CrossCloseIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
    <circle cx="6" cy="6" r="0.8" fill="#c29377" />
    <circle cx="18" cy="18" r="0.8" fill="#c29377" />
    <circle cx="18" cy="6" r="0.8" fill="#c29377" />
    <circle cx="6" cy="18" r="0.8" fill="#c29377" />
  </svg>
);

export const TownCenterIcon: React.FC<MedievalIconProps> = (props) => <IlluminatedIcon kind='town' {...props} />;

export const ClarionHornIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M3 13 L8 13 L17 8 L17 18 L8 13" fill="#d0a74e" fillOpacity="0.3" strokeWidth="1.8" />
    <ellipse cx="18" cy="13" rx="1.5" ry="5" fill="#d0a74e" fillOpacity="0.5" />
    <line x1="3" y1="12" x2="3" y2="14" strokeWidth="2" />
    <path d="M9 13 L9 19 L13 17 L13 13" fill="#d0a74e" fillOpacity="0.4" strokeWidth="1.2" />
  </svg>
);

export const ClarionMutedIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M3 13 L8 13 L17 8 L17 18 L8 13" fill="#9f9f91" fillOpacity="0.15" strokeWidth="1.8" />
    <ellipse cx="18" cy="13" rx="1.5" ry="5" />
    <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" stroke="#44382d" />
  </svg>
);

export const SpringSeasonIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 20 C8 17 12 14 17 5" strokeWidth="1.8" />
    <path d="M17 5 C15 4 13 6 14 8 C15 10 18 8 17 5 Z" fill="#81a05d" fillOpacity="0.4" />
    <path d="M11 11 C8 10 8 13 10 14 C12 15 13 13 11 11 Z" fill="#81a05d" fillOpacity="0.4" />
    <path d="M7 16 C5 16 5 18 7 19 C9 19 9 17 7 16 Z" fill="#81a05d" fillOpacity="0.4" />
    <circle cx="19" cy="4" r="1" fill="#81a05d" />
  </svg>
);

export const SummerSeasonIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="4.5" fill="#d8b557" fillOpacity="0.35" strokeWidth="1.8" />
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
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M17 5 C10 4 6 9 6 14 C6 17 8 19 11 19 C14 19 17 16 17 14 C17 11 13 9 10 11 C11 7 14 6 17 5 Z"
      fill="#b97142"
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
    stroke="#44382d"
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
    <circle cx="12" cy="12" r="2" fill="#c5d6d5" fillOpacity="0.5" strokeWidth="1.2" />
  </svg>
);

export const WeatherClearIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <SummerSeasonIcon className={className} size={size} color={color} />
);

export const WeatherRainIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M7 14 C5.3 14 4 12.7 4 11 C4 9.5 5 8.2 6.5 8 C7.2 5.7 9.4 4 12 4 C15.1 4 17.6 6.3 17.9 9.3 C19.2 9.7 20 10.8 20 12 C20 13.7 18.7 14 17 14 Z"
      fill="#8caec2"
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
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M7 13 C5.3 13 4 11.7 4 10 C4 8.5 5 7.2 6.5 7 C7.2 4.7 9.4 3 12 3 C15.1 3 17.6 5.3 17.9 8.3 C19.2 8.7 20 9.8 20 11 C20 12.7 18.7 13 17 13 Z"
      fill="#6c8190"
      fillOpacity="0.3"
    />
    <polygon points="13,11 9,17 13,17 11,22 17,15 13,15" fill="#6c8190" strokeWidth="1.4" />
  </svg>
);

export const WeatherSnowIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M7 13 C5.3 13 4 11.7 4 10 C4 8.5 5 7.2 6.5 7 C7.2 4.7 9.4 3 12 3 C15.1 3 17.6 5.3 17.9 8.3 C19.2 8.7 20 9.8 20 11 C20 12.7 18.7 13 17 13 Z"
      fill="#dce5df"
      fillOpacity="0.25"
    />
    <circle cx="8" cy="18" r="1" fill="#dce5df" />
    <circle cx="12" cy="19" r="1.2" fill="#dce5df" />
    <circle cx="16" cy="17.5" r="1" fill="#dce5df" />
  </svg>
);

export const CompassIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="6" strokeWidth="1" strokeDasharray="1 1.5" opacity="0.6" />
    <polygon points="12,4 13.5,10.5 12,12 10.5,10.5" fill="#c8a354" />
    <polygon points="12,20 13.5,13.5 12,12 10.5,13.5" fill="#c8a354" fillOpacity="0.4" />
    <polygon points="20,12 13.5,13.5 12,12 13.5,10.5" fill="#c8a354" fillOpacity="0.4" />
    <polygon points="4,12 10.5,13.5 12,12 10.5,10.5" fill="#c8a354" fillOpacity="0.4" />
  </svg>
);

export const HourglassIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M6 3 L18 3 M6 21 L18 21" strokeWidth="2" />
    <path
      d="M7 3 C7 9 11 11 12 12 C13 11 17 9 17 3"
      fill="#b08552"
      fillOpacity="0.2"
    />
    <path
      d="M7 21 C7 15 11 13 12 12 C13 13 17 15 17 21"
      fill="#b08552"
      fillOpacity="0.45"
    />
  </svg>
);

export const MapParchmentIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" fill="#dfcca0" fillOpacity="0.25" strokeWidth="1.8" />
    <line x1="9" y1="3" x2="9" y2="18" strokeWidth="1.5" opacity="0.6" />
    <line x1="15" y1="6" x2="15" y2="21" strokeWidth="1.5" opacity="0.6" />
    <path d="M6 10 C7 9 11 11 13 10" strokeWidth="1.2" strokeDasharray="1 1.5" />
  </svg>
);

export const SlumberMoonIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path
      d="M12 3 C7 3 3 7 3 12 C3 17 7 21 12 21 C14 21 15.8 20.3 17.3 19.2 C12.8 18.6 9.4 14.8 9.4 10 C9.4 6.8 11 4 13.6 3.2 C13.1 3.1 12.5 3 12 3 Z"
      fill="#b8b9bb"
      fillOpacity="0.35"
    />
    <circle cx="17" cy="6" r="0.8" fill="#b8b9bb" />
    <circle cx="19" cy="11" r="0.8" fill="#b8b9bb" />
  </svg>
);

export const DiplomacyPactIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M2 13 L6 10 L10 12 L8 15 Z" fill="#a65f4a" fillOpacity="0.3" />
    <path d="M22 13 L18 10 L14 12 L16 15 Z" fill="#a65f4a" fillOpacity="0.3" />
    <path d="M10 12 C10.5 10.5 13.5 10.5 14 12 C14 14 10 14 10 12 Z" fill="#a65f4a" fillOpacity="0.6" strokeWidth="1.8" />
  </svg>
);

export const FleurDeLisIcon: React.FC<MedievalIconProps> = ({ className = 'w-3 h-3', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="#d9b45c"
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
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M12 3 L22 20 L2 20 Z" fill="#cf7949" fillOpacity="0.25" strokeWidth="1.8" />
    <line x1="12" y1="9" x2="12" y2="14" strokeWidth="2" />
    <circle cx="12" cy="17" r="1" fill="#cf7949" stroke="none" />
  </svg>
);

export const MedievalCheckIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="9" strokeWidth="1.4" fill="#829c62" fillOpacity="0.2" />
    <polyline points="7.5 12 10.5 15 16.5 9" />
  </svg>
);

export const MedievalInfoIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <circle cx="12" cy="12" r="9.5" fill="#83a2a9" fillOpacity="0.2" />
    <circle cx="12" cy="7.5" r="1.2" fill="#83a2a9" stroke="none" />
    <line x1="12" y1="11" x2="12" y2="16.5" strokeWidth="2" />
    <line x1="10.5" y1="11" x2="12" y2="11" strokeWidth="1.6" />
    <line x1="10" y1="16.5" x2="14" y2="16.5" strokeWidth="1.6" />
  </svg>
);

export const CastleKeepIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M4 21 L20 21 L20 9 L17 9 L17 6 L15 6 L15 9 L9 9 L9 6 L7 6 L7 9 L4 9 Z" fill="#a8a69b" fillOpacity="0.3" />
    <line x1="4" y1="5" x2="4" y2="9" />
    <line x1="20" y1="5" x2="20" y2="9" />
    <line x1="4" y1="5" x2="6" y2="5" />
    <line x1="18" y1="5" x2="20" y2="5" />
    <path d="M10 21 L10 15 C10 13.9 10.9 13 12 13 C13.1 13 14 13.9 14 15 L14 21 Z" fill="#a8a69b" fillOpacity="0.6" />
    <line x1="7" y1="12" x2="7" y2="14" strokeWidth="1.5" />
    <line x1="17" y1="12" x2="17" y2="14" strokeWidth="1.5" />
  </svg>
);

export const PlayCrestIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="#9ca56d"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <polygon points="7 4 19 12 7 20 7 4" />
  </svg>
);

export const CarrotIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M14 6 C17 3 19 3 20 4 C21 5 21 7 18 10 L8 20 C6 22 4 21 3 20 C2 19 2 17 4 15 Z" fill="#d78343" fillOpacity="0.25" />
    <path d="M17 7 L21 3" />
    <path d="M19 5 L22 6" />
    <path d="M18 4 L19 1" />
    <line x1="7" y1="14" x2="10" y2="17" opacity="0.6" />
    <line x1="11" y1="10" x2="14" y2="13" opacity="0.6" />
  </svg>
);

export const ChickenIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M15 7 C15 4.5 13 3 10.5 3 C9.5 3 8.5 3.5 8 4.5 C7.5 4 6.5 4 6 4.5 C5.5 5 5.5 6 6 6.5 L4 7 L5.5 8.5 C4.5 10 4.5 12 5.5 13.5 C4 15 3.5 17 4 18.5 C4.5 20 6 21 8 21 L14 21 C17 21 19 19 19 16 C19 14 18 12.5 16.5 11.5 C16.8 10 16.5 8.5 15 7 Z" fill="#e1cfac" fillOpacity="0.2" />
    <circle cx="9" cy="6" r="0.75" fill="#e1cfac" />
    <path d="M9 21 L8 23" />
    <path d="M13 21 L14 23" />
    <path d="M11 12 C13 12 14.5 13.5 14.5 15.5" strokeDasharray="1 1" />
  </svg>
);

export const GoatIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M5 8 L8 6 L10 9 L7 11 Z" fill="#c9b695" fillOpacity="0.2" />
    <path d="M8 6 C9 4 11 3 13 4 C14 4.5 14.5 6 14 7.5 L12 8" />
    <path d="M6 8 C5 6 4 4 2 4 C1 4 0.5 5 1 6.5 L3 8" />
    <path d="M7 11 L10 13 L17 13 C19 13 20 14 20 16 L20 19 L18 19 L18 16 L12 16 L11 20 L9 20 L9 15 L7 13 Z" fill="#c9b695" fillOpacity="0.15" />
    <circle cx="8" cy="8.5" r="0.75" fill="#c9b695" />
  </svg>
);

export const BowIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M5 4 C14 7 14 17 5 20" strokeWidth="2" stroke="#44382d" fill="none" />
    <line x1="5" y1="4" x2="5" y2="20" strokeWidth="1" strokeDasharray="2 1" />
    <line x1="3" y1="12" x2="19" y2="12" strokeWidth="1.6" />
    <polyline points="15,9 19,12 15,15" fill="#a9794c" fillOpacity="0.3" />
    <polyline points="4,11 2,12 4,13" />
  </svg>
);

export const BeerKegIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <ellipse cx="12" cy="5" rx="7" ry="2.5" fill="#a87547" fillOpacity="0.25" />
    <path d="M5 5 C3.5 10 3.5 14 5 19 C7 21 17 21 19 19 C20.5 14 20.5 10 19 5" fill="#a87547" fillOpacity="0.15" />
    <ellipse cx="12" cy="19" rx="7" ry="2.5" />
    <path d="M4 10 C8 11.5 16 11.5 20 10" />
    <path d="M4 14 C8 15.5 16 15.5 20 14" />
    <circle cx="12" cy="12" r="1" fill="#a87547" />
  </svg>
);

export const HouseTierIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M3 10 L12 3 L21 10 L21 20 C21 20.6 20.6 21 20 21 L4 21 C3.4 21 3 20.6 3 20 Z" fill="#d1be95" fillOpacity="0.2" />
    <path d="M9 21 L9 14 L15 14 L15 21" fill="#d1be95" fillOpacity="0.4" />
    <line x1="17" y1="7" x2="17" y2="4" />
    <line x1="17" y1="4" x2="19" y2="4" />
    <line x1="19" y1="4" x2="19" y2="8.5" />
  </svg>
);

export const CrestBadgeIcon: React.FC<MedievalIconProps> = ({ className = 'w-4 h-4', size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#44382d"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: size, height: size, color }}
  >
    <path d="M12 2 L4 5 L4 12 C4 17.5 7.5 21.5 12 23 C16.5 21.5 20 17.5 20 12 L20 5 Z" fill="#9d5547" fillOpacity="0.25" />
    <path d="M12 6 L12 18" strokeWidth="1.2" opacity="0.6" />
    <path d="M6 12 L18 12" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

