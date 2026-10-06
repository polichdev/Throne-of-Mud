import type { StateCreator } from 'zustand';
import type { ChronicleEvent, WorldSetupConfig } from '../../types/game';
import { GridMap } from '../../engine/grid/GridMap';
import { world, characterEntities, buildingEntities } from '../../engine/ecs/world';
import { BUILDING_BLUEPRINTS } from '../../engine/buildings/blueprints';
import {
  INITIAL_RESOURCES,
  STARTING_INFLUENCE,
  STARTING_ROYAL_FAVOR,
  MIN_BUILDING_WAGE,
  MAX_BUILDING_WAGE,
} from '../../constants/economy';
import { DEFAULT_REGIONS } from '../../constants/world';
import { getTargetSnowAccumulation } from '../../constants/time';
import { INITIAL_RESOURCE_DEPOSITS } from '../../engine/resources/ResourceDeposits';
import {
  assignWorkerToBuilding as assignWorkerHelper,
  dismissWorkerFromBuilding as dismissWorkerHelper,
} from '../../engine/ecs/entityHelpers';
import { initializeWorldEntities } from '../../engine/world/worldInitializer';
import { BotAISystem } from '../../engine/ecs/systems/BotAISystem';
import { BanditAISystem } from '../../engine/ecs/systems/BanditAISystem';
import { DEFAULT_TRADE_RULES } from '../../engine/trade/tradeConfig';
import { clearBuildingFrameStates } from '../../components/canvas/BuildingsRenderer';
import type { GameState, SettlementSlice } from '../types';

export type { SettlementSlice };

export const createSettlementSlice: StateCreator<GameState, [], [], SettlementSlice> = (set, get) => {
  let pendingBuildingVersion = false;
  let foliageDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  return {
  resources: { ...INITIAL_RESOURCES },

  addResource: (type, amount) => {
    set((state) => ({
      resources: {
        ...state.resources,
        [type]: Math.max(0, (state.resources[type] || 0) + amount),
      },
    }));
  },

  consumeResource: (type, amount) => {
    const current = get().resources[type] || 0;
    if (current >= amount) {
      set((state) => ({
        resources: {
          ...state.resources,
          [type]: current - amount,
        },
      }));

      const playerRegionId = get().playerRegionId ?? 0;
      let remainingToDeduct = amount;
      for (const b of buildingEntities) {
        if (
          b.isBuilding &&
          (b.factionId === 'player' || (!b.factionId && (b.regionId === undefined || b.regionId === playerRegionId))) &&
          b.localInventory &&
          (b.localInventory[type] || 0) > 0
        ) {
          const deduct = Math.min(remainingToDeduct, b.localInventory[type] || 0);
          b.localInventory[type] = (b.localInventory[type] || 0) - deduct;
          remainingToDeduct -= deduct;
          if (remainingToDeduct <= 0) break;
        }
      }

      return true;
    }
    return false;
  },

  settlementName: 'GOLDHOF',
  setSettlementName: (name) => set({ settlementName: name }),
  influence: STARTING_INFLUENCE,
  royalFavor: STARTING_ROYAL_FAVOR,

  pendingJobs: [],
  addPendingJob: (job) => {
    set((state) => {
      const exists = state.pendingJobs.some(
        (j) =>
          j.type === job.type &&
          j.targetPosition?.[0] === job.targetPosition?.[0] &&
          j.targetPosition?.[1] === job.targetPosition?.[1]
      );
      if (exists) return state;
      return { pendingJobs: [...state.pendingJobs, job] };
    });
  },

  removePendingJob: (jobId) => {
    set((state) => ({
      pendingJobs: state.pendingJobs.filter((j) => j.id !== jobId),
    }));
  },

  activeTreeHits: [],
  registerTreeHit: (x: number, z: number, intensity = 1.0) => {
    const now = performance.now() / 1000;
    set((state) => {
      const freshHits = state.activeTreeHits.filter((h) => now - h.hitTime < 2.5);
      return {
        activeTreeHits: [
          ...freshHits,
          { id: `${x.toFixed(2)}_${z.toFixed(2)}_${now.toFixed(3)}`, x, z, hitTime: now, intensity },
        ].slice(-8),
      };
    });
  },

  fallingTrees: [],
  registerTreeFall: (x: number, z: number, treeType = 'oak', fallAngle = Math.random() * Math.PI * 2) => {
    const now = performance.now() / 1000;
    set((state) => {
      const freshFalling = state.fallingTrees.filter((f) => now - f.startTime < 3.0);
      return {
        fallingTrees: [
          ...freshFalling,
          { id: `fall_${x}_${z}_${now}`, x, z, startTime: now, fallAngle, treeType },
        ],
      };
    });
  },

  assignWorkerToBuilding: (buildingId: string) => {
    const building = world.entities.find((e) => e.id === buildingId);
    if (!building || !building.isBuilding || !building.buildingType) return false;

    const { playerRegionId } = get();
    if (building.factionId && building.factionId !== 'player') return false;
    if (building.regionId !== undefined && building.regionId !== playerRegionId) return false;

    const blueprint = BUILDING_BLUEPRINTS[building.buildingType];
    const maxSlots = building.workerSlots ?? blueprint?.workSlots ?? 1;
    const currentWorkers = building.assignedWorkers || [];

    if (currentWorkers.length >= maxSlots) {
      return false;
    }

    const availablePeasant = Array.from(characterEntities).find(
      (c) =>
        c.characterClass === 'peasant' &&
        !c.workBuildingId &&
        !c.isLevy &&
        (c.factionId === 'player' || c.factionId === undefined) &&
        (c.regionId === playerRegionId || c.regionId === undefined)
    );

    if (!availablePeasant) {
      return false;
    }

    if (building.wage === undefined) {
      building.wage = blueprint?.defaultWage ?? 2;
    }

    assignWorkerHelper(building, availablePeasant, get().time.tick || 0);

    get().addChronicleEvent({
      title: 'Нове призначення',
      description: `${availablePeasant.name} призначений робітником у ${building.name}.`,
      type: 'info',
    });

    set((state) => ({ ...state }));
    return true;
  },

  removeWorkerFromBuilding: (buildingId: string, workerId: string) => {
    const building = world.entities.find((e) => e.id === buildingId);
    const worker = world.entities.find((e) => e.id === workerId);
    if (building && worker) {
      dismissWorkerHelper(building, worker, get().time.tick || 0);
      get().addChronicleEvent({
        title: 'Звільнення з роботи',
        description: `${worker.name} більше не працює у ${building?.name || 'споруді'}.`,
        type: 'info',
      });
    }
    set((state) => ({ ...state }));
  },

  assignLordToBuilding: (buildingId: string, lordId: string | null) => {
    const building = world.entities.find((e) => e.id === buildingId);
    if (!building) return;

    const { playerRegionId } = get();
    if (building.factionId && building.factionId !== 'player') return;
    if (building.regionId !== undefined && building.regionId !== playerRegionId) return;

    if (building.assignedLordId && building.assignedLordId !== lordId) {
      const oldLord = world.entities.find((e) => e.id === building.assignedLordId);
      if (oldLord) {
        oldLord.currentJob = { id: `idle-${oldLord.id}`, type: 'idle', progress: 0, totalWork: 0 };
      }
    }

    building.assignedLordId = lordId || undefined;

    if (lordId) {
      const lord = world.entities.find((e) => e.id === lordId);
      if (lord) {
        if (building.gridPosition) {
          lord.currentJob = {
            id: `supervise-${lord.id}`,
            type: 'work_at_building',
            targetBuildingId: buildingId,
            targetPosition: building.gridPosition,
            progress: 0,
            totalWork: 100,
          };
        }
        lord.speechBubble = {
          text: `Наглядаю за виробництвом: ${building.name}`,
          expiresAtTick: (get().time.tick || 0) + 35,
          type: 'work',
        };

        get().addChronicleEvent({
          title: 'Шляхетний нагляд',
          description: `${lord.name} призначений наглядачем у ${building.name}. Продуктивність зросла!`,
          type: 'success',
        });
      }
    }

    set((state) => ({ ...state }));
  },

  setBuildingWage: (buildingId: string, wage: number) => {
    const building = world.entities.find((e) => e.id === buildingId);
    if (building) {
      building.wage = Math.max(MIN_BUILDING_WAGE, Math.min(MAX_BUILDING_WAGE, wage));
      set((state) => ({ ...state }));
    }
  },

  callLevyMilitia: (lordId: string) => {
    const lord = world.entities.find((e) => e.id === lordId);
    if (!lord) return;

    const existingMilitia = Array.from(characterEntities).filter(
      (c) => c.isLevy && c.commandingLordId === lordId
    );

    const tick = get().time.tick || 0;

    if (existingMilitia.length > 0) {
      for (const levy of existingMilitia) {
        levy.isLevy = false;
        levy.commandingLordId = undefined;
        levy.speechBubble = {
          text: 'Ополчення розпущено, повертаюсь до мирного життя',
          expiresAtTick: tick + 30,
          type: 'work',
        };
      }
      lord.speechBubble = {
        text: 'Ополчення розпущено.',
        expiresAtTick: tick + 25,
        type: 'alert',
      };
      get().addChronicleEvent({
        title: 'Ополчення розпущено',
        description: `${lord.name} розпустив селянське ополчення.`,
        type: 'info',
      });
    } else {
      const freePeasants = Array.from(characterEntities)
        .filter((c) => c.characterClass === 'peasant' && !c.isLevy)
        .slice(0, 3);

      if (freePeasants.length === 0) {
        lord.speechBubble = {
          text: 'Немає вільних селян для ополчення!',
          expiresAtTick: tick + 25,
          type: 'alert',
        };
        return;
      }

      for (const peasant of freePeasants) {
        peasant.isLevy = true;
        peasant.commandingLordId = lordId;
        peasant.speechBubble = {
          text: 'Стаю під стяги мого Лорда!',
          expiresAtTick: tick + 35,
          type: 'alert',
        };
        if (!peasant.thoughts) peasant.thoughts = [];
        peasant.thoughts = peasant.thoughts.filter((t) => t.id !== 'levy');
        peasant.thoughts.push({
          id: 'levy',
          text: 'Скликаний до ополчення (-5)',
          modifier: -5,
          durationTicks: 1500,
        });
      }

      lord.speechBubble = {
        text: 'До зброї, селяни! Захистимо наш трон!',
        expiresAtTick: tick + 40,
        type: 'alert',
      };

      get().addChronicleEvent({
        title: 'Скликано ополчення!',
        description: `${lord.name} зібрав загін із ${freePeasants.length} селян-ополченців.`,
        type: 'warning',
      });
    }

    set((state) => ({ ...state }));
  },

  lordPreach: (lordId: string) => {
    const lord = world.entities.find((e) => e.id === lordId);
    if (!lord) return;

    const tick = get().time.tick || 0;
    lord.speechBubble = {
      text: 'Покора Лорду — благословення Небес!',
      expiresAtTick: tick + 35,
      type: 'mood',
    };

    let blessedCount = 0;
    for (const peasant of characterEntities) {
      if (peasant.characterClass === 'peasant' && peasant.needs) {
        blessedCount++;
        peasant.needs.mood = Math.min(100, peasant.needs.mood + 15);
        if (!peasant.thoughts) peasant.thoughts = [];
        peasant.thoughts = peasant.thoughts.filter((t) => t.id !== 'preach');
        peasant.thoughts.push({
          id: 'preach',
          text: 'Натхненний проповіддю Лорда (+15)',
          modifier: 15,
          durationTicks: 1200,
        });
        peasant.speechBubble = {
          text: 'Слава Господу і нашому королю!',
          expiresAtTick: tick + 30,
          type: 'mood',
        };
      }
    }

    get().addChronicleEvent({
      title: 'Проповідь Лорда',
      description: `${lord.name} провів проповідь. Дух селян зміцнився!`,
      type: 'success',
    });

    set((state) => ({ ...state }));
  },

  chronicle: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      gameDay: 1,
      gameHour: 7,
      title: 'Заснування Трону з Грязі',
      description: 'Король Болеслав прибув на болотисті землі разом зі шляхтою та першими поселенцями.',
      type: 'info',
    },
  ],

  addChronicleEvent: (event) => {
    const { time } = get();
    const newEvent: ChronicleEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
      gameDay: time.day,
      gameHour: time.hour,
    };
    set((state) => ({
      chronicle: [newEvent, ...state.chronicle].slice(0, 50),
    }));
  },

  buildingVersion: 0,
  incrementBuildingVersion: () => {
    if (!pendingBuildingVersion) {
      pendingBuildingVersion = true;
      queueMicrotask(() => {
        pendingBuildingVersion = false;
        set((state) => ({ buildingVersion: state.buildingVersion + 1 }));
      });
    }
  },

  foliageVersion: 0,
  incrementFoliageVersion: (immediate?: boolean) => {
    if (immediate) {
      if (foliageDebounceTimer) {
        clearTimeout(foliageDebounceTimer);
        foliageDebounceTimer = null;
      }
      set((state) => ({ foliageVersion: state.foliageVersion + 1 }));
      return;
    }
    if (foliageDebounceTimer) {
      clearTimeout(foliageDebounceTimer);
    }
    foliageDebounceTimer = setTimeout(() => {
      foliageDebounceTimer = null;
      set((state) => ({ foliageVersion: state.foliageVersion + 1 }));
    }, 150);
  },

  terrainVersion: 0,
  incrementTerrainVersion: () => {
    set((state) => ({ terrainVersion: state.terrainVersion + 1 }));
  },

  regions: JSON.parse(JSON.stringify(DEFAULT_REGIONS)),
  playerRegionId: 0,
  playerSpawnPoint: [52, 52],
  botCount: 3,
  updateRegionStats: (regionId, partial) => {
    set((state) => {
      const target = state.regions.find((r) => r.id === regionId);
      if (!target) return state;
      let changed = false;
      for (const [k, v] of Object.entries(partial)) {
        if ((target as any)[k] !== v) {
          changed = true;
          break;
        }
      }
      if (!changed) return state;
      return {
        regions: state.regions.map((r) => (r.id === regionId ? { ...r, ...partial } : r)),
      };
    });
  },

  immigrationProgress: 0,
  setImmigrationProgress: (val) => set({ immigrationProgress: Math.max(0, Math.min(100, val)) }),

  tradeRules: { ...DEFAULT_TRADE_RULES },
  setTradeRule: (resource, partial) => {
    set((state) => ({
      tradeRules: {
        ...state.tradeRules,
        [resource]: {
          ...(state.tradeRules[resource] || { resource, mode: 'none', targetStock: 30 }),
          ...partial,
        },
      },
    }));
  },

  caravanStatus: {
    state: 'waiting',
    merchantName: 'Альбрехт з Аугсбурга',
    nextArrivalHour: 11,
    nextArrivalMinute: 30,
  },
  setCaravanStatus: (status) => {
    set((state) => ({
      caravanStatus: {
        ...state.caravanStatus,
        ...status,
      },
    }));
  },

  resourceDeposits: INITIAL_RESOURCE_DEPOSITS,
  updateResourceDeposit: (depositId, partial) => {
    set((state) => ({
      resourceDeposits: state.resourceDeposits.map((d) =>
        d.id === depositId ? { ...d, ...partial } : d
      ),
    }));
    const entity = world.entities.find((e) => e.id === depositId);
    if (entity) {
      if (partial.currentAmount !== undefined) entity.resourceAmount = partial.currentAmount;
      if (partial.maxAmount !== undefined) entity.maxResourceAmount = partial.maxAmount;
    }
  },

  isInitialized: false,
  initWorld: (grid: GridMap, config?: WorldSetupConfig) => {
    BotAISystem.reset();
    BanditAISystem.reset();
    clearBuildingFrameStates();
    const result = initializeWorldEntities(grid, config, get().playerRegionId, get().botCount);

    set({
      isInitialized: true,
      selectedEntityId: null,
      playerRegionId: result.playerRegionId,
      playerSpawnPoint: result.playerSpawnPoint,
      botCount: result.botCount,
      regions: result.regions,
      settlementName: result.settlementName,
      cameraFocusTarget: result.cameraFocusTarget,
      isStrategicMapOpen: false,
      resourceDeposits: result.resourceDeposits,
    });
    get().incrementBuildingVersion();
    get().incrementTerrainVersion();
    get().incrementFoliageVersion(true);
  },

  resetWorld: (grid: GridMap, config?: WorldSetupConfig) => {
    BotAISystem.reset();
    BanditAISystem.reset();
    clearBuildingFrameStates();
    grid.clearAllRoads();
    grid.generate(Date.now() % 100000 + Math.random() * 500);
    grid.isFullTerrainDirty = true;
    grid.dirtyTerrainCoords = [];

    set({
      resources: { ...INITIAL_RESOURCES },
      time: {
        tick: 0,
        day: 1,
        dayOfMonth: 1,
        month: 'March',
        monthIndex: 0,
        monthInSeason: 0,
        year: 1,
        hour: 7,
        minute: 0,
        season: 'Spring',
        weather: 'clear',
        targetWeather: 'clear',
        nextWeather: 'clear',
        isWeatherLocked: false,
        rainIntensity: 0,
        stormIntensity: 0,
        snowIntensity: 0,
        snowAccumulation: getTargetSnowAccumulation('Spring', 1, 7, 0),
        lightningFlash: 0,
        speedMultiplier: 1,
        isPaused: false,
      },
      influence: STARTING_INFLUENCE,
      royalFavor: STARTING_ROYAL_FAVOR,
      pendingJobs: [],
      activeTool: 'select',
      activeBuildType: null,
      activeMenuTab: null,
      chronicle: [
        {
          id: 'init-1',
          timestamp: new Date().toLocaleTimeString(),
          gameDay: 1,
          gameHour: 7,
          title: 'Заснування Трону з Грязі',
          description: 'Король Болеслав прибув на болотисті землі разом зі шляхтою та першими поселенцями.',
          type: 'info',
        },
      ],
      immigrationProgress: 0,
      isLordsBarOpen: false,
      isInitialized: true,
      isStrategicMapOpen: false,
    });

    get().initWorld(grid, config);
    get().incrementBuildingVersion();
    get().incrementTerrainVersion();
    get().incrementFoliageVersion(true);
  },
  };
};
