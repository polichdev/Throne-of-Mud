import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useTranslation } from '../../i18n';
import { useSettlementMetrics } from '../../hooks/useSettlementMetrics';
import { useTownCenterFocus } from '../../hooks/useTownCenterFocus';
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
  CrownIcon,
  ScalesIcon,
  PeasantsIcon,
  InfluenceIcon,
  CompassIcon,
  HourglassIcon,
  WeatherClearIcon,
  WeatherRainIcon,
  WeatherStormIcon,
  WeatherSnowIcon,
} from './MedievalIcons';

const HUDTimeWidget: React.FC = React.memo(() => {
  const { dict, language } = useTranslation();
  const season = useGameStore((s) => s.time.season);
  const month = useGameStore((s) => s.time.month);
  const dayOfMonth = useGameStore((s) => s.time.dayOfMonth);
  const year = useGameStore((s) => s.time.year);
  const weather = useGameStore((s) => s.time.weather);
  const day = useGameStore((s) => s.time.day);
  const hour = useGameStore((s) => s.time.hour);
  const minute = useGameStore((s) => s.time.minute);
  const setIsWeatherDebugOpen = useGameStore((s) => s.setIsWeatherDebugOpen);

  const seasonLabels: Record<string, string> = {
    Spring: dict.hud.seasons.Spring,
    Summer: dict.hud.seasons.Summer,
    Autumn: dict.hud.seasons.Autumn,
    Winter: dict.hud.seasons.Winter,
  };

  const monthLabels: Record<string, string> = {
    March: dict.hud.months.March,
    April: dict.hud.months.April,
    May: dict.hud.months.May,
    June: dict.hud.months.June,
    July: dict.hud.months.July,
    August: dict.hud.months.August,
    September: dict.hud.months.September,
    October: dict.hud.months.October,
    November: dict.hud.months.November,
    December: dict.hud.months.December,
    January: dict.hud.months.January,
    February: dict.hud.months.February,
  };

  const weatherLabels: Record<string, string> = {
    clear: dict.hud.weather.clear,
    rain: dict.hud.weather.rain,
    storm: dict.hud.weather.storm,
    snow: dict.hud.weather.snow,
  };

  return (
    <div
      onClick={() => setIsWeatherDebugOpen(true)}
      className="flex items-center gap-2 select-none cursor-pointer hover:text-amber-200 transition group"
      title={`${dict.common.season}: ${seasonLabels[season] || season}, ${month && monthLabels[month] ? `${dict.common.month}: ${monthLabels[month]}, ` : ''}${weatherLabels[weather] || weather}, ${dict.common.day} ${dayOfMonth || day}, ${dict.common.year} ${year || 1}, ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}
    >
      <CompassIcon className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform drop-shadow shrink-0" />
      <div className="flex flex-col text-left leading-tight">
        <span className="font-cinzel text-[11px] font-bold text-amber-200">
          {month && monthLabels[month] ? monthLabels[month] : (seasonLabels[season] || season)}
        </span>
        <span className="text-[9px] text-amber-400/80 font-mono tracking-tight">
          {seasonLabels[season] || season}
        </span>
      </div>
      <span className="text-xs select-none drop-shadow flex items-center">
        {weather === 'clear' ? (
          <WeatherClearIcon className="w-3.5 h-3.5 text-amber-400" />
        ) : weather === 'rain' ? (
          <WeatherRainIcon className="w-3.5 h-3.5 text-blue-400" />
        ) : weather === 'storm' ? (
          <WeatherStormIcon className="w-3.5 h-3.5 text-indigo-300" />
        ) : (
          <WeatherSnowIcon className="w-3.5 h-3.5 text-cyan-200" />
        )}
      </span>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[10px] text-slate-300 font-mono font-semibold">
          {language === 'uk' ? 'Д.' : 'D.'}{dayOfMonth || day}
        </span>
        <span className="text-[9px] text-slate-400 font-mono">
          {language === 'uk' ? 'Р.' : 'Y.'}{year || 1}
        </span>
      </div>
      <div className="w-[1px] h-3.5 bg-[#4a3b26]" />
      <div className="flex items-center gap-1">
        <HourglassIcon className="w-3 h-3 text-amber-400 drop-shadow" />
        <span className="text-xs font-mono font-bold text-amber-300">
          {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
});

export const TopHUD: React.FC = React.memo(() => {
  const { dict } = useTranslation();
  const { focusTownCenter } = useTownCenterFocus();

  const resources = useGameStore((s) => s.resources);
  const settlementName = useGameStore((s) => s.settlementName);
  const setSettlementName = useGameStore((s) => s.setSettlementName);
  const setSelectedEntityId = useGameStore((s) => s.setSelectedEntityId);
  const setCameraFocusTarget = useGameStore((s) => s.setCameraFocusTarget);
  const influence = useGameStore((s) => s.influence);
  const royalFavor = useGameStore((s) => s.royalFavor);
  const immigrationProgress = useGameStore((s) => s.immigrationProgress);
  const isLordsBarOpen = useGameStore((s) => s.isLordsBarOpen);
  const toggleLordsBar = useGameStore((s) => s.toggleLordsBar);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settlementName);

  const {
    king,
    approvalRating,
    housingStats,
    storageUsage,
    totalFood,
    muleStats,
  } = useSettlementMetrics();

  const handleLordClick = useCallback(() => {
    if (king) {
      setSelectedEntityId(king.id);
      if (king.position) {
        setCameraFocusTarget([king.position[0], king.position[2]]);
      }
    }
  }, [king, setSelectedEntityId, setCameraFocusTarget]);

  const handleSaveName = useCallback(() => {
    setSettlementName(tempName.trim() || 'GOLDHOF');
    setIsEditingName(false);
  }, [tempName, setSettlementName]);

  return (
    <header className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none z-30 select-none px-2 font-cinzel">
      <div className="pointer-events-auto manor-spear-outer max-w-[98vw]">
        <div className="manor-spear-inner backdrop-blur-xl pl-8 pr-8 py-2 flex items-center gap-4 text-slate-200 overflow-x-auto scrollbar-none">
          <span className="text-amber-500/90 text-xs select-none shrink-0 -ml-2 drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]">
            ✦
          </span>

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
              className="flex items-center gap-1.5 hover:text-amber-200 transition cursor-help"
              title={`${dict.hud.approvalLevel}: ${approvalRating}%`}
            >
              <ScalesIcon className="w-3.5 h-3.5 text-amber-400 drop-shadow" />
              <span className={`font-bold font-mono text-[11px] ${approvalRating >= 60 ? 'text-emerald-400' : approvalRating >= 40 ? 'text-yellow-400' : 'text-rose-400'}`}>
                {approvalRating}%
              </span>
            </div>

            <div
              onClick={toggleLordsBar}
              className={`flex items-center gap-1.5 transition cursor-pointer ${
                isLordsBarOpen ? 'text-amber-300' : 'hover:text-amber-200'
              }`}
              title={`${dict.hud.population}: ${housingStats.occupied}/${housingStats.capacity}.\n${dict.hud.immigrationProgress}: ${Math.round(immigrationProgress)}%.\n${
                housingStats.capacity > housingStats.occupied
                  ? (approvalRating >= 50 ? dict.hud.settlersOnTheWay : dict.hud.needApprovalForImmigration)
                  : dict.hud.lackHousing
              }\n${dict.hud.clickToToggleLordsBar}`}
            >
              <PeasantsIcon className={`w-3.5 h-3.5 ${isLordsBarOpen ? 'text-amber-400' : 'text-sky-400'} drop-shadow`} />
              <span className="font-bold text-[11px] text-slate-100">{housingStats.occupied}/{housingStats.capacity}</span>
              {housingStats.capacity > housingStats.occupied && approvalRating >= 50 && (
                <span className="text-[9px] font-mono text-emerald-400 font-bold ml-0.5">
                  +{Math.round(immigrationProgress)}%
                </span>
              )}
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

          <div className="flex items-center justify-center shrink-0 mx-2">
            <div
              onClick={focusTownCenter}
              className="manor-center-plaque px-5 py-1 rounded flex items-center gap-2 cursor-pointer hover:border-amber-400 hover:shadow-[0_0_14px_rgba(212,175,55,0.45)] transition group"
              title={dict.hud.focusTownCenter}
            >
              <span className="text-amber-400 text-xs select-none">✦</span>
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
                  className="font-cinzel font-black text-xs tracking-[0.25em] text-amber-100 uppercase group-hover:text-amber-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
                >
                  {settlementName}
                </span>
              )}
              <span className="text-amber-400 text-xs select-none">✦</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <HUDTimeWidget />

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

            <div className="flex items-center gap-1 hover:text-amber-200 transition cursor-help" title={dict.hud.royalFavor}>
              <CrownIcon className="w-3.5 h-3.5 text-amber-400 drop-shadow" />
              <span className="font-bold text-emerald-400 text-[11px]">+{royalFavor}</span>
            </div>

            <div className="w-[1px] h-3.5 bg-[#4a3b26]" />

            <button
              onClick={handleLordClick}
              className="relative ml-1 group focus:outline-none shrink-0 cursor-pointer"
              title={`${dict.inspector.kingTitle}: ${king ? king.name : 'Lord'}`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] via-[#8c6b38] to-[#3a2810] p-[1.5px] shadow-md group-hover:shadow-[0_0_12px_rgba(212,175,55,0.6)] transition">
                <div className="w-full h-full rounded-full bg-[#121418] flex items-center justify-center overflow-hidden relative">
                  <CrownIcon className="w-5 h-5 text-amber-400 drop-shadow select-none group-hover:scale-110 transition" />
                </div>
              </div>
            </button>
          </div>

          <span className="text-amber-500/90 text-xs select-none shrink-0 -mr-2 drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]">
            ✦
          </span>
        </div>
      </div>
    </header>
  );
});

TopHUD.displayName = 'TopHUD';
