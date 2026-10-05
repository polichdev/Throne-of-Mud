import { GridMap } from '../../grid/GridMap';
import { world, characterEntities, buildingEntities, type GameEntity } from '../world';
import { useGameStore } from '../../../store/useGameStore';
import { AStar } from '../../pathfinding/AStar';
import { getSmartRoadPath, isRoadPathValid } from '../../grid/roadGeneration';
import { BUILDING_BLUEPRINTS } from '../../buildings/blueprints';
import { isOverlappingResourceDeposit } from '../../buildings/buildingValidation';
import { getBuildingDoorInfo } from '../../buildings/buildingNavigation';
import { HaulingJobHandler } from './jobs/HaulingJobHandler';
import type { BuildingType, ResourceDeposit, ResourceType, RegionData } from '../../../types/game';
import {
  BOT_AI_TICK_INTERVAL,
  BOT_AI_WORKER_ASSIGN_INTERVAL,
  BOT_AI_IMMIGRATION_INTERVAL,
  BOT_AI_BUILD_DECISION_INTERVAL,
  BOT_AI_MAX_PEASANTS,
  BOT_AI_STARTING_WOOD,
  BOT_AI_STARTING_STONE,
  BOT_AI_STARTING_GOLD,
  BOT_AI_STARTING_FOOD,
  BOT_AI_STARTING_IRON,
  BOT_AI_PEASANT_MOVE_SPEED,
  BOT_AI_RESOURCE_GEN_CHANCE,
  BOT_AI_GATHER_CHANCE,
  BOT_AI_TERRAIN_MAX_HEIGHT_DIFF,
} from '../../../constants/ai';
import { DEFAULT_WAGE, DEFAULT_SPEECH_BUBBLE_TICKS } from '../../../constants/economy';
import { isNoble } from '../entityHelpers';

interface BotRealmMemory {
  wood: number;
  stone: number;
  gold: number;
  food: number;
  iron: number;
  buildStage: number;
  lastActionTick: number;
  lastWorkerAssignTick: number;
  lastImmigrationTick: number;
  hasPavedHighwayRoad?: boolean;
}

const UKRAINIAN_NAMES_MALE = [
  'Тарас', 'Богдан', 'Остап', 'Яромир', 'Михайло',
  'Любомир', 'Дмитро', 'Назар', 'Степан', 'Василь',
  'Олесь', 'Гриць', 'Юрко', 'Іван', 'Святослав', 'Данило', 'Матвій',
];

const UKRAINIAN_NAMES_FEMALE = [
  'Одарка', 'Мирослава', 'Соломія', 'Ганна', 'Марічка',
  'Катерина', 'Богдана', 'Ярослава', 'Оксана', 'Наталка', 'Роксолана',
];

const PEASANT_COLORS = [
  '#3b82f6', '#10b981', '#06b6d4', '#8b5cf6',
  '#f97316', '#14b8a6', '#84cc16', '#0284c7', '#ec4899', '#f43f5e',
];

const PROFESSION_TITLES: Partial<Record<BuildingType, string>> = {
  lumberjack_hut: 'Лісоруб',
  wheat_farm: 'Хлібороб',
  windmill: 'Мірошник',
  bakery: 'Пекар',
  brewery: 'Пивовар',
  fishermans_hut: 'Рибалка',
  foragers_hut: 'Збирач ягід',
  hunters_hut: 'Мисливець',
  iron_mine: 'Гірник',
  stone_quarry: 'Каменяр',
  clay_pit: 'Гончар',
  salt_works: 'Солевар',
  charcoal_kiln: 'Вугляр',
  iron_smelter: 'Плавильник',
  stonecutter: 'Тесляр каменю',
  brickworks: 'Цегляр',
  sawmill: 'Тесляр',
  weavers_workshop: 'Ткач',
  foresters_hut: 'Лісник',
  wooden_church: 'Священник',
  tavern: 'Шинкар',
  barracks: 'Вартовий',
  market: 'Крамар',
  stockpile: 'Носій',
};

function consumeResourcesFromBotSettlement(
  buildings: GameEntity[],
  woodNeeded: number,
  stoneNeeded: number
): void {
  let remWood = woodNeeded;
  let remStone = stoneNeeded;

  const storageBuildings = buildings.filter(
    (b) =>
      b.isCompleted &&
      b.localInventory &&
      (b.buildingType === 'stockpile' ||
        b.buildingType === 'sawmill' ||
        b.buildingType === 'lumberjack_hut' ||
        b.buildingType === 'foresters_hut' ||
        b.buildingType === 'stone_quarry' ||
        b.buildingType === 'stonecutter')
  );

  storageBuildings.sort((a, b) => (a.buildingType === 'stockpile' ? -1 : b.buildingType === 'stockpile' ? 1 : 0));

  for (const b of storageBuildings) {
    if (!b.localInventory) continue;

    if (remWood > 0) {
      if ((b.localInventory.planks || 0) > 0) {
        const take = Math.min(remWood, b.localInventory.planks || 0);
        b.localInventory.planks = (b.localInventory.planks || 0) - take;
        if (b.localInventory.planks <= 0) delete b.localInventory.planks;
        remWood -= take;
      }
      if (remWood > 0 && (b.localInventory.wood || 0) > 0) {
        const take = Math.min(remWood, b.localInventory.wood || 0);
        b.localInventory.wood = (b.localInventory.wood || 0) - take;
        if (b.localInventory.wood <= 0) delete b.localInventory.wood;
        remWood -= take;
      }
    }

    if (remStone > 0) {
      if ((b.localInventory.cut_stone || 0) > 0) {
        const take = Math.min(remStone, b.localInventory.cut_stone || 0);
        b.localInventory.cut_stone = (b.localInventory.cut_stone || 0) - take;
        if (b.localInventory.cut_stone <= 0) delete b.localInventory.cut_stone;
        remStone -= take;
      }
      if (remStone > 0 && (b.localInventory.stone || 0) > 0) {
        const take = Math.min(remStone, b.localInventory.stone || 0);
        b.localInventory.stone = (b.localInventory.stone || 0) - take;
        if (b.localInventory.stone <= 0) delete b.localInventory.stone;
        remStone -= take;
      }
    }

    if (remWood <= 0 && remStone <= 0) break;
  }
}

export class BotAISystem {
  private static botMemories: Map<string, BotRealmMemory> = new Map();
  public static failedGoals: Map<string, number> = new Map();

  public static reset() {
    this.botMemories.clear();
    this.failedGoals.clear();
    this.failedRoadConnections.clear();
  }

  public static addResource(factionId: string, resType: ResourceType, amount: number): void {
    let memory = this.botMemories.get(factionId);
    if (!memory) {
      const regionId = parseInt(factionId.replace('bot-', ''), 10);
      if (!isNaN(regionId)) {
        memory = {
          wood: BOT_AI_STARTING_WOOD,
          stone: BOT_AI_STARTING_STONE,
          gold: BOT_AI_STARTING_GOLD,
          food: BOT_AI_STARTING_FOOD,
          iron: BOT_AI_STARTING_IRON,
          buildStage: 0,
          lastActionTick: 0,
          lastWorkerAssignTick: 0,
          lastImmigrationTick: 0,
        };
        this.botMemories.set(factionId, memory);
      }
    }
    if (!memory) return;
    if (resType === 'wood' || resType === 'planks') memory.wood += amount;
    else if (resType === 'stone' || resType === 'cut_stone') memory.stone += amount;
    else if (resType === 'iron' || resType === 'iron_ore') memory.iron += amount;
    else if (
      resType === 'bread' ||
      resType === 'wheat' ||
      resType === 'fish' ||
      resType === 'berries' ||
      resType === 'meat' ||
      resType === 'flour'
    )
      memory.food += amount;
    else if (resType === 'gold') memory.gold += amount;
  }

  private static failedRoadConnections = new Map<string, number>();

  private static connectBuildingToRoadNetwork(
    building: GameEntity,
    grid: GridMap,
    region: RegionData,
    resourceDeposits: ResourceDeposit[],
    currentTick: number = 0
  ): boolean {
    const failedAt = BotAISystem.failedRoadConnections.get(building.id);
    if (failedAt !== undefined && currentTick - failedAt < 180) {
      return false;
    }

    const bPos = building.gridPosition || (building.position ? [Math.floor(building.position[0]), Math.floor(building.position[2])] : null);
    if (!bPos) return false;

    const bWidth = building.buildingWidth || 2;
    const bHeight = building.buildingHeight || 2;
    const bx = bPos[0];
    const bz = bPos[1];

    for (let x = bx - 1; x <= bx + bWidth; x++) {
      for (let z = bz - 1; z <= bz + bHeight; z++) {
        if (x >= bx && x < bx + bWidth && z >= bz && z < bz + bHeight) continue;
        const t = grid.getTile(x, z);
        if (t && t.terrain === 'road' && !t.buildingId) {
          return false;
        }
      }
    }

    let approachPos: [number, number] | null = null;
    try {
      const doorInfo = getBuildingDoorInfo(building);
      if (doorInfo && doorInfo.doorApproachPos) {
        const [ax, az] = doorInfo.doorApproachPos;
        const t = grid.getTile(ax, az);
        if (t && t.terrain !== 'water' && !t.buildingId) {
          approachPos = [ax, az];
        }
      }
    } catch (_) {}

    if (!approachPos) {
      const candidates: [number, number][] = [];
      for (let x = bx; x < bx + bWidth; x++) {
        candidates.push([x, bz - 1], [x, bz + bHeight]);
      }
      for (let z = bz; z < bz + bHeight; z++) {
        candidates.push([bx - 1, z], [bx + bWidth, z]);
      }
      for (let x = bx; x < bx + bWidth; x++) {
        candidates.push([x, bz - 2], [x, bz + bHeight + 1]);
      }
      for (let z = bz; z < bz + bHeight; z++) {
        candidates.push([bx - 2, z], [bx + bWidth + 1, z]);
      }

      for (const [cx, cz] of candidates) {
        const t = grid.getTile(cx, cz);
        if (t && t.terrain !== 'water' && !t.buildingId) {
          approachPos = [cx, cz];
          break;
        }
      }
    }

    if (!approachPos) {
      BotAISystem.failedRoadConnections.set(building.id, currentTick);
      return false;
    }

    let nearestRoad: [number, number] | null = null;
    let minDistSq = Infinity;

    for (const coord of grid.roadCoords) {
      const rx = Math.floor(coord / grid.width);
      const rz = coord % grid.width;
      if (GridMap.isCoordInRegion(region.id, rx, rz, 0)) {
        const t = grid.getTile(rx, rz);
        if (t && t.terrain === 'road' && !t.buildingId) {
          const dSq = (rx - approachPos[0]) ** 2 + (rz - approachPos[1]) ** 2;
          if (dSq < minDistSq) {
            minDistSq = dSq;
            nearestRoad = [rx, rz];
          }
        }
      }
    }

    if (!nearestRoad) {
      const camp = region.campPosition || region.center;
      nearestRoad = [camp[0] + 2, camp[1]];
    }

    const bRoadPath = getSmartRoadPath(
      grid,
      approachPos[0],
      approachPos[1],
      nearestRoad[0],
      nearestRoad[1],
      (px, pz) => GridMap.isCoordInRegion(region.id, px, pz, 0),
      resourceDeposits
    );

    let pavedAny = false;
    if (bRoadPath.length > 0) {
      for (const [px, pz] of bRoadPath) {
        const t = grid.getTile(px, pz);
        if (t && t.terrain !== 'water' && !t.buildingId) {
          if (grid.paveRoad(px, pz, resourceDeposits)) {
            pavedAny = true;
          }
        }
      }
    }

    if (pavedAny) {
      BotAISystem.failedRoadConnections.delete(building.id);
    } else {
      BotAISystem.failedRoadConnections.set(building.id, currentTick);
    }

    return pavedAny;
  }

  public static update(grid: GridMap, currentTick: number): void {
    const {
      time,
      regions,
      resourceDeposits = [],
      incrementBuildingVersion,
      incrementFoliageVersion,
      addChronicleEvent,
      updateRegionStats,
    } = useGameStore.getState();

    const isNightTime = time ? (time.hour >= 20 || time.hour < 6) : false;

    const botRegions = regions.filter((r) => r.owner === 'bot');

    const camTarget = (typeof window !== 'undefined' ? (window as any).__lastCameraTarget : null) as [number, number] | null;
    let wanderingPathBudget = 1;

    for (const region of botRegions) {
      const regCenter = region.campPosition || region.center;
      const isRegionOffscreen = camTarget ? ((regCenter[0] - camTarget[0]) ** 2 + (regCenter[1] - camTarget[1]) ** 2 > 55 * 55) : false;
      const tickInterval = isRegionOffscreen ? BOT_AI_TICK_INTERVAL * 2 : BOT_AI_TICK_INTERVAL;
      if ((currentTick + region.id * 3) % tickInterval !== 0) continue;

      const botFactionId = `bot-${region.id}`;
      let memory = this.botMemories.get(botFactionId);
      if (!memory) {
        memory = {
          wood: BOT_AI_STARTING_WOOD,
          stone: BOT_AI_STARTING_STONE,
          gold: BOT_AI_STARTING_GOLD,
          food: BOT_AI_STARTING_FOOD,
          iron: BOT_AI_STARTING_IRON,
          buildStage: 0,
          lastActionTick: currentTick - (80 - (region.id + 1) * 20),
          lastWorkerAssignTick: currentTick,
          lastImmigrationTick: currentTick,
        };
        this.botMemories.set(botFactionId, memory);
      }

      if (!memory.hasPavedHighwayRoad) {
        memory.hasPavedHighwayRoad = true;
        const camp = region.campPosition || region.center;
        const hwX = GridMap.getHighwayX(camp[1]);
        const hwZ = GridMap.getHighwayZ(camp[0]);
        const distNS = Math.abs(camp[0] - hwX);
        const distEW = Math.abs(camp[1] - hwZ);
        const distPlaza = Math.hypot(camp[0] - 127.5, camp[1] - 127.5);

        let targetX = Math.round(hwX);
        let targetZ = camp[1];
        if (distEW < distNS && distEW < distPlaza) {
          targetX = camp[0];
          targetZ = Math.round(hwZ);
        } else if (distPlaza < distNS && distPlaza < distEW) {
          targetX = 128;
          targetZ = 128;
        }

        const campRoadEntrance: [number, number] = [camp[0] + 2, camp[1]];
        const campRoadCourtyard: [number, number] = [camp[0] - 1, camp[1]];

        const hPath = getSmartRoadPath(
          grid,
          targetX,
          targetZ,
          campRoadEntrance[0],
          campRoadEntrance[1],
          (px, pz) => GridMap.isCoordInRegion(region.id, px, pz, 0),
          resourceDeposits
        );
        let anyPaved = false;
        if (isRoadPathValid(grid, hPath, resourceDeposits)) {
          for (const [px, pz] of hPath) {
            if (grid.paveRoad(px, pz, resourceDeposits)) anyPaved = true;
          }
        }

        const campInternal = getSmartRoadPath(
          grid,
          campRoadEntrance[0],
          campRoadEntrance[1],
          campRoadCourtyard[0],
          campRoadCourtyard[1],
          (px, pz) => GridMap.isCoordInRegion(region.id, px, pz, 0),
          resourceDeposits
        );
        if (isRoadPathValid(grid, campInternal, resourceDeposits)) {
          for (const [px, pz] of campInternal) {
            if (grid.paveRoad(px, pz, resourceDeposits)) anyPaved = true;
          }
        }

        if (anyPaved) {
          incrementBuildingVersion();
          incrementFoliageVersion();
        }
      }

      const botUnits: GameEntity[] = [];
      for (const e of characterEntities) {
        if (e.factionId === botFactionId || (e.regionId === region.id && e.factionId !== 'player')) {
          botUnits.push(e);
        }
      }

      const botBuildings: GameEntity[] = [];
      for (const e of buildingEntities) {
        if (e.regionId === region.id || e.factionId === botFactionId) {
          botBuildings.push(e);
        }
      }

      if (currentTick % 30 === (region.id * 7) % 30) {
        let anyConnected = false;
        let attempts = 0;
        for (const b of botBuildings) {
          if (BotAISystem.failedRoadConnections.has(b.id) && currentTick - (BotAISystem.failedRoadConnections.get(b.id) || 0) < 180) {
            continue;
          }
          attempts++;
          if (BotAISystem.connectBuildingToRoadNetwork(b, grid, region, resourceDeposits, currentTick)) {
            anyConnected = true;
            break;
          }
          if (attempts >= 1) break;
        }
        if (anyConnected) {
          incrementBuildingVersion();
          incrementFoliageVersion();
        }
      }

      const completedBuildings = botBuildings.filter((b) => b.isCompleted);
      const incompleteBuildings = botBuildings.filter((b) => !b.isCompleted);
      const peasants = botUnits.filter((u) => u.characterClass === 'peasant');

      const foodHolders = completedBuildings.filter(
        (b) =>
          b.localInventory &&
          (b.buildingType === 'stockpile' ||
            b.buildingType === 'bakery' ||
            b.buildingType === 'wheat_farm' ||
            b.buildingType === 'fishermans_hut' ||
            b.buildingType === 'foragers_hut' ||
            b.buildingType === 'hunters_hut')
      );
      foodHolders.sort((a, b) => (a.buildingType === 'stockpile' ? -1 : b.buildingType === 'stockpile' ? 1 : 0));
      const edibleTypes: ResourceType[] = ['bread', 'fish', 'meat', 'berries', 'flour', 'wheat'];

      const completedBuildingMap = new Map<string, typeof completedBuildings[0]>();
      for (const b of completedBuildings) {
        completedBuildingMap.set(b.id, b);
      }

      const builderCounts = new Map<string, number>();
      for (const p of peasants) {
        if (p.currentJob?.targetBuildingId) {
          builderCounts.set(p.currentJob.targetBuildingId, (builderCounts.get(p.currentJob.targetBuildingId) || 0) + 1);
        }
      }

      for (const p of peasants) {
        if (p.needs) {
          if (p.needs.hunger < 45) {
            let consumedFood = false;
            for (const fh of foodHolders) {
              if (!fh.localInventory) continue;
              for (const ft of edibleTypes) {
                if ((fh.localInventory[ft] || 0) > 0) {
                  fh.localInventory[ft] = (fh.localInventory[ft] || 0) - 1;
                  if (fh.localInventory[ft]! <= 0) {
                    delete fh.localInventory[ft];
                  }
                  consumedFood = true;
                  break;
                }
              }
              if (consumedFood) break;
            }

            p.needs.hunger = 95;
            if (consumedFood) {
              p.needs.mood = Math.min(100, (p.needs.mood || 80) + 5);
            }
          }

          if (p.needs.ale !== undefined && p.needs.ale < 40) {
            for (const b of completedBuildings) {
              if (b.localInventory && (b.localInventory.ale || 0) > 0) {
                b.localInventory.ale = (b.localInventory.ale || 0) - 1;
                if (b.localInventory.ale <= 0) delete b.localInventory.ale;
                p.needs.ale = 90;
                p.needs.mood = Math.min(100, (p.needs.mood || 80) + 10);
                break;
              }
            }
          }

          if (p.needs.energy < 45) p.needs.energy = 95;
          if (p.needs.mood < 50) p.needs.mood = 80;
        }

        if (p.workBuildingId) {
          const b = completedBuildingMap.get(p.workBuildingId);
          if (b && b.buildingType && Math.random() < BOT_AI_RESOURCE_GEN_CHANCE) {
            const isGatheringOrHauling =
              b.buildingType === 'lumberjack_hut' ||
              b.buildingType === 'fishermans_hut' ||
              b.buildingType === 'foragers_hut' ||
              b.buildingType === 'hunters_hut' ||
              b.buildingType === 'stockpile';

            if (!isGatheringOrHauling) {
              const blueprint = BUILDING_BLUEPRINTS[b.buildingType];
              const maxCap = blueprint?.maxStorage || 30;
              b.localInventory = b.localInventory || {};
              const curStored = Object.values(b.localInventory).reduce((acc, v) => acc + (v || 0), 0);

              if (curStored < maxCap) {
                if (b.buildingType === 'sawmill') {
                  b.localInventory.planks = (b.localInventory.planks || 0) + 2;
                  memory.wood += 2;
                } else if (b.buildingType === 'stone_quarry') {
                  b.localInventory.stone = (b.localInventory.stone || 0) + 2;
                  memory.stone += 2;
                } else if (b.buildingType === 'stonecutter') {
                  b.localInventory.cut_stone = (b.localInventory.cut_stone || 0) + 2;
                  memory.stone += 2;
                } else if (b.buildingType === 'wheat_farm') {
                  b.localInventory.wheat = (b.localInventory.wheat || 0) + 2;
                  memory.food += 2;
                } else if (b.buildingType === 'windmill') {
                  b.localInventory.flour = (b.localInventory.flour || 0) + 2;
                  memory.food += 2;
                } else if (b.buildingType === 'bakery') {
                  b.localInventory.bread = (b.localInventory.bread || 0) + 2;
                  memory.food += 2;
                } else if (b.buildingType === 'brewery') {
                  b.localInventory.ale = (b.localInventory.ale || 0) + 2;
                  memory.food += 1;
                } else if (b.buildingType === 'iron_mine') {
                  b.localInventory.iron_ore = (b.localInventory.iron_ore || 0) + 2;
                  memory.iron += 1;
                } else if (b.buildingType === 'iron_smelter') {
                  b.localInventory.iron = (b.localInventory.iron || 0) + 1;
                  memory.iron += 1;
                } else if (b.buildingType === 'clay_pit') {
                  b.localInventory.clay = (b.localInventory.clay || 0) + 2;
                } else if (b.buildingType === 'brickworks') {
                  b.localInventory.clay_bricks = (b.localInventory.clay_bricks || 0) + 2;
                } else if (b.buildingType === 'salt_works') {
                  b.localInventory.salt = (b.localInventory.salt || 0) + 2;
                } else if (b.buildingType === 'charcoal_kiln') {
                  b.localInventory.coal = (b.localInventory.coal || 0) + 2;
                } else if (b.buildingType === 'weavers_workshop') {
                  b.localInventory.clothes = (b.localInventory.clothes || 0) + 1;
                } else if (b.buildingType === 'foresters_hut') {
                  b.localInventory.wood = (b.localInventory.wood || 0) + 2;
                  memory.wood += 2;
                } else if (b.buildingType === 'market' || b.buildingType === 'tavern') {
                  memory.gold += 1;
                }
              }
            }
          }
        } else {
          if (Math.random() < BOT_AI_GATHER_CHANCE) {
            memory.wood += 1;
            memory.stone += 1;
          }
        }
      }

      if (currentTick - memory.lastWorkerAssignTick >= BOT_AI_WORKER_ASSIGN_INTERVAL) {
        memory.lastWorkerAssignTick = currentTick;

        for (const b of completedBuildings) {
          if (!b.buildingType) continue;
          const def = BUILDING_BLUEPRINTS[b.buildingType];
          if (!def || def.workSlots <= 0) continue;

          b.assignedWorkers = b.assignedWorkers || [];
          b.assignedWorkers = b.assignedWorkers.filter((wId) =>
            peasants.some((p) => p.id === wId && p.workBuildingId === b.id)
          );

          while (b.assignedWorkers.length < def.workSlots) {
            const availablePeasant = peasants.find((p) => {
              if (p.workBuildingId) return false;
              if (p.currentJob?.type === 'build_structure' && incompleteBuildings.length > 0) return false;
              return true;
            });

            if (!availablePeasant) break;

            availablePeasant.workBuildingId = b.id;
            b.assignedWorkers.push(availablePeasant.id);
            const prof = PROFESSION_TITLES[b.buildingType] || 'Робітник';
            availablePeasant.title = prof;
            if (!isRegionOffscreen && Math.random() < 0.2) {
              availablePeasant.speechBubble = {
                text: `Працюю у ${b.name || def.name}! (${prof})`,
                expiresAtTick: currentTick + DEFAULT_SPEECH_BUBBLE_TICKS,
                type: 'work',
              };
            }
          }
        }
      }

      let assignedBuilderThisTick = false;
      for (const p of peasants) {
        const isIdleOrWandering = !p.currentJob || p.currentJob.type === 'idle' || p.currentJob.type === 'wander';

        if (!isNightTime && isIdleOrWandering && incompleteBuildings.length > 0 && p.gridPosition && !assignedBuilderThisTick) {
          const targetB = incompleteBuildings.find((b) => (builderCounts.get(b.id) || 0) < 3) || incompleteBuildings[0];
          const curBuilders = builderCounts.get(targetB.id) || 0;

          if (curBuilders < 3 && targetB.gridPosition) {
            let matsDelivered = true;
            if (targetB.requiredMaterials) {
              for (const [res, needed] of Object.entries(targetB.requiredMaterials)) {
                const del = (targetB.deliveredMaterials && (targetB.deliveredMaterials as any)[res]) || 0;
                if (del < (needed || 0)) {
                  matsDelivered = false;
                  break;
                }
              }
            }

            if (!matsDelivered) {
              const alreadyHauling = peasants.some(
                (other) =>
                  other.currentJob?.type === 'haul_construction_mule' &&
                  other.currentJob?.targetBuildingId === targetB.id
              );

              if (!alreadyHauling) {
                const hp = p.hasMule ? null : HaulingJobHandler.findAvailableHitchingPost(p, region.id);
                if (p.hasMule || hp) {
                  p.currentJob = {
                    id: `bot-haul-const-${targetB.id}-${Date.now()}`,
                    type: 'haul_construction_mule',
                    targetBuildingId: targetB.id,
                    progress: 0,
                    totalWork: 30,
                  };

                  if (!p.hasMule && hp) {
                    p.assignedMuleHutId = hp.id;
                    const hpDoor = getBuildingDoorInfo(hp);
                    const pathToHp = isRegionOffscreen ? null : AStar.findPath(grid, p.gridPosition, hpDoor.doorApproachPos, true, region.bounds);
                    if (pathToHp && pathToHp.length > 0) {
                      p.path = pathToHp;
                    }
                  } else {
                    const storageHub = HaulingJobHandler.getSettlementStorageHub(region.id, botFactionId);
                    if (storageHub) {
                      const doorInfo = getBuildingDoorInfo(storageHub);
                      const path = isRegionOffscreen ? null : AStar.findPath(grid, p.gridPosition, doorInfo.doorApproachPos, true, region.bounds);
                      if (path && path.length > 0) {
                        p.path = path;
                      }
                    }
                  }

                  if (!isRegionOffscreen) {
                    p.speechBubble = {
                      text: p.hasMule ? `Веду мула за матеріалами для ${targetB.name || 'споруди'}!` : `Іду до прив'язі взяти мула!`,
                      expiresAtTick: currentTick + 30,
                      type: 'work',
                    };
                  }
                  continue;
                }
              }
            } else {
              builderCounts.set(targetB.id, curBuilders + 1);
              assignedBuilderThisTick = true;
              const bW = targetB.buildingWidth || 2;
              const bH = targetB.buildingHeight || 2;
              const buildPath = isRegionOffscreen ? null : AStar.findPathToArea(grid, p.gridPosition, targetB.gridPosition[0], targetB.gridPosition[1], bW, bH, region.bounds);
              p.currentJob = {
                id: `bot-build-${targetB.id}-${Date.now()}`,
                type: 'build_structure',
                targetBuildingId: targetB.id,
                targetPosition: targetB.gridPosition,
                progress: Math.floor(((targetB.constructionProgress || 0) / 100) * 100),
                totalWork: 100,
              };
              if (buildPath && buildPath.length > 0) {
                p.path = buildPath;
              } else if (isRegionOffscreen) {
                p.gridPosition = [targetB.gridPosition[0], targetB.gridPosition[1]];
                p.position = [targetB.gridPosition[0] + 0.5, 0.05, targetB.gridPosition[1] + 0.5];
              }
              if (!isRegionOffscreen && Math.random() < 0.2) {
                p.speechBubble = {
                  text: `Зводжу ${targetB.name || 'споруду'}!`,
                  expiresAtTick: currentTick + 30,
                  type: 'work',
                };
              }
              continue;
            }
          }
        }

        const pCooldown = (p as any).idleCooldownTicks ?? 0;
        if (!isRegionOffscreen && !isNightTime && isIdleOrWandering && (!p.path || p.path.length === 0) && currentTick >= pCooldown && p.gridPosition) {
          if (wanderingPathBudget <= 0) {
            (p as any).idleCooldownTicks = currentTick + 20;
            continue;
          }

          const curX = p.gridPosition[0];
          const curZ = p.gridPosition[1];
          const candidateDestinations: [number, number][] = [];

          if (completedBuildings.length > 0) {
            for (const b of completedBuildings) {
              if (!b.gridPosition) continue;
              const bx = b.gridPosition[0] + Math.floor((b.buildingWidth || 2) / 2);
              const bz = b.gridPosition[1] + Math.floor((b.buildingHeight || 2) / 2);
              for (const [ox, oz] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) {
                const tx = bx + ox;
                const tz = bz + oz;
                const dist = Math.hypot(tx - curX, tz - curZ);
                if (dist >= 3 && dist <= 12 && tx >= region.bounds.minX + 2 && tx <= region.bounds.maxX - 2 && tz >= region.bounds.minZ + 2 && tz <= region.bounds.maxZ - 2 && grid.isWalkable(tx, tz)) {
                  candidateDestinations.push([tx, tz]);
                  if (candidateDestinations.length >= 3) break;
                }
              }
              if (candidateDestinations.length >= 3) break;
            }
          }

          if (candidateDestinations.length === 0) {
            for (let attempt = 0; attempt < 6; attempt++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 3 + Math.random() * 6;
              const candX = Math.round(curX + Math.cos(angle) * dist);
              const candZ = Math.round(curZ + Math.sin(angle) * dist);
              if (candX >= region.bounds.minX + 2 && candX <= region.bounds.maxX - 2 && candZ >= region.bounds.minZ + 2 && candZ <= region.bounds.maxZ - 2 && grid.isWalkable(candX, candZ)) {
                candidateDestinations.push([candX, candZ]);
                break;
              }
            }
          }

          if (candidateDestinations.length > 0) {
            wanderingPathBudget--;
            const chosen = candidateDestinations[Math.floor(Math.random() * candidateDestinations.length)];
            const path = AStar.findPath(grid, p.gridPosition, chosen, false, region.bounds);
            if (path && path.length >= 2) {
              p.path = path;
              p.currentJob = {
                id: `bot-wander-${p.id}-${Date.now()}`,
                type: 'wander',
                progress: 0,
                totalWork: 20,
              };
              (p as any).idleCooldownTicks = currentTick + 80 + Math.floor(Math.random() * 40);
              if (Math.random() < 0.1) {
                const phrases = ["Розім'яти б ноги", 'Огляну володіння', 'Пройдуся селом', 'Перевірю стежки', 'Гарна нині погода'];
                p.speechBubble = {
                  text: phrases[Math.floor(Math.random() * phrases.length)],
                  expiresAtTick: currentTick + 30,
                  type: 'mood',
                };
              }
            } else {
              (p as any).idleCooldownTicks = currentTick + 60;
            }
          } else {
            (p as any).idleCooldownTicks = currentTick + 60;
          }
        }
      }

      const botLord = botUnits.find((u) => u.characterClass === 'lord' || isNoble(u));
      const lordCooldown = (botLord as any)?.idleCooldownTicks ?? 0;
      if (botLord && !isRegionOffscreen && !isNightTime && (!botLord.path || botLord.path.length === 0) && currentTick >= lordCooldown && botLord.gridPosition) {
        const isLordIdle = !botLord.currentJob || botLord.currentJob.type === 'idle' || botLord.currentJob.type === 'wander';
        if (isLordIdle) {
          if (wanderingPathBudget <= 0) {
            (botLord as any).idleCooldownTicks = currentTick + 25;
          } else {
            const curX = botLord.gridPosition[0];
            const curZ = botLord.gridPosition[1];
            const candidateDestinations: [number, number][] = [];

            if (incompleteBuildings.length > 0) {
              const b = incompleteBuildings[0];
              if (b.gridPosition) {
                const bx = b.gridPosition[0] + Math.floor((b.buildingWidth || 2) / 2);
                const bz = b.gridPosition[1] + Math.floor((b.buildingHeight || 2) / 2);
                for (const [ox, oz] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) {
                  const tx = bx + ox;
                  const tz = bz + oz;
                  if (grid.isWalkable(tx, tz) && tx >= region.bounds.minX + 2 && tx <= region.bounds.maxX - 2 && tz >= region.bounds.minZ + 2 && tz <= region.bounds.maxZ - 2) {
                    candidateDestinations.push([tx, tz]);
                    break;
                  }
                }
              }
            } else if (completedBuildings.length > 0) {
              for (const b of completedBuildings) {
                if (!b.gridPosition) continue;
                const bx = b.gridPosition[0] + Math.floor((b.buildingWidth || 2) / 2);
                const bz = b.gridPosition[1] + Math.floor((b.buildingHeight || 2) / 2);
                for (const [ox, oz] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) {
                  const tx = bx + ox;
                  const tz = bz + oz;
                  if (grid.isWalkable(tx, tz) && tx >= region.bounds.minX + 2 && tx <= region.bounds.maxX - 2 && tz >= region.bounds.minZ + 2 && tz <= region.bounds.maxZ - 2) {
                    candidateDestinations.push([tx, tz]);
                    if (candidateDestinations.length >= 2) break;
                  }
                }
                if (candidateDestinations.length >= 2) break;
              }
            }

            if (candidateDestinations.length === 0) {
              for (let attempt = 0; attempt < 6; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 3 + Math.random() * 6;
                const candX = Math.round(curX + Math.cos(angle) * dist);
                const candZ = Math.round(curZ + Math.sin(angle) * dist);
                if (candX >= region.bounds.minX + 2 && candX <= region.bounds.maxX - 2 && candZ >= region.bounds.minZ + 2 && candZ <= region.bounds.maxZ - 2 && grid.isWalkable(candX, candZ)) {
                  candidateDestinations.push([candX, candZ]);
                  break;
                }
              }
            }

            if (candidateDestinations.length > 0) {
              wanderingPathBudget--;
              const chosen = candidateDestinations[Math.floor(Math.random() * candidateDestinations.length)];
              const lordPath = AStar.findPath(grid, botLord.gridPosition, chosen, false, region.bounds);
              if (lordPath && lordPath.length >= 2) {
                botLord.path = lordPath;
                botLord.currentJob = {
                  id: `bot-lord-wander-${Date.now()}`,
                  type: 'wander',
                  progress: 0,
                  totalWork: 25,
                };
                (botLord as any).idleCooldownTicks = currentTick + 100 + Math.floor(Math.random() * 50);
                if (Math.random() < 0.15) {
                  const lordPhrases = ['Оглядаю володіння', 'Перевіряю стан земель', 'Село повинно процвітати', 'Огляну будівництво та дороги'];
                  botLord.speechBubble = {
                    text: lordPhrases[Math.floor(Math.random() * lordPhrases.length)],
                    expiresAtTick: currentTick + 35,
                    type: 'mood',
                  };
                }
              } else {
                (botLord as any).idleCooldownTicks = currentTick + 70;
              }
            } else {
              (botLord as any).idleCooldownTicks = currentTick + 70;
            }
          }
        }
      }

      if (!isNightTime && incompleteBuildings.length > 0) {
        const targetB = incompleteBuildings[0];
        let matsDelivered = true;
        if (targetB.requiredMaterials) {
          for (const [res, needed] of Object.entries(targetB.requiredMaterials)) {
            const del = (targetB.deliveredMaterials && (targetB.deliveredMaterials as any)[res]) || 0;
            if (del < (needed || 0)) {
              matsDelivered = false;
              break;
            }
          }
        }

        const buildersCount = builderCounts.get(targetB.id) || 0;
        if (matsDelivered && buildersCount === 0 && targetB.gridPosition) {
          const fallbackBuilder = peasants.find((p) =>
            (!p.currentJob || p.currentJob.type === 'idle' || p.currentJob.type === 'wander' || p.currentJob.type === 'work_at_building') &&
            p.currentJob?.type !== 'sleep' &&
            p.currentJob?.type !== 'sit_by_fire'
          );
          if (fallbackBuilder && fallbackBuilder.gridPosition) {
            const bW = targetB.buildingWidth || 2;
            const bH = targetB.buildingHeight || 2;
            const buildPath = isRegionOffscreen ? null : AStar.findPathToArea(grid, fallbackBuilder.gridPosition, targetB.gridPosition[0], targetB.gridPosition[1], bW, bH, region.bounds);
            builderCounts.set(targetB.id, 1);
            fallbackBuilder.currentJob = {
              id: `bot-build-${targetB.id}-${Date.now()}`,
              type: 'build_structure',
              targetBuildingId: targetB.id,
              targetPosition: targetB.gridPosition,
              progress: Math.floor(((targetB.constructionProgress || 0) / 100) * 100),
              totalWork: 100,
            };
            if (buildPath && buildPath.length > 0) {
              fallbackBuilder.path = buildPath;
            } else if (isRegionOffscreen) {
              fallbackBuilder.gridPosition = [targetB.gridPosition[0], targetB.gridPosition[1]];
              fallbackBuilder.position = [targetB.gridPosition[0] + 0.5, 0.05, targetB.gridPosition[1] + 0.5];
            }
            if (!isRegionOffscreen && Math.random() < 0.2) {
              fallbackBuilder.speechBubble = {
                text: `Зводжу ${targetB.name || 'споруду'}!`,
                expiresAtTick: currentTick + 30,
                type: 'work',
              };
            }
          }
        }

        if (matsDelivered && currentTick % 20 === 0) {
          targetB.constructionProgress = Math.min(100, (targetB.constructionProgress || 0) + 10);
          if (targetB.constructionProgress >= 100) {
            targetB.constructionProgress = 100;
            targetB.isCompleted = true;
            targetB.buildingHealth = targetB.maxBuildingHealth || 150;
            incrementBuildingVersion();
          }
        }
      }

      let totalBeds = 0;
      for (const b of completedBuildings) {
        if (b.buildingType === 'peasant_house') totalBeds += 2;
        else if (b.buildingType === 'tent') totalBeds += 1;
        else if (b.buildingType === 'manor') totalBeds += 4;
      }

      if (currentTick - memory.lastImmigrationTick >= BOT_AI_IMMIGRATION_INTERVAL) {
        memory.lastImmigrationTick = currentTick;

        const lordBedsNeeded = botLord ? 1 : 0;
        if (peasants.length + lordBedsNeeded < totalBeds && peasants.length < BOT_AI_MAX_PEASANTS) {
          const isFemale = Math.random() < 0.45;
          const namePool = isFemale ? UKRAINIAN_NAMES_FEMALE : UKRAINIAN_NAMES_MALE;
          const chosenName = namePool[Math.floor(Math.random() * namePool.length)];
          const avatarColor = PEASANT_COLORS[Math.floor(Math.random() * PEASANT_COLORS.length)];

          const camp = region.campPosition || region.center;
          const spawnX = Math.max(region.bounds.minX + 2, Math.min(region.bounds.maxX - 2, camp[0] + Math.round(Math.random() * 6 - 3)));
          const spawnZ = Math.max(region.bounds.minZ + 2, Math.min(region.bounds.maxZ - 2, camp[1] + Math.round(Math.random() * 6 - 3)));

          const newUnitId = `unit-bot-${region.id}-peasant-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          world.add({
            id: newUnitId,
            name: `${chosenName} з ${region.ukrName}`,
            title: 'Селянин',
            characterClass: 'peasant',
            avatarColor,
            isCharacter: true,
            factionId: botFactionId,
            regionId: region.id,
            gridPosition: [spawnX, spawnZ],
            position: [spawnX + 0.5, 0.3, spawnZ + 0.5],
            moveSpeed: BOT_AI_PEASANT_MOVE_SPEED,
            gold: 5,
            workBuildingId: undefined,
            thoughts: [
              {
                id: 'settled',
                text: `Прибув до володінь ${region.lordName} (+10)`,
                modifier: 10,
                durationTicks: 2500,
              },
            ],
            needs: {
              hunger: 90,
              energy: 95,
              mood: 80,
              ale: 60,
              hygiene: 80,
            },
            skills: {
              farming: 4 + Math.floor(Math.random() * 5),
              woodcutting: 4 + Math.floor(Math.random() * 5),
              mining: 3 + Math.floor(Math.random() * 5),
              building: 5 + Math.floor(Math.random() * 4),
              cooking: 3 + Math.floor(Math.random() * 4),
              brewing: 3 + Math.floor(Math.random() * 4),
              combat: 4 + Math.floor(Math.random() * 4),
              intellect: 5,
              charisma: 5,
            },
            speechBubble: {
              text: `Прибув до ${region.ukrName}! Шукаю роботу та дім.`,
              expiresAtTick: currentTick + DEFAULT_SPEECH_BUBBLE_TICKS,
              type: 'mood',
            },
            currentJob: { id: `idle-${newUnitId}`, type: 'idle', progress: 0, totalWork: 0 },
          });

          addChronicleEvent({
            title: `Новий поселенець у ${region.ukrName}`,
            description: `${chosenName} прибув(ла) до володінь ${region.lordName} та оселився(лася) у новому будинку!`,
            type: 'social',
          });
        }
      }

      const botDecisionInterval = BOT_AI_BUILD_DECISION_INTERVAL + (region.id * 17);
      if (incompleteBuildings.length < 2 && currentTick - memory.lastActionTick >= botDecisionInterval) {
        memory.lastActionTick = currentTick;

        const completedHitchingPosts = completedBuildings.filter((b) => b.buildingType === 'hitching_post');
        for (const hp of completedHitchingPosts) {
          const curM = hp.mulesCount ?? 1;
          const maxM = hp.maxMules ?? 3;
          if (curM < maxM) {
            const needsSecondMule = curM === 1 && (peasants.length >= 6 || incompleteBuildings.length > 0);
            const needsThirdMule = curM === 2 && (peasants.length >= 10 || incompleteBuildings.length > 1);
            if (needsSecondMule || needsThirdMule) {
              if (memory.gold >= 40 || currentTick % 120 === 0) {
                if (memory.gold >= 50) {
                  memory.gold -= 50;
                }
                hp.mulesCount = curM + 1;
                incrementBuildingVersion();
                const speaker = botLord || peasants[0];
                if (speaker && !isRegionOffscreen) {
                  speaker.speechBubble = {
                    text: `Купили додаткового мула (${hp.mulesCount}/${maxM}) для розбудови!`,
                    expiresAtTick: currentTick + 35,
                    type: 'work',
                  };
                }
              }
            }
          }
        }

        const bCounts: Partial<Record<BuildingType, number>> = {};
        for (const b of botBuildings) {
          if (b.buildingType) {
            bCounts[b.buildingType] = (bCounts[b.buildingType] || 0) + 1;
          }
        }

        const count = (t: BuildingType) => bCounts[t] || 0;
        const canAttempt = (t: BuildingType) => (BotAISystem.failedGoals.get(`${botFactionId}-${t}`) || 0) <= currentTick;

        const regionalDeposits = resourceDeposits.filter((d) => {
          if (d.regionId !== undefined) return d.regionId === region.id;
          const [dx, , dz] = d.position || [d.gridPosition[0] + 0.5, 0, d.gridPosition[1] + 0.5];
          return GridMap.isCoordInRegion(region.id, dx, dz, 0);
        });

        const hasStoneDeposit = regionalDeposits.some((d) => d.type === 'stone');
        const hasIronDeposit = regionalDeposits.some((d) => d.type === 'iron');
        const hasClayDeposit = regionalDeposits.some((d) => d.type === 'clay');
        const hasSaltDeposit = regionalDeposits.some((d) => d.type === 'salt');
        const hasBerryDeposit = regionalDeposits.some((d) => d.type === 'berries');
        const hasGameDeposit = regionalDeposits.some((d) => d.type === 'wild_game');
        const hasFishDeposit = regionalDeposits.some((d) => d.type === 'fish');

        const botStockpiles = completedBuildings.filter((b) => b.buildingType === 'stockpile');
        let totalStockpileCapacity = 0;
        let totalStockpileStored = 0;
        for (const sp of botStockpiles) {
          const cap = sp.maxStorage || 200;
          totalStockpileCapacity += cap;
          if (sp.localInventory) {
            totalStockpileStored += Object.values(sp.localInventory).reduce((acc, v) => acc + (v || 0), 0);
          }
        }
        const areStockpilesNearFull =
          botStockpiles.length > 0 &&
          (totalStockpileStored >= totalStockpileCapacity * 0.7 ||
            botStockpiles.some((sp) => {
              const cur = Object.values(sp.localInventory || {}).reduce((acc, v) => acc + (v || 0), 0);
              return cur >= (sp.maxStorage || 200) * 0.85;
            }));

        const freeBeds = totalBeds - peasants.length;
        const needsHousing = freeBeds <= 2 && peasants.length < BOT_AI_MAX_PEASANTS && count('peasant_house') < 22;

        let candidateGoal: { type: BuildingType; targetDeposit?: ResourceDeposit } | null = null;

        if (canAttempt('hitching_post') && count('hitching_post') === 0) {
          candidateGoal = { type: 'hitching_post' };
        } else if (canAttempt('stockpile') && areStockpilesNearFull && count('stockpile') < 8) {
          candidateGoal = { type: 'stockpile' };
        } else if (canAttempt('peasant_house') && needsHousing) {
          candidateGoal = { type: 'peasant_house' };
        } else if (canAttempt('hitching_post') && count('hitching_post') < 2 && peasants.length >= 14) {
          candidateGoal = { type: 'hitching_post' };
        } else if (canAttempt('lumberjack_hut') && count('lumberjack_hut') === 0) {
          candidateGoal = { type: 'lumberjack_hut' };
        } else if (canAttempt('peasant_house') && count('peasant_house') === 0) {
          candidateGoal = { type: 'peasant_house' };
        } else if (canAttempt('stockpile') && count('stockpile') === 0) {
          candidateGoal = { type: 'stockpile' };
        } else if (canAttempt('foragers_hut') && hasBerryDeposit && count('foragers_hut') === 0) {
          candidateGoal = { type: 'foragers_hut', targetDeposit: regionalDeposits.find((d) => d.type === 'berries') };
        } else if (canAttempt('fishermans_hut') && hasFishDeposit && count('fishermans_hut') === 0) {
          candidateGoal = { type: 'fishermans_hut', targetDeposit: regionalDeposits.find((d) => d.type === 'fish') };
        } else if (canAttempt('hunters_hut') && hasGameDeposit && count('hunters_hut') === 0) {
          candidateGoal = { type: 'hunters_hut', targetDeposit: regionalDeposits.find((d) => d.type === 'wild_game') };
        } else if (canAttempt('wheat_farm') && count('wheat_farm') === 0) {
          candidateGoal = { type: 'wheat_farm' };
        } else if (canAttempt('peasant_house') && count('peasant_house') < 2) {
          candidateGoal = { type: 'peasant_house' };
        } else if (canAttempt('stone_quarry') && hasStoneDeposit && count('stone_quarry') === 0) {
          candidateGoal = { type: 'stone_quarry', targetDeposit: regionalDeposits.find((d) => d.type === 'stone') };
        } else if (canAttempt('iron_mine') && hasIronDeposit && count('iron_mine') === 0) {
          candidateGoal = { type: 'iron_mine', targetDeposit: regionalDeposits.find((d) => d.type === 'iron') };
        } else if (canAttempt('clay_pit') && hasClayDeposit && count('clay_pit') === 0) {
          candidateGoal = { type: 'clay_pit', targetDeposit: regionalDeposits.find((d) => d.type === 'clay') };
        } else if (canAttempt('salt_works') && hasSaltDeposit && count('salt_works') === 0) {
          candidateGoal = { type: 'salt_works', targetDeposit: regionalDeposits.find((d) => d.type === 'salt') };
        } else if (canAttempt('windmill') && count('wheat_farm') >= 1 && count('windmill') === 0) {
          candidateGoal = { type: 'windmill' };
        } else if (canAttempt('bakery') && count('windmill') >= 1 && count('bakery') === 0) {
          candidateGoal = { type: 'bakery' };
        } else if (canAttempt('stonecutter') && count('stone_quarry') >= 1 && count('stonecutter') === 0) {
          candidateGoal = { type: 'stonecutter' };
        } else if (canAttempt('sawmill') && count('sawmill') === 0) {
          candidateGoal = { type: 'sawmill' };
        } else if (canAttempt('peasant_house') && count('peasant_house') < 4) {
          candidateGoal = { type: 'peasant_house' };
        } else if (canAttempt('brewery') && count('wheat_farm') >= 1 && count('brewery') === 0) {
          candidateGoal = { type: 'brewery' };
        } else if (canAttempt('tavern') && count('brewery') >= 1 && count('tavern') === 0) {
          candidateGoal = { type: 'tavern' };
        } else if (canAttempt('wooden_church') && count('wooden_church') === 0) {
          candidateGoal = { type: 'wooden_church' };
        } else if (canAttempt('charcoal_kiln') && count('iron_mine') >= 1 && count('charcoal_kiln') === 0) {
          candidateGoal = { type: 'charcoal_kiln' };
        } else if (canAttempt('iron_smelter') && count('charcoal_kiln') >= 1 && count('iron_smelter') === 0) {
          candidateGoal = { type: 'iron_smelter' };
        } else if (canAttempt('market') && count('market') === 0) {
          candidateGoal = { type: 'market' };
        } else if (canAttempt('barracks') && count('barracks') === 0) {
          candidateGoal = { type: 'barracks' };
        } else if (canAttempt('manor') && count('manor') === 0 && peasants.length >= 6) {
          candidateGoal = { type: 'manor' };
        } else if (canAttempt('stockpile') && count('stockpile') < 2 && count('peasant_house') >= 3) {
          candidateGoal = { type: 'stockpile' };
        } else if (canAttempt('peasant_house') && count('peasant_house') < 6) {
          candidateGoal = { type: 'peasant_house' };
        } else if (canAttempt('lumberjack_hut') && count('lumberjack_hut') < 2) {
          candidateGoal = { type: 'lumberjack_hut' };
        } else if (canAttempt('wheat_farm') && count('wheat_farm') < 2) {
          candidateGoal = { type: 'wheat_farm' };
        } else if (canAttempt('foresters_hut') && count('foresters_hut') === 0 && count('lumberjack_hut') >= 1) {
          candidateGoal = { type: 'foresters_hut' };
        } else if (canAttempt('wheat_farm') && peasants.length >= 12 && count('wheat_farm') < 3) {
          candidateGoal = { type: 'wheat_farm' };
        } else if (canAttempt('windmill') && count('wheat_farm') >= 2 && count('windmill') < 2) {
          candidateGoal = { type: 'windmill' };
        } else if (canAttempt('bakery') && count('windmill') >= 2 && count('bakery') < 2) {
          candidateGoal = { type: 'bakery' };
        } else if (canAttempt('brickworks') && count('clay_pit') >= 1 && count('brickworks') === 0) {
          candidateGoal = { type: 'brickworks' };
        } else if (canAttempt('weavers_workshop') && count('weavers_workshop') === 0) {
          candidateGoal = { type: 'weavers_workshop' };
        } else if (canAttempt('sawmill') && peasants.length >= 12 && count('sawmill') < 2) {
          candidateGoal = { type: 'sawmill' };
        } else if (canAttempt('stonecutter') && hasStoneDeposit && count('stonecutter') < 2 && peasants.length >= 14) {
          candidateGoal = { type: 'stonecutter', targetDeposit: regionalDeposits.find((d) => d.type === 'stone') };
        } else if (canAttempt('lumberjack_hut') && peasants.length >= 16 && count('lumberjack_hut') < 3) {
          candidateGoal = { type: 'lumberjack_hut' };
        } else if (canAttempt('market') && peasants.length >= 14 && count('market') < 2) {
          candidateGoal = { type: 'market' };
        } else if (canAttempt('tavern') && peasants.length >= 16 && count('tavern') < 2) {
          candidateGoal = { type: 'tavern' };
        } else if (canAttempt('barracks') && peasants.length >= 18 && count('barracks') < 2) {
          candidateGoal = { type: 'barracks' };
        } else if (canAttempt('wooden_church') && peasants.length >= 20 && count('wooden_church') < 2) {
          candidateGoal = { type: 'wooden_church' };
        } else if (canAttempt('wheat_farm') && peasants.length >= 22 && count('wheat_farm') < 4) {
          candidateGoal = { type: 'wheat_farm' };
        } else if (canAttempt('windmill') && count('wheat_farm') >= 4 && count('windmill') < 3) {
          candidateGoal = { type: 'windmill' };
        } else if (canAttempt('bakery') && count('windmill') >= 3 && count('bakery') < 3) {
          candidateGoal = { type: 'bakery' };
        } else if (canAttempt('brewery') && peasants.length >= 22 && count('brewery') < 2) {
          candidateGoal = { type: 'brewery' };
        } else if (canAttempt('foresters_hut') && peasants.length >= 24 && count('foresters_hut') < 2) {
          candidateGoal = { type: 'foresters_hut' };
        } else if (canAttempt('charcoal_kiln') && peasants.length >= 24 && count('charcoal_kiln') < 2) {
          candidateGoal = { type: 'charcoal_kiln' };
        } else if (canAttempt('iron_smelter') && peasants.length >= 26 && count('iron_smelter') < 2) {
          candidateGoal = { type: 'iron_smelter' };
        } else if (canAttempt('lumberjack_hut') && peasants.length >= 26 && count('lumberjack_hut') < 4) {
          candidateGoal = { type: 'lumberjack_hut' };
        } else if (canAttempt('wheat_farm') && peasants.length >= 30 && count('wheat_farm') < 5) {
          candidateGoal = { type: 'wheat_farm' };
        } else if (canAttempt('stockpile') && count('stockpile') < Math.min(8, Math.max(2, Math.ceil(peasants.length / 5)))) {
          candidateGoal = { type: 'stockpile' };
        } else if (canAttempt('peasant_house') && count('peasant_house') < 22 && peasants.length < BOT_AI_MAX_PEASANTS) {
          candidateGoal = { type: 'peasant_house' };
        }

        if (candidateGoal) {
          const bType = candidateGoal.type;
          const bBlueprint = BUILDING_BLUEPRINTS[bType];
          if (bBlueprint) {
            const baseW = bBlueprint.width || 3;
            const baseH = bBlueprint.height || 2;
            const woodCost = bBlueprint.cost?.wood || 15;
            const stoneCost = bBlueprint.cost?.stone || 0;

            let settlementWood = 0;
            let settlementStone = 0;
            for (const b of botBuildings) {
              if (b.isCompleted && b.localInventory) {
                settlementWood += (b.localInventory.wood || 0) + (b.localInventory.planks || 0);
                settlementStone += (b.localInventory.stone || 0) + (b.localInventory.cut_stone || 0);
              }
            }
            memory.wood = Math.max(memory.wood, settlementWood);
            memory.stone = Math.max(memory.stone, settlementStone);

            if (memory.wood < woodCost) memory.wood += woodCost;
            if (memory.stone < stoneCost) memory.stone += stoneCost;

            interface PlacementCandidate {
              bx: number;
              bz: number;
              w: number;
              h: number;
              rotation: number;
            }
            let placedResult: PlacementCandidate | null = null;

            const checkPlacementValid = (bx: number, bz: number, w: number, h: number): boolean => {
              if (!GridMap.isBuildingInRegion(region.id, bx, bz, w, h, 4.0)) {
                return false;
              }

              for (let dx = 0; dx < w; dx++) {
                for (let dz = 0; dz < h; dz++) {
                  const tx = bx + dx;
                  const tz = bz + dz;
                  const t = grid.getTile(tx, tz);
                  if (!t || t.terrain === 'water' || t.terrain === 'road' || t.buildingId) {
                    return false;
                  }
                }
              }

              const allowedOverlapMap: Partial<Record<BuildingType, string>> = {
                iron_mine: 'iron',
                stone_quarry: 'stone',
                clay_pit: 'clay',
                salt_works: 'salt',
              };
              if (isOverlappingResourceDeposit(bx, bz, w, h, resourceDeposits, allowedOverlapMap[bType])) {
                return false;
              }

              if (bType === 'fishermans_hut') {
                let touchesWater = false;
                for (let dx = -1; dx <= w; dx++) {
                  for (let dz = -1; dz <= h; dz++) {
                    if (dx >= 0 && dx < w && dz >= 0 && dz < h) continue;
                    const pt = grid.getTile(bx + dx, bz + dz);
                    if (pt && pt.terrain === 'water') {
                      touchesWater = true;
                      break;
                    }
                  }
                  if (touchesWater) break;
                }
                if (!touchesWater) return false;
              }

              const isWall = bType === 'wooden_wall' || bType === 'stone_wall' || bType === 'wooden_gate';
              const minSpacing = isWall ? 0 : (bType === 'windmill' ? 2 : 1);

              for (const b of botBuildings) {
                if (!b.isBuilding || !b.gridPosition) continue;
                const [otherX, otherZ] = b.gridPosition;
                const otherType = b.buildingType;
                const otherDef = otherType ? BUILDING_BLUEPRINTS[otherType] : null;
                const otherW = b.buildingWidth || otherDef?.width || 1;
                const otherH = b.buildingHeight || otherDef?.height || 1;
                const isOtherWall = otherType === 'wooden_wall' || otherType === 'stone_wall' || otherType === 'wooden_gate';

                const reqSpacing = (isWall && isOtherWall) ? 0 : Math.max(minSpacing, otherType === 'windmill' ? 2 : 1);

                const overlapX = !(bx + w + reqSpacing <= otherX || bx >= otherX + otherW + reqSpacing);
                const overlapZ = !(bz + h + reqSpacing <= otherZ || bz >= otherZ + otherH + reqSpacing);
                if (overlapX && overlapZ) {
                  return false;
                }
              }

              let minH = Infinity;
              let maxH = -Infinity;
              for (let tx = bx; tx < bx + w; tx++) {
                for (let tz = bz; tz < bz + h; tz++) {
                  const t = grid.getTile(tx, tz);
                  if (!t) return false;
                  const th = t.height || 0.05;
                  if (th < minH) minH = th;
                  if (th > maxH) maxH = th;
                }
              }
              if (maxH - minH > BOT_AI_TERRAIN_MAX_HEIGHT_DIFF) return false;

              return true;
            };

            const testPositionRotations = (candCenterX: number, candCenterZ: number, campCenter?: [number, number]): PlacementCandidate | null => {
              let preferredRot = 0;
              if (campCenter) {
                const cdx = candCenterX - campCenter[0];
                const cdz = candCenterZ - campCenter[1];
                if (Math.abs(cdz) >= Math.abs(cdx)) {
                  preferredRot = cdz > 0 ? Math.PI : 0;
                } else {
                  preferredRot = cdx > 0 ? (3 * Math.PI) / 2 : Math.PI / 2;
                }
              }

              const rotCandidates = [
                preferredRot,
                (preferredRot + Math.PI / 2) % (2 * Math.PI),
                (preferredRot + Math.PI) % (2 * Math.PI),
                (preferredRot + (3 * Math.PI) / 2) % (2 * Math.PI),
              ];

              for (const rot of rotCandidates) {
                const isRot90 = Math.abs(Math.sin(rot)) > 0.5;
                const candW = isRot90 ? baseH : baseW;
                const candH = isRot90 ? baseW : baseH;
                const bx = Math.round(candCenterX - candW / 2);
                const bz = Math.round(candCenterZ - candH / 2);

                if (checkPlacementValid(bx, bz, candW, candH)) {
                  let hasPerimeterOpen = false;
                  for (let px = bx - 1; px <= bx + candW; px++) {
                    for (let pz = bz - 1; pz <= bz + candH; pz++) {
                      if (px >= bx && px < bx + candW && pz >= bz && pz < bz + candH) continue;
                      const pt = grid.getTile(px, pz);
                      if (pt && pt.terrain !== 'water' && !pt.buildingId) {
                        hasPerimeterOpen = true;
                        break;
                      }
                    }
                    if (hasPerimeterOpen) break;
                  }
                  if (hasPerimeterOpen) {
                    return { bx, bz, w: candW, h: candH, rotation: rot };
                  }
                }
              }
              return null;
            };

            if (candidateGoal.targetDeposit) {
              const d = candidateGoal.targetDeposit;
              const [dx, , dz] = d.position || [d.gridPosition[0] + 0.5, 0, d.gridPosition[1] + 0.5];
              const camp = region.campPosition || region.center;

              if (bType === 'fishermans_hut') {
                const lakeRadii = [3.0, 4.0, 5.0, 6.0, 7.5, 9.0, 11.0, 13.0];
                for (const r of lakeRadii) {
                  for (let deg = 0; deg < 360; deg += 15) {
                    const rad = (deg * Math.PI) / 180;
                    const cx = dx + r * Math.cos(rad);
                    const cz = dz + r * Math.sin(rad);
                    const res = testPositionRotations(cx, cz, camp);
                    if (res) {
                      placedResult = res;
                      break;
                    }
                  }
                  if (placedResult) break;
                }
              } else {
                const depRadii = [0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0];
                for (const r of depRadii) {
                  if (r === 0) {
                    const res = testPositionRotations(dx, dz, camp);
                    if (res) {
                      placedResult = res;
                      break;
                    }
                    continue;
                  }
                  for (let deg = 0; deg < 360; deg += 15) {
                    const rad = (deg * Math.PI) / 180;
                    const cx = dx + r * Math.cos(rad);
                    const cz = dz + r * Math.sin(rad);
                    const res = testPositionRotations(cx, cz, camp);
                    if (res) {
                      placedResult = res;
                      break;
                    }
                  }
                  if (placedResult) break;
                }
              }
            }

            const camp = region.campPosition || region.center;

            if (!placedResult && !candidateGoal.targetDeposit) {
              const roadCoords = grid.roadCoords;
              if (roadCoords && roadCoords.size > 0) {
                let checkedCount = 0;
                const maxRoadChecks = 80;
                const roadStep = Math.max(1, Math.floor(roadCoords.size / maxRoadChecks));
                let stepCounter = 0;

                for (const key of roadCoords) {
                  stepCounter++;
                  if (stepCounter % roadStep !== 0) continue;

                  const rx = Math.floor(key / grid.width);
                  const rz = key % grid.width;
                  if (GridMap.isTradeHighwayTile(rx, rz) || GridMap.getDistanceToHighway(rx, rz) < 6.0) {
                    continue;
                  }
                  if (!GridMap.isCoordInRegion(region.id, rx, rz, 4.0)) {
                    continue;
                  }
                  const distToCamp = Math.hypot(rx - camp[0], rz - camp[1]);
                  if (distToCamp > 50) continue;

                  const offsets = [
                    [rx + baseW / 2 + 1.2, rz + 0.5],
                    [rx - baseW / 2 - 1.2, rz + 0.5],
                    [rx + 0.5, rz + baseH / 2 + 1.2],
                    [rx + 0.5, rz - baseH / 2 - 1.2],
                    [rx + baseW / 2 + 1.8, rz + baseH / 2 + 1.8],
                    [rx - baseW / 2 - 1.8, rz - baseH / 2 - 1.8],
                  ];
                  for (const [cx, cz] of offsets) {
                    const res = testPositionRotations(cx, cz, camp);
                    if (res) {
                      placedResult = res;
                      break;
                    }
                  }
                  checkedCount++;
                  if (placedResult || checkedCount >= maxRoadChecks) break;
                }
              }
            }

            if (!placedResult && !candidateGoal.targetDeposit) {
              for (const eb of completedBuildings) {
                if (!eb.gridPosition) continue;
                const [ebx, ebz] = eb.gridPosition;
                const ebW = eb.buildingWidth || 2;
                const ebH = eb.buildingHeight || 2;
                const offsets = [
                  [ebx + ebW + baseW / 2 + 1.2, ebz + ebH / 2],
                  [ebx - baseW / 2 - 1.2, ebz + ebH / 2],
                  [ebx + ebW / 2, ebz + ebH + baseH / 2 + 1.2],
                  [ebx + ebW / 2, ebz - baseH / 2 - 1.2],
                  [ebx + ebW + baseW / 2 + 1.5, ebz + ebH + baseH / 2 + 1.5],
                  [ebx - baseW / 2 - 1.5, ebz + ebH + baseH / 2 + 1.5],
                ];
                for (const [cx, cz] of offsets) {
                  const res = testPositionRotations(cx, cz, camp);
                  if (res) {
                    placedResult = res;
                    break;
                  }
                }
                if (placedResult) break;
              }
            }

            if (!placedResult) {
              const campRadii = [6, 10, 14, 18, 22, 26, 30, 35, 40, 46, 52];
              for (const r of campRadii) {
                const angleStep = Math.max(12, Math.floor(360 / (r * 1.8)));
                for (let deg = 0; deg < 360; deg += angleStep) {
                  const rad = (deg * Math.PI) / 180;
                  const cx = camp[0] + r * Math.cos(rad);
                  const cz = camp[1] + r * Math.sin(rad);
                  const res = testPositionRotations(cx, cz, camp);
                  if (res) {
                    placedResult = res;
                    break;
                  }
                }
                if (placedResult) break;
              }
            }

            if (placedResult) {
              BotAISystem.failedGoals.delete(`${botFactionId}-${bType}`);
              const { bx, bz, w: bWidth, h: bHeight, rotation: chosenRotation } = placedResult;
              const bId = `building-bot-${region.id}-${bType}-${memory.buildStage}-${Date.now()}`;
              const buildingH = grid.occupyForBuilding(bx, bz, bWidth, bHeight, bId);

              const botBuilding: GameEntity = {
                id: bId,
                name: `${bBlueprint.name} (${region.lordName})`,
                isBuilding: true,
                buildingType: bType,
                buildingHealth: 30,
                maxBuildingHealth: bBlueprint.health || 200,
                buildingWidth: bWidth,
                buildingHeight: bHeight,
                rotationAngle: chosenRotation,
                isCompleted: false,
                constructionProgress: 0,
                requiredMaterials: { ...(bBlueprint.cost || { wood: 5 }) },
                deliveredMaterials: {},
                gridPosition: [bx, bz],
                position: [bx + bWidth / 2, buildingH, bz + bHeight / 2],
                factionId: botFactionId,
                regionId: region.id,
                wage: bBlueprint.defaultWage || DEFAULT_WAGE,
                assignedWorkers: [],
              };
              world.add(botBuilding);

              consumeResourcesFromBotSettlement(botBuildings, woodCost, stoneCost);
              memory.wood = Math.max(0, memory.wood - woodCost);
              memory.stone = Math.max(0, memory.stone - stoneCost);
              memory.buildStage++;

              if (BotAISystem.connectBuildingToRoadNetwork(botBuilding, grid, region, resourceDeposits, currentTick)) {
                incrementBuildingVersion();
                incrementFoliageVersion();
              }

              const builderPeasant = !isNightTime
                ? (peasants.find((p) => (!p.currentJob || p.currentJob.type === 'idle' || p.currentJob.type === 'wander') && p.currentJob?.type !== 'sleep' && p.currentJob?.type !== 'sit_by_fire') ||
                   peasants.find((p) => p.currentJob?.type !== 'sleep' && p.currentJob?.type !== 'sit_by_fire'))
                : undefined;

              if (builderPeasant && builderPeasant.gridPosition) {
                const hp = builderPeasant.hasMule ? null : HaulingJobHandler.findAvailableHitchingPost(builderPeasant, region.id);
                if (builderPeasant.hasMule || hp) {
                  builderPeasant.currentJob = {
                    id: `bot-haul-const-${bId}-${Date.now()}`,
                    type: 'haul_construction_mule',
                    targetBuildingId: bId,
                    progress: 0,
                    totalWork: 30,
                  };

                  if (!builderPeasant.hasMule && hp) {
                    builderPeasant.assignedMuleHutId = hp.id;
                    const hpPos = hp.position || [hp.gridPosition ? hp.gridPosition[0] + 1.5 : bx, 0, hp.gridPosition ? hp.gridPosition[1] + 1.0 : bz];
                    const path = AStar.findPathToArea(grid, builderPeasant.gridPosition, hp.gridPosition ? hp.gridPosition[0] : Math.floor(hpPos[0]), hp.gridPosition ? hp.gridPosition[1] : Math.floor(hpPos[2]), hp.buildingWidth || 3, hp.buildingHeight || 2);
                    if (path && path.length > 0) {
                      builderPeasant.path = path;
                    }
                    builderPeasant.speechBubble = {
                      text: "Іду по мула до прив'язі!",
                      expiresAtTick: currentTick + 30,
                      type: 'work',
                    };
                  } else {
                    const storageHub = HaulingJobHandler.getSettlementStorageHub(region.id, botFactionId);
                    if (storageHub) {
                      const sPos = storageHub.position || [storageHub.gridPosition ? storageHub.gridPosition[0] + 1 : bx, 0, storageHub.gridPosition ? storageHub.gridPosition[1] + 1 : bz];
                      const path = AStar.findPathToArea(grid, builderPeasant.gridPosition, storageHub.gridPosition ? storageHub.gridPosition[0] : Math.floor(sPos[0]), storageHub.gridPosition ? storageHub.gridPosition[1] : Math.floor(sPos[2]), storageHub.buildingWidth || 2, storageHub.buildingHeight || 2);
                      if (path && path.length > 0) {
                        builderPeasant.path = path;
                      }
                      builderPeasant.speechBubble = {
                        text: `Веду мула за матеріалами для ${bBlueprint.name}!`,
                        expiresAtTick: currentTick + 30,
                        type: 'work',
                      };
                    }
                  }
                }
              }

              addChronicleEvent({
                title: `Будівництво у ${region.ukrName}`,
                description: `${region.lordName} заклав фундамент для ${bBlueprint.name} у володінні ${region.ukrName}. Селяни беруться за молоти!`,
                type: 'info',
              });

              incrementBuildingVersion();
              incrementFoliageVersion();
            } else {
              BotAISystem.failedGoals.set(`${botFactionId}-${bType}`, currentTick + 50);
            }
          }
        }
      }

      if (updateRegionStats && currentTick % 120 === 0) {
        const activePop = peasants.length + 1;
        const activeBuildings = completedBuildings.length;
        const estWealth = Math.min(600, Math.round(memory.gold + memory.wood * 0.4 + memory.stone * 0.7 + memory.iron * 1.5));
        const estApproval = Math.min(96, Math.max(60, 75 + (completedBuildings.length >= 4 ? 10 : 0)));

        updateRegionStats(region.id, {
          population: activePop,
          buildingsCount: activeBuildings,
          wealth: estWealth,
          approval: estApproval,
        });
      }
    }
  }
}
