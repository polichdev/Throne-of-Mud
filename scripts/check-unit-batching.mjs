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
const { UnitsRenderer } = await import('../src/components/canvas/units/UnitsRenderer.tsx');
const { AnimatedMeshBatches } = await import('../src/components/canvas/units/AnimatedMeshBatches.ts');
const { BuildingMeshBatches } = await import('../src/components/canvas/buildings/BuildingMeshBatches.ts');
const { registerColorBatchMaterial } = await import('../src/components/canvas/performance/colorBatchMaterials.ts');
const { groundShadowMaterial, GROUND_SHADOW_RENDER_ORDER } = await import('../src/components/canvas/performance/groundShadows.ts');
const { getSceneRenderTaskCount } = await import('../src/components/canvas/performance/sceneRenderTasks.ts');
const { useStaticUnitMeshMatrices } = await import('../src/components/canvas/units/useStaticUnitMeshMatrices.ts');
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
let prepareNativeDraws = false;
const renderer = { extensions: { has: () => process.env.TEST_UNIT_MULTI_DRAW === '1' }, render(scene, camera) {
  scene.updateMatrixWorld(); scene.onBeforeRender(this, scene, camera, null);
  if (prepareNativeDraws) scene.traverseVisible(mesh => {
    if (mesh.isBatchedMesh) mesh.onBeforeRender(this, scene, camera, mesh.geometry, mesh.material);
  });
},
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
        const color = new THREE.Color(); mesh.getColorAt(i, color);
        result.push({ mesh, material: mesh.material, color, matrix, begin: info.indexStart, end: info.indexStart + info.indexCount });
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
          const color = new THREE.Color(); mesh.getColorAt(i, color);
          result.push({ mesh, material, color, matrix, begin, end });
        }
      } else result.push({ mesh, material, matrix: mesh.matrixWorld, begin, end });
    }
  });
  return result;
}
function triangles(drawParts) {
  const buckets = new Map();
  for (const { mesh, material, color, matrix, begin, end } of drawParts) {
    const geometry = mesh.geometry;
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const properties = material.toJSON(); delete properties.uuid; delete properties.metadata; delete properties.name;
    if (color && material.color) properties.color = material.color.clone().multiply(color).getHex();
    const key = `${JSON.stringify(properties)}:${material.customProgramCacheKey()}:${mesh.castShadow}:${mesh.receiveShadow}:${mesh.renderOrder}`;
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
function sceneStats(scene) {
  let objects = 0, meshes = 0;
  scene.traverse(node => { objects++; if (node.isMesh) meshes++; });
  return { objects, meshes, callbacks: state.getState().internal.subscribers.length };
}
console.log(JSON.stringify({ idlePopulation: 45, ...sceneStats(scene) }));
const before = drawCount(rig, false), after = drawCount(scene, true);
assert.ok(after < before * 0.45, 'Shared unit parts remove more than half of original draw calls');
console.log(JSON.stringify({ peasants: 45, originalDraws: before, batchedDraws: after, mode: process.env.TEST_UNIT_MULTI_DRAW === '1' ? 'multi-draw' : 'instancing fallback', excludes: 'buildings, terrain, shadow-map passes and DOM' }));
const visibleShadows = [...new Set(parts(scene, true).filter(part => part.material === groundShadowMaterial).map(part => part.mesh))];
assert.equal(visibleShadows.length, 1, 'All 45 peasant ground shadows use one draw group');
assert.equal(visibleShadows[0].renderOrder, GROUND_SHADOW_RENDER_ORDER, 'Ground shadows precede transparent rings and airborne effects');
assert.equal(parts(scene, true).filter(part => part.material === groundShadowMaterial).length, 45, 'All 45 original shadow circles remain');
if (process.env.PROFILE_MATERIALS === '1') {
  const meshes = [...new Set(parts(scene, true).map(part => part.mesh))];
  const groups = new Map();
  for (const mesh of meshes) {
    const material = mesh.material;
    const label = material.map ? `textured / roughness ${material.roughness}` : `solid / roughness ${material.roughness} / metalness ${material.metalness} / flat ${material.flatShading}`;
    groups.set(label, (groups.get(label) ?? 0) + 1);
  }
  console.log(JSON.stringify({ materialDrawGroups: Object.fromEntries(groups) }));
}
const unitBatches = scene.children.find(group => !group.__r3f).children;
const uploadVersion = mesh => mesh.isBatchedMesh ? mesh._matricesTexture.version : mesh.instanceMatrix.version;
const pausedVersions = unitBatches.map(uploadVersion);
for (let i = 0; i < 30; i++) await draw();
assert.deepEqual(unitBatches.map(uploadVersion), pausedVersions, 'Unchanged paused poses skip all 30 matrix uploads');
const batchIds = scene.children.find(group => !group.__r3f).children.map(mesh => mesh.uuid);
await draw(true);
assert.deepEqual(scene.children.find(group => !group.__r3f).children.map(mesh => mesh.uuid), batchIds, 'Unchanged React revisions reuse buffers');

if (process.env.TEST_UNIT_SCALING === '1') {
  const distant = Array.from({ length: 195 }, (_, i) => ({ id: `distant-${i}`, characterClass: 'peasant', position: [2000 + i * 2, 0, 2000], path: [] }));
  distant.forEach(unit => characterEntities.add(unit));
  await draw(); scene = await draw();
  assertPoseParity(scene, '240 residents with 45 near the camera');
  globalThis.__unitTestState.time.isPaused = false; await draw(true);
  prepareNativeDraws = true;
  const timings = [];
  for (let block = 0; block < 5; block++) {
    const started = performance.now();
    await React.act(async () => {
      for (let i = 0; i < 600; i++) advance(++frame / 60, false, state.getState());
    });
    timings.push((performance.now() - started) / 600);
  }
  console.log(JSON.stringify({ scalingPopulation: 240, visibleResidents: 45, ...sceneStats(scene), cpuOnlyFrameMs: timings, excludes: 'GPU, browser layout and full game simulation' }));
  prepareNativeDraws = false;
  distant.forEach(unit => characterEntities.delete(unit));
  await draw(); scene = await draw();
  globalThis.__unitTestState.time.isPaused = true; await draw(true);
}

if (process.env.TEST_UNIT_LONG_RUN === '1') {
  globalThis.__unitTestState.time.isPaused = false; await draw(true);
  const baseline = {
    callbacks: state.getState().internal.subscribers.length,
    tasks: getSceneRenderTaskCount(scene),
    batches: scene.children.find(group => !group.__r3f).children.map(mesh => mesh.uuid),
    objects: 0,
  };
  scene.traverse(() => baseline.objects++);
  const initialX = units[0].position[0]; units[0].path = [[40, 40]];
  const blocks = [];
  for (let block = 0; block < 30; block++) {
    const started = performance.now();
    await React.act(async () => {
      for (let i = 0; i < 3300; i++) {
        units[0].position[0] = initialX + Math.sin(frame / 30);
        window.__lastCameraTarget = block % 5 === 0 ? [1000, 1000] : [16, 16];
        advance(++frame / 60, false, state.getState());
      }
    });
    blocks.push(performance.now() - started);
    await draw(true);
    let objects = 0; scene.traverse(() => objects++);
    assert.equal(objects, baseline.objects, 'Long run does not accumulate scene objects');
    assert.equal(state.getState().internal.subscribers.length, baseline.callbacks, 'Long run and React commits do not accumulate frame subscriptions');
    assert.equal(getSceneRenderTaskCount(scene), baseline.tasks, 'Long run does not accumulate scene render tasks');
    const liveBatches = scene.children.find(group => !group.__r3f).children;
    assert.deepEqual(liveBatches.map(mesh => mesh.uuid), baseline.batches, 'Long run retains the original batch buffers');
  }
  units[0].position[0] = initialX; units[0].path = [];
  window.__lastCameraTarget = [16, 16]; globalThis.__unitTestState.time.isPaused = true;
  scene = await draw(true); assertPoseParity(scene, 'After 99,000 animated/camera frames');
  console.log(JSON.stringify({ longRunFrames: 99000, equivalentMinutesAt165Hz: 10, ...baseline,
    batches: baseline.batches.length, firstVisibleBlockMs: Math.round(blocks[1]), lastVisibleBlockMs: Math.round(blocks.at(-1)),
    checks: 'No scene-object, callback, render-task or batch-buffer accumulation; headless CPU only, no real GPU/FPS measurement' }));
}

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

// Mutating equipment in the ECS must mount/remove models without a parent render.
const unequippedStats = sceneStats(scene);
const companionGeometries = new Set();
let companionGeometryDisposals = 0;
for (let cycle = 0; cycle < 3; cycle++) {
  units[21].hasMule = true; units[21].inventory = { wood: 2 };
  units[22].isMerchant = true;
  units[23].hasHorseCart = true;
  units[24].muleTransition = 'taking'; units[24].muleTransitionProgress = .5;
  units[24].assignedMuleHutId = 'hitch';
  const hitch = { id: 'hitch', buildingType: 'mule_hut', position: [12, 0, 12] };
  buildingEntities.add(hitch);
  await draw(); scene = await draw(); rig = assertPoseParity(scene, 'ECS equips mules, merchant and horse cart');
  assert.ok(rig.children[21].getObjectByName('mule-companion')?.visible);
  assert.ok(rig.children[22].getObjectByName('horse-cart-companion')?.visible);
  assert.ok(rig.children[23].getObjectByName('horse-cart-companion')?.visible);
  assert.ok(rig.children[24].getObjectByName('mule-companion')?.visible, 'Taking transition mounts a mule before hasMule is set');
  assert.equal(sceneStats(scene).callbacks, unequippedStats.callbacks + 4, 'Only equipped residents register companion callbacks');
  const bodyGeometry = rig.children[22].getObjectByName('horse-cart-companion').children[2].geometry;
  assert.equal(bodyGeometry, rig.children[23].getObjectByName('horse-cart-companion').children[2].geometry, 'Companions share their original geometry');
  for (const index of [21, 22, 23, 24]) {
    const companion = rig.children[index].getObjectByName(index === 21 || index === 24 ? 'mule-companion' : 'horse-cart-companion');
    companion.traverse(node => {
      if (!node.isMesh || companionGeometries.has(node.geometry)) return;
      companionGeometries.add(node.geometry);
      node.geometry.addEventListener('dispose', () => companionGeometryDisposals++);
    });
  }
  window.__lastCameraTarget = [1000, 1000]; scene = await draw();
  assert.equal(drawCount(scene, true), 0, 'Equipped residents disappear outside camera range');
  const cart = rig.children[22].getObjectByName('horse-cart-companion');
  const pose = cart.children.map(node => node.matrix.clone());
  units[22].position[0] += .25; units[22].path = [[40, 40]];
  await draw();
  assert.ok(cart.children.every((node, i) => node.matrix.equals(pose[i])), 'Hidden companion animation stops');
  window.__lastCameraTarget = [16, 16]; scene = await draw(); assertPoseParity(scene, 'Equipped residents return to camera');
  units[21].isHaulingLog = true;
  units[24].muleTransition = 'returning'; units[24].muleTransitionProgress = .75;
  scene = await draw(); assertPoseParity(scene, 'Hauling log and returning mule');
  units[21].currentJob = { id: 'mule-work', type: 'work_at_building' };
  scene = await draw(); assertPoseParity(scene, 'Mule hidden during building work');
  assert.equal(rig.children[21].getObjectByName('mule-companion').visible, false);
  units[21].hasMule = false; units[21].isHaulingLog = false; units[21].currentJob = undefined;
  units[22].isMerchant = false; units[22].path = [];
  units[23].hasHorseCart = false;
  units[24].muleTransition = undefined;
  buildingEntities.delete(hitch);
  await draw(); scene = await draw(); assertPoseParity(scene, 'Unequipped models leave no ghost instances');
  assert.deepEqual(sceneStats(scene), unequippedStats, 'Equipment cycles restore the original object and callback counts');
  assert.equal(companionGeometryDisposals, 0, 'Equipment changes retain reusable shared geometry');
}
console.log('Companion equipment/merchant/transition lifecycle, shared geometry, hidden animation and cleanup passed.');
globalThis.__unitTestState.isStrategicView = true;
scene = await draw(true); assert.equal(drawCount(scene, true), 0, 'Strategic mode hides batches');
globalThis.__unitTestState.isStrategicView = false;
scene = await draw(true); assertPoseParity(scene, 'Strategic exit');

characterEntities.delete(units[0]); await draw(); scene = await draw(); assertPoseParity(scene, 'Removed unit');
const newUnit = { id: 'new-peasant', characterClass: 'peasant', position: [20, 0, 20], path: [] };
characterEntities.add(newUnit); await draw(); scene = await draw(); assertPoseParity(scene, 'New resident');
await React.act(async () => sceneRoot.unmount());
assert.equal(scene.children.length, 0, 'Unmount removes imperative batches');
assert.equal(getSceneRenderTaskCount(scene), 0, 'Unmount releases every registered unit render task');

const strictRoot = createRoot({ width: 100, height: 100 });
await strictRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
await React.act(async () => { state = strictRoot.render(React.createElement(React.StrictMode, null, React.createElement(UnitsRenderer))); });
await React.act(async () => { advance(++frame / 60, false, state.getState()); });
assertPoseParity(state.getState().scene, 'StrictMode remount');
await React.act(async () => strictRoot.unmount());
assert.equal(state.getState().scene.children.length, 0, 'StrictMode cleanup removes all batches');

// Frozen leaf transforms still follow animations and refresh on a React commit.
const staticRef = React.createRef();
function StaticMeshFixture({ x, angle }) {
  useStaticUnitMeshMatrices(staticRef);
  return React.createElement('group', { ref: staticRef }, React.createElement('mesh', {
    position: [x, 2, 3], rotation: [0, angle, 0], scale: [1, 2, 1],
    geometry: new THREE.BoxGeometry(), material: new THREE.MeshBasicMaterial(),
  }));
}
const matrixRoot = createRoot({ width: 100, height: 100 });
await matrixRoot.configure({ gl: renderer, frameloop: 'never', size: { width: 100, height: 100, top: 0, left: 0 } });
await React.act(async () => { state = matrixRoot.render(React.createElement(StaticMeshFixture, { x: 1, angle: .25 })); });
const staticGroup = staticRef.current, staticMesh = staticGroup.children[0];
assert.equal(staticMesh.matrixAutoUpdate, false);
const originalUpdate = staticMesh.updateMatrix;
let localCompositions = 0;
staticMesh.updateMatrix = function () { localCompositions++; originalUpdate.call(this); };
staticGroup.rotation.x = .5;
for (let i = 0; i < 30; i++) await React.act(async () => { advance(++frame / 60, false, state.getState()); });
assert.equal(localCompositions, 0, 'Static unit parts do not compose local matrices every frame');
const expectedLocal = new THREE.Matrix4().compose(new THREE.Vector3(1, 2, 3), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, .25, 0)), new THREE.Vector3(1, 2, 1));
assert.ok(staticMesh.matrixWorld.equals(new THREE.Matrix4().multiplyMatrices(staticGroup.matrixWorld, expectedLocal)), 'Frozen parts follow their animated parent');
await React.act(async () => { state = matrixRoot.render(React.createElement(StaticMeshFixture, { x: 7, angle: 1.25 })); });
await React.act(async () => { advance(++frame / 60, false, state.getState()); });
expectedLocal.compose(new THREE.Vector3(7, 2, 3), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1.25, 0)), new THREE.Vector3(1, 2, 1));
assert.ok(staticMesh.matrixWorld.equals(new THREE.Matrix4().multiplyMatrices(staticGroup.matrixWorld, expectedLocal)), 'React changes refresh frozen transforms before rendering');
await React.act(async () => matrixRoot.unmount());
assert.equal(staticMesh.matrixAutoUpdate, true, 'Unmount restores normal matrix ownership');
console.log('Static unit matrices: skipped per-frame compositions, animated parent, React transform changes and cleanup passed.');

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

// Native instance colors must survive material replacement and buffer reuse.
for (const Batcher of [AnimatedMeshBatches, BuildingMeshBatches]) {
  const root = new THREE.Group(), fixture = new THREE.Scene(); fixture.add(root);
  const red = new THREE.MeshStandardMaterial({ color: '#b4513a', roughness: .85 });
  const blue = new THREE.MeshStandardMaterial({ color: '#357bab', roughness: .85 });
  const green = new THREE.MeshStandardMaterial({ color: '#4a9145', roughness: .85 });
  const metal = new THREE.MeshStandardMaterial({ color: '#4a9145', roughness: .2 });
  for (const material of [red, blue, green, metal]) registerColorBatchMaterial(material);
  const a = new THREE.Mesh(geo, red), b = new THREE.Mesh(geo, blue);
  root.add(a, b, new THREE.Mesh(geo, metal), new THREE.Mesh(geo, metal));
  const batches = new Batcher(); fixture.add(batches.group);
  const sync = () => { fixture.updateMatrixWorld(); batches.sync(root); batches.update(); };
  sync();
  assert.equal(batches.group.children.length, 2, 'Different roughness retains its own batch');
  const colored = batches.group.children.find(mesh => mesh.material.roughness === .85);
  const readColor = index => { const color = new THREE.Color(); colored.getColorAt(index, color); return color; };
  const closeColor = (actual, expected) => actual.toArray().every((value, i) => Math.abs(value - expected.toArray()[i]) < 1e-7);
  assert.ok(closeColor(readColor(0), red.color)); assert.ok(closeColor(readColor(1), blue.color));
  assert.equal(colored.material.color.getHex(), 0xffffff, 'Shared base preserves original diffuse colors through native instance colors');
  const version = () => colored.isBatchedMesh ? colored._colorsTexture.version : colored.instanceColor.version;
  const unchanged = version(); sync(); batches.update();
  assert.equal(version(), unchanged, 'Unchanged instance colors are not uploaded again');
  a.material = green; sync();
  assert.ok(batches.group.children.includes(colored), 'Compatible material replacement reuses buffers');
  assert.ok(closeColor(readColor(0), green.color), 'Reused batch receives the replacement material color');
  assert.equal(red.color.getHex(), 0xb4513a, 'Original materials remain unchanged');
  batches.dispose();
}

// Fallback instancing sorts just the owned ground-shadow pass back to front.
const shadowScene = new THREE.Scene(), shadowRoot = new THREE.Group(); shadowScene.add(shadowRoot);
const circle = new THREE.CircleGeometry(.26, 8);
const circles = [1, 3, 2].map(z => {
  const mesh = new THREE.Mesh(circle, groundShadowMaterial);
  mesh.position.set(0, .015, z); mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = GROUND_SHADOW_RENDER_ORDER; shadowRoot.add(mesh); return mesh;
});
const glass = new THREE.MeshBasicMaterial({ transparent: true, opacity: .35 });
const glassSources = [new THREE.Mesh(circle, glass), new THREE.Mesh(circle, glass)];
shadowRoot.add(...glassSources);
const shadowBatches = new AnimatedMeshBatches(); shadowScene.add(shadowBatches.group);
shadowScene.updateMatrixWorld(); shadowBatches.sync(shadowRoot);
assert.ok(glassSources.every(mesh => mesh.layers.mask === 1), 'Other transparent materials remain under native global sorting');
const shadowCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 100);
function checkShadowOrder(cameraZ) {
  shadowCamera.position.set(0, 10, cameraZ); shadowCamera.lookAt(0, 0, 2); shadowCamera.updateMatrixWorld();
  shadowScene.updateMatrixWorld(); shadowBatches.update(shadowCamera);
  const matrix = new THREE.Matrix4().multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse);
  const expected = circles.filter(mesh => mesh.visible).sort((a, b) =>
    new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(matrix).z -
    new THREE.Vector3().setFromMatrixPosition(a.matrixWorld).applyMatrix4(matrix).z || a.id - b.id);
  const batch = shadowBatches.group.children[0]; assert.equal(batch.count, expected.length);
  expected.forEach((source, i) => {
    const instance = new THREE.Matrix4(); batch.getMatrixAt(i, instance);
    assert.ok(instance.elements.every((value, j) => Math.abs(value - source.matrixWorld.elements[j]) < 1e-7), 'Ground-shadow slots follow camera depth');
  });
  const version = batch.instanceMatrix.version; shadowBatches.update(shadowCamera);
  assert.equal(batch.instanceMatrix.version, version, 'Stable shadow order skips matrix uploads');
}
checkShadowOrder(10); checkShadowOrder(-10);
circles[1].visible = false; checkShadowOrder(10);
circles[1].visible = true; circles[0].position.z = 5; checkShadowOrder(10);
shadowBatches.dispose();
console.log('Native color reuse, material compatibility, transparent exclusions and ground-shadow camera sorting passed.');
console.log('Unit integration: world geometry/normals/UV/material parity for poses and tools, floor visibility, selection, distance, strategic mode, add/remove, buffer reuse and cleanup passed.');
