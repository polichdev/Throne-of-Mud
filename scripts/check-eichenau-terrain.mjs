import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ctxProxy = new Proxy({}, { get: () => () => ctxProxy });
globalThis.document = {
  createElement() {
    return {
      getContext() {
        return ctxProxy;
      },
    };
  },
};

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL));
      for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
        if (fs.existsSync(candidate + ext) && fs.statSync(candidate + ext).isFile()) {
          return { url: pathToFileURL(candidate + ext).href, shortCircuit: true };
        }
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts') || url.endsWith('.tsx')) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(fs.readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      }).outputText,
    };
    return next(url, context);
  },
});

const { GridMap } = await import('../src/engine/grid/GridMap.ts');
const { DEFAULT_MAP_SEED, getPresetSpawnPoints } = await import('../src/constants/world.ts');
const { AStar } = await import('../src/engine/pathfinding/AStar.ts');
const { ensureEichenauSettlementAccess } = await import('../src/engine/grid/settlementAccess.ts');

function makeCamp(spawn) {
  const grid = new GridMap(384, 384, DEFAULT_MAP_SEED);
  const [cx, cz] = spawn;
  for (let x = cx - 4; x <= cx + 4; x++) {
    for (let z = cz - 4; z <= cz + 4; z++) {
      const tile = grid.getTile(x, z);
      if (tile && tile.terrain !== 'water') {
        tile.isPassable = true;
        tile.foliageType = undefined;
        tile.movementCost = 1;
      }
    }
  }
  grid.occupyForBuilding(cx, cz, 2, 2, 'fire');
  grid.occupyForBuilding(cx - 4, cz - 1, 3, 2, 'tent');
  grid.occupyForBuilding(cx + 3, cz - 1, 3, 2, 'mules');
  return grid;
}

const spawn = getPresetSpawnPoints(2).find((point) => point.id === 'sp-2-2').position;
const [cx, cz] = spawn;
const bounds = { minX: 0, maxX: 191, minZ: 232, maxZ: 383, regionId: 2 };
const starts = [[cx - 1, cz + 2], [cx + 2, cz - 1], [cx + 2, cz + 2]];
const site = [cx - 15, cz - 10];
const grid = makeCamp(spawn);
grid.occupyForBuilding(site[0], site[1], 4, 3, 'site');
const building = { id: 'site', isBuilding: true, isCompleted: false, gridPosition: site, buildingWidth: 4, buildingHeight: 3 };

assert.equal(AStar.findPathToArea(grid, starts[0], site[0], site[1], 4, 3, bounds), null,
  'the saved Eichenau layout starts with an unreachable worksite');
const removed = ensureEichenauSettlementAccess(grid, spawn, [building]);
assert.ok(removed > 0 && removed < 80, `repair should cut a narrow passage, removed ${removed} trees`);
for (const start of starts) {
  assert.ok(AStar.findPathToArea(grid, start, site[0], site[1], 4, 3, bounds),
    `settler at ${start} must reach the construction site`);
  assert.ok(AStar.findPathToArea(grid, start, cx - 4, cz - 1, 3, 2, bounds),
    `settler at ${start} must reach the tent storage`);
  assert.ok(AStar.findPathToArea(grid, start, cx + 3, cz - 1, 3, 2, bounds),
    `settler at ${start} must reach the hitching post`);
}
assert.equal(ensureEichenauSettlementAccess(grid, spawn, [building]), 0, 'repair is safe to rerun on loaded saves');
assert.equal(grid.getTile(site[0], site[1]).buildingId, 'site', 'repair never removes placed structures');

const newWorldGrid = makeCamp(spawn);
assert.ok(ensureEichenauSettlementAccess(newWorldGrid, spawn) > 0);
for (const target of [[cx, cz - 18], [cx, cz + 18]]) {
  assert.ok(AStar.findPath(newWorldGrid, starts[0], target, false, bounds),
    `a new settlement must connect to the surrounding region at ${target}`);
}
console.log('Eichenau access checks passed: saved worksite, tent, mule post, exterior paths and idempotence.');
