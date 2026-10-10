import type {
  GameTime,
  SeasonType,
  MonthName,
  WeatherType,
  BuildingType,
  ToolType,
  ResourceInventory,
  ResourceType,
  Job,
  ChronicleEvent,
  RegionData,
  ResourceDeposit,
  WorldSetupConfig,
  TradeRule,
  MilitiaSquad,
  MilitiaUnitType,
} from '../types/game';
import type { SupportedLanguage } from '../i18n/types';
import type { GridMap } from '../engine/grid/GridMap';
import type { DiplomacySlice } from '../types/diplomacy';

export type { DiplomacySlice } from '../types/diplomacy';
export * from '../types/diplomacy';

export interface TimeSlice {
  time: GameTime;
  setSpeedMultiplier: (speed: number) => void;
  togglePause: () => void;
  advanceTick: () => void;
  setSeason: (season: SeasonType) => void;
  setMonth: (month: MonthName) => void;
  setWeather: (weather: WeatherType, locked?: boolean) => void;
  setWeatherLocked: (locked: boolean) => void;
  triggerLightning: () => void;
  setSnowAccumulation: (val: number) => void;
  setTimeOfDay: (hour: number) => void;
  isWeatherDebugOpen: boolean;
  setIsWeatherDebugOpen: (open: boolean) => void;
}

export interface AudioSlice {
  audioSettings: {
    masterVolume: number;
    musicVolume: number;
    ambientVolume: number;
    sfxVolume: number;
    uiVolume: number;
    isMuted: boolean;
  };
  setMasterVolume: (val: number) => void;
  setMusicVolume: (val: number) => void;
  setAmbientVolume: (val: number) => void;
  setSfxVolume: (val: number) => void;
  setUiVolume: (val: number) => void;
  toggleMute: () => void;
  setMuted: (isMuted: boolean) => void;

  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

export interface UISlice {
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;
  activeBuildType: BuildingType | null;
  setActiveBuildType: (type: BuildingType | null) => void;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  roadEraseMode: boolean;
  setRoadEraseMode: (v: boolean) => void;
  hoveredTile: [number, number] | null;
  setHoveredTile: (tile: [number, number] | null) => void;
  buildRotation: number;
  setBuildRotation: (val: number | ((prev: number) => number)) => void;
  rotateBuilding: (direction?: 'cw' | 'ccw', step?: number) => void;

  previewAnimation: { entityId: string; anim: 'idle' | 'walk' | 'attack' | 'chop'; expiresAt: number } | null;
  triggerAnimation: (entityId: string, anim: 'idle' | 'walk' | 'attack' | 'chop', durationMs?: number) => void;

  cameraFocusTarget: [number, number] | null;
  setCameraFocusTarget: (pos: [number, number] | null) => void;
  cameraZoomTarget: number | null;
  setCameraZoomTarget: (zoom: number | null) => void;
  cameraAngleTarget: number | null;
  setCameraAngleTarget: (angle: number | null) => void;
  isStrategicView: boolean;
  setIsStrategicView: (val: boolean) => void;

  activeMenuTab: 'buildings' | 'military' | 'trade' | 'codex' | 'settings' | null;
  setActiveMenuTab: (tab: 'buildings' | 'military' | 'trade' | 'codex' | 'settings' | null) => void;

  isStrategicMapOpen: boolean;
  setIsStrategicMapOpen: (open: boolean) => void;
  focusOnRegion: (regionId: number) => void;

  isLordsBarOpen: boolean;
  toggleLordsBar: () => void;

  gameMode: 'menu' | 'playing';
  setGameMode: (mode: 'menu' | 'playing') => void;
  saveNotification: string | null;
  setSaveNotification: (msg: string | null) => void;
}

export interface SettlementSlice {
  resources: ResourceInventory;
  addResource: (type: ResourceType, amount: number) => void;
  consumeResource: (type: ResourceType, amount: number) => boolean;

  settlementName: string;
  setSettlementName: (name: string) => void;
  influence: number;
  royalFavor: number;

  pendingJobs: Job[];
  addPendingJob: (job: Job) => void;
  removePendingJob: (jobId: string) => void;

  activeTreeHits: Array<{ id: string; x: number; z: number; hitTime: number; intensity: number }>;
  registerTreeHit: (x: number, z: number, intensity?: number) => void;
  fallingTrees: Array<{ id: string; x: number; z: number; startTime: number; fallAngle: number; treeType: 'oak' | 'pine' | 'autumn' }>;
  registerTreeFall: (x: number, z: number, treeType?: 'oak' | 'pine' | 'autumn', fallAngle?: number) => void;

  assignWorkerToBuilding: (buildingId: string) => boolean;
  removeWorkerFromBuilding: (buildingId: string, workerId: string) => void;
  assignLordToBuilding: (buildingId: string, lordId: string | null) => void;
  setBuildingWage: (buildingId: string, wage: number) => void;
  callLevyMilitia: (lordId: string) => void;
  lordPreach: (lordId: string) => void;

  militiaSquads: MilitiaSquad[];
  selectedMilitiaSquadId: string | null;
  setSelectedMilitiaSquadId: (squadId: string | null) => void;
  createMilitiaSquad: (type: MilitiaUnitType, grid: GridMap) => MilitiaSquad | null;
  disbandMilitiaSquad: (squadId: string) => void;
  rallyMilitiaSquad: (squadId: string, grid: GridMap) => void;
  moveMilitiaSquad: (squadId: string, targetPos: [number, number], grid: GridMap) => void;
  clearMilitiaSquadMarch: (squadId: string) => void;
  syncMilitiaSquadsFromWorld: () => void;

  chronicle: ChronicleEvent[];
  addChronicleEvent: (event: Omit<ChronicleEvent, 'id' | 'timestamp' | 'gameDay' | 'gameHour'>) => void;

  buildingVersion: number;
  incrementBuildingVersion: () => void;
  foliageVersion: number;
  incrementFoliageVersion: (immediate?: boolean) => void;
  terrainVersion: number;
  incrementTerrainVersion: () => void;

  regions: RegionData[];
  playerRegionId: number;
  playerSpawnPoint: [number, number];
  botCount: number;
  updateRegionStats: (regionId: number, partial: Partial<RegionData>) => void;

  immigrationProgress: number;
  setImmigrationProgress: (val: number) => void;

  tradeRules: Record<ResourceType, TradeRule>;
  setTradeRule: (resource: ResourceType, partial: Partial<TradeRule>) => void;
  caravanStatus: {
    state: 'waiting' | 'approaching' | 'trading' | 'departing';
    merchantName?: string;
    nextArrivalHour?: number;
    nextArrivalMinute?: number;
    lastTradeSummary?: string;
  };
  setCaravanStatus: (status: Partial<SettlementSlice['caravanStatus']>) => void;

  resourceDeposits: ResourceDeposit[];
  updateResourceDeposit: (depositId: string, partial: Partial<ResourceDeposit>) => void;

  isInitialized: boolean;
  initWorld: (grid: GridMap, config?: WorldSetupConfig) => void;
  resetWorld: (grid: GridMap, config?: WorldSetupConfig) => void;
}

export type GameState = TimeSlice & AudioSlice & UISlice & SettlementSlice & DiplomacySlice;
