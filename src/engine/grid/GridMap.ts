import { createNoise2D } from 'simplex-noise';
import type { TileData, TerrainType, SpawnPointData, ResourceDeposit } from '../../types/game';
import { getPresetSpawnPoints } from '../../constants/world';
import { isRoadOverlappingDeposit } from '../buildings/buildingValidation';
import { AStar } from '../pathfinding/AStar';

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GridMap {
  public readonly width: number;
  public readonly height: number;
  public tiles: TileData[][];
  public foliageCoords: number[] = [];
  public roadCoords: Set<number> = new Set<number>();
  public dirtyTerrainCoords: number[] = [];
  public isFullTerrainDirty: boolean = true;
  public dirtyFoliageBuckets: Set<number> = new Set<number>();
  public generationId: number = 0;

  public markFoliageBucketDirty(x: number, z: number): void {
    const cols = Math.ceil(this.width / 16);
    const rows = Math.ceil(this.height / 16);
    const bx = Math.min(cols - 1, Math.max(0, Math.floor(x / 16)));
    const bz = Math.min(rows - 1, Math.max(0, Math.floor(z / 16)));
    this.dirtyFoliageBuckets.add(bz * cols + bx);

    if (x % 16 <= 1 && bx > 0) this.dirtyFoliageBuckets.add(bz * cols + (bx - 1));
    if (x % 16 >= 14 && bx < cols - 1) this.dirtyFoliageBuckets.add(bz * cols + (bx + 1));
    if (z % 16 <= 1 && bz > 0) this.dirtyFoliageBuckets.add((bz - 1) * cols + bx);
    if (z % 16 >= 14 && bz < rows - 1) this.dirtyFoliageBuckets.add((bz + 1) * cols + bx);
  }

  public static getHighwayZ(x: number): number {
    return 184.0 + Math.sin((x - 192) * 0.035) * 3.0 + Math.sin((x - 96) * 0.08) * 1.5;
  }

  public static getNorthHighway1X(z: number): number {
    return 128.0 + Math.sin(z * 0.048) * 3.0 + Math.sin(z * 0.11) * 1.5;
  }

  public static getNorthHighway2X(z: number): number {
    return 256.0 + Math.sin(z * 0.048) * 3.0 + Math.sin(z * 0.11) * 1.5;
  }

  public static getSouthHighwayX(z: number): number {
    return 192.0 + Math.sin((z - 184) * 0.035) * 2.5 + Math.sin((z - 184) * 0.08) * 1.0;
  }

  public static getHighwayX(z: number): number {
    if (z >= 184) {
      return GridMap.getSouthHighwayX(z);
    }
    return 192.0;
  }

  public static isTradeHighwayTile(x: number, z: number): boolean {
    const mainZ = GridMap.getHighwayZ(x);

    if (Math.abs(z - mainZ) <= 0.90) return true;

    if (z <= mainZ + 1.5) {
      const n1X = GridMap.getNorthHighway1X(z);
      if (Math.abs(x - n1X) <= 0.90) return true;
    }

    if (z <= mainZ + 1.5) {
      const n2X = GridMap.getNorthHighway2X(z);
      if (Math.abs(x - n2X) <= 0.90) return true;
    }

    if (z >= mainZ - 1.5) {
      const sX = GridMap.getSouthHighwayX(z);
      if (Math.abs(x - sX) <= 0.90) return true;
    }

    const j1Z = GridMap.getHighwayZ(128);
    if (Math.hypot(x - 128.0, z - j1Z) <= 2.6) return true;

    const j2Z = GridMap.getHighwayZ(192);
    if (Math.hypot(x - 192.0, z - j2Z) <= 2.8) return true;

    const j3Z = GridMap.getHighwayZ(256);
    if (Math.hypot(x - 256.0, z - j3Z) <= 2.6) return true;

    return false;
  }

  public static getDistanceToHighway(x: number, z: number): number {
    const mainZ = GridMap.getHighwayZ(x);
    let minDist = Math.abs(z - mainZ);

    if (z <= mainZ + 2.0) {
      const n1X = GridMap.getNorthHighway1X(z);
      minDist = Math.min(minDist, Math.abs(x - n1X));
      const n2X = GridMap.getNorthHighway2X(z);
      minDist = Math.min(minDist, Math.abs(x - n2X));
    }

    if (z >= mainZ - 2.0) {
      const sX = GridMap.getSouthHighwayX(z);
      minDist = Math.min(minDist, Math.abs(x - sX));
    }

    const j1Z = GridMap.getHighwayZ(128);
    minDist = Math.min(minDist, Math.hypot(x - 128.0, z - j1Z));

    const j2Z = GridMap.getHighwayZ(192);
    minDist = Math.min(minDist, Math.hypot(x - 192.0, z - j2Z));

    const j3Z = GridMap.getHighwayZ(256);
    minDist = Math.min(minDist, Math.hypot(x - 256.0, z - j3Z));

    return minDist;
  }

  public static getClosestHighwayTile(x: number, z: number): [number, number] {
    const mainZ = GridMap.getHighwayZ(x);
    let bestDist = Math.hypot(0, z - mainZ);
    let bestPt: [number, number] = [Math.round(x), Math.round(mainZ)];

    if (z <= mainZ + 2.0) {
      const n1X = GridMap.getNorthHighway1X(z);
      const d1 = Math.hypot(x - n1X, 0);
      if (d1 < bestDist) {
        bestDist = d1;
        bestPt = [Math.round(n1X), Math.round(z)];
      }

      const n2X = GridMap.getNorthHighway2X(z);
      const d2 = Math.hypot(x - n2X, 0);
      if (d2 < bestDist) {
        bestDist = d2;
        bestPt = [Math.round(n2X), Math.round(z)];
      }
    }

    if (z >= mainZ - 2.0) {
      const sX = GridMap.getSouthHighwayX(z);
      const dS = Math.hypot(x - sX, 0);
      if (dS < bestDist) {
        bestDist = dS;
        bestPt = [Math.round(sX), Math.round(z)];
      }
    }

    const j1Z = GridMap.getHighwayZ(128);
    const dJ1 = Math.hypot(x - 128, z - j1Z);
    if (dJ1 < bestDist) {
      bestDist = dJ1;
      bestPt = [128, Math.round(j1Z)];
    }

    const j2Z = GridMap.getHighwayZ(192);
    const dJ2 = Math.hypot(x - 192, z - j2Z);
    if (dJ2 < bestDist) {
      bestDist = dJ2;
      bestPt = [192, Math.round(j2Z)];
    }

    const j3Z = GridMap.getHighwayZ(256);
    const dJ3 = Math.hypot(x - 256, z - j3Z);
    if (dJ3 < bestDist) {
      bestDist = dJ3;
      bestPt = [256, Math.round(j3Z)];
    }

    return bestPt;
  }

  public static getClosestHighwayTileForRegion(x: number, z: number, regionId: number): [number, number] {

    if (regionId === 2) {
      const clampedZ = Math.max(232, Math.min(381, Math.round(z)));
      const hwX = Math.round(GridMap.getSouthHighwayX(clampedZ));
      return [hwX, clampedZ];
    }

    if (regionId === 3) {
      const clampedZ = Math.max(232, Math.min(381, Math.round(z)));
      const hwX = Math.round(GridMap.getSouthHighwayX(clampedZ));
      return [hwX, clampedZ];
    }

    if (regionId === 0) {
      const clampedZ = Math.max(2, Math.min(183, Math.round(z)));
      const eastHwX = Math.round(GridMap.getNorthHighway1X(clampedZ));
      const distToEast = Math.abs(x - eastHwX);

      const clampedX = Math.max(2, Math.min(127, Math.round(x)));
      const southHwZ = Math.round(GridMap.getHighwayZ(clampedX));
      const distToSouth = Math.abs(z - southHwZ);

      if (distToEast <= distToSouth) {
        return [eastHwX, clampedZ];
      } else {
        return [clampedX, southHwZ];
      }
    }

    if (regionId === 1) {
      const clampedZ = Math.max(2, Math.min(183, Math.round(z)));
      const westHwX = Math.round(GridMap.getNorthHighway2X(clampedZ));
      const distToWest = Math.abs(x - westHwX);

      const clampedX = Math.max(256, Math.min(381, Math.round(x)));
      const southHwZ = Math.round(GridMap.getHighwayZ(clampedX));
      const distToSouth = Math.abs(z - southHwZ);

      if (distToWest <= distToSouth) {
        return [westHwX, clampedZ];
      } else {
        return [clampedX, southHwZ];
      }
    }

    if (regionId === 4) {
      const clampedX = Math.max(128, Math.min(255, Math.round(x)));
      const southHwZ = Math.round(GridMap.getHighwayZ(clampedX));
      return [clampedX, southHwZ];
    }

    return GridMap.getClosestHighwayTile(x, z);
  }

  public static getRegionIdForCoord(x: number, z: number): number {

    if (z >= 184 && z <= 231) {
      return 5;
    }

    if (z < 184) {
      if (x <= 127) return 0;
      if (x <= 255) return 4;
      return 1;
    }

    if (x <= 191) return 2;
    return 3;
  }

  public static isCoordInRegion(regionId: number, x: number, z: number, highwayBuffer: number = 0): boolean {
    if (x < highwayBuffer || x > 383 - highwayBuffer || z < highwayBuffer || z > 383 - highwayBuffer) {
      return false;
    }

    switch (regionId) {
      case 0:
        return x >= highwayBuffer && x <= 127 - highwayBuffer && z >= highwayBuffer && z <= 183 - highwayBuffer;
      case 1:
        return x >= 256 + highwayBuffer && x <= 383 - highwayBuffer && z >= highwayBuffer && z <= 183 - highwayBuffer;
      case 2:
        return x >= highwayBuffer && x <= 191 - highwayBuffer && z >= 232 + highwayBuffer && z <= 383 - highwayBuffer;
      case 3:
        return x >= 192 + highwayBuffer && x <= 383 - highwayBuffer && z >= 232 + highwayBuffer && z <= 383 - highwayBuffer;
      case 4:
        return x >= 128 + highwayBuffer && x <= 255 - highwayBuffer && z >= highwayBuffer && z <= 183 - highwayBuffer;
      case 5:
        return x >= highwayBuffer && x <= 383 - highwayBuffer && z >= 184 + highwayBuffer && z <= 231 - highwayBuffer;
      default:
        return false;
    }
  }

  public static canRegionConnectToHighwayAt(regionId: number, x: number, z: number): boolean {
    if (x < 1 || x > 382 || z < 1 || z > 382) return false;

    if (GridMap.isCoordInRegion(regionId, x, z, 0)) return true;

    switch (regionId) {
      case 0:

        if (x >= 2 && x <= 127 && z >= 184 && z <= 188) return true;

        if (z >= 2 && z <= 183 && x >= 128 && x <= 132) return true;
        break;

      case 1:

        if (x >= 256 && x <= 381 && z >= 184 && z <= 188) return true;

        if (z >= 2 && z <= 183 && x >= 252 && x <= 255) return true;
        break;

      case 2:

        if (z >= 232 && z <= 381 && x >= 192 && x <= 196) return true;
        break;

      case 3:

        if (z >= 232 && z <= 381 && x >= 188 && x <= 191) return true;
        break;

      case 4:

        if (x >= 128 && x <= 255 && z >= 184 && z <= 188) return true;

        if (z >= 2 && z <= 183 && x >= 124 && x <= 127) return true;

        if (z >= 2 && z <= 183 && x >= 256 && x <= 260) return true;
        break;

      case 5:
        if (z >= 182 && z <= 233) return true;
        break;
    }

    if (GridMap.isTradeHighwayTile(x, z)) return true;

    return false;
  }

  public static isBuildingInRegion(
    regionId: number,
    bx: number,
    bz: number,
    width: number,
    height: number,
    highwayBuffer: number = 0
  ): boolean {
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < height; dz++) {
        if (!GridMap.isCoordInRegion(regionId, bx + dx, bz + dz, highwayBuffer)) {
          return false;
        }
      }
    }
    return true;
  }

  constructor(width = 384, height = 384, seed = 1234.56) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.generate(seed);
  }

  public static getPresetSpawnPoints(regionId: number): SpawnPointData[] {
    return getPresetSpawnPoints(regionId);
  }

  public generate(seed: number): void {
    const prng1 = mulberry32(Math.floor(seed * 100000));
    const prng2 = mulberry32(Math.floor(seed * 100000) + 4321);

    const lakeNoise = createNoise2D(prng1);
    const foliageNoise = createNoise2D(prng2);

    this.generationId = (this.generationId || 0) + 1;
    this.isFullTerrainDirty = true;
    this.dirtyTerrainCoords = [];
    this.dirtyFoliageBuckets.clear();
    this.tiles = [];
    this.roadCoords.clear();

    const lake1X = 72;
    const lake1Z = 70;
    const lake1Radius = 3.8;

    const lake2X = 60;
    const lake2Z = 195;
    const lake2Radius = 4.2;

    const lake3X = 320;
    const lake3Z = 72;
    const lake3Radius = 3.5;

    const lake4X = 192;
    const lake4Z = 50;
    const lake4Radius = 3.2;

    for (let x = 0; x < this.width; x++) {
      this.tiles[x] = [];
      for (let z = 0; z < this.height; z++) {
        const nx = x / this.width;
        const nz = z / this.height;

        const dx1 = (x - lake1X) * 0.90 + (z - lake1Z) * 0.35;
        const dz1 = -(x - lake1X) * 0.35 + (z - lake1Z) * 0.90;
        const dist1 = Math.hypot(dx1, dz1);
        const perturb1 = lakeNoise(nx * 14.0, nz * 14.0) * 1.1;
        const isLake1 = (dist1 + perturb1) < lake1Radius;
        const isLake1Shore = !isLake1 && (dist1 + perturb1) < (lake1Radius + 1.6);

        const dx2 = x - lake2X;
        const dz2 = (z - lake2Z) - Math.sin((x - lake2X) * 0.40) * 1.1;
        const dist2 = Math.hypot(dx2, dz2);
        const perturb2 = lakeNoise(nx * 13.0 + 20.0, nz * 13.0 + 20.0) * 1.2;
        const isLake2 = (dist2 + perturb2) < lake2Radius;
        const isLake2Shore = !isLake2 && (dist2 + perturb2) < (lake2Radius + 1.8);

        const dx3 = x - lake3X;
        const dz3 = z - lake3Z;
        const dist3 = Math.hypot(dx3, dz3);
        const perturb3 = lakeNoise(nx * 15.0 + 40.0, nz * 15.0 + 40.0) * 1.1;
        const isLake3 = (dist3 + perturb3) < lake3Radius;
        const isLake3Shore = !isLake3 && (dist3 + perturb3) < (lake3Radius + 1.6);

        const dx4 = x - lake4X;
        const dz4 = z - lake4Z;
        const dist4 = Math.hypot(dx4, dz4);
        const perturb4 = lakeNoise(nx * 16.0 + 60.0, nz * 16.0 + 60.0) * 1.1;
        const isLake4 = (dist4 + perturb4) < lake4Radius;
        const isLake4Shore = !isLake4 && (dist4 + perturb4) < (lake4Radius + 1.5);

        const isLake = isLake1 || isLake2 || isLake3 || isLake4;
        const isLakeShore = !isLake && (isLake1Shore || isLake2Shore || isLake3Shore || isLake4Shore);

        const isTradeHighway = GridMap.isTradeHighwayTile(x, z);

        const regId = GridMap.getRegionIdForCoord(x, z);

        const oct1 = foliageNoise(nx * 4.6, nz * 4.6);
        const oct2 = foliageNoise(nx * 9.8 + 14.2, nz * 9.8 + 26.5) * 0.42;
        const macroDensity = oct1 + oct2;

        const microRand1 = ((Math.sin(x * 127.1 + z * 311.7) * 43758.5453) % 1 + 1) % 1;
        const microRand2 = ((Math.sin(x * 269.5 + z * 183.3) * 23421.631) % 1 + 1) % 1;

        let terrain: TerrainType = 'grass';
        let isPassable = true;
        let movementCost = 1.0;
        let fertility = 0.65;
        let foliageType: 'tree' | 'rock' | 'bush' | 'wheat_crop' | undefined;
        let tileHeight = 0.05;

        if (isLake) {
          terrain = 'water';
          isPassable = false;
          movementCost = Infinity;
          fertility = 0;
          tileHeight = -0.18;
          foliageType = undefined;
        } else if (isLakeShore) {
          terrain = 'fertile_soil';
          fertility = 0.95;
          movementCost = 1.1;
          tileHeight = -0.04;
          foliageType = undefined;
        } else if (isTradeHighway) {
          terrain = 'road';
          this.roadCoords.add(x * this.width + z);
          fertility = 0.1;
          movementCost = 0.55;
          tileHeight = 0.05;
          isPassable = true;
          foliageType = undefined;
        } else {
          terrain = 'grass';

          if (regId === 0) {
            fertility = 0.78;
          } else if (regId === 1) {
            fertility = 0.62;
          } else if (regId === 2) {
            fertility = 0.74;
          } else if (regId === 3) {
            fertility = 0.48;
          } else if (regId === 4) {
            fertility = 0.68;
          } else {
            fertility = 0.60;
          }

          tileHeight = 0.05;

          const forestThreshold = regId === 0 ? 0.01 : (regId === 1 || regId === 4 ? -0.18 : (regId === 2 ? -0.08 : -0.04));

          const isDenseTree = macroDensity > (forestThreshold + 0.10) && microRand1 < 0.56;
          const isMediumTree = macroDensity > forestThreshold && macroDensity <= (forestThreshold + 0.10) && microRand1 < 0.36;
          const isSolitaryTree = macroDensity <= forestThreshold && microRand1 < 0.085;

          const isRockZone = regId === 3
            ? (macroDensity < -0.38 && microRand2 < 0.06)
            : (macroDensity < -0.55 && microRand2 < 0.012);

          if (isDenseTree || isMediumTree || isSolitaryTree) {
            foliageType = 'tree';
            isPassable = false;
            movementCost = Infinity;
          } else if (isRockZone) {
            foliageType = 'rock';
            isPassable = false;
            movementCost = Infinity;
          } else if (macroDensity > -0.20 && macroDensity < 0.45 && microRand2 > 0.50) {
            foliageType = 'bush';
          }
        }

        this.tiles[x][z] = {
          x,
          z,
          terrain,
          height: tileHeight,
          fertility,
          isPassable,
          movementCost,
          foliageType,
        };
      }
    }

    for (let rId = 0; rId < 6; rId++) {
      const spawns = GridMap.getPresetSpawnPoints(rId);
      for (const sp of spawns) {
        const [sx, sz] = sp.position;
        for (let px = sx - 4; px <= sx + 4; px++) {
          for (let pz = sz - 3; pz <= sz + 3; pz++) {
            const tile = this.getTile(px, pz);
            if (tile && tile.terrain !== 'water') {
              tile.terrain = 'grass';
              tile.isPassable = true;
              tile.movementCost = 1.0;
              tile.height = 0.05;
              tile.foliageType = undefined;
            }
          }
        }
      }
    }

    this.refreshFoliageCoords();
  }

  public refreshFoliageCoords(): void {
    this.foliageCoords = [];
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.height; z++) {
        if (this.tiles[x][z].foliageType) {
          this.foliageCoords.push(x, z);
        }
      }
    }
  }

  public getTile(x: number, z: number): TileData | null {
    if (x < 0 || x >= this.width || z < 0 || z >= this.height) {
      return null;
    }
    return this.tiles[Math.floor(x)][Math.floor(z)];
  }

  public isWalkable(x: number, z: number): boolean {
    const tile = this.getTile(x, z);
    return tile ? tile.isPassable : false;
  }

  public getMovementCost(x: number, z: number): number {
    const tile = this.getTile(x, z);
    return tile ? tile.movementCost : Infinity;
  }

  public canPlaceBuilding(x: number, z: number, width: number, height: number): boolean {
    if (x < 0 || z < 0 || x + width > this.width || z + height > this.height) {
      return false;
    }
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < height; dz++) {
        const tile = this.getTile(x + dx, z + dz);
        if (!tile || tile.buildingId || tile.terrain === 'water' || tile.terrain === 'road') {
          return false;
        }
      }
    }
    return true;
  }

  public canBuildAt(x: number, z: number, width: number, height: number): boolean {
    return this.canPlaceBuilding(x, z, width, height);
  }

  public removeFoliageFromCoords(minX: number, maxX: number, minZ: number, maxZ: number): void {
    if (!this.foliageCoords || this.foliageCoords.length === 0) return;
    const newCoords: number[] = [];
    const coords = this.foliageCoords;
    for (let i = 0; i < coords.length; i += 2) {
      const cx = coords[i];
      const cz = coords[i + 1];
      if (cx >= minX && cx <= maxX && cz >= minZ && cz <= maxZ) {
        continue;
      }
      newCoords.push(cx, cz);
    }
    this.foliageCoords = newCoords;
  }

  public occupyForBuilding(
    x: number,
    z: number,
    width: number,
    height: number,
    buildingId: string
  ): number {
    let maxH = -Infinity;
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < height; dz++) {
        const t = this.getTile(x + dx, z + dz);
        if (t) {
          maxH = Math.max(maxH, t.height);
        }
      }
    }
    if (maxH === -Infinity) maxH = 0.05;

    const clearPad = 2;
    for (let tx = x - clearPad; tx < x + width + clearPad; tx++) {
      for (let tz = z - clearPad; tz < z + height + clearPad; tz++) {
        const tile = this.getTile(tx, tz);
        if (tile) {
          tile.foliageType = undefined;
          tile.foliageAngle = undefined;
          tile.foliageTreeType = undefined;
          this.markFoliageBucketDirty(tx, tz);
          if (tile.terrain !== 'water' && !tile.buildingId) {
            tile.isPassable = true;
            tile.movementCost = 1.0;
          }
          if (tx >= x && tx < x + width && tz >= z && tz < z + height) {
            tile.height = maxH;
          }
        }
      }
    }

    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < height; dz++) {
        const tx = x + dx;
        const tz = z + dz;
        const tile = this.getTile(tx, tz);
        if (tile) {
          tile.buildingId = buildingId;
          tile.isPassable = false;
          tile.movementCost = Infinity;
          if (tile.terrain === 'road') {
            tile.terrain = 'grass';
            this.roadCoords.delete(tx * this.width + tz);
            this.dirtyTerrainCoords.push(tx, tz);
          }
        }
      }
    }

    this.removeFoliageFromCoords(x - clearPad, x + width + clearPad - 1, z - clearPad, z + height + clearPad - 1);
    AStar.clearUnreachableCache();
    return maxH;
  }

  public occupyTilesForBuilding(tiles: [number, number][], buildingId: string): number {
    let maxH = -Infinity;
    for (const [tx, tz] of tiles) {
      const t = this.getTile(tx, tz);
      if (t) {
        maxH = Math.max(maxH, t.height);
      }
    }
    if (maxH === -Infinity) maxH = 0.05;

    const clearPad = 2;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [tx, tz] of tiles) {
      minX = Math.min(minX, tx);
      maxX = Math.max(maxX, tx);
      minZ = Math.min(minZ, tz);
      maxZ = Math.max(maxZ, tz);

      for (let dx = -clearPad; dx <= clearPad; dx++) {
        for (let dz = -clearPad; dz <= clearPad; dz++) {
          const nx = tx + dx;
          const nz = tz + dz;
          const tile = this.getTile(nx, nz);
          if (tile) {
            tile.foliageType = undefined;
            tile.foliageAngle = undefined;
            tile.foliageTreeType = undefined;
            this.markFoliageBucketDirty(nx, nz);
            if (tile.terrain !== 'water' && !tile.buildingId) {
              tile.isPassable = true;
              tile.movementCost = 1.0;
            }
          }
        }
      }
    }

    for (const [tx, tz] of tiles) {
      const tile = this.getTile(tx, tz);
      if (tile) {
        tile.buildingId = buildingId;
        tile.isPassable = false;
        tile.movementCost = Infinity;
        tile.height = maxH;
        if (tile.terrain === 'road') {
          tile.terrain = 'grass';
          this.roadCoords.delete(tx * this.width + tz);
          this.dirtyTerrainCoords.push(tx, tz);
        }
      }
    }

    if (minX !== Infinity) {
      this.removeFoliageFromCoords(minX - clearPad, maxX + clearPad, minZ - clearPad, maxZ + clearPad);
    }
    AStar.clearUnreachableCache();
    return maxH;
  }

  public clearOccupiedTiles(tiles: [number, number][]): void {
    for (const [tx, tz] of tiles) {
      const tile = this.getTile(tx, tz);
      if (tile) {
        tile.buildingId = undefined;
        tile.isPassable = tile.terrain !== 'water';
        tile.movementCost = tile.terrain === 'water' ? Infinity : 1.0;
      }
    }
    AStar.clearUnreachableCache();
  }

  public clearBuilding(x: number, z: number, width: number, height: number): void {
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < height; dz++) {
        const tx = x + dx;
        const tz = z + dz;
        const tile = this.getTile(tx, tz);
        if (tile) {
          tile.buildingId = undefined;
          tile.isPassable = tile.terrain !== 'water';
          tile.movementCost = tile.terrain === 'water' ? Infinity : 1.0;
        }
      }
    }
    AStar.clearUnreachableCache();
  }

  public setFoliage(
    x: number,
    z: number,
    type: 'tree' | 'fallen_tree' | 'rock' | 'bush' | 'wheat_crop',
    angle?: number,
    treeType?: 'pine' | 'oak' | 'autumn'
  ): void {
    const tile = this.getTile(x, z);
    if (tile) {
      if (!tile.foliageType) {
        this.foliageCoords.push(x, z);
      }
      tile.foliageType = type;
      if (angle !== undefined) tile.foliageAngle = angle;
      if (treeType !== undefined) tile.foliageTreeType = treeType;
      if (type === 'tree' || type === 'rock') {
        tile.isPassable = false;
        tile.movementCost = Infinity;
      } else if (type === 'fallen_tree') {
        tile.isPassable = true;
        tile.movementCost = 1.2;
      }
      this.markFoliageBucketDirty(x, z);
    }
  }

  public removeFoliage(x: number, z: number): void {
    const tile = this.getTile(x, z);
    if (tile && tile.foliageType) {
      tile.foliageType = undefined;
      tile.foliageAngle = undefined;
      tile.foliageTreeType = undefined;
      tile.isPassable = tile.terrain !== 'water';
      tile.movementCost = 1.0;
      this.removeFoliageFromCoords(x, x, z, z);
      this.markFoliageBucketDirty(x, z);
    }
  }

  public paveRoad(x: number, z: number, resourceDeposits?: ResourceDeposit[]): boolean {
    const tile = this.getTile(x, z);
    if (!tile || tile.terrain === 'water' || tile.buildingId) return false;
    if (tile.terrain === 'road') return false;

    if (resourceDeposits && resourceDeposits.length > 0) {
      if (isRoadOverlappingDeposit(x, z, resourceDeposits)) {
        return false;
      }
    }

    tile.foliageType = undefined;
    tile.foliageAngle = undefined;
    tile.foliageTreeType = undefined;
    this.removeFoliageFromCoords(x, x, z, z);
    this.markFoliageBucketDirty(x, z);

    tile.terrain = 'road';
    this.roadCoords.add(x * this.width + z);
    tile.isPassable = true;
    tile.movementCost = 0.55;
    this.dirtyTerrainCoords.push(x, z);
    AStar.clearUnreachableCache();
    return true;
  }

  public removeRoad(x: number, z: number): boolean {
    const tile = this.getTile(x, z);
    if (!tile || tile.terrain !== 'road') return false;
    tile.terrain = 'grass';
    this.roadCoords.delete(x * this.width + z);
    tile.movementCost = 1.0;
    this.dirtyTerrainCoords.push(x, z);
    AStar.clearUnreachableCache();
    return true;
  }

  public clearAllRoads(): void {
    this.roadCoords.clear();
    this.dirtyTerrainCoords = [];
    this.isFullTerrainDirty = true;
    AStar.clearUnreachableCache();
  }

  public getNeighbors(x: number, z: number): TileData[] {
    const neighbors: TileData[] = [];
    const offsets = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    for (const [dx, dz] of offsets) {
      const tile = this.getTile(x + dx, z + dz);
      if (tile) neighbors.push(tile);
    }
    return neighbors;
  }

  public syncToDataTexture(texture: { image?: { data?: any } | null; needsUpdate?: boolean }): void {
    const data = texture.image?.data;
    if (!data) return;
    const w = this.width;
    const h = this.height;
    for (let z = 0; z < h; z++) {
      for (let x = 0; x < w; x++) {
        const tile = this.tiles[x]?.[z];
        const t = tile?.terrain || 'grass';
        const idx = (z * w + x) * 4;
        data[idx] = (t === 'fertile_soil' || t === 'mud') ? 255 : 0;
        data[idx + 1] = (t === 'water') ? 255 : 0;
        data[idx + 2] = (t === 'stone') ? 255 : 0;
        data[idx + 3] = (t === 'road') ? 255 : 0;
      }
    }
    this.isFullTerrainDirty = false;
    this.dirtyTerrainCoords.length = 0;
    if (texture.needsUpdate !== undefined) {
      texture.needsUpdate = true;
    }
  }
}
