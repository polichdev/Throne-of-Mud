import { REGION_BOUNDS } from './worldLayout';
import type { RegionData, SpawnPointData } from '../types/game';

export const MAP_WIDTH = 384;
export const MAP_HEIGHT = 384;
export const MAP_SIZE = MAP_WIDTH;
export const ROYAL_REGION_ID = 5;
export const ROYAL_PLAZA_X = MAP_WIDTH / 2;
export const DEFAULT_MAP_SEED = 1234.56;

export function getPresetSpawnPoints(regionId: number): SpawnPointData[] {
  switch (regionId) {
    case 0:
      return [
        { id: 'sp-0-1', name: 'sp-0-1', position: [40, 35], description: '' },
        { id: 'sp-0-2', name: 'sp-0-2', position: [64, 70], description: '' },
        { id: 'sp-0-3', name: 'sp-0-3', position: [85, 120], description: '' },
      ];
    case 1:
      return [
        { id: 'sp-1-1', name: 'sp-1-1', position: [345, 35], description: '' },
        { id: 'sp-1-2', name: 'sp-1-2', position: [330, 70], description: '' },
        { id: 'sp-1-3', name: 'sp-1-3', position: [310, 120], description: '' },
      ];
    case 2:
      return [
        { id: 'sp-2-1', name: 'sp-2-1', position: [45, 250], description: '' },
        { id: 'sp-2-2', name: 'sp-2-2', position: [80, 285], description: '' },
        { id: 'sp-2-3', name: 'sp-2-3', position: [130, 335], description: '' },
      ];
    case 3:
      return [
        { id: 'sp-3-1', name: 'sp-3-1', position: [240, 250], description: '' },
        { id: 'sp-3-2', name: 'sp-3-2', position: [290, 285], description: '' },
        { id: 'sp-3-3', name: 'sp-3-3', position: [340, 335], description: '' },
      ];
    case 4:
      return [
        { id: 'sp-4-1', name: 'sp-4-1', position: [165, 35], description: '' },
        { id: 'sp-4-2', name: 'sp-4-2', position: [194, 70], description: '' },
        { id: 'sp-4-3', name: 'sp-4-3', position: [215, 120], description: '' },
      ];
    case 5:
      return [
        { id: 'sp-5-1', name: 'sp-5-1', position: [75, 208], description: '' },
        { id: 'sp-5-2', name: 'sp-5-2', position: [160, 208], description: '' },
        { id: 'sp-5-3', name: 'sp-5-3', position: [295, 208], description: '' },
      ];
    default:
      return [
        { id: 'sp-def', name: 'sp-def', position: [64, 60], description: '' },
      ];
  }
}

export const DEFAULT_REGIONS: RegionData[] = [
  {
    id: 0,
    name: 'Goldhof',
    ukrName: '',
    description: '',
    bounds: { ...REGION_BOUNDS[0] },
    center: [64, 92],
    spawnPoints: getPresetSpawnPoints(0),
    owner: 'player',
    lordName: '',
    lordTitle: '',
    heraldryColor: '#f59e0b',
    heraldryIcon: '👑',
    population: 3,
    approval: 80,
    wealth: 50,
    buildingsCount: 2,
    campPosition: [64, 60],
  },
  {
    id: 1,
    name: 'Waldau',
    ukrName: '',
    description: '',
    bounds: { ...REGION_BOUNDS[1] },
    center: [320, 92],
    spawnPoints: getPresetSpawnPoints(1),
    owner: 'bot',
    lordName: '',
    lordTitle: '',
    heraldryColor: '#dc2626',
    heraldryIcon: '⚔️',
    population: 3,
    approval: 75,
    wealth: 40,
    buildingsCount: 2,
    campPosition: [330, 65],
  },
  {
    id: 2,
    name: 'Eichenau',
    ukrName: '',
    description: '',
    bounds: { ...REGION_BOUNDS[2] },
    center: [96, 308],
    spawnPoints: getPresetSpawnPoints(2),
    owner: 'bot',
    lordName: '',
    lordTitle: '',
    heraldryColor: '#2563eb',
    heraldryIcon: '🛡️',
    population: 3,
    approval: 82,
    wealth: 60,
    buildingsCount: 2,
    campPosition: [80, 275],
  },
  {
    id: 3,
    name: 'Zweiau',
    ukrName: '',
    description: '',
    bounds: { ...REGION_BOUNDS[3] },
    center: [288, 308],
    spawnPoints: getPresetSpawnPoints(3),
    owner: 'bot',
    lordName: '',
    lordTitle: '',
    heraldryColor: '#16a34a',
    heraldryIcon: '🦅',
    population: 3,
    approval: 80,
    wealth: 50,
    buildingsCount: 2,
    campPosition: [290, 275],
  },
  {
    id: 4,
    name: 'Mittenwald',
    ukrName: '',
    description: '',
    bounds: { ...REGION_BOUNDS[4] },
    center: [192, 92],
    spawnPoints: getPresetSpawnPoints(4),
    owner: 'unclaimed',
    lordName: '',
    lordTitle: '',
    heraldryColor: '#65a30d',
    heraldryIcon: '🌲',
    population: 0,
    approval: 70,
    wealth: 30,
    buildingsCount: 0,
    campPosition: [192, 60],
  },
  {
    id: 5,
    name: 'Koenigsweg',
    ukrName: '',
    description: '',
    bounds: { ...REGION_BOUNDS[5] },
    center: [192, 208],
    spawnPoints: getPresetSpawnPoints(5),
    owner: 'unclaimed',
    lordName: '',
    lordTitle: '',
    heraldryColor: '#ea580c',
    heraldryIcon: '👑',
    population: 0,
    approval: 70,
    wealth: 30,
    buildingsCount: 0,
    campPosition: [160, 208],
  },
];

export const PRESET_BOT_LORDS = [
  {
    id: 'bot-1',
    name: '',
    title: '',
    color: '#dc2626',
    avatarColor: '#b91c1c',
    peasantColor: '#ef4444',
    heraldryIcon: '⚔️',
  },
  {
    id: 'bot-2',
    name: '',
    title: '',
    color: '#2563eb',
    avatarColor: '#1d4ed8',
    peasantColor: '#3b82f6',
    heraldryIcon: '🛡️',
  },
  {
    id: 'bot-3',
    name: '',
    title: '',
    color: '#16a34a',
    avatarColor: '#15803d',
    peasantColor: '#22c55e',
    heraldryIcon: '🦅',
  },
  {
    id: 'bot-4',
    name: '',
    title: '',
    color: '#7c3aed',
    avatarColor: '#6d28d9',
    peasantColor: '#8b5cf6',
    heraldryIcon: '🏰',
  },
];

export const BOT_IMMIGRANT_INITIAL_STATS = {
  moveSpeed: 1.35,
  gold: 4,
  needs: { hunger: 90, energy: 90, mood: 80, ale: 60, hygiene: 80 },
  skills: { farming: 5, woodcutting: 6, mining: 5, building: 6, cooking: 4, brewing: 3, combat: 3, intellect: 4, charisma: 4 },
  houseCompletionWealthReward: 15,
} as const;

export const CAMP_STRUCTURE_HEALTH = {
  campfire: 100,
  tent: 150,
  hitchingPost: 150,
} as const;

export const STARTING_UNIT_CONFIG = {
  defaultMoveSpeed: 1.35,
  playerKingGold: 35,
  playerPeasantGold: 3,
  botLordGold: 50,
  botPeasantGold: 5,
  foundingCampThought: {
    id: 'settled',
    text: '',
    modifier: 10,
    durationTicks: 2500,
  },
  defaultPlayerNeeds: {
    hunger: 85,
    energy: 90,
    mood: 75,
    ale: 60,
    hygiene: 80,
  },
  defaultBotLordNeeds: {
    hunger: 90,
    energy: 90,
    mood: 80,
    ale: 70,
    hygiene: 80,
  },
  defaultBotPeasantNeeds: {
    hunger: 85,
    energy: 90,
    mood: 75,
    ale: 60,
    hygiene: 80,
  },
} as const;
