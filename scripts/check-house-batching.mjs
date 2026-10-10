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
      source = "export { PeasantHouseModel } from './PeasantHouseModel.tsx';\n" + names.filter(name => name !== 'PeasantHouseModel').map(name => `export const ${name} = () => null;`).join('\n');
    } else if (filename.endsWith('/buildings/InstancedWallsRenderer.tsx')) {
      source = 'export const InstancedWallsRenderer = () => null;';
    } else if (/\.(ts|tsx)$/.test(filename) && filename.startsWith(root.replaceAll('\\', '/'))) {
      source = fs.readFileSync(filename, 'utf8');
      if (filename.endsWith('/PeasantHouseModel.tsx')) {
        source += '\nexport { HouseFacadeDetails, HouseSideWindowDetails, HouseFacade, expandHouseStaticPart };';
      }
    }
    if (source !== undefined) {
      return { format: 'module', source: ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX,
      }, fileName: filename }).outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

const house = await import('../src/components/canvas/buildings/models/PeasantHouseModel.tsx');
const { mergeStaticMeshParts } = await import('../src/components/canvas/buildings/staticMeshParts.ts');
const { makeHouseBatches, getHouseWorldMatrix } = await import('../src/components/canvas/buildings/InstancedHousesRenderer.tsx');
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
