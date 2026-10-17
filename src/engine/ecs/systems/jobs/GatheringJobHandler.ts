import type { GameEntity } from '../../world';
import { GridMap } from '../../../grid/GridMap';
import { AStar } from '../../../pathfinding/AStar';
import { useGameStore } from '../../../../store/useGameStore';
import { distance2D } from '../../../../utils/mathUtils';
import {
  getBuildingWorkstation,
  getBuildingFloorHeight,
  createPathToInterior,
} from '../../../buildings/buildingNavigation';
import {
  GATHERING_FALLBACK_MAX_STORAGE,
  FISHERMAN_WORK_DURATION,
  FISHERMAN_YIELD,
  FORAGER_BERRY_SEARCH_RADIUS,
  FORAGER_BERRY_WORK,
  FORAGER_BERRY_YIELD,
  FORAGER_TABLE_WORK,
  FORAGER_TABLE_YIELD,
  HUNTER_GAME_SEARCH_RADIUS,
  HUNTER_GAME_WORK,
  HUNTER_MEAT_YIELD,
  HUNTER_HIDES_YIELD,
  HUNTER_HUT_WORK,
  HUNTER_HUT_MEAT_YIELD,
  FORESTER_PLANT_WORK,
  FORESTER_BENCH_WORK,
  FORESTER_PLANT_SEARCH_RADIUS,
  FORESTER_PLANT_MIN_DISTANCE,
} from '../../../../constants/jobs';
import { translations } from '../../../../i18n';

const GATHERING_SPEECH_DURATION_TICKS = 25;
const GATHERING_STORAGE_FULL_INTERVAL_TICKS = 120;
const GATHERING_STORAGE_FULL_SPEECH_CHANCE = 0.3;

export class GatheringJobHandler {
  public static assignGatheringJob(
    unit: GameEntity,
    building: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number,
    cx: number,
    cz: number
  ): boolean {
    const bType = building.buildingType;
    if (!bType) return false;

    if (unit.hasMule || unit.muleTransition || unit.isHaulingLog) {
      unit.hasMule = false;
      unit.muleTransition = undefined;
      unit.muleTransitionProgress = undefined;
      unit.assignedMuleHutId = undefined;
      unit.isHaulingLog = false;
    }

    if (bType === 'fishermans_hut') {
      return this.handleFishermanCycle(unit, building, grid, uBounds, currentTick);
    } else if (bType === 'foragers_hut') {
      return this.handleForagerCycle(unit, building, grid, uBounds, currentTick, cx, cz);
    } else if (bType === 'hunters_hut') {
      return this.handleHunterCycle(unit, building, grid, uBounds, currentTick, cx, cz);
    } else if (bType === 'foresters_hut') {
      return this.handleForesterCycle(unit, building, grid, uBounds, currentTick, cx, cz);
    }

    return false;
  }

  private static handleFishermanCycle(
    unit: GameEntity,
    building: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number
  ): boolean {
    const inv = building.localInventory || {};
    const maxStorage = building.maxStorage || GATHERING_FALLBACK_MAX_STORAGE;
    const fishCount = inv.fish || 0;

    if (fishCount >= maxStorage) {
      if (currentTick % GATHERING_STORAGE_FULL_INTERVAL_TICKS === 0 && Math.random() < GATHERING_STORAGE_FULL_SPEECH_CHANCE) {
        const dict = translations[useGameStore.getState().language];
        unit.speechBubble = {
          text: dict.jobs.fishStorageFull(fishCount, maxStorage),
          expiresAtTick: currentTick + GATHERING_SPEECH_DURATION_TICKS,
          type: 'work',
        };
      }
      unit.currentJob = { id: `idle-full-${unit.id}`, type: 'idle', progress: 0, totalWork: 0 };
      return false;
    }

    const assignedList = building.assignedWorkers || [];
    const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
    const station = getBuildingWorkstation(building, workerIndex);

    const baseH = grid.getTile(Math.floor(station.workWorldPos[0]), Math.floor(station.workWorldPos[1]))?.height || 0;
    const floorY = baseH + getBuildingFloorHeight(building.buildingType) + 0.05;

    const facingAngle = Math.atan2(
      station.facingTarget[0] - station.workWorldPos[0],
      station.facingTarget[1] - station.workWorldPos[1]
    );

    const uX = unit.position ? unit.position[0] : (unit.gridPosition ? unit.gridPosition[0] + 0.5 : 0);
    const uZ = unit.position ? unit.position[2] : (unit.gridPosition ? unit.gridPosition[1] + 0.5 : 0);
    const distToStation = Math.hypot(uX - station.workWorldPos[0], uZ - station.workWorldPos[1]);

    if (distToStation < 0.8 || ((!unit.path || unit.path.length === 0) && distToStation < 1.4)) {
      if (unit.currentJob?.type !== 'work_at_building') {
        unit.currentJob = {
          id: `fish-${unit.id}`,
          type: 'work_at_building',
          targetBuildingId: building.id,
          targetPosition: [station.workWorldPos[0], station.workWorldPos[1]],
          targetAngle: facingAngle,
          targetY: floorY,
          progress: 0,
          totalWork: FISHERMAN_WORK_DURATION,
        };
        unit.position = [station.workWorldPos[0], floorY, station.workWorldPos[1]];
        unit.gridPosition = [Math.floor(station.workWorldPos[0]), Math.floor(station.workWorldPos[1])];
        unit.path = [];
      } else {
        unit.currentJob.targetAngle = facingAngle;
        unit.currentJob.progress += 1;

        if (unit.currentJob.progress >= unit.currentJob.totalWork) {
          unit.currentJob.progress = 0;
          building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
          building.localInventory.fish = (building.localInventory.fish || 0) + FISHERMAN_YIELD;
          useGameStore.getState().addResource('fish', FISHERMAN_YIELD);

          const dict = translations[useGameStore.getState().language];
          unit.speechBubble = {
            text: dict.jobs.caughtFreshFish(FISHERMAN_YIELD),
            expiresAtTick: currentTick + GATHERING_SPEECH_DURATION_TICKS,
            type: 'work',
          };
        }
      }
      return true;
    }

    if (unit.currentJob?.type === 'work_at_building' && unit.path && unit.path.length > 0) {
      return true;
    }

    const uPos: [number, number] = unit.gridPosition || [Math.floor(uX), Math.floor(uZ)];
    const path = createPathToInterior(
      grid,
      uPos,
      station.doorApproachPos,
      station.doorWorldPos,
      station.workWorldPos,
      station.intermediatePos,
      uBounds,
      unit.position,
      building
    );

    unit.currentJob = {
      id: `fish-nav-${unit.id}`,
      type: 'work_at_building',
      targetBuildingId: building.id,
      targetPosition: [station.workWorldPos[0], station.workWorldPos[1]],
      targetAngle: facingAngle,
      targetY: floorY,
      progress: 0,
      totalWork: FISHERMAN_WORK_DURATION,
    };

    if (path && path.length > 0) {
      unit.path = path;
    } else {
      unit.position = [station.workWorldPos[0], floorY, station.workWorldPos[1]];
      unit.gridPosition = [Math.floor(station.workWorldPos[0]), Math.floor(station.workWorldPos[1])];
      unit.path = [];
    }

    return true;
  }

  private static handleForagerCycle(
    unit: GameEntity,
    building: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number,
    cx: number,
    cz: number
  ): boolean {
    const inv = building.localInventory || {};
    const maxStorage = building.maxStorage || GATHERING_FALLBACK_MAX_STORAGE;
    const berryCount = inv.berries || 0;

    if (berryCount >= maxStorage) {
      if (currentTick % GATHERING_STORAGE_FULL_INTERVAL_TICKS === 0 && Math.random() < GATHERING_STORAGE_FULL_SPEECH_CHANCE) {
        const dict = translations[useGameStore.getState().language];
        unit.speechBubble = {
          text: dict.jobs.berryBasketsFull(berryCount, maxStorage),
          expiresAtTick: currentTick + GATHERING_SPEECH_DURATION_TICKS,
          type: 'work',
        };
      }
      unit.currentJob = { id: `idle-full-${unit.id}`, type: 'idle', progress: 0, totalWork: 0 };
      return false;
    }

    const deposits = useGameStore.getState().resourceDeposits || [];
    const berryDeposits = deposits.filter((d) => d.type === 'berries' && (d.currentAmount === undefined || d.currentAmount > 0));

    let targetDeposit = berryDeposits[0];
    let minDist = Infinity;
    for (const d of berryDeposits) {
      const dist = distance2D(cx, cz, d.gridPosition[0], d.gridPosition[1]);
      if (dist < minDist) {
        minDist = dist;
        targetDeposit = d;
      }
    }

    const uX = unit.position ? unit.position[0] : (unit.gridPosition ? unit.gridPosition[0] + 0.5 : 0);
    const uZ = unit.position ? unit.position[2] : (unit.gridPosition ? unit.gridPosition[1] + 0.5 : 0);

    if (targetDeposit && minDist <= FORAGER_BERRY_SEARCH_RADIUS) {
      const depX = targetDeposit.gridPosition[0] + 0.5;
      const depZ = targetDeposit.gridPosition[1] + 0.5;
      const distToDep = Math.hypot(uX - depX, uZ - depZ);

      if (distToDep <= 1.8) {
        if (unit.currentJob?.type !== 'gather_berries') {
          unit.currentJob = {
            id: `forage-${unit.id}`,
            type: 'gather_berries' as any,
            targetPosition: [targetDeposit.gridPosition[0], targetDeposit.gridPosition[1]],
            progress: 0,
            totalWork: FORAGER_BERRY_WORK,
          };
          unit.path = [];
        } else {
          unit.currentJob.progress += 1;
          if (unit.currentJob.progress >= unit.currentJob.totalWork) {
            unit.currentJob.progress = 0;
            building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
            building.localInventory.berries = (building.localInventory.berries || 0) + FORAGER_BERRY_YIELD;
            useGameStore.getState().addResource('berries', FORAGER_BERRY_YIELD);

            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.gatheredBerries(FORAGER_BERRY_YIELD),
              expiresAtTick: currentTick + GATHERING_SPEECH_DURATION_TICKS,
              type: 'work',
            };

            const assignedList = building.assignedWorkers || [];
            const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
            const station = getBuildingWorkstation(building, workerIndex);
            const pathHome = AStar.findPath(grid, [Math.floor(uX), Math.floor(uZ)], station.doorApproachPos, true, uBounds);
            if (pathHome && pathHome.length > 0) {
              unit.path = pathHome;
            }
          }
        }
        return true;
      }

      if (unit.currentJob?.type === 'gather_berries' && unit.path && unit.path.length > 0) {
        return true;
      }

      const path = AStar.findPath(grid, [Math.floor(uX), Math.floor(uZ)], targetDeposit.gridPosition, true, uBounds);
      if (path && path.length > 0) {
        unit.currentJob = {
          id: `forage-travel-${unit.id}`,
          type: 'gather_berries' as any,
          targetPosition: [targetDeposit.gridPosition[0], targetDeposit.gridPosition[1]],
          progress: 0,
          totalWork: FORAGER_BERRY_WORK,
        };
        unit.path = path;
        return true;
      }
    }

    const assignedList = building.assignedWorkers || [];
    const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
    const station = getBuildingWorkstation(building, workerIndex);
    const distToHut = Math.hypot(uX - station.workWorldPos[0], uZ - station.workWorldPos[1]);

    if (distToHut < 0.6) {
      if (unit.currentJob?.type !== 'work_at_building') {
        unit.currentJob = {
          id: `forage-table-${unit.id}`,
          type: 'work_at_building',
          targetBuildingId: building.id,
          progress: 0,
          totalWork: FORAGER_TABLE_WORK,
        };
      } else {
        unit.currentJob.progress += 1;
        if (unit.currentJob.progress >= unit.currentJob.totalWork) {
          unit.currentJob.progress = 0;
          building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
          building.localInventory.berries = (building.localInventory.berries || 0) + FORAGER_TABLE_YIELD;
          useGameStore.getState().addResource('berries', FORAGER_TABLE_YIELD);
        }
      }
      return true;
    }

    const pathHome = createPathToInterior(
      grid,
      [Math.floor(uX), Math.floor(uZ)],
      station.doorApproachPos,
      station.doorWorldPos,
      station.workWorldPos,
      station.intermediatePos,
      uBounds,
      unit.position,
      building
    );
    if (pathHome && pathHome.length > 0) {
      unit.path = pathHome;
    }
    return true;
  }

  private static handleHunterCycle(
    unit: GameEntity,
    building: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number,
    cx: number,
    cz: number
  ): boolean {
    const inv = building.localInventory || {};
    const maxStorage = building.maxStorage || GATHERING_FALLBACK_MAX_STORAGE;
    const meatCount = inv.meat || 0;

    if (meatCount >= maxStorage) {
      if (currentTick % GATHERING_STORAGE_FULL_INTERVAL_TICKS === 0 && Math.random() < GATHERING_STORAGE_FULL_SPEECH_CHANCE) {
        const dict = translations[useGameStore.getState().language];
        unit.speechBubble = {
          text: dict.jobs.gameStorageFull(meatCount, maxStorage),
          expiresAtTick: currentTick + GATHERING_SPEECH_DURATION_TICKS,
          type: 'work',
        };
      }
      unit.currentJob = { id: `idle-full-${unit.id}`, type: 'idle', progress: 0, totalWork: 0 };
      return false;
    }

    const deposits = useGameStore.getState().resourceDeposits || [];
    const gameDeposits = deposits.filter((d) => d.type === 'wild_game' && (d.currentAmount === undefined || d.currentAmount > 0));

    let targetDeposit = gameDeposits[0];
    let minDist = Infinity;
    for (const d of gameDeposits) {
      const dist = distance2D(cx, cz, d.gridPosition[0], d.gridPosition[1]);
      if (dist < minDist) {
        minDist = dist;
        targetDeposit = d;
      }
    }

    const uX = unit.position ? unit.position[0] : (unit.gridPosition ? unit.gridPosition[0] + 0.5 : 0);
    const uZ = unit.position ? unit.position[2] : (unit.gridPosition ? unit.gridPosition[1] + 0.5 : 0);

    if (targetDeposit && minDist <= HUNTER_GAME_SEARCH_RADIUS) {
      const depX = targetDeposit.gridPosition[0] + 0.5;
      const depZ = targetDeposit.gridPosition[1] + 0.5;
      const distToDep = Math.hypot(uX - depX, uZ - depZ);

      if (distToDep <= 2.2) {
        if (unit.currentJob?.type !== 'hunt_game') {
          unit.currentJob = {
            id: `hunt-${unit.id}`,
            type: 'hunt_game' as any,
            targetPosition: [targetDeposit.gridPosition[0], targetDeposit.gridPosition[1]],
            progress: 0,
            totalWork: HUNTER_GAME_WORK,
          };
          unit.path = [];
        } else {
          unit.currentJob.progress += 1;
          if (unit.currentJob.progress >= unit.currentJob.totalWork) {
            unit.currentJob.progress = 0;
            building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
            building.localInventory.meat = (building.localInventory.meat || 0) + HUNTER_MEAT_YIELD;
            building.localInventory.hides = (building.localInventory.hides || 0) + HUNTER_HIDES_YIELD;
            useGameStore.getState().addResource('meat', HUNTER_MEAT_YIELD);
            useGameStore.getState().addResource('hides', HUNTER_HIDES_YIELD);

            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.gameHunted(HUNTER_MEAT_YIELD, HUNTER_HIDES_YIELD),
              expiresAtTick: currentTick + GATHERING_SPEECH_DURATION_TICKS,
              type: 'work',
            };

            const assignedList = building.assignedWorkers || [];
            const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
            const station = getBuildingWorkstation(building, workerIndex);
            const pathHome = AStar.findPath(grid, [Math.floor(uX), Math.floor(uZ)], station.doorApproachPos, true, uBounds);
            if (pathHome && pathHome.length > 0) {
              unit.path = pathHome;
            }
          }
        }
        return true;
      }

      if (unit.currentJob?.type === 'hunt_game' && unit.path && unit.path.length > 0) {
        return true;
      }

      const path = AStar.findPath(grid, [Math.floor(uX), Math.floor(uZ)], targetDeposit.gridPosition, true, uBounds);
      if (path && path.length > 0) {
        unit.currentJob = {
          id: `hunt-travel-${unit.id}`,
          type: 'hunt_game' as any,
          targetPosition: [targetDeposit.gridPosition[0], targetDeposit.gridPosition[1]],
          progress: 0,
          totalWork: HUNTER_GAME_WORK,
        };
        unit.path = path;
        return true;
      }
    }

    const assignedList = building.assignedWorkers || [];
    const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
    const station = getBuildingWorkstation(building, workerIndex);
    const distToHut = Math.hypot(uX - station.workWorldPos[0], uZ - station.workWorldPos[1]);

    if (distToHut < 0.6) {
      if (unit.currentJob?.type !== 'work_at_building') {
        unit.currentJob = {
          id: `hunt-hut-${unit.id}`,
          type: 'work_at_building',
          targetBuildingId: building.id,
          progress: 0,
          totalWork: HUNTER_HUT_WORK,
        };
      } else {
        unit.currentJob.progress += 1;
        if (unit.currentJob.progress >= unit.currentJob.totalWork) {
          unit.currentJob.progress = 0;
          building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
          building.localInventory.meat = (building.localInventory.meat || 0) + HUNTER_HUT_MEAT_YIELD;
          useGameStore.getState().addResource('meat', HUNTER_HUT_MEAT_YIELD);
        }
      }
      return true;
    }

    const pathHome = createPathToInterior(
      grid,
      [Math.floor(uX), Math.floor(uZ)],
      station.doorApproachPos,
      station.doorWorldPos,
      station.workWorldPos,
      station.intermediatePos,
      uBounds,
      unit.position,
      building
    );
    if (pathHome && pathHome.length > 0) {
      unit.path = pathHome;
    }
    return true;
  }

  private static handleForesterCycle(
    unit: GameEntity,
    building: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number,
    cx: number,
    cz: number
  ): boolean {
    const uX = unit.position ? unit.position[0] : (unit.gridPosition ? unit.gridPosition[0] + 0.5 : 0);
    const uZ = unit.position ? unit.position[2] : (unit.gridPosition ? unit.gridPosition[1] + 0.5 : 0);

    if (unit.currentJob?.type === 'plant_tree') {
      const tgt = unit.currentJob.targetPosition;
      if (tgt) {
        const dist = distance2D(uX, uZ, tgt[0] + 0.5, tgt[1] + 0.5);
        if (dist <= 1.4) {
          unit.currentJob.progress += 2;
          if (unit.currentJob.progress >= unit.currentJob.totalWork) {
            grid.setFoliage(tgt[0], tgt[1], 'tree', Math.random() * Math.PI * 2, 'oak');
            useGameStore.getState().incrementFoliageVersion();

            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.plantedYoungOak,
              expiresAtTick: currentTick + GATHERING_SPEECH_DURATION_TICKS,
              type: 'work',
            };

            unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
          }
          return true;
        }
      }
    }

    if (unit.path && unit.path.length > 0) {
      return true;
    }

    let bestPlantTile: [number, number] | null = null;
    let bestDist = Infinity;
    const bPos = building.gridPosition || [cx, cz];

    for (let dx = -FORESTER_PLANT_SEARCH_RADIUS; dx <= FORESTER_PLANT_SEARCH_RADIUS; dx++) {
      for (let dz = -FORESTER_PLANT_SEARCH_RADIUS; dz <= FORESTER_PLANT_SEARCH_RADIUS; dz++) {
        const tx = bPos[0] + dx;
        const tz = bPos[1] + dz;
        const tile = grid.getTile(tx, tz);
        if (tile && tile.terrain === 'grass' && !tile.buildingId && !tile.foliageType && tile.isPassable) {
          const d = Math.hypot(dx, dz);
          if (d > FORESTER_PLANT_MIN_DISTANCE && d < bestDist) {
            bestDist = d;
            bestPlantTile = [tx, tz];
          }
        }
      }
    }

    if (bestPlantTile) {
      const path = AStar.findPath(grid, [Math.floor(uX), Math.floor(uZ)], bestPlantTile, true, uBounds);
      if (path && path.length > 0) {
        unit.currentJob = {
          id: `plant-${unit.id}-${Date.now()}`,
          type: 'plant_tree' as any,
          targetPosition: bestPlantTile,
          progress: 0,
          totalWork: FORESTER_PLANT_WORK,
        };
        unit.path = path;
        return true;
      }
    }

    const assignedList = building.assignedWorkers || [];
    const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
    const station = getBuildingWorkstation(building, workerIndex);
    const distToStation = Math.hypot(uX - station.workWorldPos[0], uZ - station.workWorldPos[1]);

    if (distToStation < 0.8 || ((!unit.path || unit.path.length === 0) && distToStation < 1.4)) {
      if (unit.currentJob?.type !== 'work_at_building') {
        unit.currentJob = {
          id: `forester-bench-${unit.id}`,
          type: 'work_at_building',
          targetBuildingId: building.id,
          progress: 0,
          totalWork: FORESTER_BENCH_WORK,
        };
      }
      return true;
    }

    const pathHome = createPathToInterior(
      grid,
      [Math.floor(uX), Math.floor(uZ)],
      station.doorApproachPos,
      station.doorWorldPos,
      station.workWorldPos,
      station.intermediatePos,
      uBounds,
      unit.position,
      building
    );
    if (pathHome && pathHome.length > 0) {
      unit.path = pathHome;
    }
    return true;
  }
}
