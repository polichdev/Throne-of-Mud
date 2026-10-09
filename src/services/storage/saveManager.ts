import { GridMap } from '../../engine/grid/GridMap';
import { world, type GameEntity } from '../../engine/ecs/world';
import { useGameStore } from '../../store/useGameStore';
import type { ResourceInventory, GameTime, ChronicleEvent, TileData, RegionData, ResourceDeposit, MilitiaSquad } from '../../types/game';
import { initResourceDeposits } from '../../engine/resources/ResourceDeposits';
import { INITIAL_RESOURCES } from '../../constants/economy';
import { DEFAULT_REGIONS } from '../../constants/world';
import { TradeSystem } from '../../engine/ecs/systems/TradeSystem';

export interface SaveMetadata {
  saveTime: number;
  settlementName: string;
  day: number;
  season: string;
  population: number;
  gold: number;
  version: string;
}

export interface SaveData {
  meta: SaveMetadata;
  gameState: {
    resources: ResourceInventory;
    time: GameTime;
    settlementName: string;
    influence: number;
    royalFavor: number;
    chronicle: ChronicleEvent[];
    regions?: RegionData[];
    playerRegionId?: number;
    botCount?: number;
    resourceDeposits?: ResourceDeposit[];
    pendingJobs?: any[];
    cameraPosition?: [number, number];
    cameraZoom?: number;
    cameraAngle?: number;
    militiaSquads?: MilitiaSquad[];
    selectedMilitiaSquadId?: string | null;
  };
  grid: {
    width: number;
    height: number;
    tiles: TileData[][];
  };
  entities: GameEntity[];
}

const DB_NAME = 'ThroneOfMudDB';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const ACTIVE_SAVE_KEY = 'active_save';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveGameToIndexedDB(grid: GridMap): Promise<boolean> {
  try {
    const db = await openDatabase();
    const state = useGameStore.getState();

    const entitiesList: GameEntity[] = Array.from(world.entities)
      .filter((e) => !e.isMerchant && e.factionId !== 'merchant' && !e.id.startsWith('merchant-'))
      .map((e) => ({ ...e }));
    const charactersCount = entitiesList.filter((e) => e.isCharacter).length;

    const meta: SaveMetadata = {
      saveTime: Date.now(),
      settlementName: state.settlementName || 'GOLDHOF',
      day: state.time.day,
      season: state.time.season,
      population: charactersCount || 3,
      gold: state.resources.gold,
      version: '0.8.2',
    };

    const gridData = {
      width: grid.width,
      height: grid.height,
      tiles: grid.tiles,
    };

    const cameraTarget = (window as any).__lastCameraTarget || state.cameraFocusTarget || state.playerSpawnPoint;
    const cameraZoom = (window as any).__lastCameraZoom ?? state.cameraZoomTarget ?? 38;
    const cameraAngle = (window as any).__lastCameraAngle ?? state.cameraAngleTarget ?? (Math.PI / 4);

    const saveData: SaveData = {
      meta,
      gameState: {
        resources: { ...state.resources },
        time: { ...state.time },
        settlementName: state.settlementName,
        influence: state.influence,
        royalFavor: state.royalFavor,
        chronicle: [...state.chronicle],
        regions: state.regions,
        playerRegionId: state.playerRegionId,
        botCount: state.botCount,
        resourceDeposits: state.resourceDeposits || [],
        pendingJobs: state.pendingJobs ? [...state.pendingJobs] : [],
        cameraPosition: cameraTarget ? [cameraTarget[0], cameraTarget[1]] : undefined,
        cameraZoom: typeof cameraZoom === 'number' ? cameraZoom : 38,
        cameraAngle: typeof cameraAngle === 'number' ? cameraAngle : Math.PI / 4,
        militiaSquads: state.militiaSquads ? [...state.militiaSquads] : [],
        selectedMilitiaSquadId: state.selectedMilitiaSquadId || null,
      },
      grid: gridData,
      entities: entitiesList,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(saveData, ACTIVE_SAVE_KEY);

      putRequest.onsuccess = () => {
        try {
          localStorage.setItem('throne_of_mud_has_save', 'true');
          localStorage.setItem('throne_of_mud_meta', JSON.stringify(meta));
        } catch {}
        resolve(true);
      };

      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    });
  } catch (error) {
    console.error('Failed to save game to IndexedDB:', error);
    return false;
  }
}

export async function loadGameFromIndexedDB(grid: GridMap): Promise<boolean> {
  try {
    const db = await openDatabase();

    const saveData = await new Promise<SaveData | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(ACTIVE_SAVE_KEY);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });

    if (!saveData) {
      console.warn('No save data found in IndexedDB');
      return false;
    }

    if (saveData.grid && saveData.grid.tiles) {
      for (let x = 0; x < grid.width && x < saveData.grid.width; x++) {
        for (let z = 0; z < grid.height && z < saveData.grid.height; z++) {
          if (saveData.grid.tiles[x] && saveData.grid.tiles[x][z]) {
            grid.tiles[x][z] = { ...saveData.grid.tiles[x][z] };
            const t = grid.tiles[x][z];
            if (!t.buildingId && t.terrain !== 'water') {
              const isHighway = GridMap.isTradeHighwayTile(x, z);
              if (isHighway) {
                t.terrain = 'road';
                t.foliageType = undefined;
                t.isPassable = true;
                t.movementCost = 0.55;
                grid.roadCoords.add(x * grid.width + z);
              } else if (t.terrain === 'road') {

                const isNorthCenterRogueRoad = z <= 180 && x >= 134 && x <= 250 && saveData.gameState?.playerRegionId !== 4;

                const isOldHorizontalHighway = Math.abs(z - 114) <= 2 || Math.abs(z - 168) <= 2;

                const isRogueRegion5Road = z >= 184 && z <= 231 && saveData.gameState?.playerRegionId !== 5;

                if (isNorthCenterRogueRoad || isOldHorizontalHighway || isRogueRegion5Road) {
                  t.terrain = 'grass';
                  t.movementCost = 1.0;
                  grid.roadCoords.delete(x * grid.width + z);
                }
              }
            }
          }
        }
      }
      grid.isFullTerrainDirty = true;
      grid.dirtyTerrainCoords = [];
    }

    for (const entity of [...world.entities]) {
      world.remove(entity);
    }

    if (Array.isArray(saveData.entities)) {
      const savedHour = saveData.gameState?.time?.hour ?? 12;
      const isDaytime = savedHour >= 6 && savedHour < 22;

      for (const entity of saveData.entities) {
        if (entity.isMerchant || entity.factionId === 'merchant' || entity.id.startsWith('merchant-')) {
          continue;
        }
        if (saveData.gameState?.playerRegionId !== 4 && (entity.regionId === 4 || entity.factionId === 'bot-4')) {
          continue;
        }
        if (saveData.gameState?.playerRegionId !== 5 && (entity.regionId === 5 || entity.factionId === 'bot-5')) {
          continue;
        }
        if (entity.isCharacter) {
          delete (entity as any).idleCooldownTicks;
          delete (entity as any).nextPendingJobCheckTick;
          delete (entity as any).nextHaulingCheckTick;
          delete (entity as any).muleTransition;
          delete (entity as any).muleTransitionProgress;

          entity.path = [];

          if (isDaytime) {
            const jType = entity.currentJob?.type;
            if (!jType || jType === 'sleep' || jType === 'sit_by_fire' || jType === 'wander') {
              entity.currentJob = { id: `idle-${Date.now()}-${entity.id}`, type: 'idle', progress: 0, totalWork: 0 };
            }
          }
        }
        world.add(entity);
        if (entity.isBuilding && entity.gridPosition) {
          const [gx, gz] = entity.gridPosition;
          const bw = entity.buildingWidth || 1;
          const bh = entity.buildingHeight || 1;
          grid.occupyForBuilding(gx, gz, bw, bh, entity.id);
        }
      }
    }

    const loadedPendingJobs: any[] = Array.isArray(saveData.gameState.pendingJobs)
      ? [...saveData.gameState.pendingJobs]
      : [];
    const existingTargetBuildingIds = new Set(loadedPendingJobs.map((j: any) => j.targetBuildingId).filter(Boolean));

    for (const b of world.entities) {
      if (b.isBuilding && !b.isCompleted && (b.factionId === 'player' || b.factionId === undefined)) {
        if (!existingTargetBuildingIds.has(b.id)) {
          loadedPendingJobs.push({
            id: `build-${b.id}`,
            type: 'build_structure',
            targetBuildingId: b.id,
            targetPosition: b.gridPosition,
            progress: b.constructionProgress || 0,
            totalWork: 100,
          });
          existingTargetBuildingIds.add(b.id);
        }
      }
    }

    let deposits = saveData.gameState.resourceDeposits;
    const hasDepositsInEntities = world.entities.some((e) => e.isResourceDeposit);
    if (!hasDepositsInEntities || !deposits || deposits.length === 0) {
      deposits = initResourceDeposits(grid);
    } else if (grid && deposits) {
      for (const dep of deposits) {
        if (dep.type !== 'fish') {
          const clearRadius = dep.type === 'berries' ? 1.5 : 2.8;
          const rSq = clearRadius * clearRadius;
          const maxR = Math.ceil(clearRadius);
          const [gx, gz] = dep.gridPosition;
          for (let dx = -maxR; dx <= maxR; dx++) {
            for (let dz = -maxR; dz <= maxR; dz++) {
              if (dx * dx + dz * dz <= rSq) {
                const tx = gx + dx;
                const tz = gz + dz;
                const t = grid.getTile(tx, tz);
                if (t && t.terrain !== 'water') {
                  t.foliageType = undefined;
                  t.foliageAngle = undefined;
                  t.foliageTreeType = undefined;
                  t.isPassable = true;
                  t.movementCost = 1.0;
                }
              }
            }
          }
        }
      }
      grid.refreshFoliageCoords();
    }

    const playerRegionId = saveData.gameState.playerRegionId ?? 0;
    const playerRegion = (saveData.gameState.regions || [])[playerRegionId];
    let campX = playerRegion?.campPosition?.[0] ?? playerRegion?.center?.[0] ?? 52;
    let campZ = playerRegion?.campPosition?.[1] ?? playerRegion?.center?.[1] ?? 52;

    const tent = Array.isArray(saveData.entities) ? saveData.entities.find(
      (b) => b.isBuilding && (b.buildingType === 'tent' || b.buildingType === 'campfire' || b.buildingType === 'manor') &&
             (b.factionId === 'player' || b.regionId === playerRegionId)
    ) : null;

    if (tent?.position) {
      campX = tent.position[0];
      campZ = tent.position[2];
    } else if (tent?.gridPosition) {
      campX = tent.gridPosition[0];
      campZ = tent.gridPosition[1];
    }

    const targetCamX = saveData.gameState.cameraPosition?.[0] ?? campX;
    const targetCamZ = saveData.gameState.cameraPosition?.[1] ?? campZ;
    const targetZoom = saveData.gameState.cameraZoom ?? 38;
    const targetAngle = saveData.gameState.cameraAngle ?? (Math.PI / 4);

    (window as any).__lastCameraTarget = [targetCamX, targetCamZ];
    (window as any).__lastCameraZoom = targetZoom;
    (window as any).__lastCameraAngle = targetAngle;
    (window as any).__snapCameraNextFrame = true;

    try {
      localStorage.setItem('throne_of_mud_active_session', 'playing');
      localStorage.setItem('throne_of_mud_has_save', 'true');
    } catch {}

    useGameStore.setState({
      resources: { ...INITIAL_RESOURCES, ...saveData.gameState.resources },
      time: {
        ...saveData.gameState.time,
        season: saveData.gameState.time.season || 'Spring',
        weather: saveData.gameState.time.weather || 'clear',
        targetWeather: saveData.gameState.time.targetWeather || saveData.gameState.time.weather || 'clear',
        nextWeather: saveData.gameState.time.nextWeather || 'clear',
        rainIntensity: saveData.gameState.time.rainIntensity ?? (saveData.gameState.time.weather === 'rain' ? 1 : 0),
        stormIntensity: saveData.gameState.time.stormIntensity ?? (saveData.gameState.time.weather === 'storm' ? 1 : 0),
        snowIntensity: saveData.gameState.time.snowIntensity ?? (saveData.gameState.time.weather === 'snow' ? 1 : 0),
        snowAccumulation: saveData.gameState.time.snowAccumulation ?? 0,
        lightningFlash: 0,
        isPaused: saveData.gameState.time.isPaused ?? false,
      },
      settlementName: saveData.gameState.settlementName || 'GOLDHOF',
      influence: saveData.gameState.influence || 2500,
      royalFavor: saveData.gameState.royalFavor || 15,
      chronicle: saveData.gameState.chronicle || [],
      regions: (() => {
        const regs: RegionData[] = saveData.gameState.regions || useGameStore.getState().regions;
        if (regs) {
          for (let i = 0; i < DEFAULT_REGIONS.length; i++) {
            if (!regs[i]) {
              regs[i] = JSON.parse(JSON.stringify(DEFAULT_REGIONS[i]));
            } else {
              regs[i].bounds = { ...DEFAULT_REGIONS[i].bounds };
              regs[i].center = [...DEFAULT_REGIONS[i].center];
              regs[i].spawnPoints = JSON.parse(JSON.stringify(DEFAULT_REGIONS[i].spawnPoints || []));
            }
          }
          if (playerRegionId !== 4 && regs[4]) {
            regs[4].owner = 'unclaimed';
            regs[4].population = 0;
            regs[4].buildingsCount = 0;
          }
          if (playerRegionId !== 5 && regs[5]) {
            regs[5].owner = 'unclaimed';
            regs[5].population = 0;
            regs[5].buildingsCount = 0;
          }
        }
        return regs;
      })(),
      playerRegionId,
      playerSpawnPoint: [campX, campZ],
      cameraFocusTarget: [targetCamX, targetCamZ],
      cameraZoomTarget: targetZoom,
      cameraAngleTarget: targetAngle,
      botCount: saveData.gameState.botCount ?? 2,
      selectedEntityId: null,
      isLordsBarOpen: false,
      activeMenuTab: null,
      activeBuildType: null,
      activeTool: 'select',
      isInitialized: true,
      isStrategicMapOpen: false,
      buildingVersion: useGameStore.getState().buildingVersion + 1,
      foliageVersion: useGameStore.getState().foliageVersion + 1,
      terrainVersion: useGameStore.getState().terrainVersion + 1,
      resourceDeposits: deposits || [],
      pendingJobs: loadedPendingJobs,
      militiaSquads: saveData.gameState.militiaSquads ? [...saveData.gameState.militiaSquads] : [],
      selectedMilitiaSquadId: saveData.gameState.selectedMilitiaSquadId || null,
    });

    useGameStore.getState().syncMilitiaSquadsFromWorld();

    TradeSystem.reset();

    return true;
  } catch (error) {
    console.error('Failed to load game from IndexedDB:', error);
    return false;
  }
}

export async function getSavedGameMeta(): Promise<SaveMetadata | null> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(ACTIVE_SAVE_KEY);

      getRequest.onsuccess = () => {
        const result: SaveData | undefined = getRequest.result;
        if (result && result.meta) {
          resolve(result.meta);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  } catch (error) {
    console.warn('Could not query save metadata:', error);
    return null;
  }
}

export async function deleteSavedGame(): Promise<boolean> {
  try {
    try {
      localStorage.removeItem('throne_of_mud_active_session');
    } catch {}
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(ACTIVE_SAVE_KEY);

      deleteRequest.onsuccess = () => {
        resolve(true);
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    });
  } catch (error) {
    console.error('Failed to delete save from IndexedDB:', error);
    return false;
  }
}
