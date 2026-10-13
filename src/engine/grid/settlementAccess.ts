import type { GameEntity } from '../ecs/world';
import { AStar } from '../pathfinding/AStar';
import { GridMap } from './GridMap';

type Point = [number, number];

function findCampAnchor(grid: GridMap, camp: Point): Point | null {
  const [cx, cz] = camp;
  const preferred: Point[] = [[cx + 2, cz + 2], [cx - 1, cz + 2], [cx, cz + 3]];
  for (const point of preferred) if (grid.isWalkable(...point)) return point;
  for (let radius = 1; radius <= 7; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
        const point: Point = [cx + dx, cz + dz];
        if (grid.isWalkable(...point)) return point;
      }
    }
  }
  return null;
}

function clearLeastCostPassage(grid: GridMap, start: Point, goals: Point[], regionId: number): number {
  const goalKeys = new Set(goals.map(([x, z]) => z * grid.width + x));
  const startKey = start[1] * grid.width + start[0];
  const costs = new Map<number, number>([[startKey, 0]]);
  const parents = new Map<number, number>();
  const heap: Array<[number, number]> = [];
  const push = (key: number, cost: number) => {
    let index = heap.length;
    heap.push([cost, key]);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (heap[parent][0] <= cost) break;
      heap[index] = heap[parent];
      index = parent;
    }
    heap[index] = [cost, key];
  };
  const pop = (): [number, number] | undefined => {
    const first = heap[0];
    const last = heap.pop();
    if (!first || !last || heap.length === 0) return first;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      if (left >= heap.length) break;
      const right = left + 1;
      const child = right < heap.length && heap[right][0] < heap[left][0] ? right : left;
      if (heap[child][0] >= last[0]) break;
      heap[index] = heap[child];
      index = child;
    }
    heap[index] = last;
    return first;
  };
  push(startKey, 0);

  const minX = Math.max(1, Math.min(start[0], ...goals.map((point) => point[0])) - 12);
  const maxX = Math.min(grid.width - 2, Math.max(start[0], ...goals.map((point) => point[0])) + 12);
  const minZ = Math.max(1, Math.min(start[1], ...goals.map((point) => point[1])) - 12);
  const maxZ = Math.min(grid.height - 2, Math.max(start[1], ...goals.map((point) => point[1])) + 12);
  let reached = -1;

  while (heap.length > 0) {
    const [cost, key] = pop()!;
    if (cost !== costs.get(key)) continue;
    if (goalKeys.has(key)) {
      reached = key;
      break;
    }
    const x = key % grid.width;
    const z = Math.floor(key / grid.width);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx < minX || nx > maxX || nz < minZ || nz > maxZ || !GridMap.isCoordInRegion(regionId, nx, nz, 0)) continue;
      const tile = grid.getTile(nx, nz);
      if (!tile || tile.terrain === 'water' || tile.buildingId || (!tile.isPassable && tile.foliageType !== 'tree')) continue;
      const nextKey = nz * grid.width + nx;
      const nextCost = cost + (tile.isPassable ? 1 : 9);
      if (nextCost >= (costs.get(nextKey) ?? Infinity)) continue;
      costs.set(nextKey, nextCost);
      parents.set(nextKey, key);
      push(nextKey, nextCost);
    }
  }

  if (reached < 0) return 0;
  let removed = 0;
  for (let key = reached; key !== startKey; key = parents.get(key)!) {
    const x = key % grid.width;
    const z = Math.floor(key / grid.width);
    const tile = grid.getTile(x, z);
    if (tile?.foliageType === 'tree' && !tile.isPassable) {
      grid.removeFoliage(x, z);
      removed++;
    }
  }
  if (removed > 0) AStar.clearUnreachableCache();
  return removed;
}

export function ensureEichenauSettlementAccess(grid: GridMap, camp: Point, buildings: GameEntity[] = []): number {
  const regionId = 2;
  const anchor = findCampAnchor(grid, camp);
  if (!anchor) return 0;
  const bounds = { minX: 0, maxX: 191, minZ: 232, maxZ: 383, regionId };
  const [cx, cz] = camp;
  const outerTargets: Point[] = [
    [cx - 18, cz], [cx + 18, cz], [cx, cz - 18], [cx, cz + 18],
    [cx - 13, cz - 13], [cx + 13, cz - 13], [cx - 13, cz + 13], [cx + 13, cz + 13],
  ];
  let removed = 0;

  for (const target of outerTargets) {
    if (!GridMap.isCoordInRegion(regionId, ...target)) continue;
    if (grid.isWalkable(...target) && AStar.findPath(grid, anchor, target, false, bounds)) continue;
    removed += clearLeastCostPassage(grid, anchor, [target], regionId);
  }

  for (const building of buildings) {
    if (building.isCompleted || !building.gridPosition || !building.isBuilding) continue;
    const [bx, bz] = building.gridPosition;
    if (Math.hypot(bx - cx, bz - cz) > 48) continue;
    const width = building.buildingWidth || 2;
    const height = building.buildingHeight || 2;
    if (AStar.findPathToArea(grid, anchor, bx, bz, width, height, bounds)) continue;
    const perimeter: Point[] = [];
    for (let x = bx - 1; x <= bx + width; x++) {
      for (let z = bz - 1; z <= bz + height; z++) {
        if (x !== bx - 1 && x !== bx + width && z !== bz - 1 && z !== bz + height) continue;
        if (GridMap.isCoordInRegion(regionId, x, z, 0)) perimeter.push([x, z]);
      }
    }
    if (perimeter.length > 0) removed += clearLeastCostPassage(grid, anchor, perimeter, regionId);
  }

  return removed;
}
