import type { GameEntity, Job } from '../../world';
import { buildingEntities, characterEntities } from '../../world';
import { GridMap } from '../../../grid/GridMap';
import {
  createPathSafely,
} from '../../../buildings/buildingNavigation';
import { distance2D } from '../../../../utils/mathUtils';
import { isNoble } from '../../entityHelpers';
import { useGameStore } from '../../../../store/useGameStore';
import { HaulingJobHandler } from './HaulingJobHandler';
import { AStar } from '../../../pathfinding/AStar';

const _activeBuildersCount = new Map<string, number>();
const _takenJobIds = new Set<string>();
const _takenPositions = new Set<number>();
const _buildingMap = new Map<string, GameEntity>();
const _candidateJobs: Job[] = [];
const _viableJobs: Job[] = [];
const _playerBuildings: GameEntity[] = [];
const _occupiedCoords = new Set<number>();

export class ManualJobHandler {
  public static assignPendingJob(
    unit: GameEntity,
    pendingJobs: Job[],
    grid: GridMap,
    _uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    currentTick: number
  ): boolean {
    if (!unit.gridPosition) return false;
    if (isNoble(unit)) return false;

    if (unit.path && unit.path.length > 0 && unit.currentJob && (
      unit.currentJob.type === 'build_structure' ||
      unit.currentJob.type === 'demolish_structure' ||
      unit.currentJob.type === 'chop_tree' ||
      unit.currentJob.type === 'chop_fallen_log' ||
      unit.currentJob.type === 'mine_rock' ||
      unit.currentJob.type === 'harvest_wheat' ||
      unit.currentJob.type === 'haul_construction_mule' ||
      unit.currentJob.type === 'haul_log_with_mule'
    )) {
      return true;
    }

    const nextCheck = (unit as any).nextPendingJobCheckTick || 0;
    if (currentTick < nextCheck) return false;

    _activeBuildersCount.clear();
    _takenJobIds.clear();
    _takenPositions.clear();

    for (const c of characterEntities) {
      if (c.id === unit.id || !c.currentJob) continue;
      const job = c.currentJob;

      if ((job.type === 'build_structure' || job.type === 'demolish_structure') && job.targetBuildingId) {
        const count = _activeBuildersCount.get(job.targetBuildingId) || 0;
        _activeBuildersCount.set(job.targetBuildingId, count + 1);
      } else {
        _takenJobIds.add(job.id);
        if (job.targetPosition) {
          _takenPositions.add((Math.floor(job.targetPosition[1]) << 16) | Math.floor(job.targetPosition[0]));
        }
      }
    }

    _buildingMap.clear();
    for (const b of buildingEntities) {
      _buildingMap.set(b.id, b);
    }

    _candidateJobs.length = 0;
    for (const j of pendingJobs) {
      if (j.type === 'build_structure' || j.type === 'demolish_structure') {
        const count = j.targetBuildingId ? (_activeBuildersCount.get(j.targetBuildingId) || 0) : 0;
        if (count >= 4) continue;
      } else {
        if (j.assignedUnitId && j.assignedUnitId !== unit.id) continue;
        if (_takenJobIds.has(j.id)) continue;
        if (j.targetPosition) {
          const posKey = (Math.floor(j.targetPosition[1]) << 16) | Math.floor(j.targetPosition[0]);
          if (_takenPositions.has(posKey)) continue;
        }
      }
      _candidateJobs.push(j);
    }

    const unitGx = unit.gridPosition[0];
    const unitGz = unit.gridPosition[1];
    const uX = unit.position ? unit.position[0] : unitGx + 0.5;
    const uZ = unit.position ? unit.position[2] : unitGz + 0.5;

    for (const job of _candidateJobs) {
      if (job.type === 'build_structure' && job.targetBuildingId) {
        const b = _buildingMap.get(job.targetBuildingId);
        if (b && !b.isCompleted && b.requiredMaterials) {
          let hasMissing = false;
          for (const [res, needed] of Object.entries(b.requiredMaterials)) {
            const del = (b.deliveredMaterials && (b.deliveredMaterials as any)[res]) || 0;
            if (del < (needed || 0)) {
              hasMissing = true;
              break;
            }
          }

          if (hasMissing) {
            let isHaulerAssigned = false;
            for (const c of characterEntities) {
              if (
                c.id !== unit.id &&
                c.currentJob?.type === 'haul_construction_mule' &&
                c.currentJob?.targetBuildingId === b.id
              ) {
                isHaulerAssigned = true;
                break;
              }
            }

            if (!isHaulerAssigned) {
              const hp = unit.hasMule ? null : HaulingJobHandler.findAvailableHitchingPost(unit, b.regionId);
              if (unit.hasMule || hp) {
                unit.currentJob = {
                  id: `haul-const-${b.id}-${Date.now()}`,
                  type: 'haul_construction_mule',
                  targetBuildingId: b.id,
                  progress: 0,
                  totalWork: 30,
                };

                if (!unit.hasMule && hp) {
                  unit.assignedMuleHutId = hp.id;
                  const hpPos = hp.position || [hp.gridPosition ? hp.gridPosition[0] + 1.5 : uX, 0, hp.gridPosition ? hp.gridPosition[1] + 1.0 : uZ];
                  const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], hp.gridPosition ? hp.gridPosition[0] : Math.floor(hpPos[0]), hp.gridPosition ? hp.gridPosition[1] : Math.floor(hpPos[2]), hp.buildingWidth || 3, hp.buildingHeight || 2);
                  if (path && path.length > 0) {
                    unit.path = path;
                  }
                  unit.speechBubble = {
                    text: "Іду по мула до прив'язі...",
                    expiresAtTick: currentTick + 25,
                    type: 'work',
                  };
                } else {
                  const storageHub = HaulingJobHandler.getSettlementStorageHub(b.regionId, b.factionId, useGameStore.getState().playerRegionId);
                  if (storageHub) {
                    const sPos = storageHub.position || [storageHub.gridPosition ? storageHub.gridPosition[0] + 1 : uX, 0, storageHub.gridPosition ? storageHub.gridPosition[1] + 1 : uZ];
                    const path = AStar.findPathToArea(grid, [Math.floor(uX), Math.floor(uZ)], storageHub.gridPosition ? storageHub.gridPosition[0] : Math.floor(sPos[0]), storageHub.gridPosition ? storageHub.gridPosition[1] : Math.floor(sPos[2]), storageHub.buildingWidth || 2, storageHub.buildingHeight || 2);
                    if (path && path.length > 0) {
                      unit.path = path;
                    }
                    unit.speechBubble = {
                      text: `Веду мула за матеріалами для ${b.name || 'будівництва'}...`,
                      expiresAtTick: currentTick + 25,
                      type: 'work',
                    };
                  }
                }
                return true;
              }
            }
          }
        }
      }
    }

    _viableJobs.length = 0;
    for (const j of _candidateJobs) {
      if (j.type === 'build_structure' && j.targetBuildingId) {
        const b = _buildingMap.get(j.targetBuildingId);
        if (b && !b.isCompleted && b.requiredMaterials) {
          let missingAny = false;
          for (const [res, needed] of Object.entries(b.requiredMaterials)) {
            const del = (b.deliveredMaterials && (b.deliveredMaterials as any)[res]) || 0;
            if (del < (needed || 0)) {
              missingAny = true;
              break;
            }
          }
          if (missingAny) continue;
        }
      }
      _viableJobs.push(j);
    }

    if (_viableJobs.length === 0) {
      (unit as any).nextPendingJobCheckTick = currentTick + 4;
      return false;
    }

    _viableJobs.sort((a, b) => {
      let ax = a.targetPosition ? a.targetPosition[0] : unitGx;
      let az = a.targetPosition ? a.targetPosition[1] : unitGz;
      if (a.targetBuildingId) {
        const bEnt = _buildingMap.get(a.targetBuildingId);
        if (bEnt && bEnt.gridPosition) {
          ax = bEnt.gridPosition[0] + (bEnt.buildingWidth || 2) / 2;
          az = bEnt.gridPosition[1] + (bEnt.buildingHeight || 2) / 2;
        }
      }

      let bx = b.targetPosition ? b.targetPosition[0] : unitGx;
      let bz = b.targetPosition ? b.targetPosition[1] : unitGz;
      if (b.targetBuildingId) {
        const bEnt = _buildingMap.get(b.targetBuildingId);
        if (bEnt && bEnt.gridPosition) {
          bx = bEnt.gridPosition[0] + (bEnt.buildingWidth || 2) / 2;
          bz = bEnt.gridPosition[1] + (bEnt.buildingHeight || 2) / 2;
        }
      }

      const distA = distance2D(unitGx, unitGz, ax, az);
      const distB = distance2D(unitGx, unitGz, bx, bz);
      return distA - distB;
    });

    const maxTest = Math.min(4, _viableJobs.length);
    for (let i = 0; i < maxTest; i++) {
      const job = _viableJobs[i];
      let path: [number, number][] | null = null;

      if (job.type === 'build_structure' || job.type === 'demolish_structure') {
        const b = job.targetBuildingId ? _buildingMap.get(job.targetBuildingId) : undefined;
        if (b && b.gridPosition) {
          const bx = b.gridPosition[0];
          const bz = b.gridPosition[1];
          const bw = b.buildingWidth || 2;
          const bh = b.buildingHeight || 2;

          const isAdjacent =
            unitGx >= bx - 1 &&
            unitGx <= bx + bw &&
            unitGz >= bz - 1 &&
            unitGz <= bz + bh;

          if (isAdjacent) {
            path = [];
          } else {
            path = AStar.findPathToArea(grid, [unitGx, unitGz], bx, bz, bw, bh);
          }
        } else if (job.targetPosition) {
          const targetTile: [number, number] = [
            Math.floor(job.targetPosition[0]),
            Math.floor(job.targetPosition[1]),
          ];
          const dist = distance2D(unitGx, unitGz, targetTile[0], targetTile[1]);
          if (dist <= 1.5) {
            path = [];
          } else {
            path = AStar.findPath(grid, [unitGx, unitGz], targetTile, true);
          }
        }
      } else {
        const isAdjacentWork =
          job.type === 'chop_tree' ||
          job.type === 'mine_rock' ||
          job.type === 'chop_fallen_log' ||
          job.type === 'harvest_wheat';

        const targetTile: [number, number] = job.targetPosition
          ? [Math.floor(job.targetPosition[0]), Math.floor(job.targetPosition[1])]
          : [unitGx, unitGz];

        const dist = distance2D(unitGx, unitGz, targetTile[0], targetTile[1]);
        if (dist <= 1.5 && isAdjacentWork) {
          path = [];
        } else {
          path = AStar.findPath(grid, [unitGx, unitGz], targetTile, isAdjacentWork);
        }
      }

      if (path !== null) {
        if (!job.assignedUnitId && job.type !== 'build_structure' && job.type !== 'demolish_structure') {
          job.assignedUnitId = unit.id;
        }
        unit.currentJob = { ...job, id: job.id };
        if (path.length > 0 && path[0][0] === unitGx && path[0][1] === unitGz) {
          path.shift();
        }
        unit.path = path;
        unit.speechBubble = {
          text: this.getJobAnnouncement(job.type),
          expiresAtTick: currentTick + 25,
          type: 'work',
        };
        return true;
      }
    }

    (unit as any).nextPendingJobCheckTick = currentTick + 3;
    return false;
  }

  public static handleIdleWander(
    unit: GameEntity,
    grid: GridMap,
    uBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    cx: number,
    cz: number,
    currentTick?: number
  ): void {
    if (!unit.path || unit.path.length === 0) {
      const tick = currentTick ?? (useGameStore.getState().time.tick || 0);
      const idleCooldown = (unit as any).idleCooldownTicks ?? 0;
      if (tick >= idleCooldown && Math.random() < 0.12 && unit.gridPosition) {
        const minX = uBounds ? uBounds.minX + 2 : 2;
        const maxX = uBounds ? uBounds.maxX - 2 : grid.width - 3;
        const minZ = uBounds ? uBounds.minZ + 2 : 2;
        const maxZ = uBounds ? uBounds.maxZ - 2 : grid.height - 3;
        const [unitX, unitZ] = unit.gridPosition;
        const minimumWanderDistance = 4;

        _playerBuildings.length = 0;
        for (const b of buildingEntities) {
          if (
            (b.factionId === 'player' || b.factionId === undefined) &&
            b.isCompleted &&
            b.gridPosition
          ) {
            if (uBounds) {
              const bx = b.gridPosition[0];
              const bz = b.gridPosition[1];
              if (bx < uBounds.minX || bx > uBounds.maxX || bz < uBounds.minZ || bz > uBounds.maxZ) {
                continue;
              }
            }
            _playerBuildings.push(b);
          }
        }

        _occupiedCoords.clear();
        for (const c of characterEntities) {
          if (c.id !== unit.id && c.gridPosition) {
            _occupiedCoords.add((c.gridPosition[1] << 16) | (c.gridPosition[0] & 0xffff));
          }
        }

        let targetX = unitX;
        let targetZ = unitZ;
        let foundTarget = false;

        const wanderRoll = Math.random();

        if (wanderRoll < 0.40 && _playerBuildings.length > 0) {
          const b = _playerBuildings[Math.floor(Math.random() * _playerBuildings.length)];
          if (b.gridPosition) {
            const bw = b.buildingWidth || 2;
            const bh = b.buildingHeight || 2;
            const bx = b.gridPosition[0];
            const bz = b.gridPosition[1];
            const frontCandidates: [number, number][] = [
              [bx + Math.floor(bw / 2), bz + bh + 1],
              [bx + Math.floor(bw / 2), bz - 1],
              [bx - 1, bz + Math.floor(bh / 2)],
              [bx + bw + 1, bz + Math.floor(bh / 2)],
            ];
            for (const [fx, fz] of frontCandidates) {
              const cxTile = Math.max(minX, Math.min(maxX, fx));
              const czTile = Math.max(minZ, Math.min(maxZ, fz));
              const key = (czTile << 16) | (cxTile & 0xffff);
              if (!_occupiedCoords.has(key) && grid.isWalkable(cxTile, czTile) && Math.hypot(cxTile - unitX, czTile - unitZ) >= minimumWanderDistance) {
                targetX = cxTile;
                targetZ = czTile;
                foundTarget = true;
                break;
              }
            }
          }
        } else if (wanderRoll < 0.70) {
          for (let attempt = 0; attempt < 12; attempt++) {
            const rx = Math.max(minX, Math.min(maxX, unitX + Math.floor(Math.random() * 41 - 20)));
            const rz = Math.max(minZ, Math.min(maxZ, unitZ + Math.floor(Math.random() * 41 - 20)));
            const t = grid.getTile(rx, rz);
            const key = (rz << 16) | (rx & 0xffff);
            if (t && t.terrain === 'road' && !_occupiedCoords.has(key) && grid.isWalkable(rx, rz) && Math.hypot(rx - unitX, rz - unitZ) >= minimumWanderDistance) {
              targetX = rx;
              targetZ = rz;
              foundTarget = true;
              break;
            }
          }
        } else if (wanderRoll < 0.90) {
          for (let attempt = 0; attempt < 10; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 12 + Math.random() * 22;
            const rx = Math.max(minX, Math.min(maxX, Math.floor(cx + Math.cos(angle) * dist)));
            const rz = Math.max(minZ, Math.min(maxZ, Math.floor(cz + Math.sin(angle) * dist)));
            const key = (rz << 16) | (rx & 0xffff);
            if (!_occupiedCoords.has(key) && grid.isWalkable(rx, rz) && Math.hypot(rx - unitX, rz - unitZ) >= minimumWanderDistance) {
              targetX = rx;
              targetZ = rz;
              foundTarget = true;
              break;
            }
          }
        } else {
          for (let attempt = 0; attempt < 8; attempt++) {
            const rx = Math.max(minX, Math.min(maxX, cx + Math.floor(Math.random() * 11 - 5)));
            const rz = Math.max(minZ, Math.min(maxZ, cz + Math.floor(Math.random() * 11 - 5)));
            const key = (rz << 16) | (rx & 0xffff);
            if (!_occupiedCoords.has(key) && grid.isWalkable(rx, rz) && Math.hypot(rx - unitX, rz - unitZ) >= minimumWanderDistance) {
              targetX = rx;
              targetZ = rz;
              foundTarget = true;
              break;
            }
          }
        }

        if (foundTarget) {
          const wanderPath = createPathSafely(
            grid,
            unit.position,
            unit.gridPosition,
            [targetX, targetZ],
            buildingEntities,
            false,
            uBounds
          );

          if (wanderPath && wanderPath.length > 0) {
            unit.path = wanderPath;
            unit.currentJob = {
              id: `wander-${Date.now()}`,
              type: 'wander',
              progress: 0,
              totalWork: 15,
            };
            (unit as any).idleCooldownTicks = tick + Math.floor(Math.random() * 45 + 30);

            if (Math.random() < 0.07) {
              const isLord = isNoble(unit);
              let text = '';
              if (isLord) {
                const lordPhrases = [
                  'Оглядаю володіння',
                  'Село зростає на очах',
                  'Свіже повітря піде на користь',
                  'Усе йде за планом',
                  'Вітаю, жителі моїх земель!',
                ];
                text = lordPhrases[Math.floor(Math.random() * lordPhrases.length)];
              } else {
                const peasantPhrases = [
                  "Розім'яти б ноги",
                  'Піду гляну, як там справи',
                  'Гарна нині погода',
                  'Час перепочити',
                  'Наше поселення гарнішає',
                ];
                text = peasantPhrases[Math.floor(Math.random() * peasantPhrases.length)];
              }
              unit.speechBubble = {
                text,
                expiresAtTick: (useGameStore.getState().time.tick || 0) + 30,
                type: 'mood',
              };
            }
            return;
          }
        }

        (unit as any).idleCooldownTicks = tick + Math.floor(Math.random() * 30 + 15);
      }
    }
  }

  public static getJobAnnouncement(type: string): string {
    switch (type) {
      case 'chop_tree':
      case 'chop_fallen_log':
        return 'Іду рубати ліс';
      case 'mine_rock':
        return 'Іду видобувати камінь';
      case 'build_structure':
        return 'Іду на будівництво';
      case 'demolish_structure':
        return 'Іду розбирати споруду';
      case 'harvest_wheat':
        return 'Час збирати врожай';
      case 'work_at_building':
        return 'Іду на робоче місце';
      case 'haul_construction_mule':
        return 'Веду мула за матеріалами';
      case 'haul_log_with_mule':
        return 'Веду мула по колоду';
      case 'patrol':
        return 'Патрулюю володіння';
      case 'sleep':
        return 'Іду відпочивати';
      case 'sit_by_fire':
        return 'Іду грітися біля вогню';
      default:
        return 'Виконую наказ';
    }
  }
}
