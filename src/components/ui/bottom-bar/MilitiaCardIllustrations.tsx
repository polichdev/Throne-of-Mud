import type { FC } from 'react';

type PortraitProps = { className?: string };

const MilitiaPortrait: FC<PortraitProps & { file: string }> = ({ file, className = 'w-full h-full' }) =>
  <img className={`${className} object-cover object-center`} src={`/assets/ui/militia/militia-${file}.jpg`} alt="" loading="lazy" decoding="async" draggable={false} />;

export const SpearmanIllustration: FC<PortraitProps> = ({ className }) =>
  <MilitiaPortrait file="spearman" className={className} />;

export const SwordsmanIllustration: FC<PortraitProps> = ({ className }) =>
  <MilitiaPortrait file="swordsman" className={className} />;

export const ArcherIllustration: FC<PortraitProps> = ({ className }) =>
  <MilitiaPortrait file="archer" className={className} />;

export const PikemanIllustration: FC<PortraitProps> = ({ className }) =>
  <MilitiaPortrait file="pikeman" className={className} />;

export const AddSquadCardIllustration: FC<PortraitProps> = ({ className = 'w-full h-full' }) =>
  <svg viewBox="0 0 100 180" className={className} aria-hidden="true">
    <rect width="100" height="180" fill="#c8b894" />
    <rect x="3" y="3" width="94" height="174" fill="none" stroke="#655640" strokeWidth="2" />
    <path d="M15 36q32-29 70 0M14 142q38 26 72 0" fill="none" stroke="#998c69" strokeWidth="2" />
    <circle cx="50" cy="89" r="30" fill="#3a3d34" stroke="#aa9669" strokeWidth="3" />
    <path d="M50 72v34M33 89h34" stroke="#e9dfbd" strokeWidth="7" strokeLinecap="round" />
  </svg>;
