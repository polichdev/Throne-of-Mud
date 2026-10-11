import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { GridMap } from '../../../engine/grid/GridMap';
import { audioManager } from '../../../engine/audio/AudioManager';
import { characterEntities, world } from '../../../engine/ecs/world';
import type { MilitiaUnitType } from '../../../types/game';
import {
  SpearmanIllustration,
  SwordsmanIllustration,
  ArcherIllustration,
  PikemanIllustration,
  AddSquadCardIllustration,
} from './MilitiaCardIllustrations';
import { WeaponsIcon, PeasantsIcon, ClarionHornIcon, CompassIcon, CrossCloseIcon, MedievalInfoIcon } from '../MedievalIcons';

interface MilitiaBarProps {
  grid: GridMap;
  onClose: () => void;
}

export const MilitiaBar: React.FC<MilitiaBarProps> = React.memo(({ grid, onClose }) => {
  const { language } = useTranslation();
  const isUkr = language === 'uk';

  const militiaSquads = useGameStore((s) => s.militiaSquads);
  const selectedMilitiaSquadId = useGameStore((s) => s.selectedMilitiaSquadId);
  const setSelectedMilitiaSquadId = useGameStore((s) => s.setSelectedMilitiaSquadId);
  const createMilitiaSquad = useGameStore((s) => s.createMilitiaSquad);
  const disbandMilitiaSquad = useGameStore((s) => s.disbandMilitiaSquad);
  const rallyMilitiaSquad = useGameStore((s) => s.rallyMilitiaSquad);
  const syncMilitiaSquadsFromWorld = useGameStore((s) => s.syncMilitiaSquadsFromWorld);
  const setCameraFocusTarget = useGameStore((s) => s.setCameraFocusTarget);
  const weaponsCount = useGameStore((s) => s.resources.weapons || 0);

  React.useEffect(() => {
    syncMilitiaSquadsFromWorld();
  }, [syncMilitiaSquadsFromWorld]);

  const [showFormPanel, setShowFormPanel] = useState<boolean>(() => militiaSquads.length === 0);

  let idlePeasantsCount = 0;
  let workingPeasantsCount = 0;
  for (const c of characterEntities) {
    if (c.isCharacter && c.characterClass === 'peasant' && (!c.factionId || c.factionId === 'player') && !c.isLevy) {
      if (!c.workBuildingId) idlePeasantsCount++;
      else workingPeasantsCount++;
    }
  }
  const totalAvailableCount = idlePeasantsCount + workingPeasantsCount;

  const selectedSquad = useMemo(() => {
    return militiaSquads.find((sq) => sq.id === selectedMilitiaSquadId) || null;
  }, [militiaSquads, selectedMilitiaSquadId]);

  const handleCreateSquad = useCallback((type: MilitiaUnitType) => {
    const squad = createMilitiaSquad(type, grid);
    if (squad) {
      setShowFormPanel(false);
      setSelectedMilitiaSquadId(squad.id);
    }
  }, [createMilitiaSquad, grid, setSelectedMilitiaSquadId]);

  const handleDisbandSelected = useCallback(() => {
    if (!selectedMilitiaSquadId) return;
    disbandMilitiaSquad(selectedMilitiaSquadId);
  }, [disbandMilitiaSquad, selectedMilitiaSquadId]);

  const handleRallySelected = useCallback(() => {
    if (!selectedMilitiaSquadId) return;
    rallyMilitiaSquad(selectedMilitiaSquadId, grid);
  }, [rallyMilitiaSquad, selectedMilitiaSquadId, grid]);

  const handleFocusSelected = useCallback(() => {
    if (!selectedSquad) return;
    let sumX = 0;
    let sumZ = 0;
    let count = 0;
    for (const memId of selectedSquad.memberIds) {
      const e = world.entities.find((ent) => ent.id === memId);
      if (e && e.position) {
        sumX += e.position[0];
        sumZ += e.position[2];
        count++;
      }
    }
    if (count > 0) {
      setCameraFocusTarget([sumX / count, sumZ / count]);
    } else {
      setCameraFocusTarget(selectedSquad.rallyPoint);
    }
    audioManager.playUIClick();
  }, [selectedSquad, setCameraFocusTarget]);

  return (
    <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto z-40 select-none max-h-[calc(100vh-92px)] max-w-[98vw] overflow-y-auto">
      {selectedSquad && (
        <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="realm-paper-panel flex items-center gap-1.5 px-3 py-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.85)]">
            <span className="text-[11px] font-cinzel font-bold text-amber-300 pr-2 border-r border-amber-900/60">
              {selectedSquad.name}
            </span>

            <button
              onClick={handleRallySelected}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/70 border border-amber-700/60 hover:border-amber-400 rounded-lg text-xs font-semibold text-amber-200 transition cursor-pointer"
              title={isUkr ? 'Наказати зібратися у шеренгу' : 'Order squad to assemble in formation'}
            >
              <ClarionHornIcon className="w-4 h-4" />
              <span>{isUkr ? 'До строю' : 'Rally'}</span>
            </button>

            <button
              onClick={handleFocusSelected}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-lg text-xs font-semibold text-slate-200 transition cursor-pointer"
              title={isUkr ? 'Показати загін на карті' : 'Center camera on squad'}
            >
              <CompassIcon className="w-4 h-4" />
              <span>{isUkr ? 'Огляд' : 'Focus'}</span>
            </button>

            <button
              onClick={handleDisbandSelected}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/70 hover:border-rose-400 rounded-lg text-xs font-semibold text-rose-200 transition cursor-pointer"
              title={isUkr ? 'Розпустити загін та повернути селян до роботи' : 'Disband squad and return peasants to work'}
            >
              <CrossCloseIcon className="w-4 h-4" />
              <span>{isUkr ? 'Розпустити' : 'Disband'}</span>
            </button>
          </div>

          <div className="realm-paper-panel px-2.5 py-0.5 text-[10px] text-amber-300/90 font-medium">
            {isUkr
              ? 'ЛКМ — рух загону · ПКМ — скасувати'
              : 'Left click — march · Right click — cancel'}
          </div>
        </div>
      )}

      {!selectedSquad && Array.from(characterEntities).some((c) => c.isCharacter && c.isLevy) && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#14161b]/95 backdrop-blur-md rounded-xl border border-amber-600/70 shadow-[0_8px_25px_rgba(0,0,0,0.85)] animate-in fade-in">
          <span className="text-xs font-cinzel text-amber-200">
            {isUkr ? 'У поселенні є мобілізовані ополченці' : 'Active levies in settlement'}
          </span>
          <button
            onClick={() => syncMilitiaSquadsFromWorld()}
            className="px-2 py-0.5 bg-amber-950 hover:bg-amber-900 border border-amber-600 rounded text-xs text-amber-200 cursor-pointer"
          >
            {isUkr ? 'Оновити' : 'Refresh'}
          </button>
          <button
            onClick={() => disbandMilitiaSquad('all')}
            className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 border border-rose-600 rounded text-xs text-rose-200 cursor-pointer"
          >
            {isUkr ? 'Розпустити всіх' : 'Disband all'}
          </button>
        </div>
      )}

      {showFormPanel && (
        <div className="realm-paper-panel realm-militia-panel w-[1040px] max-w-[98vw] shrink-0 backdrop-blur-md shadow-[0_15px_45px_rgba(0,0,0,0.95)] p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#52422d]/60 pb-2">
            <div className="flex items-center gap-2">
              <ClarionHornIcon className="w-5 h-5 text-[#bea777]" />
              <span className="text-base font-cinzel font-bold text-amber-200 tracking-wider">
                {isUkr ? 'Скликати ополчення' : 'Form Militia'}
              </span>
            </div>
            <button
              onClick={() => {
                audioManager.playUIPanelClose();
                setShowFormPanel(false);
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-stone-400 hover:text-amber-200 hover:bg-white/5 transition cursor-pointer"
            >
              <CrossCloseIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="realm-militia-grid">
            <div className="realm-militia-choice p-3 flex flex-col justify-between group">
              <div className="realm-militia-card-body flex gap-3 items-start">
                <div className="realm-militia-portrait w-16 h-24 rounded-lg overflow-hidden border border-[#5a4830] shadow shrink-0">
                  <SpearmanIllustration />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-cinzel font-bold text-xs text-amber-100 group-hover:text-amber-300 transition">
                    {isUkr ? 'Селянські списники' : 'Peasant Spearmen'}
                  </span>
                  <p className="text-[10px] text-stone-300 leading-snug">
                    {isUkr
                      ? 'Легке ополчення · без зброї зі складу'
                      : 'Light levy · no stock weapons needed'}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                    <span>✓</span>
                    <span>{isUkr ? 'Без витрат' : 'No cost'}</span>
                  </div>
                </div>
              </div>

              <button
                disabled={totalAvailableCount === 0}
                onClick={() => handleCreateSquad('spearmen')}
                className={`mt-2.5 w-full py-1.5 rounded-lg text-xs font-cinzel font-bold transition border cursor-pointer ${
                  totalAvailableCount > 0
                    ? 'bg-amber-600/80 hover:bg-amber-500 text-stone-900 border-amber-400 shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                    : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                }`}
              >
                {totalAvailableCount > 0
                  ? (isUkr ? `Скликати загін (${Math.min(5, totalAvailableCount)} чол.)` : `Form Squad (${Math.min(5, totalAvailableCount)} men)`)
                  : (isUkr ? 'Немає людей' : 'No Manpower')}
              </button>
            </div>

            <div className="realm-militia-choice p-3 flex flex-col justify-between group">
              <div className="realm-militia-card-body flex gap-3 items-start">
                <div className="realm-militia-portrait w-16 h-24 rounded-lg overflow-hidden border border-[#5a4830] shadow shrink-0">
                  <SwordsmanIllustration />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-cinzel font-bold text-xs text-amber-100 group-hover:text-amber-300 transition">
                    {isUkr ? 'Ополченці-мечники' : 'Swordsmen Militia'}
                  </span>
                  <p className="text-[10px] text-stone-300 leading-snug">
                    {isUkr
                      ? 'Важче ополчення · потрібна зброя'
                      : 'Armed levy · stock weapons required'}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    <WeaponsIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span className={weaponsCount > 0 ? 'text-amber-300 font-semibold' : 'text-rose-400 font-semibold'}>
                      {isUkr ? `На складі: ${weaponsCount} шт.` : `In stock: ${weaponsCount}`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                disabled={totalAvailableCount === 0 || weaponsCount === 0}
                onClick={() => handleCreateSquad('swordsmen')}
                className={`mt-2.5 w-full py-1.5 rounded-lg text-xs font-cinzel font-bold transition border cursor-pointer ${
                  totalAvailableCount > 0 && weaponsCount > 0
                    ? 'bg-amber-600/80 hover:bg-amber-500 text-stone-900 border-amber-400 shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                    : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                }`}
              >
                {weaponsCount === 0
                  ? (isUkr ? 'Потрібна зброя' : 'Weapons Needed')
                  : totalAvailableCount > 0
                    ? (isUkr ? `Скликати загін (${Math.min(5, totalAvailableCount, weaponsCount)} чол.)` : `Form Squad (${Math.min(5, totalAvailableCount, weaponsCount)} men)`)
                    : (isUkr ? 'Немає людей' : 'No Manpower')}
              </button>
            </div>

            <div className="realm-militia-choice p-3 flex flex-col justify-between group">
              <div className="realm-militia-card-body flex gap-3 items-start">
                <div className="realm-militia-portrait w-16 h-24 overflow-hidden border border-[#5a4830] shadow shrink-0"><ArcherIllustration /></div>
                <div className="flex flex-col gap-1">
                  <span className="font-cinzel font-bold text-xs text-amber-100 group-hover:text-amber-300 transition">{isUkr ? 'Лучники' : 'Archers'}</span>
                  <p className="text-[10px] text-stone-300 leading-snug">{isUkr ? 'Луки · розріджений стрій' : 'Bows · loose formation'}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    <WeaponsIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span className={weaponsCount > 0 ? 'text-amber-300 font-semibold' : 'text-rose-400 font-semibold'}>{isUkr ? `Зброя: ${weaponsCount}` : `Weapons: ${weaponsCount}`}</span>
                  </div>
                </div>
              </div>
              <button disabled={totalAvailableCount === 0 || weaponsCount === 0} onClick={() => handleCreateSquad('archers')}
                className="realm-militia-recruit mt-2.5 w-full py-1.5 text-xs font-cinzel font-bold transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed">
                {weaponsCount === 0 ? (isUkr ? 'Потрібна зброя' : 'Weapons Needed') : totalAvailableCount === 0 ? (isUkr ? 'Немає людей' : 'No Manpower') : (isUkr ? `Скликати загін (${Math.min(5, totalAvailableCount, weaponsCount)} чол.)` : `Form Squad (${Math.min(5, totalAvailableCount, weaponsCount)} men)`)}
              </button>
            </div>

            <div className="realm-militia-choice p-3 flex flex-col justify-between group">
              <div className="realm-militia-card-body flex gap-3 items-start">
                <div className="realm-militia-portrait w-16 h-24 overflow-hidden border border-[#5a4830] shadow shrink-0"><PikemanIllustration /></div>
                <div className="flex flex-col gap-1">
                  <span className="font-cinzel font-bold text-xs text-amber-100 group-hover:text-amber-300 transition">{isUkr ? 'Пікінери' : 'Pikemen'}</span>
                  <p className="text-[10px] text-stone-300 leading-snug">{isUkr ? 'Довгі піки · щільний стрій' : 'Long pikes · close formation'}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    <WeaponsIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span className={weaponsCount > 0 ? 'text-amber-300 font-semibold' : 'text-rose-400 font-semibold'}>{isUkr ? `Зброя: ${weaponsCount}` : `Weapons: ${weaponsCount}`}</span>
                  </div>
                </div>
              </div>
              <button disabled={totalAvailableCount === 0 || weaponsCount === 0} onClick={() => handleCreateSquad('pikemen')}
                className="realm-militia-recruit mt-2.5 w-full py-1.5 text-xs font-cinzel font-bold transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed">
                {weaponsCount === 0 ? (isUkr ? 'Потрібна зброя' : 'Weapons Needed') : totalAvailableCount === 0 ? (isUkr ? 'Немає людей' : 'No Manpower') : (isUkr ? `Скликати загін (${Math.min(5, totalAvailableCount, weaponsCount)} чол.)` : `Form Squad (${Math.min(5, totalAvailableCount, weaponsCount)} men)`)}
              </button>
            </div>
          </div>

          <div className="realm-militia-manpower p-3 flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center justify-between text-stone-300">
              <span className="font-semibold text-amber-200">
                {isUkr ? 'Доступні селяни' : 'Available peasants'}
              </span>
              <span className="font-mono font-bold text-amber-300">
                {totalAvailableCount} {isUkr ? 'селян' : 'peasants'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 pl-2">
              <span><PeasantsIcon className="inline w-3 h-3 mr-1" />{isUkr ? 'Вільні' : 'Idle'}</span>
              <span className="font-mono text-emerald-400 font-semibold">{idlePeasantsCount}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 pl-2">
              <span><PeasantsIcon className="inline w-3 h-3 mr-1" />{isUkr ? 'Працюють' : 'Working'}</span>
              <span className="font-mono text-amber-400 font-semibold">{workingPeasantsCount}</span>
            </div>
            <p className="mt-1 pt-1.5 border-t border-[#3e3223]/60 text-[10px] text-stone-400 flex items-center gap-1.5">
              <MedievalInfoIcon className="w-3.5 h-3.5 shrink-0 text-[#a9946f]" />
              {isUkr ? 'Після розпуску селяни повернуться до роботи.' : 'Peasants return to work after disbanding.'}
            </p>
          </div>
        </div>
      )}

      <div className="realm-paper-panel relative backdrop-blur-md px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.95)] flex items-center gap-2">
        {militiaSquads.map((squad, index) => {
          const isSelected = selectedMilitiaSquadId === squad.id;
          const currentCount = squad.memberIds.length;

          return (
            <button
              key={squad.id}
              onClick={() => {
                audioManager.playUIClick();
                setSelectedMilitiaSquadId(isSelected ? null : squad.id);
              }}
              className={`relative w-[72px] h-[132px] rounded overflow-hidden border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-300 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.65)] -translate-y-1.5'
                  : 'border-[#5a4830]/90 hover:border-amber-400/80 hover:-translate-y-0.5'
              }`}
            >
              <div className="absolute top-0 left-0 z-20 bg-[#161822]/95 text-stone-100 border-r border-b border-[#5a4830] px-1.5 py-0.5 rounded-br text-[10px] font-cinzel font-bold shadow">
                {index + 1}
              </div>

              <div className="absolute inset-0">
                {squad.type === 'swordsmen' ? <SwordsmanIllustration /> : squad.type === 'archers' ? <ArcherIllustration /> : squad.type === 'pikemen' ? <PikemanIllustration /> : <SpearmanIllustration />}
              </div>

              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded bg-black/75 backdrop-blur-[1px] border border-amber-950/60 shadow flex items-center justify-center">
                <span className="text-[12px] font-cinzel font-extrabold text-[#ead8b2] tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                  {currentCount}/{squad.maxMembers}
                </span>
              </div>
            </button>
          );
        })}

        <button
          onClick={() => {
            audioManager.playUIClick();
            setShowFormPanel(!showFormPanel);
          }}
          className={`relative w-[72px] h-[132px] rounded overflow-hidden border transition-all cursor-pointer flex flex-col items-center justify-center ${
            showFormPanel
              ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_16px_rgba(245,158,11,0.5)] -translate-y-1.5'
              : 'border-[#5a4830]/90 hover:border-amber-400/80 hover:-translate-y-0.5'
          }`}
          title={isUkr ? 'Скликати новий загін ополчення (+)' : 'Form new militia squad (+)'}
        >
          <div className="absolute inset-0">
            <AddSquadCardIllustration />
          </div>
        </button>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-[#181a20] border border-[#5a4830] hover:border-amber-400 text-stone-400 hover:text-amber-200 flex items-center justify-center text-xs transition cursor-pointer self-center ml-1"
          title={isUkr ? 'Закрити панель ополчення' : 'Close Militia Bar'}
        >
          <CrossCloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

MilitiaBar.displayName = 'MilitiaBar';
