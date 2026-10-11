import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPinned } from 'lucide-react';
import { GridMap } from '../../engine/grid/GridMap';
import { DEFAULT_REGIONS, PRESET_BOT_LORDS } from '../../store/useGameStore';
import { DEFAULT_PLAYER_IDENTITY, HERALDRY_EMBLEMS, SHIELD_COLORS } from '../../constants/playerIdentity';
import type { PlayerIdentity, SpawnPointData, WorldSetupConfig } from '../../types/game';
import { CrownIcon, CrossCloseIcon } from './MedievalIcons';
import { HeraldicShield, RulerPortrait, RULER_PORTRAIT_COUNT } from './PlayerHeraldry';
import { StrategicMapCanvas } from './StrategicMapCanvas';
import { useTranslation } from '../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: WorldSetupConfig) => void;
  grid: GridMap;
}

type Season = NonNullable<WorldSetupConfig['startingSeason']>;
type Supplies = NonNullable<WorldSetupConfig['startingSupplies']>;
type Scenario = 'calm' | 'frontier' | 'hardship';

export function NewGameSetupModal({ isOpen, onClose, onConfirm, grid }: Props) {
  const { language } = useTranslation();
  const isUkr = language === 'uk';
  const [step, setStep] = useState<1 | 2>(1);
  const [identity, setIdentity] = useState<PlayerIdentity>({ ...DEFAULT_PLAYER_IDENTITY, rulerName: '', portraitId: -1 });
  const [selectedRegionId, setSelectedRegionId] = useState(0);
  const [selectedSpawnPointId, setSelectedSpawnPointId] = useState('sp-0-1');
  const [botCount, setBotCount] = useState(3);
  const [season, setSeason] = useState<Season>('Spring');
  const [supplies, setSupplies] = useState<Supplies>('standard');
  const [scenario, setScenario] = useState<Scenario>('frontier');

  if (!isOpen) return null;

  const selectedRegion = DEFAULT_REGIONS[selectedRegionId];
  const spawnPoints: SpawnPointData[] = selectedRegion.spawnPoints || GridMap.getPresetSpawnPoints(selectedRegionId);
  const activeSpawn = spawnPoints.find((point) => point.id === selectedSpawnPointId) || spawnPoints[0];
  const canContinue = identity.portraitId >= 0 && identity.rulerName.trim().length > 0 && identity.kingdomName.trim().length > 0;

  const selectRegion = (regionId: number) => {
    setSelectedRegionId(regionId);
    const points = DEFAULT_REGIONS[regionId]?.spawnPoints || GridMap.getPresetSpawnPoints(regionId);
    if (points.length) setSelectedSpawnPointId(points[0].id);
  };

  const selectSpawnPoint = (spawnPointId: string, regionId: number) => {
    setSelectedRegionId(regionId);
    setSelectedSpawnPointId(spawnPointId);
  };

  const chooseScenario = (choice: Scenario) => {
    setScenario(choice);
    if (choice === 'calm') { setBotCount(1); setSupplies('abundant'); setSeason('Spring'); }
    if (choice === 'frontier') { setBotCount(3); setSupplies('standard'); setSeason('Spring'); }
    if (choice === 'hardship') { setBotCount(4); setSupplies('scarce'); setSeason('Autumn'); }
  };

  const startGame = () => {
    if (!activeSpawn || !canContinue) return;
    onConfirm({
      playerRegionId: selectedRegionId,
      playerSpawnPoint: activeSpawn.position,
      selectedSpawnPointId: activeSpawn.id,
      botCount,
      startingSeason: season,
      startingSupplies: supplies,
      identity: { ...identity, rulerName: identity.rulerName.trim(), kingdomName: identity.kingdomName.trim() },
    });
  };

  const scenarios: Array<{ id: Scenario; name: string; caption: string }> = [
    { id: 'calm', name: isUkr ? 'Мирна долина' : 'Peaceful Valley', caption: isUkr ? 'Щедрі запаси · 1 суперник' : 'Abundant supplies · 1 rival' },
    { id: 'frontier', name: isUkr ? 'Нове володіння' : 'New Realm', caption: isUkr ? 'Збалансований початок' : 'Balanced beginning' },
    { id: 'hardship', name: isUkr ? 'Суворий кордон' : 'Harsh Frontier', caption: isUkr ? 'Мало запасів · 4 суперники' : 'Scarce supplies · 4 rivals' },
  ];

  return (
    <div className="realm-newgame-screen fixed inset-0 z-[70] flex flex-col pointer-events-auto select-none font-cinzel text-[#e4d6b7]" role="dialog" aria-modal="true" aria-label={isUkr ? 'Нова гра' : 'New Game'}>
      <header className="realm-newgame-header shrink-0 flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <CrownIcon size={26} className="text-[#c5a96d] shrink-0" />
          <h1 className="text-lg sm:text-xl font-bold tracking-[0.12em] uppercase truncate">{isUkr ? 'Заснування нового володіння' : 'Found a New Realm'}</h1>
        </div>
        <button onClick={onClose} className="realm-newgame-close w-9 h-9 flex items-center justify-center shrink-0" aria-label={isUkr ? 'Закрити' : 'Close'}><CrossCloseIcon size={17} /></button>
      </header>

      {step === 1 ? (
        <main className="realm-newgame-identity flex-1 min-h-0 grid lg:grid-cols-[minmax(0,1fr)_minmax(400px,1fr)] overflow-y-auto">
          <section className="realm-newgame-column p-6 lg:p-9 overflow-y-auto">
            <div className="max-w-[700px] mx-auto">
              <span className="realm-newgame-eyebrow">{isUkr ? 'ОБЛИЧЧЯ КОРОНИ' : 'FACE OF THE CROWN'}</span>
              <h2 className="text-2xl lg:text-3xl font-bold mt-2 mb-2">{isUkr ? 'Ваш правитель' : 'Your Ruler'}</h2>
              <p className="text-sm text-[#a99a80] mb-6">{isUkr ? 'Ім’я та портрет з’являться у грі поруч із вашим гербом.' : 'The name and portrait appear beside your coat of arms in game.'}</p>
              <label className="realm-newgame-label" htmlFor="realm-ruler-name">{isUkr ? 'Ім’я правителя' : 'Ruler name'}</label>
              <input id="realm-ruler-name" className="realm-newgame-input mb-6" maxLength={32} value={identity.rulerName} onChange={(event) => setIdentity({ ...identity, rulerName: event.target.value })} placeholder={isUkr ? 'Ім’я правителя' : 'Ruler name'} />
              <span className="realm-newgame-label block mb-3">{isUkr ? 'Портрет' : 'Portrait'}</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {Array.from({ length: RULER_PORTRAIT_COUNT }, (_, portraitId) => (
                  <button key={portraitId} type="button" onClick={() => setIdentity({ ...identity, portraitId })} className={`realm-newgame-portrait ${identity.portraitId === portraitId ? 'selected' : ''}`} aria-label={`${isUkr ? 'Портрет' : 'Portrait'} ${portraitId + 1}`} aria-pressed={identity.portraitId === portraitId}>
                    <RulerPortrait portraitId={portraitId} size={100} />
                    {identity.portraitId === portraitId && <span className="realm-newgame-selected"><Check size={13} /></span>}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="realm-newgame-column realm-newgame-arms p-6 lg:p-9 overflow-y-auto">
            <div className="max-w-[700px] mx-auto">
              <span className="realm-newgame-eyebrow">{isUkr ? 'СИМВОЛ ВОЛОДІННЯ' : 'SYMBOL OF THE REALM'}</span>
              <h2 className="text-2xl lg:text-3xl font-bold mt-2 mb-6">{isUkr ? 'Назва та герб' : 'Name and Arms'}</h2>
              <label className="realm-newgame-label" htmlFor="realm-kingdom-name">{isUkr ? 'Назва королівства' : 'Kingdom name'}</label>
              <input id="realm-kingdom-name" className="realm-newgame-input mb-6" maxLength={32} value={identity.kingdomName} onChange={(event) => setIdentity({ ...identity, kingdomName: event.target.value })} placeholder={isUkr ? 'Назва королівства' : 'Kingdom name'} />
              <div className="realm-newgame-shield-preview flex items-center gap-5 p-5 mb-6">
                <HeraldicShield color={identity.shieldColor} emblemId={identity.emblemId} size={92} />
                <div className="min-w-0"><span className="text-[10px] uppercase tracking-[.2em] text-[#ac9974]">{isUkr ? 'Ваш стяг' : 'Your banner'}</span><div className="text-xl font-bold mt-1 break-words">{identity.kingdomName || '—'}</div><div className="text-sm text-[#b8a98d] mt-1">{identity.rulerName || '—'}</div></div>
              </div>
              <span className="realm-newgame-label block mb-3">{isUkr ? 'Колір щита' : 'Shield color'}</span>
              <div className="flex flex-wrap gap-3 mb-7">
                {SHIELD_COLORS.map((color) => <button key={color} type="button" className={`realm-newgame-color ${identity.shieldColor === color ? 'selected' : ''}`} style={{ backgroundColor: color }} onClick={() => setIdentity({ ...identity, shieldColor: color })} aria-label={`${isUkr ? 'Колір' : 'Color'} ${color}`} aria-pressed={identity.shieldColor === color} />)}
              </div>
              <span className="realm-newgame-label block mb-3">{isUkr ? 'Емблема' : 'Emblem'}</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {HERALDRY_EMBLEMS.map((emblem) => <button key={emblem.id} type="button" className={`realm-newgame-emblem ${identity.emblemId === emblem.id ? 'selected' : ''}`} onClick={() => setIdentity({ ...identity, emblemId: emblem.id })} title={isUkr ? emblem.nameUk : emblem.nameEn} aria-pressed={identity.emblemId === emblem.id}><HeraldicShield color={identity.shieldColor} emblemId={emblem.id} size={43} /></button>)}
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="realm-newgame-world flex-1 min-h-0 flex flex-col lg:flex-row">
          <aside className="realm-newgame-options lg:w-[530px] xl:w-[560px] shrink-0 overflow-y-auto p-5 lg:p-7 lg:mr-5">
            <span className="realm-newgame-eyebrow">{isUkr ? 'УМОВИ КАМПАНІЇ' : 'CAMPAIGN CONDITIONS'}</span>
            <h2 className="text-xl font-bold mt-1 mb-5">{isUkr ? 'Заснування поселення' : 'Found a Settlement'}</h2>
            <div className="realm-newgame-section">
              <h3>{isUkr ? 'Сценарій' : 'Scenario'}</h3>
              <div className="grid grid-cols-3 gap-2">
                {scenarios.map((choice) => <button key={choice.id} type="button" className={`realm-newgame-scenario ${scenario === choice.id ? 'selected' : ''}`} onClick={() => chooseScenario(choice.id)} aria-pressed={scenario === choice.id}><span>{choice.name}</span><small>{choice.caption}</small></button>)}
              </div>
            </div>
            <div className="realm-newgame-section">
              <h3>{isUkr ? 'Регіон' : 'Region'}</h3>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_REGIONS.map((region) => <button key={region.id} type="button" className={`realm-newgame-region ${region.id === selectedRegionId ? 'selected' : ''}`} onClick={() => selectRegion(region.id)} aria-pressed={region.id === selectedRegionId}><span className="text-lg" style={{ color: region.heraldryColor }}>{region.heraldryIcon}</span><span className="truncate">{isUkr ? region.ukrName : region.name}</span></button>)}
              </div>
            </div>
            <div className="realm-newgame-section">
              <h3>{isUkr ? 'Місце табору' : 'Camp location'} <span className="font-mono text-[10px] text-[#a08f6f] ml-auto">{activeSpawn ? `[${activeSpawn.position.join(', ')}]` : ''}</span></h3>
              <div className="space-y-2">
                {spawnPoints.map((point, index) => <button key={point.id} type="button" className={`realm-newgame-spawn ${point.id === activeSpawn?.id ? 'selected' : ''}`} onClick={() => setSelectedSpawnPointId(point.id)} aria-pressed={point.id === activeSpawn?.id}><span className="realm-newgame-spawn-number">{index + 1}</span><span className="min-w-0"><strong>{point.name}</strong><small>{point.description}</small></span>{point.id === activeSpawn?.id && <MapPinned size={16} className="ml-auto shrink-0 text-[#d1b373]" />}</button>)}
              </div>
            </div>
            <div className="realm-newgame-section">
              <h3>{isUkr ? 'Суперники на карті' : 'Rival lords'}</h3>
              <div className="grid grid-cols-5 gap-2">{[0, 1, 2, 3, 4].map((count) => <button key={count} type="button" className={`realm-newgame-count ${botCount === count ? 'selected' : ''}`} onClick={() => setBotCount(count)} aria-pressed={botCount === count}>{count}</button>)}</div>
              {botCount > 0 && <p className="text-[11px] text-[#a4967b] mt-2">{PRESET_BOT_LORDS.slice(0, botCount).map((lord) => lord.name).join(' · ')}</p>}
            </div>
            <div className="realm-newgame-section grid grid-cols-2 gap-3">
              <label className="text-[11px] text-[#cbb98e]">{isUkr ? 'Початкова пора року' : 'Starting season'}<select className="realm-newgame-select" value={season} onChange={(event) => setSeason(event.target.value as Season)}><option value="Spring">{isUkr ? 'Весна' : 'Spring'}</option><option value="Summer">{isUkr ? 'Літо' : 'Summer'}</option><option value="Autumn">{isUkr ? 'Осінь' : 'Autumn'}</option><option value="Winter">{isUkr ? 'Зима' : 'Winter'}</option></select></label>
              <label className="text-[11px] text-[#cbb98e]">{isUkr ? 'Початкові запаси' : 'Starting supplies'}<select className="realm-newgame-select" value={supplies} onChange={(event) => setSupplies(event.target.value as Supplies)}><option value="scarce">{isUkr ? 'Малі' : 'Scarce'}</option><option value="standard">{isUkr ? 'Звичайні' : 'Standard'}</option><option value="abundant">{isUkr ? 'Щедрі' : 'Abundant'}</option></select></label>
            </div>
          </aside>
          <section className="realm-newgame-map flex-1 min-w-0 min-h-[320px] relative p-4 lg:pl-2 lg:pr-7 lg:py-7">
            <StrategicMapCanvas grid={grid} mode="setup" selectedRegionId={selectedRegionId} onSelectRegion={selectRegion} selectedSpawnPointId={activeSpawn?.id} selectedHeraldry={identity} onSelectSpawnPoint={selectSpawnPoint} width={1200} height={760} />
          </section>
        </main>
      )}

      <footer className="realm-newgame-footer shrink-0 flex items-center justify-between gap-3 px-6 py-3">
        <button type="button" className="realm-newgame-secondary flex items-center gap-2" onClick={step === 1 ? onClose : () => setStep(1)}>{step === 2 && <ArrowLeft size={15} />}{step === 1 ? (isUkr ? 'Назад до меню' : 'Back to menu') : (isUkr ? 'Назад до герба' : 'Back to arms')}</button>
        <div className="hidden md:flex items-center gap-2 text-[11px] text-[#a89878] truncate"><HeraldicShield color={identity.shieldColor} emblemId={identity.emblemId} size={25} /><span className="truncate">{identity.kingdomName} · {identity.rulerName}</span></div>
        <button type="button" className="realm-newgame-primary flex items-center gap-2" disabled={!canContinue} onClick={step === 1 ? () => setStep(2) : startGame}>{step === 1 ? (isUkr ? 'До вибору земель' : 'Choose lands') : (isUkr ? 'Заснувати володіння' : 'Found the realm')}<ArrowRight size={15} /></button>
      </footer>
    </div>
  );
}
