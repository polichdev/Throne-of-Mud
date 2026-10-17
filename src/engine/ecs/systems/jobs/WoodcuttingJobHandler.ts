import type { GameEntity, Job } from '../../world';
import { characterEntities } from '../../world';
import { GridMap } from '../../../grid/GridMap';
import { AStar } from '../../../pathfinding/AStar';
import { getTreeProceduralData } from '../../../world/foliageGeneration';
import { useGameStore } from '../../../../store/useGameStore';
import { distance2D } from '../../../../utils/mathUtils';
import { translations } from '../../../../i18n';
import {
  LUMBERJACK_HUT_MAX_STORAGE,
  WOODCUTTING_SEARCH_RADIUS,
  FALLEN_TREE_PRIORITY_BONUS,
  CHOP_TREE_TOTAL_WORK,
  WAIT_TREE_FALL_TOTAL_WORK,
  CHOP_FALLEN_LOG_TOTAL_WORK,
  CHOP_TREE_BASE_STRIKE,
  CHOP_LOG_STRIKE,
  CHOP_LOG_YIELD,
  WORK_SKILL_STEP_MULTIPLIER,
  CHOP_STRIKE_TICK_INTERVAL,
  TREE_FALL_PROGRESS_STEP,
  LUMBERJACK_HUT_FULL_CHECK_INTERVAL,
  LUMBERJACK_HUT_FULL_SPEECH_CHANCE,
  FAILED_TREE_SEARCH_COOLDOWN_TICKS,
} from '../../../../constants/jobs';

const HUT_PROXIMITY_THRESHOLD = 2.2;
const HUT_FULL_SPEECH_DURATION = 25;
const CHOP_FALLEN_SPEECH_DURATION = 25;
const CHOP_TREE_SPEECH_DURATION = 20;
const CHOP_STRIKE_SPEECH_DURATION = 15;
const WAIT_FALL_SPEECH_DURATION = 20;
const TREE_DOWN_SPEECH_DURATION = 25;
const LOG_READY_SPEECH_DURATION = 30;
const PROGRESS_PCT_EARLY = 40;
const PROGRESS_PCT_MID = 75;
const MAX_CANDIDATE_SEARCH_PATHS = 3;
const TREE_FALL_MIN_DISTANCE_EPSILON = 0.01;
const TREE_HIT_IMPACT = 1.0;
const HALF_TILE_OFFSET = 0.5;
const REGION_BOUNDS_MARGIN = 0.5;

const failedSearchCooldowns = new Map<string, number>();

export class WoodcuttingJobHandler {
  public static assignWoodcutterHutJob(
    unit: GameEntity,
    building: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number,
    cx: number,
    cz: number
  ): boolean {
    if (unit.hasMule || unit.muleTransition || unit.isHaulingLog) {
      unit.hasMule = false;
      unit.muleTransition = undefined;
      unit.muleTransitionProgress = undefined;
      unit.assignedMuleHutId = undefined;
      unit.isHaulingLog = false;
    }

    const nextAllowedSearch = failedSearchCooldowns.get(unit.id) || 0;
    if (currentTick < nextAllowedSearch) {
      return false;
    }
    const hutWood = building.localInventory?.wood || 0;
    const maxStorage = LUMBERJACK_HUT_MAX_STORAGE;

    if (hutWood >= maxStorage) {
      if (
        unit.currentJob?.type === 'chop_tree' ||
        unit.currentJob?.type === 'wait_tree_fall' ||
        unit.currentJob?.type === 'chop_fallen_log'
      ) {
        return false;
      }

      unit.currentJob = { id: `idle-full-${unit.id}`, type: 'idle', progress: 0, totalWork: 0 };

      if (building.gridPosition && unit.gridPosition) {
        const distToHut = distance2D(building.gridPosition[0], building.gridPosition[1], unit.gridPosition[0], unit.gridPosition[1]);
        if (distToHut > HUT_PROXIMITY_THRESHOLD && (!unit.path || unit.path.length === 0)) {
          const hutPath = AStar.findPath(grid, unit.gridPosition, building.gridPosition, true, uBounds);
          if (hutPath && hutPath.length > 0) {
            unit.path = hutPath;
          }
        }
      }

      if (currentTick % LUMBERJACK_HUT_FULL_CHECK_INTERVAL === 0 && Math.random() < LUMBERJACK_HUT_FULL_SPEECH_CHANCE) {
        const dict = translations[useGameStore.getState().language];
        unit.speechBubble = {
          text: dict.jobs.hutStorageFull(hutWood, maxStorage),
          expiresAtTick: currentTick + HUT_FULL_SPEECH_DURATION,
          type: 'work',
        };
      }
      return false;
    }

    if (
      unit.currentJob?.type === 'chop_tree' ||
      unit.currentJob?.type === 'wait_tree_fall' ||
      unit.currentJob?.type === 'chop_fallen_log'
    ) {
      return false;
    }

    let bestTarget: [number, number] | null = null;
    let bestPath: [number, number][] | null = null;
    let isFallenCandidate = false;

    if (unit.gridPosition) {
      const [ux, uz] = unit.gridPosition;
      const hutPos = building.gridPosition || [cx, cz];
      const candidateTrees: Array<{ pos: [number, number]; dist: number; isFallen: boolean }> = [];

      const takenTreePositions = new Set<number>();
      for (const c of characterEntities) {
        if (c.id === unit.id || !c.currentJob) continue;
        const oj = c.currentJob;
        if (
          (oj.type === 'chop_tree' || oj.type === 'wait_tree_fall' || oj.type === 'chop_fallen_log') &&
          oj.targetPosition
        ) {
          takenTreePositions.add((Math.floor(oj.targetPosition[1]) << 16) | Math.floor(oj.targetPosition[0]));
        }
      }

      const minSearchX = uBounds ? Math.max(uBounds.minX, hutPos[0] - WOODCUTTING_SEARCH_RADIUS) : Math.max(0, hutPos[0] - WOODCUTTING_SEARCH_RADIUS);
      const maxSearchX = uBounds ? Math.min(uBounds.maxX, hutPos[0] + WOODCUTTING_SEARCH_RADIUS) : Math.min(grid.width - 1, hutPos[0] + WOODCUTTING_SEARCH_RADIUS);
      const minSearchZ = uBounds ? Math.max(uBounds.minZ, hutPos[1] - WOODCUTTING_SEARCH_RADIUS) : Math.max(0, hutPos[1] - WOODCUTTING_SEARCH_RADIUS);
      const maxSearchZ = uBounds ? Math.min(uBounds.maxZ, hutPos[1] + WOODCUTTING_SEARCH_RADIUS) : Math.min(grid.height - 1, hutPos[1] + WOODCUTTING_SEARCH_RADIUS);

      const regId = unit.regionId ?? (uBounds as any)?.regionId;

      for (let x = minSearchX; x <= maxSearchX; x++) {
        for (let z = minSearchZ; z <= maxSearchZ; z++) {
          if (regId !== undefined && !GridMap.isCoordInRegion(regId, x, z, REGION_BOUNDS_MARGIN)) continue;
          const key = (z << 16) | x;
          if (takenTreePositions.has(key)) continue;

          const tile = grid.tiles[x]?.[z];
          if (tile && !tile.buildingId && !tile.itemOnGround && (tile.foliageType === 'fallen_tree' || tile.foliageType === 'tree')) {
            const distFromHut = distance2D(x, z, hutPos[0], hutPos[1]);
            const distFromUnit = distance2D(x, z, ux, uz);
            if (distFromHut <= WOODCUTTING_SEARCH_RADIUS) {
              const priorityBonus = tile.foliageType === 'fallen_tree' ? FALLEN_TREE_PRIORITY_BONUS : 0;
              candidateTrees.push({
                pos: [x, z],
                dist: distFromUnit + priorityBonus,
                isFallen: tile.foliageType === 'fallen_tree',
              });
            }
          }
        }
      }

      candidateTrees.sort((a, b) => a.dist - b.dist);

      for (const cand of candidateTrees.slice(0, MAX_CANDIDATE_SEARCH_PATHS)) {
        const path = AStar.findPath(grid, [ux, uz], cand.pos, true, uBounds);
        if (path && path.length > 0) {
          bestTarget = cand.pos;
          bestPath = path;
          isFallenCandidate = cand.isFallen;
          break;
        }
      }
    }

    if (bestTarget && bestPath) {
      failedSearchCooldowns.delete(unit.id);
      const dict = translations[useGameStore.getState().language];
      if (isFallenCandidate) {
        unit.currentJob = {
          id: `chop-log-${unit.id}-${Date.now()}`,
          type: 'chop_fallen_log',
          targetPosition: bestTarget,
          progress: 0,
          totalWork: CHOP_FALLEN_LOG_TOTAL_WORK,
        };
        unit.speechBubble = {
          text: dict.jobs.goingToChopFallenLog,
          expiresAtTick: currentTick + CHOP_FALLEN_SPEECH_DURATION,
          type: 'work',
        };
      } else {
        unit.currentJob = {
          id: `job-${unit.id}-${Date.now()}`,
          type: 'chop_tree',
          targetPosition: bestTarget,
          progress: 0,
          totalWork: CHOP_TREE_TOTAL_WORK,
        };
        unit.speechBubble = {
          text: dict.jobs.goingToChopTreeForHut,
          expiresAtTick: currentTick + CHOP_TREE_SPEECH_DURATION,
          type: 'work',
        };
      }
      unit.path = bestPath;
      return true;
    }

    failedSearchCooldowns.set(unit.id, currentTick + FAILED_TREE_SEARCH_COOLDOWN_TICKS);
    return false;
  }

  public static handleChopTreeProgress(
    unit: GameEntity,
    job: Job,
    grid: GridMap,
    currentTick: number,
    woodSkill: number
  ): boolean {
    if (!job.targetPosition) return false;
    const [gx, gz] = job.targetPosition;
    const tile = grid.getTile(gx, gz);
    if (!tile || tile.foliageType !== 'tree') {
      unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
      return true;
    }
    const isStrikeTick = currentTick % CHOP_STRIKE_TICK_INTERVAL === 0 || job.progress === 0;
    if (isStrikeTick) {
      const strikePower = CHOP_TREE_BASE_STRIKE + Math.floor(woodSkill * WORK_SKILL_STEP_MULTIPLIER);
      job.progress += strikePower;

      const pct = Math.round((job.progress / job.totalWork) * 100);
      const dict = translations[useGameStore.getState().language];
      if (pct <= PROGRESS_PCT_EARLY) {
        unit.speechBubble = {
          text: dict.jobs.choppingTrunk,
          expiresAtTick: currentTick + CHOP_STRIKE_SPEECH_DURATION,
          type: 'work',
        };
      } else if (pct <= PROGRESS_PCT_MID) {
        unit.speechBubble = {
          text: dict.jobs.trunkCracking,
          expiresAtTick: currentTick + CHOP_STRIKE_SPEECH_DURATION,
          type: 'work',
        };
      } else {
        unit.speechBubble = {
          text: dict.jobs.almostDown,
          expiresAtTick: currentTick + CHOP_STRIKE_SPEECH_DURATION,
          type: 'work',
        };
      }

      if (job.targetPosition) {
        useGameStore.getState().registerTreeHit(job.targetPosition[0], job.targetPosition[1], TREE_HIT_IMPACT);
      }
    }

    if (job.progress >= job.totalWork && job.targetPosition) {
      const [gx, gz] = job.targetPosition;
      const { treeType } = getTreeProceduralData(gx, gz);

      const [ux, , uz] = unit.position || [gx + HALF_TILE_OFFSET, 0, gz + HALF_TILE_OFFSET];
      const fdx = gx + HALF_TILE_OFFSET - ux;
      const fdz = gz + HALF_TILE_OFFSET - uz;
      const fallAngle = Math.hypot(fdx, fdz) > TREE_FALL_MIN_DISTANCE_EPSILON ? Math.atan2(fdx, fdz) : 0;

      grid.removeFoliage(gx, gz);

      useGameStore.getState().registerTreeFall(gx, gz, treeType, fallAngle);
      useGameStore.getState().incrementFoliageVersion();

      const dict = translations[useGameStore.getState().language];
      unit.currentJob = {
        id: `wait-fall-${unit.id}-${Date.now()}`,
        type: 'wait_tree_fall',
        targetPosition: [gx, gz],
        progress: 0,
        totalWork: WAIT_TREE_FALL_TOTAL_WORK,
      };
      unit.speechBubble = {
        text: dict.jobs.treeFallingWaitLanding,
        expiresAtTick: currentTick + WAIT_FALL_SPEECH_DURATION,
        type: 'work',
      };
      return true;
    }

    return false;
  }

  public static handleWaitTreeFallProgress(
    unit: GameEntity,
    job: Job,
    currentTick: number
  ): boolean {
    const fallStep = TREE_FALL_PROGRESS_STEP;
    job.progress += fallStep;

    if (job.progress >= job.totalWork && job.targetPosition) {
      const [gx, gz] = job.targetPosition;
      const dict = translations[useGameStore.getState().language];
      unit.currentJob = {
        id: `chop-log-${unit.id}-${Date.now()}`,
        type: 'chop_fallen_log',
        targetPosition: [gx, gz],
        progress: 0,
        totalWork: CHOP_FALLEN_LOG_TOTAL_WORK,
      };
      unit.speechBubble = {
        text: dict.jobs.treeDownCuttingLogs,
        expiresAtTick: currentTick + TREE_DOWN_SPEECH_DURATION,
        type: 'work',
      };
      return true;
    }

    return false;
  }

  public static handleChopFallenLogProgress(
    unit: GameEntity,
    job: Job,
    grid: GridMap,
    currentTick: number,
    isPlayerUnit: boolean
  ): boolean {
    if (!job.targetPosition) return false;
    const [gx, gz] = job.targetPosition;
    const tile = grid.getTile(gx, gz);
    if (!tile || tile.foliageType !== 'fallen_tree') {
      unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
      return true;
    }

    const isLogStrikeTick = currentTick % CHOP_STRIKE_TICK_INTERVAL === 0 || job.progress === 0;
    if (isLogStrikeTick) {
      job.progress += CHOP_LOG_STRIKE;
      const dict = translations[useGameStore.getState().language];
      unit.speechBubble = {
        text: dict.jobs.trimmingBranchesAndSawing,
        expiresAtTick: currentTick + CHOP_STRIKE_SPEECH_DURATION,
        type: 'work',
      };
    }

    if (job.progress >= job.totalWork) {
      this.completeFallenLog(job, unit, grid, currentTick, isPlayerUnit);
      unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
      return true;
    }

    return false;
  }

  public static completeFallenLog(
    job: Job,
    unit: GameEntity,
    grid: GridMap,
    currentTick: number,
    _isPlayerUnit: boolean
  ): void {
    const { incrementFoliageVersion } = useGameStore.getState();

    if (job.targetPosition) {
      const [gx, gz] = job.targetPosition;
      const tile = grid.getTile(gx, gz);
      if (tile) {
        tile.itemOnGround = { type: 'wood', amount: CHOP_LOG_YIELD };
      }
      incrementFoliageVersion();

      const dict = translations[useGameStore.getState().language];
      unit.speechBubble = {
        text: dict.jobs.logReadyMuleNeeded,
        expiresAtTick: currentTick + LOG_READY_SPEECH_DURATION,
        type: 'work',
      };
    }
  }
}
