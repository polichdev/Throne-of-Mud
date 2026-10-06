import { GridMap } from './GridMap';
import type { RegionBounds } from '../pathfinding/AStar';
import type { ResourceDeposit } from '../../types/game';
import { isRoadOverlappingDeposit } from '../buildings/buildingValidation';

export type RoadBoundsFilter = RegionBounds | ((x: number, z: number) => boolean);

export function isTileInRoadBounds(x: number, z: number, bounds?: RoadBoundsFilter): boolean {
  if (!bounds) return true;
  if (typeof bounds === 'function') {
    return bounds(x, z);
  }
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

export function getContinuousRoadLine(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  bounds?: RoadBoundsFilter
): [number, number][] {
  const result: [number, number][] = [];
  const visited = new Set<string>();

  const pushTile = (tx: number, tz: number) => {
    if (bounds && !isTileInRoadBounds(tx, tz, bounds)) {
      return;
    }
    const key = `${tx},${tz}`;
    if (!visited.has(key)) {
      visited.add(key);
      result.push([tx, tz]);
    }
  };

  let x = Math.round(x0);
  let z = Math.round(z0);
  const targetX = Math.round(x1);
  const targetZ = Math.round(z1);

  const dx = Math.abs(targetX - x);
  const dz = Math.abs(targetZ - z);
  const sx = targetX >= x ? 1 : -1;
  const sz = targetZ >= z ? 1 : -1;
  let err = dx - dz;

  pushTile(x, z);

  while (x !== targetX || z !== targetZ) {
    const e2 = 2 * err;
    let movedX = false;
    let movedZ = false;

    if (e2 > -dz) {
      err -= dz;
      x += sx;
      movedX = true;
    }
    if (e2 < dx) {
      err += dx;
      z += sz;
      movedZ = true;
    }

    if (movedX && movedZ) {
      if (Math.abs(err + dz) < Math.abs(err - dx)) {
        pushTile(x - sx, z);
      } else {
        pushTile(x, z - sz);
      }
    }

    pushTile(x, z);
  }

  return result;
}

export function isRoadPathValid(
  grid: GridMap,
  path: [number, number][],
  resourceDeposits?: ResourceDeposit[]
): boolean {
  if (path.length === 0) return false;
  for (const [x, z] of path) {
    const tile = grid.getTile(x, z);
    if (!tile) return false;
    if (tile.terrain === 'water') return false;
    if (tile.buildingId) return false;
    if (resourceDeposits && resourceDeposits.length > 0) {
      if (isRoadOverlappingDeposit(x, z, resourceDeposits)) {
        return false;
      }
    }
  }
  return true;
}

const MAX_GRID_CELLS = 512 * 512;
const _roadGScore = new Float32Array(MAX_GRID_CELLS);
const _roadFScore = new Float32Array(MAX_GRID_CELLS);
const _roadVisitedRun = new Int32Array(MAX_GRID_CELLS);
const _roadClosedRun = new Int32Array(MAX_GRID_CELLS);
const _roadParent = new Int32Array(MAX_GRID_CELLS);
let _roadRunId = 0;

class RoadMinHeap {
  private data: Int32Array;
  public size = 0;
  constructor(cap = 2048) {
    this.data = new Int32Array(cap);
  }
  public clear() {
    this.size = 0;
  }
  public push(idx: number) {
    if (this.size >= this.data.length) {
      const next = new Int32Array(this.data.length * 2);
      next.set(this.data);
      this.data = next;
    }
    let i = this.size++;
    this.data[i] = idx;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (_roadFScore[this.data[p]] > _roadFScore[idx]) {
        this.data[i] = this.data[p];
        i = p;
      } else {
        break;
      }
    }
    this.data[i] = idx;
  }
  public pop(): number {
    if (this.size === 0) return -1;
    const res = this.data[0];
    const last = this.data[--this.size];
    if (this.size > 0) {
      let i = 0;
      const half = this.size >> 1;
      while (i < half) {
        let left = (i << 1) + 1;
        const right = left + 1;
        let best = left;
        if (right < this.size && _roadFScore[this.data[right]] < _roadFScore[this.data[left]]) {
          best = right;
        }
        if (_roadFScore[last] <= _roadFScore[this.data[best]]) {
          break;
        }
        this.data[i] = this.data[best];
        i = best;
      }
      this.data[i] = last;
    }
    return res;
  }
}

const _roadHeap = new RoadMinHeap(4096);

export function getSmartRoadPath(
  grid: GridMap,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  bounds?: RoadBoundsFilter,
  resourceDeposits?: ResourceDeposit[]
): [number, number][] {
  let sx = Math.round(x0);
  let sz = Math.round(z0);
  let tx = Math.round(x1);
  let tz = Math.round(z1);

  const gridW = grid.width || 256;

  const isBlocked = (x: number, z: number) => {
    const t = grid.getTile(x, z);
    if (!t || t.terrain === 'water' || t.buildingId) return true;
    if (resourceDeposits && isRoadOverlappingDeposit(x, z, resourceDeposits)) return true;
    return false;
  };

  const findNearestClear = (cx: number, cz: number): [number, number] | null => {
    if (!isBlocked(cx, cz) && isTileInRoadBounds(cx, cz, bounds)) return [cx, cz];
    const offsets = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [0, 2], [0, -2], [2, 0], [-2, 0],
      [0, 3], [0, -3], [3, 0], [-3, 0],
      [0, 4], [0, -4], [4, 0], [-4, 0],
    ];
    for (const [ox, oz] of offsets) {
      const nx = cx + ox;
      const nz = cz + oz;
      if (!isBlocked(nx, nz) && isTileInRoadBounds(nx, nz, bounds)) {
        return [nx, nz];
      }
    }
    return null;
  };

  const clearStart = findNearestClear(sx, sz);
  if (!clearStart) return [];
  sx = clearStart[0];
  sz = clearStart[1];

  const clearTarget = findNearestClear(tx, tz);
  if (!clearTarget) return [];
  tx = clearTarget[0];
  tz = clearTarget[1];

  if (sx === tx && sz === tz) {
    return [[sx, sz]];
  }

  const directLine = getContinuousRoadLine(sx, sz, tx, tz, bounds);
  let directBlocked = false;

  for (let i = 0; i < directLine.length; i++) {
    const [lx, lz] = directLine[i];
    if (isBlocked(lx, lz)) {
      directBlocked = true;
      break;
    }
  }

  if (!directBlocked) {
    return directLine;
  }

  _roadRunId++;
  if (_roadRunId >= 2147483640) {
    _roadRunId = 1;
    _roadVisitedRun.fill(0);
    _roadClosedRun.fill(0);
  }
  const runId = _roadRunId;

  _roadHeap.clear();

  const startIdx = sz * gridW + sx;
  const targetIdx = tz * gridW + tx;

  const startH = Math.hypot(tx - sx, tz - sz);
  _roadGScore[startIdx] = 0;
  _roadFScore[startIdx] = startH;
  _roadParent[startIdx] = -1;
  _roadVisitedRun[startIdx] = runId;

  _roadHeap.push(startIdx);

  const neighbors4 = [
    [0, 1], [0, -1], [1, 0], [-1, 0]
  ];

  let iterations = 0;
  const maxIterations = 15000;

  while (_roadHeap.size > 0 && iterations++ < maxIterations) {
    const currentIdx = _roadHeap.pop();
    if (currentIdx === -1) break;

    const cx = currentIdx % gridW;
    const cz = (currentIdx / gridW) | 0;

    if (currentIdx === targetIdx || (iterations > 1 && Math.hypot(cx - tx, cz - tz) <= 1.05)) {
      const path: [number, number][] = [];
      let curr = currentIdx;
      while (curr !== -1) {
        const px = curr % gridW;
        const pz = (curr / gridW) | 0;
        path.push([px, pz]);
        curr = _roadParent[curr];
      }
      path.reverse();
      if (currentIdx !== targetIdx && !isBlocked(tx, tz) && isTileInRoadBounds(tx, tz, bounds)) {
        path.push([tx, tz]);
      }
      return path;
    }

    _roadClosedRun[currentIdx] = runId;
    const currentG = _roadGScore[currentIdx];

    for (let i = 0; i < 4; i++) {
      const nx = cx + neighbors4[i][0];
      const nz = cz + neighbors4[i][1];

      if (nx < 0 || nx >= gridW || nz < 0 || nz >= grid.height) continue;

      if (bounds && !isTileInRoadBounds(nx, nz, bounds)) continue;

      const neighborIdx = nz * gridW + nx;
      if (_roadClosedRun[neighborIdx] === runId) continue;

      if (isBlocked(nx, nz)) continue;

      const tile = grid.getTile(nx, nz);
      const moveCost = tile?.terrain === 'road' ? 0.65 : 1.0;
      const tentativeG = currentG + moveCost;

      if (_roadVisitedRun[neighborIdx] !== runId) {
        _roadVisitedRun[neighborIdx] = runId;
        const h = Math.hypot(tx - nx, tz - nz);
        _roadGScore[neighborIdx] = tentativeG;
        _roadFScore[neighborIdx] = tentativeG + h;
        _roadParent[neighborIdx] = currentIdx;
        _roadHeap.push(neighborIdx);
      } else if (tentativeG < _roadGScore[neighborIdx]) {
        const h = _roadFScore[neighborIdx] - _roadGScore[neighborIdx];
        _roadGScore[neighborIdx] = tentativeG;
        _roadFScore[neighborIdx] = tentativeG + h;
        _roadParent[neighborIdx] = currentIdx;
        _roadHeap.push(neighborIdx);
      }
    }
  }

  return [];
}
