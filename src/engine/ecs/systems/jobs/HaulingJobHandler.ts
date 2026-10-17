import type { GameEntity } from '../../world';
import { buildingEntities, characterEntities } from '../../world';
import { GridMap } from '../../../grid/GridMap';
import { AStar } from '../../../pathfinding/AStar';
import { useGameStore } from '../../../../store/useGameStore';
import { distance2D } from '../../../../utils/mathUtils';
import type { ResourceType } from '../../../../types/game';
import { BUILDING_BLUEPRINTS } from '../../../buildings/blueprints';
import {
  getBuildingWorkstation,
  getBuildingFloorHeight,
  createPathToInterior,
} from '../../../buildings/buildingNavigation';
import { BotAISystem } from '../BotAISystem';
import { NIGHT_START_HOUR, NIGHT_END_HOUR } from '../../../../constants/needs';
import {
  MULE_TRANSITION_STEP,
  MULE_HAUL_LOG_WORK,
  MULE_RETURN_WORK,
  MULE_DELIVERED_WOOD_AMOUNT,
  MULE_LOG_SEARCH_RADIUS_WIDE,
  MULE_LOG_SEARCH_RADIUS_CAMP,
  UNREACHABLE_LOG_COOLDOWN_TICKS,
  HAULING_PROXIMITY_THRESHOLD,
} from '../../../../constants/jobs';
import { translations } from '../../../../i18n';

const HAULING_SPEECH_DURATION_TICKS = 25;
const DELIVERED_SPEECH_DURATION_TICKS = 30;

function isNearBuilding(uX: number, uZ: number, b: GameEntity, maxDist = HAULING_PROXIMITY_THRESHOLD): boolean {
  if (b.gridPosition) {
    const bw = b.buildingWidth || 2;
    const bh = b.buildingHeight || 2;
    const minX = b.gridPosition[0];
    const maxX = b.gridPosition[0] + bw;
    const minZ = b.gridPosition[1];
    const maxZ = b.gridPosition[1] + bh;
    const clampedX = Math.max(minX, Math.min(maxX, uX));
    const clampedZ = Math.max(minZ, Math.min(maxZ, uZ));
    return Math.hypot(uX - clampedX, uZ - clampedZ) <= maxDist;
  }
  if (b.position) {
    return distance2D(uX, uZ, b.position[0], b.position[2]) <= maxDist;
  }
  return false;
}

const unreachableLogCooldowns = new Map<string, number>();
const _takenLogPositions = new Set<number>();
const _candidateLogs: Array<{ pos: [number, number]; dist: number }> = [];

export class HaulingJobHandler {
  private static findPathToLog(
    grid: GridMap,
    start: [number, number],
    target: [number, number]
  ): [number, number][] | null {
    let path = AStar.findPath(grid, start, target, true);
    if (path && path.length > 0) return path;
    path = AStar.findPathToArea(grid, start, target[0], target[1], 1, 1);
    if (path && path.length > 0) return path;
    return null;
  }

  public static getSettlementStorageHub(
    targetRegionId?: number,
    factionId?: string,
    playerRegionId?: number
  ): GameEntity | undefined {
    let stockpile: GameEntity | undefined;
    let tent: GameEntity | undefined;
    let campfire: GameEntity | undefined;
    let fallback: GameEntity | undefined;

    const pRegionId = playerRegionId ?? useGameStore.getState().playerRegionId;

    for (const b of buildingEntities) {
      if (!b.isCompleted) continue;

      if (factionId) {
        if (b.factionId && b.factionId !== factionId) continue;
      }

      if (targetRegionId !== undefined) {
        if (b.regionId !== undefined && b.regionId !== targetRegionId) continue;
      } else if (factionId === 'player' || !factionId) {
        if (b.regionId !== undefined && b.regionId !== pRegionId) continue;
      }

      if (b.buildingType === 'stockpile') {
        stockpile = b;
        break;
      }
      if (b.buildingType === 'tent' && !tent) {
        tent = b;
      } else if (b.buildingType === 'campfire' && !campfire) {
        campfire = b;
      } else if (!fallback) {
        fallback = b;
      }
    }

    return stockpile || tent || campfire || fallback;
  }

  public static findAvailableHitchingPost(
    unit: GameEntity,
    targetRegionId?: number
  ): GameEntity | undefined {
    for (const b of buildingEntities) {
      if (b.buildingType === 'hitching_post' && b.isCompleted) {
        if (targetRegionId !== undefined && b.regionId !== undefined && b.regionId !== targetRegionId) continue;
        const mulesCount = b.mulesCount ?? 1;
        let inUse = 0;
        for (const other of characterEntities) {
          if (other.id !== unit.id) {
            const isClaiming =
              other.hasMule ||
              other.muleTransition === 'taking' ||
              other.muleTransition === 'returning' ||
              other.currentJob?.type === 'haul_log_with_mule' ||
              other.currentJob?.type === 'haul_construction_mule' ||
              other.currentJob?.type === 'return_mule';
            if (isClaiming && (other.assignedMuleHutId === b.id || other.currentJob?.targetBuildingId === b.id)) {
              inUse++;
            }
          }
        }
        if (inUse < mulesCount) {
          return b;
        }
      }
    }
    return undefined;
  }

  public static assignStockpileHaulingJob(
    unit: GameEntity,
    storageHub: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number,
    cx: number,
    cz: number
  ): boolean {
    const time = useGameStore.getState().time;
    const isNightTime = time.hour >= NIGHT_START_HOUR || time.hour < NIGHT_END_HOUR;
    const nextCheck = (unit as any).nextHaulingCheckTick || 0;
    if (!unit.hasMule && (isNightTime || currentTick < nextCheck)) {
      return false;
    }
    const isStockpile = storageHub.buildingType === 'stockpile';
    const assignedList = storageHub.assignedWorkers || [];
    const workerIndex = Math.max(0, assignedList.indexOf(unit.id));
    const station = getBuildingWorkstation(storageHub, workerIndex, currentTick);

    const uX = unit.position ? unit.position[0] : (unit.gridPosition ? unit.gridPosition[0] + 0.5 : cx);
    const uZ = unit.position ? unit.position[2] : (unit.gridPosition ? unit.gridPosition[1] + 0.5 : cz);

    const maxStockpileCap = storageHub.maxStorage || (storageHub.buildingType ? BUILDING_BLUEPRINTS[storageHub.buildingType]?.maxStorage : 200) || 200;
    const currentStockpileStored = Object.values(storageHub.localInventory || {}).reduce((acc, val) => acc + (val || 0), 0);

    const playerRegionId = useGameStore.getState().playerRegionId;
    const isPlayerStorage =
      storageHub.factionId === 'player' ||
      (!storageHub.factionId && (storageHub.regionId === undefined || storageHub.regionId === playerRegionId));
    const targetRegionId =
      storageHub.regionId !== undefined ? storageHub.regionId : isPlayerStorage ? playerRegionId : undefined;
    const botFactionId = storageHub.factionId || unit.factionId || (targetRegionId !== undefined ? `bot-${targetRegionId}` : undefined);

    const hp = unit.hasMule
      ? (unit.assignedMuleHutId ? [...buildingEntities].find((b: GameEntity) => b.id === unit.assignedMuleHutId) : undefined) || this.findAvailableHitchingPost(unit, targetRegionId)
      : this.findAvailableHitchingPost(unit, targetRegionId);

    if (isNightTime && unit.hasMule && unit.currentJob?.type !== 'return_mule' && unit.muleTransition !== 'returning') {
      unit.currentJob = {
        id: `return-mule-${Date.now()}`,
        type: 'return_mule',
        targetBuildingId: hp?.id,
        progress: 0,
        totalWork: 20,
      };
      if (hp) {
        const pathReturn = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
        if (pathReturn && pathReturn.length > 0) {
          unit.path = pathReturn;
        }
      }
    }

    if (unit.currentJob?.type === 'return_mule') {
      if (hp && isNearBuilding(uX, uZ, hp)) {
        if (unit.muleTransition !== 'returning') {
          unit.muleTransition = 'returning';
          unit.muleTransitionProgress = 0;
          unit.assignedMuleHutId = hp.id;
          unit.path = [];
          const dict = translations[useGameStore.getState().language];
          unit.speechBubble = {
            text: dict.jobs.leadingMuleToHitch,
            expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
            type: 'work',
          };
        }
        unit.muleTransitionProgress = (unit.muleTransitionProgress || 0) + MULE_TRANSITION_STEP;
        if (unit.muleTransitionProgress >= 1) {
          unit.hasMule = false;
          unit.muleTransition = undefined;
          unit.muleTransitionProgress = undefined;
          unit.assignedMuleHutId = undefined;
          const dict = translations[useGameStore.getState().language];
          unit.speechBubble = {
            text: dict.jobs.returnedMuleToHitch,
            expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
            type: 'work',
          };
          unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
          unit.path = [];
        }
        return true;
      }

      if (unit.path && unit.path.length > 0) {
        return true;
      }

      if (hp) {
        const pathReturn = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
        if (pathReturn && pathReturn.length > 0) {
          unit.path = pathReturn;
          return true;
        }
      }

      return true;
    }

    if (unit.currentJob?.type === 'haul_log_with_mule') {
      const job = unit.currentJob;

      if (job.targetPosition && targetRegionId !== undefined && !GridMap.isCoordInRegion(targetRegionId, job.targetPosition[0], job.targetPosition[1])) {
        if (unit.hasMule && hp) {
          unit.currentJob = {
            id: `return-mule-${Date.now()}`,
            type: 'return_mule',
            targetBuildingId: hp.id,
            progress: 0,
            totalWork: MULE_RETURN_WORK,
          };
          const pathReturn = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
          if (pathReturn && pathReturn.length > 0) {
            unit.path = pathReturn;
          }
          return true;
        }
        unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
        unit.path = [];
        unit.hasMule = false;
        unit.isHaulingLog = false;
        unit.assignedMuleHutId = undefined;
        return true;
      }

      if (!unit.hasMule && hp) {
        if (isNearBuilding(uX, uZ, hp)) {
          if (unit.muleTransition !== 'taking') {
            unit.muleTransition = 'taking';
            unit.muleTransitionProgress = 0;
            unit.assignedMuleHutId = hp.id;
            unit.path = [];
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.takingMuleFromHitch,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };
          }
          unit.muleTransitionProgress = (unit.muleTransitionProgress || 0) + MULE_TRANSITION_STEP;
          if (unit.muleTransitionProgress >= 1) {
            unit.hasMule = true;
            unit.muleTransition = undefined;
            unit.muleTransitionProgress = undefined;
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.tookMuleFromHitch,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };
            if (job.targetPosition) {
              const path = this.findPathToLog(grid, [Math.floor(uX), Math.floor(uZ)], job.targetPosition);
              if (path && path.length > 0) {
                unit.path = path;
              }
            }
          }
          return true;
        } else {
          if (unit.path && unit.path.length > 0) return true;
          const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
          if (path && path.length > 0) {
            unit.path = path;
            return true;
          }
        }
      }

      if (!unit.hasMule) return true;

      if (!unit.isHaulingLog && job.targetPosition) {
        const [lx, lz] = job.targetPosition;
        const distToLog = distance2D(uX, uZ, lx + 0.5, lz + 0.5);
        const isAdjacent = Math.abs(Math.floor(uX) - lx) <= 1 && Math.abs(Math.floor(uZ) - lz) <= 1;

        if (distToLog <= 1.45 && isAdjacent) {
          unit.isHaulingLog = true;
          const tile = grid.getTile(lx, lz);
          if (tile) {
            tile.itemOnGround = undefined;
            tile.foliageType = undefined;
            tile.foliageAngle = undefined;
            tile.foliageTreeType = undefined;
            tile.isPassable = tile.terrain !== 'water';
            grid.removeFoliage(lx, lz);
          }
          useGameStore.getState().incrementFoliageVersion();

          const dict = translations[useGameStore.getState().language];
          unit.speechBubble = {
            text: isStockpile ? dict.jobs.logSecuredToMuleStorehouse : dict.jobs.logSecuredToMuleCamp,
            expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
            type: 'work',
          };

          const sPos = storageHub.gridPosition || [0, 0];
          const pathBack = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], sPos[0], sPos[1], storageHub.buildingWidth || 2, storageHub.buildingHeight || 2);
          if (pathBack && pathBack.length > 0) {
            unit.path = pathBack;
          }
          return true;
        }

        if (unit.path && unit.path.length > 0) {
          return true;
        }

        const path = this.findPathToLog(grid, [Math.floor(uX), Math.floor(uZ)], [lx, lz]);
        if (path && path.length > 0) {
          unit.path = path;
          return true;
        }

        unreachableLogCooldowns.set(`${unit.id}:${lx},${lz}`, currentTick + UNREACHABLE_LOG_COOLDOWN_TICKS);
        const nextLogs: Array<{ pos: [number, number]; dist: number }> = [];
        for (let rx = Math.max(0, cx - MULE_LOG_SEARCH_RADIUS_WIDE); rx <= Math.min(grid.width - 1, cx + MULE_LOG_SEARCH_RADIUS_WIDE); rx++) {
          for (let rz = Math.max(0, cz - MULE_LOG_SEARCH_RADIUS_WIDE); rz <= Math.min(grid.height - 1, cz + MULE_LOG_SEARCH_RADIUS_WIDE); rz++) {
            if (targetRegionId !== undefined && !GridMap.isCoordInRegion(targetRegionId, rx, rz)) continue;
            const coolUntil = unreachableLogCooldowns.get(`${unit.id}:${rx},${rz}`);
            if (coolUntil && currentTick < coolUntil) continue;
            const t = grid.tiles[rx]?.[rz];
            if (t && !t.buildingId && (t.foliageType === 'fallen_tree' || (t.itemOnGround?.type === 'wood' && (t.itemOnGround.amount || 0) > 0))) {
              nextLogs.push({ pos: [rx, rz], dist: distance2D(uX, uZ, rx, rz) });
            }
          }
        }
        nextLogs.sort((a, b) => a.dist - b.dist);
        for (const nLog of nextLogs.slice(0, 6)) {
          const p = this.findPathToLog(grid, [Math.floor(uX), Math.floor(uZ)], nLog.pos);
          if (p && p.length > 0) {
            job.targetPosition = nLog.pos;
            unit.path = p;
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.headingWithMuleAnotherLog,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };
            return true;
          } else {
            unreachableLogCooldowns.set(`${unit.id}:${nLog.pos[0]},${nLog.pos[1]}`, currentTick + UNREACHABLE_LOG_COOLDOWN_TICKS);
          }
        }

        if (hp) {
          unit.currentJob = {
            id: `return-mule-${Date.now()}`,
            type: 'return_mule',
            targetBuildingId: hp.id,
            progress: 0,
            totalWork: MULE_RETURN_WORK,
          };
          const pathReturn = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
          if (pathReturn && pathReturn.length > 0) {
            unit.path = pathReturn;
          }
          return true;
        }

        unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
        unit.path = [];
        unit.hasMule = false;
        unit.isHaulingLog = false;
        unit.assignedMuleHutId = undefined;
        return true;
      } else if (unit.isHaulingLog) {
        if (isNearBuilding(uX, uZ, storageHub)) {
          unit.isHaulingLog = false;
          if (isStockpile) {
            storageHub.localInventory = storageHub.localInventory || {};
            storageHub.localInventory.wood = (storageHub.localInventory.wood || 0) + MULE_DELIVERED_WOOD_AMOUNT;
          }

          if (isPlayerStorage) {
            useGameStore.getState().addResource('wood', MULE_DELIVERED_WOOD_AMOUNT);
          } else if (botFactionId) {
            BotAISystem.addResource(botFactionId, 'wood', MULE_DELIVERED_WOOD_AMOUNT);
          }

          const dict = translations[useGameStore.getState().language];
          unit.speechBubble = {
            text: isStockpile
              ? dict.jobs.deliveredLogToStorehouse(MULE_DELIVERED_WOOD_AMOUNT)
              : dict.jobs.deliveredLogToCamp(MULE_DELIVERED_WOOD_AMOUNT),
            expiresAtTick: currentTick + DELIVERED_SPEECH_DURATION_TICKS,
            type: 'work',
          };

          const remainingLogs: Array<{ pos: [number, number]; dist: number }> = [];
          if (!isNightTime) {
            for (let rx = Math.max(0, cx - MULE_LOG_SEARCH_RADIUS_WIDE); rx <= Math.min(grid.width - 1, cx + MULE_LOG_SEARCH_RADIUS_WIDE); rx++) {
              for (let rz = Math.max(0, cz - MULE_LOG_SEARCH_RADIUS_WIDE); rz <= Math.min(grid.height - 1, cz + MULE_LOG_SEARCH_RADIUS_WIDE); rz++) {
                if (targetRegionId !== undefined && !GridMap.isCoordInRegion(targetRegionId, rx, rz)) continue;
                const coolUntil = unreachableLogCooldowns.get(`${unit.id}:${rx},${rz}`);
                if (coolUntil && currentTick < coolUntil) continue;
                const t = grid.tiles[rx]?.[rz];
                if (t && !t.buildingId && (t.foliageType === 'fallen_tree' || (t.itemOnGround?.type === 'wood' && (t.itemOnGround.amount || 0) > 0))) {
                  remainingLogs.push({ pos: [rx, rz], dist: distance2D(uX, uZ, rx, rz) });
                }
              }
            }
          }

          if (remainingLogs.length > 0) {
            remainingLogs.sort((a, b) => a.dist - b.dist);
            for (const nextLog of remainingLogs.slice(0, 8)) {
              const pathNext = this.findPathToLog(grid, [Math.floor(uX), Math.floor(uZ)], nextLog.pos);
              if (pathNext && pathNext.length > 0) {
                unit.currentJob = {
                  id: `haul-log-${Date.now()}`,
                  type: 'haul_log_with_mule',
                  targetPosition: nextLog.pos,
                  progress: 0,
                  totalWork: MULE_HAUL_LOG_WORK,
                };
                unit.path = pathNext;
                const dict = translations[useGameStore.getState().language];
                unit.speechBubble = {
                  text: dict.jobs.headingWithMuleNextLog,
                  expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
                  type: 'work',
                };
                return true;
              } else {
                unreachableLogCooldowns.set(`${unit.id}:${nextLog.pos[0]},${nextLog.pos[1]}`, currentTick + UNREACHABLE_LOG_COOLDOWN_TICKS);
              }
            }
          }

          if (hp) {
            unit.currentJob = {
              id: `return-mule-${Date.now()}`,
              type: 'return_mule',
              targetBuildingId: hp.id,
              progress: 0,
              totalWork: MULE_RETURN_WORK,
            };
            const pathReturn = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
            if (pathReturn && pathReturn.length > 0) {
              unit.path = pathReturn;
            }
            return true;
          }

          unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
          unit.path = [];
          unit.hasMule = false;
          unit.assignedMuleHutId = undefined;
          return true;
        }

        if (unit.path && unit.path.length > 0) {
          return true;
        }

        const sPos = storageHub.gridPosition || [0, 0];
        const pathBack = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], sPos[0], sPos[1], storageHub.buildingWidth || 2, storageHub.buildingHeight || 2);
        if (pathBack && pathBack.length > 0) {
          unit.path = pathBack;
          return true;
        }
      } else if (unit.hasMule && hp && isNearBuilding(uX, uZ, hp)) {
        unit.currentJob = {
          id: `return-mule-${Date.now()}`,
          type: 'return_mule',
          targetBuildingId: hp.id,
          progress: 0,
          totalWork: 20,
        };
        return true;
      }
    }

    if (unit.currentJob?.type === 'haul_construction_mule' && unit.currentJob.targetBuildingId) {
      let bTarget: GameEntity | undefined;
      for (const b of buildingEntities) {
        if (b.id === unit.currentJob?.targetBuildingId) {
          bTarget = b;
          break;
        }
      }

      if (!bTarget || bTarget.isCompleted) {
        if (unit.hasMule && hp) {
          unit.currentJob = {
            id: `return-mule-${Date.now()}`,
            type: 'return_mule',
            targetBuildingId: hp.id,
            progress: 0,
            totalWork: 20,
          };
          const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
          if (path && path.length > 0) {
            unit.path = path;
            return true;
          }
        }
        if (unit.hasMule && hp) return true;
        unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
        unit.inventory = {};
        return true;
      }

      if (!unit.hasMule && hp) {
        if (isNearBuilding(uX, uZ, hp)) {
          if (unit.muleTransition !== 'taking') {
            unit.muleTransition = 'taking';
            unit.muleTransitionProgress = 0;
            unit.assignedMuleHutId = hp.id;
            unit.path = [];
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.takingMuleFromHitch,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };
          }
          unit.muleTransitionProgress = (unit.muleTransitionProgress || 0) + MULE_TRANSITION_STEP;
          if (unit.muleTransitionProgress >= 1) {
            unit.hasMule = true;
            unit.muleTransition = undefined;
            unit.muleTransitionProgress = undefined;
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.tookMuleFromHitch,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };
            const sPos = storageHub.gridPosition || [0, 0];
            const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], sPos[0], sPos[1], storageHub.buildingWidth || 2, storageHub.buildingHeight || 2);
            if (path && path.length > 0) {
              unit.path = path;
            }
          }
          return true;
        } else {
          if (unit.path && unit.path.length > 0) return true;
          const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
          if (path && path.length > 0) {
            unit.path = path;
            return true;
          }
        }
      }

      if (!unit.hasMule) return true;

      const hasLoadedCargo = unit.inventory && Object.values(unit.inventory).some((amt) => (amt || 0) > 0);

      if (!hasLoadedCargo) {
        if (isNearBuilding(uX, uZ, storageHub) && bTarget) {
          const req = bTarget.requiredMaterials || {};
          const del = bTarget.deliveredMaterials || {};
          unit.inventory = unit.inventory || {};

          let loadedAny = false;
          for (const [resKey, needed] of Object.entries(req)) {
            const res = resKey as ResourceType;
            const alreadyDelivered = del[res] || 0;
            const stillNeed = (needed || 0) - alreadyDelivered;

            if (stillNeed > 0) {
              let availableAmt = 0;
              if (isPlayerStorage) {
                availableAmt = useGameStore.getState().resources[res] || 0;
              } else {
                availableAmt = storageHub.localInventory?.[res] || 20;
              }

              const loadAmt = Math.min(stillNeed, availableAmt);

              if (loadAmt > 0) {
                if (!isPlayerStorage && storageHub.localInventory && storageHub.localInventory[res]) {
                  storageHub.localInventory[res] = Math.max(0, (storageHub.localInventory[res] || 0) - loadAmt);
                }
                if (isPlayerStorage) {
                  useGameStore.getState().consumeResource(res, loadAmt);
                }
                unit.inventory[res] = (unit.inventory[res] || 0) + loadAmt;
                loadedAny = true;
              }
            }
          }

          if (loadedAny) {
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.materialsLoadedOnMule,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };

            const tPos = bTarget.gridPosition || [Math.floor(uX), Math.floor(uZ)];
            const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], tPos[0], tPos[1], bTarget.buildingWidth || 2, bTarget.buildingHeight || 2);
            if (path && path.length > 0) {
              unit.path = path;
              return true;
            }
          } else {
            if (hp) {
              unit.currentJob = {
                id: `return-mule-${Date.now()}`,
                type: 'return_mule',
                targetBuildingId: hp.id,
                progress: 0,
                totalWork: 20,
              };
              const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
              if (path && path.length > 0) {
                unit.path = path;
                return true;
              }
            }
            if (hp) return true;
            unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.notEnoughMaterialsInSettlement,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };
            return true;
          }
        }

        if (unit.path && unit.path.length > 0) {
          return true;
        }

        const sPos = storageHub.gridPosition || [Math.floor(uX), Math.floor(uZ)];
        const pathHome = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], sPos[0], sPos[1], storageHub.buildingWidth || 2, storageHub.buildingHeight || 2);
        if (pathHome && pathHome.length > 0) {
          unit.path = pathHome;
          return true;
        }
      } else if (bTarget) {
        if (isNearBuilding(uX, uZ, bTarget)) {
          bTarget.deliveredMaterials = bTarget.deliveredMaterials || {};
          for (const [resKey, amt] of Object.entries(unit.inventory || {})) {
            const res = resKey as ResourceType;
            if (amt && amt > 0) {
              bTarget.deliveredMaterials[res] = (bTarget.deliveredMaterials[res] || 0) + amt;
            }
          }
          unit.inventory = {};

          const dict = translations[useGameStore.getState().language];
          unit.speechBubble = {
            text: dict.jobs.constructionMaterialsDelivered,
            expiresAtTick: currentTick + DELIVERED_SPEECH_DURATION_TICKS,
            type: 'work',
          };

          if (hp) {
            unit.currentJob = {
              id: `return-mule-${Date.now()}`,
              type: 'return_mule',
              targetBuildingId: hp.id,
              progress: 0,
              totalWork: 20,
            };
            const pathReturn = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
            if (pathReturn && pathReturn.length > 0) {
              unit.path = pathReturn;
              return true;
            }
          }

          if (hp) return true;
          unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
          unit.path = [];
          return true;
        }

        if (unit.path && unit.path.length > 0) {
          return true;
        }

        const bgPos = bTarget.gridPosition || [Math.floor(uX), Math.floor(uZ)];
        const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], bgPos[0], bgPos[1], bTarget.buildingWidth || 2, bTarget.buildingHeight || 2);
        if (path && path.length > 0) {
          unit.path = path;
          return true;
        }
      }
    }

    if (unit.hasMule && !unit.isHaulingLog && (!unit.inventory || Object.keys(unit.inventory).length === 0)) {
      if (hp && isNearBuilding(uX, uZ, hp)) {
        unit.hasMule = false;
        unit.assignedMuleHutId = undefined;
        const dict = translations[useGameStore.getState().language];
        unit.speechBubble = {
          text: dict.jobs.returnedMuleToHitch,
          expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
          type: 'work',
        };
        unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
        unit.path = [];
        return true;
      } else if (hp) {
        if (!unit.path || unit.path.length === 0) {
          const pathReturn = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
          if (pathReturn && pathReturn.length > 0) {
            unit.currentJob = {
              id: `return-mule-${Date.now()}`,
              type: 'return_mule',
              targetBuildingId: hp.id,
              progress: 0,
              totalWork: 20,
            };
            unit.path = pathReturn;
            return true;
          }
        }
      }
    }

    if (isStockpile) {
      const inventoryEntries = Object.entries(unit.inventory || {}).filter(
        ([_, amt]) => (amt || 0) > 0
      ) as [ResourceType, number][];

      if (inventoryEntries.length > 0) {
        const [resType, carryAmount] = inventoryEntries[0];
        const distToStockpile = Math.hypot(uX - station.workWorldPos[0], uZ - station.workWorldPos[1]);

        if (distToStockpile < 1.0) {
          const remainingSpace = Math.max(0, maxStockpileCap - currentStockpileStored);
          const depositAmt = Math.min(carryAmount, remainingSpace > 0 ? remainingSpace : carryAmount);

          storageHub.localInventory = storageHub.localInventory || {};
          storageHub.localInventory[resType] = (storageHub.localInventory[resType] || 0) + depositAmt;

          if (unit.inventory) {
            const leftover = carryAmount - depositAmt;
            if (leftover > 0) {
              unit.inventory[resType] = leftover;
            } else {
              delete unit.inventory[resType];
            }
          }

          const dict = translations[useGameStore.getState().language];
          unit.speechBubble = {
            text: dict.jobs.deliveredGoodsToStorage(depositAmt, currentStockpileStored + depositAmt, maxStockpileCap),
            expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
            type: 'work',
          };

          unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
          unit.path = [];
          return true;
        }

        if (unit.currentJob?.type === 'haul_resource' && unit.path && unit.path.length > 0) {
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
          storageHub
        );

        unit.currentJob = {
          id: `haul-deposit-${unit.id}`,
          type: 'haul_resource',
          targetBuildingId: storageHub.id,
          progress: 0,
          totalWork: 20,
        };

        if (pathHome && pathHome.length > 0) {
          unit.path = pathHome;
        } else {
          const baseH = grid.getTile(Math.floor(station.workWorldPos[0]), Math.floor(station.workWorldPos[1]))?.height || 0;
          const floorY = baseH + getBuildingFloorHeight(storageHub.buildingType) + 0.05;
          unit.position = [station.workWorldPos[0], floorY, station.workWorldPos[1]];
          unit.gridPosition = [Math.floor(station.workWorldPos[0]), Math.floor(station.workWorldPos[1])];
          unit.path = [];
        }
        return true;
      }
    }

    for (const b of buildingEntities) {
      if (!b.isCompleted && b.requiredMaterials) {
        if (targetRegionId !== undefined && b.regionId !== undefined && b.regionId !== targetRegionId) continue;
        if (storageHub.factionId && b.factionId && b.factionId !== storageHub.factionId) continue;

        const req = b.requiredMaterials;
        const del = b.deliveredMaterials || {};

        let hasMissing = false;
        for (const [res, needed] of Object.entries(req)) {
          if ((del[res as ResourceType] || 0) < (needed || 0)) {
            hasMissing = true;
            break;
          }
        }

        if (hasMissing) {
          const alreadyClaimed = [...characterEntities].some(
            (other: GameEntity) =>
              other.id !== unit.id &&
              other.currentJob?.type === 'haul_construction_mule' &&
              other.currentJob?.targetBuildingId === b.id
          );
          if (alreadyClaimed) continue;

          const availableHp = unit.hasMule ? null : this.findAvailableHitchingPost(unit, targetRegionId);
          if (unit.hasMule || availableHp) {
            unit.currentJob = {
              id: `haul-const-${b.id}-${Date.now()}`,
              type: 'haul_construction_mule',
              targetBuildingId: b.id,
              progress: 0,
              totalWork: 30,
            };

            if (!unit.hasMule && availableHp) {
              unit.assignedMuleHutId = availableHp.id;
              const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], availableHp.gridPosition ? availableHp.gridPosition[0] : 0, availableHp.gridPosition ? availableHp.gridPosition[1] : 0, availableHp.buildingWidth || 3, availableHp.buildingHeight || 2);
              if (path && path.length > 0) {
                unit.path = path;
              }
              const dict = translations[useGameStore.getState().language];
              unit.speechBubble = {
                text: dict.jobs.goingForMule,
                expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
                type: 'work',
              };
            } else {
              const sPos = storageHub.gridPosition || [0, 0];
              const pathHome = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], sPos[0], sPos[1], storageHub.buildingWidth || 2, storageHub.buildingHeight || 2);
              if (pathHome && pathHome.length > 0) {
                unit.path = pathHome;
              }
              const dict = translations[useGameStore.getState().language];
              const bName = (b.buildingType ? dict.buildings.items[b.buildingType]?.name : undefined) || b.name || dict.jobs.defaultConstructionTarget;
              unit.speechBubble = {
                text: dict.jobs.leadingMuleForMaterials(bName),
                expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
                type: 'work',
              };
            }
            return true;
          }
        }
      }
    }

    const minX = Math.max(0, cx - MULE_LOG_SEARCH_RADIUS_CAMP);
    const maxX = Math.min(grid.width - 1, cx + MULE_LOG_SEARCH_RADIUS_CAMP);
    const minZ = Math.max(0, cz - MULE_LOG_SEARCH_RADIUS_CAMP);
    const maxZ = Math.min(grid.height - 1, cz + MULE_LOG_SEARCH_RADIUS_CAMP);

    _takenLogPositions.clear();
    for (const c of characterEntities) {
      if (c.id === unit.id || !c.currentJob) continue;
      const oj = c.currentJob;
      if (
        (oj.type === 'haul_log_with_mule' || oj.type === 'chop_fallen_log') &&
        oj.targetPosition
      ) {
        _takenLogPositions.add((Math.floor(oj.targetPosition[1]) << 16) | Math.floor(oj.targetPosition[0]));
      }
    }

    _candidateLogs.length = 0;

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (targetRegionId !== undefined && !GridMap.isCoordInRegion(targetRegionId, x, z)) continue;
        const key = (z << 16) | x;
        if (_takenLogPositions.has(key)) continue;
        const coolUntil = unreachableLogCooldowns.get(`${unit.id}:${x},${z}`);
        if (coolUntil && currentTick < coolUntil) continue;

        const tile = grid.tiles[x]?.[z];
        if (tile && !tile.buildingId && (tile.foliageType === 'fallen_tree' || (tile.itemOnGround?.type === 'wood' && (tile.itemOnGround.amount || 0) > 0))) {
          const dist = distance2D(uX, uZ, x, z);
          _candidateLogs.push({ pos: [x, z], dist });
        }
      }
    }

    if (_candidateLogs.length > 0) {
      _candidateLogs.sort((a, b) => a.dist - b.dist);

      let chosenLog: { pos: [number, number]; dist: number } | null = null;
      let logPath: [number, number][] | null = null;

      const availableHp = unit.hasMule ? null : this.findAvailableHitchingPost(unit, targetRegionId);
      if (unit.hasMule || availableHp) {
        if (unit.hasMule) {
          const maxCheck = Math.min(8, _candidateLogs.length);
          for (let i = 0; i < maxCheck; i++) {
            const cand = _candidateLogs[i];
            const p = this.findPathToLog(grid, [Math.floor(uX), Math.floor(uZ)], cand.pos);
            if (p && p.length > 0) {
              chosenLog = cand;
              logPath = p;
              break;
            } else {
              unreachableLogCooldowns.set(`${unit.id}:${cand.pos[0]},${cand.pos[1]}`, currentTick + UNREACHABLE_LOG_COOLDOWN_TICKS);
            }
          }
        } else {
          chosenLog = _candidateLogs[0];
        }

        if (chosenLog) {
          unit.currentJob = {
            id: `haul-log-${Date.now()}`,
            type: 'haul_log_with_mule',
            targetPosition: chosenLog.pos,
            progress: 0,
            totalWork: 30,
          };

          if (!unit.hasMule && availableHp) {
            unit.assignedMuleHutId = availableHp.id;
            const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], availableHp.gridPosition ? availableHp.gridPosition[0] : 0, availableHp.gridPosition ? availableHp.gridPosition[1] : 0, availableHp.buildingWidth || 3, availableHp.buildingHeight || 2);
            if (path && path.length > 0) {
              unit.path = path;
            }
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.goingForMule,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };
          } else if (logPath && logPath.length > 0) {
            unit.path = logPath;
            const dict = translations[useGameStore.getState().language];
            unit.speechBubble = {
              text: dict.jobs.headingWithMulePreparedLog,
              expiresAtTick: currentTick + HAULING_SPEECH_DURATION_TICKS,
              type: 'work',
            };
          }
          return true;
        }
      }
    }

    if (unit.hasMule && _candidateLogs.length === 0) {
      if (hp) {
        unit.currentJob = {
          id: `return-mule-${Date.now()}`,
          type: 'return_mule',
          targetBuildingId: hp.id,
          progress: 0,
          totalWork: 20,
        };
        const pathReturn = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : 0, hp.gridPosition ? hp.gridPosition[1] : 0, hp.buildingWidth || 3, hp.buildingHeight || 2);
        if (pathReturn && pathReturn.length > 0) {
          unit.path = pathReturn;
          return true;
        }
      }
      unit.hasMule = false;
      unit.isHaulingLog = false;
      unit.assignedMuleHutId = undefined;
    }

    (unit as any).nextHaulingCheckTick = currentTick + 15;
    return false;
  }
}
