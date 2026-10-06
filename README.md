# Throne of Mud — 3D Medieval Colony Simulation

[![React 19](https://img.shields.io/badge/React-19.2-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black.svg?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-v9-white.svg?logo=three.js&logoColor=black)](https://r3f.docs.pmnd.rs/)
[![Miniplex ECS](https://img.shields.io/badge/Miniplex-ECS_v2-8B5CF6.svg)](https://github.com/hmans/miniplex)
[![Zustand 5](https://img.shields.io/badge/Zustand-v5-443E36.svg)](https://zustand-demo.pmnd.rs/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38b2ac.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Spatial_3D-FF5722.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Save_Manager-F58220.svg)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![GLSL Shaders](https://img.shields.io/badge/GLSL-Custom_Shaders-5586A4.svg?logo=opengl&logoColor=white)](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
[![Oxlint](https://img.shields.io/badge/Oxlint-Fast_Linter-00DF8F.svg)](https://oxc.rs/)

---

## Overview

**Throne of Mud** is an authentic medieval city-builder, feudal management, and colony simulation game rendered in real-time 3D WebGL via Three.js and React Three Fiber.

The game features an Entity Component System (ECS) architecture, deterministic procedural terrain generation across a 384×384 realm, custom GLSL weather and terrain shaders, multi-tier production chains, working beast logistics (mules and horse-drawn merchant carts), an autonomous Royal Highway trade network, intelligent rival bot lords, in-depth settler vitality with daily routines, and 3D spatial audio.

<p align="center">
  <img src="docs/preview.jpg" alt="Throne of Mud Gameplay Preview" width="100%" />
</p>

---

## Tech Stack

### 3D Graphics & Simulation Engine
- **Three.js (r186) & React Three Fiber (v9)**: Real-time WebGL scene graph rendering, dynamic camera orchestration, instanced mesh batching, and procedural geometry.
- **Custom GLSL Shader Pipeline**: Multi-texture terrain splatting (`grass`, `mud`, `stone`, `water`, `road`), dynamic rain wetness, procedural splash rings, seasonal foliage color shifts, winter snow accumulation, animated water waves, and GPU vertex-shader wind physics.
- **Miniplex v2 (Entity Component System)**: Decoupled high-frequency simulation systems (`JobSystem`, `MovementSystem`, `NeedsSystem`, `EconomySystem`, `ProductionSystem`, `ImmigrationSystem`, `TradeSystem`, `BotAISystem`).
- **A* Pathfinding (`AStar.ts`)**: Fast heuristic path planning supporting obstacle avoidance, dynamic door alignments, and regional highway constraints.

### State Management & Architecture
- **Zustand v5 (Slice Pattern)**: Modular decoupled state slices (`timeSlice`, `settlementSlice`, `uiSlice`, `audioSlice`).
- **Clean Architecture**: Strict separation of concerns between UI Presentation (React), 3D Renderers (Three.js), Simulation Logic (ECS), State Management (Zustand), and Persistence (IndexedDB).

### UI, Audio & Storage
- **React 19 & Tailwind CSS v4**: Gothic medieval interface design inspired by historical manuscripts (Cinzel typography, filigree headers, parchment cards).
- **Web Audio API Engine (`AudioManager.ts`)**: 3D spatial positional audio, environmental soundscapes (birds, campfire, night crickets, wind), footsteps, and voice lines.
- **Full Dual-Language Localization (`i18n`)**: Complete Ukrainian (`uk`) and English (`en`) translations.
- **IndexedDB Save Engine (`saveManager.ts`)**: Transactional local persistence storing game worlds, terrain modifications, and entity inventories.
- **Oxlint**: Ultra-fast Rust-based static analyzer enforcing strict code quality.

---

## Key Features

### Expanded Feudal Realm & Geopolitical Regions (384×384)
- **6 Sovereign Fiefs**: *Goldhof* (northwest meadows), *Mittenwald* (north-central dense forest), *Waldau* (northeast highlands), *Königsweg / Royal Highway* (central trade corridor spanning entire map width), *Eichenau* (southwest oak groves), and *Zweiau* (southeast plains).
- **7 Regional Natural Resource Deposits**: Procedural iron ore veins, limestone rock quarries, clay pits, salt springs, wild berries, wildlife game, and fishing waters with automatic building snapping.

### Trade Economy & Royal Highway Caravans
- **Trading Posts (`trading_post`)**: Establish custom import and export trade policies, target inventory reserves, and market tariffs.
- **Traveling Merchants**: Autonomous horse-drawn merchant wagons traversing the Royal Highway network to trade across fiefs.
- **Highway Connection Network**: Settlements pave connection roads to the nearest Royal Highway arteries to enable merchant visits.

### Working Beasts & Mule Logistics
- **Hitching Posts (`hitching_post`)**: Stables supporting up to 3 working mules with animated idle behaviors.
- **Log Towing & Material Hauling**: Settlers use mules to haul heavy logs from forest clearings and transport bulk materials directly to building scaffolds.

### Multi-Tier Medieval Production Chains
- **20+ Procedural 3D Buildings**:
  - *Forestry & Extraction*: Lumberjack Hut, Sawmill, Stone Quarry, Stonecutter, Clay Pit, Brickworks, Salt Works, Iron Mine, Charcoal Kiln, Iron Smelter.
  - *Agriculture & Food*: Forager's Hut, Hunter's Hut, Fisherman's Hut, Wheat Farm, Windmill, Bakery, Brewery.
  - *Civic & Residential*: Peasant Houses (3 beds), Settler Tents (3 beds), Roaring Campfire, Hitching Post, Marketplace, Tavern, Wooden Church, Lord's Manor.
- **Deep Iron Quarry Excavation**: Tiered open-pit amphitheater quarry with an animated wooden winch lowering ore buckets 1.33m into the earth.

### Autonomous AI Rival Lords
- **Up to 4 Rival Lords**: Compete or trade with *Baron von Goldhof*, *Duke von Walden*, *Count von Eichenau*, and *Count von Reichenbach*.
- **Autonomous Expansion**: AI lords evaluate regional resources, clear camps, pave roads to highway borders, construct production hubs, build residential quarters, and manage immigration.

### Settler Vitality, Social Life & Daily Routines
- **Vitality System**: Villagers manage Hunger, Rest/Energy, Mood, Ale satisfaction, and Hygiene.
- **Daily Schedules & Night Gathering**: Settlers work daytime shifts, gather around campfires at dusk, and sleep in beds at night.
- **24+ Specialized Professions**: Autonomous workplace staffing across extraction, craft, and civic roles.
- **Interactive Speech Bubbles**: Real-time mood thoughts, job announcements, and royal proclamations.

### 12-Month Calendar, Weather & Dynamic Seasons
- **Authentic 12-Month Year (March–February)**: 4 seasons, 10 days per month (120 days/year), full 24-hour sun/moon illumination arcs.
- **Multi-Stage Weather System**: Clear skies, overcast rain with ground wetness, thunderstorms with lightning, and winter snow.
- **Seasonal Transformations**: Spring renewal, Summer vibrance, Autumn golden foliage, and heavy Winter snow accumulation.

### Strategic Parchment Map & Game Setup
- **Interactive Setup Modal**: Choose starting fief, pick settlement camp location, and configure 0 to 4 rival bot lords.
- **Parchment Map View (`M`)**: Seamless transition into a top-down parchment map displaying borders, heraldry shields, roads, and demographic stats.

### Unified Foliage & Real-Time Road Paving
- **Instanced Foliage Rendering**: Thousands of swaying trees, bushes, grass tufts, and flowers with vertex-shader wind physics.
- **Dynamic Road Tool (`R`)**: Freeform road drawing with automatic foliage and clutter clearance.

---

## In-Game Controls & Hotkeys

| Key | Action | Description |
| :--- | :--- | :--- |
| **`W` `A` `S` `D` / Arrows** | Camera Pan | Pan across the settlement and landscape |
| **`Q` / `E`** | Rotate Camera / Building | Rotate camera angle left / right, or rotate building blueprint during placement |
| **Mouse Wheel** | Zoom In / Out | Smooth altitude zoom (tactical to aerial view) |
| **Right Mouse Drag** | Orbit / Rotate | Rotate camera angle and pitch |
| **`Space`** | Pause / Resume | Toggle simulation loop |
| **`1` `2` `3`** | Game Speed | Switch between 1x, 2x, and 5x simulation speed |
| **`T`** | Town Center Focus | Center camera on Lord's camp / manor |
| **`R`** | Road Tool | Toggle dirt road drawing and erase mode |
| **`M`** | Strategic Map | Toggle top-down parchment map view |
| **`Escape`** | Settings / Close | Close active panel or open settings modal |

---

## Running Locally

### Prerequisites
- **Node.js**: v20.x or v22+ (tested on Node v24.20)
- **npm**: v10+

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/your-username/throne-of-mud.git
cd throne-of-mud

# 2. Install dependencies
npm install

# 3. Start development server with Hot Module Replacement (HMR)
npm run dev
```

The game client will be available at [http://localhost:5173](http://localhost:5173).

### Building for Production

```bash
# Typecheck and compile production bundle
npm run build

# Preview production build locally
npm run preview
```

### Linting & Code Hygiene

```bash
# Run ultra-fast Oxlint check
npm run lint
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).
