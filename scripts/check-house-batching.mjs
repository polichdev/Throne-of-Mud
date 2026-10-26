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
      for (const extension of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
        if (fs.existsSync(candidate + extension) && fs.statSync(candidate + extension).isFile()) {
          return { url: pathToFileURL(candidate + extension).href, shortCircuit: true };
        }
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    const filename = url.startsWith('file:') ? fileURLToPath(url).replaceAll('\\', '/') : '';
    let source;
    if (filename.endsWith('/buildingTextures.ts')) {
      source = "import * as THREE from 'three'; const textures = new Map(); export const BUILDING_TEXTURES = new Proxy({}, { get(_, key) { if (!textures.has(key)) textures.set(key, new THREE.Texture()); return textures.get(key); } });";
    } else if (filename.endsWith('/common/BuildingPrimitives.tsx')) {
      source = 'export const ChimneySmoke = () => null; export const IndoorFireplaceFire = () => null; export function isObjectEffectivelyVisible(object) { while(object) { if(!object.visible) return false; object=object.parent; } return true; }';
    } else if (filename.endsWith('/store/useGameStore.ts')) {
      source = 'const state = () => globalThis.__houseTestState ?? {time:{hour:12,isPaused:false,speedMultiplier:1}}; export const useGameStore = selector => selector(state()); useGameStore.getState=state;';
    } else if (filename.endsWith('/engine/ecs/world.ts')) {
      source = 'export const buildingEntities = new Set();';
    } else if (filename.endsWith('/buildings/models/index.ts')) {
      const rendererSource = fs.readFileSync(path.join(root, 'src/components/canvas/BuildingsRenderer.tsx'), 'utf8');
      const names = rendererSource.match(/import \{([^}]+)\} from '\.\/buildings\/models';/)[1].split(',').map(name => name.trim()).filter(Boolean);
      source = "export { PeasantHouseModel } from './housing/PeasantHouseModel.tsx';\n" + names.filter(name => name !== 'PeasantHouseModel').map(name => `export const ${name} = () => null;`).join('\n');
    } else if (filename.endsWith('/buildings/InstancedWallsRenderer.tsx')) {
      source = 'export const InstancedWallsRenderer = () => null;';
    } else if (/\.(ts|tsx)$/.test(filename) && filename.startsWith(root.replaceAll('\\', '/'))) {
      source = fs.readFileSync(filename, 'utf8');
      if (filename.endsWith('/PeasantHouseModel.tsx')) {
        source += '\nexport { HouseFacadeDetails, HouseSideWindowDetails, HouseFacade, expandHouseStaticPart };';
      }
      if (filename.endsWith('/ResourceDepositsRenderer.tsx')) source += '\nexport { BerryDepositDetails };';
    }
    if (source !== undefined) {
      return { format: 'module', source: ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX,
      }, fileName: filename }).outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

const house = await import('../src/components/canvas/buildings/models/housing/PeasantHouseModel.tsx');
const { mergeStaticMeshParts } = await import('../src/components/canvas/buildings/staticMeshParts.ts');
const { makeHouseBatches, getHouseWorldMatrix, HouseBatchCache } = await import('../src/components/canvas/buildings/InstancedHousesRenderer.tsx');
const { SHARED_BUILDING_MATS } = await import('../src/components/canvas/buildings/buildingMaterials.ts');
const yards = ['none', 'vegetable_garden', 'chicken_coop', 'goat_shed', 'artisan_bowyer', 'artisan_shields', 'artisan_brewery'];

function rawExpand(type, props) {
  if (type === house.HouseFacade) return React.createElement(React.Fragment, null,
    React.createElement(house.HouseFacadeDetails, props), React.createElement(house.HouseSideWindowDetails, props));
  return house.expandHouseStaticPart(type, props);
}

function rawMeshCount(node) {
  if (Array.isArray(node)) return node.reduce((sum, child) => sum + rawMeshCount(child), 0);
  if (!React.isValidElement(node) || node.props.visible === false) return 0;
  if (node.type === 'mesh') return 1;
  if (typeof node.type === 'string' || node.type === React.Fragment) return rawMeshCount(node.props.children);
  return rawMeshCount(rawExpand(node.type, node.props));
}

function fingerprints(parts) {
  const result = new Map();
  for (const part of parts) {
    const geo = part.geometry, attributes = ['position', 'normal', 'uv'].map(name => geo.getAttribute(name));
    const triangles = [];
    for (let i = 0; i < attributes[0].count; i += 3) {
      const triangle = [];
      for (let j = 0; j < 3; j++) {
        for (const attribute of attributes) {
          for (let k = 0; k < attribute.itemSize; k++) triangle.push(attribute.array[(i + j) * attribute.itemSize + k]);
        }
      }
      triangles.push(triangle);
    }
    const key = `${part.material.uuid}:${part.castShadow}:${part.receiveShadow}`;
    result.set(key, [...(result.get(key) ?? []), ...triangles].sort((a, b) => {
      for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 0.000005) return a[i] - b[i];
      return 0;
    }));
  }
  return result;
}

function assertParity(actual, expected, message = 'Geometry parity') {
  const a = fingerprints(actual), b = fingerprints(expected);
  assert.equal(a.size, b.size, `${message}: material/shadow bucket count`);
  for (const [key, triangles] of a) {
    const reference = b.get(key);
    assert.ok(reference, `${message}: missing material/shadow bucket`);
    assert.equal(triangles.length, reference.length, `${message}: triangle count`);
    triangles.forEach((triangle, i) => triangle.forEach((value, j) => {
      assert.ok(Math.abs(value - reference[i][j]) < 0.000005, `${message}: triangle ${i}, attribute ${j}: ${value} != ${reference[i][j]}`);
    }));
  }
}

const deposits = await import('../src/components/canvas/ResourceDepositsRenderer.tsx');
const rawBerries = mergeStaticMeshParts(deposits.BerryDepositDetails(), () => null);
const mergedBerries = mergeStaticMeshParts(deposits.BerryDepositModel(), () => null);
assertParity(mergedBerries, rawBerries, 'Berry deposit geometry, normals, UVs and material parity');
assert.equal(rawMeshCount(deposits.BerryDepositDetails()), 70);
assert.equal(mergedBerries.length, 9);
assert.strictEqual(deposits.BerryDepositModel().props.children[0].props.geometry,
  deposits.BerryDepositModel().props.children[0].props.geometry, 'Berry deposits reuse cached geometry');
[...rawBerries, ...mergedBerries].forEach(part => part.geometry.dispose());
console.log('Berry deposit: 70 -> 9 static draw groups; geometry, normals, UVs, materials and shared cache passed.');

const counts = [];
for (const tier of [1, 2, 3]) {
  for (const backyard of yards) {
    const raw = mergeStaticMeshParts(house.PeasantHouseModel({ tier, backyard }), rawExpand);
    const batched = house.getPeasantHouseExteriorParts(tier, backyard);
    assertParity(batched, raw, `Geometry/UV/shadow parity tier ${tier}, ${backyard}`);
    assert.strictEqual(batched, house.getPeasantHouseExteriorParts(tier, backyard), 'Prefab cache reuses geometry');
    assertParity([...house.getPeasantHouseExteriorParts(tier, 'none'), ...house.getPeasantBackyardParts(backyard)], raw);
    if (backyard === 'none') counts.push({ tier, originalExteriorDraws: rawMeshCount(house.PeasantHouseModel({ tier, backyard })), exteriorDraws: batched.length });
    raw.forEach(part => part.geometry.dispose());
  }
}

for (const tier of [1, 2, 3]) {
  for (const floorView of [1, 2]) {
    const props = { tier, upperVisible: floorView === 2, isLightOn: false };
    const raw = mergeStaticMeshParts(React.createElement(house.HouseFacade, props), rawExpand);
    const merged = mergeStaticMeshParts(React.createElement(house.HouseFacade, props), house.expandHouseStaticPart);
    assertParity(merged, raw);
    [...raw, ...merged].forEach(part => part.geometry.dispose());
    const night = mergeStaticMeshParts(React.createElement(house.HouseFacade, { ...props, isLightOn: true }), house.expandHouseStaticPart);
    assert.equal(night.filter(part => part.material === SHARED_BUILDING_MATS.windowLit).length, 1);
    night.forEach(part => part.geometry.dispose());
  }
}
const exterior = house.getPeasantHouseExteriorParts(3, 'none');
assert.equal(exterior.filter(part => house.getPeasantHouseExteriorMaterial(part.material, true) !== part.material).length, 1);

for (const rotationAngle of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
  const building = { id: 'test', position: [10, 0.05, -4], rotationAngle, buildingWidth: 5, buildingHeight: 4 };
  const expected = new THREE.Object3D();
  expected.position.set(...building.position); expected.rotation.y = rotationAngle; expected.updateMatrix();
  getHouseWorldMatrix(building).elements.forEach((value, i) => assert.ok(Math.abs(value - expected.matrix.elements[i]) < 1e-10));
}
assert.deepEqual(new THREE.Vector3().setFromMatrixPosition(getHouseWorldMatrix({ gridPosition: [-10, 20], buildingWidth: 5, buildingHeight: 4 })).toArray(), [-7.5, 0, 22]);

const buildings = Array.from({ length: 100 }, (_, i) => ({ id: `house-${i}`, houseTier: 2,
  buildingWidth: 5, buildingHeight: 4, position: [(i % 10) * 5, 0, Math.floor(i / 10) * 7], backyardExtension: 'none' }));
const batches = makeHouseBatches(buildings);
assert.equal(batches.reduce((sum, batch) => sum + batch.buildings.length, 0), 100);
assert.equal(new Set(batches.flatMap(batch => batch.buildings.map(building => building.id))).size, 100);
const selectedId = 'house-42';
assert.ok(makeHouseBatches(buildings.filter(building => building.id !== selectedId)).every(batch => batch.buildings.every(building => building.id !== selectedId)));
const draws = batches.reduce((sum, batch) => sum + batch.parts.length, 0);
assert.ok(draws < 200, '100-house static draw count stays bounded by chunks, not house count');
console.log(JSON.stringify({ variantsChecked: 21, facadeViewsChecked: 6, counts, benchmark: { houses: 100, chunks: batches.length, originalStaticDraws: counts[1].originalExteriorDraws * 100, staticDraws: draws, excludes: 'smoke, animals, characters, other buildings, shadow passes' } }, null, 2));

const { createRoot, extend, advance } = await import('@react-three/fiber');
const { InstancedHousesRenderer } = await import('../src/components/canvas/buildings/InstancedHousesRenderer.tsx');
extend(THREE);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = { __lastCameraTarget: [0, 0], __lastCameraZoom: 38 };
globalThis.__houseTestState = { time: { hour: 12, isPaused: false, speedMultiplier: 1 } };
const canvas = { width: 100, height: 100 };
const renderer = { render() {}, setPixelRatio() {}, setSize() {}, shadowMap: {}, xr: { isPresenting: false } };
const sceneRoot = createRoot(canvas);
await sceneRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
let state, selected;
async function renderScene(items) {
  await React.act(async () => {
    state = sceneRoot.render(React.createElement(InstancedHousesRenderer, { buildings: items, onSelect: id => { selected = id; } }));
  });
  state.getState().scene.updateMatrixWorld(true);
  const meshes = [];
  state.getState().scene.traverse(object => { if (object.isInstancedMesh) meshes.push(object); });
  return meshes;
}
const sample = buildings.slice(0, 3);
const dayMeshes = await renderScene(sample);
const dayBuffers = dayMeshes.map(mesh => ({ uuid: mesh.uuid, matrix: [...mesh.instanceMatrix.array] }));
assert.equal(dayMeshes.filter(mesh => mesh.material.visible).length, 20);
const versionsBeforeRoadRevision = dayMeshes.map(mesh => mesh.instanceMatrix.version);
const roadRevisionMeshes = await renderScene([...sample]);
assert.deepEqual(roadRevisionMeshes.map(mesh => mesh.instanceMatrix.version), versionsBeforeRoadRevision, 'Unchanged house layout skips matrix uploads after a road/store revision');
const layoutCache = new HouseBatchCache();
const mutableHouse = { id: 'mutable-layout', position: [1, 0, 2], houseTier: 1 };
const cachedLayout = layoutCache.get([mutableHouse]);
assert.strictEqual(layoutCache.get([mutableHouse]), cachedLayout, 'New array with unchanged entities reuses batches');
mutableHouse.position[0] = 50;
const movedLayout = layoutCache.get([mutableHouse]);
assert.notStrictEqual(movedLayout, cachedLayout, 'Mutable position is compared to a saved primitive snapshot');
mutableHouse.houseTier = 2;
const upgradedLayout = layoutCache.get([mutableHouse]);
assert.notStrictEqual(upgradedLayout, movedLayout, 'Mutable tier change refreshes geometry');
assert.notStrictEqual(layoutCache.get([{ ...mutableHouse }]), upgradedLayout, 'Replaced ECS entity refreshes effect and selection references');
globalThis.__houseTestState.time.hour = 21;
const nightMeshes = await renderScene(sample);
assert.equal(nightMeshes.filter(mesh => mesh.material === SHARED_BUILDING_MATS.windowLit).length, 1);
assert.deepEqual(nightMeshes.map(mesh => ({ uuid: mesh.uuid, matrix: [...mesh.instanceMatrix.array] })), dayBuffers, 'Night switch preserves instance objects and transforms');

const reduced = [sample[0], sample[2]];
const reducedMeshes = await renderScene(reduced);
reducedMeshes.forEach(mesh => assert.equal(mesh.count, 2, 'Removing selected house reduces all instance buffers'));
const replacement = { ...sample[1], id: 'replacement', position: [15, 0, 0] };
const replacedMeshes = await renderScene([sample[0], replacement]);
const collider = replacedMeshes.find(mesh => !mesh.material.visible);
const hits = new THREE.Raycaster(new THREE.Vector3(15, 10, 0), new THREE.Vector3(0, -1, 0)).intersectObject(collider);
assert.ok(hits.length && hits[0].instanceId === 1, 'Collider hits replacement instance after same-count update');
collider.__r3f.handlers.onPointerDown({ button: 0, instanceId: hits[0].instanceId, stopPropagation() {} });
assert.equal(selected, 'replacement', 'Selection maps the current instance ID to the current entity');
globalThis.window.__lastCameraTarget = [1000, 1000];
advance(1, false, state.getState());
assert.equal(collider.parent.visible, false, 'Distant chunk hides its static meshes and colliders');
globalThis.window.__lastCameraTarget = [0, 0];
advance(2, false, state.getState());
assert.equal(collider.parent.visible, true, 'Returning camera restores the chunk');
await React.act(async () => { sceneRoot.unmount(); });
console.log('R3F lifecycle: night switch, capacity changes, same-count replacement, raycast selection and camera culling passed.');

const { BuildingsRenderer } = await import('../src/components/canvas/BuildingsRenderer.tsx');
const { buildingEntities } = await import('../src/engine/ecs/world.ts');
const inspectionCanvas = { width: 100, height: 100 };
const inspectionRoot = createRoot(inspectionCanvas);
await inspectionRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
sample.forEach(building => { building.buildingType = 'peasant_house'; building.isCompleted = true; buildingEntities.add(building); });
Object.assign(globalThis.__houseTestState, { selectedEntityId: null, buildingVersion: 1, houseFloorView: 1, isStrategicView: false,
  setSelectedEntityId(id) { globalThis.__houseTestState.selectedEntityId = id; } });
async function renderInspection() {
  await React.act(async () => { state = inspectionRoot.render(React.createElement(BuildingsRenderer)); });
  state.getState().scene.updateMatrixWorld(true);
  return state.getState().scene;
}
function visibleGeometry(scene, geometry) {
  let visible = 0;
  scene.traverse(object => {
    if (object.geometry !== geometry || object.isInstancedMesh) return;
    let ancestor = object;
    while (ancestor && ancestor.visible) ancestor = ancestor.parent;
    if (!ancestor) visible++;
  });
  return visible;
}
function houseInstanceCount(scene) {
  let count = 0;
  const geometry = house.getPeasantHouseExteriorParts(2, 'none')[0].geometry;
  scene.traverse(object => { if (object.isInstancedMesh && object.geometry === geometry) count += object.count; });
  return count;
}
assert.equal(houseInstanceCount(await renderInspection()), 3);
globalThis.__houseTestState.selectedEntityId = sample[1].id;
let inspection = await renderInspection();
assert.equal(houseInstanceCount(inspection), 2, 'Selected house leaves batches');
assert.equal(visibleGeometry(inspection, house.t2RoofGeo), 0, 'Inspection hides roof');
assert.equal(visibleGeometry(inspection, house.t1InteriorFurnitureGeo), 1, 'Ground floor interior opens');
assert.equal(visibleGeometry(inspection, house.t2UpperBedsGeo), 0, 'Upper floor stays hidden');
globalThis.__houseTestState.selectedEntityId = null;
assert.equal(houseInstanceCount(await renderInspection()), 3, 'Deselection restores batched house');
globalThis.__houseTestState.houseFloorView = 2;
globalThis.__houseTestState.selectedEntityId = sample[1].id;
inspection = await renderInspection();
assert.equal(visibleGeometry(inspection, house.t1InteriorFurnitureGeo), 0, 'Ground floor hides for upper floor inspection');
assert.equal(visibleGeometry(inspection, house.t2UpperBedsGeo), 1, 'Upper floor interior opens');
globalThis.__houseTestState.selectedEntityId = null;
await renderInspection();
sample[1].isDemolishing = true;
await React.act(async () => { advance(3, false, state.getState()); });
assert.equal(houseInstanceCount(state.getState().scene), 2, 'Mutable ECS demolition leaves batches without a store revision');
await React.act(async () => { inspectionRoot.unmount(); });
console.log('Building integration: selection, roof removal, both interior floors, deselection and mutable demolition passed.');

const { FoliageRenderer } = await import('../src/components/canvas/FoliageRenderer.tsx');
const foliageGrid = { width: 256, height: 32, generationId: 1, dirtyFoliageBuckets: new Set(),
  tiles: Array.from({ length: 256 }, () => Array.from({ length: 32 }, () => ({ terrain: 'road', height: 0.05 }))) };
foliageGrid.tiles[20][10] = { terrain: 'stone', height: 0.05, foliageType: 'rock' };
foliageGrid.tiles[200][10] = { terrain: 'stone', height: 0.05, foliageType: 'rock' };
Object.assign(globalThis.__houseTestState, { resourceDeposits: [], foliageVersion: 1, activeTreeHits: [], fallingTrees: [], isStrategicView: false });
globalThis.__houseTestState.time.season = 'Spring';
globalThis.window.__lastCameraTarget = [16, 16];
const foliageRoot = createRoot({ width: 100, height: 100 });
await foliageRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
async function renderFoliage(timestamp) {
  await React.act(async () => { state = foliageRoot.render(React.createElement(FoliageRenderer, { grid: foliageGrid })); });
  advance(timestamp, false, state.getState());
  return state.getState().scene.children[0].children.filter(object => object.isInstancedMesh);
}
let foliageMeshes = await renderFoliage(10);
const rockMesh = foliageMeshes[11], bushMesh = foliageMeshes[13], bareBushMesh = foliageMeshes[12];
assert.equal(rockMesh.count, 1, 'Initial foliage upload includes the nearby rock');
assert.equal(rockMesh.instanceMatrix.usage, THREE.DynamicDrawUsage);
assert.deepEqual(rockMesh.instanceMatrix.updateRanges, [{ start: 0, count: 16 }], 'Only one live matrix is marked for upload');
const versionsBeforeFarChange = foliageMeshes.map(mesh => mesh.instanceMatrix.version);
delete foliageGrid.tiles[200][10].foliageType;
foliageGrid.dirtyFoliageBuckets.add(12);
globalThis.__houseTestState.foliageVersion++;
foliageMeshes = await renderFoliage(11);
assert.deepEqual(foliageMeshes.map(mesh => mesh.instanceMatrix.version), versionsBeforeFarChange, 'Distant foliage change causes no visible-buffer uploads');
globalThis.window.__lastCameraTarget = [208, 16];
advance(12, false, state.getState());
assert.equal(rockMesh.count, 0, 'Moving to changed distant area uses its refreshed bucket');
globalThis.window.__lastCameraTarget = [16, 16];
advance(13, false, state.getState());
assert.equal(rockMesh.count, 1, 'Returning camera restores existing near foliage');
foliageGrid.tiles[20][10].foliageType = 'bush';
foliageGrid.dirtyFoliageBuckets.add(1);
globalThis.__houseTestState.foliageVersion++;
await renderFoliage(14);
assert.equal(rockMesh.count, 0);
assert.equal(bushMesh.count, 1, 'Visible dirty bucket updates immediately');
globalThis.__houseTestState.time.season = 'Winter';
advance(15, false, state.getState());
assert.equal(bushMesh.count, 0);
assert.equal(bareBushMesh.count, 1, 'Season changes still rebuild required buffers');
foliageGrid.tiles[20][10].foliageType = 'rock';
foliageGrid.generationId++;
await renderFoliage(16);
assert.equal(rockMesh.count, 1, 'World regeneration uploads fresh buckets even with unchanged camera bounds');
assert.equal(bareBushMesh.count, 0);
globalThis.__houseTestState.isStrategicView = true;
globalThis.window.__lastCameraZoom = 10;
await renderFoliage(17);
globalThis.window.__lastCameraTarget = [208, 16];
globalThis.window.__lastCameraZoom = 16;
advance(18, false, state.getState());
assert.equal(rockMesh.count, 0, 'Foliage prepares the destination while the main map is hidden');
const preparedVersions = foliageMeshes.map(mesh => mesh.instanceMatrix.version);
globalThis.__houseTestState.isStrategicView = false;
globalThis.window.__lastCameraZoom = 18.1;
await renderFoliage(19);
assert.deepEqual(foliageMeshes.map(mesh => mesh.instanceMatrix.version), preparedVersions, 'Strategic exit reuses prepared foliage buffers');
await React.act(async () => { foliageRoot.unmount(); });
console.log('Foliage integration: live prefix, distant edits, camera return, visible edits, seasons and world regeneration passed.');

const { DayNightLighting } = await import('../src/components/canvas/DayNightLighting.tsx');
const lightingRenderer = { ...renderer, shadowMap: { enabled: true, autoUpdate: false, needsUpdate: false } };
const lightingRoot = createRoot({ width: 100, height: 100 });
await lightingRoot.configure({ gl: lightingRenderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
buildingEntities.clear();
const shadowHouse = { id: 'shadow-home', buildingType: 'peasant_house', houseTier: 1, isCompleted: true, position: [16, 0, 16] };
buildingEntities.add(shadowHouse);
globalThis.__houseTestState.selectedEntityId = null;
globalThis.__houseTestState.houseFloorView = 1;
await React.act(async () => { state = lightingRoot.render(React.createElement(DayNightLighting)); });
advance(20, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, true, 'Initial scene requests shadows');
lightingRenderer.shadowMap.needsUpdate = false;
globalThis.__houseTestState.buildingVersion++;
advance(21, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, false, 'Road-only version does not request shadow redraw');
shadowHouse.houseTier = 2; globalThis.__houseTestState.buildingVersion++;
advance(22, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, true, 'Upgrade requests shadows');
lightingRenderer.shadowMap.needsUpdate = false;
globalThis.__houseTestState.selectedEntityId = shadowHouse.id;
advance(23, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, true, 'Inspection requests shadows');
lightingRenderer.shadowMap.needsUpdate = false;
globalThis.window.__lastCameraTarget = [70, 16];
advance(24, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, true, 'Camera recenter still redraws shadows');
lightingRenderer.shadowMap.needsUpdate = false;
buildingEntities.clear(); globalThis.__houseTestState.buildingVersion++;
advance(25, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, true, 'Removed building clears old shadows');
lightingRenderer.shadowMap.needsUpdate = false;
globalThis.__houseTestState.isStrategicView = true;
await React.act(async () => { state = lightingRoot.render(React.createElement(DayNightLighting)); });
globalThis.window.__lastCameraTarget = [130, 16];
advance(26, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, false, 'Strategic pan does not clear cached shadows with a hidden scene');
globalThis.__houseTestState.isStrategicView = false;
advance(27, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, false, 'Wait for the React visibility commit before refreshing shadows');
await React.act(async () => { state = lightingRoot.render(React.createElement(DayNightLighting)); });
advance(28, false, state.getState());
assert.equal(lightingRenderer.shadowMap.needsUpdate, true, 'Deferred shadow invalidation runs when the main map returns');
await React.act(async () => { lightingRoot.unmount(); });
console.log('Lighting integration: initial shadows, road-only revision, upgrade, inspection, recenter and removal passed.');

const { AmbientFaunaRenderer } = await import('../src/components/canvas/fauna/AmbientFaunaRenderer.tsx');
const transitionRoot = createRoot({ width: 100, height: 100 });
await transitionRoot.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
Object.assign(globalThis.__houseTestState, { isStrategicView: false, selectedEntityId: null,
  resourceDeposits: ['fish', 'berries', 'stone', 'iron', 'clay', 'salt', 'wild_game'].map((type, i) => ({
    id: `transition-deposit-${i}`, type, position: [20 + i * 6, 0.1, 20], gridPosition: [20 + i * 6, 20], currentAmount: 100, maxAmount: 100,
  })) });
globalThis.window.__lastCameraZoom = 10;
globalThis.window.__lastCameraTarget = [32, 32];
const transitionGrid = { width: 128, height: 128, getTile() { return { height: 0.1 }; } };
async function renderTransition(timestamp) {
  await React.act(async () => { state = transitionRoot.render(React.createElement(React.Fragment, null,
    React.createElement(deposits.ResourceDepositsRenderer, { grid: transitionGrid }),
    React.createElement(AmbientFaunaRenderer, { grid: transitionGrid }))); advance(timestamp, false, state.getState()); });
  state.getState().scene.updateMatrixWorld(true);
  const objects = []; state.getState().scene.traverse(object => { if (object.isMesh) objects.push(object); });
  return objects;
}
const initialTransitionMeshes = await renderTransition(30);
assert.ok(initialTransitionMeshes.length > 200, 'Fixture includes all deposits and animal models');
const identities = initialTransitionMeshes.map(mesh => [mesh.uuid, mesh.geometry.uuid, mesh.material.uuid]);
let disposedGeometries = 0;
new Set(initialTransitionMeshes.map(mesh => mesh.geometry)).forEach(geometry => geometry.addEventListener('dispose', () => disposedGeometries++));
for (let cycle = 0; cycle < 5; cycle++) {
  globalThis.__houseTestState.isStrategicView = true;
  const hiddenMeshes = await renderTransition(31 + cycle * 2);
  assert.deepEqual(hiddenMeshes.map(mesh => [mesh.uuid, mesh.geometry.uuid, mesh.material.uuid]), identities, 'Strategic entry retains all model resources');
  assert.ok(state.getState().scene.children.every(object => !object.visible), 'Hidden roots hide resources and fauna');
  const hiddenMatrices = hiddenMeshes.map(mesh => [...mesh.matrixWorld.elements]);
  await React.act(async () => { advance(31.5 + cycle * 2, false, state.getState()); });
  assert.deepEqual(hiddenMeshes.map(mesh => [...mesh.matrixWorld.elements]), hiddenMatrices, 'Hidden models do not animate or update descendant matrices');
  globalThis.__houseTestState.isStrategicView = false;
  const returnedMeshes = await renderTransition(32 + cycle * 2);
  assert.deepEqual(returnedMeshes.map(mesh => [mesh.uuid, mesh.geometry.uuid, mesh.material.uuid]), identities, 'Strategic exit reuses models instead of recreating them');
  assert.ok(state.getState().scene.children.every(object => object.visible), 'Main map restores roots');
}
assert.equal(disposedGeometries, 0, 'Transitions never dispose shared geometry');
globalThis.__houseTestState.resourceDeposits = [];
await renderTransition(50);
assert.equal(state.getState().scene.children.length, 1, 'A real world update still removes exhausted/removed resource nodes');
await React.act(async () => { transitionRoot.unmount(); });
console.log('Map transitions: five round trips retain meshes, geometry and materials; hidden animations/matrices pause; deferred shadows and prepared foliage passed.');

const { HouseMultiDrawBatches } = await import('../src/components/canvas/buildings/HouseMultiDrawBatches.ts');
const staticHouses = new HouseMultiDrawBatches();
staticHouses.sync(batches, false); staticHouses.update(undefined, 38);
assert.equal(staticHouses.group.children.length, 20, '100 houses share material draws across four spatial chunks');
console.log(`100-house multi-draw: ${draws} -> ${staticHouses.group.children.length} static material draws.`);
staticHouses.dispose();

function renderParts(scene, original = false) {
  const result = [];
  scene.traverseVisible(mesh => {
    if (!mesh.isMesh || !original && !(mesh.layers.mask & 1)) return;
    if (mesh.isBatchedMesh) {
      if (original) return;
      mesh._instanceInfo.forEach((instance, id) => {
        if (!instance.active || !instance.visible) return;
        const range = mesh.getGeometryRangeAt(instance.geometryIndex);
        const matrix = new THREE.Matrix4(); mesh.getMatrixAt(id, matrix); matrix.premultiply(mesh.matrixWorld);
        result.push({ mesh, matrix, material: mesh.material, begin: range.indexStart, end: range.indexStart + range.indexCount });
      });
      return;
    }
    if (mesh.isInstancedMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = Array.isArray(mesh.material) ? mesh.geometry.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
    for (const group of groups) {
      const material = materials[group.materialIndex ?? 0]; if (!material?.visible) continue;
      result.push({ mesh, matrix: mesh.matrixWorld, material,
        begin: Math.max(group.start, mesh.geometry.drawRange.start),
        end: Math.min(group.start + group.count, mesh.geometry.drawRange.start + mesh.geometry.drawRange.count,
          mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) });
    }
  });
  return result;
}
function worldTriangles(parts) {
  const buckets = new Map();
  for (const { mesh, matrix, material, begin, end } of parts) {
    const geometry = mesh.geometry, normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const key = `${material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
    const list = buckets.get(key) ?? []; buckets.set(key, list);
    for (let i = begin; i < end; i += 3) {
      const triangle = [];
      for (let j = 0; j < 3; j++) {
        const vertex = geometry.index?.getX(i + j) ?? i + j;
        const position = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, vertex).applyMatrix4(matrix);
        const normal = new THREE.Vector3().fromBufferAttribute(geometry.attributes.normal, vertex).applyNormalMatrix(normalMatrix);
        triangle.push(...position.toArray(), ...normal.toArray(), geometry.attributes.uv?.getX(vertex) ?? 0, geometry.attributes.uv?.getY(vertex) ?? 0);
      }
      list.push(triangle);
    }
  }
  for (const list of buckets.values()) list.sort((a, b) => {
    for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 0.00005) return a[i] - b[i];
    return 0;
  });
  return buckets;
}
function worldParity(actualParts, expectedParts, label) {
  const actual = worldTriangles(actualParts), expected = worldTriangles(expectedParts);
  assert.equal(actual.size, expected.size, label + ': material/shadow buckets');
  for (const [key, triangles] of expected) {
    const found = actual.get(key); assert.ok(found, label + ': material exists');
    assert.equal(found.length, triangles.length, label + ': triangle count');
    triangles.forEach((triangle, i) => triangle.forEach((value, j) =>
      assert.ok(Math.abs(value - found[i][j]) < 0.00005, `${label}: position/normal/UV ${key}, ${i}, ${j}`)));
  }
}
const multiRenderer = { ...renderer, extensions: { has: name => name === 'WEBGL_multi_draw' },
  render(scene, camera) { scene.updateMatrixWorld(); scene.onBeforeRender(this, scene, camera, null); } };
const multiRoot = createRoot({ width: 100, height: 100 });
await multiRoot.configure({ gl: multiRenderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
globalThis.window.__lastCameraTarget = [20, 20]; globalThis.window.__lastCameraZoom = 38;
globalThis.__houseTestState.time.hour = 12;
const mixed = Array.from({ length: 9 }, (_, i) => ({ id: `mixed-${i}`, houseTier: i % 3 + 1,
  backyardExtension: yards[i % yards.length], position: [i * 8, 0.1, i % 2 * 12], rotationAngle: i % 4 * Math.PI / 2 }));
let multiState, multiFrame = 100;
async function drawMulti(items) {
  await React.act(async () => {
    multiState = multiRoot.render(React.createElement(React.StrictMode, null,
      React.createElement(InstancedHousesRenderer, { buildings: items, onSelect: id => { selected = id; } })));
  });
  await React.act(async () => { advance(++multiFrame, false, multiState.getState()); });
  return multiState.getState().scene;
}
function houseReference(items) {
  const reference = new THREE.Group();
  for (const batch of makeHouseBatches(items)) {
    const distance = Math.max(38, Math.min(50, 1200 / window.__lastCameraZoom + 12));
    if (!batch.buildings.some(building => { const m = getHouseWorldMatrix(building);
      return (m.elements[12] - window.__lastCameraTarget[0]) ** 2 + (m.elements[14] - window.__lastCameraTarget[1]) ** 2 < distance ** 2; })) continue;
    for (const building of batch.buildings) for (const part of batch.parts) {
      const mesh = new THREE.Mesh(part.geometry, house.getPeasantHouseExteriorMaterial(part.material, __houseTestState.time.hour >= 20));
      mesh.matrixAutoUpdate = false; mesh.matrix.copy(getHouseWorldMatrix(building));
      mesh.castShadow = part.castShadow; mesh.receiveShadow = part.receiveShadow; reference.add(mesh);
    }
  }
  reference.updateMatrixWorld(); return renderParts(reference);
}
let multiScene = await drawMulti(mixed);
worldParity(renderParts(multiScene).filter(part => part.mesh.isBatchedMesh), houseReference(mixed), 'Mixed tiers/yards/rotations and chunk culling');
const owned = []; multiScene.traverse(mesh => { if (mesh.isBatchedMesh) owned.push([mesh.uuid, mesh._matricesTexture.version]); });
multiScene = await drawMulti([...mixed]);
const reused = []; multiScene.traverse(mesh => { if (mesh.isBatchedMesh) reused.push([mesh.uuid, mesh._matricesTexture.version]); });
assert.deepEqual(reused, owned, 'Unchanged layout keeps batch buffers and skips transform uploads');
__houseTestState.time.hour = 21;
multiScene = await drawMulti(mixed);
worldParity(renderParts(multiScene).filter(part => part.mesh.isBatchedMesh), houseReference(mixed), 'Night windows preserve all house geometry');
window.__lastCameraTarget = [65, 5];
multiScene = await drawMulti(mixed);
worldParity(renderParts(multiScene).filter(part => part.mesh.isBatchedMesh), houseReference(mixed), 'Camera return restores exact spatial chunks');
const replacementHouse = { ...mixed[0], id: 'multi-replacement', position: [2, 0.1, 3] };
window.__lastCameraTarget = [0, 0];
multiScene = await drawMulti([replacementHouse]);
let clickable; multiScene.traverse(mesh => { if (mesh.isInstancedMesh && !mesh.material.visible) clickable = mesh; });
const multiHits = new THREE.Raycaster(new THREE.Vector3(2, 10, 3), new THREE.Vector3(0, -1, 0)).intersectObject(clickable);
assert.ok(multiHits.length, 'Multi-draw houses retain physical selection collider');
clickable.__r3f.handlers.onPointerDown({ button: 0, instanceId: multiHits[0].instanceId, stopPropagation() {} });
assert.equal(selected, 'multi-replacement');
multiScene = await drawMulti([]);
assert.equal(renderParts(multiScene).length, 0, 'Removing all houses clears owned batches');
await React.act(async () => { multiRoot.unmount(); });
console.log('House multi-draw: geometry/UV/normals/shadows, night, culling, buffer reuse, collider and StrictMode cleanup passed.');

const resourceRoot = createRoot({ width: 100, height: 100 });
await resourceRoot.configure({ gl: multiRenderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } });
window.__lastCameraTarget = [32, 32]; window.__lastCameraZoom = 10;
Object.assign(__houseTestState, { isStrategicView: false, selectedEntityId: null,
  resourceDeposits: ['fish', 'berries', 'stone', 'iron', 'clay', 'salt', 'wild_game'].map((type, i) => ({
    id: `batched-deposit-${i}`, type, position: [20 + i * 6, 0.1, 20], gridPosition: [20 + i * 6, 20], currentAmount: 100, maxAmount: 100 })) });
const resourceItems = __houseTestState.resourceDeposits;
let resourceState, resourceFrame = 200;
async function drawResources() {
  await React.act(async () => {
    resourceState = resourceRoot.render(React.createElement(React.StrictMode, null,
      React.createElement(deposits.ResourceDepositsRenderer, { grid: transitionGrid })));
  });
  await React.act(async () => { advance(++resourceFrame, false, resourceState.getState()); });
  return resourceState.getState().scene;
}
function resourceParity(scene, label) {
  const original = scene.children.find(object => object.__r3f);
  worldParity(renderParts(scene), original ? renderParts(original, true) : [], label);
}
let resourceScene = await drawResources();
resourceParity(resourceScene, 'All deposit types');
const sourceCalls = renderParts(resourceScene.children.find(object => object.__r3f), true).length;
const actualCalls = []; resourceScene.traverseVisible(mesh => { if (mesh.isMesh && mesh.layers.mask & 1 && mesh.material.visible) actualCalls.push(mesh); });
assert.ok(actualCalls.length < sourceCalls, 'Resource batching reduces submitted material draws');
console.log(`Seven resource nodes: ${sourceCalls} -> ${actualCalls.length} material draws (including unbatched transparent details).`);
resourceScene = await drawResources(); resourceParity(resourceScene, 'Animated fish and wildlife heads');
__houseTestState.isStrategicView = true;
resourceScene = await drawResources(); assert.equal(renderParts(resourceScene).length, 0, 'Strategic view hides deposits and batches');
__houseTestState.isStrategicView = false;
resourceScene = await drawResources(); resourceParity(resourceScene, 'Main map restores resource geometry');
__houseTestState.resourceDeposits = [];
resourceScene = await drawResources(); assert.equal(renderParts(resourceScene).length, 0, 'Empty resource root removes all ghost batches');
__houseTestState.resourceDeposits = resourceItems;
resourceScene = await drawResources(); resourceParity(resourceScene, 'New region restores batched deposits after empty root');
await React.act(async () => { resourceRoot.unmount(); });
assert.equal(resourceScene.children.length, 0, 'Unmount removes both manually owned batches and React root');
console.log('Resource multi-draw: animated geometry, normals, UVs, material/shadow flags, map transitions and empty/remounted root passed.');
