# Save Format Specification & Migrations

This specification documents the binary/JSON structure, entity serialization schemas, and versioning rules used by **Throne of Mud** (`src/services/storage/saveManager.ts`).

---

## 1. Top-Level Save Envelope (`SaveData`)

Saves are stored in the `saves` object store of the `throne-of-mud-saves` IndexedDB instance.

```typescript
export interface SaveData {
  meta: SaveMetadata;        // Fast summary for the save selection UI
  gameState: GameStateData;  // Non-entity global state (time, economics, camera)
  grid: GridSaveData;        // 384x384 terrain heightmap, tile types, and roads
  entities: GameEntity[];    // Dehydrated Miniplex ECS entities
}
```

### 1.1. `SaveMetadata` Schema
Stored for fast retrieval without parsing the entire entity world:
```typescript
export interface SaveMetadata {
  saveTime: number;          // Unix epoch timestamp (Date.now())
  settlementName: string;    // e.g., "GOLDHOF", "EICHENAU"
  day: number;               // Calendar day (1–120)
  season: string;            // 'spring' | 'summer' | 'autumn' | 'winter'
  population: number;        // Active living citizens count
  gold: number;              // Current settlement treasury
  version: string;           // Engine format version (e.g., "0.9.0")
}
```

---

## 2. Global Game State (`gameState`)

```typescript
export interface GameStateData {
  resources: ResourceInventory;         // Timber, stone, bread, tools, iron, etc.
  time: GameTime;                       // Year, month, day, tick, speedMultiplier
  settlementName: string;               // Display name of player's town
  playerIdentity?: PlayerIdentity;       // Selected ruler portrait, heraldry, realm name
  influence: number;                    // Political capital
  royalFavor: number;                   // Crown allegiance rating
  chronicle: ChronicleEvent[];          // Historical event log
  regions?: RegionData[];               // Geopolitical region ownership & claims
  playerRegionId?: number;              // Starting territory index (0–5)
  botCount?: number;                    // 0–4 active rival AI lords
  resourceDeposits?: ResourceDeposit[]; // Natural mineral & clay veins
  pendingJobs?: PendingJob[];           // Unassigned task queue
  cameraPosition?: [number, number];    // Last camera focus coordinate [x, z]
  cameraZoom?: number;                  // Zoom level
  cameraAngle?: number;                 // Rotation angle
  militiaSquads?: MilitiaSquad[];       // Formed military units
  selectedMilitiaSquadId?: string | null;
}
```

---

## 3. World Grid Data (`grid`)

The 384×384 world grid represents the discrete simulation terrain:

```typescript
export interface GridSaveData {
  width: number;             // Standard: 384
  height: number;            // Standard: 384
  tiles: TileData[][];       // 2D matrix of tile state
}

export interface TileData {
  type: TileType;            // 'grass' | 'mud' | 'stone' | 'water' | 'forest'
  elevation: number;         // Continuous height value for 3D terrain mesh
  hasRoad: boolean;          // Dirt road overlay flag
  regionId: number;          // Geopolitical region identifier
  buildingId?: string;       // ID of building occupying this tile
}
```

---

## 4. Entity Dehydration & Sanitization

Miniplex ECS entities are dehydrated into plain JavaScript objects before storage:

```mermaid
flowchart LR
    World[Live Miniplex World] --> Filter[Filter Ephemeral Entities: Merchants, Particles]
    Filter --> ShallowCopy[Clone Component References]
    ShallowCopy --> StripCircular[Strip circular Three.js / DOM references]
    StripCircular --> Snapshot[JSON Array of Entities]
    Snapshot --> SaveFile[(IndexedDB Store)]
```

### Entity Filtering Rules:
1. **No Ephemeral Merchants:** Entities with `e.isMerchant === true`, `e.factionId === 'merchant'`, or IDs starting with `merchant-` are stripped out. They are safely regenerated upon arrival on the Royal Highway.
2. **No Scene Graph Objects:** References to `THREE.Mesh`, `THREE.Material`, or audio listeners are detached. Visual representations are reconstructed on the fly during rehydration.

---

## 5. Schema Migration Pipeline

When a save file is loaded from storage:
1. If `meta.version < CURRENT_FORMAT_VERSION`, a migration sequence runs:
   ```typescript
   function migrateSave(data: SaveData): SaveData {
     if (!data.gameState.playerIdentity) {
       data.gameState.playerIdentity = DEFAULT_PLAYER_IDENTITY;
     }
     if (!data.gameState.militiaSquads) {
       data.gameState.militiaSquads = [];
     }
     if (typeof data.gameState.cameraZoom !== 'number') {
       data.gameState.cameraZoom = DEFAULT_CAMERA_ZOOM;
     }
     return data;
   }
   ```
2. Migrated data is passed to `world.ts` to populate Miniplex entities and to `GridMap` to rebuild spatial navigation indices.
