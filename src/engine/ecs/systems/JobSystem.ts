import { characterEntities, buildingEntities, type GameEntity, type Job } from '../world';
import { GridMap } from '../../grid/GridMap';
import { useGameStore } from '../../../store/useGameStore';
import { isNoble as isNobleEntity } from '../entityHelpers';
import {
  NIGHT_START_HOUR,
  NIGHT_END_HOUR,
  CRITICAL_EXHAUSTION_ENERGY,
  RESTED_ENERGY_THRESHOLD,
} from '../../../constants/needs';
import {
  WORK_START_HOUR,
  WORK_END_HOUR,
  DEFAULT_WORK_SKILL,
  DEFAULT_BASE_WORK_STEP,
  WORK_SKILL_STEP_MULTIPLIER,
  MINE_ROCK_YIELD,
  HARVEST_WHEAT_YIELD,
} from '../../../constants/jobs';
import { RestJobHandler, getEntityRegionId } from './jobs/RestJobHandler';
import { WoodcuttingJobHandler } from './jobs/WoodcuttingJobHandler';
import { ConstructionJobHandler } from './jobs/ConstructionJobHandler';
import { WorkstationJobHandler } from './jobs/WorkstationJobHandler';
import { GatheringJobHandler } from './jobs/GatheringJobHandler';
import { HaulingJobHandler } from './jobs/HaulingJobHandler';
import { ManualJobHandler } from './jobs/ManualJobHandler';
import type { RegionData } from '../../../types/game';

export { getEntityRegionId };

const _buildingMap = new Map<string, GameEntity>();
const _regionMap = new Map<number, RegionData>();

export class JobSystem {
  public static update(grid: GridMap, currentTick: number): void {
    const {
      pendingJobs,
      removePendingJob,
      time,
      regions,
      playerRegionId,
      playerSpawnPoint,
    } = useGameStore.getState();

    _buildingMap.clear();
    for (const b of buildingEntities) {
      _buildingMap.set(b.id, b);
    }

    _regionMap.clear();
    for (const r of regions) {
      _regionMap.set(r.id, r);
    }

    const { militiaSquads } = useGameStore.getState();
    if (militiaSquads && militiaSquads.length > 0) {
      for (const squad of militiaSquads) {
        if (squad.activeMarch) {
          const members = Array.from(characterEntities).filter(
            (c) => c.isCharacter && c.isLevy && (c.militiaSquadId === squad.id || squad.memberIds.includes(c.id))
          );
          if (members.length > 0) {
            const allArrived = members.every((m) => {
              const hasNoPath = !m.path || m.path.length === 0;
              if (!hasNoPath) return false;
              if (!m.targetPosition || !m.gridPosition) return true;
              return Math.hypot(m.gridPosition[0] - m.targetPosition[0], m.gridPosition[1] - m.targetPosition[1]) <= 1.2;
            });
            if (allArrived) {
              squad.activeMarch = null;
              useGameStore.setState((s) => ({
                militiaSquads: s.militiaSquads.map((sq) =>
                  sq.id === squad.id ? { ...sq, activeMarch: null } : sq
                ),
              }));
            }
          }
        }
      }
    }

    for (const unit of characterEntities) {
      if (unit.factionId === 'bandit' || unit.factionId === 'merchant' || unit.isMerchant) continue;
      if (unit.isLevy) {
        if (!unit.path || unit.path.length === 0) {
          if (unit.targetPosition && unit.gridPosition) {
            const dist = Math.hypot(unit.gridPosition[0] - unit.targetPosition[0], unit.gridPosition[1] - unit.targetPosition[1]);
            if (dist <= 1.0) {
              if (unit.currentJob?.type !== 'patrol') {
                unit.currentJob = {
                  id: `guard-${unit.id}`,
                  type: 'patrol',
                  targetPosition: unit.targetPosition,
                  targetAngle: unit.currentJob?.targetAngle ?? 0,
                  progress: 0,
                  totalWork: 0,
                };
              }
            }
          }
        }
        continue;
      }
      const isPlayerUnit = unit.factionId === 'player' || unit.factionId === undefined;
      const isNoble = isNobleEntity(unit);

      const uRegionId = getEntityRegionId(unit, regions, playerRegionId ?? 0);
      const uRegion = _regionMap.get(uRegionId) || regions[0];
      const uBounds = uRegion?.bounds;
      const campPos =
        uRegion?.campPosition ||
        (uRegionId === (playerRegionId ?? 0) ? playerSpawnPoint : undefined) ||
        uRegion?.center ||
        [52, 52];
      const cx = campPos[0];
      const cz = campPos[1];

      const isNightTime = time.hour >= NIGHT_START_HOUR || time.hour < NIGHT_END_HOUR;
      const isCriticallyExhausted = Boolean(unit.needs && unit.needs.energy <= CRITICAL_EXHAUSTION_ENERGY);
      const isAlreadySleeping = unit.currentJob?.type === 'sleep';
      const isAlreadySitting = unit.currentJob?.type === 'sit_by_fire';
      const isMidManualJob =
        unit.currentJob?.type === 'fight' ||
        unit.currentJob?.type === 'build_structure' ||
        unit.currentJob?.type === 'demolish_structure' ||
        unit.currentJob?.type === 'chop_tree' ||
        unit.currentJob?.type === 'mine_rock' ||
        unit.currentJob?.type === 'chop_fallen_log' ||
        unit.currentJob?.type === 'haul_log_with_mule' ||
        unit.currentJob?.type === 'haul_construction_mule' ||
        unit.currentJob?.type === 'return_mule';

      if (!isNightTime && (isAlreadySleeping || isAlreadySitting)) {
        const isRested = isAlreadySleeping
          ? (!unit.needs || unit.needs.energy >= RESTED_ENERGY_THRESHOLD || time.hour >= NIGHT_END_HOUR)
          : (!isNightTime || time.hour >= NIGHT_END_HOUR);
        if (isRested) {
          RestJobHandler.handleMorningWakeUp(
            unit,
            isAlreadySleeping,
            isAlreadySitting,
            isNoble,
            currentTick,
            grid,
            uBounds,
            _buildingMap
          );
          continue;
        }
      }

      if ((isNightTime || isCriticallyExhausted) && !isMidManualJob) {
        if (!unit.workBuildingId && isPlayerUnit && !isCriticallyExhausted && pendingJobs.length > 0) {
          const assigned = ManualJobHandler.assignPendingJob(unit, pendingJobs, grid, uBounds, currentTick);
          if (assigned) {
            continue;
          }
        }

        const handledRest = RestJobHandler.handleNightAndExhaustion(
          unit,
          isPlayerUnit,
          isNoble,
          grid,
          currentTick,
          regions,
          uRegionId,
          uBounds,
          cx,
          cz,
          playerRegionId,
          _buildingMap
        );
        if (handledRest) {
          continue;
        }
      }

      if (!isNoble && unit.workBuildingId && !isMidManualJob) {
        const unitHash = (unit.id.charCodeAt(0) * 17 + unit.id.charCodeAt(unit.id.length - 1)) % 30;
        const currentMinuteOfDay = time.hour * 60 + (time.minute || 0);
        const unitWorkStartMinutes = WORK_START_HOUR * 60 + (unitHash % 15);
        const unitWorkEndMinutes = (WORK_END_HOUR + 1) * 60 + unitHash;
        const isUnitWorkHours = currentMinuteOfDay >= unitWorkStartMinutes && currentMinuteOfDay < unitWorkEndMinutes;

        if (isUnitWorkHours) {
          const building = _buildingMap.get(unit.workBuildingId);
          if (building && building.isCompleted) {
            if (building.buildingType !== 'stockpile' && (unit.hasMule || unit.muleTransition || unit.isHaulingLog)) {
              unit.hasMule = false;
              unit.muleTransition = undefined;
              unit.muleTransitionProgress = undefined;
              unit.assignedMuleHutId = undefined;
              unit.isHaulingLog = false;
            }
            let assigned = false;
            if (building.buildingType === 'lumberjack_hut') {
              assigned = WoodcuttingJobHandler.assignWoodcutterHutJob(unit, building, grid, uBounds, currentTick, cx, cz);
            } else if (
              building.buildingType === 'fishermans_hut' ||
              building.buildingType === 'foragers_hut' ||
              building.buildingType === 'hunters_hut' ||
              building.buildingType === 'foresters_hut'
            ) {
              assigned = GatheringJobHandler.assignGatheringJob(unit, building, grid, uBounds, currentTick, cx, cz);
            } else if (building.buildingType === 'stockpile') {
              assigned = HaulingJobHandler.assignStockpileHaulingJob(unit, building, grid, uBounds, currentTick, cx, cz);
            } else {
              assigned = WorkstationJobHandler.assignWorkstationJob(unit, building, grid, uBounds, currentTick);
            }
            if (!assigned && (!unit.currentJob || unit.currentJob.type === 'idle' || unit.currentJob.type === 'wander') && (!unit.path || unit.path.length === 0)) {
              ManualJobHandler.handleIdleWander(unit, grid, uBounds, cx, cz, currentTick);
            }
          }
        } else if (!isNightTime) {
          WorkstationJobHandler.handleOffWorkHours(unit, grid, uBounds, cx, cz, currentTick);
          if ((!unit.currentJob || unit.currentJob.type === 'idle' || unit.currentJob.type === 'wander') && (!unit.path || unit.path.length === 0)) {
            ManualJobHandler.handleIdleWander(unit, grid, uBounds, cx, cz, currentTick);
          }
        }
      }

      if (
        !isNightTime &&
        !unit.workBuildingId &&
        (!unit.currentJob || unit.currentJob.type === 'idle' || unit.currentJob.type === 'wander') &&
        (!unit.path || unit.path.length === 0)
      ) {
        if (isPlayerUnit) {
          let assigned = ManualJobHandler.assignPendingJob(unit, pendingJobs, grid, uBounds, currentTick);
          if (!assigned) {
            const storageHub = HaulingJobHandler.getSettlementStorageHub(uRegionId, unit.factionId, playerRegionId);
            if (storageHub) {
              assigned = HaulingJobHandler.assignStockpileHaulingJob(unit, storageHub, grid, uBounds, currentTick, cx, cz);
            }
          }
          if (!assigned) {
            ManualJobHandler.handleIdleWander(unit, grid, uBounds, cx, cz, currentTick);
          }
        } else {
          ManualJobHandler.handleIdleWander(unit, grid, uBounds, cx, cz, currentTick);
        }
      }

      if (unit.currentJob && unit.currentJob.type !== 'idle' && unit.currentJob.type !== 'wander') {
        const job = unit.currentJob;

        if (unit.path && unit.path.length > 0) {
          continue;
        }

        const buildSkill = unit.skills?.building || DEFAULT_WORK_SKILL;
        const woodSkill = unit.skills?.woodcutting || DEFAULT_WORK_SKILL;

        if (job.type === 'haul_log_with_mule' || job.type === 'haul_construction_mule' || job.type === 'return_mule') {
          const storageHub = HaulingJobHandler.getSettlementStorageHub(uRegionId, unit.factionId, playerRegionId);
          if (storageHub) {
            HaulingJobHandler.assignStockpileHaulingJob(unit, storageHub, grid, uBounds, currentTick, cx, cz);
          }
          continue;
        } else if (job.type === 'chop_tree') {
          const finishedTree = WoodcuttingJobHandler.handleChopTreeProgress(unit, job, grid, currentTick, woodSkill);
          if (finishedTree) continue;
        } else if (job.type === 'wait_tree_fall') {
          const fell = WoodcuttingJobHandler.handleWaitTreeFallProgress(unit, job, currentTick);
          if (fell) continue;
        } else if (job.type === 'chop_fallen_log') {
          const finishedLog = WoodcuttingJobHandler.handleChopFallenLogProgress(unit, job, grid, currentTick, isPlayerUnit);
          if (finishedLog) {
            removePendingJob(job.id);
            continue;
          }
        } else if (job.type === 'build_structure' || job.type === 'demolish_structure') {
          const finishedStructure = ConstructionJobHandler.handleConstructionProgress(unit, job, currentTick, buildSkill);
          if (finishedStructure) {
            if (job.type === 'build_structure') {
              ConstructionJobHandler.completeBuilding(
                job,
                unit,
                currentTick,
                isPlayerUnit,
                regions,
                useGameStore.getState().updateRegionStats
              );
            } else {
              ConstructionJobHandler.completeDemolition(job, unit, grid, currentTick, isPlayerUnit);
            }

            if (job.targetBuildingId) {
              const currentPending = useGameStore.getState().pendingJobs;
              for (const pj of currentPending) {
                if (pj.targetBuildingId === job.targetBuildingId || pj.id === job.id) {
                  removePendingJob(pj.id);
                }
              }
            } else {
              removePendingJob(job.id);
            }
            unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
            continue;
          }
        } else if (job.type === 'work_at_building') {
          continue;
        } else {
          const workStep = DEFAULT_BASE_WORK_STEP + Math.floor(buildSkill * WORK_SKILL_STEP_MULTIPLIER);
          job.progress += workStep;

          if (job.progress >= job.totalWork) {
            this.completeGenericJob(job, unit, grid, currentTick, isPlayerUnit);
            removePendingJob(job.id);
            unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
          }
        }
      }
    }
  }

  private static completeGenericJob(
    job: Job,
    unit: GameEntity,
    grid: GridMap,
    currentTick: number,
    isPlayerUnit: boolean
  ): void {
    const { addResource, incrementFoliageVersion } = useGameStore.getState();

    switch (job.type) {
      case 'mine_rock':
        if (job.targetPosition) {
          grid.removeFoliage(job.targetPosition[0], job.targetPosition[1]);
          incrementFoliageVersion();
          if (isPlayerUnit) {
            addResource('stone', MINE_ROCK_YIELD);
          }
          unit.speechBubble = {
            text: `Камінь видобуто! (+${MINE_ROCK_YIELD} каменю)`,
            expiresAtTick: currentTick + 25,
            type: 'work',
          };
        }
        break;

      case 'harvest_wheat':
        if (unit.hasMule || unit.muleTransition || unit.isHaulingLog) {
          unit.hasMule = false;
          unit.muleTransition = undefined;
          unit.muleTransitionProgress = undefined;
          unit.assignedMuleHutId = undefined;
          unit.isHaulingLog = false;
        }
        if (job.targetBuildingId) {
          let farmBuilding: GameEntity | undefined;
          for (const b of buildingEntities) {
            if (b.id === job.targetBuildingId) { farmBuilding = b; break; }
          }
          if (farmBuilding) {
            farmBuilding.localInventory = farmBuilding.localInventory || {};
            farmBuilding.localInventory.wheat = (farmBuilding.localInventory.wheat || 0) + HARVEST_WHEAT_YIELD;
          }
        }
        if (isPlayerUnit) {
          addResource('wheat', HARVEST_WHEAT_YIELD);
        }
        unit.speechBubble = {
          text: `Врожай зібрано! (+${HARVEST_WHEAT_YIELD} пшениці)`,
          expiresAtTick: currentTick + 25,
          type: 'work',
        };
        break;

      case 'work_at_building':
        if (Math.random() < 0.2) {
          unit.speechBubble = {
            text: 'Зміна триває...',
            expiresAtTick: currentTick + 20,
            type: 'work',
          };
        }
        break;

      default:
        break;
    }
  }
}
