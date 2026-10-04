import { GridMap } from '../grid/GridMap';

export interface RegionBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  regionId?: number;
}

const MAX_GRID_CELLS = 256 * 256;
const visitedRun = new Int32Array(MAX_GRID_CELLS);
const closedRun = new Int32Array(MAX_GRID_CELLS);
const gScores = new Float32Array(MAX_GRID_CELLS);
const fScores = new Float32Array(MAX_GRID_CELLS);
const parentIndices = new Int32Array(MAX_GRID_CELLS);
const heapPositions = new Int32Array(MAX_GRID_CELLS);

let currentRunId = 1;

class FastIndexMinHeap {
  private heap = new Int32Array(2048);
  public size = 0;

  public clear(): void {
    this.size = 0;
  }

  public push(cellIndex: number): void {
    if (this.size >= this.heap.length) {
      const next = new Int32Array(this.heap.length * 2);
      next.set(this.heap);
      this.heap = next;
    }
    const idx = this.size++;
    this.heap[idx] = cellIndex;
    heapPositions[cellIndex] = idx;
    this.bubbleUp(idx);
  }

  public pop(): number {
    if (this.size === 0) return -1;
    const top = this.heap[0];
    heapPositions[top] = -1;
    const last = this.heap[--this.size];
    if (this.size > 0) {
      this.heap[0] = last;
      heapPositions[last] = 0;
      this.sinkDown(0);
    }
    return top;
  }

  public update(cellIndex: number): void {
    const idx = heapPositions[cellIndex];
    if (idx >= 0 && idx < this.size) {
      this.bubbleUp(idx);
    }
  }

  private bubbleUp(idx: number): void {
    const item = this.heap[idx];
    const itemF = fScores[item];
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      const parentItem = this.heap[parentIdx];
      if (itemF >= fScores[parentItem]) break;
      this.heap[idx] = parentItem;
      heapPositions[parentItem] = idx;
      idx = parentIdx;
    }
    this.heap[idx] = item;
    heapPositions[item] = idx;
  }

  private sinkDown(idx: number): void {
    const length = this.size;
    const item = this.heap[idx];
    const itemF = fScores[item];
    while (true) {
      const leftIdx = (idx << 1) + 1;
      const rightIdx = leftIdx + 1;
      let swapIdx = -1;
      let minF = itemF;

      if (leftIdx < length && fScores[this.heap[leftIdx]] < minF) {
        swapIdx = leftIdx;
        minF = fScores[this.heap[leftIdx]];
      }
      if (rightIdx < length && fScores[this.heap[rightIdx]] < minF) {
        swapIdx = rightIdx;
      }
      if (swapIdx === -1) break;

      const swapItem = this.heap[swapIdx];
      this.heap[idx] = swapItem;
      heapPositions[swapItem] = idx;
      idx = swapIdx;
    }
    this.heap[idx] = item;
    heapPositions[item] = idx;
  }
}

const sharedHeap = new FastIndexMinHeap();

export class AStar {
  public static clearUnreachableCache(): void {
  }

  public static findPathToArea(
    grid: GridMap,
    start: [number, number],
    areaX: number,
    areaZ: number,
    width: number,
    height: number,
    regionBounds?: RegionBounds
  ): [number, number][] | null {
    const [sx, sz] = [Math.floor(start[0]), Math.floor(start[1])];

    const perimeter: Array<{ x: number; z: number; dist: number }> = [];

    for (let dx = -1; dx <= width; dx++) {
      for (let dz = -1; dz <= height; dz++) {
        if (dx === -1 || dx === width || dz === -1 || dz === height) {
          const px = areaX + dx;
          const pz = areaZ + dz;

          if (regionBounds) {
            if (px < regionBounds.minX || px > regionBounds.maxX || pz < regionBounds.minZ || pz > regionBounds.maxZ) {
              continue;
            }
          }

          if (grid.isWalkable(px, pz)) {
            if (sx === px && sz === pz) {
              return [[sx, sz]];
            }
            perimeter.push({
              x: px,
              z: pz,
              dist: Math.hypot(px - sx, pz - sz),
            });
          }
        }
      }
    }

    if (perimeter.length === 0) {
      return null;
    }

    perimeter.sort((a, b) => a.dist - b.dist);

    const candidates = perimeter.slice(0, 3);
    for (const p of candidates) {
      const path = AStar.findPath(grid, [sx, sz], [p.x, p.z], false, regionBounds);
      if (path && path.length > 0) {
        return path;
      }
    }

    return null;
  }

  public static findPath(
    grid: GridMap,
    start: [number, number],
    target: [number, number],
    allowAdjacentTarget = false,
    regionBounds?: RegionBounds
  ): [number, number][] | null {
    let sx = Math.floor(start[0]);
    let sz = Math.floor(start[1]);
    const tx = Math.floor(target[0]);
    const tz = Math.floor(target[1]);

    if (regionBounds) {
      if (tx < regionBounds.minX || tx > regionBounds.maxX || tz < regionBounds.minZ || tz > regionBounds.maxZ) {
        return null;
      }
    }

    if (!grid.isWalkable(sx, sz)) {
      const startNeighbors = grid.getNeighbors(sx, sz).filter((n) => grid.isWalkable(n.x, n.z));
      if (startNeighbors.length > 0) {
        startNeighbors.sort((a, b) => Math.hypot(a.x - tx, a.z - tz) - Math.hypot(b.x - tx, b.z - tz));
        sx = startNeighbors[0].x;
        sz = startNeighbors[0].z;
      }
    }

    const gridW = grid.width;

    if (!grid.isWalkable(tx, tz)) {
      if (!allowAdjacentTarget) {
        return null;
      }
      const neighbors = grid.getNeighbors(tx, tz).filter((n) => grid.isWalkable(n.x, n.z));
      if (neighbors.length === 0) return null;

      neighbors.sort((a, b) => {
        const distA = Math.hypot(a.x - sx, a.z - sz);
        const distB = Math.hypot(b.x - sx, b.z - sz);
        return distA - distB;
      });

      const topNeighbors = neighbors.slice(0, 2);
      for (const n of topNeighbors) {
        const subPath = AStar.findPath(grid, [sx, sz], [n.x, n.z], false, regionBounds);
        if (subPath && subPath.length > 0) {
          return subPath;
        }
      }
      return null;
    }

    if (sx === tx && sz === tz) {
      return [[sx, sz]];
    }

    currentRunId++;
    if (currentRunId >= 2147483640) {
      currentRunId = 1;
      visitedRun.fill(0);
      closedRun.fill(0);
    }
    const runId = currentRunId;

    sharedHeap.clear();

    const startIdx = sz * gridW + sx;
    const targetIdx = tz * gridW + tx;

    const startH = AStar.heuristic(sx, sz, tx, tz);
    gScores[startIdx] = 0;
    fScores[startIdx] = startH;
    parentIndices[startIdx] = -1;
    visitedRun[startIdx] = runId;

    sharedHeap.push(startIdx);

    const maxIterations = regionBounds ? 600 : 1000;
    let iterations = 0;

    const dirDx = [1, -1, 0, 0, 1, -1, 1, -1];
    const dirDz = [0, 0, 1, -1, 1, 1, -1, -1];
    const dirCost = [1.0, 1.0, 1.0, 1.0, 1.414, 1.414, 1.414, 1.414];

    while (sharedHeap.size > 0 && iterations++ < maxIterations) {
      const currentIdx = sharedHeap.pop();
      if (currentIdx === -1) break;

      if (currentIdx === targetIdx) {
        return AStar.reconstructFastPath(currentIdx, gridW);
      }

      closedRun[currentIdx] = runId;

      const cx = currentIdx % gridW;
      const cz = (currentIdx / gridW) | 0;
      const currentG = gScores[currentIdx];

      for (let i = 0; i < 8; i++) {
        const nx = cx + dirDx[i];
        const nz = cz + dirDz[i];

        if (regionBounds) {
          if (nx < regionBounds.minX || nx > regionBounds.maxX || nz < regionBounds.minZ || nz > regionBounds.maxZ) {
            continue;
          }
        }

        const neighborIdx = nz * gridW + nx;
        if (closedRun[neighborIdx] === runId) continue;

        const tile = grid.getTile(nx, nz);
        if (!tile || !grid.isWalkable(nx, nz)) continue;

        if (dirDx[i] !== 0 && dirDz[i] !== 0) {
          if (!grid.isWalkable(cx + dirDx[i], cz) || !grid.isWalkable(cx, cz + dirDz[i])) {
            continue;
          }
        }

        const moveCost = (tile.movementCost || 1.0) * dirCost[i];
        const tentativeG = currentG + moveCost;

        if (visitedRun[neighborIdx] !== runId) {
          visitedRun[neighborIdx] = runId;
          const h = AStar.heuristic(nx, nz, tx, tz);
          gScores[neighborIdx] = tentativeG;
          fScores[neighborIdx] = tentativeG + h;
          parentIndices[neighborIdx] = currentIdx;
          sharedHeap.push(neighborIdx);
        } else if (tentativeG < gScores[neighborIdx]) {
          const h = fScores[neighborIdx] - gScores[neighborIdx];
          gScores[neighborIdx] = tentativeG;
          fScores[neighborIdx] = tentativeG + h;
          parentIndices[neighborIdx] = currentIdx;
          sharedHeap.update(neighborIdx);
        }
      }
    }

    return null;
  }

  private static heuristic(x1: number, z1: number, x2: number, z2: number): number {
    const dx = Math.abs(x1 - x2);
    const dz = Math.abs(z1 - z2);
    return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz);
  }

  private static reconstructFastPath(endIdx: number, gridW: number): [number, number][] {
    const path: [number, number][] = [];
    let curr = endIdx;
    while (curr !== -1) {
      const px = curr % gridW;
      const pz = (curr / gridW) | 0;
      path.push([px, pz]);
      curr = parentIndices[curr];
    }
    path.reverse();
    return path;
  }
}
