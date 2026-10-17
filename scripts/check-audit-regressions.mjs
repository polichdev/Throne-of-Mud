import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL));
      for (const ext of ['', '.ts']) {
        if (fs.existsSync(candidate + ext) && fs.statSync(candidate + ext).isFile()) {
          return { url: pathToFileURL(candidate + ext).href, shortCircuit: true };
        }
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!url.endsWith('.ts')) return next(url, context);
    let source = fs.readFileSync(new URL(url), 'utf8');
    // Isolate the search algorithms from procedural world generation and the store.
    if (url.endsWith('/GridMap.ts')) source = 'export class GridMap {}';
    if (url.endsWith('/buildingValidation.ts')) source = 'export const isRoadOverlappingDeposit = () => false;';
    source = source.replaceAll('import.meta.env.BASE_URL', JSON.stringify('./'));
    return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText };
  },
});

const { AStar } = await import('../src/engine/pathfinding/AStar.ts');
const { getSmartRoadPath } = await import('../src/engine/grid/roadGeneration.ts');
function grid(width, height, blocked = new Set()) {
  return {
    width, height,
    isWalkable(x, z) { return x >= 0 && z >= 0 && x < width && z < height && !blocked.has(`${x},${z}`); },
    getTile(x, z) {
      if (x < 0 || z < 0 || x >= width || z >= height) return undefined;
      return { terrain: blocked.has(`${x},${z}`) ? 'water' : 'grass', movementCost: 1 };
    },
    getNeighbors(x, z) {
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => ({ x: x + dx, z: z + dz }));
    },
  };
}

const isolated = new Set(['0,0', '1,0', '2,0', '0,1', '2,1', '0,2', '1,2', '2,2']);
const wide = grid(600, 600, isolated);
assert.equal(AStar.findPath(wide, [1, 1], [3, 1]), null);
assert.ok(AStar.findPath(wide, [257, 1], [259, 1]), 'Coordinates separated by 256 must not alias');
assert.deepEqual(AStar.findPath(wide, [597, 598], [599, 598]), [[597, 598], [598, 598], [599, 598]], 'Buffers must grow past 512 squared');
assert.ok(AStar.findPath(grid(600, 600), [1, 1], [3, 1]), 'Another map must not reuse unreachable results');

const wall = new Set(['2,0', '2,1', '2,2']);
const bounded = grid(5, 5, wall);
assert.equal(AStar.findPath(bounded, [1, 1], [3, 1], false, { minX: 0, maxX: 4, minZ: 0, maxZ: 2 }), null);
assert.ok(AStar.findPath(bounded, [1, 1], [3, 1]), 'A restricted search must not poison an unrestricted search');
wall.clear();
AStar.clearUnreachableCache();
assert.ok(AStar.findPath(bounded, [1, 1], [3, 1], false, { minX: 0, maxX: 4, minZ: 0, maxZ: 2 }));
const road = getSmartRoadPath(grid(600, 600, new Set(['597,598'])), 595, 598, 599, 598);
assert.deepEqual(road[0], [595, 598]);
assert.deepEqual(road.at(-1), [599, 598]);
assert.ok(road.every(([x, z]) => x !== 597 || z !== 598), 'Road must detour around the obstacle');

const { AssetLoader } = await import('../src/engine/assets/AssetLoader.ts');
const originalLoad = THREE.TextureLoader.prototype.load;
let failMud = true;
const requested = [];
let disposed = 0;
THREE.TextureLoader.prototype.load = function (url, onLoad, _progress, onError) {
  requested.push(url);
  const texture = new THREE.Texture();
  texture.addEventListener('dispose', () => disposed++);
  queueMicrotask(() => failMud && url.endsWith('/mud.png') ? onError(new Error('missing')) : onLoad(texture));
  return texture;
};
try {
  const loader = new AssetLoader();
  let pending;
  try { loader.readTerrainTextures(); } catch (value) { pending = value; }
  assert.ok(pending instanceof Promise);
  assert.equal(requested.length, 4, 'All textures must start together');
  await pending;
  assert.throws(() => loader.readTerrainTextures(), /Failed to load texture/);
  failMud = false;
  loader.retryFailed();
  assert.equal(disposed, 1);
  try { loader.readTerrainTextures(); } catch (value) { pending = value; }
  await pending;
  const textures = loader.readTerrainTextures();
  assert.equal(requested.length, 5, 'Retry must preserve successful cached textures');
  assert.ok(requested.every(url => url.startsWith('./assets/')));
  assert.equal(loader.readTerrainTextures().grass, textures.grass);
  assert.equal(textures.stone.repeat.x, 20);
  loader.dispose();
  assert.equal(disposed, 5, 'Dispose every owned texture exactly once');
} finally {
  THREE.TextureLoader.prototype.load = originalLoad;
}
console.log('Audit regressions: path buffers, cache isolation, road routing, Suspense/error/retry/disposal PASS');
