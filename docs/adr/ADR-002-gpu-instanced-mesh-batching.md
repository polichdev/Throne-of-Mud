# ADR-002: GPU Instanced Mesh Multi-Draw Batching

## Status
**Accepted**

## Context
In Throne of Mud, a mature medieval settlement features dozens of residential peasant houses, civic monuments (manor, church, taverns), defensive palisade walls, gates, and industrial workshops. Each peasant house consists of multiple modular geometric elements:
- Stone/timber foundation
- Timber corner posts and crossbeams
- Wattle-and-daub plaster wall panels
- Thatched straw or wooden tile roofs
- Fired brick chimneys
- Wooden doors and window frames

If each building is instantiated as a standalone Three.js `Group` containing individual `Mesh` components, 50 peasant houses produce over $50 \times 6 = 300$ draw calls. Combined with foliage (3,000+ trees and bushes) and units, total draw calls exceed 1,000 per frame, causing massive CPU-to-GPU submission bottlenecks and dropping frame rates below 20 FPS on standard integrated GPUs.

## Decision
We implemented a **Modular Multi-Draw Instancing Architecture** (`HouseMultiDrawBatches.ts`, `BuildingMeshBatches.ts`, and `InstancedHousesRenderer.tsx`).

1. Instead of batching by *building instance*, we batch by **shared material and geometry primitive**:
   - All house foundation frames across the entire map share a single `InstancedMesh`.
   - All plaster walls across all houses share another `InstancedMesh`.
   - All thatch roof sections share a third `InstancedMesh`.
2. Each building's position, tier (Tier 1 tent/hovel, Tier 2 timber house, Tier 3 framed cottage), and backyard extension (garden, forge, chicken coop) are encoded into transformation matrices written to a shared `PackedMatrixList`.
3. Partial buffer invalidation (`instanceUploads.ts`) uploads only the modified sub-range of matrices to GPU VRAM when a building is constructed or upgraded.

## Consequences

### Positive:
- **Massive Draw Call Reduction:** Over 100+ fully-detailed multi-tier houses and outbuildings are submitted to the GPU in **under 12 draw calls**.
- **Steady 60 FPS:** CPU frame submission time reduced from $12\text{ ms}$ to under $1.5\text{ ms}$.
- **Dynamic Tier Upgrades:** Upgrading a house from Tier 1 to Tier 3 simply swaps matrix indices without tearing down or rebuilding React Three Fiber component subtrees.

### Negative:
- Slightly more complex matrix mathematics when computing offsets for multi-tier structures and doors.
- Automated batching verification scripts (`check-house-batching.mjs`) are required to prevent regressions when adding new building blueprints.
