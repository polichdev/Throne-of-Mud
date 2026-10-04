import React from 'react';
import type { BuildingBlueprint } from '../../../types/game';
import { BuildingIllustration } from './BuildingCardIllustrations';
import { useGameStore } from '../../../store/useGameStore';
import { audioManager } from '../../../engine/audio/AudioManager';
import { useTranslation } from '../../../i18n';
import {
  WoodIcon,
  StoneIcon,
  BreadIcon,
  WheatIcon,
  AleIcon,
  StorageIcon,
  FlameIcon,
  PeasantsIcon,
  ShieldIcon,
  TownCenterIcon,
  WeaponsIcon,
} from '../MedievalIcons';

interface BuildingCardProps {
  blueprint: BuildingBlueprint;
  isSelected: boolean;
  onSelect: (type: BuildingBlueprint['type']) => void;
}

export const BuildingCard: React.FC<BuildingCardProps> = React.memo(({ blueprint, isSelected, onSelect }) => {
  const { dict } = useTranslation();
  const resources = useGameStore((s) => s.resources);

  const bTrans = dict.buildings.items[blueprint.type] || {
    name: blueprint.name,
    description: blueprint.description,
  };

  let canAfford = true;
  if (blueprint.cost.wood && resources.wood < blueprint.cost.wood) canAfford = false;
  if (blueprint.cost.stone && resources.stone < blueprint.cost.stone) canAfford = false;
  if (blueprint.cost.gold && resources.gold < blueprint.cost.gold) canAfford = false;

  const renderBadgeIcon = () => {
    switch (blueprint.type) {
      case 'tent':
      case 'peasant_house':
      case 'manor':
        return <TownCenterIcon className="w-3.5 h-3.5 text-amber-200" />;
      case 'lumberjack_hut':
      case 'foresters_hut':
      case 'sawmill':
        return <WoodIcon className="w-3.5 h-3.5 text-emerald-300" />;
      case 'stone_quarry':
      case 'stonecutter':
        return <StoneIcon className="w-3.5 h-3.5 text-stone-200" />;
      case 'iron_mine':
      case 'iron_smelter':
        return (
          <svg className="w-3.5 h-3.5 text-orange-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9" />
            <path d="M15 13 9 7l4-4 6 6h3l3 3" />
          </svg>
        );
      case 'clay_pit':
      case 'salt_works':
        return (
          <svg className="w-3.5 h-3.5 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 11 12 18 5 11" />
            <path d="M5 11a7 7 0 0 1 14 0Z" />
            <path d="M12 18v3" />
          </svg>
        );
      case 'fishermans_hut':
        return (
          <svg className="w-3.5 h-3.5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6-3.56 0-7.56-2.53-8.5-6Z" />
            <path d="M18 12c-.5 1.5-2 2-3 2" />
            <circle cx="16" cy="9" r="1" fill="currentColor" />
          </svg>
        );
      case 'hunters_hut':
        return (
          <svg className="w-3.5 h-3.5 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        );
      case 'foragers_hut':
        return (
          <svg className="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a5 5 0 0 0-5 5c0 4 5 13 5 13s5-9 5-13a5 5 0 0 0-5-5Z" />
            <circle cx="12" cy="7" r="1.5" fill="currentColor" />
          </svg>
        );
      case 'stockpile':
        return <StorageIcon className="w-3.5 h-3.5 text-amber-200" />;
      case 'hitching_post':
        return <span className="text-xs">🫏</span>;
      case 'campfire':
      case 'charcoal_kiln':
        return <FlameIcon className="w-3.5 h-3.5 text-orange-400" />;
      case 'wheat_farm':
        return <WheatIcon className="w-3.5 h-3.5 text-yellow-300" />;
      case 'windmill':
        return (
          <svg className="w-3.5 h-3.5 text-amber-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 12 4 4" />
            <path d="M12 12 20 4" />
            <path d="M12 12 20 20" />
            <path d="M12 12 4 20" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        );
      case 'bakery':
        return <BreadIcon className="w-3.5 h-3.5 text-amber-200" />;
      case 'brewery':
      case 'tavern':
        return <AleIcon className="w-3.5 h-3.5 text-amber-300" />;
      case 'brickworks':
        return (
          <svg className="w-3.5 h-3.5 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="5" x2="12" y2="12" />
            <line x1="7" y1="12" x2="7" y2="19" />
            <line x1="17" y1="12" x2="17" y2="19" />
          </svg>
        );
      case 'weavers_workshop':
        return (
          <svg className="w-3.5 h-3.5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="7" y1="3" x2="7" y2="21" />
            <line x1="17" y1="3" x2="17" y2="21" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        );
      case 'wooden_church':
        return (
          <svg className="w-3.5 h-3.5 text-amber-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="6" y1="9" x2="18" y2="9" />
          </svg>
        );
      case 'barracks':
        return <WeaponsIcon className="w-3.5 h-3.5 text-red-400" />;
      case 'wooden_wall':
      case 'wooden_gate':
      case 'stone_wall':
        return <ShieldIcon className="w-3.5 h-3.5 text-stone-200" />;
      case 'market':
        return (
          <svg className="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v8" />
            <path d="M9 10h6" />
          </svg>
        );
      default:
        return <PeasantsIcon className="w-3.5 h-3.5 text-amber-200" />;
    }
  };

  const handleClick = () => {
    audioManager.playUIClick();
    onSelect(blueprint.type);
  };

  return (
    <div className="relative flex flex-col items-center select-none shrink-0 pb-2">
      <button
        onClick={handleClick}
        className={`w-26 h-36 rounded-2xl p-1 relative flex flex-col items-center justify-between cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'ring-2 ring-amber-400 -translate-y-1.5 shadow-[0_8px_18px_rgba(245,158,11,0.4)] bg-gradient-to-b from-[#b89552] via-[#826130] to-[#453014]'
            : 'hover:-translate-y-1 hover:ring-1 hover:ring-[#d4af37]/90 hover:shadow-[0_6px_14px_rgba(212,175,55,0.3)] bg-gradient-to-b from-[#7a6039] to-[#3d2c18]'
        } ${!canAfford ? 'opacity-70 saturate-75' : ''}`}
      >
        <div className="w-full h-full rounded-xl overflow-hidden bg-[#ded5c2] relative flex flex-col border border-[#523d24]/70 shadow-inner">
          <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#5a4325] opacity-70 pointer-events-none z-10" />
          <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#5a4325] opacity-70 pointer-events-none z-10" />
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#5a4325] opacity-70 pointer-events-none z-10" />
          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#5a4325] opacity-70 pointer-events-none z-10" />

          <div className="w-full flex flex-col items-center pt-1 pb-0.5 px-1 border-b border-[#523d24]/20 bg-gradient-to-b from-[#f0e7d8] to-[#ded5c2] z-10">
            <span
              className="font-cinzel font-bold text-[9.5px] leading-tight text-[#2c1d0e] text-center truncate w-full tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]"
              title={bTrans.name}
            >
              {bTrans.name}
            </span>
            <span className="text-[8px] font-mono font-bold text-[#684b23] bg-[#cbbea6]/90 px-1 py-0.2 rounded border border-[#9c896d]/60 mt-0.5">
              {blueprint.width}x{blueprint.height}
            </span>
          </div>

          <div className="w-full flex-1 flex items-center justify-center overflow-hidden relative">
            <BuildingIllustration type={blueprint.type} className="w-full h-full object-cover" />
          </div>

          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1.5 bg-[#8c6b38] rounded-r opacity-60" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1.5 bg-[#8c6b38] rounded-l opacity-60" />
        </div>
      </button>

      <div
        onClick={handleClick}
        className={`w-7 h-7 rounded-full bg-[#181a20] border-2 flex items-center justify-center shadow-lg -mt-3.5 z-20 transition-transform cursor-pointer ${
          isSelected
            ? 'border-amber-400 bg-[#2d2212] scale-110 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
            : 'border-[#8c6b38] hover:border-amber-300 hover:scale-105 bg-[#16181e]'
        }`}
      >
        {renderBadgeIcon()}
      </div>
    </div>
  );
});

BuildingCard.displayName = 'BuildingCard';
