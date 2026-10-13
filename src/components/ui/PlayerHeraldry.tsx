import { Castle, Crown, Cross, Sun, Swords, TreePine } from 'lucide-react';

interface RulerPortraitProps {
  portraitId: number;
  size?: number;
  className?: string;
}

export const RULER_PORTRAIT_COUNT = 12;

export function RulerPortrait({ portraitId, size = 64, className = '' }: RulerPortraitProps) {
  if (portraitId < 0 || portraitId >= RULER_PORTRAIT_COUNT) {
    return <div className={className} style={{ width: size, height: size }} aria-label="No ruler selected" />;
  }

  const column = portraitId % 4;
  const row = Math.floor(portraitId / 4);
  return (
    <div
      className={className}
      role="img"
      aria-label={`Ruler portrait ${portraitId + 1}`}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/assets/ui/portraits/ruler-portraits-v2.png')",
        backgroundSize: '400% 300%',
        backgroundPosition: `${column * 100 / 3}% ${row * 50}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

interface HeraldicShieldProps {
  color: string;
  emblemId: string;
  size?: number;
  className?: string;
}

const EMBLEM_ICONS = { crown: Crown, cross: Cross, swords: Swords, tree: TreePine, sun: Sun, castle: Castle };

export function HeraldicShield({ color, emblemId, size = 48, className = '' }: HeraldicShieldProps) {
  const Emblem = EMBLEM_ICONS[emblemId as keyof typeof EMBLEM_ICONS] ?? Crown;
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size * 1.2 }} role="img" aria-label="Heraldic shield">
      <svg viewBox="0 0 80 96" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <path d="M4 4 H76 V53 Q76 76 40 92 Q4 76 4 53Z" fill="#c5aa74" stroke="#181610" strokeWidth="3" />
        <path d="M9 9 H71 V52 Q71 71 40 86 Q9 71 9 52Z" fill={color} stroke="#e5d3a3" strokeWidth="1.5" />
        <path d="M12 13 H68" stroke="#ffffff" strokeOpacity=".22" strokeWidth="2" />
      </svg>
      <Emblem className="absolute left-[26%] top-[26%] w-[48%] h-[44%] text-[#e9d9aa] drop-shadow-[0_2px_1px_#1c1711]" strokeWidth={2.2} aria-hidden="true" />
    </div>
  );
}
