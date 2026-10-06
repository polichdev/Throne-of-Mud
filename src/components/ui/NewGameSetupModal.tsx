import { useState } from 'react';
import { GridMap } from '../../engine/grid/GridMap';
import { DEFAULT_REGIONS, PRESET_BOT_LORDS } from '../../store/useGameStore';
import type { WorldSetupConfig, SpawnPointData } from '../../types/game';
import { ArrowRight } from 'lucide-react';
import {
  CrownIcon,
  CrossCloseIcon,
  MapParchmentIcon,
  MedievalCheckIcon,
  WeaponsIcon,
  ShieldIcon,
  CastleKeepIcon,
  DiplomacyPactIcon
} from './MedievalIcons';
import { StrategicMapCanvas } from './StrategicMapCanvas';
import { useTranslation } from '../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: WorldSetupConfig) => void;
  grid: GridMap;
}

export function NewGameSetupModal({ isOpen, onClose, onConfirm, grid }: Props) {
  const { dict, language } = useTranslation();
  const [selectedRegionId, setSelectedRegionId] = useState<number>(0);
  const [selectedSpawnPointId, setSelectedSpawnPointId] = useState<string>('sp-0-1');
  const [botCount, setBotCount] = useState<number>(3);

  if (!isOpen) return null;

  const selectedRegion = DEFAULT_REGIONS[selectedRegionId];
  const spawnPoints: SpawnPointData[] = selectedRegion.spawnPoints || GridMap.getPresetSpawnPoints(selectedRegionId);

  const activeSpawn = spawnPoints.find((s) => s.id === selectedSpawnPointId) || spawnPoints[0];

  const handleSelectRegion = (regId: number) => {
    setSelectedRegionId(regId);
    const newSpList = DEFAULT_REGIONS[regId]?.spawnPoints || GridMap.getPresetSpawnPoints(regId);
    if (newSpList && newSpList.length > 0) {
      setSelectedSpawnPointId(newSpList[0].id);
    }
  };

  const handleStart = () => {
    onConfirm({
      playerRegionId: selectedRegionId,
      playerSpawnPoint: activeSpawn.position,
      selectedSpawnPointId: activeSpawn.id,
      botCount,
    });
  };

  const otherRegions = DEFAULT_REGIONS.filter((r) => r.id !== selectedRegionId);
  const regionDisplayName = language === 'uk' ? (selectedRegion.ukrName || selectedRegion.name) : selectedRegion.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200 select-none font-cinzel pointer-events-auto">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-[#1a140e] border-2 border-[#825c31] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col pointer-events-auto">

        <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-b from-[#2d2013] to-[#1e150d] border-b border-[#5e4120]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-600/70 flex items-center justify-center shadow text-amber-300">
              <CrownIcon size={22} className="text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-amber-200 uppercase drop-shadow">
                {dict.newGame.title}
              </h2>
              <p className="text-[11px] text-amber-400/70">
                {dict.newGame.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 flex items-center justify-center transition-colors shadow cursor-pointer"
            title={dict.common.close}
          >
            <CrossCloseIcon size={16} />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          <div className="lg:w-7/12 h-64 lg:h-full bg-[#120d08] p-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#4d351b] relative">
            <div className="absolute top-4 left-5 z-10 flex items-center gap-2 bg-[#1b140d]/90 px-3 py-1.5 rounded-xl border border-amber-700/60 shadow">
              <MapParchmentIcon size={14} className="text-amber-400" />
              <span className="text-xs text-amber-200 font-bold uppercase tracking-wider">
                {dict.newGame.mapTitle}
              </span>
            </div>

            <StrategicMapCanvas
              grid={grid}
              mode="setup"
              selectedRegionId={selectedRegionId}
              onSelectRegion={handleSelectRegion}
              selectedSpawnPointId={activeSpawn.id}
              onSelectSpawnPoint={(spId) => setSelectedSpawnPointId(spId)}
              width={580}
              height={580}
            />

            <div className="absolute bottom-4 left-5 z-10 text-[10px] text-amber-400/70 bg-[#1a130c]/85 px-3 py-1 rounded-lg border border-stone-800 flex items-center gap-1.5">
              <MapParchmentIcon size={12} className="text-amber-400" />
              <span>{language === 'uk' ? 'Клацніть на сектор для вибору регіону, або на прапорець для вибору точки табору' : 'Click a sector to choose region, or flag to choose camp location'}</span>
            </div>
          </div>

          <div className="lg:w-5/12 h-full overflow-y-auto p-5 space-y-4 bg-[#17110a]">

            <div className="bg-[#1e150d] p-3.5 rounded-xl border border-amber-900/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg border shadow"
                    style={{
                      backgroundColor: `${selectedRegion.heraldryColor}22`,
                      borderColor: selectedRegion.heraldryColor,
                    }}
                  >
                    {selectedRegion.heraldryIcon}
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-100 text-sm flex items-center gap-2">
                      <span>{regionDisplayName}</span>
                      <span className="text-xs text-amber-400/50 font-mono">({selectedRegion.name})</span>
                    </h3>
                    <span className="text-[10px] text-amber-400/70 block">
                      {language === 'uk' ? 'Межі' : 'Bounds'}: [{selectedRegion.bounds.minX}..{selectedRegion.bounds.maxX}, {selectedRegion.bounds.minZ}..{selectedRegion.bounds.maxZ}]
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  {DEFAULT_REGIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRegion(r.id)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-all border cursor-pointer ${
                        r.id === selectedRegionId
                          ? 'bg-amber-500 text-slate-950 border-amber-300 scale-110 shadow'
                          : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-amber-200'
                      }`}
                      title={language === 'uk' ? (r.ukrName || r.name) : r.name}
                    >
                      {r.id + 1}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-amber-300/80 leading-relaxed italic border-t border-amber-900/30 pt-2">
                "{selectedRegion.description}"
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center border border-amber-500/40">
                    2
                  </span>
                  <h3 className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                    {dict.newGame.selectCamp}
                  </h3>
                </div>
                <span className="text-[10px] text-amber-400/60 font-mono">
                  [{activeSpawn.position[0]}, {activeSpawn.position[1]}]
                </span>
              </div>

              <div className="space-y-2">
                {spawnPoints.map((sp, idx) => {
                  const isSpActive = sp.id === activeSpawn.id;
                  return (
                    <div
                      key={sp.id}
                      onClick={() => setSelectedSpawnPointId(sp.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                        isSpActive
                          ? 'bg-gradient-to-r from-[#2c1f11] to-[#22180e] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-[#15100a] border-stone-800 hover:border-amber-700/60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border mt-0.5 ${
                            isSpActive ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-stone-800 text-stone-400 border-stone-700'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-200">{sp.name}</span>
                            <span className="text-[10px] text-amber-400/50 font-mono">
                              [{sp.position[0]}, {sp.position[1]}]
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-300/70 mt-0.5 leading-snug">
                            {sp.description}
                          </p>
                        </div>
                      </div>

                      {isSpActive && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs shrink-0 mt-1 shadow">
                          <MedievalCheckIcon size={12} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center border border-amber-500/40">
                  3
                </span>
                <h3 className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                  {dict.newGame.rivalLords} (0 - 4)
                </h3>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((count) => {
                  const isCountSelected = count === botCount;
                  return (
                    <button
                      key={count}
                      onClick={() => setBotCount(count)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                        isCountSelected
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-[#15100a] text-stone-400 border-stone-800 hover:border-amber-700 hover:text-amber-200'
                      }`}
                    >
                      <div className="h-6 flex items-center justify-center">
                        {count === 0 && <DiplomacyPactIcon size={18} className="mx-auto" />}
                        {count === 1 && <WeaponsIcon size={18} className="mx-auto" />}
                        {count === 2 && (
                          <div className="flex items-center justify-center gap-1">
                            <ShieldIcon size={15} />
                            <WeaponsIcon size={15} />
                          </div>
                        )}
                        {count === 3 && (
                          <div className="flex items-center justify-center gap-1">
                            <CastleKeepIcon size={15} />
                            <WeaponsIcon size={15} />
                          </div>
                        )}
                        {count === 4 && (
                          <div className="flex items-center justify-center gap-1">
                            <CrownIcon size={15} />
                            <CastleKeepIcon size={15} />
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-bold">{count === 0 ? '0' : `${count}`}</div>
                      <div className="text-[9px] opacity-75">
                        {count === 0 ? (language === 'uk' ? 'Мирно' : 'Peaceful') : (language === 'uk' ? `${count} лорд.` : `${count} lords`)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {botCount > 0 && (
                <div className="mt-2.5 p-2 rounded-xl bg-[#120e09] border border-amber-900/30 space-y-1.5">
                  <span className="text-[10px] text-amber-400/70 font-semibold block uppercase tracking-wider">
                    {language === 'uk' ? 'Розподіл лордів по інших регіонах:' : 'Rival Lords distribution across fiefs:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {PRESET_BOT_LORDS.slice(0, botCount).map((bot, idx) => {
                      const assignedRegion = otherRegions[idx];
                      const botRegionName = assignedRegion ? (language === 'uk' ? (assignedRegion.ukrName || assignedRegion.name) : assignedRegion.name) : 'Lands';
                      return (
                        <div
                          key={bot.id}
                          className="flex items-center gap-2 px-2.5 py-1 rounded bg-stone-950/60 border border-stone-800 text-[11px]"
                        >
                          <span>{bot.heraldryIcon}</span>
                          <div className="truncate">
                            <span className="font-bold text-amber-200 block truncate">{bot.name}</span>
                            <span className="text-[9px] text-amber-400/50 block truncate">
                              {language === 'uk' ? `Зона: ${botRegionName}` : `Fief: ${botRegionName}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="px-6 py-3 bg-[#140e08] border-t border-[#4a341b] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-700 text-stone-400 hover:text-amber-200 hover:border-stone-500 transition-colors text-xs font-semibold cursor-pointer"
          >
            {dict.common.cancel}
          </button>

          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-[0_4px_25px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>{dict.newGame.startJourney}</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </div>
  );
}
