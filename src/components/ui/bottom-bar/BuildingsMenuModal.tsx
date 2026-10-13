import React, { useState, useRef, useLayoutEffect } from 'react';
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
  const [hasOverflow, setHasOverflow] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<BuildingType | null>(null);

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
      BUILDING_BLUEPRINTS.trading_post,
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
    setActiveTooltipId(null);
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollBy({ left: -228, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    audioManager.playUIClick();
    setActiveTooltipId(null);
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollBy({ left: 228, behavior: 'smooth' });
    }
  };

  const currentBlueprints = categoryBlueprints[activeCategory];
  useLayoutEffect(() => {
    const tray = cardsContainerRef.current;
    if (!tray) return;
    tray.scrollLeft = 0;
    const measure = () => setHasOverflow(tray.scrollWidth > tray.clientWidth + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tray);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [activeCategory, language]);
  const sectionBreaks: Partial<Record<typeof activeCategory, Partial<Record<BuildingType, string>>>> = {
    gathering: {
      stone_quarry: language === 'uk' ? 'Копальні' : 'Mines',
      fishermans_hut: language === 'uk' ? 'Добування' : 'Gathering',
      stockpile: language === 'uk' ? 'Зберігання' : 'Storage',
    },
    industry: {
      charcoal_kiln: language === 'uk' ? 'Матеріали' : 'Materials',
      weavers_workshop: language === 'uk' ? 'Ремесла' : 'Crafts',
    },
    trade: { hitching_post: language === 'uk' ? 'Перевезення' : 'Transport' },
  };

  return (
    <div className="construction-menu absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-40 max-w-[98vw] animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      <div className="construction-menu-scroll relative w-full flex items-center justify-center px-3">
        {hasOverflow && (
          <button
            onClick={handleScrollLeft}
            className="ui-tip-anchor ui-tip-left absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full manor-circle-btn text-amber-200 hover:text-amber-100 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.85)] hover:scale-110 active:scale-95 transition cursor-pointer"
            data-ui-tip={language === 'uk' ? 'Попередні споруди' : 'Previous buildings'}
            aria-label={language === 'uk' ? 'Прокрутити вліво' : 'Scroll left'}
          >
            <svg className="w-4 h-4 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div
          ref={cardsContainerRef}
          onScroll={() => setActiveTooltipId(null)}
          onWheel={(e) => {
            e.stopPropagation();
            setActiveTooltipId(null);
            if (cardsContainerRef.current) {
              cardsContainerRef.current.scrollLeft += e.deltaY;
            }
          }}
          className="construction-building-tray flex items-center gap-1 overflow-x-auto px-5 py-2 max-w-[1080px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {currentBlueprints.map((b) => (
            <React.Fragment key={b.type}>
              {sectionBreaks[activeCategory]?.[b.type] && <div className="construction-section-divider" title={sectionBreaks[activeCategory]?.[b.type]} aria-label={sectionBreaks[activeCategory]?.[b.type]}>
                <span>✦</span><span>✦</span><span>✦</span>
              </div>}
              <BuildingCard
                blueprint={b}
                isSelected={activeBuildType === b.type}
                onSelect={handleSelectBuilding}
                isTooltipVisible={activeTooltipId === b.type}
                onTooltipOpen={setActiveTooltipId}
                onTooltipClose={(type) => setActiveTooltipId((current) => current === type ? null : current)}
              />
            </React.Fragment>
          ))}
        </div>

        {hasOverflow && (
          <button
            onClick={handleScrollRight}
            className="ui-tip-anchor ui-tip-right absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full manor-circle-btn text-amber-200 hover:text-amber-100 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.85)] hover:scale-110 active:scale-95 transition cursor-pointer"
            data-ui-tip={language === 'uk' ? 'Наступні споруди' : 'Next buildings'}
            aria-label={language === 'uk' ? 'Прокрутити вправо' : 'Scroll right'}
          >
            <svg className="w-4 h-4 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      <div className="construction-menu-toolbar flex items-center bg-[#242721]/95 border border-[#69583d] px-3 py-1 gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  audioManager.playUIClick();
                  setActiveTooltipId(null);
                  setActiveCategory(cat.id);
                  setActiveBuildType(null);
                  setActiveTool('select');
                }}
                data-ui-tip={cat.label}
                aria-label={cat.label}
                aria-pressed={isActive}
                className={`construction-category ui-tip-anchor ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-[#3d3222] mx-2" />

        <button type="button"
          onClick={() => {
            audioManager.playUIClick();
            setRoadSnapEnabled(!roadSnapEnabled);
          }}
          className={`ui-tip-anchor flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-cinzel cursor-pointer transition select-none ${
            roadSnapEnabled
              ? 'bg-[#1e2318] border-emerald-700/60 text-emerald-300'
              : 'bg-[#15171c] border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
          data-ui-tip={language === 'uk' ? 'Прив\'язка споруд до доріг та сітки' : 'Snap buildings to roads & grid'}
          aria-label={language === 'uk' ? 'Прив’язка до дороги' : 'Snap to road'}
          aria-pressed={roadSnapEnabled}
        >
          <RoadIcon className="construction-road-icon" />
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
        </button>

        <button
          onClick={onClose}
          className="ui-tip-anchor w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 transition flex items-center justify-center cursor-pointer ml-1"
          data-ui-tip={dict.common.close}
          aria-label={dict.common.close}
        >
          <CrossCloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

BuildingsMenuModal.displayName = 'BuildingsMenuModal';
