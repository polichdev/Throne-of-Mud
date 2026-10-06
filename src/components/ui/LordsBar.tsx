import React from 'react';
import { buildingEntities } from '../../engine/ecs/world';
import { useGameStore } from '../../store/useGameStore';
import { useTranslation } from '../../i18n';
import { useSettlementMetrics } from '../../hooks/useSettlementMetrics';
import {
  CrownIcon,
  CrossCloseIcon,
  WeaponsIcon,
  PeasantsIcon,
  GoldIcon,
  WheatIcon,
  HammerIcon,
  SlumberMoonIcon,
} from './MedievalIcons';

export const LordsBar: React.FC = React.memo(() => {
  const { dict } = useTranslation();
  const selectedEntityId = useGameStore((s) => s.selectedEntityId);
  const setSelectedEntityId = useGameStore((s) => s.setSelectedEntityId);
  const setCameraFocusTarget = useGameStore((s) => s.setCameraFocusTarget);
  const toggleLordsBar = useGameStore((s) => s.toggleLordsBar);

  const {
    lords,
    peasants,
    employedPeasants,
    freePeasants,
    levyPeasants,
  } = useSettlementMetrics();

  const handleLordClick = (lord: typeof lords[0]) => {
    setSelectedEntityId(lord.id);
    if (lord.position) {
      setCameraFocusTarget([lord.position[0], lord.position[2]]);
    }
  };

  return (
    <div className="absolute top-18 left-3 flex flex-col gap-2 pointer-events-auto z-20 animate-in fade-in slide-in-from-left-3 duration-200 select-none font-cinzel">
      <div className="bg-[#121418]/95 backdrop-blur-md p-2.5 rounded-2xl border-2 border-[#5a4830] shadow-2xl flex flex-col gap-2 w-60">
        <div className="flex items-center justify-between px-1 border-b border-[#3d3222] pb-1.5">
          <div className="flex items-center gap-1.5">
            <CrownIcon className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-cinzel">
              {dict.lordsBar.title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800/60">
              {lords.length}
            </span>
            <button
              onClick={toggleLordsBar}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={dict.lordsBar.hidePanel}
            >
              <CrossCloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {lords.map((lord) => {
            const isSelected = selectedEntityId === lord.id;
            const mood = Math.round(lord.needs?.mood || 60);

            const supervisedBuilding = Array.from(buildingEntities).find(
              (b) => b.assignedLordId === lord.id
            );

            let statusText = dict.lordsBar.freeStatus;
            let isSleeping = false;
            if (supervisedBuilding) {
              statusText = `${dict.lordsBar.managingBuilding}: ${supervisedBuilding.name || ''}`;
            } else if (lord.currentJob?.type === 'sleep') {
              statusText = dict.lordsBar.restingStatus;
              isSleeping = true;
            } else if (lord.currentJob?.type === 'sit_by_fire') {
              statusText = 'Біля вогнища';
            } else if (lord.currentJob?.type === 'wander') {
              statusText = dict.lordsBar.inspectingStatus;
            }

            let moodLabel = dict.lordsBar.moodModerate;
            let moodColor = 'text-yellow-400';
            let moodDot = 'bg-yellow-400';
            if (mood >= 75) {
              moodLabel = dict.lordsBar.moodElevated;
              moodColor = 'text-emerald-400';
              moodDot = 'bg-emerald-400';
            } else if (mood < 40) {
              moodLabel = dict.lordsBar.moodAngry;
              moodColor = 'text-rose-400';
              moodDot = 'bg-rose-400';
            }

            return (
              <button
                key={lord.id}
                onClick={() => handleLordClick(lord)}
                className={`flex flex-col gap-1 p-2 rounded-xl text-left transition border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/80 border-amber-500 shadow-lg shadow-amber-950/50'
                    : 'bg-slate-800/50 border-[#3d3222] hover:bg-slate-850 hover:border-amber-700/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow border border-amber-400/30"
                      style={{ backgroundColor: lord.avatarColor || '#f59e0b' }}
                    >
                      {lord.characterClass === 'king' ? (
                        <CrownIcon className="w-4 h-4 text-amber-200 drop-shadow" />
                      ) : lord.characterClass === 'lady' ? (
                        <CrownIcon className="w-4 h-4 text-purple-200 drop-shadow" />
                      ) : (
                        <WeaponsIcon className="w-4 h-4 text-red-200 drop-shadow" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-100 truncate font-cinzel">
                        {lord.name}
                      </span>
                      <span className="text-[10px] text-amber-200/70 truncate">
                        {lord.title || dict.lordsBar.defaultTitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 text-right">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${moodDot}`} />
                      <span className={`text-[9px] font-mono font-bold ${moodColor}`}>
                        {mood}%
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-serif">{moodLabel}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80 text-slate-400 font-sans">
                  <span className="truncate max-w-[130px] flex items-center gap-1">
                    {isSleeping && <SlumberMoonIcon className="w-3 h-3 text-sky-300 inline" />}
                    {statusText}
                  </span>
                  <span className="font-mono text-amber-300 font-semibold shrink-0 flex items-center gap-1">
                    <GoldIcon className="w-3 h-3 text-amber-400" />
                    {lord.gold ?? 0}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[#121418]/95 backdrop-blur-md p-2.5 rounded-2xl border-2 border-[#5a4830] shadow-xl flex flex-col gap-1.5 w-60 text-xs">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1 border-b border-[#3d3222] pb-1">
          <span className="flex items-center gap-1.5 text-amber-200 font-cinzel">
            <PeasantsIcon className="w-3.5 h-3.5 text-amber-400" />
            {dict.lordsBar.peasantState}
          </span>
          <span className="font-mono text-emerald-400 font-bold">{peasants.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300 font-sans">
          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-slate-400 flex items-center gap-1">
              <HammerIcon className="w-3 h-3 text-amber-400" />
              {dict.lordsBar.employed}
            </span>
            <span className="font-mono font-bold text-amber-300 text-xs mt-0.5">
              {employedPeasants.length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-slate-400 flex items-center gap-1">
              <WheatIcon className="w-3 h-3 text-emerald-400" />
              {dict.lordsBar.free}
            </span>
            <span className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
              {freePeasants.length}
            </span>
          </div>
        </div>

        {levyPeasants.length > 0 && (
          <div className="bg-rose-950/40 p-1.5 rounded-lg border border-rose-800/50 flex items-center justify-between text-[10px] text-rose-200 font-sans">
            <span className="flex items-center gap-1">
              <WeaponsIcon className="w-3 h-3 text-rose-400" />
              {dict.lordsBar.levyMilitia}
            </span>
            <span className="font-mono font-bold">{levyPeasants.length}</span>
          </div>
        )}
      </div>
    </div>
  );
});

LordsBar.displayName = 'LordsBar';
