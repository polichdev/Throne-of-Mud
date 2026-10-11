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
        parts.push({ mesh, matrix, material: mesh.material, begin: info.indexStart, end: info.indexStart + info.indexCount });
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
  for (const { mesh, matrix, material, begin, end } of drawParts) {
    const geo = mesh.geometry, normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const key = `${material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
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
console.log(JSON.stringify({ buildings: 30, originalDraws: before, multiDraws: after, excludes: 'houses, residents, terrain, shadow pass and DOM; requires WEBGL_multi_draw' }));
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
await React.act(async () => sceneRoot.unmount()); clearBuildingFrameStates();

const fixture = new THREE.Group(), testScene = new THREE.Scene(); testScene.add(fixture);
const mat = new THREE.MeshStandardMaterial(), geometry = new THREE.BoxGeometry(); geometry.setDrawRange(6, 24);
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
assert.ok(batch._indirectTexture.version > projectionVersion, 'Zoom projection changes invalidate draw commands');
camera.zoom = 1; camera.updateProjectionMatrix();
b.position.x = 100; testScene.updateMatrixWorld(); batches.update();
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material); assert.equal(batch._multiDrawCount, 1, 'Three per-object frustum culling removes a distant detail');
fixture.remove(a); batches.update(); assert.equal(batch.getVisibleAt(0), false, 'Detached source disappears before a React resync');
batch.onBeforeRender(renderer, testScene, camera, batch.geometry, batch.material);
assert.equal(batch._multiDrawCount, 0, 'Removal invalidates cached commands without a React commit');
let geometryDisposed = false, materialDisposed = false; geometry.addEventListener('dispose', () => geometryDisposed = true); mat.addEventListener('dispose', () => materialDisposed = true);
batches.dispose(); assert.equal(a.layers.mask, 1); assert.equal(b.layers.mask, 1); assert.equal(geometryDisposed, false); assert.equal(materialDisposed, false);

const hiddenRoot = new THREE.Group(), hiddenBatches = new BuildingMeshBatches();
const branches = [], details = [];
for (let i = 0; i < 100; i++) {
  const branch = new THREE.Group(); branches.push(branch); hiddenRoot.add(branch);
  for (let j = 0; j < 12; j++) { const mesh = new THREE.Mesh(geometry, mat); branch.add(mesh); details.push(mesh); }
}
hiddenRoot.updateMatrixWorld(); hiddenBatches.sync(hiddenRoot); hiddenBatches.update();
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
