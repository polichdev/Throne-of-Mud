import React, { useState, useRef } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { BUILDING_BLUEPRINTS } from '../../../engine/buildings/blueprints';
import type { BuildingType } from '../../../types/game';
import {
  TownCenterIcon,
  WoodIcon,
  WheatIcon,
  BreadIcon,
  ShieldIcon,
  GoldIcon,
  CrossCloseIcon,
  PeasantsIcon,
  RoadIcon,
} from '../MedievalIcons';
import { audioManager } from '../../../engine/audio/AudioManager';
import { useTranslation } from '../../../i18n';
import { BuildingCard } from './BuildingCard';

interface BuildingsMenuModalProps {
  onClose: () => void;
}

export const BuildingsMenuModal: React.FC<BuildingsMenuModalProps> = React.memo(({ onClose }) => {
  const { dict, language } = useTranslation();

  const activeBuildType = useGameStore((s) => s.activeBuildType);
  const setActiveBuildType = useGameStore((s) => s.setActiveBuildType);
  const setActiveTool = useGameStore((s) => s.setActiveTool);

  const [activeCategory, setActiveCategory] = useState<'gathering' | 'housing' | 'farming' | 'industry' | 'community' | 'military' | 'trade'>('housing');
  const [roadSnapEnabled, setRoadSnapEnabled] = useState(true);

  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const categories = [
    {
      id: 'gathering',
      label: dict.buildings.categories.gathering,
      icon: (props: any) => <WoodIcon {...props} />,
    },
    {
      id: 'housing',
      label: dict.buildings.categories.housing,
      icon: (props: any) => <TownCenterIcon {...props} />,
    },
    {
      id: 'farming',
      label: dict.buildings.categories.farming,
      icon: (props: any) => <WheatIcon {...props} />,
    },
    {
      id: 'industry',
      label: dict.buildings.categories.industry,
      icon: (props: any) => <BreadIcon {...props} />,
    },
    {
      id: 'community',
      label: dict.buildings.categories.community,
      icon: (props: any) => <PeasantsIcon {...props} />,
    },
    {
      id: 'military',
      label: dict.buildings.categories.military,
      icon: (props: any) => <ShieldIcon {...props} />,
    },
    {
      id: 'trade',
      label: dict.buildings.categories.trade,
      icon: (props: any) => <GoldIcon {...props} />,
    },
  ] as const;

  const categoryBlueprints: Record<typeof activeCategory, (typeof BUILDING_BLUEPRINTS[BuildingType])[]> = {
    housing: [
      BUILDING_BLUEPRINTS.tent,
      BUILDING_BLUEPRINTS.peasant_house,
      BUILDING_BLUEPRINTS.manor,
    ].filter(Boolean),
    gathering: [
      BUILDING_BLUEPRINTS.lumberjack_hut,
      BUILDING_BLUEPRINTS.foresters_hut,
      BUILDING_BLUEPRINTS.stone_quarry,
      BUILDING_BLUEPRINTS.iron_mine,
      BUILDING_BLUEPRINTS.clay_pit,
      BUILDING_BLUEPRINTS.salt_works,
      BUILDING_BLUEPRINTS.fishermans_hut,
      BUILDING_BLUEPRINTS.foragers_hut,
      BUILDING_BLUEPRINTS.hunters_hut,
      BUILDING_BLUEPRINTS.stockpile,
      BUILDING_BLUEPRINTS.hitching_post,
      BUILDING_BLUEPRINTS.campfire,
    ].filter(Boolean),
    farming: [
      BUILDING_BLUEPRINTS.wheat_farm,
      BUILDING_BLUEPRINTS.windmill,
    ].filter(Boolean),
    industry: [
      BUILDING_BLUEPRINTS.bakery,
      BUILDING_BLUEPRINTS.brewery,
      BUILDING_BLUEPRINTS.charcoal_kiln,
      BUILDING_BLUEPRINTS.iron_smelter,
      BUILDING_BLUEPRINTS.stonecutter,
      BUILDING_BLUEPRINTS.brickworks,
      BUILDING_BLUEPRINTS.sawmill,
      BUILDING_BLUEPRINTS.weavers_workshop,
    ].filter(Boolean),
    community: [
      BUILDING_BLUEPRINTS.tavern,
      BUILDING_BLUEPRINTS.wooden_church,
    ].filter(Boolean),
    military: [
      BUILDING_BLUEPRINTS.barracks,
      BUILDING_BLUEPRINTS.wooden_wall,
      BUILDING_BLUEPRINTS.wooden_gate,
      BUILDING_BLUEPRINTS.stone_wall,
    ].filter(Boolean),
    trade: [
      BUILDING_BLUEPRINTS.market,
      BUILDING_BLUEPRINTS.hitching_post,
    ].filter(Boolean),
  };

  const handleSelectBuilding = (type: BuildingType) => {
    setActiveBuildType(type);
    setActiveTool('build');
  };

  const handleScrollLeft = () => {
    audioManager.playUIClick();
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollBy({ left: -228, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    audioManager.playUIClick();
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollBy({ left: 228, behavior: 'smooth' });
    }
  };

  const currentBlueprints = categoryBlueprints[activeCategory];
  const hasOverflow = currentBlueprints.length > 8;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-40 max-w-[98vw] animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      <div className="relative w-full flex items-center justify-center mb-0.5 px-3">
        {hasOverflow && (
          <button
            onClick={handleScrollLeft}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full manor-circle-btn text-amber-200 hover:text-amber-100 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.85)] hover:scale-110 active:scale-95 transition cursor-pointer"
            title="Прокрутити вліво"
          >
            <svg className="w-4 h-4 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div
          ref={cardsContainerRef}
          onWheel={(e) => {
            if (cardsContainerRef.current) {
              cardsContainerRef.current.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-2.5 overflow-x-auto px-4 pt-4 pb-2 max-w-[936px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          {currentBlueprints.map((b) => (
            <BuildingCard
              key={b.type}
              blueprint={b}
              isSelected={activeBuildType === b.type}
              onSelect={handleSelectBuilding}
            />
          ))}
        </div>

        {hasOverflow && (
          <button
            onClick={handleScrollRight}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full manor-circle-btn text-amber-200 hover:text-amber-100 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.85)] hover:scale-110 active:scale-95 transition cursor-pointer"
            title="Прокрутити вправо"
          >
            <svg className="w-4 h-4 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center bg-gradient-to-r from-[#121418]/98 via-[#1a1d24]/98 to-[#121418]/98 border border-[#52422d] px-3 py-1.5 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-md gap-1 max-w-[94vw] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  audioManager.playUIClick();
                  setActiveCategory(cat.id);
                  setActiveBuildType(null);
                  setActiveTool('select');
                }}
                title={cat.label}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-b from-[#6b4e23] to-[#36230b] border border-[#d4af37] text-amber-100 shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                    : 'text-stone-400 hover:text-amber-200 hover:bg-[#222630]/80 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45" />
                )}
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-[#3d3222] mx-2" />

        <div
          onClick={() => {
            audioManager.playUIClick();
            setRoadSnapEnabled(!roadSnapEnabled);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-cinzel cursor-pointer transition select-none ${
            roadSnapEnabled
              ? 'bg-[#1e2318] border-emerald-700/60 text-emerald-300'
              : 'bg-[#15171c] border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
          title={language === 'uk' ? 'Прив\'язка споруд до доріг та сітки' : 'Snap buildings to roads & grid'}
        >
          <RoadIcon className="w-4 h-4" />
          <span className="text-[11px] font-bold whitespace-nowrap">
            {language === 'uk' ? 'Прив\'язка до дороги' : 'Snap to road'}
          </span>
          <div
            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
              roadSnapEnabled ? 'bg-emerald-600 border-emerald-400' : 'bg-black/40 border-stone-600'
            }`}
          >
            {roadSnapEnabled && (
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 transition flex items-center justify-center cursor-pointer ml-1"
          title={dict.common.close}
        >
          <CrossCloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

BuildingsMenuModal.displayName = 'BuildingsMenuModal';
