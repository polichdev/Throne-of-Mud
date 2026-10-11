import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';

async function load(relative) {
  const source = fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const { BuildingShadowState } = await load('../src/components/canvas/performance/BuildingShadowState.ts');
const { isBucketInBounds, markInstancePrefixForUpload } = await load('../src/components/canvas/performance/instanceUploads.ts');

const cache = new BuildingShadowState();
const house = { id: 'home', buildingType: 'peasant_house', position: [3, 0, 4], gridPosition: [1, 3], houseTier: 1, isCompleted: true };
const buildings = new Set([house]);
assert.equal(cache.update(buildings, null, 1), true);
assert.equal(cache.update(buildings, null, 1), false, 'Road/store revision alone does not invalidate shadows');
house.assignedWorkers = ['resident']; house.buildingHealth = 123;
assert.equal(cache.update(buildings, null, 1), false, 'Workers and health do not change shadow geometry');
assert.equal(cache.update(buildings, 'resident', 1), false, 'Selecting a character does not redraw building shadows');
assert.equal(cache.update(buildings, 'home', 1), true, 'Inspection removes a roof');
assert.equal(cache.update(buildings, 'home', 2), true, 'Changing inspected floors updates shadow geometry');
assert.equal(cache.update(buildings, null, 2), true, 'Closing inspection restores roof shadows');
for (const [field, value] of [['houseTier', 2], ['backyardExtension', 'goat_shed'], ['rotationAngle', Math.PI / 2],
  ['pendingHouseTier', 3], ['pendingBackyardExtension', 'vegetable_garden'], ['isDemolishing', true], ['isCompleted', false]]) {
  house[field] = value;
  assert.equal(cache.update(buildings, null, 2), true, `${field} invalidates shadows`);
  assert.equal(cache.update(buildings, null, 2), false);
}
house.position[0] += 2;
assert.equal(cache.update(buildings, null, 2), true, 'Mutable position changes are detected');
house.isCompleted = true;
assert.equal(cache.update(buildings, null, 2), true, 'Completion changes the model');
buildings.delete(house); buildings.add({ ...house, id: 'replacement' });
assert.equal(cache.update(buildings, null, 2), true, 'Same-count replacement is detected');
buildings.clear();
assert.equal(cache.update(buildings, null, 2), true, 'Demolition/removal updates cached shadows');

const bounds = { minBx: 2, maxBx: 5, minBz: 3, maxBz: 7 };
assert.equal(isBucketInBounds(2, 3, bounds), true);
assert.equal(isBucketInBounds(5, 7, bounds), true);
for (const [x, z] of [[1, 4], [6, 4], [3, 2], [3, 8]]) assert.equal(isBucketInBounds(x, z, bounds), false);
const matrices = new THREE.InstancedBufferAttribute(new Float32Array(6000 * 16), 16);
markInstancePrefixForUpload(matrices, 350);
assert.deepEqual(matrices.updateRanges, [{ start: 0, count: 350 * 16 }]);
const version = matrices.version;
markInstancePrefixForUpload(matrices, 120);
assert.deepEqual(matrices.updateRanges, [{ start: 0, count: 120 * 16 }], 'Pending unseen-buffer ranges are replaced by latest complete prefix');
assert.equal(matrices.version, version + 1);
markInstancePrefixForUpload(matrices, 0);
assert.deepEqual(matrices.updateRanges, []);
assert.equal(matrices.version, version + 1, 'Empty meshes need no upload');
markInstancePrefixForUpload(matrices, 8000);
assert.equal(matrices.updateRanges[0].count, matrices.array.length, 'Upload stays within allocated capacity');
const colors = new THREE.InstancedBufferAttribute(new Float32Array(2000 * 3), 3);
markInstancePrefixForUpload(colors, 120);
assert.deepEqual(colors.updateRanges, [{ start: 0, count: 360 }], 'Color ranges use three components per instance');
console.log('Shadow geometry invalidation, unrelated revisions, inspection, mutable changes, foliage bounds and bounded prefix uploads passed.');

const { measureRenderSubmission } = await load('../src/components/canvas/performance/renderSubmission.ts');
let clock = 0, received;
const renderer = { renderBufferDirect(...args) { assert.strictEqual(this, renderer); received = args; clock += 2; } };
const originalSubmission = renderer.renderBufferDirect;
const argumentsPassed = [new THREE.Camera(), new THREE.Scene(), new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), new THREE.Mesh(), null];
const measured = measureRenderSubmission(renderer, () => {
  clock += 10; renderer.renderBufferDirect(...argumentsPassed);
  clock += 7; renderer.renderBufferDirect(...argumentsPassed);
}, () => clock);
assert.deepEqual(measured, { cpuMs: 4, calls: 2 }, 'Submission probe excludes render-list work outside draw calls');
assert.deepEqual(received, argumentsPassed, 'Original renderer receives all original arguments');
assert.strictEqual(renderer.renderBufferDirect, originalSubmission, 'Native method is restored between samples');
assert.throws(() => measureRenderSubmission(renderer, () => { throw new Error('render failed'); }, () => clock), /render failed/);
assert.strictEqual(renderer.renderBufferDirect, originalSubmission, 'Failed render still restores native method');
const alternate = () => {};
measureRenderSubmission(renderer, () => { renderer.renderBufferDirect = alternate; }, () => clock);
assert.strictEqual(renderer.renderBufferDirect, alternate, 'Cleanup preserves a replacement installed by another owner');
argumentsPassed[2].dispose(); argumentsPassed[3].dispose();
console.log('Sampled CPU draw submission: timings, renderer context, arguments, native restoration and error cleanup passed.');
