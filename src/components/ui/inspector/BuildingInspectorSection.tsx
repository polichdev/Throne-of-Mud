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
  ShieldIcon,
  StorageIcon,
  HouseTierIcon,
  GoatIcon,
  CrestBadgeIcon,
  MedievalCheckIcon,
  MedievalAlertIcon,
} from '../MedievalIcons';
import { IlluminatedIcon } from '../IlluminatedIcons';
import { toggleBuildingDemolition } from './buildingInspectorActions';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { MIN_BUILDING_WAGE, MAX_BUILDING_WAGE } from '../../../constants/economy';
import { HOUSE_TIERS_CONFIG, FOOD_RESOURCE_KEYS } from '../../../constants/housing';
import type { HouseTier, ResourceInventory } from '../../../types/game';
import { audioManager } from '../../../engine/audio/AudioManager';
import type { BuildingInspectorTab } from './BuildingInspectorWindow';

interface BuildingInspectorSectionProps {
  tab: BuildingInspectorTab;
  entity: GameEntity;
  isForeign: boolean;
  ownerRegionName?: string;
  ownerLordName?: string;
  freePeasantsCount: number;
  lords: GameEntity[];
}

export function BuildingInspectorSection({
  tab,
  entity,
  isForeign,
  ownerRegionName,
  ownerLordName,
  freePeasantsCount,
  lords,
}: BuildingInspectorSectionProps) {
  const { dict, language } = useTranslation();
  const resources = useGameStore((s) => s.resources);
  const houseFloorView = useGameStore((s) => s.houseFloorView);
  const setHouseFloorView = useGameStore((s) => s.setHouseFloorView);
  const addResource = useGameStore((s) => s.addResource);
  const consumeResource = useGameStore((s) => s.consumeResource);
  const assignWorkerToBuilding = useGameStore((s) => s.assignWorkerToBuilding);
  const removeWorkerFromBuilding = useGameStore((s) => s.removeWorkerFromBuilding);
  const assignLordToBuilding = useGameStore((s) => s.assignLordToBuilding);
  const setBuildingWage = useGameStore((s) => s.setBuildingWage);
  const pendingJobs = useGameStore((s) => s.pendingJobs);
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


  return (
    <div className="building-inspector-content flex flex-col gap-3">
      {(tab === 'residential' || tab === 'operations') && <div className="building-inspector-condition">
        <div><span>{dict.inspector.status}</span><strong>{entity.isDemolishing ? dict.inspector.demolishingStatus : entity.pendingHouseTier || entity.pendingBackyardExtension ? (language === 'uk' ? 'Покращення' : 'Upgrading') : entity.isCompleted ? dict.buildings.statusCompleted : dict.buildings.statusUnderConstruction}</strong></div>
        <div><span>{dict.buildings.hp}</span><strong>{entity.buildingHealth} / {entity.maxBuildingHealth}</strong></div>
        {(entity.pendingHouseTier || entity.pendingBackyardExtension) && <div><span>{language === 'uk' ? 'Робота' : 'Work'}</span><strong>{Math.round(entity.constructionProgress || 0)}%</strong></div>}
      </div>}

      {blueprint && tab === 'general' && (
        <p className="building-inspector-description">
          {dict.buildings.items[bType]?.description || blueprint.description}
        </p>
      )}

      {tab === 'residential' && bType === 'peasant_house' && (entity.houseTier || 1) >= 2 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-800/60 bg-slate-950/70 p-2">
          <span className="text-xs text-amber-200 mr-auto">{language === 'uk' ? 'Огляд поверху' : 'View floor'}</span>
          {([1, 2] as const).map((floor) => (
            <button
              key={floor}
              type="button"
              onClick={() => setHouseFloorView(floor)}
              className={`rounded px-2.5 py-1 text-xs font-semibold border ${houseFloorView === floor ? 'bg-amber-800 border-amber-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
            >
              {language === 'uk' ? `${floor} поверх` : `Floor ${floor}`}
            </button>
          ))}
        </div>
      )}

      {isForeign && (tab === 'residential' || tab === 'operations') && (
        <div className="bg-amber-950/40 border border-amber-600/60 p-3 rounded-xl flex flex-col gap-1.5 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-4 h-4 text-amber-400" />
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

      {tab === 'residential' && entity.isCompleted && !isForeign && (bType === 'peasant_house' || bType === 'manor') && (() => {
        const tier = (entity.houseTier || 1) as HouseTier;
        const tierConfig = HOUSE_TIERS_CONFIG[tier];
        const nextTier = tier < 3 ? ((tier + 1) as HouseTier) : null;
        const nextTierConfig = nextTier ? HOUSE_TIERS_CONFIG[nextTier] : null;

        const availableFoodsCount = FOOD_RESOURCE_KEYS.filter((k) => (resources[k] || 0) > 0).length;
        const hasEnoughFood = nextTierConfig ? availableFoodsCount >= nextTierConfig.upgradeMinFoodTypes : true;

        let hasRequiredGoods = true;
        if (nextTierConfig) {
          for (const req of nextTierConfig.upgradeRequiredGoods) {
            if ((resources[req] || 0) <= 0) {
              hasRequiredGoods = false;
              break;
            }
          }
        }


        return (
          <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-800/60 flex flex-col gap-3 shadow-lg">

            {nextTierConfig ? (
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-amber-900/40 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">
                    {language === 'uk' ? `Вимоги для рівня ${nextTier}` : `Requirements for tier ${nextTier}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    +{nextTierConfig.capacity - tierConfig.capacity} {language === 'uk' ? 'місць' : 'beds'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-[11px] text-slate-300 bg-slate-950/50 p-2 rounded border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {hasEnoughFood ? <MedievalCheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <MedievalAlertIcon className="w-3.5 h-3.5 text-rose-400" />}
                      {language === 'uk' ? 'Різноманіття їжі:' : 'Food Diversity:'}
                    </span>
                    <span className={hasEnoughFood ? 'text-emerald-300 font-mono' : 'text-rose-400 font-mono'}>
                      {availableFoodsCount} / {nextTierConfig.upgradeMinFoodTypes} {language === 'uk' ? 'видів' : 'types'}
                    </span>
                  </div>
                  <div className="building-inspector-foods">
                    {FOOD_RESOURCE_KEYS.map(key => <span key={key} className={(resources[key] || 0) > 0 ? 'available' : ''}>
                      <i />{({ bread: language === 'uk' ? 'Хліб' : 'Bread', vegetables: language === 'uk' ? 'Овочі' : 'Vegetables', eggs: language === 'uk' ? 'Яйця' : 'Eggs', meat: language === 'uk' ? 'М’ясо' : 'Meat', fish: language === 'uk' ? 'Риба' : 'Fish', berries: language === 'uk' ? 'Ягоди' : 'Berries' } as Record<string, string>)[key]}
                    </span>)}
                  </div>

                  {nextTierConfig.upgradeRequiredGoods.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        {hasRequiredGoods ? <MedievalCheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <MedievalAlertIcon className="w-3.5 h-3.5 text-rose-400" />}
                        {language === 'uk' ? 'Товари розкоші (ель, одяг):' : 'Luxury Goods (ale, clothes):'}
                      </span>
                      <span className={hasRequiredGoods ? 'text-emerald-300' : 'text-rose-400 font-bold'}>
                        {hasRequiredGoods ? (language === 'uk' ? 'Є' : 'Available') : (language === 'uk' ? 'Бракує' : 'Missing')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-800 pt-1 mt-0.5">
                    <span>{language === 'uk' ? 'Вартість:' : 'Cost:'}</span>
                    <div className="flex items-center gap-2 font-mono">
                      {Object.entries(nextTierConfig.upgradeCost).map(([res, amt]) => {
                        const hasRes = (resources[res as keyof ResourceInventory] || 0) >= (amt || 0);
                        return (
                          <span key={res} className={hasRes ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                            {amt} {res === 'gold' ? 'зол.' : res === 'wood' ? 'дер.' : res === 'stone' ? 'кам.' : res === 'planks' ? 'дощ.' : 'кам.бл.'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>


              </div>
            ) : (
              <div className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40 text-[11px] text-amber-300 flex items-center gap-2">
                <CrestBadgeIcon className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{language === 'uk' ? 'Садиба досягла максимального рівня шляхетного маєтку.' : 'Homestead reached maximum noble estate level.'}</span>
              </div>
            )}


          </div>
        );
      })()}

      {tab === 'operations' && entity.isCompleted && (blueprint?.maxStorage || entity.buildingType === 'lumberjack_hut' || entity.buildingType === 'stockpile') && (() => {
        const maxStorage = blueprint?.maxStorage || (entity.buildingType === 'lumberjack_hut' ? 20 : 100);
        const inv = entity.localInventory || {};
        const entries = Object.entries(inv).filter(([, amt]) => (amt || 0) > 0);
        const totalStored = entries.reduce((acc, [, amt]) => acc + (amt || 0), 0);
        const isFull = totalStored >= maxStorage;
        const pct = Math.min(100, Math.round((totalStored / maxStorage) * 100));

        return (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <StorageIcon className="w-3.5 h-3.5 text-amber-400" />
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

      {tab === 'people' && entity.isCompleted && !isForeign && isHousing && (() => {
        const beds = bType === 'peasant_house'
          ? HOUSE_TIERS_CONFIG[(entity.houseTier || 1) as HouseTier].capacity
          : blueprint?.bedsCount ?? (bType === 'tent' ? 1 : 0);
        const sleepers = Array.from(characterEntities).filter(
          (c) => c.currentJob?.targetBuildingId === entity.id && c.currentJob?.type === 'sleep'
        );

        return (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <HouseTierIcon className="w-3.5 h-3.5 text-amber-400" />
                {language === 'uk' ? 'Житловий простір' : 'Living Quarters'}
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {sleepers.length} / {beds} {language === 'uk' ? 'ліжок' : 'beds'}
              </span>
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

      {tab === 'operations' && entity.isCompleted && !isForeign && bType === 'market' && (() => {
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

      {tab === 'operations' && entity.isCompleted && !isForeign && bType === 'trading_post' && (() => {
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
                  ? (language === 'uk' ? 'Угода' : 'Deal')
                  : caravanStatus.state === 'approaching'
                  ? (language === 'uk' ? 'В дорозі' : 'En route')
                  : (language === 'uk' ? 'Очікування' : 'Awaiting')}
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

      {tab === 'operations' && entity.isCompleted && !isForeign && bType === 'hitching_post' && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <GoatIcon className="w-3.5 h-3.5 text-amber-400" />
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
                  <div className="w-5 h-5 flex items-center justify-center">
                    {isPresent ? <GoatIcon className="w-4 h-4 text-amber-300" /> : <span className="text-slate-600 text-xs">—</span>}
                  </div>
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
                  return;
                }
                consumeResource('gold', 50);
                entity.mulesCount = curMules + 1;
                incrementBuildingVersion();
                audioManager.playUIClick();
              }}
              disabled={resources.gold < 50}
              className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                resources.gold >= 50
                  ? 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border-amber-700/60 shadow-md active:scale-98'
                  : 'bg-slate-800/40 text-slate-500 border-slate-750 cursor-not-allowed'
              }`}
            >
              {language === 'uk' ? 'Купити мула (50' : 'Buy Mule (50'}
              <GoldIcon className="w-3.5 h-3.5 text-amber-400" />
              {')'}
            </button>
          )}
        </div>
      )}

      {tab === 'people' && entity.isCompleted && !isForeign && isProduction && (
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
                <IlluminatedIcon kind="plus" className="w-3.5 h-3.5" />
                {dict.inspector.assignWorker} ({freePeasantsCount} {language === 'uk' ? 'вільних' : 'idle'})
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'people' && entity.isCompleted && !isForeign && isProduction && (
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

      {tab === 'operations' && entity.isCompleted && !isForeign && isProduction && (
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
                <IlluminatedIcon kind="minus" className="w-3.5 h-3.5" />
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
                <IlluminatedIcon kind="plus" className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400">
              {language === 'uk' ? 'Мотивація робітників' : 'Worker incentive'}
            </span>
          </div>
        </div>
      )}

      {tab === 'advanced' && !isForeign && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          {isDemolishPending ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <IlluminatedIcon kind="demolish" className="w-3.5 h-3.5 animate-pulse" />
                  {dict.inspector.demolishingStatus}
                </span>
                {Boolean(entity.demolitionProgress) && (
                  <span className="font-mono text-xs font-bold text-rose-300">
                    {Math.round(entity.demolitionProgress || 0)}%
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleBuildingDemolition(entity)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-750 transition cursor-pointer active:scale-98"
              >
                {dict.inspector.cancelDemolish}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => toggleBuildingDemolition(entity)}
                className="w-full py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold rounded-lg border border-rose-800/60 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-98"
              >
                <IlluminatedIcon kind="demolish" className="w-3.5 h-3.5" />
                {dict.inspector.demolishBuilding}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
