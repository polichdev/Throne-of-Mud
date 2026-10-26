## Summary

<!-- Provide a concise description of the purpose and context of this change. -->

## Changes Made

- 
- 

## Subsystems Affected

- [ ] Presentation / UI (React 19, Tailwind v4, HUD, Menus)
- [ ] 3D Graphics & Shaders (Three.js, R3F, GLSL, Instancing)
- [ ] Simulation Engine & ECS (Miniplex, Jobs, Movement, AI)
- [ ] Pathfinding & Grid (AStar, GridMap, Road generation)
- [ ] Economy & Trade (Production, Market, Caravans, Blueprints)
- [ ] State & Storage (Zustand Slices, IndexedDB Saves)
- [ ] Audio (Web Audio API, Spatial Listener)
- [ ] Documentation / Tooling / Scripts

## Verification & Testing

- [ ] `npm run lint` passes with 0 warnings or errors.
- [ ] `npm run build` succeeds (TypeScript compilation + Vite packaging).
- [ ] Rendering batch checks run cleanly:
  - `node scripts/check-house-batching.mjs`
  - `node scripts/check-unit-batching.mjs`
  - `node scripts/check-building-batching.mjs`
- [ ] Verified in browser at 60 FPS without memory leaks or frame rate spikes.
- [ ] Save/Load backward compatibility tested (if modifying save schemas).

## Screenshots / Profiler Traces (if applicable)

<!-- Attach screenshot, GIF, or Performance Profiler trace -->
