import { useEffect, useState } from 'react';
import { GridMap } from '../../engine/grid/GridMap';
import { useGameStore } from '../../store/useGameStore';
import { Eye } from 'lucide-react';
import {
  MapParchmentIcon,
  CrossCloseIcon,
  ShieldIcon,
  PeasantsIcon,
  TownCenterIcon,
  GoldIcon,
} from './MedievalIcons';
import { StrategicMapCanvas } from './StrategicMapCanvas';
import { useTranslation } from '../../i18n';

interface StrategicMapModalProps {
  grid: GridMap;
}

export function StrategicMapModal({ grid }: StrategicMapModalProps) {
  const regions = useGameStore((s) => s.regions);
  const playerRegionId = useGameStore((s) => s.playerRegionId);
  const isStrategicMapOpen = useGameStore((s) => s.isStrategicMapOpen);
  const setIsStrategicMapOpen = useGameStore((s) => s.setIsStrategicMapOpen);
  const focusOnRegion = useGameStore((s) => s.focusOnRegion);

  const { dict, language } = useTranslation();
  const [inspectedRegionId, setInspectedRegionId] = useState<number>(playerRegionId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        if (isStrategicMapOpen) {
          setIsStrategicMapOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStrategicMapOpen, setIsStrategicMapOpen]);

  if (!isStrategicMapOpen) return null;

  const inspectedRegion = regions.find((r) => r.id === inspectedRegionId) || regions[playerRegionId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200 select-none font-cinzel pointer-events-auto">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-[#1a140d] border-2 border-[#855e32] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col pointer-events-auto">

        <div className="relative z-10 flex items-center justify-between px-6 py-3.5 bg-gradient-to-b from-[#2b1f13] to-[#1e150d] border-b border-[#634522]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-600/70 flex items-center justify-center shadow-inner text-amber-300">
              <MapParchmentIcon size={22} className="text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-amber-200 uppercase drop-shadow">
                {language === 'uk' ? 'Стратегічна Карта Володінь • Manor Lords' : 'Strategic Realm Map • Manor Lords'}
              </h2>
              <p className="text-[11px] text-amber-400/70">
                {language === 'uk' ? 'Світ 4-х провінцій (256 × 256) • Натисніть [M] або [ESC] для повернення у 3D' : 'Realm of 4 Fiefdoms (256 × 256) • Press [M] or [ESC] to return to 3D'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-amber-300/70 bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-800/40 hidden sm:inline-block">
              {language === 'uk' ? 'Клацніть на карту або герб для переходу камери' : 'Click on map or crest to focus camera'}
            </span>
            <button
              onClick={() => setIsStrategicMapOpen(false)}
              className="w-8 h-8 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 flex items-center justify-center transition-colors shadow cursor-pointer"
              title={dict.common.close}
            >
              <CrossCloseIcon size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          <div className="lg:w-7/12 h-64 lg:h-full bg-[#120d08] p-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#4d351b] relative">
            <StrategicMapCanvas
              grid={grid}
              mode="ingame"
              onClose={() => setIsStrategicMapOpen(false)}
              width={580}
              height={580}
            />

            <div className="absolute bottom-3 left-4 z-10 text-[10px] text-amber-400/80 bg-[#1a130c]/90 px-3 py-1 rounded-lg border border-stone-800 flex items-center gap-1.5">
              <MapParchmentIcon size={12} className="text-amber-400" />
              <span>{language === 'uk' ? 'Клацніть на будь-яку точку карти для миттєвого переміщення камери' : 'Click anywhere on map to pan camera'}</span>
            </div>
          </div>

          <div className="lg:w-5/12 h-full overflow-y-auto p-4 space-y-3.5 bg-[#161009]">
            <div className="flex items-center justify-between pb-1 border-b border-[#3b2713]">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldIcon size={14} className="text-amber-500" />
                <span>{language === 'uk' ? 'Провінції та Феодальні Володіння' : 'Fiefdoms & Feudal Territories'}</span>
              </h3>
              <span className="text-[10px] text-amber-400/60 font-mono">
                {language === 'uk' ? 'Всього: 4 зони' : 'Total: 4 zones'}
              </span>
            </div>

            <div className="space-y-2.5">
              {regions.map((region) => {
                const isPlayer = region.id === playerRegionId;
                const isBot = region.owner === 'bot';
                const isSelected = region.id === inspectedRegionId;
                const regName = language === 'uk' ? (region.ukrName || region.name) : region.name;

                return (
                  <div
                    key={region.id}
                    onClick={() => setInspectedRegionId(region.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#2c1e10] to-[#1f150c] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : isPlayer
                        ? 'bg-[#1b150c] border-amber-700/60 hover:border-amber-500'
                        : isBot
                        ? 'bg-[#181111] border-red-900/40 hover:border-red-700/70'
                        : 'bg-[#13100c] border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg border shadow"
                          style={{
                            backgroundColor: `${region.heraldryColor}22`,
                            borderColor: region.heraldryColor,
                          }}
                        >
                          {region.heraldryIcon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-100 text-sm">{regName}</span>
                            {isPlayer && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                                {language === 'uk' ? 'ВАШЕ' : 'YOURS'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-amber-400/70 block">
                            {region.lordName} • <span className="italic">{region.lordTitle}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          focusOnRegion(region.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-600/40 text-[10px] font-bold transition-all flex items-center gap-1 shadow cursor-pointer"
                        title={language === 'uk' ? 'Перейти камерою' : 'Focus Camera'}
                      >
                        <Eye size={11} />
                        <span>{language === 'uk' ? 'Огляд' : 'View'}</span>
                      </button>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-800/80 grid grid-cols-4 gap-1 text-[11px]">
                      <div className="flex items-center gap-1 text-amber-200/80">
                        <PeasantsIcon size={12} className="text-amber-400" />
                        <span>{region.population} {language === 'uk' ? 'жит.' : 'pop.'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-200/80">
                        <TownCenterIcon size={12} className="text-amber-400" />
                        <span>{region.buildingsCount} {language === 'uk' ? 'спор.' : 'bld.'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-200/80">
                        <GoldIcon size={12} className="text-amber-400" />
                        <span>{region.wealth} {language === 'uk' ? 'зол.' : 'gold'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-200/80">
                        <span className="text-amber-400 font-bold">★</span>
                        <span>{region.approval}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {inspectedRegion && (
              <div className="p-3.5 bg-[#1a130c] border border-amber-800/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                    {language === 'uk' ? (inspectedRegion.ukrName || inspectedRegion.name) : inspectedRegion.name}
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    {inspectedRegion.id === playerRegionId ? (language === 'uk' ? 'Столиця володінь' : 'Realm Capital') : (language === 'uk' ? 'Сусідній регіон' : 'Neighboring Fief')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {inspectedRegion.description}
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

