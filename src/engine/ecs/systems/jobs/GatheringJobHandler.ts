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
    const maxStorage = building.maxStorage || 30;
    const fishCount = inv.fish || 0;

    if (fishCount >= maxStorage) {
      if (currentTick % 120 === 0 && Math.random() < 0.3) {
        unit.speechBubble = {
          text: `Склад риби повний (${fishCount}/${maxStorage})! Відпочиваю`,
          expiresAtTick: currentTick + 25,
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
          totalWork: 60,
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
          building.localInventory.fish = (building.localInventory.fish || 0) + 1;
          useGameStore.getState().addResource('fish', 1);

          unit.speechBubble = {
            text: 'Спіймано свіжу рибу! (+1 риби)',
            expiresAtTick: currentTick + 25,
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
      totalWork: 60,
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
    const maxStorage = building.maxStorage || 30;
    const berryCount = inv.berries || 0;

    if (berryCount >= maxStorage) {
      if (currentTick % 120 === 0 && Math.random() < 0.3) {
        unit.speechBubble = {
          text: `Кошики ягід повні (${berryCount}/${maxStorage})! Відпочиваю`,
          expiresAtTick: currentTick + 25,
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

    if (targetDeposit && minDist <= 35) {
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
            totalWork: 45,
          };
          unit.path = [];
        } else {
          unit.currentJob.progress += 1;
          if (unit.currentJob.progress >= unit.currentJob.totalWork) {
            unit.currentJob.progress = 0;
            building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
            building.localInventory.berries = (building.localInventory.berries || 0) + 2;
            useGameStore.getState().addResource('berries', 2);

            unit.speechBubble = {
              text: 'Зібрано соковиті ягоди! (+2 ягід)',
              expiresAtTick: currentTick + 25,
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
          totalWork: 45,
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
          totalWork: 50,
        };
      } else {
        unit.currentJob.progress += 1;
        if (unit.currentJob.progress >= unit.currentJob.totalWork) {
          unit.currentJob.progress = 0;
          building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
          building.localInventory.berries = (building.localInventory.berries || 0) + 1;
          useGameStore.getState().addResource('berries', 1);
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
    const maxStorage = building.maxStorage || 30;
    const meatCount = inv.meat || 0;

    if (meatCount >= maxStorage) {
      if (currentTick % 120 === 0 && Math.random() < 0.3) {
        unit.speechBubble = {
          text: `Сховище дичини повне (${meatCount}/${maxStorage})! Відпочиваю`,
          expiresAtTick: currentTick + 25,
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

    if (targetDeposit && minDist <= 40) {
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
            totalWork: 55,
          };
          unit.path = [];
        } else {
          unit.currentJob.progress += 1;
          if (unit.currentJob.progress >= unit.currentJob.totalWork) {
            unit.currentJob.progress = 0;
            building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
            building.localInventory.meat = (building.localInventory.meat || 0) + 2;
            building.localInventory.hides = (building.localInventory.hides || 0) + 1;
            useGameStore.getState().addResource('meat', 2);
            useGameStore.getState().addResource('hides', 1);

            unit.speechBubble = {
              text: 'Здобич упольовано! (+2 мʼяса, +1 шкура)',
              expiresAtTick: currentTick + 25,
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
          totalWork: 55,
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
          totalWork: 60,
        };
      } else {
        unit.currentJob.progress += 1;
        if (unit.currentJob.progress >= unit.currentJob.totalWork) {
          unit.currentJob.progress = 0;
          building.localInventory = building.localInventory || { wood: 0, stone: 0, wheat: 0, bread: 0, ale: 0 };
          building.localInventory.meat = (building.localInventory.meat || 0) + 1;
          useGameStore.getState().addResource('meat', 1);
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

            unit.speechBubble = {
              text: 'Висаджено молодий дубок!',
              expiresAtTick: currentTick + 25,
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

    for (let dx = -10; dx <= 10; dx++) {
      for (let dz = -10; dz <= 10; dz++) {
        const tx = bPos[0] + dx;
        const tz = bPos[1] + dz;
        const tile = grid.getTile(tx, tz);
        if (tile && tile.terrain === 'grass' && !tile.buildingId && !tile.foliageType && tile.isPassable) {
          const d = Math.hypot(dx, dz);
          if (d > 2.5 && d < bestDist) {
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
          totalWork: 40,
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
          totalWork: 40,
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
