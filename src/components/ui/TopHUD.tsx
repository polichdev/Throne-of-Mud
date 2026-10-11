import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useTranslation } from '../../i18n';
import { useSettlementMetrics } from '../../hooks/useSettlementMetrics';
import { useTownCenterFocus } from '../../hooks/useTownCenterFocus';
import { HeraldicShield, RulerPortrait } from './PlayerHeraldry';
import {
  WoodIcon,
  PlanksIcon,
  StoneIcon,
  ClayIcon,
  BreadIcon,
  WheatIcon,
  AleIcon,
  OxIcon,
  StorageIcon,
  GoldIcon,
  WeaponsIcon,
  FlameIcon,
  PeasantsIcon,
  InfluenceIcon,
} from './MedievalIcons';

export const TopHUD: React.FC = React.memo(() => {
  const { dict } = useTranslation();
  const { focusTownCenter } = useTownCenterFocus();

  const resources = useGameStore((s) => s.resources);
  const settlementName = useGameStore((s) => s.settlementName);
  const setSettlementName = useGameStore((s) => s.setSettlementName);
  const influence = useGameStore((s) => s.influence);
  const playerIdentity = useGameStore((s) => s.playerIdentity);
  const isLordsBarOpen = useGameStore((s) => s.isLordsBarOpen);
  const toggleLordsBar = useGameStore((s) => s.toggleLordsBar);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settlementName);

  const {
    approvalRating,
    housingStats,
    storageUsage,
    totalFood,
    muleStats,
  } = useSettlementMetrics();

  const handleSaveName = useCallback(() => {
    setSettlementName(tempName.trim() || 'GOLDHOF');
    setIsEditingName(false);
  }, [tempName, setSettlementName]);

  return (
    <header className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none z-30 select-none px-5 font-cinzel">
      <div className="manor-spear-outer realm-resource-ribbon pointer-events-auto min-w-0">
        <div className="manor-spear-inner backdrop-blur-xl pl-8 pr-8 py-2 flex items-center justify-between gap-4 text-slate-200 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={dict.hud.wood}>
              <WoodIcon className="w-3.5 h-3.5 text-amber-500/90 drop-shadow" />
              <span className="font-bold text-slate-100">{resources.wood}</span>
            </div>

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={dict.hud.planks}>
              <PlanksIcon className="w-3.5 h-3.5 text-amber-600/90 drop-shadow" />
              <span className="font-bold text-slate-300">{Math.floor(resources.wood * 0.4)}</span>
            </div>

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={dict.hud.stone}>
              <StoneIcon className="w-3.5 h-3.5 text-slate-300 drop-shadow" />
              <span className="font-bold text-slate-100">{resources.stone}</span>
            </div>

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={dict.hud.clay}>
              <ClayIcon className="w-3.5 h-3.5 text-orange-400/90 drop-shadow" />
              <span className="font-bold text-slate-400">0</span>
            </div>

            <div className="w-[1px] h-4 bg-[#4a3b26]" />

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={`${dict.hud.bread} & food`}>
              <BreadIcon className="w-3.5 h-3.5 text-amber-300 drop-shadow" />
              <span className="font-bold text-amber-200">{totalFood}</span>
            </div>

            <div
              onClick={toggleLordsBar}
              className={`flex items-center gap-1.5 transition cursor-pointer ${
                isLordsBarOpen ? 'text-amber-300' : 'hover:text-amber-200'
              }`}
              title={`${dict.hud.population}: ${housingStats.occupied}/${housingStats.capacity}.\n${
                housingStats.capacity > housingStats.occupied
                  ? (approvalRating >= 50 ? dict.hud.settlersOnTheWay : dict.hud.needApprovalForImmigration)
                  : dict.hud.lackHousing
              }\n${dict.hud.clickToToggleLordsBar}`}
            >
              <PeasantsIcon className={`w-3.5 h-3.5 ${isLordsBarOpen ? 'text-amber-400' : 'text-sky-400'} drop-shadow`} />
              <span className="font-bold text-[11px] text-slate-100">{housingStats.occupied}/{housingStats.capacity}</span>
            </div>

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={`${dict.hud.oxenTooltip}: ${muleStats.available}/${muleStats.total}`}>
              <OxIcon className="w-3.5 h-3.5 text-amber-400/90 drop-shadow" />
              <span className="font-bold text-slate-200">{muleStats.available}/{muleStats.total}</span>
            </div>

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={`${dict.hud.storageCapacityTooltip}: ${storageUsage.current}/${storageUsage.max}`}>
              <StorageIcon className="w-3.5 h-3.5 text-amber-500/80 drop-shadow" />
              <span className="font-bold text-slate-300">{storageUsage.current}/{storageUsage.max}</span>
            </div>
          </div>

          <div className="manor-settlement-slot flex items-stretch justify-center shrink-0 mx-1 self-stretch">
            <div
              onClick={focusTownCenter}
              className="manor-center-plaque px-4 flex items-center justify-center cursor-pointer transition group"
              title={dict.hud.focusTownCenter}
            >
              {isEditingName ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                  autoFocus
                  className="bg-transparent border-b border-amber-400 text-amber-200 font-cinzel font-bold text-xs tracking-widest uppercase text-center outline-none w-32"
                />
              ) : (
                <span
                  onDoubleClick={() => setIsEditingName(true)}
                  className="font-cinzel font-bold text-xs tracking-[0.14em] text-amber-100 uppercase"
                >
                  {settlementName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={`${dict.hud.wood}: ${resources.wood}`}>
              <FlameIcon className="w-3.5 h-3.5 text-orange-400 drop-shadow" />
              <span className="font-bold text-slate-100">{resources.wood}</span>
            </div>

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title="Wheat">
              <WheatIcon className="w-3.5 h-3.5 text-yellow-400 drop-shadow" />
              <span className="font-bold text-slate-100">{resources.wheat}</span>
            </div>

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title="Ale">
              <AleIcon className="w-3.5 h-3.5 text-amber-500 drop-shadow" />
              <span className="font-bold text-slate-100">{resources.ale}</span>
            </div>

            <div className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help" title={dict.hud.weapons}>
              <WeaponsIcon className="w-3.5 h-3.5 text-red-400 drop-shadow" />
              <span className="font-bold text-slate-100">{resources.weapons}</span>
            </div>

            <div className="w-[1px] h-4 bg-[#4a3b26]" />

            <div
              className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help"
              title={`${dict.hud.treasury} (${dict.common.gold})`}
            >
              <GoldIcon className="w-3.5 h-3.5 text-amber-400 drop-shadow" />
              <span className="font-bold font-mono text-amber-200 text-[11px] tracking-wide">
                {resources.gold.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1 hover:text-amber-200 transition cursor-help" title={`${dict.hud.influence}: ${influence}`}>
              <InfluenceIcon className="w-3.5 h-3.5 text-amber-300 drop-shadow" />
              <span className="font-bold text-slate-200 text-[11px]">{(influence / 1000).toFixed(1)}k</span>
            </div>

          </div>

        </div>
      </div>
      <div className="realm-player-widget pointer-events-auto absolute right-6 top-0" title={`${playerIdentity.rulerName} · ${playerIdentity.kingdomName}`}>
        <div className="realm-player-avatar relative shrink-0">
          <div className="realm-player-portrait overflow-hidden rounded-full"><RulerPortrait portraitId={playerIdentity.portraitId} size={104} /></div>
          <div className="realm-avatar-shield absolute -right-2 -bottom-2 z-10">
            <HeraldicShield color={playerIdentity.shieldColor} emblemId={playerIdentity.emblemId} size={42} />
          </div>
        </div>
        <div className="realm-player-card-details grid grid-cols-2 gap-x-3 gap-y-1 pl-5 min-w-0 font-mono text-[11px] text-[#cbbb99]">
          <span className="flex items-center gap-1" title={`${dict.hud.population}: ${housingStats.occupied}`}><PeasantsIcon className="w-3.5 h-3.5" />{housingStats.occupied}</span>
          <span className="flex items-center gap-1" title={`${dict.hud.influence}: ${influence}`}><InfluenceIcon className="w-3.5 h-3.5" />{influence}</span>
          <span className="flex items-center gap-1" title={`${dict.hud.treasury}: ${resources.gold}`}><GoldIcon className="w-3.5 h-3.5" />{resources.gold}</span>
          <span className="flex items-center gap-1" title={`${dict.hud.oxenTooltip}: ${muleStats.total}`}><OxIcon className="w-3.5 h-3.5" />{muleStats.total}</span>
        </div>
      </div>
    </header>
  );
});

TopHUD.displayName = 'TopHUD';
