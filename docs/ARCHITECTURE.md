# System Architecture & Technical Specifications

This document outlines the high-level software architecture, data pipelines, and design patterns powering **Throne of Mud**.

---

## 1. High-Level Architectural Layers

Throne of Mud is engineered with a strict **5-Tier Decoupled Architecture**. Each tier has a well-defined boundary and communicates with neighboring tiers through explicit, typed contracts.

```mermaid
flowchart TB
    subgraph L1 ["1. Presentation Layer (React 19 & Tailwind CSS v4)"]
        HUD[Medieval HUD & Resource Bar]
        Inspector[Modular Entity/Building Inspector]
        Setup[Geopolitical Setup Modal]
        Parchment[Strategic Top-Down Map Canvas]
        TradeSheet[Market & Caravan Trade Manager]
    end

    subgraph L2 ["2. Reactive State Layer (Zustand v5)"]
        TimeSlice[timeSlice: calendar, game speed, tick time]
        SettlementSlice[settlementSlice: tax, population, stockpile aggregates]
        DiplomacySlice[diplomacySlice: lord relations, treaties, hostilities]
        UISlice[uiSlice: active modal, selected entity, tool modes]
        AudioSlice[audioSlice: master/sfx/ambient volumes, current music]
    end

    subgraph L3 ["3. Simulation Engine (Miniplex ECS v2)"]
        Loop[Fixed-Timestep GameLoop]
        SysJobs[JobSystem & Modular Job Handlers]
        SysMove[MovementSystem & A* Pathfinding]
        SysNeeds[NeedsSystem: Hunger, Rest, Warmth, Mood]
        SysEcon[EconomySystem: Wages, Market, Stockpiles]
        SysTrade[TradeSystem: Caravans & Royal Highway]
        SysAI[BotAISystem: Autonomous Rival Lords]
    end

    subgraph L4 ["4. 3D Render Layer (Three.js r186, R3F v9, Custom GLSL)"]
        TerrainR[TerrainRenderer: Multi-Texture Splat Shader]
        FoliageR[FoliageRenderer: Wind-Swayed Instanced Trees/Grass]
        BuildingR[BuildingsRenderer: Instanced Multi-Tier Models]
        UnitR[UnitsRenderer: Instanced Settlers, Mules & Wagons]
        WeatherR[WeatherRenderer: Rain, Splash Rings & Snow Shaders]
        LightR[DayNightLighting: 24h Celestial Arcs & Point Light Pool]
    end

    subgraph L5 ["5. Persistence Layer (IndexedDB / Web Storage)"]
        SaveManager[saveManager.ts: World Serializer]
        IndexedDB[(IndexedDB: throne-of-mud-saves)]
        LocalStorage[(LocalStorage: User Preferences)]
    end

    L1 -->|Dispatches UI Actions| L2
    L1 -.->|Pulls Read-Only Entity Data| L3
    L2 -->|Configures Game Speed & Time| L3
    L3 -->|Pushes Aggregate Metrics| L2
    L3 -->|Provides World Coordinates & Meshes| L4
    L2 -->|Drives Lighting & Camera Settings| L4
    L3 -->|Dehydrates Entity Snapshots| L5
    L5 -->|Hydrates Entities on World Load| L3
```

---

## 2. Simulation vs. Render Decoupling

A critical architectural pillar of Throne of Mud is the **strict separation between the simulation frequency and the render display refresh rate**.

```mermaid
sequenceDiagram
    autonumber
    participant Display as Browser Display (VSync 60/144Hz)
    participant RAF as requestAnimationFrame (GameLoop.ts)
    participant Sim as ECS Simulation (Fixed 20Hz Tick)
    participant Buffer as Packed Matrix Buffers
    participant GPU as WebGL / GPU Hardware

    Display->>RAF: Request Frame Callback
    RAF->>RAF: Accumulate delta time (dt)
    loop While accumulator >= fixedDelta (50ms)
        RAF->>Sim: Step Simulation Tick (Needs, Jobs, Moves, Economy)
        Sim->>Sim: Update Entity Coordinates in Miniplex
        Sim->>Sim: Deduct 50ms from accumulator
    end
    RAF->>Sim: Calculate alpha = accumulator / fixedDelta (Interpolation)
    RAF->>Buffer: Interpolate transforms & write to PackedMatrixList
    Buffer->>GPU: Upload dirty instance sub-ranges (instanceUploads.ts)
    RAF->>GPU: Issue batched draw calls (gl.drawElementsInstanced)
    GPU-->>Display: Present rendered frame
```

### Key Properties:
1. **Deterministic Physics & AI:** Running systems at a fixed $20\text{ Hz}$ ($\Delta t = 0.05\text{ s}$) guarantees identical simulation outcomes regardless of whether the user plays on a $60\text{ Hz}$, $144\text{ Hz}$, or variable refresh rate (VRR) monitor.
2. **Smooth Visual Presentation:** When rendering at high frame rates, visual positions are interpolated between the previous and current simulation ticks using the remaining fractional accumulator ($\alpha$), preventing visual jitter.

---

## 3. Entity Component System (ECS) Architecture

Throne of Mud leverages **Miniplex v2**, a minimalist, high-performance Entity Component System. Entities are pure JavaScript objects; components are properties attached to them.

```mermaid
classDiagram
    class Entity {
        +number id
        +Position position
        +Velocity velocity
        +Worker worker
        +Needs needs
        +Inventory inventory
        +Building building
        +Deposit deposit
        +Militia militia
    }

    class Position {
        +number x
        +number y
        +number z
        +number rotation
    }

    class Worker {
        +JobType currentJob
        +number targetEntityId
        +Vector3[] path
        +number jobProgress
    }

    class Needs {
        +number hunger
        +number energy
        +number warmth
        +number mood
    }

    class Building {
        +string blueprintId
        +number tier
        +number health
        +boolean isConstructed
        +number assignedWorkersCount
    }

    Entity *-- Position
    Entity *-- Worker
    Entity *-- Needs
    Entity *-- Building
```

Queries in Miniplex compile to fast cached sets. Systems iterate exclusively over matching entities:
```typescript
// Example: Movement system query
const movingEntities = world.with("position", "velocity", "path");
for (const entity of movingEntities) {
  // Execute movement logic without checking irrelevant entities
}
```

---

## 4. 3D Graphics Pipeline & Instanced Batching

To achieve real-time $60\text{ FPS}$ performance in a dense medieval colony with thousands of trees, dozens of buildings, and hundreds of citizens, **draw calls are strictly capped**:

```mermaid
flowchart LR
    subgraph Entities ["World Entities"]
        U[150 Settlers & Mules]
        B[40 Multi-Tier Buildings]
        F[3,000 Trees, Bushes & Rocks]
    end

    subgraph BatchingEngine ["Batching Infrastructure"]
        UBatches[AnimatedMeshBatches.ts]
        BBatches[HouseMultiDrawBatches.ts / BuildingMeshBatches.ts]
        FBatches[FoliageRenderer.tsx]
        MatrixBuffer[PackedMatrixList (Float32Array)]
    end

    subgraph GPUOutput ["GPU Draw Pipeline"]
        DrawUnits[2-4 Instanced Draw Calls]
        DrawBuildings[8-12 Instanced Draw Calls]
        DrawFoliage[4-6 Instanced Draw Calls]
        DrawTerrain[1 Draw Call Multi-Splat Terrain]
    end

    U --> UBatches --> MatrixBuffer --> DrawUnits
    B --> BBatches --> MatrixBuffer --> DrawBuildings
    F --> FBatches --> MatrixBuffer --> DrawFoliage
```

- **Building Instancing (`HouseMultiDrawBatches.ts`)**: Instead of rendering 40 individual house models containing roofs, walls, beams, chimneys, and doors (which would trigger $>800$ separate draw calls), parts are grouped by shared material into unified `InstancedMesh` buffers.
- **Dynamic Terrain Splatting (`TerrainRenderer.tsx`)**: The entire $384\times 384$ terrain is rendered in a single draw call. A custom GLSL fragment shader reads a procedural splat texture and blends grass, mud, rock, riverbed, and roads seamlessly with slope and height heuristics.
- **GPU Wind & Season Shaders**: Tree foliage and grass blades sway dynamically in the vertex shader using simplex noise uniforms without any CPU animation overhead.

---

## 5. Persistence & Save Architecture

Game state persistence is managed by `src/services/storage/saveManager.ts` using **IndexedDB**:

1. **State Dehydration**: When saving, the active Miniplex ECS world entities, world heightmap mutations, road grid arrays, and Zustand settlement aggregates are serialized into a compact JSON snapshot.
2. **Atomic Write Transactions**: Saves are written to the `throne-of-mud-saves` IndexedDB object store with timestamped keys. A rollback mechanism prevents save file corruption if the browser tab is abruptly closed during serialization.
3. **Save Migrations**: Every snapshot includes a `schemaVersion` (e.g., `1`). On load, if the save version is older than current engine requirements, migration pipelines execute sequentially to normalize missing component fields.

For in-depth details on the schema and entity dehydration, refer to [`docs/SAVE_FORMAT.md`](SAVE_FORMAT.md).
