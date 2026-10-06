import type { GameEntity } from '../../../engine/ecs/world';
import { world, characterEntities } from '../../../engine/ecs/world';
import { BUILDING_BLUEPRINTS } from '../../../engine/buildings/blueprints';
import {
  CrownIcon,
  PeasantsIcon,
  GoldIcon,
  WoodIcon,
  StoneIcon,
  WheatIcon,
  FlourIcon,
  BreadIcon,
  AleIcon,
  ScalesIcon,
} from '../MedievalIcons';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { MIN_BUILDING_WAGE, MAX_BUILDING_WAGE } from '../../../constants/economy';
import { audioManager } from '../../../engine/audio/AudioManager';

interface BuildingInspectorSectionProps {
  entity: GameEntity;
  isForeign: boolean;
  ownerRegionName?: string;
  ownerLordName?: string;
  freePeasantsCount: number;
  lords: GameEntity[];
}

export function BuildingInspectorSection({
  entity,
  isForeign,
  ownerRegionName,
  ownerLordName,
  freePeasantsCount,
  lords,
}: BuildingInspectorSectionProps) {
  const { dict, language } = useTranslation();
  const resources = useGameStore((s) => s.resources);
  const addResource = useGameStore((s) => s.addResource);
  const consumeResource = useGameStore((s) => s.consumeResource);
  const assignWorkerToBuilding = useGameStore((s) => s.assignWorkerToBuilding);
  const removeWorkerFromBuilding = useGameStore((s) => s.removeWorkerFromBuilding);
  const assignLordToBuilding = useGameStore((s) => s.assignLordToBuilding);
  const setBuildingWage = useGameStore((s) => s.setBuildingWage);
  const pendingJobs = useGameStore((s) => s.pendingJobs);
  const addPendingJob = useGameStore((s) => s.addPendingJob);
  const removePendingJob = useGameStore((s) => s.removePendingJob);
  const addChronicleEvent = useGameStore((s) => s.addChronicleEvent);
  const incrementBuildingVersion = useGameStore((s) => s.incrementBuildingVersion);
  const tradeRules = useGameStore((s) => s.tradeRules);
  const caravanStatus = useGameStore((s) => s.caravanStatus);
  const setActiveMenuTab = useGameStore((s) => s.setActiveMenuTab);

  const bType = entity.buildingType;
  if (!bType) return null;

  const blueprint = BUILDING_BLUEPRINTS[bType];
  const defaultWage = blueprint?.defaultWage ?? 2;
  const currentWage = entity.wage ?? defaultWage;
  const maxSlots = entity.workerSlots ?? blueprint?.workSlots ?? 1;
  const assignedWorkers = entity.assignedWorkers || [];
  const isHousing = blueprint?.category === 'housing';
  const isProduction = blueprint?.category === 'production' || blueprint?.category === 'agriculture' || blueprint?.category === 'military' || blueprint?.category === 'gathering' || blueprint?.category === 'community' || (blueprint?.workSlots ?? 0) > 0 || bType === 'market' || bType === 'stockpile';

  const isDemolishPending = pendingJobs.some((j) => j.targetBuildingId === entity.id && j.type === 'demolish_structure') || Boolean(entity.isDemolishing);
  const refundWood = (blueprint?.cost?.wood || 0) + (entity.localInventory?.wood || 0);
  const refundStone = blueprint?.cost?.stone || 0;
  const refundGold = blueprint?.cost?.gold || 0;

  const handleToggleDemolish = () => {
    if (isDemolishPending) {
      for (const pj of pendingJobs) {
        if (pj.targetBuildingId === entity.id && pj.type === 'demolish_structure') {
          removePendingJob(pj.id);
        }
      }
      for (const c of characterEntities) {
        if (c.currentJob?.targetBuildingId === entity.id && c.currentJob?.type === 'demolish_structure') {
          c.currentJob = { id: `idle-${c.id}`, type: 'idle', progress: 0, totalWork: 0 };
        }
      }
      entity.isDemolishing = false;
      entity.demolitionProgress = 0;
      incrementBuildingVersion();
    } else {
      for (const pj of pendingJobs) {
        if (pj.targetBuildingId === entity.id && pj.type === 'build_structure') {
          removePendingJob(pj.id);
        }
      }
      addPendingJob({
        id: `job-demolish-${entity.id}`,
        type: 'demolish_structure',
        targetPosition: entity.gridPosition || [0, 0],
        targetBuildingId: entity.id,
        progress: 0,
        totalWork: 30 + (blueprint ? blueprint.width * blueprint.height * 10 : 30),
      });
      entity.isDemolishing = true;
      entity.demolitionProgress = 0;
      incrementBuildingVersion();

      addChronicleEvent({
        title: language === 'uk' ? 'Наказ: Знесення споруди' : 'Order: Demolish Structure',
        description: language === 'uk'
          ? `Призначено демонтаж ${entity.name || 'споруди'}. Вільні селяни вирушають розібрати будівлю.`
          : `Assigned demolition of ${entity.name || 'structure'}. Idle workers are dispatched to dismantle it.`,
        type: 'info',
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40 flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{dict.inspector.status}:</span>
          <span className="font-bold text-emerald-400">
            {entity.isDemolishing
              ? dict.inspector.demolishingStatus
              : entity.isCompleted
              ? dict.buildings.statusCompleted
              : dict.buildings.statusUnderConstruction}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{dict.buildings.hp}:</span>
          <span className="font-mono text-slate-200">
            {entity.buildingHealth} / {entity.maxBuildingHealth}
          </span>
        </div>
      </div>

      {blueprint && (
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          {dict.buildings.items[bType]?.description || blueprint.description}
        </p>
      )}

      {isForeign && (
        <div className="bg-amber-950/40 border border-amber-600/60 p-3 rounded-xl flex flex-col gap-1.5 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <div className="font-bold text-amber-200 uppercase tracking-wider text-[11px]">
                {dict.inspector.foreignTerritory}
              </div>
              <div className="text-[11px] text-slate-300">
                {dict.inspector.foreignOwner}: <span className="font-semibold text-amber-300">{ownerLordName || (language === 'uk' ? 'Сусідній правитель' : 'Neighboring Lord')}</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 bg-black/40 p-2 rounded-lg border border-amber-900/40 leading-snug">
            {language === 'uk'
              ? `Ця споруда розташована в регіоні ${ownerRegionName || 'Сусідні землі'}. Ви не маєте юрисдикції наймати тут робітників або змінювати платню.`
              : `This structure is located in ${ownerRegionName || 'neighboring fief'}. You have no jurisdiction to appoint workers or adjust wages here.`}
          </div>
        </div>
      )}

      {entity.isCompleted && (blueprint?.maxStorage || entity.buildingType === 'lumberjack_hut' || entity.buildingType === 'stockpile') && (() => {
        const maxStorage = blueprint?.maxStorage || (entity.buildingType === 'lumberjack_hut' ? 20 : 100);
        const inv = entity.localInventory || {};
        const entries = Object.entries(inv).filter(([_, amt]) => (amt || 0) > 0);
        const totalStored = entries.reduce((acc, [_, amt]) => acc + (amt || 0), 0);
        const isFull = totalStored >= maxStorage;
        const pct = Math.min(100, Math.round((totalStored / maxStorage) * 100));

        return (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📦</span>
                {dict.buildings.storage} ({dict.buildings.capacity})
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                  isFull
                    ? 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
                    : totalStored > 0
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                    : 'bg-slate-900 text-slate-400 border-slate-750'
                }`}
              >
                {isFull ? dict.buildings.storageFull : `${totalStored} / ${maxStorage}`}
              </span>
            </div>

            {entries.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {entries.map(([res, amt]) => (
                  <div key={res} className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="text-slate-300 capitalize">{res}:</span>
                    <span className="font-mono font-bold text-amber-300">{amt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{language === 'uk' ? 'Наявний запас:' : 'Current Stock:'}</span>
                <span className="font-mono font-bold text-slate-500">0 / {maxStorage}</span>
              </div>
            )}

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isFull ? 'bg-rose-500' : totalStored > maxStorage * 0.7 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {entity.buildingType === 'stockpile' ? (
              <span className="text-[10px] text-slate-400 leading-tight">
                {language === 'uk'
                  ? `Призначені носії (до 4) обходять лісопилки, мисливців та копальні, забираючи ресурси та звозячи їх на склад.`
                  : `Assigned haulers (up to 4) visit production buildings across the settlement, gathering resources and keeping production flowing.`}
              </span>
            ) : isFull ? (
              <div className="text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/50 flex flex-col gap-0.5">
                <span className="font-bold">{dict.buildings.storageFull} ({maxStorage}/{maxStorage})</span>
                <span className="text-slate-300">
                  {language === 'uk'
                    ? 'Сховище заповнене. Призначте робітників на Склад ресурсів, щоб носії автоматично забрали накопичені запаси.'
                    : 'Storage is full. Assign haulers to the Stockpile to automatically collect accumulated goods.'}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 leading-tight">
                {language === 'uk'
                  ? `Робітники наповнюють внутрішнє сховище (до ${maxStorage} од.). Носії зі складу періодично забирають ресурси.`
                  : `Workers fill internal storage (up to ${maxStorage} units). Stockpile haulers periodically collect accumulated goods.`}
              </span>
            )}
          </div>
        );
      })()}

      {entity.isCompleted && !isForeign && isHousing && (() => {
        const beds = blueprint?.bedsCount ?? (bType === 'peasant_house' ? 2 : bType === 'tent' ? 1 : 0);
        const sleepers = Array.from(characterEntities).filter(
          (c) => c.currentJob?.targetBuildingId === entity.id && c.currentJob?.type === 'sleep'
        );

        return (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛏️</span>
                {language === 'uk' ? 'Житловий простір' : 'Living Quarters'}
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {sleepers.length} / {beds} {language === 'uk' ? 'ліжок' : 'beds'}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span>{language === 'uk' ? 'Місткість житла:' : 'Shelter capacity:'}</span>
                <span className="font-semibold text-slate-200">{beds} {language === 'uk' ? 'поселенці' : 'settlers'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{language === 'uk' ? 'Затишок і тепло:' : 'Comfort & warmth:'}</span>
                <span className="font-semibold text-emerald-400">{bType === 'peasant_house' ? '+100% (Піч та ліжка)' : '+50% (Намет)'}</span>
              </div>
            </div>

            {sleepers.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'uk' ? 'Зараз відпочивають:' : 'Currently resting:'}
                </span>
                {sleepers.map((sleeper) => (
                  <div key={sleeper.id} className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-xs">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: sleeper.avatarColor || '#10b981' }}
                    >
                      <PeasantsIcon className="w-3 h-3 text-emerald-100" />
                    </div>
                    <span className="text-slate-200 font-medium truncate">{sleeper.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {entity.isCompleted && !isForeign && bType === 'market' && (() => {
        const tradeItems: Array<{
          res: 'wood' | 'stone' | 'wheat' | 'flour' | 'bread' | 'ale';
          nameUk: string;
          nameEn: string;
          buyPrice: number;
          sellPrice: number;
          icon: React.ReactNode;
        }> = [
          { res: 'wood', nameUk: 'Деревина', nameEn: 'Wood', buyPrice: 3, sellPrice: 1, icon: <WoodIcon className="w-4 h-4 text-amber-500" /> },
          { res: 'stone', nameUk: 'Камінь', nameEn: 'Stone', buyPrice: 4, sellPrice: 2, icon: <StoneIcon className="w-4 h-4 text-slate-300" /> },
          { res: 'wheat', nameUk: 'Зерно', nameEn: 'Wheat', buyPrice: 2, sellPrice: 1, icon: <WheatIcon className="w-4 h-4 text-yellow-400" /> },
          { res: 'flour', nameUk: 'Борошно', nameEn: 'Flour', buyPrice: 3, sellPrice: 2, icon: <FlourIcon className="w-4 h-4 text-slate-100" /> },
          { res: 'bread', nameUk: 'Хліб', nameEn: 'Bread', buyPrice: 4, sellPrice: 2, icon: <BreadIcon className="w-4 h-4 text-amber-400" /> },
          { res: 'ale', nameUk: 'Ель', nameEn: 'Ale', buyPrice: 5, sellPrice: 3, icon: <AleIcon className="w-4 h-4 text-amber-300" /> },
        ];

        const handleBuy = (item: typeof tradeItems[0], qty: number) => {
          const totalCost = item.buyPrice * qty;
          if ((resources.gold || 0) < totalCost) {
            audioManager.playUIError?.();
            return;
          }
          consumeResource('gold', totalCost);
          addResource(item.res, qty);
          audioManager.playUIClick();
          addChronicleEvent({
            title: language === 'uk' ? 'Ринок: Купівля товарів' : 'Market: Goods Purchased',
            description: language === 'uk'
              ? `Куплено ${qty} од. ${item.nameUk} за ${totalCost} золота.`
              : `Purchased ${qty} ${item.nameEn} for ${totalCost} gold.`,
            type: 'info',
          });
        };

        const handleSell = (item: typeof tradeItems[0], qty: number) => {
          const available = resources[item.res] || 0;
          if (available < qty) {
            audioManager.playUIError?.();
            return;
          }
          const totalEarn = item.sellPrice * qty;
          consumeResource(item.res, qty);
          addResource('gold', totalEarn);
          audioManager.playUIClick();
          addChronicleEvent({
            title: language === 'uk' ? 'Ринок: Продаж товарів' : 'Market: Goods Sold',
            description: language === 'uk'
              ? `Продано ${qty} од. ${item.nameUk} за ${totalEarn} золота.`
              : `Sold ${qty} ${item.nameEn} for ${totalEarn} gold.`,
            type: 'info',
          });
        };

        return (
          <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-700/60 flex flex-col gap-2.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
              <span className="text-[12px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <ScalesIcon className="w-4 h-4 text-emerald-400" />
                {language === 'uk' ? 'Торгові лави ринку' : 'Market Trading Stalls'}
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
                <GoldIcon className="w-3.5 h-3.5 text-yellow-400" />
                {resources.gold || 0}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {tradeItems.map((item) => {
                const stock = resources[item.res] || 0;
                const canBuy1 = (resources.gold || 0) >= item.buyPrice;
                const canBuy5 = (resources.gold || 0) >= item.buyPrice * 5;
                const canSell1 = stock >= 1;
                const canSell5 = stock >= 5;

                return (
                  <div
                    key={item.res}
                    className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-800/90 flex items-center justify-center border border-slate-700">
                          {item.icon}
                        </div>
                        <span className="font-semibold text-slate-200">
                          {language === 'uk' ? item.nameUk : item.nameEn}
                        </span>
                      </div>
                      <span className="font-mono text-slate-300">
                        {language === 'uk' ? 'Склад:' : 'Stock:'}{' '}
                        <span className="font-bold text-amber-300">{stock}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleBuy(item, 1)}
                          disabled={!canBuy1}
                          className={`flex-1 py-1 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition border cursor-pointer ${
                            canBuy1
                              ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60 active:scale-95'
                              : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          +{1} ({item.buyPrice}g)
                        </button>
                        <button
                          onClick={() => handleBuy(item, 5)}
                          disabled={!canBuy5}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition border cursor-pointer ${
                            canBuy5
                              ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60 active:scale-95'
                              : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          +5
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSell(item, 1)}
                          disabled={!canSell1}
                          className={`flex-1 py-1 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition border cursor-pointer ${
                            canSell1
                              ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-700/60 active:scale-95'
                              : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          -{1} (+{item.sellPrice}g)
                        </button>
                        <button
                          onClick={() => handleSell(item, 5)}
                          disabled={!canSell5}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition border cursor-pointer ${
                            canSell5
                              ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-700/60 active:scale-95'
                              : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          -5
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {entity.isCompleted && !isForeign && bType === 'trading_post' && (() => {
        const activeRules = Object.values(tradeRules).filter((r) => r.mode !== 'none');
        return (
          <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-600/60 flex flex-col gap-2.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-2">
              <span className="text-[12px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <ScalesIcon className="w-4 h-4 text-amber-400" />
                {dict.tradePost.title}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-950/80 border border-amber-700/60 text-amber-200">
                {caravanStatus.state === 'trading'
                  ? (language === 'uk' ? '🪙 Угода' : '🪙 Deal')
                  : caravanStatus.state === 'approaching'
                  ? (language === 'uk' ? '🐴 В дорозі' : '🐴 En route')
                  : (language === 'uk' ? '📜 Очікування' : '📜 Awaiting')}
              </span>
            </div>

            <div className="text-[11px] text-slate-300 bg-black/40 p-2 rounded-lg border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'uk' ? 'Купець:' : 'Merchant:'}</span>
                <span className="font-semibold text-amber-200">{caravanStatus.merchantName || 'Альбрехт'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'uk' ? 'Графік прибуття:' : 'Schedule:'}</span>
                <span className="font-mono text-emerald-400 font-bold">{caravanStatus.nextArrivalHour ?? 12}:{String(caravanStatus.nextArrivalMinute ?? 0).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'uk' ? 'Активних угод:' : 'Active rules:'}</span>
                <span className="font-mono text-amber-300 font-bold">{activeRules.length}</span>
              </div>
            </div>

            <button
              onClick={() => {
                audioManager.playUIPanelOpen();
                setActiveMenuTab('trade');
              }}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
            >
              <ScalesIcon className="w-4 h-4" />
              <span>{dict.tradePost.openTradePost}</span>
            </button>
          </div>
        );
      })()}

      {entity.isCompleted && !isForeign && bType === 'hitching_post' && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🫏</span>
              {language === 'uk' ? 'Робочі мули' : 'Pack Mules'}
            </span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {entity.mulesCount ?? 1} / {entity.maxMules ?? 3}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: entity.maxMules ?? 3 }).map((_, idx) => {
              const curMules = entity.mulesCount ?? 1;
              const isPresent = idx < curMules;
              const mulesInUse = Array.from(characterEntities).filter((c) => c.hasMule && c.assignedMuleHutId === entity.id).length;
              const isWorking = idx < mulesInUse;
              return (
                <div
                  key={`mule-slot-${idx}`}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center gap-1 ${
                    isPresent
                      ? isWorking
                        ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                        : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="text-base">{isPresent ? '🫏' : '⭕'}</span>
                  <span className="text-[9px] font-semibold">
                    {isPresent
                      ? isWorking
                        ? (language === 'uk' ? 'У рейсі' : 'Hauling')
                        : (language === 'uk' ? 'Вільний' : 'Available')
                      : (language === 'uk' ? 'Порожньо' : 'Empty')}
                  </span>
                </div>
              );
            })}
          </div>

          {(entity.mulesCount ?? 1) < (entity.maxMules ?? 3) && (
            <button
              onClick={() => {
                const curMules = entity.mulesCount ?? 1;
                const maxM = entity.maxMules ?? 3;
                if (curMules >= maxM) return;
                if (resources.gold < 50) {
                  audioManager.playUIError();
                  addChronicleEvent({
                    title: 'Бракує золота!',
                    description: 'Для купівлі нового мула потрібно 50 золота.',
                    type: 'warning',
                  });
                  return;
                }
                consumeResource('gold', 50);
                entity.mulesCount = curMules + 1;
                incrementBuildingVersion();
                audioManager.playUIClick();
                addChronicleEvent({
                  title: 'Куплено мула!',
                  description: `До прив'язі додано нового робочого мула (${entity.mulesCount}/3).`,
                  type: 'success',
                });
              }}
              disabled={resources.gold < 50}
              className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                resources.gold >= 50
                  ? 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border-amber-700/60 shadow-md active:scale-98'
                  : 'bg-slate-800/40 text-slate-500 border-slate-750 cursor-not-allowed'
              }`}
            >
              <span>🫏</span>
              {language === 'uk' ? 'Купити мула (50' : 'Buy Mule (50'}
              <GoldIcon className="w-3.5 h-3.5 text-amber-400" />
              {')'}
            </button>
          )}
        </div>
      )}

      {entity.isCompleted && !isForeign && isProduction && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <PeasantsIcon className="w-3.5 h-3.5 text-amber-400" />
              {dict.buildings.workers}
            </span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {assignedWorkers.length} / {maxSlots}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {assignedWorkers.map((workerId) => {
              const worker = world.entities.find((e) => e.id === workerId);
              if (!worker) return null;

              return (
                <div
                  key={workerId}
                  className="flex items-center justify-between bg-slate-900/90 px-2 py-1.5 rounded-lg border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: worker.avatarColor || '#10b981' }}
                    >
                      <PeasantsIcon className="w-3.5 h-3.5 text-emerald-100" />
                    </div>
                    <span className="font-semibold text-slate-200 truncate">
                      {worker.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeWorkerFromBuilding(entity.id, workerId)}
                    className="px-2 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px] rounded border border-rose-800/60 transition cursor-pointer"
                  >
                    {dict.inspector.removeWorker}
                  </button>
                </div>
              );
            })}

            {assignedWorkers.length < maxSlots && (
              <button
                onClick={() => assignWorkerToBuilding(entity.id)}
                disabled={freePeasantsCount === 0}
                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                  freePeasantsCount > 0
                    ? 'bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border-amber-700/60 shadow-md active:scale-98'
                    : 'bg-slate-800/40 text-slate-500 border-slate-750 cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                {dict.inspector.assignWorker} ({freePeasantsCount} {language === 'uk' ? 'вільних' : 'idle'})
              </button>
            )}
          </div>
        </div>
      )}

      {entity.isCompleted && !isForeign && isProduction && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <CrownIcon className="w-3.5 h-3.5 text-amber-400" />
            {dict.buildings.assignedLord}
          </span>

          <select
            value={entity.assignedLordId || ''}
            onChange={(e) => {
              const val = e.target.value;
              assignLordToBuilding(entity.id, val ? val : null);
            }}
            className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="">{dict.buildings.noLordAssigned}</option>
            {lords.map((lord) => (
              <option key={lord.id} value={lord.id}>
                {lord.name} (+{Math.min(100, 50 + (lord.skills?.intellect || 5) * 5)}% {language === 'uk' ? 'виробництво' : 'production'})
              </option>
            ))}
          </select>

          {entity.assignedLordId && (
            <div className="text-[10px] text-emerald-400 bg-emerald-950/30 p-1.5 rounded border border-emerald-900/40">
              {language === 'uk' ? 'Лорд наглядає за виробництвом: швидкість збільшено!' : 'Lord is supervising production: output boosted!'}
            </div>
          )}
        </div>
      )}

      {entity.isCompleted && !isForeign && isProduction && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <GoldIcon className="w-3.5 h-3.5 text-amber-400" />
              {dict.buildings.wagePerDay}
            </span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {currentWage} {dict.common.gold.toLowerCase()} / {dict.common.day.toLowerCase()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setBuildingWage(entity.id, Math.max(MIN_BUILDING_WAGE, currentWage - 1));
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 bg-slate-900 rounded-lg font-mono font-bold text-amber-300 text-xs border border-slate-800">
                {currentWage} {dict.common.gold.toLowerCase()}
              </span>
              <button
                onClick={() => {
                  setBuildingWage(entity.id, Math.min(MAX_BUILDING_WAGE, currentWage + 1));
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400">
              {language === 'uk' ? 'Мотивація робітників' : 'Worker incentive'}
            </span>
          </div>
        </div>
      )}

      {!isForeign && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          {isDemolishPending ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="animate-pulse">💣</span>
                  {dict.inspector.demolishingStatus}
                </span>
                {Boolean(entity.demolitionProgress) && (
                  <span className="font-mono text-xs font-bold text-rose-300">
                    {Math.round(entity.demolitionProgress || 0)}%
                  </span>
                )}
              </div>
              <button
                onClick={handleToggleDemolish}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-750 transition cursor-pointer active:scale-98"
              >
                {dict.inspector.cancelDemolish}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleToggleDemolish}
                className="w-full py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold rounded-lg border border-rose-800/60 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-98"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {dict.inspector.demolishBuilding}
              </button>
              {(refundWood > 0 || refundStone > 0 || refundGold > 0) && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>{dict.inspector.refundNotice}</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-amber-300">
                    {refundWood > 0 && (
                      <span className="flex items-center gap-1">
                        <WoodIcon className="w-3 h-3 text-amber-500" />
                        +{refundWood}
                      </span>
                    )}
                    {refundStone > 0 && (
                      <span className="flex items-center gap-1">
                        <StoneIcon className="w-3 h-3 text-slate-400" />
                        +{refundStone}
                      </span>
                    )}
                    {refundGold > 0 && (
                      <span className="flex items-center gap-1">
                        <GoldIcon className="w-3 h-3 text-yellow-400" />
                        +{refundGold}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
