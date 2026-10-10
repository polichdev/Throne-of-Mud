import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import * as THREE from 'three';

registerHooks({
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const filename = fileURLToPath(url);
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName: filename, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
      }).outputText };
    }
    return next(url, context);
  },
});
const { cullHiddenGroupMatrices, useHiddenGroupCulling } = await import('../src/components/canvas/performance/hiddenGroupCulling.ts');
const { createUnitHeadGeometry } = await import('../src/components/canvas/units/unitHeadGeometry.ts');

const scene = new THREE.Scene(), root = new THREE.Group(), hidden = new THREE.Group();
const leaf = new THREE.Object3D();
scene.add(root); root.add(hidden); hidden.add(leaf);
root.position.set(2, 3, 4); hidden.position.set(1, 2, 3); leaf.position.set(3, 4, 5);
let visits = 0;
const originalLeafUpdate = leaf.updateMatrixWorld;
leaf.updateMatrixWorld = function (force) { visits++; originalLeafUpdate.call(this, force); };
const originalRootUpdate = root.updateMatrixWorld, originalHiddenUpdate = hidden.updateMatrixWorld;
scene.updateMatrixWorld();
const expected = leaf.matrixWorld.clone();
const release = cullHiddenGroupMatrices(root);
visits = 0; scene.updateMatrixWorld();
assert.equal(visits, 1, 'Visible descendants are visited normally');
assert.deepEqual(leaf.matrixWorld.elements, expected.elements, 'Visible world transform is preserved');

hidden.visible = false;
root.position.x += 10; hidden.position.y += 20; leaf.position.z += 30;
visits = 0; scene.updateMatrixWorld();
assert.equal(visits, 0, 'Hidden descendants receive no automatic matrix updates');
assert.deepEqual(leaf.matrixWorld.elements, expected.elements, 'Hidden subtree is left untouched');
assert.deepEqual(leaf.getWorldPosition(new THREE.Vector3()).toArray(), [16, 29, 42], 'Explicit world-coordinate reads still update hidden ancestors');
hidden.position.x += 5; leaf.position.y += 2;
scene.updateMatrixWorld();
hidden.visible = true;
scene.updateMatrixWorld();
assert.deepEqual(leaf.getWorldPosition(new THREE.Vector3()).toArray(), [21, 31, 42], 'Transforms catch up when visible again');

const releaseNested = cullHiddenGroupMatrices(hidden);
release(); release();
assert.equal(root.updateMatrixWorld, originalRootUpdate, 'Released root restores its method');
assert.notEqual(hidden.updateMatrixWorld, originalHiddenUpdate, 'Nested owner remains active');
releaseNested();
assert.equal(hidden.updateMatrixWorld, originalHiddenUpdate, 'Last owner restores the child method');
const releaseRemount = cullHiddenGroupMatrices(root);
releaseRemount();
assert.equal(hidden.updateMatrixWorld, originalHiddenUpdate, 'Remount cleanup is reversible');

const largeScene = new THREE.Scene(), largeRoot = new THREE.Group();
largeScene.add(largeRoot);
let descendantVisits = 0;
for (let i = 0; i < 100; i++) {
  const group = new THREE.Group(); group.visible = i < 10; largeRoot.add(group);
  for (let j = 0; j < 20; j++) {
    const part = new THREE.Object3D(), original = part.updateMatrixWorld;
    part.updateMatrixWorld = function (force) { descendantVisits++; original.call(this, force); };
    group.add(part);
  }
}
largeScene.updateMatrixWorld();
assert.equal(descendantVisits, 2000);
const releaseLarge = cullHiddenGroupMatrices(largeRoot);
descendantVisits = 0; largeScene.updateMatrixWorld();
assert.equal(descendantVisits, 200, 'Only the ten visible groups traverse their twenty descendants');
releaseLarge();

const originalHead = new THREE.BoxGeometry(0.22, 0.22, 0.22), head = createUnitHeadGeometry();
for (const name of ['position', 'normal', 'uv']) {
  assert.deepEqual(head.getAttribute(name).array, originalHead.getAttribute(name).array, `${name} remains unchanged`);
}
assert.deepEqual(head.groups, [
  { start: 0, count: 30, materialIndex: 0 }, { start: 30, count: 6, materialIndex: 1 },
]);
const faceOrder = [0, 1, 2, 3, 5, 4];
for (let face = 0; face < 6; face++) {
  for (let index = 0; index < 6; index++) {
    assert.equal(head.index.getX(face * 6 + index), originalHead.index.getX(faceOrder[face] * 6 + index), 'Original triangle index order is preserved');
  }
}
for (let index = 30; index < 36; index++) {
  const vertex = head.index.getX(index);
  assert.equal(head.getAttribute('normal').getZ(vertex), 1, 'Face texture remains on the +Z surface');
}
originalHead.dispose(); head.dispose();

const { createRoot, extend } = await import('@react-three/fiber');
extend(THREE);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const renderer = { render() {}, setPixelRatio() {}, setSize() {}, shadowMap: {}, xr: { isPresenting: false } };
const reactRoot = createRoot({ width: 100, height: 100 });
await reactRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
function Fixture({ hidden, extra }) {
  const ref = React.useRef(null);
  useHiddenGroupCulling(ref);
  return React.createElement('group', { ref, name: 'fixture', position: [5, 0, 0] },
    React.createElement('group', { name: 'branch', visible: !hidden },
      React.createElement('object3D', { name: 'leaf', position: [2, 0, 0] })),
    extra && React.createElement('group', { name: 'new-branch', visible: false },
      React.createElement('object3D', { name: 'new-leaf', position: [9, 0, 0] })));
}
let state;
async function renderFixture(props) {
  await React.act(async () => { state = reactRoot.render(React.createElement(React.StrictMode, null, React.createElement(Fixture, props))); });
  const scene = state.getState().scene;
  scene.updateMatrixWorld(true);
  return scene;
}
let mountedScene = await renderFixture({ hidden: true, extra: false });
const mountedGroup = mountedScene.getObjectByName('fixture');
assert.notEqual(mountedGroup.updateMatrixWorld, THREE.Object3D.prototype.updateMatrixWorld, 'StrictMode leaves the matrix hook installed');
assert.equal(mountedScene.getObjectByName('leaf').matrixWorld.elements[12], 0, 'Hidden branch is skipped after commit');
mountedScene = await renderFixture({ hidden: false, extra: true });
assert.equal(mountedScene.getObjectByName('leaf').matrixWorld.elements[12], 7, 'React reveal restores world coordinates');
const newBranch = mountedScene.getObjectByName('new-branch'), newLeaf = mountedScene.getObjectByName('new-leaf');
assert.notEqual(newBranch.updateMatrixWorld, THREE.Object3D.prototype.updateMatrixWorld, 'New conditional descendants are patched after commit');
assert.equal(newLeaf.matrixWorld.elements[12], 0);
newBranch.visible = true; mountedScene.updateMatrixWorld(true);
assert.equal(newLeaf.matrixWorld.elements[12], 14, 'Imperative reveal updates a newly added branch');
await React.act(async () => { reactRoot.unmount(); });
assert.equal(mountedGroup.updateMatrixWorld, THREE.Object3D.prototype.updateMatrixWorld, 'Unmount restores root method');
assert.equal(newBranch.updateMatrixWorld, THREE.Object3D.prototype.updateMatrixWorld, 'Unmount restores descendants');
console.log('Hidden matrix traversal, reveal transforms, explicit coordinate reads, overlapping cleanup and head geometry passed.');
console.log('R3F StrictMode, conditional children, visibility changes and unmount cleanup passed.');
console.log('Synthetic scene: descendant matrix visits 2000 -> 200 with 90 of 100 groups hidden; head material groups 6 -> 2. These are not FPS measurements.');
