import { characterEntities, buildingEntities } from '../world';
import type { GameEntity } from '../world';
import { GridMap } from '../../grid/GridMap';
import { getBuildingFloorHeight, findBuildingContainingPos } from '../../buildings/buildingNavigation';
import { useGameStore } from '../../../store/useGameStore';
import type { RegionData } from '../../../types/game';
import {
  SURFACE_SPEED_ROAD,
  SURFACE_SPEED_MUD,
  SURFACE_SPEED_DEFAULT,
  ENTITY_COLLISION_DISTANCE,
  ENTITY_COLLISION_DISTANCE_SQ,
  ENTITY_VERTICAL_LERP_SPEED,
  ENTITY_VERTICAL_EPSILON,
  ENTITY_MAX_PUSH_SPEED,
  DEFAULT_UNIT_MOVE_SPEED,
} from '../../../constants/movement';

interface StuckInfo {
  lastX: number;
  lastZ: number;
  stalledSeconds: number;
}

const stuckTracker = new Map<string, StuckInfo>();
const ENTITY_STUCK_TIMEOUT_SECONDS = 2;
const ENTITY_STUCK_PROGRESS_EPSILON = 0.005;

const _entityList: GameEntity[] = [];
const _isFixedList: boolean[] = [];
const _spatialGrid = new Map<number, number[]>();
const _checkedPairs = new Set<number>();

let _currentRegionMap: Map<number, RegionData> = new Map();
const _buildingMap = new Map<string, GameEntity>();

export function clampCoordToRegion(regionId: number, x: number, z: number, reg?: RegionData): [number, number] {
  let cx = x;
  let cz = z;
  if (reg?.bounds) {
    cx = Math.max(reg.bounds.minX + 0.5, Math.min(reg.bounds.maxX - 0.5, cx));
    cz = Math.max(reg.bounds.minZ + 0.5, Math.min(reg.bounds.maxZ - 0.5, cz));
  } else {
    cx = Math.max(2.5, Math.min(381.5, cx));
    cz = Math.max(2.5, Math.min(381.5, cz));
  }

  if (regionId !== 5) {
    const plazaZ = GridMap.getHighwayZ(192.0);
    const distPlaza = Math.hypot(cx - 192.0, cz - plazaZ);
    if (distPlaza < 3.8) {
      const angle = Math.atan2(cz - plazaZ, cx - 192.0);
      cx = 192.0 + Math.cos(angle) * 3.8;
      cz = plazaZ + Math.sin(angle) * 3.8;
    }
  }

  return [cx, cz];
}

function tryNudgeEntity(
  ent: GameEntity,
  nudgeX: number,
  nudgeZ: number,
  grid: GridMap,
  _regions?: RegionData[]
): void {
  if (!ent.position || (nudgeX === 0 && nudgeZ === 0)) return;
  const curX = ent.position[0];
  const curZ = ent.position[2];
  let targetX = curX + nudgeX;
  let targetZ = curZ + nudgeZ;

  const isMerchant = ent.factionId === 'merchant' || ent.isMerchant;
  if (!isMerchant && ent.regionId !== undefined && _currentRegionMap) {
    const reg = _currentRegionMap.get(ent.regionId);
    [targetX, targetZ] = clampCoordToRegion(ent.regionId, targetX, targetZ, reg);
  }

  const isPositionValid = (x: number, z: number): boolean => {
    const tile = grid.getTile(Math.floor(x), Math.floor(z));
    if (!tile || tile.terrain === 'water') return false;
    if (tile.isPassable) return true;
    return Boolean(tile.buildingId);
  };

  if (isPositionValid(targetX, targetZ)) {
    ent.position[0] = targetX;
    ent.position[2] = targetZ;
    if (ent.gridPosition) {
      ent.gridPosition[0] = Math.floor(targetX);
      ent.gridPosition[1] = Math.floor(targetZ);
    } else {
      ent.gridPosition = [Math.floor(targetX), Math.floor(targetZ)];
    }
  } else if (isPositionValid(targetX, curZ)) {
    ent.position[0] = targetX;
    if (ent.gridPosition) {
      ent.gridPosition[0] = Math.floor(targetX);
      ent.gridPosition[1] = Math.floor(curZ);
    } else {
      ent.gridPosition = [Math.floor(targetX), Math.floor(curZ)];
    }
  } else if (isPositionValid(curX, targetZ)) {
    ent.position[2] = targetZ;
    if (ent.gridPosition) {
      ent.gridPosition[0] = Math.floor(curX);
      ent.gridPosition[1] = Math.floor(targetZ);
    } else {
      ent.gridPosition = [Math.floor(curX), Math.floor(targetZ)];
    }
  }
}

export class MovementSystem {
  public static update(delta: number, grid: GridMap): void {
    const { regions } = useGameStore.getState();
    if (regions) {
      _currentRegionMap.clear();
      for (const r of regions) {
        _currentRegionMap.set(r.id, r);
      }
    }

    const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
    const zoom = ((window as any).__lastCameraZoom || 38) as number;
    const maxSimDist = Math.max(30, (900 / zoom) + 10);
    const maxSimDistSq = maxSimDist * maxSimDist;

    for (const entity of characterEntities) {
      if (!entity.position) {
        continue;
      }

      const isMerchant = entity.factionId === 'merchant' || entity.isMerchant;

      if (entity.path && entity.path.length > 0) {
        const nextWaypoint = entity.path[0];

        if (!isMerchant && entity.regionId !== undefined && _currentRegionMap) {
          const reg = _currentRegionMap.get(entity.regionId);
          const b = reg?.bounds;
          const wx = nextWaypoint[0];
          const wz = nextWaypoint[1];
          const isAllowed =
            GridMap.isCoordInRegion(entity.regionId, wx, wz, -2) ||
            GridMap.canRegionConnectToHighwayAt(entity.regionId, wx, wz) ||
            GridMap.isTradeHighwayTile(wx, wz) ||
            (b ? (wx >= b.minX - 3 && wx <= b.maxX + 3 && wz >= b.minZ - 3 && wz <= b.maxZ + 3) : true);

          if (!isAllowed) {
            entity.path = [];
            stuckTracker.delete(entity.id);
            continue;
          }
        }

        const tracker = stuckTracker.get(entity.id);
        const curX = entity.position[0];
        const curZ = entity.position[2];
        if (tracker) {
          const moved = Math.hypot(curX - tracker.lastX, curZ - tracker.lastZ);
          if (moved < ENTITY_STUCK_PROGRESS_EPSILON) {
            tracker.stalledSeconds += delta;
            if (tracker.stalledSeconds >= ENTITY_STUCK_TIMEOUT_SECONDS) {
              entity.path = [];
              stuckTracker.delete(entity.id);
              continue;
            }
          } else {
            tracker.lastX = curX;
            tracker.lastZ = curZ;
            tracker.stalledSeconds = 0;
          }
        } else {
          stuckTracker.set(entity.id, { lastX: curX, lastZ: curZ, stalledSeconds: 0 });
        }

        const currentTile = grid.getTile(Math.floor(entity.position[0]), Math.floor(entity.position[2]));
        let surfaceSpeedMultiplier = SURFACE_SPEED_DEFAULT;
        if (currentTile) {
          if (currentTile.terrain === 'road') {
            surfaceSpeedMultiplier = SURFACE_SPEED_ROAD;
          } else if (currentTile.terrain === 'mud') {
            surfaceSpeedMultiplier = SURFACE_SPEED_MUD;
          }
        }

        let remainingMove = (entity.moveSpeed || DEFAULT_UNIT_MOVE_SPEED) * surfaceSpeedMultiplier * delta;

        while (remainingMove > 0 && entity.path.length > 0) {
          const wp = entity.path[0];
          const targetX = wp[0] + 0.5;
          const targetZ = wp[1] + 0.5;
          const currentX = entity.position[0];
          const currentZ = entity.position[2];

          const dx = targetX - currentX;
          const dz = targetZ - currentZ;
          const distance = Math.hypot(dx, dz);

          if (distance <= remainingMove) {
            entity.position[0] = targetX;
            entity.position[2] = targetZ;
            entity.gridPosition = [wp[0], wp[1]];
            entity.path.shift();
            remainingMove -= distance;
            if (entity.path.length === 0) {
              stuckTracker.delete(entity.id);
              if (entity.currentJob?.type === 'wander') {
                entity.currentJob = { id: `idle-${entity.id}`, type: 'idle', progress: 0, totalWork: 0 };
              }
              break;
            }
          } else {
            const vx = (dx / distance) * remainingMove;
            const vz = (dz / distance) * remainingMove;
            entity.position[0] += vx;
            entity.position[2] += vz;
            remainingMove = 0;
          }
        }

        if (!isMerchant && entity.regionId !== undefined && _currentRegionMap) {
          const reg = _currentRegionMap.get(entity.regionId);
          const [clampedX, clampedZ] = clampCoordToRegion(entity.regionId, entity.position[0], entity.position[2], reg);
          if (clampedX !== entity.position[0] || clampedZ !== entity.position[2]) {
            entity.position[0] = clampedX;
            entity.position[2] = clampedZ;
            entity.gridPosition = [Math.floor(clampedX), Math.floor(clampedZ)];
          }
        }
      } else {
        stuckTracker.delete(entity.id);
        if (!isMerchant && entity.regionId !== undefined && _currentRegionMap) {
          const reg = _currentRegionMap.get(entity.regionId);
          const [clampedX, clampedZ] = clampCoordToRegion(entity.regionId, entity.position[0], entity.position[2], reg);
          if (clampedX !== entity.position[0] || clampedZ !== entity.position[2]) {
            entity.position[0] = clampedX;
            entity.position[2] = clampedZ;
            entity.gridPosition = [Math.floor(clampedX), Math.floor(clampedZ)];
          }
        }
      }
    }

    _entityList.length = 0;
    _isFixedList.length = 0;
    for (const list of _spatialGrid.values()) {
      list.length = 0;
    }

    const CELL_SIZE = 4;

    for (const entity of characterEntities) {
      if (!entity.position) continue;
      const idx = _entityList.length;
      _entityList.push(entity);
      const isStationarySleeping = Boolean((!entity.path || entity.path.length === 0) && entity.currentJob?.type === 'sleep');
      const isStationarySitting = Boolean((!entity.path || entity.path.length === 0) && entity.currentJob?.type === 'sit_by_fire');
      const isStationaryWorking = Boolean((!entity.path || entity.path.length === 0) && entity.currentJob && entity.currentJob.type !== 'idle' && entity.currentJob.type !== 'wander');
      const isFixed = isStationarySleeping || isStationarySitting || isStationaryWorking;
      _isFixedList.push(isFixed);

      const cx = Math.floor(entity.position[0] / CELL_SIZE);
      const cz = Math.floor(entity.position[2] / CELL_SIZE);
      const cellKey = (cz << 16) | (cx & 0xffff);
      let list = _spatialGrid.get(cellKey);
      if (!list) {
        list = [];
        _spatialGrid.set(cellKey, list);
      }
      list.push(idx);
    }

    _checkedPairs.clear();

    for (const [cellKey, cellIndices] of _spatialGrid) {
      const cx = (cellKey << 16) >> 16;
      const cz = cellKey >> 16;

      for (let i = 0; i < cellIndices.length; i++) {
        const idxA = cellIndices[i];
        const entA = _entityList[idxA];
        const fixedA = _isFixedList[idxA];
        const posA = entA.position!;

        for (let ox = -1; ox <= 1; ox++) {
          for (let oz = -1; oz <= 1; oz++) {
            const nCellKey = ((cz + oz) << 16) | ((cx + ox) & 0xffff);
            const neighborIndices = _spatialGrid.get(nCellKey);
            if (!neighborIndices) continue;

            for (let j = 0; j < neighborIndices.length; j++) {
              const idxB = neighborIndices[j];
              if (idxA >= idxB) continue;

              const pairKey = (idxA << 16) | idxB;
              if (_checkedPairs.has(pairKey)) continue;
              _checkedPairs.add(pairKey);

              const entB = _entityList[idxB];
              const fixedB = _isFixedList[idxB];
              if (fixedA && fixedB) continue;

              const isCampfireA = entA.currentJob?.type === 'sit_by_fire';
              const isCampfireB = entB.currentJob?.type === 'sit_by_fire';
              if (isCampfireA && isCampfireB) continue;

              if (entA.regionId !== undefined && entB.regionId !== undefined && entA.regionId !== entB.regionId) continue;

              const posB = entB.position!;
              let dx = posA[0] - posB[0];
              let dz = posA[2] - posB[2];
              let distSq = dx * dx + dz * dz;

              if (distSq >= ENTITY_COLLISION_DISTANCE_SQ) continue;

              let dist = Math.sqrt(distSq);
              if (dist < 0.001) {
                const pseudoAngle = ((idxA * 17 + idxB * 31) % 360) * (Math.PI / 180);
                dx = Math.cos(pseudoAngle) * 0.02;
                dz = Math.sin(pseudoAngle) * 0.02;
                dist = 0.02;
              }

              const overlap = ENTITY_COLLISION_DISTANCE - dist;
              const nx = dx / dist;
              const nz = dz / dist;
              const pushAmount = Math.min(overlap * 0.5, delta * ENTITY_MAX_PUSH_SPEED);

              const isMerchantA = Boolean(entA.isMerchant || entA.hasHorseCart);
              const isMerchantB = Boolean(entB.isMerchant || entB.hasHorseCart);

              if (isMerchantA && !isMerchantB) {
                tryNudgeEntity(entB, -nx * pushAmount, -nz * pushAmount, grid);
              } else if (!isMerchantA && isMerchantB) {
                tryNudgeEntity(entA, nx * pushAmount, nz * pushAmount, grid);
              } else if (!fixedA && !fixedB) {
                const halfPush = pushAmount * 0.5;
                tryNudgeEntity(entA, nx * halfPush, nz * halfPush, grid);
                tryNudgeEntity(entB, -nx * halfPush, -nz * halfPush, grid);
              } else if (!fixedA && fixedB) {
                tryNudgeEntity(entA, nx * pushAmount, nz * pushAmount, grid);
              } else if (fixedA && !fixedB) {
                tryNudgeEntity(entB, -nx * pushAmount, -nz * pushAmount, grid);
              }
            }
          }
        }
      }
    }

    _buildingMap.clear();
    for (const b of buildingEntities) {
      _buildingMap.set(b.id, b);
    }

    for (const entity of characterEntities) {
      if (!entity.position) continue;
      const isStationarySleeping = (!entity.path || entity.path.length === 0) && entity.currentJob?.type === 'sleep';
      const isStationarySitting = (!entity.path || entity.path.length === 0) && entity.currentJob?.type === 'sit_by_fire';

      if (isStationarySleeping || isStationarySitting) {
        if (entity.currentJob?.targetY !== undefined) {
          entity.position[1] = entity.currentJob.targetY;
        }
      } else {
        const tileX = Math.floor(entity.position[0]);
        const tileZ = Math.floor(entity.position[2]);
        const currentTile = grid.getTile(tileX, tileZ);
        const terrainH = currentTile?.height || 0;

        let inside: GameEntity | undefined;
        if (currentTile?.buildingId) {
          inside = _buildingMap.get(currentTile.buildingId);
        }
        if (!inside && entity.currentJob?.targetBuildingId) {
          inside = _buildingMap.get(entity.currentJob.targetBuildingId);
        }
        if (!inside) {
          inside = findBuildingContainingPos(entity.position[0], entity.position[2], buildingEntities);
        }

        const buildingBaseY = inside ? (inside.position ? inside.position[1] : terrainH) : terrainH;
        const floorH = inside ? getBuildingFloorHeight(inside.buildingType) : 0;
        const targetY = buildingBaseY + floorH;
        const currentY = entity.position[1] ?? targetY;
        const diffY = targetY - currentY;
        const isFarAway = camTarget && ((entity.position[0] - camTarget[0]) ** 2 + (entity.position[2] - camTarget[1]) ** 2 > maxSimDistSq);
        if (isFarAway || Math.abs(diffY) < ENTITY_VERTICAL_EPSILON) {
          entity.position[1] = targetY;
        } else {
          entity.position[1] = currentY + diffY * Math.min(1.0, delta * ENTITY_VERTICAL_LERP_SPEED);
        }
      }
    }

    const squads = useGameStore.getState().militiaSquads;
    if (squads.length > 0) {
      for (let i = 0; i < squads.length; i++) {
        const sq = squads[i];
        if (!sq.activeMarch) continue;

        let anyAlive = false;
        let anyMoving = false;
        for (const c of characterEntities) {
          if (c.isCharacter && c.isLevy && (c.militiaSquadId === sq.id || sq.memberIds.includes(c.id))) {
            anyAlive = true;
            if (c.path && c.path.length > 0) {
              anyMoving = true;
              break;
            }
          }
        }

        if (!anyAlive || !anyMoving) {
          useGameStore.getState().clearMilitiaSquadMarch(sq.id);
        }
      }
    }
  }
}
