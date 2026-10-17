import type { HouseTier, BackyardExtensionType, ResourceInventory } from '../types/game';

export const PEASANT_GROUND_BEDS = [
  { x: -0.95, z: -0.08 },
  { x: 1.305, z: -0.08 },
] as const;

export const DEFAULT_HOUSE_MAX_HEALTH = 150;
export const HOUSE_TIER_HEALTH_BONUS = 100;
export const TENT_BED_CAPACITY = 2;

export interface HouseTierConfig {
  tier: HouseTier;
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
    capacity: 2,
    dailyTaxGold: 0,
    allowedExtensions: ['none', 'vegetable_garden', 'chicken_coop', 'goat_shed'],
    upgradeCost: {},
    upgradeMinFoodTypes: 1,
    upgradeRequiredGoods: [],
  },
  2: {
    tier: 2,
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
    cost: {},
    requiredTier: 1,
    productionCycleTicks: 0,
    inputs: {},
    outputs: {},
    iconType: 'none',
  },
  vegetable_garden: {
    type: 'vegetable_garden',
    cost: { gold: 10 },
    requiredTier: 1,
    productionCycleTicks: 80,
    inputs: {},
    outputs: { vegetables: 1 },
    iconType: 'vegetable',
  },
  chicken_coop: {
    type: 'chicken_coop',
    cost: { gold: 15, wood: 2 },
    requiredTier: 1,
    productionCycleTicks: 100,
    inputs: {},
    outputs: { eggs: 1, meat: 1 },
    iconType: 'chicken',
  },
  goat_shed: {
    type: 'goat_shed',
    cost: { gold: 20, wood: 2 },
    requiredTier: 1,
    productionCycleTicks: 120,
    inputs: {},
    outputs: { hides: 1 },
    iconType: 'goat',
  },
  artisan_bowyer: {
    type: 'artisan_bowyer',
    cost: { gold: 25, wood: 4 },
    requiredTier: 2,
    productionCycleTicks: 140,
    inputs: { wood: 1 },
    outputs: { weapons: 1 },
    iconType: 'bow',
  },
  artisan_shields: {
    type: 'artisan_shields',
    cost: { gold: 25, wood: 4, iron: 2 },
    requiredTier: 2,
    productionCycleTicks: 140,
    inputs: { wood: 1, iron: 1 },
    outputs: { weapons: 2 },
    iconType: 'shield',
  },
  artisan_brewery: {
    type: 'artisan_brewery',
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
