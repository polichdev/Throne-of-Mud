import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
import { PackedMatrixList } from '../src/components/canvas/performance/PackedMatrixList.ts';

const sourceAt = relative => ts.createSourceFile(relative, fs.readFileSync(new URL(relative, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function declaration(source, name) {
  let match;
  function visit(node) { if (node.name?.getText(source) === name) match = node; if (!match) ts.forEachChild(node, visit); }
  visit(source); assert.ok(match, `Found ${name} in production source`); return match;
}
const js = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText.replace(/^export /gm, '');
const mathSource = sourceAt('../src/utils/mathUtils.ts');
const { pseudoRandom, distanceSq2D } = new Function(`${js(['pseudoRandom', 'distanceSq2D'].map(name => declaration(mathSource, name).getText(mathSource)).join('\n'))}; return {pseudoRandom,distanceSq2D};`)();
const treeSource = sourceAt('../src/engine/world/foliageGeneration.ts');
const getTreeProceduralData = new Function('pseudoRandom', `${js(declaration(treeSource, 'getTreeProceduralData').getText(treeSource))}; return getTreeProceduralData;`)(pseudoRandom);
import { HIGHWAYS } from '../src/constants/worldLayout.ts';
const gridSource = sourceAt('../src/engine/grid/GridMap.ts');
const GridMap = new Function('HIGHWAYS', `${js('class GridMap {' + ['getHighwayZ', 'getNorthHighway1X', 'getNorthHighway2X', 'getSouthHighwayX', 'isTradeHighwayTile'].map(name => declaration(gridSource, name).getText(gridSource)).join('\n') + '}')}; return GridMap;`)(HIGHWAYS);
const foliageSource = sourceAt('../src/components/canvas/FoliageRenderer.tsx');
const recipe = declaration(foliageSource, 'populateBucketFoliage').getText(foliageSource);
const compileRecipe = source => new Function('THREE', 'GridMap', 'pseudoRandom', 'distanceSq2D', 'getTreeProceduralData', `const BUCKET_SIZE=16; ${js(source)}; return populateBucketFoliage;`)(THREE, GridMap, pseudoRandom, distanceSq2D, getTreeProceduralData);
const packedRecipe = compileRecipe(recipe);
const originalRecipe = compileRecipe(recipe.replace(/bucket\.(\w+)\.clear\(\);/g, 'bucket.$1.length = 0;').replaceAll('push(dummy.matrix)', 'push(dummy.matrix.clone())'));
const keys = declaration(foliageSource, 'FoliageBucket').members.filter(member => member.type?.getText(foliageSource) === 'PackedMatrixList').map(member => member.name.getText(foliageSource));
const makeBucket = packed => Object.assign({ cx: 0, cz: 0, flowerColors: [] }, Object.fromEntries(keys.map(key => [key, packed ? new PackedMatrixList() : []])));
const grid = { width: 65, height: 49, tiles: [] };
const terrains = ['grass', 'grass', 'water', 'fertile_soil', 'mud'];
const foliageTypes = ['tree', 'fallen_tree', 'rock', 'bush', undefined];
for (let x = 0; x < grid.width; x++) {
  grid.tiles[x] = [];
  for (let z = 0; z < grid.height; z++) grid.tiles[x][z] = { height: .05 + pseudoRandom(x, z) * .3,
    terrain: (x + z) % 17 === 0 ? 'road' : terrains[(x + z * 3) % terrains.length], buildingId: (x * 3 + z) % 19 === 0 ? 'building' : undefined,
    foliageType: foliageTypes[(x * 7 + z) % foliageTypes.length], foliageTreeType: ['pine', 'oak', 'autumn'][(x + z) % 3], foliageAngle: pseudoRandom(z, x) * Math.PI * 2 };
}
const deposits = [{ type: 'berries', gridPosition: [11, 13] }, { type: 'stone', gridPosition: [31, 17] }];
let instances = 0, allocatedBytes = 0;
for (let bx = 0; bx < Math.ceil(grid.width / 16); bx++) for (let bz = 0; bz < Math.ceil(grid.height / 16); bz++) {
  const packed = makeBucket(true), original = makeBucket(false);
  originalRecipe(original, bx, bz, grid, new THREE.Object3D(), deposits);
  const clone = THREE.Matrix4.prototype.clone;
  THREE.Matrix4.prototype.clone = () => { throw new Error('Packed foliage must not clone per-instance matrices'); };
  try { packedRecipe(packed, bx, bz, grid, new THREE.Object3D(), deposits); }
  finally { THREE.Matrix4.prototype.clone = clone; }
  assert.deepEqual(packed.flowerColors, original.flowerColors, 'Flower colors stay paired with their transforms');
  for (const key of keys) {
    assert.equal(packed[key].length, original[key].length, `${key} instance count`);
    const expected = new Float32Array(original[key].flatMap(matrix => matrix.elements));
    const actual = new Float32Array(expected.length); packed[key].copyTo(actual, 0, Infinity);
    assert.deepEqual(actual, expected, `${key}: exact Float32 GPU data matches previous Matrix4 cache`);
    const limited = new Float32Array(11 * 16).fill(-999);
    const count = packed[key].copyTo(limited, 2, 7);
    assert.equal(count, Math.min(7, original[key].length));
    assert.deepEqual(limited.subarray(32, 32 + count * 16), expected.subarray(0, count * 16), 'Capacity limit preserves instance ordering');
    assert.ok(limited.subarray(0, 32).every(value => value === -999));
    assert.ok(limited.subarray(32 + count * 16).every(value => value === -999), 'Unused capacity remains untouched');
    instances += packed[key].length; allocatedBytes += packed[key].byteLength;
  }
  const sizes = keys.map(key => packed[key].byteLength);
  packedRecipe(packed, bx, bz, grid, new THREE.Object3D(), deposits);
  assert.deepEqual(keys.map(key => packed[key].byteLength), sizes, 'Dirty bucket regeneration reuses existing buffers');
  for (const key of keys) { const array = new Float32Array(original[key].length * 16); packed[key].copyTo(array, 0, Infinity); assert.deepEqual(array, new Float32Array(original[key].flatMap(matrix => matrix.elements)), 'Regeneration clears previous instances'); }
}
assert.ok(instances > 1000);
assert.ok(allocatedBytes < instances * 16 * 4 * 2, 'Capacity growth stays under twice the live Float32 data');
console.log(JSON.stringify({ instances, perInstanceMatrixObjectsRemoved: instances, packedAllocatedBytes: allocatedBytes,
  checks: 'Actual production foliage recipe; exact GPU matrices/colors for terrain, trees/fallen trees, grass, bushes, rocks, water plants, roads/buildings/deposits, truncated uploads, map edges and buffer reuse. No browser/GPU timing claimed.' }));
