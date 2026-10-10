import type { ResourceInventory } from '../types/game';

export const INITIAL_RESOURCES: ResourceInventory = {
  gold: 1000,
  wood: 1000,
  stone: 1000,
  wheat: 1000,
  flour: 1000,
  bread: 1000,
  ale: 1000,
  weapons: 1000,
  fish: 1000,
  berries: 1000,
  iron: 1000,
  clay: 1000,
  salt: 1000,
  meat: 500,
  hides: 500,
  vegetables: 500,
  eggs: 500,
  iron_ore: 500,
  coal: 500,
  cut_stone: 500,
  clay_bricks: 500,
  planks: 500,
  clothes: 500,
};

export const STARTING_INFLUENCE = 2600;
export const STARTING_ROYAL_FAVOR = 15;

export const MIN_BUILDING_WAGE = 0;
export const MAX_BUILDING_WAGE = 20;
export const DEFAULT_WAGE = 2;

export const DEFAULT_SPEECH_BUBBLE_TICKS = 35;
export const EMPLOYED_THOUGHT_TICKS = 3000;
export const DISMISSED_THOUGHT_TICKS = 1000;

export const BASE_STORAGE_CAPACITY = 5000;

export const WAGE_PAYOUT_HOUR = 19;
export const MARKET_SHOPPING_START_HOUR = 19;
export const MARKET_SHOPPING_END_HOUR = 23;
export const MARKET_SHOPPING_TICK_INTERVAL = 30;

export const PAID_WAGE_MOOD_BOOST = 12;
export const PAID_WAGE_DURATION_TICKS = 600;
export const UNPAID_WAGE_MOOD_PENALTY = -25;
export const UNPAID_WAGE_DURATION_TICKS = 800;
export const UNPAID_WAGE_MOOD_DROP = 20;

export const MARKET_ITEM_PRICE_GOLD = 1;
export const MARKET_PURCHASE_MOOD_BOOST = 15;
export const MARKET_PURCHASE_MOOD_DURATION_TICKS = 500;
export const MARKET_HUNGER_THRESHOLD = 75;
export const MARKET_ALE_THRESHOLD = 60;
