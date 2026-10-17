import type { ResourceType, TradeCategory, TradeRule } from '../../types/game';

export interface TradeItemMeta {
  resource: ResourceType;
  category: TradeCategory;
  baseBuyPrice: number;
  baseSellPrice: number;
  iconName: string;
  defaultTargetStock: number;
}

export const TRADE_ITEMS_CONFIG: TradeItemMeta[] = [
  {
    resource: 'wood',
    category: 'construction',
    baseBuyPrice: 3,
    baseSellPrice: 1,
    iconName: 'wood',
    defaultTargetStock: 50,
  },
  {
    resource: 'planks',
    category: 'construction',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'planks',
    defaultTargetStock: 40,
  },
  {
    resource: 'stone',
    category: 'construction',
    baseBuyPrice: 4,
    baseSellPrice: 2,
    iconName: 'stone',
    defaultTargetStock: 40,
  },
  {
    resource: 'cut_stone',
    category: 'construction',
    baseBuyPrice: 6,
    baseSellPrice: 4,
    iconName: 'cut_stone',
    defaultTargetStock: 30,
  },
  {
    resource: 'clay',
    category: 'construction',
    baseBuyPrice: 3,
    baseSellPrice: 2,
    iconName: 'clay',
    defaultTargetStock: 30,
  },
  {
    resource: 'clay_bricks',
    category: 'construction',
    baseBuyPrice: 7,
    baseSellPrice: 4,
    iconName: 'clay_bricks',
    defaultTargetStock: 30,
  },
  {
    resource: 'wheat',
    category: 'agriculture',
    baseBuyPrice: 2,
    baseSellPrice: 1,
    iconName: 'wheat',
    defaultTargetStock: 50,
  },
  {
    resource: 'flour',
    category: 'agriculture',
    baseBuyPrice: 4,
    baseSellPrice: 2,
    iconName: 'flour',
    defaultTargetStock: 30,
  },
  {
    resource: 'ale',
    category: 'agriculture',
    baseBuyPrice: 6,
    baseSellPrice: 4,
    iconName: 'ale',
    defaultTargetStock: 25,
  },
  {
    resource: 'berries',
    category: 'agriculture',
    baseBuyPrice: 3,
    baseSellPrice: 2,
    iconName: 'berries',
    defaultTargetStock: 30,
  },
  {
    resource: 'bread',
    category: 'food',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'bread',
    defaultTargetStock: 50,
  },
  {
    resource: 'meat',
    category: 'food',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'meat',
    defaultTargetStock: 30,
  },
  {
    resource: 'fish',
    category: 'food',
    baseBuyPrice: 4,
    baseSellPrice: 2,
    iconName: 'fish',
    defaultTargetStock: 30,
  },
  {
    resource: 'salt',
    category: 'food',
    baseBuyPrice: 6,
    baseSellPrice: 4,
    iconName: 'salt',
    defaultTargetStock: 20,
  },
  {
    resource: 'hides',
    category: 'materials',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'hides',
    defaultTargetStock: 25,
  },
  {
    resource: 'clothes',
    category: 'materials',
    baseBuyPrice: 12,
    baseSellPrice: 8,
    iconName: 'clothes',
    defaultTargetStock: 20,
  },
  {
    resource: 'iron_ore',
    category: 'materials',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'iron_ore',
    defaultTargetStock: 30,
  },
  {
    resource: 'coal',
    category: 'materials',
    baseBuyPrice: 4,
    baseSellPrice: 2,
    iconName: 'coal',
    defaultTargetStock: 40,
  },
  {
    resource: 'iron',
    category: 'military',
    baseBuyPrice: 10,
    baseSellPrice: 6,
    iconName: 'iron',
    defaultTargetStock: 20,
  },
  {
    resource: 'weapons',
    category: 'military',
    baseBuyPrice: 16,
    baseSellPrice: 11,
    iconName: 'weapons',
    defaultTargetStock: 20,
  },
];

export const DEFAULT_TRADE_RULES: Record<ResourceType, TradeRule> = (TRADE_ITEMS_CONFIG.reduce(
  (acc, item) => {
    acc[item.resource] = {
      resource: item.resource,
      mode: 'none',
      targetStock: item.defaultTargetStock,
      customPrice: item.baseBuyPrice,
    };
    return acc;
  },
  {} as Record<ResourceType, TradeRule>
));

export function getTradeItemMeta(resource: ResourceType): TradeItemMeta | undefined {
  return TRADE_ITEMS_CONFIG.find((i) => i.resource === resource);
}

export function getTradePrices(item: TradeItemMeta, customPrice?: number) {
  const exportPrice = customPrice ?? item.baseBuyPrice;
  const importMargin = Math.max(1, Math.min(10, Math.round(item.baseBuyPrice * 0.6)));
  return { exportPrice, importPrice: exportPrice + importMargin };
}
