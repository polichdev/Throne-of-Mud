export type TerrainType = 'grass' | 'fertile_soil' | 'water' | 'stone' | 'mud' | 'forest_ground' | 'road' | 'floor';

export type ToolType = 'select' | 'build' | 'chop' | 'mine' | 'harvest' | 'road';

export type ResourceType =
  | 'wood'
  | 'stone'
  | 'wheat'
  | 'flour'
  | 'bread'
  | 'ale'
  | 'gold'
  | 'weapons'
  | 'fish'
  | 'berries'
  | 'iron'
  | 'clay'
  | 'salt'
  | 'meat'
  | 'hides'
  | 'iron_ore'
  | 'coal'
  | 'cut_stone'
  | 'clay_bricks'
  | 'planks'
  | 'clothes';

export interface ResourceInventory {
  wood: number;
  stone: number;
  wheat: number;
  flour: number;
  bread: number;
  ale: number;
  gold: number;
  weapons: number;
  fish: number;
  berries: number;
  iron: number;
  clay: number;
  salt: number;
  meat: number;
  hides: number;
  iron_ore: number;
  coal: number;
  cut_stone: number;
  clay_bricks: number;
  planks: number;
  clothes: number;
}

export type ResourceDepositType = 'fish' | 'berries' | 'stone' | 'iron' | 'clay' | 'salt' | 'wild_game';

export interface ResourceDeposit {
  id: string;
  type: ResourceDepositType;
  name: string;
  regionId: number;
  position: [number, number, number];
  gridPosition: [number, number];
  currentAmount: number;
  maxAmount: number;
  isRich: boolean;
  seasonalRenewal?: boolean;
  description: string;
  icon: string;
  harvestBuildingLabel: string;
}

export type CharacterClass = 'king' | 'lord' | 'lady' | 'peasant' | 'warrior' | 'prisoner';

export interface CharacterNeeds {
  hunger: number;
  energy: number;
  mood: number;
  ale: number;
  hygiene: number;
}

export interface CharacterSkills {
  farming: number;
  woodcutting: number;
  mining: number;
  building: number;
  cooking: number;
  brewing: number;
  combat: number;
  intellect: number;
  charisma: number;
}

export interface Thought {
  id: string;
  text: string;
  modifier: number;
  durationTicks: number;
}

export type JobType =
  | 'idle'
  | 'wander'
  | 'chop_tree'
  | 'wait_tree_fall'
  | 'chop_fallen_log'
  | 'mine_rock'
  | 'harvest_wheat'
  | 'plant_crops'
  | 'build_structure'
  | 'demolish_structure'
  | 'haul_resource'
  | 'haul_log_with_mule'
  | 'haul_construction_mule'
  | 'return_mule'
  | 'make_flour'
  | 'bake_bread'
  | 'brew_ale'
  | 'work_at_building'
  | 'gather_berries'
  | 'hunt_game'
  | 'plant_tree'
  | 'visit_market'
  | 'patrol'
  | 'preach'
  | 'sleep'
  | 'sit_by_fire'
  | 'eat'
  | 'drink_ale'
  | 'socialize'
  | 'flee'
  | 'fight';

export interface Job {
  id: string;
  type: JobType;
  targetPosition?: [number, number];
  targetAngle?: number;
  targetY?: number;
  targetEntityId?: string;
  targetBuildingId?: string;
  progress: number;
  totalWork: number;
  assignedUnitId?: string;
  seatIndex?: number;
  bedIndex?: number;
  payload?: {
    resourceType?: ResourceType;
    amount?: number;
    buildingType?: BuildingType;
    logPosition?: [number, number];
    hitchingPostId?: string;
  };
}

export type BuildingType =
  | 'campfire'
  | 'tent'
  | 'hitching_post'
  | 'lumberjack_hut'
  | 'peasant_house'
  | 'manor'
  | 'stockpile'
  | 'market'
  | 'wheat_farm'
  | 'windmill'
  | 'brewery'
  | 'bakery'
  | 'barracks'
  | 'wooden_wall'
  | 'wooden_gate'
  | 'stone_wall'
  | 'fishermans_hut'
  | 'foragers_hut'
  | 'hunters_hut'
  | 'iron_mine'
  | 'stone_quarry'
  | 'clay_pit'
  | 'salt_works'
  | 'charcoal_kiln'
  | 'iron_smelter'
  | 'stonecutter'
  | 'brickworks'
  | 'sawmill'
  | 'weavers_workshop'
  | 'foresters_hut'
  | 'wooden_church'
  | 'tavern';

export interface BuildingBlueprint {
  type: BuildingType;
  name: string;
  description: string;
  width: number;
  height: number;
  cost: Partial<ResourceInventory>;
  category: 'housing' | 'agriculture' | 'production' | 'infrastructure' | 'military' | 'gathering' | 'community';
  workSlots: number;
  bedsCount?: number;
  health: number;
  color: string;
  defaultWage?: number;
  maxStorage?: number;
  storageCapacity?: Partial<ResourceInventory>;
  produces?: {
    inputs: Partial<ResourceInventory>;
    outputs: Partial<ResourceInventory>;
    ticksRequired: number;
  };
}

export interface TileData {
  x: number;
  z: number;
  terrain: TerrainType;
  height: number;
  fertility: number;
  isPassable: boolean;
  movementCost: number;
  buildingId?: string;
  foliageType?: 'tree' | 'fallen_tree' | 'rock' | 'bush' | 'wheat_crop';
  foliageAngle?: number;
  foliageTreeType?: 'pine' | 'oak' | 'autumn';
  cropStage?: number;
  itemOnGround?: {
    type: ResourceType;
    amount: number;
  };
}

export type SeasonType = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type MonthName =
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December'
  | 'January'
  | 'February';
export type WeatherType = 'clear' | 'rain' | 'storm' | 'snow';

export interface GameTime {
  tick: number;
  day: number;
  dayOfMonth?: number;
  month?: MonthName;
  monthIndex?: number;
  monthInSeason?: number;
  year?: number;
  hour: number;
  minute: number;
  season: SeasonType;
  weather: WeatherType;
  targetWeather: WeatherType;
  nextWeather: WeatherType;
  isWeatherLocked?: boolean;
  rainIntensity: number;
  stormIntensity: number;
  snowIntensity: number;
  snowAccumulation: number;
  lightningFlash: number;
  speedMultiplier: number;
  isPaused: boolean;
}

export interface ChronicleEvent {
  id: string;
  timestamp: string;
  gameDay: number;
  gameHour: number;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'danger' | 'success' | 'social';
}

export interface SpawnPointData {
  id: string;
  name: string;
  position: [number, number];
  description: string;
}

export interface RegionData {
  id: number;
  name: string;
  ukrName: string;
  description: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; regionId?: number };
  center: [number, number];
  owner: 'player' | 'bot' | 'unclaimed';
  lordName: string;
  lordTitle: string;
  heraldryColor: string;
  heraldryIcon: string;
  population: number;
  approval: number;
  wealth: number;
  buildingsCount: number;
  campPosition?: [number, number];
  spawnPoints: SpawnPointData[];
}

export interface BotLordConfig {
  id: string;
  name: string;
  title: string;
  regionId: number;
  color: string;
  heraldryIcon: string;
  campPosition: [number, number];
}

export interface WorldSetupConfig {
  playerRegionId: number;
  playerSpawnPoint: [number, number];
  selectedSpawnPointId?: string;
  botCount: number;
}

