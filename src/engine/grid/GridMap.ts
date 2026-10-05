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

  public markFoliageBucketDirty(x: number, z: number): void {
    const cols = Math.ceil(this.width / 16);
    const bx = Math.min(cols - 1, Math.max(0, Math.floor(x / 16)));
    const bz = Math.min(Math.ceil(this.height / 16) - 1, Math.max(0, Math.floor(z / 16)));
    this.dirtyFoliageBuckets.add(bz * cols + bx);
  }

  public static getHighwayX(z: number): number {
    return 127.5 + Math.sin((z - 128) * 0.042) * 7.5 + Math.sin((z - 128) * 0.095) * 3.5;
  }

  public static getHighwayZ(x: number): number {
    return 127.5 + Math.sin((x - 128) * 0.045) * 7.0 + Math.sin((x - 128) * 0.11) * 3.0;
  }

  public static isTradeHighwayTile(x: number, z: number): boolean {
    const roadX = GridMap.getHighwayX(z);
    const distRoadX = Math.abs(x - roadX);
    const roadZ = GridMap.getHighwayZ(x);
    const distRoadZ = Math.abs(z - roadZ);
    const distPlaza = Math.hypot(x - 127.5, z - 127.5);
    return distRoadX <= 0.90 || distRoadZ <= 0.90 || distPlaza <= 2.8;
  }

  public static getDistanceToHighway(x: number, z: number): number {
    const roadX = GridMap.getHighwayX(z);
    const distRoadX = Math.abs(x - roadX);
    const roadZ = GridMap.getHighwayZ(x);
    const distRoadZ = Math.abs(z - roadZ);
    const distPlaza = Math.hypot(x - 127.5, z - 127.5);
    return Math.min(distRoadX, distRoadZ, distPlaza);
  }

  public static getRegionIdForCoord(x: number, z: number): number {
    const hwX = GridMap.getHighwayX(z);
    const hwZ = GridMap.getHighwayZ(x);
    const isEast = x >= hwX;
    const isSouth = z >= hwZ;
    if (!isEast && !isSouth) return 0;
    if (isEast && !isSouth) return 1;
    if (!isEast && isSouth) return 2;
    return 3;
  }

  public static isCoordInRegion(regionId: number, x: number, z: number, highwayBuffer: number = 0): boolean {
    if (x < 2 + highwayBuffer || x > 253 - highwayBuffer || z < 2 + highwayBuffer || z > 253 - highwayBuffer) {
      return false;
    }

    const hwX = GridMap.getHighwayX(z);
    const hwZ = GridMap.getHighwayZ(x);
    const distPlaza = Math.hypot(x - 127.5, z - 127.5);

    if (distPlaza < 3.2 + highwayBuffer) {
      return false;
    }

    switch (regionId) {
      case 0:
        return x <= hwX - highwayBuffer && z <= hwZ - highwayBuffer;
      case 1:
        return x >= hwX + highwayBuffer && z <= hwZ - highwayBuffer;
      case 2:
        return x <= hwX - highwayBuffer && z >= hwZ + highwayBuffer;
      case 3:
        return x >= hwX + highwayBuffer && z >= hwZ + highwayBuffer;
      default:
        return false;
    }
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

  constructor(width = 256, height = 256, seed = 1234.56) {
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

    this.isFullTerrainDirty = true;
    this.dirtyTerrainCoords = [];
    this.tiles = [];
    this.roadCoords.clear();

    const lake1X = 72;
    const lake1Z = 70;
    const lake1Radius = 3.8;

    const lake2X = 60;
    const lake2Z = 195;
    const lake2Radius = 4.2;

    const lake3X = 186;
    const lake3Z = 72;
    const lake3Radius = 3.5;

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

        const isLake = isLake1 || isLake2 || isLake3;
        const isLakeShore = !isLake && (isLake1Shore || isLake2Shore || isLake3Shore);

        const roadX = GridMap.getHighwayX(z);
        const distRoadX = Math.abs(x - roadX);
        const roadZ = GridMap.getHighwayZ(x);
        const distRoadZ = Math.abs(z - roadZ);
        const distPlaza = Math.hypot(x - 127.5, z - 127.5);
        const isTradeHighway = distRoadX <= 0.90 || distRoadZ <= 0.90 || distPlaza <= 2.8;

        const isNW = x < 128 && z < 128;
        const isNE = x >= 128 && z < 128;
        const isSW = x < 128 && z >= 128;
        const isSE = x >= 128 && z >= 128;

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

          if (isNW) {
            fertility = 0.78;
          } else if (isNE) {
            fertility = 0.62;
          } else if (isSW) {
            fertility = 0.74;
          } else if (isSE) {
            fertility = 0.48;
          }

          tileHeight = 0.05;

          const forestThreshold = isNW ? 0.01 : (isNE ? -0.18 : (isSW ? -0.08 : -0.04));

          const isDenseTree = macroDensity > (forestThreshold + 0.10) && microRand1 < 0.56;
          const isMediumTree = macroDensity > forestThreshold && macroDensity <= (forestThreshold + 0.10) && microRand1 < 0.36;
          const isSolitaryTree = macroDensity <= forestThreshold && microRand1 < 0.085;

          const isRockZone = isSE
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

    for (let rId = 0; rId < 4; rId++) {
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

    if (tile.foliageType) {
      tile.foliageType = undefined;
      tile.foliageAngle = undefined;
      tile.foliageTreeType = undefined;
      this.removeFoliageFromCoords(x, x, z, z);
      this.markFoliageBucketDirty(x, z);
    }

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

