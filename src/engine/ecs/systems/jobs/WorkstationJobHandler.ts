import type { GameEntity } from '../../world';
import { buildingEntities } from '../../world';
import { GridMap } from '../../../grid/GridMap';
import { AStar } from '../../../pathfinding/AStar';
import {
  getBuildingWorkstation,
  getBuildingFloorHeight,
  createPathToInterior,
  createPathFromInterior,
} from '../../../buildings/buildingNavigation';
import { distance2D } from '../../../../utils/mathUtils';

export class WorkstationJobHandler {
  public static assignWorkstationJob(
    unit: GameEntity,
    building: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number
  ): boolean {
    if (unit.hasMule || unit.muleTransition || unit.isHaulingLog) {
      unit.hasMule = false;
      unit.muleTransition = undefined;
      unit.muleTransitionProgress = undefined;
      unit.assignedMuleHutId = undefined;
      unit.isHaulingLog = false;
    }

    const assignedList = building.assignedWorkers || [];
    const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
    const station = getBuildingWorkstation(building, workerIndex, currentTick);

    const baseH = grid.getTile(Math.floor(station.workWorldPos[0]), Math.floor(station.workWorldPos[1]))?.height || 0;
    const floorY = baseH + getBuildingFloorHeight(building.buildingType) + 0.05;

    const facingAngle = Math.atan2(
      station.facingTarget[0] - station.workWorldPos[0],
      station.facingTarget[1] - station.workWorldPos[1]
    );

    const uX = unit.position ? unit.position[0] : (unit.gridPosition ? unit.gridPosition[0] + 0.5 : 0);
    const uZ = unit.position ? unit.position[2] : (unit.gridPosition ? unit.gridPosition[1] + 0.5 : 0);
    const distToStation = Math.hypot(uX - station.workWorldPos[0], uZ - station.workWorldPos[1]);

    const isAlreadyAtStation = distToStation < 0.6 && (!unit.path || unit.path.length === 0);

    if (isAlreadyAtStation) {
      if (unit.currentJob?.type !== 'work_at_building') {
        unit.currentJob = {
          id: `work-${unit.id}`,
          type: 'work_at_building',
          targetBuildingId: building.id,
          targetPosition: [station.workWorldPos[0], station.workWorldPos[1]],
          targetAngle: facingAngle,
          targetY: floorY,
          progress: 0,
          totalWork: 100,
        };
        unit.position = [station.workWorldPos[0], floorY, station.workWorldPos[1]];
        unit.gridPosition = [Math.floor(station.workWorldPos[0]), Math.floor(station.workWorldPos[1])];
        unit.path = [];
      } else {
        unit.currentJob.targetAngle = facingAngle;
      }

      if (currentTick % 70 === 0 && Math.random() < 0.25) {
        unit.speechBubble = {
          text: `Працюю: ${building.name || 'споруда'}`,
          expiresAtTick: currentTick + 25,
          type: 'work',
        };
      }
      return true;
    }

    if (unit.currentJob?.type === 'work_at_building' && unit.path && unit.path.length > 0) {
      return true;
    }

    const uPos: [number, number] = unit.gridPosition || [
      Math.floor(uX),
      Math.floor(uZ),
    ];

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
      id: `work-${unit.id}-${Date.now()}`,
      type: 'work_at_building',
      targetBuildingId: building.id,
      targetPosition: [station.workWorldPos[0], station.workWorldPos[1]],
      targetAngle: facingAngle,
      targetY: floorY,
      progress: 0,
      totalWork: 100,
    };

    if (path && path.length > 0) {
      unit.path = path;
      unit.speechBubble = {
        text: `Іду на зміну: ${building.name || 'споруда'}`,
        expiresAtTick: currentTick + 20,
        type: 'work',
      };
    } else {
      unit.position = [station.workWorldPos[0], floorY, station.workWorldPos[1]];
      unit.gridPosition = [Math.floor(station.workWorldPos[0]), Math.floor(station.workWorldPos[1])];
      unit.path = [];
    }

    return true;
  }

  public static handleOffWorkHours(
    unit: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    cx: number,
    cz: number,
    currentTick?: number
  ): void {
    if (unit.hasMule || unit.muleTransition || unit.isHaulingLog) {
      unit.hasMule = false;
      unit.muleTransition = undefined;
      unit.muleTransitionProgress = undefined;
      unit.assignedMuleHutId = undefined;
      unit.isHaulingLog = false;
    }

    if (unit.currentJob?.type === 'chop_tree' || unit.currentJob?.type === 'work_at_building') {
      const prevBuildingId = unit.currentJob.targetBuildingId || unit.workBuildingId;
      unit.currentJob = { id: `idle-${unit.id}`, type: 'idle', progress: 0, totalWork: 0 };

      if (prevBuildingId) {
        let b: GameEntity | undefined;
        for (const be of buildingEntities) {
          if (be.id === prevBuildingId) {
            b = be;
            break;
          }
        }
        if (b) {
          const assignedList = b.assignedWorkers || [];
          const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
          const station = getBuildingWorkstation(b, workerIndex, currentTick || 0);
          if (station.intermediatePos) {
            const exitPath = createPathFromInterior(
              grid,
              station.doorWorldPos,
              station.doorApproachPos,
              station.doorApproachPos,
              station.intermediatePos,
              uBounds
            );
            if (exitPath && exitPath.length > 0) {
              unit.path = exitPath;
              return;
            }
          }
        }
      }

      if (unit.gridPosition) {
        const [ux, uz] = unit.gridPosition;
        const distToCenter = distance2D(ux, uz, cx, cz);
        if (distToCenter > 15 && (!unit.path || unit.path.length === 0)) {
          const wanderTarget: [number, number] = [
            cx + Math.floor(Math.random() * 5 - 2),
            cz + Math.floor(Math.random() * 5 - 2),
          ];
          const returnPath = AStar.findPath(grid, [ux, uz], wanderTarget, true, uBounds);
          if (returnPath && returnPath.length > 0) {
            unit.path = returnPath;
          }
        }
      }
    }
  }
}
