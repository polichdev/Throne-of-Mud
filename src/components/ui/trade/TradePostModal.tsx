import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { TRADE_ITEMS_CONFIG, type TradeItemMeta } from '../../../engine/trade/tradeConfig';
import type { TradeCategory, TradeMode, ResourceType } from '../../../types/game';
import {
  CrossCloseIcon,
  GoldIcon,
  WoodIcon,
  StoneIcon,
  WheatIcon,
  FlourIcon,
  BreadIcon,
  AleIcon,
  WeaponsIcon,
  ScalesIcon,
} from '../MedievalIcons';
import { audioManager } from '../../../engine/audio/AudioManager';
import { Plus, Minus, ArrowRight, Check, Package, Sparkles } from 'lucide-react';

interface TradePostModalProps {
  onClose: () => void;
}

export const TradePostModal: React.FC<TradePostModalProps> = React.memo(({ onClose }) => {
  const { dict, language } = useTranslation();
  const settlementName = useGameStore((s) => s.settlementName);
  const resources = useGameStore((s) => s.resources);
  const tradeRules = useGameStore((s) => s.tradeRules);
  const setTradeRule = useGameStore((s) => s.setTradeRule);
  const caravanStatus = useGameStore((s) => s.caravanStatus);

  const [activeCategory, setActiveCategory] = useState<TradeCategory | 'all'>('all');
  const [justSaved, setJustSaved] = useState(false);

  const categories: Array<{ id: TradeCategory | 'all'; label: string; icon: string }> = [
    { id: 'all', label: dict.tradePost.categories.all, icon: '📦' },
    { id: 'construction', label: dict.tradePost.categories.construction, icon: '🔨' },
    { id: 'agriculture', label: dict.tradePost.categories.agriculture, icon: '🌾' },
    { id: 'food', label: dict.tradePost.categories.food, icon: '🍞' },
    { id: 'materials', label: dict.tradePost.categories.materials, icon: '🪓' },
    { id: 'military', label: dict.tradePost.categories.military, icon: '⚔️' },
  ];

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return TRADE_ITEMS_CONFIG;
    return TRADE_ITEMS_CONFIG.filter((i) => i.category === activeCategory);
  }, [activeCategory]);

  const handleModeChange = (resource: ResourceType, mode: TradeMode) => {
    audioManager.playUIClick();
    setTradeRule(resource, { mode });
  };

  const handleTargetChange = (resource: ResourceType, delta: number) => {
    audioManager.playUIClick();
    const current = tradeRules[resource]?.targetStock ?? 30;
    const nextVal = Math.max(0, Math.min(500, current + delta));
    setTradeRule(resource, { targetStock: nextVal });
  };

  const handlePriceChange = (item: TradeItemMeta, delta: number) => {
    audioManager.playUIClick();
    const current = tradeRules[item.resource]?.customPrice ?? item.baseBuyPrice;
    const nextVal = Math.max(1, Math.min(100, current + delta));
    setTradeRule(item.resource, { customPrice: nextVal });
  };

  const handleSave = () => {
    audioManager.playUIClick();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const renderResourceIcon = (res: ResourceType) => {
    switch (res) {
      case 'wood':
      case 'planks':
        return <WoodIcon className="w-4 h-4 text-amber-500" />;
      case 'stone':
      case 'cut_stone':
        return <StoneIcon className="w-4 h-4 text-slate-300" />;
      case 'wheat':
        return <WheatIcon className="w-4 h-4 text-yellow-400" />;
      case 'flour':
        return <FlourIcon className="w-4 h-4 text-slate-100" />;
      case 'bread':
        return <BreadIcon className="w-4 h-4 text-amber-400" />;
      case 'ale':
        return <AleIcon className="w-4 h-4 text-amber-300" />;
      case 'weapons':
      case 'iron':
        return <WeaponsIcon className="w-4 h-4 text-rose-400" />;
      default:
        return <Package className="w-4 h-4 text-amber-200" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-[620px] max-h-[75vh] bg-[#14161b]/95 border-2 border-[#5a4830]/90 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-slate-200 pointer-events-auto">
        <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-[#5a4830]/60 bg-gradient-to-r from-stone-900 via-[#1c1813] to-stone-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-600/70 flex items-center justify-center text-amber-300 shadow-md">
              <ScalesIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-bold text-sm text-amber-200 tracking-wider">
                  {dict.tradePost.title}
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/50 text-amber-300 font-mono font-bold">
                  {settlementName}
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                {dict.tradePost.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-amber-900/60 text-amber-300 font-mono font-bold text-xs">
              <GoldIcon className="w-3.5 h-3.5 text-yellow-400" />
              <span>{resources.gold || 0}</span>
              <span className="text-[9px] text-stone-400 uppercase">{dict.common.gold}</span>
            </div>

            <button
              onClick={() => {
                audioManager.playUIPanelClose();
                onClose();
              }}
              className="p-1 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-600/50 transition cursor-pointer"
              title="Закрити"
            >
              <CrossCloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 bg-black/40 border-b border-stone-800/80 overflow-x-auto custom-scrollbar shrink-0">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  audioManager.playUIClick();
                  setActiveCategory(cat.id);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer border shrink-0 ${
                  isActive
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-sm scale-102'
                    : 'bg-stone-900/60 hover:bg-stone-800/80 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2.5 custom-scrollbar flex flex-col gap-1.5">
          <div className="grid grid-cols-12 text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2.5 py-1 bg-black/30 rounded border border-stone-800/60">
            <span className="col-span-3">{dict.tradePost.headers.tradeRule}</span>
            <span className="col-span-3">{dict.tradePost.headers.item}</span>
            <span className="col-span-2 text-center">{dict.tradePost.headers.currentStock}</span>
            <span className="col-span-2 text-center">{dict.tradePost.headers.targetStock}</span>
            <span className="col-span-2 text-right">{dict.tradePost.headers.unitPrice}</span>
          </div>

          {filteredItems.map((item) => {
            const rule = tradeRules[item.resource] || {
              resource: item.resource,
              mode: 'none',
              targetStock: item.defaultTargetStock,
              customPrice: item.baseBuyPrice,
            };
            const currentStock = resources[item.resource] || 0;
            const targetStock = rule.targetStock;
            const price = rule.customPrice ?? item.baseBuyPrice;

            const isImport = rule.mode === 'import';
            const isExport = rule.mode === 'export';
            const isNoTrade = rule.mode === 'none';

            return (
              <div
                key={item.resource}
                className={`grid grid-cols-12 items-center px-2.5 py-1.5 rounded-lg border transition-all ${
                  isImport
                    ? 'bg-emerald-950/25 border-emerald-800/50 hover:bg-emerald-950/40'
                    : isExport
                    ? 'bg-amber-950/25 border-amber-800/50 hover:bg-amber-950/40'
                    : 'bg-stone-900/40 border-stone-800/70 hover:bg-stone-900/70'
                }`}
              >
                <div className="col-span-3 flex items-center pr-1">
                  <select
                    value={rule.mode}
                    onChange={(e) => handleModeChange(item.resource, e.target.value as TradeMode)}
                    className={`w-full text-[11px] font-bold px-1.5 py-1 rounded border focus:outline-none cursor-pointer ${
                      isImport
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : isExport
                        ? 'bg-amber-950 border-amber-600 text-amber-300'
                        : 'bg-stone-900 border-stone-700 text-stone-400'
                    }`}
                  >
                    <option value="none">{dict.tradePost.modes.none}</option>
                    <option value="import">{dict.tradePost.modes.import}</option>
                    <option value="export">{dict.tradePost.modes.export}</option>
                  </select>
                </div>

                <div className="col-span-3 flex items-center gap-1.5 min-w-0 pr-1">
                  <div className="w-5 h-5 rounded bg-black/50 border border-stone-700/60 flex items-center justify-center shrink-0">
                    {renderResourceIcon(item.resource)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-stone-200 truncate leading-tight">
                      {language === 'uk' ? item.nameUk : item.nameEn}
                    </span>
                    <span className="text-[8px] text-stone-500 uppercase tracking-wider leading-none">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-center gap-1 font-mono text-[11px]">
                  <span
                    className={`font-bold ${
                      currentStock === 0
                        ? 'text-stone-500'
                        : isImport && currentStock < targetStock
                        ? 'text-rose-400'
                        : isExport && currentStock > targetStock
                        ? 'text-amber-300'
                        : 'text-stone-300'
                    }`}
                  >
                    {currentStock}
                  </span>
                  {!isNoTrade && (
                    <ArrowRight className="w-3 h-3 text-stone-600 shrink-0" />
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-center gap-0.5">
                  {!isNoTrade ? (
                    <div className="flex items-center bg-black/40 px-1 py-0.5 rounded border border-stone-700/50">
                      <button
                        onClick={() => handleTargetChange(item.resource, -10)}
                        className="p-0.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
                        title="-10"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="font-mono text-[11px] font-bold text-amber-200 px-1 min-w-[1.8rem] text-center">
                        {targetStock}
                      </span>
                      <button
                        onClick={() => handleTargetChange(item.resource, 10)}
                        className="p-0.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
                        title="+10"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-stone-600 font-mono">—</span>
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <div className="flex items-center bg-black/40 px-1 py-0.5 rounded border border-stone-700/50">
                    <button
                      onClick={() => handlePriceChange(item, -1)}
                      className="p-0.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
                      title="-1"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="font-mono text-[11px] font-bold text-amber-300 flex items-center gap-0.5 px-0.5 min-w-[1.6rem] justify-center">
                      {price}
                      <GoldIcon className="w-2.5 h-2.5 text-yellow-400" />
                    </span>
                    <button
                      onClick={() => handlePriceChange(item, 1)}
                      className="p-0.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
                      title="+1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-[#5a4830]/60 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-700/60 flex items-center justify-center text-sm shrink-0">
              {caravanStatus.state === 'trading' ? '🪙' : caravanStatus.state === 'approaching' ? '🐴' : '📜'}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-300 truncate">
                  {caravanStatus.merchantName || 'Мандрівний купець'}
                </span>
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    caravanStatus.state === 'trading'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 animate-pulse'
                      : caravanStatus.state === 'approaching'
                      ? 'bg-amber-950 text-amber-300 border border-amber-600'
                      : 'bg-stone-900 text-stone-400 border border-stone-700'
                  }`}
                >
                  {caravanStatus.state === 'trading'
                    ? dict.tradePost.caravan.atPost
                    : caravanStatus.state === 'approaching'
                    ? dict.tradePost.caravan.approaching
                    : dict.tradePost.caravan.waiting}
                </span>
              </div>
              <span className="text-[9px] text-stone-400 truncate">
                {caravanStatus.lastTradeSummary
                  ? `${language === 'uk' ? 'Угода:' : 'Trade:'} ${caravanStatus.lastTradeSummary}`
                  : `${dict.tradePost.caravan.nextScheduled} (${caravanStatus.nextArrivalHour ?? 12}:${String(caravanStatus.nextArrivalMinute ?? 0).padStart(2, '0')})`}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-[11px] shadow-md flex items-center gap-1 transition cursor-pointer active:scale-98 shrink-0"
          >
            {justSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{justSaved ? (language === 'uk' ? 'Збережено!' : 'Saved!') : dict.tradePost.saveSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

TradePostModal.displayName = 'TradePostModal';
