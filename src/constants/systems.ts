export const PRODUCTION = {
  "taxCollectionHour": 8,
  "nightStartHour": 20,
  "nightEndHour": 6,
  "fallbackStorageCapacity": 30
} as const;

export const NEED_EVENTS = {
  "mealSpeechTicks": 20,
  "meatHungerBonus": 10,
  "berriesHungerPenalty": 5,
  "aleSpeechTicks": 25
} as const;

export const ECONOMY_EVENTS = {
  "speechTicks": 25
} as const;

export const MOVEMENT_GEOMETRY = {
  "tileCenter": 0.5,
  "regionInnerMargin": 0.5,
  "pathRegionMargin": 3,
  "packedCoordinateBits": 16,
  "packedCoordinateMask": 65535,
  "overlapEpsilon": 0.001,
  "collisionHashFirstMultiplier": 17,
  "collisionHashSecondMultiplier": 31,
  "overlapSeparationDistance": 0.02
} as const;

export const JOB_SCHEDULE = {
  "manualArrivalDistance": 1.2,
  "unitScheduleHashMultiplier": 17,
  "maxShiftDelayMinutes": 30,
  "maxWorkStartDelayMinutes": 15,
  "workSpeechTicks": 25,
  "idleSpeechTicks": 20,
  "idleSpeechChance": 0.2
} as const;

export const IMMIGRANTS = {
  "fallbackMood": 60,
  "spawnHeight": 0.3,
  "goldMin": 2,
  "goldRange": 4,
  "farmingMin": 4,
  "farmingRange": 5,
  "woodcuttingMin": 4,
  "woodcuttingRange": 5,
  "miningMin": 3,
  "miningRange": 4,
  "buildingMin": 4,
  "buildingRange": 5,
  "cookingMin": 2,
  "cookingRange": 4,
  "brewingMin": 2,
  "brewingRange": 4,
  "combatMin": 3,
  "combatRange": 4,
  "intellectMin": 3,
  "intellectRange": 5,
  "charismaMin": 3,
  "charismaRange": 5,
  "journeyWork": 10
} as const;

export const SETTLEMENT_CONFIG = {
  "maxChronicleEvents": 50,
  "chronicleScoreDayMultiplier": 100,
  "foliageDebounceMs": 150,
  "maxImmigrationProgress": 100
} as const;

