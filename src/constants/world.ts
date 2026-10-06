import type { RegionData, SpawnPointData } from '../types/game';

export const MAP_WIDTH = 384;
export const MAP_HEIGHT = 384;
export const MAP_SIZE = MAP_WIDTH;
export const DEFAULT_MAP_SEED = 1234.56;

export function getPresetSpawnPoints(regionId: number): SpawnPointData[] {
  switch (regionId) {
    case 0:
      return [
        { id: 'sp-0-1', name: 'Серце долини', position: [40, 35], description: 'Простора рівнинна галявина в північній частині володіння' },
        { id: 'sp-0-2', name: 'Золоті луки', position: [64, 70], description: 'Центральне плато біля водойми та гаїв' },
        { id: 'sp-0-3', name: 'Прикордонний вигін', position: [85, 120], description: 'Родючі південні луки з легким доступом до лісів та шляху' },
      ];
    case 1:
      return [
        { id: 'sp-1-1', name: 'Мисливський бір', position: [345, 35], description: 'Угіддя посеред вікових дубів та сосен із багатими запасами дичини' },
        { id: 'sp-1-2', name: 'Дубова галявина', position: [330, 70], description: 'Центральна лісова височина з панорамним оглядом' },
        { id: 'sp-1-3', name: 'Соснове узлісся', position: [310, 120], description: 'Багатий лісовий бір біля торгового кордону' },
      ];
    case 2:
      return [
        { id: 'sp-2-1', name: 'Західні заплави', position: [45, 250], description: 'Затишний річковий вигін біля західного кордону' },
        { id: 'sp-2-2', name: 'Озерна затока', position: [80, 285], description: 'Мальовничий північний берег великого озера з багатим рибальством' },
        { id: 'sp-2-3', name: 'Вербовий берег', position: [130, 335], description: 'Родючі мулисті чорноземи для великих пшеничних нив та млинів' },
      ];
    case 3:
      return [
        { id: 'sp-3-1', name: 'Скельне передгір\'я', position: [240, 250], description: 'Міцне кам\'янисте узвишшя біля центрального південного тракту' },
        { id: 'sp-3-2', name: 'Кам\'яне плато', position: [290, 285], description: 'Природний скельний бастіон із багатими кам\'яними та залізними жилами' },
        { id: 'sp-3-3', name: 'Гірський бастіон', position: [340, 335], description: 'Стратегічна оборонна висота між гірськими кряжами' },
      ];
    case 4:
      return [
        { id: 'sp-4-1', name: 'Північна діброва', position: [165, 35], description: 'Праліс на півночі між володіннями Ґольдгофу та Вальдау' },
        { id: 'sp-4-2', name: 'Серце пущі', position: [194, 70], description: 'Затишна лісова галявина біля лісового озера' },
        { id: 'sp-4-3', name: 'Сонячна галявина', position: [215, 120], description: 'Стратегічне плато перед головним перехрестям' },
      ];
    case 5:
      return [
        { id: 'sp-5-1', name: 'Західна Застава', position: [75, 208], description: 'Західний форпост у мальовничій долині біля кордону Ґольдгофу та Айхенау' },
        { id: 'sp-5-2', name: 'Коронний Торговий Острог', position: [160, 208], description: 'Центральне коронне поселення у просторій галявині неподалік Королівського Тракту' },
        { id: 'sp-5-3', name: 'Східна Митниця', position: [295, 208], description: 'Східний торговий форпост біля рубежів Вальдау та Цвайау' },
      ];
    default:
      return [
        { id: 'sp-def', name: 'Центральний табір', position: [64, 60], description: 'Рівнинна галявина' },
      ];
  }
}

export const DEFAULT_REGIONS: RegionData[] = [
  {
    id: 0,
    name: 'Goldhof',
    ukrName: 'Ґольдгоф',
    description: 'Центральні родючі рівнини, багаті луки, помірний ліс. Ідеальне місце для серця королівства.',
    bounds: { minX: 0, maxX: 127, minZ: 0, maxZ: 183, regionId: 0 },
    center: [64, 92],
    spawnPoints: getPresetSpawnPoints(0),
    owner: 'player',
    lordName: 'Король Болеслав',
    lordTitle: 'Правитель земель',
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
    ukrName: 'Вальдау',
    description: 'Густі дубові та соснові бори, багаті мисливські угіддя та невичерпні запаси деревини.',
    bounds: { minX: 256, maxX: 383, minZ: 0, maxZ: 183, regionId: 1 },
    center: [320, 92],
    spawnPoints: getPresetSpawnPoints(1),
    owner: 'bot',
    lordName: 'Барон фон Берг',
    lordTitle: 'Лорд-завойовник',
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
    ukrName: 'Айхенау',
    description: 'Озерне узбережжя, річкові заплави та родючі ґрунти для пшеничних ланів та млинів. Розширені західні угіддя.',
    bounds: { minX: 0, maxX: 191, minZ: 232, maxZ: 383, regionId: 2 },
    center: [96, 308],
    spawnPoints: getPresetSpawnPoints(2),
    owner: 'bot',
    lordName: 'Леді Хільдеґард',
    lordTitle: 'Володарка лісів',
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
    ukrName: 'Цвайау',
    description: 'Скелясті височини, гірські вали, багаті поклади каменю та природні рубежі оборони. Розширені східні кряжі.',
    bounds: { minX: 192, maxX: 383, minZ: 232, maxZ: 383, regionId: 3 },
    center: [288, 308],
    spawnPoints: getPresetSpawnPoints(3),
    owner: 'bot',
    lordName: 'Герцог Вільгельм',
    lordTitle: 'Гірський ярл',
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
    ukrName: 'Міттенвальд',
    description: 'Заповідні праліси та пагорби між Ґольдгофом і Вальдау. Багаті на дичину та цінну деревину незаймані землі.',
    bounds: { minX: 128, maxX: 255, minZ: 0, maxZ: 183, regionId: 4 },
    center: [192, 92],
    spawnPoints: getPresetSpawnPoints(4),
    owner: 'unclaimed',
    lordName: 'Вільні Поселенці',
    lordTitle: 'Дикі землі',
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
    name: 'Königsweg',
    ukrName: 'Королівський Тракт',
    description: 'Головна торгова артерія королівства, що пролягає через усю країну зі сходу на захід. Стратегічний вузол для купців та збору мита.',
    bounds: { minX: 0, maxX: 383, minZ: 184, maxZ: 231, regionId: 5 },
    center: [192, 208],
    spawnPoints: getPresetSpawnPoints(5),
    owner: 'unclaimed',
    lordName: 'Коронна Варта',
    lordTitle: 'Торговий шлях',
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
    name: 'Барон фон Берг',
    title: 'Лорд-завойовник',
    color: '#dc2626',
    avatarColor: '#b91c1c',
    peasantColor: '#ef4444',
    heraldryIcon: '⚔️',
  },
  {
    id: 'bot-2',
    name: 'Леді Хільдеґард',
    title: 'Володарка лісів',
    color: '#2563eb',
    avatarColor: '#1d4ed8',
    peasantColor: '#3b82f6',
    heraldryIcon: '🛡️',
  },
  {
    id: 'bot-3',
    name: 'Герцог Вільгельм',
    title: 'Гірський ярл',
    color: '#16a34a',
    avatarColor: '#15803d',
    peasantColor: '#22c55e',
    heraldryIcon: '🦅',
  },
  {
    id: 'bot-4',
    name: 'Граф фон Райхенбах',
    title: 'Володар твердинь',
    color: '#7c3aed',
    avatarColor: '#6d28d9',
    peasantColor: '#8b5cf6',
    heraldryIcon: '🏰',
  },
];
