import { TERRAIN, REGION_TERRAIN, LAKES } from '../../constants/terrain';
import { REGION, REGION_BOUNDS, HIGHWAYS, HIGHWAY_ACCESS, FOLIAGE_BUCKET_SIZE } from '../../constants/worldLayout';
import { MAP_WIDTH, MAP_HEIGHT, DEFAULT_MAP_SEED } from '../../constants/world';
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
    const cols = Math.ceil(this.width / FOLIAGE_BUCKET_SIZE);
    const rows = Math.ceil(this.height / FOLIAGE_BUCKET_SIZE);
    const bx = Math.min(cols - 1, Math.max(0, Math.floor(x / FOLIAGE_BUCKET_SIZE)));
    const bz = Math.min(rows - 1, Math.max(0, Math.floor(z / FOLIAGE_BUCKET_SIZE)));
    this.dirtyFoliageBuckets.add(bz * cols + bx);

    if (x % FOLIAGE_BUCKET_SIZE <= 1 && bx > 0) this.dirtyFoliageBuckets.add(bz * cols + (bx - 1));
    if (x % FOLIAGE_BUCKET_SIZE >= FOLIAGE_BUCKET_SIZE - 2 && bx < cols - 1) this.dirtyFoliageBuckets.add(bz * cols + (bx + 1));
    if (z % FOLIAGE_BUCKET_SIZE <= 1 && bz > 0) this.dirtyFoliageBuckets.add((bz - 1) * cols + bx);
    if (z % FOLIAGE_BUCKET_SIZE >= FOLIAGE_BUCKET_SIZE - 2 && bz < rows - 1) this.dirtyFoliageBuckets.add((bz + 1) * cols + bx);
  }

  public static getHighwayZ(x: number): number {
    const wave = HIGHWAYS.mainWave;
    return HIGHWAYS.mainZ + Math.sin((x - wave.phaseX) * wave.frequency) * wave.amplitude +
      Math.sin((x - wave.secondaryPhaseX) * wave.secondaryFrequency) * wave.secondaryAmplitude;
  }

  public static getNorthHighway1X(z: number): number {
    const wave = HIGHWAYS.northWave;
    return HIGHWAYS.westJunctionX + Math.sin(z * wave.frequency) * wave.amplitude + Math.sin(z * wave.secondaryFrequency) * wave.secondaryAmplitude;
  }

  public static getNorthHighway2X(z: number): number {
    const wave = HIGHWAYS.northWave;
    return HIGHWAYS.eastJunctionX + Math.sin(z * wave.frequency) * wave.amplitude + Math.sin(z * wave.secondaryFrequency) * wave.secondaryAmplitude;
  }

  public static getSouthHighwayX(z: number): number {
    const wave = HIGHWAYS.southWave;
    return HIGHWAYS.centralJunctionX + Math.sin((z - wave.phaseZ) * wave.frequency) * wave.amplitude +
      Math.sin((z - wave.phaseZ) * wave.secondaryFrequency) * wave.secondaryAmplitude;
  }

  public static getHighwayX(z: number): number {
    if (z >= HIGHWAYS.mainZ) {
      return GridMap.getSouthHighwayX(z);
    }
    return HIGHWAYS.centralJunctionX;
  }

  public static isTradeHighwayTile(x: number, z: number): boolean {
    const mainZ = GridMap.getHighwayZ(x);

    if (Math.abs(z - mainZ) <= HIGHWAYS.halfWidth) return true;

    if (z <= mainZ + HIGHWAYS.branchOverlap) {
      const n1X = GridMap.getNorthHighway1X(z);
      if (Math.abs(x - n1X) <= HIGHWAYS.halfWidth) return true;
    }

    if (z <= mainZ + HIGHWAYS.branchOverlap) {
      const n2X = GridMap.getNorthHighway2X(z);
      if (Math.abs(x - n2X) <= HIGHWAYS.halfWidth) return true;
    }

    if (z >= mainZ - HIGHWAYS.branchOverlap) {
      const sX = GridMap.getSouthHighwayX(z);
      if (Math.abs(x - sX) <= HIGHWAYS.halfWidth) return true;
    }

    const j1Z = GridMap.getHighwayZ(HIGHWAYS.westJunctionX);
    if (Math.hypot(x - HIGHWAYS.westJunctionX, z - j1Z) <= HIGHWAYS.junctionRadius) return true;

    const j2Z = GridMap.getHighwayZ(HIGHWAYS.centralJunctionX);
    if (Math.hypot(x - HIGHWAYS.centralJunctionX, z - j2Z) <= HIGHWAYS.centralJunctionRadius) return true;

    const j3Z = GridMap.getHighwayZ(HIGHWAYS.eastJunctionX);
    if (Math.hypot(x - HIGHWAYS.eastJunctionX, z - j3Z) <= HIGHWAYS.junctionRadius) return true;

    return false;
  }

  public static getDistanceToHighway(x: number, z: number): number {
    const mainZ = GridMap.getHighwayZ(x);
    let minDist = Math.abs(z - mainZ);

    if (z <= mainZ + HIGHWAYS.nearestBranchOverlap) {
      const n1X = GridMap.getNorthHighway1X(z);
      minDist = Math.min(minDist, Math.abs(x - n1X));
      const n2X = GridMap.getNorthHighway2X(z);
      minDist = Math.min(minDist, Math.abs(x - n2X));
    }

    if (z >= mainZ - HIGHWAYS.nearestBranchOverlap) {
      const sX = GridMap.getSouthHighwayX(z);
      minDist = Math.min(minDist, Math.abs(x - sX));
    }

    const j1Z = GridMap.getHighwayZ(HIGHWAYS.westJunctionX);
    minDist = Math.min(minDist, Math.hypot(x - HIGHWAYS.westJunctionX, z - j1Z));

    const j2Z = GridMap.getHighwayZ(HIGHWAYS.centralJunctionX);
    minDist = Math.min(minDist, Math.hypot(x - HIGHWAYS.centralJunctionX, z - j2Z));

    const j3Z = GridMap.getHighwayZ(HIGHWAYS.eastJunctionX);
    minDist = Math.min(minDist, Math.hypot(x - HIGHWAYS.eastJunctionX, z - j3Z));

    return minDist;
  }

  public static getClosestHighwayTile(x: number, z: number): [number, number] {
    const mainZ = GridMap.getHighwayZ(x);
    let bestDist = Math.hypot(0, z - mainZ);
    let bestPt: [number, number] = [Math.round(x), Math.round(mainZ)];

    if (z <= mainZ + HIGHWAYS.nearestBranchOverlap) {
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

    if (z >= mainZ - HIGHWAYS.nearestBranchOverlap) {
      const sX = GridMap.getSouthHighwayX(z);
      const dS = Math.hypot(x - sX, 0);
      if (dS < bestDist) {
        bestDist = dS;
        bestPt = [Math.round(sX), Math.round(z)];
      }
    }

    const j1Z = GridMap.getHighwayZ(HIGHWAYS.westJunctionX);
    const dJ1 = Math.hypot(x - HIGHWAYS.westJunctionX, z - j1Z);
    if (dJ1 < bestDist) {
      bestDist = dJ1;
      bestPt = [HIGHWAYS.westJunctionX, Math.round(j1Z)];
    }

    const j2Z = GridMap.getHighwayZ(HIGHWAYS.centralJunctionX);
    const dJ2 = Math.hypot(x - HIGHWAYS.centralJunctionX, z - j2Z);
    if (dJ2 < bestDist) {
      bestDist = dJ2;
      bestPt = [HIGHWAYS.centralJunctionX, Math.round(j2Z)];
    }

    const j3Z = GridMap.getHighwayZ(HIGHWAYS.eastJunctionX);
    const dJ3 = Math.hypot(x - HIGHWAYS.eastJunctionX, z - j3Z);
    if (dJ3 < bestDist) {
      bestDist = dJ3;
      bestPt = [HIGHWAYS.eastJunctionX, Math.round(j3Z)];
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
    const crown = REGION_BOUNDS[REGION.crown];
    if (z >= crown.minZ && z <= crown.maxZ) return REGION.crown;
    if (z < crown.minZ) {
      if (x <= REGION_BOUNDS[REGION.goldhof].maxX) return REGION.goldhof;
      if (x <= REGION_BOUNDS[REGION.nordhain].maxX) return REGION.nordhain;
      return REGION.waldau;
    }
    return x <= REGION_BOUNDS[REGION.eichenau].maxX ? REGION.eichenau : REGION.zweiau;
  }

  public static isCoordInRegion(regionId: number, x: number, z: number, highwayBuffer: number = 0): boolean {
    const bounds = REGION_BOUNDS[regionId];
    return Boolean(bounds && x >= bounds.minX + highwayBuffer && x <= bounds.maxX - highwayBuffer &&
      z >= bounds.minZ + highwayBuffer && z <= bounds.maxZ - highwayBuffer);
  }

  public static canRegionConnectToHighwayAt(regionId: number, x: number, z: number): boolean {
    if (x < 1 || x > MAP_WIDTH - 2 || z < 1 || z > MAP_HEIGHT - 2) return false;
    if (GridMap.isCoordInRegion(regionId, x, z)) return true;
    if (HIGHWAY_ACCESS[regionId]?.some(([minX, maxX, minZ, maxZ]) =>
      x >= minX && x <= maxX && z >= minZ && z <= maxZ)) return true;
    return GridMap.isTradeHighwayTile(x, z);
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

  constructor(width = MAP_WIDTH, height = MAP_HEIGHT, seed = DEFAULT_MAP_SEED) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.generate(seed);
  }

  public static getPresetSpawnPoints(regionId: number): SpawnPointData[] {
    return getPresetSpawnPoints(regionId);
  }

  public generate(seed: number): void {
    const prng1 = mulberry32(Math.floor(seed * TERRAIN.seedScale));
    const prng2 = mulberry32(Math.floor(seed * TERRAIN.seedScale) + TERRAIN.foliageSeedOffset);

    const lakeNoise = createNoise2D(prng1);
    const foliageNoise = createNoise2D(prng2);

    this.generationId = (this.generationId || 0) + 1;
    this.isFullTerrainDirty = true;
    this.dirtyTerrainCoords = [];
    this.dirtyFoliageBuckets.clear();
    this.tiles = [];
    this.roadCoords.clear();

    for (let x = 0; x < this.width; x++) {
      this.tiles[x] = [];
      for (let z = 0; z < this.height; z++) {
        const nx = x / this.width;
        const nz = z / this.height;

        let isLake = false;
        let isLakeShore = false;
        for (const lake of LAKES) {
          const offsetX = x - lake.x;
          const offsetZ = z - lake.z;
          const dx = offsetX * lake.rotationCos + offsetZ * lake.rotationSin;
          const dz = -offsetX * lake.rotationSin + offsetZ * lake.rotationCos -
            Math.sin(offsetX * lake.bendFrequency) * lake.bendAmplitude;
          const perturbation = lakeNoise(nx * lake.noiseFrequency + lake.noiseOffset,
            nz * lake.noiseFrequency + lake.noiseOffset) * lake.noiseAmplitude;
          const distance = Math.hypot(dx, dz) + perturbation;
          isLake ||= distance < lake.radius;
          isLakeShore ||= distance < lake.radius + lake.shoreWidth;
        }
        isLakeShore &&= !isLake;

        const isTradeHighway = GridMap.isTradeHighwayTile(x, z);

        const regId = GridMap.getRegionIdForCoord(x, z);

        const oct1 = foliageNoise(nx * TERRAIN.foliage.primaryFrequency, nz * TERRAIN.foliage.primaryFrequency);
        const oct2 = foliageNoise(nx * TERRAIN.foliage.secondaryFrequency + TERRAIN.foliage.secondaryOffsetX, nz * TERRAIN.foliage.secondaryFrequency + TERRAIN.foliage.secondaryOffsetZ) * TERRAIN.foliage.secondaryWeight;
        const macroDensity = oct1 + oct2;

        const microRand1 = ((Math.sin(x * TERRAIN.foliage.treeHash.x + z * TERRAIN.foliage.treeHash.z) * TERRAIN.foliage.treeHash.multiplier) % 1 + 1) % 1;
        const microRand2 = ((Math.sin(x * TERRAIN.foliage.rockHash.x + z * TERRAIN.foliage.rockHash.z) * TERRAIN.foliage.rockHash.multiplier) % 1 + 1) % 1;

        let terrain: TerrainType = 'grass';
        let isPassable = true;
        let movementCost: number = TERRAIN.defaultMovementCost;
        let fertility: number = TERRAIN.defaultFertility;
        let foliageType: 'tree' | 'rock' | 'bush' | 'wheat_crop' | undefined;
        let tileHeight: number = TERRAIN.groundHeight;

        if (isLake) {
          terrain = 'water';
          isPassable = false;
          movementCost = Infinity;
          fertility = 0;
          tileHeight = TERRAIN.waterHeight;
          foliageType = undefined;
        } else if (isLakeShore) {
          terrain = 'fertile_soil';
          fertility = TERRAIN.shoreFertility;
          movementCost = TERRAIN.shoreMovementCost;
          tileHeight = TERRAIN.shoreHeight;
          foliageType = undefined;
        } else if (isTradeHighway) {
          terrain = 'road';
          this.roadCoords.add(x * this.width + z);
          fertility = TERRAIN.roadFertility;
          movementCost = TERRAIN.roadMovementCost;
          tileHeight = TERRAIN.groundHeight;
          isPassable = true;
          foliageType = undefined;
        } else {
          terrain = 'grass';

          const regionTerrain = REGION_TERRAIN[regId] ?? REGION_TERRAIN[REGION.crown];
          fertility = regionTerrain.fertility;
          tileHeight = TERRAIN.groundHeight;
          const forestThreshold = regionTerrain.forestThreshold;

          const isDenseTree = macroDensity > (forestThreshold + TERRAIN.foliage.denseThresholdOffset) && microRand1 < TERRAIN.foliage.denseChance;
          const isMediumTree = macroDensity > forestThreshold && macroDensity <= (forestThreshold + TERRAIN.foliage.denseThresholdOffset) && microRand1 < TERRAIN.foliage.mediumChance;
          const isSolitaryTree = macroDensity <= forestThreshold && microRand1 < TERRAIN.foliage.solitaryChance;

          const isRockZone = regId === REGION.zweiau
            ? (macroDensity < TERRAIN.foliage.mountainRockThreshold && microRand2 < TERRAIN.foliage.mountainRockChance)
            : (macroDensity < TERRAIN.foliage.rockThreshold && microRand2 < TERRAIN.foliage.rockChance);

          if (isDenseTree || isMediumTree || isSolitaryTree) {
            foliageType = 'tree';
            isPassable = false;
            movementCost = Infinity;
          } else if (isRockZone) {
            foliageType = 'rock';
            isPassable = false;
            movementCost = Infinity;
          } else if (macroDensity > TERRAIN.foliage.bushMinDensity && macroDensity < TERRAIN.foliage.bushMaxDensity && microRand2 > TERRAIN.foliage.bushRandomThreshold) {
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

    for (const rId of Object.keys(REGION_BOUNDS).map(Number)) {
      const spawns = GridMap.getPresetSpawnPoints(rId);
      for (const sp of spawns) {
        const [sx, sz] = sp.position;
        for (let px = sx - TERRAIN.spawnClearHalfWidth; px <= sx + TERRAIN.spawnClearHalfWidth; px++) {
          for (let pz = sz - TERRAIN.spawnClearHalfDepth; pz <= sz + TERRAIN.spawnClearHalfDepth; pz++) {
            const tile = this.getTile(px, pz);
            if (tile && tile.terrain !== 'water') {
              tile.terrain = 'grass';
              tile.isPassable = true;
              tile.movementCost = TERRAIN.defaultMovementCost;
              tile.height = TERRAIN.groundHeight;
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
    if (maxH === -Infinity) maxH = TERRAIN.groundHeight;

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
            tile.movementCost = TERRAIN.defaultMovementCost;
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
    if (maxH === -Infinity) maxH = TERRAIN.groundHeight;

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
              tile.movementCost = TERRAIN.defaultMovementCost;
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
        tile.movementCost = TERRAIN.clearedMovementCost;
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
      tile.movementCost = TERRAIN.defaultMovementCost;
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
    tile.movementCost = TERRAIN.roadMovementCost;
    this.dirtyTerrainCoords.push(x, z);
    AStar.clearUnreachableCache();
    return true;
  }

  public removeRoad(x: number, z: number): boolean {
    const tile = this.getTile(x, z);
    if (!tile || tile.terrain !== 'road') return false;
    tile.terrain = 'grass';
    this.roadCoords.delete(x * this.width + z);
    tile.movementCost = TERRAIN.defaultMovementCost;
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
