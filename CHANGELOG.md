# Changelog

All notable changes to **Throne of Mud** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.0] - 2026-10-20

### Added
- **Multi-Draw Instanced Housing Pipeline**: Re-engineered residential mesh rendering into `HouseMultiDrawBatches.ts` and `InstancedHousesRenderer.tsx`, reducing draw calls across 100+ peasant homes from 800+ to under 12 draw calls.
- **Dynamic Seasonal Transformation**: Integrated 12-month calendar (March to February) with seasonal shaders for vertex-based snow accumulation, autumn foliage hue-shifts, and wet rain surface sheen.
- **Mule Hauling & Logistics System**: Added `HitchingPostModel`, mule towing logic in `HaulingJobHandler.ts`, and path-constrained cart mechanics.
- **Royal Highway & Trade Caravans**: Added merchant caravans traversing regional highways, trading posts with custom price configurations, and economic import/export limits.
- **Autonomous Rival Lords**: Added AI feudal factions with territorial claims, independent construction loops, and interactive diplomacy (peace, trade rights, war).

### Changed
- Refactored rendering pipeline to React Three Fiber v9 and Three.js r186.
- Upgraded state management to Zustand v5 with modular slice composition (`timeSlice`, `settlementSlice`, `diplomacySlice`, `uiSlice`, `audioSlice`).
- Migrated styles to Tailwind CSS v4 and Vite 8.
- Upgraded linter from legacy ESLint to Oxlint for sub-second static analysis.

### Performance
- Introduced `PackedMatrixList.ts` and `instanceUploads.ts` for partial dirty-region instance buffer updates, eliminating per-frame full buffer re-uploads.
- Implemented `StablePointLightPool.ts` to clamp dynamic point lights (campfires, lanterns, torches) to maximum active distance ranges with smooth attenuation.
- Enforced zero-allocation scratch buffers in `AStar.ts` heuristic calculations.

### Fixed
- Fixed diagonal wall clipping in unit collision checks.
- Resolved audio listener spatial orientation inversion when orbiting camera with right mouse drag.
- Fixed IndexedDB race condition when auto-saving during rapid pause/unpause toggles.

---

## [0.8.0] - 2026-09-15

### Added
- Initial 384×384 regional map expansion with 6 geopolitical territories (*Goldhof*, *Mittenwald*, *Waldau*, *Königsweg*, *Eichenau*, *Zweiau*).
- 33 medieval building blueprints across civic, food, logistics, and resource extraction tiers.
- A* pathfinding system with road speed bonuses and door alignment constraints.
- Initial IndexedDB save/load system with schema dehydration.
- Spatial Web Audio system with separate sound channels for ambient nature, settlement life, and interface clicks.

---

## [0.1.0] - 2026-08-01

### Added
- Initial prototype of Throne of Mud colony simulator on Three.js and Miniplex ECS.
- Basic peasant worker AI, campfire gathering, simple tree chopping, and terrain grid rendering.
