# ADR-003: Procedural GLSL Terrain Splatting

## Status
**Accepted**

## Context
The world of Throne of Mud spans a continuous $384 \times 384$ tile region with varying elevation (rivers, rolling hills, rocky cliffs, mountain ridges) and distinct biomes (dense forest, muddy cart tracks, cobblestone roads, shoreline sands).

Alternative approaches considered:
1. **Discrete Modular Tile Meshes:** Placing 147,456 individual tile quad meshes. (Rejected: completely unviable in WebGL due to hundreds of thousands of vertices and draw calls).
2. **Chunked Mesh Planes with Static Baked Textures:** Dividing the world into $16 \times 16$ chunks, baking high-resolution textures for each chunk. (Rejected: multi-gigabyte VRAM usage, slow loading times, and poor visual fidelity at road edges).

## Decision
We implemented a **Single Continuous Plane with Procedural GLSL Multi-Texture Splatting** (`TerrainRenderer.tsx`).

1. The terrain geometry is represented as a single subdivided plane mesh with vertex positions displaced along the Y-axis according to the world heightmap.
2. A custom GLSL fragment shader samples 5 texture channels (Grass, Mud, Stone, Water, Road) from a compact texture atlas:
   - **Slope-Based Splatting:** Steep slopes automatically blend into cliff rock (`Stone`).
   - **Elevation-Based Splatting:** Depressions below river level blend into riverbed sand and water.
   - **Dynamic Road Splatting:** Road tiles (`tile.hasRoad === true`) dynamically inject road textures with distance-based dirt edge feathering.
   - **Seasonal Snow & Rain:** Snow accumulation and dynamic wetness sheen are calculated directly in the fragment shader based on surface normals and weather uniforms.

## Consequences

### Positive:
- **1 Draw Call for the Entire World:** The whole $384 \times 384$ world terrain renders in a single WebGL draw call.
- **Dynamic Road Construction:** Drawing roads in real time updates the road texture uniform without regenerating 3D mesh geometry.
- **Minimal VRAM Footprint:** Uses a single lightweight texture set ($\approx 10\text{ MB}$) rather than hundreds of megabytes of baked textures.

### Negative:
- Fragment shader complexity increases with multiple texture taps. We mitigate this with anisotropic filtering and mipmapping optimizations.
