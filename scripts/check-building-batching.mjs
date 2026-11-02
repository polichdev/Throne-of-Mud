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
      for (const ext of ['', '.ts', '.tsx', '/index.ts']) if (fs.existsSync(candidate + ext) && fs.statSync(candidate + ext).isFile()) return { url: pathToFileURL(candidate + ext).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    const file = url.startsWith('file:') ? fileURLToPath(url).replaceAll('\\', '/') : '';
    let source;
    if (file.endsWith('/buildingTextures.ts')) source = "import * as THREE from 'three'; const textures=new Map(); export const BUILDING_TEXTURES=new Proxy({}, {get(_,key){if(!textures.has(key))textures.set(key,new THREE.Texture());return textures.get(key);}});";
    else if (file.endsWith('/store/useGameStore.ts')) source = "import {useSyncExternalStore} from 'react'; export const useGameStore=selector=>useSyncExternalStore(listener=>{globalThis.__listeners.add(listener);return()=>globalThis.__listeners.delete(listener);},()=>selector(globalThis.__state));useGameStore.getState=()=>globalThis.__state;";
    else if (file.endsWith('/engine/ecs/world.ts')) source = 'export const buildingEntities=new Set(),characterEntities=new Set();';
    else if (/\.(ts|tsx)$/.test(file) && file.startsWith(root.replaceAll('\\', '/'))) source = fs.readFileSync(file, 'utf8');
    if (source !== undefined) return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, { fileName: file,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX } }).outputText };
    return next(url, context);
  },
});

const { createRoot, extend, advance } = await import('@react-three/fiber');
const { BuildingsRenderer, clearBuildingFrameStates } = await import('../src/components/canvas/BuildingsRenderer.tsx');
const { BuildingMeshBatches } = await import('../src/components/canvas/buildings/BuildingMeshBatches.ts');
const { addSceneRenderTask } = await import('../src/components/canvas/performance/sceneRenderTasks.ts');
const { StablePointLights } = await import('../src/components/canvas/performance/StablePointLights.tsx');
const { cacheBatchedDrawList } = await import('../src/components/canvas/performance/batchedDrawCache.ts');
const { getColorBatchMaterial } = await import('../src/components/canvas/performance/colorBatchMaterials.ts');
const { buildingEntities } = await import('../src/engine/ecs/world.ts');
extend(THREE); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = { __lastCameraTarget: [16, 16], __lastCameraZoom: 38 };
globalThis.__listeners = new Set();
globalThis.__state = { selectedEntityId: null, buildingVersion: 1, isStrategicView: false, houseFloorView: 1,
  time: { hour: 12, isPaused: true, speedMultiplier: 1 }, setSelectedEntityId(id) { globalThis.__state.selectedEntityId = id; } };
const types = ['tent', 'lumberjack_hut', 'campfire', 'market', 'manor', 'stockpile', 'wheat_farm', 'windmill', 'bakery', 'brewery', 'barracks',
  'fishermans_hut', 'foragers_hut', 'hunters_hut', 'iron_mine', 'stone_quarry', 'clay_pit', 'salt_works', 'charcoal_kiln', 'iron_smelter', 'stonecutter',
  'brickworks', 'sawmill', 'weavers_workshop', 'foresters_hut', 'wooden_church', 'tavern', 'hitching_post', 'trading_post', 'bakery'];
const buildings = types.map((buildingType, i) => ({ id: `building-${i}`, buildingType, isCompleted: true, constructionProgress: 100,
  position: [5 + i % 6 * 4, 0.05, 5 + Math.floor(i / 6) * 4], buildingWidth: 4, buildingHeight: 3, rotationAngle: i % 4 * Math.PI / 2, mulesCount: 3 }));
buildings.forEach(building => buildingEntities.add(building));
const renderer = { extensions: { has: () => true }, render(scene, camera) { scene.updateMatrixWorld(); scene.onBeforeRender(this, scene, camera, null); },
  setPixelRatio() {}, setSize() {}, shadowMap: {}, xr: { isPresenting: false } };
const sceneRoot = createRoot({ width: 100, height: 100 });
await sceneRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
let state, frame = 0;
async function draw(commit = false) {
  if (commit) await React.act(async () => { state = sceneRoot.render(React.createElement(React.StrictMode, null, React.createElement(BuildingsRenderer), React.createElement(StablePointLights))); });
  await React.act(async () => { advance(++frame / 60, false, state.getState()); });
  return state.getState().scene;
}
async function update(patch) { await React.act(async () => { Object.assign(globalThis.__state, patch); for (const listener of globalThis.__listeners) listener(); }); return draw(); }

function parts(scene, layers) {
  const parts = [];
  scene.traverseVisible(mesh => {
    if (!mesh.isMesh || layers && !(mesh.layers.mask & 1)) return;
    if (mesh.isBatchedMesh) {
      for (const instance of mesh._instanceInfo) {
        if (!instance.active || !instance.visible) continue;
        const info = mesh.getGeometryRangeAt(instance.geometryIndex);
        const matrix = new THREE.Matrix4(); mesh.getMatrixAt(mesh._instanceInfo.indexOf(instance), matrix); matrix.premultiply(mesh.matrixWorld);
        const color = mesh._colorsTexture ? new THREE.Color() : undefined;
        if (color) mesh.getColorAt(mesh._instanceInfo.indexOf(instance), color);
        parts.push({ mesh, matrix, material: mesh.material, color, begin: info.indexStart, end: info.indexStart + info.indexCount });
      }
      return;
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = Array.isArray(mesh.material) ? mesh.geometry.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
    for (const group of groups) {
      const material = materials[group.materialIndex ?? 0]; if (!material?.visible) continue;
      const begin = Math.max(group.start, mesh.geometry.drawRange.start);
      const end = Math.min(group.start + group.count, mesh.geometry.drawRange.start + mesh.geometry.drawRange.count, mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count);
      parts.push({ mesh, matrix: mesh.matrixWorld, material, begin, end });
    }
  }); return parts;
}
function triangles(drawParts) {
  const buckets = new Map();
  for (const { mesh, matrix, material, color, begin, end } of drawParts) {
    const geo = mesh.geometry, normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const shared = getColorBatchMaterial(material);
    const effectiveColor = color ?? (shared ? material.color : null);
    const colorKey = effectiveColor ? `:${effectiveColor.r.toFixed(5)},${effectiveColor.g.toFixed(5)},${effectiveColor.b.toFixed(5)}` : '';
    const key = `${shared?.uuid ?? material.uuid}${colorKey}:${mesh.castShadow}:${mesh.receiveShadow}`;
    const list = buckets.get(key) ?? []; buckets.set(key, list);
    for (let i = begin; i < end; i += 3) {
      const tri = [];
      for (let j = 0; j < 3; j++) {
        const vertex = geo.index?.getX(i + j) ?? i + j;
        const pos = new THREE.Vector3().fromBufferAttribute(geo.attributes.position, vertex).applyMatrix4(matrix);
        const normal = new THREE.Vector3().fromBufferAttribute(geo.attributes.normal, vertex).applyNormalMatrix(normalMatrix);
        tri.push(...pos.toArray(), ...normal.toArray(), geo.attributes.uv?.getX(vertex) ?? 0, geo.attributes.uv?.getY(vertex) ?? 0);
      } list.push(tri);
    }
  }
  for (const list of buckets.values()) list.sort((a, b) => { for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 0.00005) return a[i] - b[i]; return 0; });
  return buckets;
}
function parity(scene, message) {
  const rig = scene.children.find(group => group.__r3f);
  const expected = triangles(parts(rig, false)), found = triangles(parts(scene, true));
  assert.equal(found.size, expected.size, message + ': materials');
  for (const [key, reference] of expected) {
    const actual = found.get(key); assert.ok(actual, message + ': material'); assert.equal(actual.length, reference.length, message + ': triangle count');
    for (let i = 0; i < reference.length; i++) for (let j = 0; j < reference[i].length; j++) assert.ok(Math.abs(actual[i][j] - reference[i][j]) < 0.00006, message + ': world positions/normals/UVs');
  } return rig;
}
function draws(scene, layers) { return new Set(parts(scene, layers).map(part => `${part.mesh.uuid}:${part.material.uuid}`)).size; }

let scene = await draw(true), rig = parity(scene, '30 actual day building models');
const before = draws(rig, false), after = draws(scene, true);
assert.ok(after < before * 0.35, 'Multi-draw removes more than 65% of building draw submissions');
assert.ok(after < 120, 'Compatible building colors share batches while preserving per-instance colors');
console.log(JSON.stringify({ buildings: 30, originalDraws: before, multiDraws: after, excludes: 'houses, residents, terrain, shadow pass and DOM; requires WEBGL_multi_draw' }));
const smokePuffs = [];
rig.traverse(object => { if (object.name === 'chimney-smoke') smokePuffs.push(object); });
assert.ok(smokePuffs.length > 0 && smokePuffs.every(mesh => mesh.isInstancedMesh && mesh.count === 2),
  'Each chimney submits its two puffs in one instanced mesh');
await draw(); await draw();
const activeSmoke = smokePuffs.find(mesh => mesh.parent.visible && mesh.instanceMatrix.version > 0);
assert.ok(activeSmoke, 'Visible chimney updates its instance transforms');
const animatedDetails = ['clay-pit-hoist', 'quarry-hoist', 'tied-mule-head'].map(name => rig.getObjectByName(name));
assert.ok(animatedDetails.every(Boolean), 'Fixture contains animated production buildings and a tied mule');
rig.visible = false;
await draw();
const hiddenPoses = animatedDetails.map(object => [object.position.y, object.rotation.x, object.rotation.y]);
const hiddenSmokeVersion = activeSmoke.instanceMatrix.version;
for (let i = 0; i < 4; i++) await draw();
assert.deepEqual(animatedDetails.map(object => [object.position.y, object.rotation.x, object.rotation.y]), hiddenPoses,
  'Animations do not update behind a hidden ancestor');
assert.equal(activeSmoke.instanceMatrix.version, hiddenSmokeVersion, 'Hidden chimneys do not upload new puff matrices');
rig.visible = true;
await draw();
animatedDetails.forEach((object, i) => assert.ok(object.position.y !== hiddenPoses[i][0] ||
  object.rotation.x !== hiddenPoses[i][1] || object.rotation.y !== hiddenPoses[i][2],
  `${object.name} resumes after the ancestor is restored`));
await draw();
assert.ok(activeSmoke.instanceMatrix.version > hiddenSmokeVersion, 'Visible chimney resumes updating puff matrices');
const ids = scene.children.find(group => !group.__r3f).children.map(mesh => mesh.uuid);
scene = await draw(true); parity(scene, 'Unchanged model commit');
assert.deepEqual(scene.children.find(group => !group.__r3f).children.map(mesh => mesh.uuid), ids, 'Unchanged commits retain batches');
const versions = scene.children.find(group => !group.__r3f).children.map(mesh => mesh._matricesTexture.version);
await draw(); await draw();
const nextVersions = scene.children.find(group => !group.__r3f).children.map(mesh => mesh._matricesTexture.version);
assert.ok(nextVersions.some((version, i) => version === versions[i]), 'Static materials do not re-upload matrices every frame');
parity(scene, 'Moving windmill sails, hoists, flames and mules');
scene = await update({ selectedEntityId: buildings[8].id }); rig = parity(scene, 'Inspected bakery interior and hidden roof');
const hits = new THREE.Raycaster(new THREE.Vector3(...[buildings[8].position[0], 10, buildings[8].position[2]]), new THREE.Vector3(0, -1, 0)).intersectObject(rig, true);
const collider = hits.find(hit => hit.object.__r3f?.handlers.onClick); assert.ok(collider, 'Building collider remains selectable');
collider.object.__r3f.handlers.onClick({ stopPropagation() {} }); assert.equal(__state.selectedEntityId, buildings[8].id);
scene = await update({ time: { ...__state.time, hour: 23 } }); parity(scene, 'Night window materials and fire lights');
scene = await update({ isStrategicView: true }); assert.equal(draws(scene, true), 0, 'Strategic view hides original sources and all batches');
scene = await update({ isStrategicView: false }); parity(scene, 'Local map return');
window.__lastCameraTarget = [1000, 1000]; scene = await draw(); assert.equal(draws(scene, true), 0, 'Distance culling hides instances');
window.__lastCameraTarget = [16, 16]; scene = await draw(); parity(scene, 'Camera returns');
buildingEntities.delete(buildings[3]); scene = await update({ buildingVersion: 2 }); parity(scene, 'Building removed without ghost geometry');
for (let i = 30; i < 101; i++) buildingEntities.add({ ...buildings[i % 30], id: `stress-${i}`, position: [2 + i % 10 * 3.5, .05, 2 + Math.floor(i / 10) % 10 * 3.5] });
scene = await update({ buildingVersion: 3, selectedEntityId: null, time: { ...__state.time, hour: 12 } });
rig = parity(scene, '100 actual building models');
console.log(JSON.stringify({ buildings: 100, originalDraws: draws(rig, false), multiDraws: draws(scene, true), excludes: 'residents, terrain, shadows and DOM' }));
if (process.env.PROFILE_BATCHES === '1') {
  const clonedRig = rig.clone(true), profileBatches = new BuildingMeshBatches();
  clonedRig.updateWorldMatrix(true, true);
  let started = performance.now(); profileBatches.sync(clonedRig);
  const initialSync = performance.now() - started;
  const syncTimes = [], updateTimes = [];
  for (let i = 0; i < 20; i++) {
    started = performance.now(); profileBatches.sync(clonedRig); syncTimes.push(performance.now() - started);
    started = performance.now(); profileBatches.update(); updateTimes.push(performance.now() - started);
  }
  console.log(JSON.stringify({ buildingBatchCpuMs: { initialSync, repeatedSyncAverage: syncTimes.reduce((a, b) => a + b, 0) / syncTimes.length,
    updateAverage: updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length }, buildings: 100,
    excludes: 'WebGL, GPU, React and real-time simulation' }));
  profileBatches.syncIfChanged(clonedRig);
  const unchangedTimes = [];
  for (let i = 0; i < 20; i++) {
    started = performance.now(); assert.equal(profileBatches.syncIfChanged(clonedRig), false);
    unchangedTimes.push(performance.now() - started);
  }
  console.log(JSON.stringify({ unchangedStructureCheckMs: unchangedTimes.reduce((a, b) => a + b, 0) / unchangedTimes.length, buildings: 100 }));
  profileBatches.dispose();
  const drawParts = parts(scene, true);
  const ordinary = new Map();
  for (const { mesh, material } of drawParts) {
    if (mesh.isBatchedMesh || mesh.isInstancedMesh) continue;
    const key = `${material.type}:${material.transparent ? 'transparent' : 'opaque'}:${material.map ? 'textured' : 'solid'}`;
    let meshes = ordinary.get(key);
    if (!meshes) { meshes = new Set(); ordinary.set(key, meshes); }
    meshes.add(mesh.uuid);
  }
  console.log(JSON.stringify({ ordinaryDrawsByMaterial: Object.fromEntries([...ordinary].map(([key, meshes]) => [key, meshes.size])) }));
  const meshList = scene.children.find(group => !group.__r3f).children.filter(mesh => mesh.isBatchedMesh);
  const view = new THREE.OrthographicCamera(-60, 60, 60, -60, .1, 300);
  view.position.set(16, 100, 16); view.lookAt(16, 0, 16); view.updateMatrixWorld();
  const prepare = cached => { for (const mesh of meshList) (cached ? mesh.onBeforeRender : THREE.BatchedMesh.prototype.onBeforeRender).call(mesh, renderer, scene, view, mesh.geometry, mesh.material); };
  const measure = cached => {
    for (let i = 0; i < 100; i++) prepare(cached);
    const started = performance.now(); for (let i = 0; i < 1000; i++) prepare(cached);
    return (performance.now() - started) / 1000;
  };
  console.log(JSON.stringify({ headlessDrawListPreparationMs: { original: measure(false), cached: measure(true) }, buildings: 100,
    excludes: 'WebGL draw submission, GPU, simulation, React, browser layout; frozen model poses and camera' }));
}
buildingEntities.clear();
for (let i = 0; i < 20; i++) buildingEntities.add({ id: `yard-profile-${i}`, buildingType: 'peasant_house',
  isCompleted: true, constructionProgress: 100, houseTier: 2, backyardExtension: i % 2 ? 'goat_shed' : 'chicken_coop',
  position: [3 + i % 5 * 5, .05, 3 + Math.floor(i / 5) * 5], buildingWidth: 4, buildingHeight: 3 });
scene = await update({ buildingVersion: 4 });
let animalMeshes = 0, unbatchedAnimalMeshes = 0, animalCount = 0;
const animalRigs = [];
scene.traverse(object => { if (object.name !== 'yard-animal') return; animalCount++; animalRigs.push(object);
  object.traverse(child => { if (child.isMesh && child.material.visible) { animalMeshes++; if (child.layers.mask & 1) unbatchedAnimalMeshes++; } }); });
assert.equal(animalCount, 60);
assert.equal(animalMeshes, 630);
assert.equal(unbatchedAnimalMeshes, 0, 'Sheared backyard animals remain in batches');
const batchedYardDraws = draws(scene, true);
animalRigs.forEach(rig => { rig.userData.allowShearedBatching = false; });
scene = await draw(true);
const fallbackYardDraws = draws(scene, true);
assert.ok(fallbackYardDraws > batchedYardDraws + 200, 'Batching sheared animals eliminates hundreds of synthetic draw submissions');
animalRigs.forEach(rig => { rig.userData.allowShearedBatching = true; });
scene = await draw(true);
assert.equal(draws(scene, true), batchedYardDraws, 'Returning to sheared batching restores draw count');
console.log(JSON.stringify({ yardProfile: { houses: 20, animalCount, animalMeshes, unbatchedAnimalMeshes, fallbackYardDraws, batchedYardDraws,
  excludes: 'terrain, residents, GPU, shadows and browser' } }));
await React.act(async () => sceneRoot.unmount()); clearBuildingFrameStates();

const fixture = new THREE.Group(), testScene = new THREE.Scene(); testScene.add(fixture);
const mat = new THREE.MeshStandardMaterial(), geometry = new THREE.BoxGeometry(); geometry.setDrawRange(6, 24);
const snapshotRoot = new THREE.Group(), snapshotGeo = new THREE.BoxGeometry();
const snapshotMat = new THREE.MeshStandardMaterial({ color: 'red' });
const snapshotA = new THREE.Mesh(snapshotGeo, snapshotMat), snapshotB = new THREE.Mesh(snapshotGeo, snapshotMat);
snapshotRoot.add(snapshotA, snapshotB); snapshotRoot.updateMatrixWorld();
const snapshotBatch = new BuildingMeshBatches();
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true);
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), false, 'Unchanged tree skips full sync');
snapshotA.position.x = 2; snapshotRoot.updateMatrixWorld();
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), false, 'Transforms are handled by frame updates without rebuilding');
snapshotBatch.update();
snapshotMat.color.set('blue'); assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Material color changes resync');
snapshotMat.transparent = true; assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Transparency changes resync');
snapshotMat.transparent = false; assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true);
snapshotA.castShadow = true; assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Shadow changes resync');
snapshotGeo.setDrawRange(0, 6); assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Geometry draw range changes resync');
snapshotGeo.setAttribute('custom', new THREE.Float32BufferAttribute(new Float32Array(snapshotGeo.attributes.position.count), 1));
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Geometry attribute additions resync');
snapshotGeo.deleteAttribute('custom'); assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true);
snapshotA.material = [snapshotMat]; assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Single-to-array material changes resync');
snapshotA.material = snapshotMat; assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true);
snapshotRoot.userData.allowShearedBatching = true;
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Changing shear batching tag resyncs');
delete snapshotRoot.userData.allowShearedBatching;
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true);
const snapshotLight = new THREE.PointLight(); snapshotRoot.add(snapshotLight);
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Adding a point light resyncs');
snapshotLight.intensity = 2;
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), false, 'Light intensity is copied by the light pool without a rebuild');
snapshotLight.castShadow = true;
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Changing light shadow mode resyncs light ownership');
const snapshotGroup = new THREE.Group(); snapshotRoot.add(snapshotGroup); snapshotGroup.add(snapshotB);
assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Reparenting resyncs visibility branches');
snapshotRoot.remove(snapshotGroup); assert.equal(snapshotBatch.syncIfChanged(snapshotRoot), true, 'Removal resyncs');
snapshotBatch.dispose(); snapshotGeo.dispose(); snapshotMat.dispose();
const a = new THREE.Mesh(geometry, mat), b = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6).toNonIndexed(), mat);
fixture.add(a, b); const batches = new BuildingMeshBatches(); testScene.add(batches.group);
testScene.updateMatrixWorld(); batches.sync(fixture); batches.update();
assert.equal(batches.group.children.length, 1, 'Different indexed and non-indexed geometry shares a material batch');
const batch = batches.group.children[0];
assert.equal(batch.getGeometryRangeAt(batch.getGeometryIdAt(0)).indexCount, 24, 'Source drawRange retained');
assert.equal(a.layers.mask, 0); assert.equal(b.layers.mask, 0);
const version = batch._matricesTexture.version; batches.update(); assert.equal(batch._matricesTexture.version, version, 'Static fixture has zero additional texture uploads');
fixture.visible = false; batches.update(); assert.equal(batches.group.visible, false);
fixture.visible = true; b.scale.x = -1; testScene.updateMatrixWorld(); batches.update();
assert.equal(b.layers.mask, 1, 'Animated reflected transforms return to ordinary renderer'); assert.equal(batch.getVisibleAt(1), false);
b.scale.x = 1; testScene.updateMatrixWorld(); batches.update(); assert.equal(b.layers.mask, 0, 'Safe transforms resume batching');
for (let i = 0; i < 20; i++) {
  fixture.scale.set(2, 1, 1); b.rotation.z = .5;
  testScene.updateMatrixWorld(); batches.sync(fixture); batches.update();
  assert.equal(batches.group.children[0], batch, 'Sync during an unsafe animated pose retains the batch');
  assert.equal(b.layers.mask, 1, 'Sheared pose retains native source rendering and normals');
  assert.equal(batch.getVisibleAt(1), false, 'Sheared pose is not drawn twice');
  fixture.scale.set(1, 1, 1); b.rotation.z = 0;
  testScene.updateMatrixWorld(); batches.sync(fixture); batches.update();
  assert.equal(batches.group.children[0], batch, 'Returning to a safe pose reuses the same GPU buffers');
  assert.equal(b.layers.mask, 0); assert.equal(batch.getVisibleAt(1), true);
}
const shearedRoot = new THREE.Group(), shearedRig = new THREE.Group(), shearedBatch = new BuildingMeshBatches();
const shearedMaterial = new THREE.MeshStandardMaterial({ color: '#aa6633' });
shearedRoot.scale.set(1.15, 1, 1.65); shearedRoot.add(shearedRig);
shearedRig.userData.allowShearedBatching = true; shearedRig.rotation.y = 0.7;
const shearedSource = new THREE.Mesh(geometry, shearedMaterial), shearedOther = new THREE.Mesh(geometry, shearedMaterial);
shearedRig.add(shearedSource, shearedOther); shearedRoot.updateMatrixWorld();
shearedBatch.sync(shearedRoot); shearedBatch.update();
assert.equal(shearedSource.layers.mask, 0, 'Tagged sheared geometry stays batched');
const shearedMesh = shearedBatch.group.children[0];
assert.equal(shearedMesh.perObjectFrustumCulled, false, 'Sheared instance bounds cannot be incorrectly culled');
const shearedMatrix = new THREE.Matrix4(); shearedMesh.getMatrixAt(0, shearedMatrix);
assert.ok(shearedMatrix.elements.every((value, i) => Math.abs(value - shearedSource.matrixWorld.elements[i]) < 1e-6), 'Batched world transform matches the original');
const normal = new THREE.Vector3(.3, .7, .2).normalize();
const expectedNormal = normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(shearedSource.matrixWorld)).normalize();
const actualNormal = normal.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(shearedMatrix).invert().transpose()).normalize();
assert.ok(expectedNormal.distanceTo(actualNormal) < 1e-6, 'Inverse-transpose preserves normals for sheared geometry');
const shader = { vertexShader: '#include <defaultnormal_vertex>', fragmentShader: '' };
shearedMesh.material.onBeforeCompile(shader, {});
assert.ok(shader.vertexShader.includes('normalCofactor') && !shader.vertexShader.includes('inverse( bm )'), 'Sheared batch shader uses cofactors without matrix inversion');
for (let i = 1; i <= 50; i++) {
  const transform = new THREE.Matrix4().makeScale(.4 + i / 17, 1 + i / 30, 1.9 - i / 70)
    .multiply(new THREE.Matrix4().makeRotationY(i * .13))
    .multiply(new THREE.Matrix4().makeRotationX(i * .07));
  const e = transform.elements;
  const x = new THREE.Vector3(e[0], e[1], e[2]), y = new THREE.Vector3(e[4], e[5], e[6]), z = new THREE.Vector3(e[8], e[9], e[10]);
  const cofactor = new THREE.Matrix3().set(...new THREE.Vector3().crossVectors(y, z).toArray(),
    ...new THREE.Vector3().crossVectors(z, x).toArray(), ...new THREE.Vector3().crossVectors(x, y).toArray()).transpose();
  const expected = normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(transform)).normalize();
  const actual = normal.clone().applyMatrix3(cofactor).normalize();
  assert.ok(expected.distanceTo(actual) < 1e-10, `Cofactor normal matches inverse-transpose for transform ${i}`);
}
shearedRig.scale.x = -1; shearedRoot.updateMatrixWorld(); shearedBatch.update();
assert.equal(shearedSource.layers.mask, 1, 'Reflected transforms retain ordinary rendering');
shearedRig.scale.x = 0; shearedRoot.updateMatrixWorld(); shearedBatch.update();
assert.equal(shearedSource.layers.mask, 1, 'Singular transforms retain ordinary rendering');
shearedBatch.dispose(); shearedMaterial.dispose();
const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 20); camera.position.z = 5; camera.updateMatrixWorld();
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material); assert.equal(batch._multiDrawCount, 2, 'Three generates both visible multi-draw commands');
const drawVersion = batch._indirectTexture.version;
for (let i = 0; i < 30; i++) { batches.update(); batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material); }
assert.equal(batch._indirectTexture.version, drawVersion, 'Stationary batches retain their frustum/sort commands and skip 30 indirect uploads');
camera.position.x = 100; camera.updateMatrixWorld();
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material);
assert.equal(batch._multiDrawCount, 0, 'Camera movement invalidates cached frustum commands');
camera.position.x = 0; camera.updateMatrixWorld();
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material);
assert.equal(batch._multiDrawCount, 2, 'Camera return restores both draw commands');
const shadowCamera = camera.clone(); shadowCamera.position.x = 100; shadowCamera.updateMatrixWorld();
const depth = new THREE.MeshDepthMaterial();
batch.onBeforeShadow(renderer, batch, camera, shadowCamera, batch.geometry, depth);
assert.equal(batch._multiDrawCount, 0, 'Shadow camera builds its own frustum list');
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material);
assert.equal(batch._multiDrawCount, 2, 'Main camera commands are restored after a shadow pass');
camera.zoom = 2; camera.updateProjectionMatrix();
const projectionVersion = batch._indirectTexture.version;
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material);
assert.equal(batch._multiDrawCount, 2, 'Zoom projection regenerates both visible commands');
assert.equal(batch._indirectTexture.version, projectionVersion, 'Zoom with unchanged instance IDs does not upload the same lookup texture');
camera.zoom = 1; camera.updateProjectionMatrix();
b.position.x = 100; testScene.updateMatrixWorld(); batches.update();
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material); assert.equal(batch._multiDrawCount, 1, 'Three per-object frustum culling removes a distant detail');
fixture.remove(a); batches.update(); assert.equal(batch.getVisibleAt(0), false, 'Detached source disappears before a React resync');
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material);
assert.equal(batch._multiDrawCount, 0, 'Removal invalidates cached commands without a React commit');
let geometryDisposed = false, materialDisposed = false; geometry.addEventListener('dispose', () => geometryDisposed = true); mat.addEventListener('dispose', () => materialDisposed = true);
batches.dispose(); assert.equal(a.layers.mask, 1); assert.equal(b.layers.mask, 1); assert.equal(geometryDisposed, false); assert.equal(materialDisposed, false);

const box = new THREE.BoxGeometry(.2, .2, .2);
function makeLookupBatch(cached) {
  const mesh = new THREE.BatchedMesh(8, box.attributes.position.count, box.index.count, mat);
  const id = mesh.addGeometry(box); for (let i = 0; i < 3; i++) mesh.addInstance(id);
  if (cached) cacheBatchedDrawList(mesh);
  return mesh;
}
const nativeLookup = makeLookupBatch(false), cachedLookup = makeLookupBatch(true);
const lookupCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 20);
lookupCamera.position.z = 5; lookupCamera.updateMatrixWorld();
const pose = new THREE.Matrix4();
function checkLookup(frame, camera = lookupCamera, shadow = false) {
  for (let i = 0; i < 3; i++) {
    pose.makeTranslation(Math.sin(frame / 20 + i) * .2, i * .3, i * .25);
    nativeLookup.setMatrixAt(i, pose); cachedLookup.setMatrixAt(i, pose);
  }
  for (const mesh of [nativeLookup, cachedLookup]) {
    if (shadow) mesh.onBeforeShadow(renderer, mesh, lookupCamera, camera, mesh.geometry, depth);
    else mesh.onBeforeRender(renderer, testScene, camera, mesh.geometry, mat);
  }
  assert.equal(cachedLookup._multiDrawCount, nativeLookup._multiDrawCount, 'Native and cached command counts match');
  const count = nativeLookup._multiDrawCount;
  for (const field of ['_multiDrawStarts', '_multiDrawCounts']) assert.deepEqual(cachedLookup[field].slice(0, count), nativeLookup[field].slice(0, count));
  assert.deepEqual(cachedLookup._indirectTexture.image.data.slice(0, count), nativeLookup._indirectTexture.image.data.slice(0, count), 'Instance ordering matches native Three');
  assert.deepEqual(cachedLookup._matricesTexture.image.data, nativeLookup._matricesTexture.image.data, 'Every animated transform remains unchanged');
}
checkLookup(0);
const nativeLookupVersion = nativeLookup._indirectTexture.version, cachedLookupVersion = cachedLookup._indirectTexture.version;
const lookupMatrixVersion = cachedLookup._matricesTexture.version;
for (let i = 1; i <= 90; i++) { lookupCamera.position.x = Math.sin(i / 20) * .1; lookupCamera.updateMatrixWorld(); checkLookup(i); }
assert.equal(nativeLookup._indirectTexture.version - nativeLookupVersion, 90);
assert.equal(cachedLookup._indirectTexture.version, cachedLookupVersion, '90 animated/camera frames with the same IDs skip all redundant lookup uploads');
assert.ok(cachedLookup._matricesTexture.version > lookupMatrixVersion, 'Animation matrix uploads continue');
const uploadSourceVersion = cachedLookup._indirectTexture.source.version;
for (let i = 0; i < 10; i++) checkLookup(i);
assert.equal(cachedLookup._indirectTexture.source.version, uploadSourceVersion, 'Unchanged lookups also preserve the source upload version');
cachedLookup.setVisibleAt(1, false); nativeLookup.setVisibleAt(1, false); checkLookup(91);
assert.ok(cachedLookup._indirectTexture.version > cachedLookupVersion, 'Removing a middle instance uploads the changed lookup');
cachedLookup.setVisibleAt(1, true); nativeLookup.setVisibleAt(1, true); checkLookup(92);
lookupCamera.position.z = -5; lookupCamera.lookAt(0, 0, 0); lookupCamera.updateMatrixWorld(); checkLookup(93);
const lookupShadow = lookupCamera.clone(); lookupShadow.position.x = 100; lookupShadow.updateMatrixWorld();
checkLookup(94, lookupShadow, true); checkLookup(95);
lookupCamera.zoom = 20; lookupCamera.updateProjectionMatrix(); checkLookup(96);
cachedLookup._indirectTexture.needsUpdate = true;
const externalLookupVersion = cachedLookup._indirectTexture.version; checkLookup(97);
assert.ok(cachedLookup._indirectTexture.version > externalLookupVersion, 'External update requests invalidate cached contents');
nativeLookup.setInstanceCount(16); cachedLookup.setInstanceCount(16); checkLookup(98);
console.log(JSON.stringify({ animatedFrames: 90, nativeLookupUploadRequests: 90, cachedLookupUploadRequests: 0,
  checks: 'Native Three commands, animation matrices, moving camera, sort reversal, visibility, zoom, shadows, external invalidation and resize fallback; no GPU/FPS measurement' }));
nativeLookup.dispose(); cachedLookup.dispose(); box.dispose();

{
  const geo = new THREE.BoxGeometry(.2, .2, .2);
  const make = padded => {
    const m = new THREE.BatchedMesh(80, geo.attributes.position.count, geo.index.count, mat);
    const id = m.addGeometry(geo);
    for (let i = 0; i < 80; i++) {
      const instance = m.addInstance(id);
      m.setMatrixAt(instance, new THREE.Matrix4().makeTranslation((i % 10) - 4.5, Math.floor(i / 10) - 3.5, (i % 3) * .1));
    }
    m.sortObjects = false;
    if (padded) {
      const prepare = m.onBeforeRender;
      m.prepareCount = 0;
      m.onBeforeRender = function (...args) { this.prepareCount++; return prepare.apply(this, args); };
      cacheBatchedDrawList(m, 1);
    }
    return m;
  };
  const native = make(false), cached = make(true);
  const cam = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 20);
  cam.position.z = 5;
  for (let i = 0; i < 200; i++) {
    cam.position.x = Math.sin(i / 23) * 2;
    cam.position.y = Math.cos(i / 31);
    cam.zoom = i < 100 ? 1 : 1.3;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    for (const m of [native, cached]) m.onBeforeRender(renderer, testScene, cam, m.geometry, mat);
    const included = new Set(cached._indirectTexture.image.data.slice(0, cached._multiDrawCount));
    for (const id of native._indirectTexture.image.data.slice(0, native._multiDrawCount)) {
      assert.ok(included.has(id), `Padded house culling must retain visible instance ${id} at frame ${i}`);
    }
  }
  assert.ok(cached.prepareCount < 100, `Camera motion should reuse padded draw lists, got ${cached.prepareCount} rebuilds`);
  console.log(JSON.stringify({ movingCameraFrames: 200, paddedDrawListRebuilds: cached.prepareCount,
    checks: 'All native visible instances retained; CPU-only fixture, no FPS measurement' }));
  native.dispose(); cached.dispose(); geo.dispose();
}

const hiddenRoot = new THREE.Group(), hiddenBatches = new BuildingMeshBatches();
const branches = [], details = [];
for (let i = 0; i < 100; i++) {
  const branch = new THREE.Group(); branches.push(branch); hiddenRoot.add(branch);
  for (let j = 0; j < 12; j++) { const mesh = new THREE.Mesh(geometry, mat); branch.add(mesh); details.push(mesh); }
}
hiddenRoot.updateMatrixWorld(); hiddenBatches.sync(hiddenRoot); hiddenBatches.update();
const rootVisibilityEntry = hiddenBatches.visibility.get(hiddenRoot);
const branchVisibilityEntry = hiddenBatches.visibility.get(branches[0]);
hiddenBatches.update();
assert.strictEqual(hiddenBatches.visibility.get(hiddenRoot), rootVisibilityEntry, 'Visible root reuses its visibility record');
assert.strictEqual(hiddenBatches.visibility.get(branches[0]), branchVisibilityEntry, 'Visible branch reuses its visibility record');
for (const branch of branches) branch.visible = false;
hiddenBatches.update();
let detailReads = 0;
for (const mesh of details) {
  let visible = mesh.visible;
  Object.defineProperty(mesh, 'visible', { configurable: true, get() { detailReads++; return visible; }, set(value) { visible = value; } });
}
const hiddenVersion = hiddenBatches.group.children[0]._matricesTexture.version;
for (let i = 0; i < 30; i++) hiddenBatches.update();
assert.equal(detailReads, 0, '100 hidden rigs skip all 1200 details for 30 frames');
assert.equal(hiddenBatches.group.children[0]._matricesTexture.version, hiddenVersion, 'Hidden regions issue no matrix texture uploads');
branches[0].visible = true; hiddenBatches.update();
assert.equal(detailReads, 12, 'Reappearing rig updates only its own details');
const hiddenBatch = hiddenBatches.group.children[0];
assert.equal(hiddenBatch._instanceInfo.filter(info => info.visible).length, 12, 'Hidden rigs produce no ghost geometry');
hiddenBatches.dispose();

const callbacks = new THREE.Scene(); let original = 0, first = 0, second = 0;
callbacks.onBeforeRender = () => original++; const saved = callbacks.onBeforeRender;
const removeFirst = addSceneRenderTask(callbacks, () => first++), removeSecond = addSceneRenderTask(callbacks, () => second++);
callbacks.onBeforeRender(); removeFirst(); callbacks.onBeforeRender(); removeSecond(); callbacks.onBeforeRender();
assert.deepEqual([original, first, second], [3, 1, 2]); assert.equal(callbacks.onBeforeRender, saved, 'Independent batchers restore scene callback after arbitrary cleanup order');
buildingEntities.clear(); buildings.slice(0, 5).forEach(building => buildingEntities.add(building));
const fallbackRoot = createRoot({ width: 100, height: 100 });
await fallbackRoot.configure({ gl: { ...renderer, extensions: { has: () => false } }, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
let fallback;
await React.act(async () => { fallback = fallbackRoot.render(React.createElement(BuildingsRenderer)); });
await React.act(async () => { advance(1, false, fallback.getState()); });
const fallbackScene = fallback.getState().scene;
assert.equal(fallbackScene.children.length, 1, 'No batches allocated without WEBGL_multi_draw');
assert.equal(draws(fallbackScene, true), draws(fallbackScene, false), 'Original layer visibility remains intact without extension');
await React.act(async () => fallbackRoot.unmount()); clearBuildingFrameStates();
console.log('Building geometry, transforms, animation, inspection, day/night, selection, culling, removal, uploads, ownership and callback lifecycle checks passed.');
