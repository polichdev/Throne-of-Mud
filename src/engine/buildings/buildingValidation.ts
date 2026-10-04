import type { BuildingType, ResourceDeposit, ResourceDepositType } from '../../types/game';
import { GridMap } from '../grid/GridMap';
import { buildingEntities } from '../ecs/world';
import { BUILDING_BLUEPRINTS } from './blueprints';

export interface PlacementValidationResult {
  allowed: boolean;
  reason?: string;
}

export interface RotatedFootprint {
  centerX: number;
  centerZ: number;
  baseWidth: number;
  baseHeight: number;
  rotationAngle: number;
  coveredTiles: [number, number][];
  minGridX: number;
  maxGridX: number;
  minGridZ: number;
  maxGridZ: number;
  boundingBoxWidth: number;
  boundingBoxHeight: number;
}

export function getDepositClearanceRadius(type: ResourceDepositType): number {
  switch (type) {
    case 'iron':
      return 2.8;
    case 'stone':
    case 'salt':
    case 'clay':
    case 'wild_game':
      return 2.4;
    case 'berries':
      return 2.0;
    case 'fish':
      return 1.6;
    default:
      return 2.0;
  }
}

export function getRotatedBuildingFootprint(
  cx: number,
  cz: number,
  baseW: number,
  baseH: number,
  rot: number
): RotatedFootprint {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const hw = baseW / 2;
  const hh = baseH / 2;

  const localCorners: [number, number][] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const [lx, lz] of localCorners) {
    const wx = cx + lx * cos + lz * sin;
    const wz = cz - lx * sin + lz * cos;
    if (wx < minX) minX = wx;
    if (wx > maxX) maxX = wx;
    if (wz < minZ) minZ = wz;
    if (wz > maxZ) maxZ = wz;
  }

  const startTx = Math.floor(minX + 0.001);
  const endTx = Math.ceil(maxX - 0.001) - 1;
  const startTz = Math.floor(minZ + 0.001);
  const endTz = Math.ceil(maxZ - 0.001) - 1;

  const coveredTiles: [number, number][] = [];
  const tolerance = 0.18;

  for (let tx = startTx; tx <= endTx; tx++) {
    for (let tz = startTz; tz <= endTz; tz++) {
      const tileCenterX = tx + 0.5;
      const tileCenterZ = tz + 0.5;
      const dx = tileCenterX - cx;
      const dz = tileCenterZ - cz;
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;

      if (Math.abs(lx) <= hw + tolerance && Math.abs(lz) <= hh + tolerance) {
        coveredTiles.push([tx, tz]);
      }
    }
  }

  if (coveredTiles.length === 0) {
    coveredTiles.push([Math.floor(cx), Math.floor(cz)]);
  }

  let actualMinX = Infinity;
  let actualMaxX = -Infinity;
  let actualMinZ = Infinity;
  let actualMaxZ = -Infinity;
  for (const [tx, tz] of coveredTiles) {
    if (tx < actualMinX) actualMinX = tx;
    if (tx > actualMaxX) actualMaxX = tx;
    if (tz < actualMinZ) actualMinZ = tz;
    if (tz > actualMaxZ) actualMaxZ = tz;
  }

  return {
    centerX: cx,
    centerZ: cz,
    baseWidth: baseW,
    baseHeight: baseH,
    rotationAngle: rot,
    coveredTiles,
    minGridX: actualMinX,
    maxGridX: actualMaxX,
    minGridZ: actualMinZ,
    maxGridZ: actualMaxZ,
    boundingBoxWidth: actualMaxX - actualMinX + 1,
    boundingBoxHeight: actualMaxZ - actualMinZ + 1,
  };
}

export function validateRotatedBuildingPlacement(
  buildingType: BuildingType,
  footprint: RotatedFootprint,
  grid: GridMap,
  resourceDeposits: ResourceDeposit[],
  regionBounds?: { minX: number; maxX: number; minZ: number; maxZ: number },
  regionId?: number
): PlacementValidationResult {
  const { coveredTiles, centerX, centerZ } = footprint;

  for (const [tx, tz] of coveredTiles) {
    if (tx < 0 || tz < 0 || tx >= grid.width || tz >= grid.height) {
      return {
        allowed: false,
        reason: 'За межами карти!',
      };
    }

    if (regionId !== undefined) {
      if (!GridMap.isCoordInRegion(regionId, tx, tz, 0)) {
        return {
          allowed: false,
          reason: 'Ви не маєте права будувати за межами свого володіння!',
        };
      }
      if (GridMap.getDistanceToHighway(tx, tz) < 3.5) {
        return {
          allowed: false,
          reason: 'Заборонено зводити споруди впритул до Королівського тракту!',
        };
      }
    } else if (regionBounds) {
      if (tx < regionBounds.minX || tx > regionBounds.maxX || tz < regionBounds.minZ || tz > regionBounds.maxZ) {
        return {
          allowed: false,
          reason: 'Ви не маєте права будувати за межами свого регіону!',
        };
      }
    }

    const tile = grid.getTile(tx, tz);
    if (!tile) {
      return {
        allowed: false,
        reason: 'Недійсна клітинка місцевості!',
      };
    }

    if (tile.terrain === 'water') {
      return {
        allowed: false,
        reason: 'Неможливо будувати на воді!',
      };
    }

    if (tile.terrain === 'road') {
      return {
        allowed: false,
        reason: 'Неможливо будувати на прокладеній дорозі!',
      };
    }

    if (tile.buildingId) {
      return {
        allowed: false,
        reason: 'Місце вже зайняте іншою спорудою!',
      };
    }
  }

  const allowedOverlapMap: Partial<Record<BuildingType, string>> = {
    iron_mine: 'iron',
    stone_quarry: 'stone',
    clay_pit: 'clay',
    salt_works: 'salt',
  };
  const ignoredType = allowedOverlapMap[buildingType];

  if (resourceDeposits && resourceDeposits.length > 0) {
    for (const dep of resourceDeposits) {
      if (ignoredType && dep.type === ignoredType) continue;
      const depX = dep.position ? dep.position[0] : (dep.gridPosition ? dep.gridPosition[0] + 0.5 : 0);
      const depZ = dep.position ? dep.position[2] : (dep.gridPosition ? dep.gridPosition[1] + 0.5 : 0);
      const radius = getDepositClearanceRadius(dep.type);
      const radiusSq = radius * radius;

      for (const [tx, tz] of coveredTiles) {
        const distSq = (tx + 0.5 - depX) ** 2 + (tz + 0.5 - depZ) ** 2;
        if (distSq < radiusSq) {
          return {
            allowed: false,
            reason: 'Не можна зводити будівлю прямо на покладах ресурсів або чагарниках!',
          };
        }
      }
    }
  }

  const isWall = buildingType === 'wooden_wall' || buildingType === 'stone_wall' || buildingType === 'wooden_gate';

  for (const b of buildingEntities) {
    if (!b.isBuilding) continue;
    const bType = b.buildingType;
    const isOtherWall = bType === 'wooden_wall' || bType === 'stone_wall' || bType === 'wooden_gate';

    if (!isWall && !isOtherWall && (buildingType === 'windmill' || bType === 'windmill')) {
      const otherPos = b.position || (b.gridPosition ? [b.gridPosition[0] + 1.5, 0, b.gridPosition[1] + 1.5] : [0, 0, 0]);
      const dist = Math.hypot(centerX - otherPos[0], centerZ - otherPos[2]);
      if (dist < 3.2) {
        return {
          allowed: false,
          reason: 'Млин потребує додаткового вільного простору для обертання лопатей!',
        };
      }
    }
  }

  if (buildingType === 'fishermans_hut') {
    let touchesWater = false;
    for (const [tx, tz] of coveredTiles) {
      const neighbors = [
        [tx + 1, tz], [tx - 1, tz], [tx, tz + 1], [tx, tz - 1],
        [tx + 1, tz + 1], [tx - 1, tz - 1], [tx + 1, tz - 1], [tx - 1, tz + 1]
      ];
      for (const [nx, nz] of neighbors) {
        const nTile = grid.getTile(nx, nz);
        if (nTile && nTile.terrain === 'water') {
          touchesWater = true;
          break;
        }
      }
      if (touchesWater) break;
    }
    if (!touchesWater) {
      return {
        allowed: false,
        reason: 'Хатину рибалки можна будувати лише на березі водойми (біля води)!',
      };
    }
  }

  const depositRules: Partial<Record<BuildingType, { depositType: ResourceDepositType; maxDistance: number; errorMsg: string }>> = {
    iron_mine: {
      depositType: 'iron',
      maxDistance: 2.2,
      errorMsg: 'Копальню заліза можна зводити лише безпосередньо на родовищі залізної руди!',
    },
    stone_quarry: {
      depositType: 'stone',
      maxDistance: 2.2,
      errorMsg: 'Каменоломню можна зводити лише безпосередньо на покладах каменю!',
    },
    clay_pit: {
      depositType: 'clay',
      maxDistance: 2.2,
      errorMsg: 'Глиняний карʼєр можна зводити лише безпосередньо на родовищі глини!',
    },
    salt_works: {
      depositType: 'salt',
      maxDistance: 2.5,
      errorMsg: 'Солеварню можна зводити лише безпосередньо на родовищі солі або соляних джерелах!',
    },
  };

  const rule = depositRules[buildingType];
  if (rule) {
    const nearDeposit = resourceDeposits.some((d) => {
      if (d.type !== rule.depositType) return false;
      const dPos = d.position ? [d.position[0], d.position[2]] : [d.gridPosition[0] + 0.5, d.gridPosition[1] + 0.5];
      const dist = Math.hypot(dPos[0] - centerX, dPos[1] - centerZ);
      return dist <= rule.maxDistance;
    });

    if (!nearDeposit) {
      return {
        allowed: false,
        reason: rule.errorMsg,
      };
    }
  }

  return { allowed: true };
}

export function isOverlappingResourceDeposit(
  x: number,
  z: number,
  width: number,
  height: number,
  resourceDeposits: ResourceDeposit[],
  ignoreDepositType?: string
): boolean {
  if (!resourceDeposits || resourceDeposits.length === 0) return false;

  for (const dep of resourceDeposits) {
    if (ignoreDepositType && dep.type === ignoreDepositType) continue;
    const depX = dep.position ? dep.position[0] : (dep.gridPosition ? dep.gridPosition[0] + 0.5 : 0);
    const depZ = dep.position ? dep.position[2] : (dep.gridPosition ? dep.gridPosition[1] + 0.5 : 0);
    const radius = getDepositClearanceRadius(dep.type);
    const radiusSq = radius * radius;

    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < height; dz++) {
        const tx = x + dx + 0.5;
        const tz = z + dz + 0.5;
        const distSq = (tx - depX) ** 2 + (tz - depZ) ** 2;
        if (distSq < radiusSq) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isRoadOverlappingDeposit(
  x: number,
  z: number,
  resourceDeposits: ResourceDeposit[]
): boolean {
  if (!resourceDeposits || resourceDeposits.length === 0) return false;

  for (const dep of resourceDeposits) {
    const depX = dep.position ? dep.position[0] : (dep.gridPosition ? dep.gridPosition[0] + 0.5 : 0);
    const depZ = dep.position ? dep.position[2] : (dep.gridPosition ? dep.gridPosition[1] + 0.5 : 0);
    const coreRadius = dep.type === 'fish' ? 0.7 : 0.85;
    const distSq = (x + 0.5 - depX) ** 2 + (z + 0.5 - depZ) ** 2;
    if (distSq < coreRadius * coreRadius) {
      return true;
    }
  }

  return false;
}

export function validateBuildingPlacement(
  buildingType: BuildingType,
  x: number,
  z: number,
  width: number,
  height: number,
  grid: GridMap,
  resourceDeposits: ResourceDeposit[],
  regionId?: number
): PlacementValidationResult {
  if (regionId !== undefined) {
    if (!GridMap.isBuildingInRegion(regionId, x, z, width, height, 3.5)) {
      return {
        allowed: false,
        reason: 'Заборонено будувати за межами володіння або впритул до Королівського тракту!',
      };
    }
  }

  if (!grid.canPlaceBuilding(x, z, width, height)) {
    return {
      allowed: false,
      reason: 'Місце зайняте дорогою, водою, іншою будівлею або перешкодами.',
    };
  }

  const allowedOverlapMap: Partial<Record<BuildingType, string>> = {
    iron_mine: 'iron',
    stone_quarry: 'stone',
    clay_pit: 'clay',
    salt_works: 'salt',
  };
  const ignoredType = allowedOverlapMap[buildingType];

  if (isOverlappingResourceDeposit(x, z, width, height, resourceDeposits, ignoredType)) {
    return {
      allowed: false,
      reason: 'Не можна зводити будівлю прямо на покладах ресурсів або чагарниках!',
    };
  }

  const isWall = buildingType === 'wooden_wall' || buildingType === 'stone_wall' || buildingType === 'wooden_gate';

  for (const b of buildingEntities) {
    if (!b.isBuilding || !b.gridPosition) continue;
    const [bx, bz] = b.gridPosition;
    const bType = b.buildingType;
    const bDef = bType ? BUILDING_BLUEPRINTS[bType] : null;
    const bw = b.buildingWidth || bDef?.width || 1;
    const bh = b.buildingHeight || bDef?.height || 1;

    const overlapX = !(x + width <= bx || x >= bx + bw);
    const overlapZ = !(z + height <= bz || z >= bz + bh);
    if (overlapX && overlapZ) {
      return {
        allowed: false,
        reason: 'Місце перетинається з іншою спорудою!',
      };
    }

    const isOtherWall = bType === 'wooden_wall' || bType === 'stone_wall' || bType === 'wooden_gate';
    if (!isWall && !isOtherWall) {
      if (buildingType === 'windmill' || bType === 'windmill') {
        const clearance = 1;
        const nearX = !(x + width + clearance <= bx || x >= bx + bw + clearance);
        const nearZ = !(z + height + clearance <= bz || z >= bz + bh + clearance);
        if (nearX && nearZ) {
          return {
            allowed: false,
            reason: 'Млин потребує додаткового вільного простору для обертання лопатей!',
          };
        }
      }
    }
  }

  if (buildingType === 'fishermans_hut') {
    let touchesWater = false;
    for (let dx = -1; dx <= width; dx++) {
      for (let dz = -1; dz <= height; dz++) {
        if (dx >= 0 && dx < width && dz >= 0 && dz < height) continue;
        const tx = x + dx;
        const tz = z + dz;
        const tile = grid.getTile(tx, tz);
        if (tile && tile.terrain === 'water') {
          touchesWater = true;
          break;
        }
      }
      if (touchesWater) break;
    }
    if (!touchesWater) {
      return {
        allowed: false,
        reason: 'Хатину рибалки можна будувати лише на березі водойми (біля води)!',
      };
    }
  }

  const depositRules: Partial<Record<BuildingType, { depositType: ResourceDepositType; maxDistance: number; errorMsg: string }>> = {
    iron_mine: {
      depositType: 'iron',
      maxDistance: 2.2,
      errorMsg: 'Копальню заліза можна зводити лише безпосередньо на родовищі залізної руди!',
    },
    stone_quarry: {
      depositType: 'stone',
      maxDistance: 2.2,
      errorMsg: 'Каменоломню можна зводити лише безпосередньо на покладах каменю!',
    },
    clay_pit: {
      depositType: 'clay',
      maxDistance: 2.2,
      errorMsg: 'Глиняний карʼєр можна зводити лише безпосередньо на родовищі глини!',
    },
    salt_works: {
      depositType: 'salt',
      maxDistance: 2.5,
      errorMsg: 'Солеварню можна зводити лише безпосередньо на родовищі солі або соляних джерелах!',
    },
  };

  const rule = depositRules[buildingType];
  if (rule) {
    const centerX = x + width / 2;
    const centerZ = z + height / 2;
    const nearDeposit = resourceDeposits.some((d) => {
      if (d.type !== rule.depositType) return false;
      const dist = Math.hypot(d.gridPosition[0] - centerX, d.gridPosition[1] - centerZ);
      return dist <= rule.maxDistance;
    });

    if (!nearDeposit) {
      return {
        allowed: false,
        reason: rule.errorMsg,
      };
    }
  }

  return { allowed: true };
}
