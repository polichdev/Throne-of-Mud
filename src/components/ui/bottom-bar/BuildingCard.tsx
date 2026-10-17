import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BuildingBlueprint, ResourceInventory } from '../../../types/game';
import { BuildingIllustration } from './BuildingCardIllustrations';
import { PAINTED_BUILDING_ART } from '../inspector/buildingArt';
import { useGameStore } from '../../../store/useGameStore';
import { audioManager } from '../../../engine/audio/AudioManager';
import { useTranslation } from '../../../i18n';
import { WoodIcon, StoneIcon, GoldIcon } from '../icons';
import { IlluminatedIcon } from '../icons';
import type { IlluminatedIconKind } from '../icons';
import { RESOURCE_UI, getResourceName } from '../resourcePresentation';

interface BuildingCardProps {
  blueprint: BuildingBlueprint;
  isSelected: boolean;
  onSelect: (type: BuildingBlueprint['type']) => void;
  isTooltipVisible: boolean;
  onTooltipOpen: (type: BuildingBlueprint['type']) => void;
  onTooltipClose: (type: BuildingBlueprint['type']) => void;
}

const BADGE_KIND: Record<BuildingBlueprint['type'], IlluminatedIconKind> = {
  campfire: 'flame',
  tent: 'town',
  hitching_post: 'donkey',
  lumberjack_hut: 'wood',
  peasant_house: 'town',
  manor: 'town',
  stockpile: 'storage',
  market: 'market',
  wheat_farm: 'wheat',
  windmill: 'windmill',
  brewery: 'ale',
  bakery: 'bread',
  barracks: 'weapons',
  wooden_wall: 'shield',
  wooden_gate: 'shield',
  stone_wall: 'shield',
  fishermans_hut: 'fish',
  foragers_hut: 'berry',
  hunters_hut: 'bow',
  iron_mine: 'hammer',
  stone_quarry: 'stone',
  clay_pit: 'clay',
  salt_works: 'storage',
  charcoal_kiln: 'flame',
  iron_smelter: 'hammer',
  stonecutter: 'stone',
  brickworks: 'brick',
  sawmill: 'planks',
  weavers_workshop: 'cloth',
  foresters_hut: 'wood',
  wooden_church: 'church',
  tavern: 'ale',
  trading_post: 'market',
};

export const BuildingCard: React.FC<BuildingCardProps> = React.memo(({ blueprint, isSelected, onSelect, isTooltipVisible, onTooltipOpen, onTooltipClose }) => {
  const { dict, language } = useTranslation();
  const resources = useGameStore((s) => s.resources);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);
  const isTooltipOpen = tooltipPosition !== null && isTooltipVisible;
  const cardRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const bTrans = dict.buildings.items[blueprint.type] || {
    name: blueprint.name,
    description: blueprint.description,
  };

  let canAfford = true;
  if (blueprint.cost.wood && resources.wood < blueprint.cost.wood) canAfford = false;
  if (blueprint.cost.stone && resources.stone < blueprint.cost.stone) canAfford = false;
  if (blueprint.cost.gold && resources.gold < blueprint.cost.gold) canAfford = false;

  const handleClick = () => {
    audioManager.playUIClick();
    onSelect(blueprint.type);
  };
  const showTooltip = () => {
    setTooltipPosition({ left: 0, top: 0 });
    onTooltipOpen(blueprint.type);
  };
  const hideTooltip = () => {
    setTooltipPosition(null);
    onTooltipClose(blueprint.type);
  };
  const positionTooltip = useCallback(() => {
    const card = cardRef.current;
    const tooltip = tooltipRef.current;
    if (!card || !tooltip) return;
    const anchor = card.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const gap = 12;
    const availableWidth = window.innerWidth - gap;
    const left = anchor.right + width + gap <= availableWidth
      ? anchor.right + gap
      : anchor.left - width - gap >= gap
        ? anchor.left - width - gap
        : Math.max(gap, Math.min(anchor.left, window.innerWidth - width - gap));
    const top = Math.max(gap, Math.min(anchor.top, window.innerHeight - height - gap));
    setTooltipPosition((previous) => previous && previous.left === left && previous.top === top ? previous : { left, top });
  }, []);

  useLayoutEffect(() => {
    if (!isTooltipOpen) return;
    positionTooltip();
    const tooltip = tooltipRef.current;
    const observer = new ResizeObserver(positionTooltip);
    if (tooltip) observer.observe(tooltip);
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip, true);
    };
  }, [isTooltipOpen, positionTooltip]);
  const costEntries = Object.entries(blueprint.cost).filter(([, amount]) => Number(amount) > 0) as [keyof ResourceInventory, number][];
  const inputEntries = Object.entries(blueprint.produces?.inputs || {}).filter(([, amount]) => Number(amount) > 0) as [keyof ResourceInventory, number][];
  const outputEntries = Object.entries(blueprint.produces?.outputs || {}).filter(([, amount]) => Number(amount) > 0) as [keyof ResourceInventory, number][];

  return (
    <div className="construction-plate-wrap">
      <button
        ref={cardRef}
        onClick={handleClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`construction-plate ${isSelected ? 'selected' : ''} ${!canAfford ? 'unaffordable' : ''}`}
        aria-label={bTrans.name}
      >
        <div className="construction-plate-picture">
          {PAINTED_BUILDING_ART[blueprint.type]
            ? <img src={PAINTED_BUILDING_ART[blueprint.type]} alt="" loading="lazy" decoding="async" draggable={false} />
            : <BuildingIllustration type={blueprint.type} className="w-full h-full" />}
          <span className="construction-plate-symbol"><IlluminatedIcon kind={BADGE_KIND[blueprint.type]} className="w-3.5 h-3.5" /></span>
        </div>
        <span className="construction-plate-name">{bTrans.name}</span>
        <span className="construction-plate-cost">
          {blueprint.cost.wood ? <span className={resources.wood < blueprint.cost.wood ? 'missing' : ''}><WoodIcon size={15} />{blueprint.cost.wood}</span> : null}
          {blueprint.cost.stone ? <span className={resources.stone < blueprint.cost.stone ? 'missing' : ''}><StoneIcon size={15} />{blueprint.cost.stone}</span> : null}
          {blueprint.cost.gold ? <span className={resources.gold < blueprint.cost.gold ? 'missing' : ''}><GoldIcon size={15} />{blueprint.cost.gold}</span> : null}
          {!blueprint.cost.wood && !blueprint.cost.stone && !blueprint.cost.gold && <span>{dict.roads.cost}</span>}
        </span>
      </button>
      {isTooltipOpen && tooltipPosition && typeof document !== 'undefined' && createPortal(
        <div ref={tooltipRef} className="building-card-tooltip" style={tooltipPosition} role="tooltip">
          <h3>{bTrans.name}</h3>
          {PAINTED_BUILDING_ART[blueprint.type] && <img src={PAINTED_BUILDING_ART[blueprint.type]} alt="" decoding="async" />}
          <div className="building-card-tooltip-cost">
            <strong>{dict.buildings.cost}</strong>
            {costEntries.length ? costEntries.map(([key, amount]) => {
              const meta = RESOURCE_UI[key];
              return <span key={key} className={resources[key] < amount ? 'missing' : ''}>
                <IlluminatedIcon kind={meta.icon} size={18} />
                {getResourceName(key, language)}: {amount} <small>({resources[key]})</small>
              </span>;
            }) : <span>{dict.roads.cost}</span>}
          </div>
          <p>{bTrans.description}</p>
          {blueprint.workSlots > 0 && <div className="building-card-tooltip-workers">
            {dict.buildings.workers}: {blueprint.workSlots}
          </div>}
          {(inputEntries.length > 0 || outputEntries.length > 0) && <div className="building-card-tooltip-production">
            <strong>{dict.inspector.production}</strong>
            <div>
              {inputEntries.map(([key, amount]) => <span key={key}>{amount} {getResourceName(key, language)}</span>)}
              {inputEntries.length > 0 && <b>→</b>}
              {outputEntries.map(([key, amount]) => <span key={key}>{amount} {getResourceName(key, language)}</span>)}
            </div>
          </div>}
        </div>,
        document.body,
      )}
    </div>
  );
});

BuildingCard.displayName = 'BuildingCard';
