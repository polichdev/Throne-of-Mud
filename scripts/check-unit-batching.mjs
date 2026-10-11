import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import * as THREE from 'three';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL));
      for (const extension of ['', '.ts', '.tsx']) if (fs.existsSync(candidate + extension)) return { url: pathToFileURL(candidate + extension).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    const filename = url.startsWith('file:') ? fileURLToPath(url).replaceAll('\\', '/') : '';
    let source;
    if (filename.endsWith('/store/useGameStore.ts')) {
      source = 'export const useGameStore = selector => selector(globalThis.__unitTestState); useGameStore.getState=()=>globalThis.__unitTestState;';
    } else if (filename.endsWith('/engine/ecs/world.ts')) {
      source = 'export const characterEntities = new Set(); export const buildingEntities = new Set();';
    } else if (filename.endsWith('/engine/audio/AudioManager.ts')) {
      source = 'export const audioManager = new Proxy({}, { get: () => () => {} });';
    } else if (filename.endsWith('/units/unitTextures.ts')) {
      source = "import * as THREE from 'three'; export const createTunicCanvas=()=>({}),createTrousersCanvas=()=>({}),createFaceCanvas=()=>({}),createLeatherCanvas=()=>({}),createShieldCanvas=()=>({}); export const makeTextureFromCanvas=()=>new THREE.Texture();";
    } else if (/\.(ts|tsx)$/.test(filename) && filename.startsWith(root.replaceAll('\\', '/'))) source = fs.readFileSync(filename, 'utf8');
    if (source !== undefined) return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, { fileName: filename,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX } }).outputText };
    return next(url, context);
  },
});

const { createRoot, extend, advance } = await import('@react-three/fiber');
const { UnitsRenderer } = await import('../src/components/canvas/UnitsRenderer.tsx');
const { AnimatedMeshBatches } = await import('../src/components/canvas/units/AnimatedMeshBatches.ts');
const { characterEntities, buildingEntities } = await import('../src/engine/ecs/world.ts');
extend(THREE);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = { __lastCameraTarget: [16, 16], __lastCameraZoom: 38 };
globalThis.__unitTestState = { selectedEntityId: null, selectedMilitiaSquadId: null, previewAnimation: null, houseFloorView: 1, isStrategicView: false,
  time: { hour: 12, minute: 0, isPaused: true, speedMultiplier: 1 },
  setSelectedEntityId(id) { globalThis.__unitTestState.selectedEntityId = id; },
  setSelectedMilitiaSquadId(id) { globalThis.__unitTestState.selectedMilitiaSquadId = id; },
  registerTreeHit() {},
};
const units = Array.from({ length: 45 }, (_, i) => ({ id: `peasant-${i}`, characterClass: 'peasant', position: [8 + i % 9 * 2, 0, 8 + Math.floor(i / 9) * 2], path: [] }));
units.forEach(unit => characterEntities.add(unit));
const renderer = { extensions: { has: () => process.env.TEST_UNIT_MULTI_DRAW === '1' }, render(scene, camera) { scene.updateMatrixWorld(); scene.onBeforeRender(this, scene, camera, null); },
  setPixelRatio() {}, setSize() {}, shadowMap: {}, xr: { isPresenting: false } };
const sceneRoot = createRoot({ width: 100, height: 100 });
await sceneRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
let state, frame = 0;
async function draw(rerender = false) {
  if (rerender) await React.act(async () => { state = sceneRoot.render(React.createElement(UnitsRenderer)); });
  await React.act(async () => {
    advance(++frame / 60, false, state.getState());
  });
  return state.getState().scene;
}
function parts(scene, respectLayers) {
  const result = [];
  scene.traverseVisible(mesh => {
    if (!mesh.isMesh || respectLayers && !(mesh.layers.mask & 1)) return;
    if (mesh.isBatchedMesh) {
      for (let i = 0; i < mesh._instanceInfo.length; i++) {
        const instance = mesh._instanceInfo[i];
        if (!instance.active || !instance.visible) continue;
        const info = mesh.getGeometryRangeAt(instance.geometryIndex);
        const matrix = new THREE.Matrix4(); mesh.getMatrixAt(i, matrix); matrix.premultiply(mesh.matrixWorld);
        result.push({ mesh, material: mesh.material, matrix, begin: info.indexStart, end: info.indexStart + info.indexCount });
      }
      return;
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = Array.isArray(mesh.material) ? mesh.geometry.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
    for (const group of groups) {
      const material = materials[group.materialIndex ?? 0];
      if (!material?.visible) continue;
      const begin = Math.max(group.start, mesh.geometry.drawRange.start);
      const end = Math.min(group.start + group.count, mesh.geometry.drawRange.start + mesh.geometry.drawRange.count,
        mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count);
      if (mesh.isInstancedMesh) {
        for (let i = 0; i < mesh.count; i++) {
          const matrix = new THREE.Matrix4(); mesh.getMatrixAt(i, matrix); matrix.premultiply(mesh.matrixWorld);
          result.push({ mesh, material, matrix, begin, end });
        }
      } else result.push({ mesh, material, matrix: mesh.matrixWorld, begin, end });
    }
  });
  return result;
}
function triangles(drawParts) {
  const buckets = new Map();
  for (const { mesh, material, matrix, begin, end } of drawParts) {
    const geometry = mesh.geometry;
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const key = `${material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
    const list = buckets.get(key) ?? []; buckets.set(key, list);
    for (let i = begin; i < end; i += 3) {
      const triangle = [];
      for (let j = 0; j < 3; j++) {
        const vertex = geometry.index?.getX(i + j) ?? i + j;
        const p = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, vertex).applyMatrix4(matrix);
        const n = new THREE.Vector3().fromBufferAttribute(geometry.attributes.normal, vertex).applyNormalMatrix(normalMatrix);
        triangle.push(...p.toArray(), ...n.toArray(), geometry.attributes.uv.getX(vertex), geometry.attributes.uv.getY(vertex));
      }
      list.push(triangle);
    }
  }
  return buckets;
}
function assertPoseParity(scene, message) {
  const rig = scene.children.find(group => group.__r3f);
  const expected = triangles(parts(rig, false)), actual = triangles(parts(scene, true));
  assert.equal(actual.size, expected.size, message + ': materials');
  for (const [key, reference] of expected) {
    const found = actual.get(key); assert.ok(found, message + ': material present');
    assert.equal(found.length, reference.length, message + ': triangles');
    const tolerance = .00003, cells = new Map();
    for (const triangle of reference) {
      const cell = triangle.slice(0, 3).map(value => Math.floor(value / tolerance)).join(':');
      const bucket = cells.get(cell) ?? []; bucket.push(triangle); cells.set(cell, bucket);
    }
    for (const triangle of found) {
      const [x, y, z] = triangle.slice(0, 3).map(value => Math.floor(value / tolerance));
      let matched = false;
      search: for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const bucket = cells.get(`${x + dx}:${y + dy}:${z + dz}`);
        const index = bucket?.findIndex(candidate => triangle.every((value, j) => Math.abs(value - candidate[j]) < tolerance)) ?? -1;
        if (index >= 0) { bucket.splice(index, 1); matched = true; break search; }
      }
      assert.ok(matched, message + ': world position/normal/UV');
    }
  }
  return rig;
}
function drawCount(scene, respectLayers) {
  return new Set(parts(scene, respectLayers).map(part => `${part.mesh.uuid}:${part.material.uuid}:${part.mesh.isBatchedMesh ? 0 : part.begin}`)).size;
}

let scene = await draw(true);
let rig = assertPoseParity(scene, '45 idle peasants');
const before = drawCount(rig, false), after = drawCount(scene, true);
assert.ok(after < before * 0.45, 'Shared unit parts remove more than half of original draw calls');
console.log(JSON.stringify({ peasants: 45, originalDraws: before, batchedDraws: after, mode: process.env.TEST_UNIT_MULTI_DRAW === '1' ? 'multi-draw' : 'instancing fallback', excludes: 'buildings, terrain, shadows and DOM' }));
const unitBatches = scene.children.find(group => !group.__r3f).children;
const uploadVersion = mesh => mesh.isBatchedMesh ? mesh._matricesTexture.version : mesh.instanceMatrix.version;
const pausedVersions = unitBatches.map(uploadVersion);
for (let i = 0; i < 30; i++) await draw();
assert.deepEqual(unitBatches.map(uploadVersion), pausedVersions, 'Unchanged paused poses skip all 30 matrix uploads');
const batchIds = scene.children.find(group => !group.__r3f).children.map(mesh => mesh.uuid);
await draw(true);
assert.deepEqual(scene.children.find(group => !group.__r3f).children.map(mesh => mesh.uuid), batchIds, 'Unchanged React revisions reuse buffers');

globalThis.__unitTestState.time.isPaused = false;
await draw(true);
for (let i = 0; i < 12; i++) { units[i].path = [[40, 40]]; units[i].position[0] += 0.05; }
scene = await draw(); assertPoseParity(scene, 'Walking and breathing');
units[12].currentJob = { id: 'chop', type: 'chop_tree', targetPosition: [12, 12] };
units[13].currentJob = { id: 'build', type: 'build_structure', targetPosition: [12, 12] };
units[14].currentJob = { id: 'mine', type: 'mine_rock', targetPosition: [12, 12] };
units[15].currentJob = { id: 'sleep', type: 'sleep', targetAngle: 1.2, targetPosition: [12, 0, 12] };
window.__lastCameraZoom = 45;
scene = await draw(); assertPoseParity(scene, 'Tools, sleeping poses, hats and near details');

const house = { id: 'home', buildingType: 'peasant_house' }; buildingEntities.add(house);
units[16].currentJob = { id: 'upstairs-sleep', type: 'sleep', targetBuildingId: 'home', bedIndex: 2, targetPosition: [12, 2.7, 12] };
scene = await draw(); rig = assertPoseParity(scene, 'Hidden upstairs sleeper');
assert.equal(rig.children[16].visible, false);
globalThis.__unitTestState.selectedEntityId = 'home'; globalThis.__unitTestState.houseFloorView = 2;
scene = await draw(true); rig = assertPoseParity(scene, 'Visible inspected upstairs sleeper');
assert.equal(rig.children[16].visible, true);

globalThis.__unitTestState.selectedEntityId = units[20].id;
scene = await draw(true); rig = assertPoseParity(scene, 'Selection ring');
const hits = new THREE.Raycaster(new THREE.Vector3(units[20].position[0], 10, units[20].position[2]), new THREE.Vector3(0, -1, 0)).intersectObject(rig.children[20], true);
const colliderHit = hits.find(hit => hit.object.__r3f?.handlers.onClick);
assert.ok(colliderHit, 'Original collider remains selectable');
colliderHit.object.__r3f.handlers.onClick({ stopPropagation() {} });
assert.equal(globalThis.__unitTestState.selectedEntityId, units[20].id);

window.__lastCameraTarget = [1000, 1000]; scene = await draw();
assert.equal(drawCount(scene, true), 0, 'Camera distance hides all instance sources');
window.__lastCameraTarget = [16, 16]; scene = await draw(); assertPoseParity(scene, 'Camera return');
globalThis.__unitTestState.isStrategicView = true;
scene = await draw(true); assert.equal(drawCount(scene, true), 0, 'Strategic mode hides batches');
globalThis.__unitTestState.isStrategicView = false;
scene = await draw(true); assertPoseParity(scene, 'Strategic exit');

characterEntities.delete(units[0]); await draw(); scene = await draw(); assertPoseParity(scene, 'Removed unit');
const newUnit = { id: 'new-peasant', characterClass: 'peasant', position: [20, 0, 20], path: [] };
characterEntities.add(newUnit); await draw(); scene = await draw(); assertPoseParity(scene, 'New resident');
await React.act(async () => sceneRoot.unmount());
assert.equal(scene.children.length, 0, 'Unmount removes imperative batches');

const strictRoot = createRoot({ width: 100, height: 100 });
await strictRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
await React.act(async () => { state = strictRoot.render(React.createElement(React.StrictMode, null, React.createElement(UnitsRenderer))); });
await React.act(async () => { advance(++frame / 60, false, state.getState()); });
assertPoseParity(state.getState().scene, 'StrictMode remount');
await React.act(async () => strictRoot.unmount());
assert.equal(state.getState().scene.children.length, 0, 'StrictMode cleanup removes all batches');

const pureScene = new THREE.Scene(), pureRoot = new THREE.Group(); pureScene.add(pureRoot);
const geo = new THREE.BoxGeometry(), mat = new THREE.MeshStandardMaterial();
const first = new THREE.Mesh(geo, mat), second = new THREE.Mesh(geo, mat); pureRoot.add(first, second);
first.layers.set(3); second.layers.set(3); first.position.set(3, 2, 1); second.position.set(1, 2, 3);
const batcher = new AnimatedMeshBatches(); pureScene.add(batcher.group); batcher.sync(pureRoot);
pureScene.updateMatrixWorld(); batcher.update();
assert.equal(first.layers.mask, 0); assert.equal(batcher.group.children[0].layers.mask, 8, 'Original rendering layers are retained');
const fixtureBatch = batcher.group.children[0], staticVersion = fixtureBatch.instanceMatrix.version;
batcher.update(); assert.equal(fixtureBatch.instanceMatrix.version, staticVersion, 'Static unit matrices are not re-uploaded');
first.visible = false; batcher.update(); assert.equal(fixtureBatch.count, 1);
const compacted = new THREE.Matrix4(); fixtureBatch.getMatrixAt(0, compacted);
assert.ok(compacted.equals(second.matrixWorld), 'Visibility compacts remaining units into the correct slot');
first.visible = true; batcher.update(); assert.equal(fixtureBatch.count, 2);
fixtureBatch.getMatrixAt(0, compacted); assert.ok(compacted.equals(first.matrixWorld), 'Reappearing unit restores the correct slot');
batcher.group.position.x = 10; pureScene.updateMatrixWorld(); batcher.update();
fixtureBatch.getMatrixAt(0, compacted); compacted.premultiply(fixtureBatch.matrixWorld);
assert.ok(compacted.equals(first.matrixWorld), 'Moving a batch parent preserves source world positions');
const oldBatch = batcher.group.children[0]; let disposedBuffers = 0;
oldBatch.addEventListener('dispose', () => disposedBuffers++);
for (let i = 0; i < 3; i++) { const source = new THREE.Mesh(geo, mat); source.layers.set(3); pureRoot.add(source); }
batcher.sync(pureRoot); pureScene.updateMatrixWorld(); batcher.update();
assert.equal(batcher.group.children[0].count, 5, 'Population growth increases live instance count');
assert.equal(batcher.group.children[0].instanceMatrix.count, 8, 'Population growth reserves reusable buffer capacity');
assert.equal(disposedBuffers, 1, 'Replaced instance buffers are released');
pureRoot.remove(first); batcher.sync(pureRoot); pureScene.updateMatrixWorld(); batcher.update();
assert.equal(first.layers.mask, 8, 'Removed source restores its original layers');
assert.equal(batcher.group.children[0].count, 4, 'Removed source leaves no ghost instance');
let disposedShared = 0; geo.addEventListener('dispose', () => disposedShared++); mat.addEventListener('dispose', () => disposedShared++);
batcher.dispose(); assert.equal(first.layers.mask, 8); assert.equal(second.layers.mask, 8); assert.equal(disposedShared, 0);
console.log('Unit integration: world geometry/normals/UV/material parity for poses and tools, floor visibility, selection, distance, strategic mode, add/remove, buffer reuse and cleanup passed.');
