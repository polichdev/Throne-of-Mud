# System Architecture & Patterns

This document details the architectural layout, core design patterns, and module separation for **Throne of Mud**.

---

## Architecture

Throne of Mud follows a strictly decoupled, unidirectional data flow architecture separating:
- **Presentation Layer**: React 19 UI (Tailwind CSS v4) for HUD, inspector panels, trade interfaces, strategic map canvas, and dialogs.
- **3D Render Layer**: Three.js & React Three Fiber (R3F) handling WebGL meshes, procedural geometry, lighting, working animal companions, and custom GLSL shaders.
- **Simulation Layer**: Miniplex Entity Component System (ECS) driving real-time agent AI, jobs, movement, needs, town production, mule hauling, trade caravans, and rival lord logic.
- **State Layer**: Zustand v5 modular slice store orchestrating global game time, active player actions, audio settings, trade policies, and settlement-wide statistics.
- **Storage Layer**: IndexedDB transaction manager storing serialized game worlds and entity states locally.

```mermaid
flowchart TD
    subgraph UI ["Presentation Layer (React 19 & Tailwind v4)"]
        TopHUD[Top HUD / Resources]
        Inspector[Modular Inspector Panel]
        RoadTool[Road & Tool Controls]
        TradeUI[Trade Policies & Market UI]
        StrategicMap[Parchment Map & Setup Modal]
    end

    subgraph State ["State Management (Zustand v5 Slices)"]
        TimeSlice[timeSlice]
        SettlementSlice[settlementSlice]
        UISlice[uiSlice]
        AudioSlice[audioSlice]
    end

    subgraph Engine ["Simulation Engine (Miniplex ECS)"]
        GameLoop[RAF GameLoop]
        JobSys[JobSystem / Subhandlers]
        MoveSys[MovementSystem]
        NeedSys[NeedsSystem]
        EconSys[EconomySystem]
        TradeSys[TradeSystem]
        BotSys[BotAISystem]
        Helpers[entityHelpers.ts]
    end

    subgraph Render ["3D Rendering (Three.js / R3F & GLSL)"]
        Terrain[TerrainRenderer / Splat Shaders]
        Foliage[FoliageRenderer / Wind Shaders]
        Buildings[BuildingsRenderer / Procedural 3D]
        Units[UnitsRenderer / 3D Settlers, Mules & Wagons]
        Weather[WeatherRenderer / Rain & Snow Shaders]
    end

    subgraph Storage ["Persistence Layer (IndexedDB)"]
        SaveMgr[saveManager.ts]
    end

    UI -->|Dispatches Actions| State
    GameLoop -->|Executes Ticks| Engine
    Engine -->|Reads / Updates via Helpers| State
    State -->|Syncs Reactive State| UI
    State -->|Drives Uniforms & Data| Render
    Engine -->|Syncs Positions & Meshes| Render
    State -->|Serializes / Deserializes| SaveMgr
```

---

## Directory Layout

```
src/
├── components/
│   ├── audio/              # AudioController & spatial listener bridge
│   ├── canvas/             # Three.js / React Three Fiber 3D renderers
│   │   ├── buildings/      # Modular procedural 3D building models
│   │   │   ├── models/     # Individual 3D building models (HitchingPost, TradingPost, etc.)
│   │   │   └── common/     # Shared procedural geometry primitives & materials
│   │   ├── fauna/          # Ambient wildlife & fauna renderers
│   │   ├── units/          # Settler, mule, & wagon materials and textures
│   │   ├── BuildingsRenderer.tsx
│   │   ├── DayNightLighting.tsx
│   │   ├── FoliageRenderer.tsx
│   │   ├── GameCanvas.tsx
│   │   ├── TerrainRenderer.tsx
│   │   ├── UnitsRenderer.tsx
│   │   ├── WeatherRenderer.tsx
│   │   └── WoodChipsRenderer.tsx
│   ├── common/             # Error boundaries & generic layout guards
│   └── ui/                 # React HTML/Tailwind HUD components
│       ├── bottom-bar/     # Buildings menu, action bar, time controls
│       ├── inspector/      # Modular entity, character, & building inspectors
│       ├── settings/       # Audio controls, language selector, settings modal
│       ├── trade/          # Trading post inspector & market policy controls
│       ├── BottomActionBar.tsx
│       ├── InspectorPanel.tsx
│       ├── MainMenu.tsx
│       ├── MedievalIcons.tsx
│       ├── NewGameSetupModal.tsx
│       ├── RoadToolPanel.tsx
│       ├── StrategicMapCanvas.tsx
│       ├── StrategicMapModal.tsx
│       ├── TopHUD.tsx
│       └── WeatherDebugModal.tsx
├── constants/              # Centralized domain constants (time, economy, world)
│   ├── camera.ts           # Zoom limits, pitch angles, pan bounds
│   ├── time.ts             # Ticks per minute, season offsets, day cycles
│   └── world.ts            # 384x384 dimensions, preset lords, region manifests
├── engine/
│   ├── assets/             # Three.js texture cache & AssetLoader
│   ├── audio/              # Web Audio API engine & ambient soundscapes
│   ├── buildings/          # Building blueprints, costs, dimensions, navigation
│   ├── ecs/                # Miniplex Entity Component System
│   │   ├── entityHelpers.ts # Encapsulated entity mutators (thoughts, jobs)
│   │   ├── world.ts        # ECS world instance & entity archetypes
│   │   └── systems/        # Decoupled simulation systems
│   │       ├── jobs/       # Specialized job subhandlers (Hauling, Woodcutting, Rest, etc.)
│   │       ├── BotAISystem.ts
│   │       ├── ImmigrationSystem.ts
│   │       ├── JobSystem.ts
│   │       ├── MovementSystem.ts
│   │       └── TradeSystem.ts
│   ├── grid/               # GridMap, tile data, building snap, road generation
│   ├── pathfinding/        # A* pathfinding algorithm with region constraints
│   ├── resources/          # Natural resource deposits & quarries
│   ├── time/               # Main requestAnimationFrame GameLoop
│   ├── trade/              # Trade valuation & market mechanics
│   └── world/              # World entity initializer, camp spawning, foliage generation
├── hooks/                  # Custom React hooks (autosave, shortcuts, metrics, town focus)
├── i18n/                   # Internationalization engine (EN / UK dictionaries)
├── services/storage/       # IndexedDB save/load manager
├── store/                  # Zustand modular state store
│   ├── slices/             # Time, UI, Audio, and Settlement slices
│   └── useGameStore.ts     # Root store composition
├── types/                  # Strict TypeScript domain interfaces
└── utils/                  # Deterministic math, noise, and distance utilities
```

---

## Core Design Patterns

### 1. Entity Component System (ECS)
The simulation logic avoids deep inheritance hierarchies by relying on **Miniplex v2**:
- **Entities**: Simple containers of keyed components (e.g. `position`, `gridPosition`, `job`, `needs`, `inventory`, `hasMule`, `isMerchant`).
- **Archetypes**: Reactive queries over entities with specific components (`characterEntities`, `buildingEntities`).
- **Systems**: Decoupled tick functions executing on deterministic time intervals.

### 2. Zustand Slice Pattern
State is segregated into focused slices:
- `timeSlice`: Controls calendar time, speed multipliers, and seasonal progression.
- `settlementSlice`: Manages inventory stockpiles, construction lists, logs, and lord interactions.
- `uiSlice`: Manages selection states, road painting mode, inspector focus, and UI overlays.
- `audioSlice`: Controls dynamic volumes, sound channels, and active locale.

All slices are bound together in `src/store/useGameStore.ts` using Zustand's `StateCreator` pattern.

### 3. Encapsulated Entity Mutators (`entityHelpers.ts`)
To adhere to DRY principles and prevent out-of-sync state, common mutations on ECS entities (assigning workers, adjusting thoughts, queueing speech bubbles, managing mule transitions) are isolated in helper functions rather than inlined across systems.

### 4. GPU Shader-Driven World Animation
High-performance dynamic effects are computed directly on the GPU via custom GLSL shaders:
- **Multi-texture splatting**: Continuous data textures blend grass, mud, rock, road, and water without expensive geometry rebuffering.
- **Weather integration**: Terrain darkness increases dynamically with `uWetness`, procedural rain rings ripple on surfaces, and snow accumulates via `uSnowAmount`.
- **Foliage sway**: Vertex shader wind waves animate thousands of instanced trees with zero CPU overhead.

---

[← Return to Main README](../README.md)
