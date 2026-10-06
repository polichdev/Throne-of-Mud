import { GridMap } from './GridMap';
import { buildingEntities } from '../ecs/world';
import type { BuildingType, ResourceDeposit } from '../../types/game';
import { distance2D } from '../../utils/mathUtils';
import { validateBuildingPlacement } from '../buildings/buildingValidation';
import { BUILDING_BLUEPRINTS } from '../buildings/blueprints';

export const DEFAULT_BUILDING_SNAP_THRESHOLD = 2.4;
export const DEPOSIT_BUILDING_SNAP_THRESHOLD = 7.5;

const DEPOSIT_TARGET_MAP: Partial<Record<BuildingType, string>> = {
  iron_mine: 'iron',
  stone_quarry: 'stone',
  clay_pit: 'clay',
  salt_works: 'salt',
};

export function getSnappedPlacementCoords(
  rawX: number,
  rawZ: number,
  width: number,
  height: number,
  buildingType: BuildingType,
  grid: GridMap,
  resourceDeposits?: ResourceDeposit[]
): [number, number] {

  const targetDepositType = DEPOSIT_TARGET_MAP[buildingType];
  if (targetDepositType && resourceDeposits && resourceDeposits.length > 0) {
    let closestDepDist = DEPOSIT_BUILDING_SNAP_THRESHOLD;
    let bestDepositSnap: [number, number] | null = null;

    for (const d of resourceDeposits) {
      if (d.type !== targetDepositType) continue;
      const dx = d.position ? d.position[0] : (d.gridPosition ? d.gridPosition[0] + 0.5 : 0);
      const dz = d.position ? d.position[2] : (d.gridPosition ? d.gridPosition[1] + 0.5 : 0);

      const cursorCenterX = rawX + width / 2;
      const cursorCenterZ = rawZ + height / 2;
      const dist = distance2D(cursorCenterX, cursorCenterZ, dx, dz);

      if (dist < closestDepDist) {
        let bestRingDist = Infinity;
        let bestRingSnap: [number, number] | null = null;

        const isDirectExtraction = buildingType === 'iron_mine' || buildingType === 'stone_quarry' || buildingType === 'clay_pit' || buildingType === 'salt_works';
        const ringRadii = isDirectExtraction ? [0] : [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8];
        for (const r of ringRadii) {
          if (r === 0) {
            const candX = Math.floor(dx - width / 2 + 0.5);
            const candZ = Math.floor(dz - height / 2 + 0.5);
            if (candX >= 0 && candZ >= 0 && candX + width <= grid.width && candZ + height <= grid.height) {
              const validation = validateBuildingPlacement(buildingType, candX, candZ, width, height, grid, resourceDeposits);
              if (validation.allowed) {
                const dToCursor = distance2D(rawX, rawZ, candX, candZ);
                if (dToCursor < bestRingDist) {
                  bestRingDist = dToCursor;
                  bestRingSnap = [candX, candZ];
                }
              }
            }
            continue;
          }
          for (let deg = 0; deg < 360; deg += 30) {
            const rad = (deg * Math.PI) / 180;
            const candX = Math.floor(dx + r * Math.cos(rad) - width / 2 + 0.5);
            const candZ = Math.floor(dz + r * Math.sin(rad) - height / 2 + 0.5);

            if (candX < 0 || candZ < 0 || candX + width > grid.width || candZ + height > grid.height) continue;

            const validation = validateBuildingPlacement(buildingType, candX, candZ, width, height, grid, resourceDeposits);
            if (validation.allowed) {
              const dToCursor = distance2D(rawX, rawZ, candX, candZ);
              if (dToCursor < bestRingDist) {
                bestRingDist = dToCursor;
                bestRingSnap = [candX, candZ];
              }
            }
          }
        }

        if (bestRingSnap) {
          closestDepDist = dist;
          bestDepositSnap = bestRingSnap;
        }
      }
    }

    if (bestDepositSnap) {
      return bestDepositSnap;
    }
  }

  const roundX = Math.round(rawX);
  const roundZ = Math.round(rawZ);
  let closestDist = DEFAULT_BUILDING_SNAP_THRESHOLD;
  let bestSnap: [number, number] | null = null;
  const isWall = buildingType === 'wooden_wall' || buildingType === 'stone_wall' || buildingType === 'wooden_gate';

  for (const b of buildingEntities) {
    if (!b.isBuilding || !b.gridPosition) continue;

    const [bx, bz] = b.gridPosition;
    const bType = b.buildingType;
    const isOtherWall = bType === 'wooden_wall' || bType === 'stone_wall' || bType === 'wooden_gate';
    const spacing = (isWall && isOtherWall) ? 0 : 1;

    const bw = b.buildingWidth || (bType ? BUILDING_BLUEPRINTS[bType]?.width : null) || width;
    const bh = b.buildingHeight || (bType ? BUILDING_BLUEPRINTS[bType]?.height : null) || height;

    const candidates: [number, number][] = [
      [bx + bw + spacing, bz],
      [bx - width - spacing, bz],
      [bx, bz + bh + spacing],
      [bx, bz - height - spacing],
    ];

    for (const [cx, cz] of candidates) {
      if (cx < 0 || cz < 0 || cx + width > grid.width || cz + height > grid.height) continue;
      const dist = distance2D(rawX, rawZ, cx, cz);
      if (dist < closestDist) {
        const validation = validateBuildingPlacement(buildingType, cx, cz, width, height, grid, resourceDeposits || []);
        if (validation.allowed) {
          closestDist = dist;
          bestSnap = [cx, cz];
        }
      }
    }
  }

  if (bestSnap) {
    return [Math.round(bestSnap[0]), Math.round(bestSnap[1])];
  }

  return [roundX, roundZ];
}
