import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { TRADE_ITEMS_CONFIG, getTradePrices, type TradeItemMeta } from '../../../engine/trade/tradeConfig';
import type { TradeCategory, TradeMode, ResourceType } from '../../../types/game';
import {
  CrossCloseIcon,
  GoldIcon,
  ScalesIcon,
} from '../MedievalIcons';
import { IlluminatedIcon } from '../IlluminatedIcons';
import { RESOURCE_UI } from '../resourcePresentation';
import { audioManager } from '../../../engine/audio/AudioManager';
import { Plus, Minus, ArrowRight } from 'lucide-react';

interface TradePostModalProps {
  onClose: () => void;
}

export const TradePostModal: React.FC<TradePostModalProps> = React.memo(({ onClose }) => {
  const { dict, language } = useTranslation();
  const settlementName = useGameStore((s) => s.settlementName);
  const resources = useGameStore((s) => s.resources);
  const tradeRules = useGameStore((s) => s.tradeRules);
  const setTradeRule = useGameStore((s) => s.setTradeRule);

  const [activeCategory, setActiveCategory] = useState<TradeCategory | 'all'>('all');

  const categories: Array<{ id: TradeCategory | 'all'; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: dict.tradePost.categories.all, icon: <IlluminatedIcon kind="storage" size={27} /> },
    { id: 'construction', label: dict.tradePost.categories.construction, icon: <IlluminatedIcon kind="construction_group" size={27} /> },
    { id: 'agriculture', label: dict.tradePost.categories.agriculture, icon: <IlluminatedIcon kind="farm_group" size={27} /> },
    { id: 'food', label: dict.tradePost.categories.food, icon: <IlluminatedIcon kind="food_group" size={27} /> },
    { id: 'materials', label: dict.tradePost.categories.materials, icon: <IlluminatedIcon kind="materials_group" size={27} /> },
    { id: 'military', label: dict.tradePost.categories.military, icon: <IlluminatedIcon kind="goods_group" size={27} /> },
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

  const renderResourceIcon = (res: ResourceType) => <IlluminatedIcon kind={RESOURCE_UI[res].icon} size={27} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/45 backdrop-blur-[2px] pointer-events-auto select-none animate-in fade-in duration-150">
      <div className="realm-paper-panel realm-trade-modal relative shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-slate-200 pointer-events-auto">
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
                <span className="text-[10px] px-1.5 py-0.5 border-l border-[#7c6847] pl-2 text-[#bba782] font-cinzel font-bold">
                  {settlementName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-amber-900/60 text-amber-300 font-mono font-bold text-xs">
              <GoldIcon className="w-3.5 h-3.5 text-yellow-400" />
              <span>{resources.gold || 0}</span>
            </div>

            <button
              onClick={() => {
                audioManager.playUIPanelClose();
                onClose();
              }}
              className="p-1 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-600/50 transition cursor-pointer"
              title={dict.common.close}
            >
              <CrossCloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="realm-trade-tabs flex items-center gap-1 px-3 py-2 border-b border-[#66563c] overflow-x-auto custom-scrollbar shrink-0">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  audioManager.playUIClick();
                  setActiveCategory(cat.id);
                }}
                className={`realm-trade-tab px-2.5 py-1.5 text-[11px] font-cinzel font-semibold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  isActive
                    ? 'active border-[#a58a5e] text-[#ead9b5]'
                    : 'border-transparent text-[#ab9c81] hover:text-[#ead9b5]'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="realm-trade-ledger flex-1 overflow-y-auto px-3 py-2.5 custom-scrollbar flex flex-col gap-1.5">
          <div className="realm-trade-columns grid grid-cols-12 text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2.5 py-1 bg-black/30 rounded border border-stone-800/60">
            <span className="col-span-2">{dict.tradePost.headers.tradeRule}</span>
            <span className="col-span-3">{dict.tradePost.headers.item}</span>
            <span className="col-span-1 text-center">{dict.tradePost.headers.currentStock}</span>
            <span className="col-span-2 text-center">{dict.tradePost.headers.targetStock}</span>
            <span className="col-span-2 text-center">{language === 'uk' ? 'Експорт' : 'Export'}</span>
            <span className="col-span-2 text-center">{language === 'uk' ? 'Імпорт' : 'Import'}</span>
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
            const { exportPrice, importPrice } = getTradePrices(item, rule.customPrice);

            const isImport = rule.mode === 'import';
            const isExport = rule.mode === 'export';
            const isNoTrade = rule.mode === 'none';

            return (
              <div
                key={item.resource}
                data-trade-mode={rule.mode}
                className={`realm-trade-row grid grid-cols-12 items-center px-2.5 py-2 border transition-all ${
                  isImport
                    ? 'bg-emerald-950/25 border-emerald-800/50 hover:bg-emerald-950/40'
                    : isExport
                    ? 'bg-amber-950/25 border-amber-800/50 hover:bg-amber-950/40'
                    : 'bg-stone-900/40 border-stone-800/70 hover:bg-stone-900/70'
                }`}
              >
                <div className="col-span-2 flex items-center pr-1">
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
                  <div className="realm-trade-item-icon w-5 h-5 rounded bg-black/50 border border-stone-700/60 flex items-center justify-center shrink-0">
                    {renderResourceIcon(item.resource)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-stone-200 truncate leading-tight">
                      {language === 'uk' ? item.nameUk : item.nameEn}
                    </span>
                  </div>
                </div>

                <div className="realm-trade-stock col-span-1 flex items-center justify-center gap-1 font-mono text-[11px]">
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

                <div className="realm-trade-price col-span-2 flex items-center justify-center">
                  <div className="flex items-center bg-black/40 px-1 py-0.5 rounded border border-stone-700/50">
                    <button
                      onClick={() => handlePriceChange(item, -1)}
                      className="p-0.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
                      title="-1"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="font-mono text-[11px] font-bold text-amber-300 flex items-center gap-0.5 px-0.5 min-w-[1.6rem] justify-center">
                      {exportPrice}
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
                <div className="realm-trade-import col-span-2 flex items-center justify-center gap-1 font-mono text-[11px] font-bold text-[#c7d8b5]" title={language === 'uk' ? 'Ціна купівлі в купця' : 'Price paid to the merchant'}>
                  <span>{importPrice}</span>
                  <GoldIcon className="w-2.5 h-2.5 text-yellow-400" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
});

TradePostModal.displayName = 'TradePostModal';
