import type { ResourceType, TradeCategory, TradeRule } from '../../types/game';

export interface TradeItemMeta {
  resource: ResourceType;
  nameUk: string;
  nameEn: string;
  category: TradeCategory;
  baseBuyPrice: number;
  baseSellPrice: number;
  iconName: string;
  defaultTargetStock: number;
}

export const TRADE_ITEMS_CONFIG: TradeItemMeta[] = [
  {
    resource: 'wood',
    nameUk: 'Колоди (Дерево)',
    nameEn: 'Timber Logs',
    category: 'construction',
    baseBuyPrice: 3,
    baseSellPrice: 1,
    iconName: 'wood',
    defaultTargetStock: 50,
  },
  {
    resource: 'planks',
    nameUk: 'Дошки',
    nameEn: 'Planks',
    category: 'construction',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'planks',
    defaultTargetStock: 40,
  },
  {
    resource: 'stone',
    nameUk: 'Камінь',
    nameEn: 'Rough Stone',
    category: 'construction',
    baseBuyPrice: 4,
    baseSellPrice: 2,
    iconName: 'stone',
    defaultTargetStock: 40,
  },
  {
    resource: 'cut_stone',
    nameUk: 'Тесані блоки',
    nameEn: 'Dressed Stone Blocks',
    category: 'construction',
    baseBuyPrice: 6,
    baseSellPrice: 4,
    iconName: 'cut_stone',
    defaultTargetStock: 30,
  },
  {
    resource: 'clay',
    nameUk: 'Глина',
    nameEn: 'Clay',
    category: 'construction',
    baseBuyPrice: 3,
    baseSellPrice: 2,
    iconName: 'clay',
    defaultTargetStock: 30,
  },
  {
    resource: 'clay_bricks',
    nameUk: 'Цегла / Черепиця',
    nameEn: 'Clay Bricks / Tiles',
    category: 'construction',
    baseBuyPrice: 7,
    baseSellPrice: 4,
    iconName: 'clay_bricks',
    defaultTargetStock: 30,
  },

  {
    resource: 'wheat',
    nameUk: 'Пшениця (Зерно)',
    nameEn: 'Wheat Sheaves',
    category: 'agriculture',
    baseBuyPrice: 2,
    baseSellPrice: 1,
    iconName: 'wheat',
    defaultTargetStock: 50,
  },
  {
    resource: 'flour',
    nameUk: 'Борошно',
    nameEn: 'Baking Flour',
    category: 'agriculture',
    baseBuyPrice: 4,
    baseSellPrice: 2,
    iconName: 'flour',
    defaultTargetStock: 30,
  },
  {
    resource: 'ale',
    nameUk: 'Ель',
    nameEn: 'Ale',
    category: 'agriculture',
    baseBuyPrice: 6,
    baseSellPrice: 4,
    iconName: 'ale',
    defaultTargetStock: 25,
  },
  {
    resource: 'berries',
    nameUk: 'Ягоди',
    nameEn: 'Wild Berries',
    category: 'agriculture',
    baseBuyPrice: 3,
    baseSellPrice: 2,
    iconName: 'berries',
    defaultTargetStock: 30,
  },

  {
    resource: 'bread',
    nameUk: 'Хліб',
    nameEn: 'Bread',
    category: 'food',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'bread',
    defaultTargetStock: 50,
  },
  {
    resource: 'meat',
    nameUk: 'Мʼясо',
    nameEn: 'Venison / Game Meat',
    category: 'food',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'meat',
    defaultTargetStock: 30,
  },
  {
    resource: 'fish',
    nameUk: 'Свіжа риба',
    nameEn: 'Fresh Fish',
    category: 'food',
    baseBuyPrice: 4,
    baseSellPrice: 2,
    iconName: 'fish',
    defaultTargetStock: 30,
  },
  {
    resource: 'salt',
    nameUk: 'Сіль',
    nameEn: 'Salt',
    category: 'food',
    baseBuyPrice: 6,
    baseSellPrice: 4,
    iconName: 'salt',
    defaultTargetStock: 20,
  },

  {
    resource: 'hides',
    nameUk: 'Шкури тварин',
    nameEn: 'Animal Hides',
    category: 'materials',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'hides',
    defaultTargetStock: 25,
  },
  {
    resource: 'clothes',
    nameUk: 'Теплий одяг',
    nameEn: 'Tailored Clothing',
    category: 'materials',
    baseBuyPrice: 12,
    baseSellPrice: 8,
    iconName: 'clothes',
    defaultTargetStock: 20,
  },
  {
    resource: 'iron_ore',
    nameUk: 'Залізна руда',
    nameEn: 'Iron Ore',
    category: 'materials',
    baseBuyPrice: 5,
    baseSellPrice: 3,
    iconName: 'iron_ore',
    defaultTargetStock: 30,
  },
  {
    resource: 'coal',
    nameUk: 'Вугілля',
    nameEn: 'Charcoal',
    category: 'materials',
    baseBuyPrice: 4,
    baseSellPrice: 2,
    iconName: 'coal',
    defaultTargetStock: 40,
  },

  {
    resource: 'iron',
    nameUk: 'Сортове залізо',
    nameEn: 'Iron Ingots',
    category: 'military',
    baseBuyPrice: 10,
    baseSellPrice: 6,
    iconName: 'iron',
    defaultTargetStock: 20,
  },
  {
    resource: 'weapons',
    nameUk: 'Зброя та щити',
    nameEn: 'Arms & Armor',
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
