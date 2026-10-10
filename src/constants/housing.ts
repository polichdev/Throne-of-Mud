import type { HouseTier, BackyardExtensionType, ResourceInventory } from '../types/game';

export const PEASANT_GROUND_BEDS = [
  { x: -0.95, z: -0.08 },
  { x: 1.305, z: -0.08 },
] as const;

export interface HouseTierConfig {
  tier: HouseTier;
  nameUk: string;
  nameEn: string;
  descriptionUk: string;
  descriptionEn: string;
  capacity: number;
  dailyTaxGold: number;
  allowedExtensions: BackyardExtensionType[];
  upgradeCost: Partial<ResourceInventory>;
  upgradeMinFoodTypes: number;
  upgradeRequiredGoods: (keyof ResourceInventory)[];
}

export const HOUSE_TIERS_CONFIG: Record<HouseTier, HouseTierConfig> = {
  1: {
    tier: 1,
    nameUk: 'Рівень I: Селянська хатина',
    nameEn: 'Tier I: Peasant House',
    descriptionUk: 'Базове селянське житло на 1 родину (2 селян). Дозволяє прості присадибні господарства.',
    descriptionEn: 'Basic peasant housing for 1 family (2 peasants). Allows simple backyard extensions.',
    capacity: 2,
    dailyTaxGold: 0,
    allowedExtensions: ['none', 'vegetable_garden', 'chicken_coop', 'goat_shed'],
    upgradeCost: {},
    upgradeMinFoodTypes: 1,
    upgradeRequiredGoods: [],
  },
  2: {
    tier: 2,
    nameUk: 'Рівень II: Укріплена садиба',
    nameEn: 'Tier II: Fortified Homestead',
    descriptionUk: 'Кам’яний цоколь та білені стіни. Вміщує 3 селян, приносить +1 золото податку щодня та відкриває ремісничі майстерні.',
    descriptionEn: 'Stone footing and plastered walls. Houses 3 peasants, generates +1 daily tax, and unlocks artisan workshops.',
    capacity: 3,
    dailyTaxGold: 1,
    allowedExtensions: [
      'none',
      'vegetable_garden',
      'chicken_coop',
      'goat_shed',
      'artisan_bowyer',
      'artisan_shields',
      'artisan_brewery',
    ],
    upgradeCost: { wood: 4, stone: 2, gold: 15 },
    upgradeMinFoodTypes: 2,
    upgradeRequiredGoods: [],
  },
  3: {
    tier: 3,
    nameUk: 'Рівень III: Шляхетний кам’яний маєток',
    nameEn: 'Tier III: Stone Manor Estate',
    descriptionUk: 'Двоповерховий маєток з кам’яними колонами та геральдикою. Вміщує 4 селян, приносить +3 золота щодня та забезпечує важке спорядження ополчення.',
    descriptionEn: 'Two-story manor with stone columns and heraldry. Houses 4 peasants, generates +3 daily tax, and provides heavy levy equipment.',
    capacity: 4,
    dailyTaxGold: 3,
    allowedExtensions: [
      'none',
      'vegetable_garden',
      'chicken_coop',
      'goat_shed',
      'artisan_bowyer',
      'artisan_shields',
      'artisan_brewery',
    ],
    upgradeCost: { planks: 4, cut_stone: 4, gold: 35 },
    upgradeMinFoodTypes: 3,
    upgradeRequiredGoods: ['ale', 'clothes'],
  },
};

export interface BackyardExtensionConfig {
  type: BackyardExtensionType;
  nameUk: string;
  nameEn: string;
  descriptionUk: string;
  descriptionEn: string;
  cost: Partial<ResourceInventory>;
  requiredTier: HouseTier;
  productionCycleTicks: number;
  inputs: Partial<ResourceInventory>;
  outputs: Partial<ResourceInventory>;
  iconType: 'vegetable' | 'chicken' | 'goat' | 'bow' | 'shield' | 'beer' | 'none';
}

export const BACKYARD_EXTENSIONS_CONFIG: Record<BackyardExtensionType, BackyardExtensionConfig> = {
  none: {
    type: 'none',
    nameUk: 'Порожнє подвір’я',
    nameEn: 'Empty Yard',
    descriptionUk: 'Звичайний двір без прибудов.',
    descriptionEn: 'Plain yard with no extensions.',
    cost: {},
    requiredTier: 1,
    productionCycleTicks: 0,
    inputs: {},
    outputs: {},
    iconType: 'none',
  },
  vegetable_garden: {
    type: 'vegetable_garden',
    nameUk: 'Овочевий город',
    nameEn: 'Vegetable Garden',
    descriptionUk: 'Грядки моркви та капусти позаду садиби. Пасивно дає +1 овочі щодня.',
    descriptionEn: 'Carrot and cabbage beds behind the house. Passively yields +1 vegetables daily.',
    cost: { gold: 10 },
    requiredTier: 1,
    productionCycleTicks: 80,
    inputs: {},
    outputs: { vegetables: 1 },
    iconType: 'vegetable',
  },
  chicken_coop: {
    type: 'chicken_coop',
    nameUk: 'Домашній курник',
    nameEn: 'Chicken Coop',
    descriptionUk: 'Загородка для свійської птиці. Регулярно постачає свіжі яйця (+1) та м’ясо (+1).',
    descriptionEn: 'Enclosed poultry yard. Regularly provides fresh eggs (+1) and meat (+1).',
    cost: { gold: 15, wood: 2 },
    requiredTier: 1,
    productionCycleTicks: 100,
    inputs: {},
    outputs: { eggs: 1, meat: 1 },
    iconType: 'chicken',
  },
  goat_shed: {
    type: 'goat_shed',
    nameUk: 'Козячий хлів',
    nameEn: 'Goat Shed',
    descriptionUk: 'Стійло для кіз. Забезпечує шкури (+1) для пошиття одягу та взуття.',
    descriptionEn: 'Stable for goats. Generates hides (+1) for leather and garments.',
    cost: { gold: 20, wood: 2 },
    requiredTier: 1,
    productionCycleTicks: 120,
    inputs: {},
    outputs: { hides: 1 },
    iconType: 'goat',
  },
  artisan_bowyer: {
    type: 'artisan_bowyer',
    nameUk: 'Майстерня лучника',
    nameEn: 'Bowyer Workshop',
    descriptionUk: 'Реміснича майстерня для виготовлення луків зі свіжої деревини (-1 деревина -> +1 зброя).',
    descriptionEn: 'Artisan workshop crafting bows from timber (-1 wood -> +1 weapons).',
    cost: { gold: 25, wood: 4 },
    requiredTier: 2,
    productionCycleTicks: 140,
    inputs: { wood: 1 },
    outputs: { weapons: 1 },
    iconType: 'bow',
  },
  artisan_shields: {
    type: 'artisan_shields',
    nameUk: 'Кузня щитів та броні',
    nameEn: 'Armorer & Shieldmaker',
    descriptionUk: 'Кування круглих щитів та панцирів для важкої піхоти ополчення (-1 дерево, -1 залізо -> +2 зброя).',
    descriptionEn: 'Forging round shields and armor for heavy levy militia (-1 wood, -1 iron -> +2 weapons).',
    cost: { gold: 25, wood: 4, iron: 2 },
    requiredTier: 2,
    productionCycleTicks: 140,
    inputs: { wood: 1, iron: 1 },
    outputs: { weapons: 2 },
    iconType: 'shield',
  },
  artisan_brewery: {
    type: 'artisan_brewery',
    nameUk: 'Домашня броварня',
    nameEn: 'Cottage Brewery',
    descriptionUk: 'Власне хмільне виробництво на задньому подвір’ї (-1 пшениця -> +2 елю).',
    descriptionEn: 'Backyard craft brewing of malt ale (-1 wheat -> +2 ale).',
    cost: { gold: 30, wood: 3 },
    requiredTier: 2,
    productionCycleTicks: 100,
    inputs: { wheat: 1 },
    outputs: { ale: 2 },
    iconType: 'beer',
  },
};

export const FOOD_RESOURCE_KEYS: (keyof ResourceInventory)[] = [
  'bread',
  'vegetables',
  'eggs',
  'meat',
  'fish',
  'berries',
];
