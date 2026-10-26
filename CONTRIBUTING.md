# Contributing to Throne of Mud

Thank you for your interest in contributing to **Throne of Mud**! We welcome contributions to our 3D engine, ECS simulation logic, shaders, assets, localization, and tooling.

---

## Code of Conduct

All contributors and maintainers are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## Development Workflow

### Prerequisites
- **Node.js**: `>=22.12.0` or `^20.19.0` (tested with Node.js v24 LTS)
- **npm**: `>=10.0.0`
- **Git**
- WebGL 2.0 compatible GPU / browser

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/polichdev/throne-of-mud.git
cd throne-of-mud

# Install dependencies (runs postinstall electron-builder patch automatically)
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your WebGL-capable browser.

---

## Architecture & Code Quality Standards

Before submitting changes, review our architectural documentation:
- [System Architecture](docs/ARCHITECTURE.md)
- [Repository Structure](docs/STRUCTURE.md)
- [Simulation Tick & Game Loop](docs/SIMULATION_TICK.md)
- [Performance & Draw Call Budget](docs/PERFORMANCE_BUDGET.md)

### Engineering Rules to Follow

1. **Zero Allocations in the Hot Loop:**
   Never allocate objects, arrays, or anonymous closures inside `useFrame`, `requestAnimationFrame`, or ECS per-entity iterations. Reuse scratch vectors, matrices (`PackedMatrixList`), and pre-allocated pools.

2. **Decoupled ECS Simulation:**
   Keep gameplay state in Miniplex entities and systems (`src/engine/ecs/systems/`). React components in `src/components/ui/` should only observe state via Zustand slices (`src/store/`) or entity helpers. Never store gameplay state inside React component local state (`useState`).

3. **Draw Call Optimization & Batching:**
   Any new 3D model, prop, or foliage item must be integrated into our instanced batching pipeline (`BuildingMeshBatches.ts`, `HouseMultiDrawBatches.ts`, or `FoliageRenderer.tsx`). Avoid individual unbatched `<mesh>` primitives for repeated world objects.

4. **Type Safety & Linting:**
   Strict TypeScript 6 mode is enforced with no `any` leaks. Code must pass linting without errors:
   ```bash
   npm run lint
   npm run build
   ```

5. **Performance Regression Tests:**
   Run the dedicated graphics and batching validation checks:
   ```bash
   node scripts/check-house-batching.mjs
   node scripts/check-unit-batching.mjs
   node scripts/check-building-batching.mjs
   node scripts/check-foliage-packing.mjs
   node scripts/check-point-light-range.mjs
   node scripts/check-render-invalidation.mjs
   ```

---

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(engine)`: Add mule hauling queue prioritization
- `feat(render)`: Dynamic snow accumulation vertex shader
- `fix(pathfinding)`: Prevent corner-cutting on diagonal wall gates
- `perf(instancing)`: Reduce matrix buffer uploads for idle units
- `docs(adr)`: Document ADR-005 fixed timestep simulation loop
- `refactor(store)`: Decouple settlement resources into diplomacySlice

---

## Submitting Pull Requests

1. Fork the repository and create your feature branch from `main`:
   ```bash
   git checkout -b feat/dynamic-weather-seasons
   ```
2. Write clean, modular, and well-typed code following existing patterns.
3. Verify that `npm run lint` and `npm run build` pass without warnings or errors.
4. Verify batching scripts execute cleanly.
5. Push to your fork and submit a PR using the provided [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
