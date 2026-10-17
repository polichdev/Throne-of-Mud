import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { ChimneySmoke, IndoorFireplaceFire } from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const smelterStoneDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const base = new THREE.BoxGeometry(4.85, 0.10, 2.85); base.translate(0, 0.05, 0); geos.push(toStandard(base));
  const fPlinth = new THREE.CylinderGeometry(0.92, 0.98, 0.18, 16); fPlinth.translate(-1.45, 0.09, 0); geos.push(toStandard(fPlinth));
  const hearthSill = new THREE.BoxGeometry(0.74, 0.06, 0.36); hearthSill.translate(-1.45, 0.18, 0.70); geos.push(toStandard(hearthSill));
  const tBase = new THREE.BoxGeometry(0.58, 0.08, 0.73); tBase.translate(0.40, 0.42, -0.65); geos.push(toStandard(tBase));
  return mergeGeometries(geos) || geos[0];
})();

export const smelterStoneMedGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const pad = new THREE.BoxGeometry(4.70, 0.03, 2.70); pad.translate(0, 0.105, 0); geos.push(toStandard(pad));
  const lowerBase = new THREE.CylinderGeometry(0.78, 0.88, 0.46, 16, 1, false, 0.40, Math.PI * 2 - 0.80);
  lowerBase.translate(-1.45, 0.38, 0);
  geos.push(toStandard(lowerBase));
  return mergeGeometries(geos) || geos[0];
})();

export const smelterClayGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const cone = new THREE.CylinderGeometry(0.38, 0.78, 1.15, 16); cone.translate(-1.45, 1.25, 0); geos.push(toStandard(cone));
  return mergeGeometries(geos) || geos[0];
})();

export const smelterStoneLightGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const jambL = new THREE.BoxGeometry(0.14, 0.52, 0.26); jambL.translate(-1.45 - 0.30, 0.44, 0.72);
  const jambR = new THREE.BoxGeometry(0.14, 0.52, 0.26); jambR.translate(-1.45 + 0.30, 0.44, 0.72);
  const arch = new THREE.BoxGeometry(0.74, 0.16, 0.28); arch.translate(-1.45, 0.72, 0.72);
  const keystone = new THREE.BoxGeometry(0.18, 0.20, 0.30); keystone.translate(-1.45, 0.76, 0.75);
  geos.push(toStandard(jambL), toStandard(jambR), toStandard(arch), toStandard(keystone));

  const cap = new THREE.CylinderGeometry(0.36, 0.40, 0.14, 16); cap.translate(-1.45, 1.88, 0); geos.push(toStandard(cap));
  const rim = new THREE.TorusGeometry(0.24, 0.035, 8, 16);
  rim.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(-1.45, 1.95, 0));
  geos.push(toStandard(rim));

  return mergeGeometries(geos) || geos[0];
})();

export const smelterTimberGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const posts: [number, number][] = [
    [-0.35, 1.20], [2.15, 1.20], [-0.35, -1.20], [2.15, -1.20]
  ];
  for (const [px, pz] of posts) {
    const p = new THREE.BoxGeometry(0.11, 1.70, 0.11);
    p.translate(px, 0.95, pz);
    geos.push(toStandard(p));
  }

  const b1 = new THREE.BoxGeometry(2.60, 0.10, 0.11); b1.translate(0.90, 1.80, 1.20); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(2.60, 0.10, 0.11); b2.translate(0.90, 1.80, -1.20); geos.push(toStandard(b2));
  const b3 = new THREE.BoxGeometry(0.11, 0.10, 2.40); b3.translate(-0.35, 1.80, 0.0); geos.push(toStandard(b3));
  const b4 = new THREE.BoxGeometry(0.11, 0.10, 2.40); b4.translate(2.15, 1.80, 0.0); geos.push(toStandard(b4));
  const ridge = new THREE.BoxGeometry(2.78, 0.09, 0.15); ridge.translate(0.90, 2.44, 0.0); geos.push(toStandard(ridge));

  const sandBox = new THREE.BoxGeometry(1.05, 0.10, 0.95); sandBox.translate(0.40, 0.16, 0.45); geos.push(toStandard(sandBox));

  const toolBench = new THREE.BoxGeometry(0.70, 0.36, 0.85); toolBench.translate(0.40, 0.29, -0.65); geos.push(toStandard(toolBench));

  const charBin = new THREE.BoxGeometry(0.54, 0.36, 0.75); charBin.translate(1.48 + 0.28, 0.29, -0.65); geos.push(toStandard(charBin));

  const stump = new THREE.CylinderGeometry(0.16, 0.18, 0.30, 8); stump.translate(0.40 - 0.42, 0.26, -0.65); geos.push(toStandard(stump));

  const belM = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-1.45 - 0.72, 0.11, 0);
  const bBoard = new THREE.BoxGeometry(0.44, 0.04, 0.70);
  bBoard.applyMatrix4(new THREE.Matrix4().makeRotationX(0.15).setPosition(0, 0.38, 0).premultiply(belM));
  geos.push(toStandard(bBoard));

  const bLever = new THREE.BoxGeometry(0.07, 0.65, 0.07);
  bLever.applyMatrix4(new THREE.Matrix4().makeRotationX(0.38).setPosition(0, 0.46, 0.26).premultiply(belM));
  geos.push(toStandard(bLever));

  return mergeGeometries(geos) || geos[0];
})();

export const smelterSteelGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const anvil = new THREE.BoxGeometry(0.18, 0.12, 0.28); anvil.translate(0.40 - 0.42, 0.46, -0.65); geos.push(toStandard(anvil));

  const hammerM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.3, 0, 0.25)).setPosition(0.40 + 0.38, 0.11 + 0.54, -0.65 + 0.10);
  const hHead = new THREE.BoxGeometry(0.12, 0.09, 0.09);
  hHead.applyMatrix4(hammerM);
  geos.push(toStandard(hHead));

  const belM = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-1.45 - 0.72, 0.11, 0);
  const noz = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 8);
  noz.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.18, -0.42).premultiply(belM));
  geos.push(toStandard(noz));

  for (const x of [-0.26, 0.0, 0.26]) {
    const moldIngot = new THREE.BoxGeometry(0.18, 0.02, 0.36);
    moldIngot.translate(0.40 + x, 0.11 + 0.10, 0.45 + 0.18);
    geos.push(toStandard(moldIngot));
  }

  for (const x of [-0.26, 0.0, 0.26]) {
    const ing = new THREE.BoxGeometry(0.20, 0.07, 0.42);
    ing.translate(1.48 + x, 0.11 + 0.07, 0.48 - 0.12);
    geos.push(toStandard(ing));
  }
  for (const z of [-0.14, 0.14]) {
    const ing = new THREE.BoxGeometry(0.72, 0.07, 0.18);
    ing.translate(1.48, 0.11 + 0.14, 0.48 + z);
    geos.push(toStandard(ing));
  }
  for (const x of [-0.12, 0.12]) {
    const ing = new THREE.BoxGeometry(0.20, 0.07, 0.36);
    ing.translate(1.48 + x, 0.11 + 0.21, 0.48);
    geos.push(toStandard(ing));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const smelterMoltenIronGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const x of [-0.26, 0.0, 0.26]) {
    const hotIngot = new THREE.BoxGeometry(0.18, 0.02, 0.36);
    hotIngot.translate(0.40 + x, 0.11 + 0.10, 0.45 - 0.18);
    geos.push(toStandard(hotIngot));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const smelterOreGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const o1 = new THREE.DodecahedronGeometry(0.24, 0); o1.translate(1.48 - 0.30, 0.27, -0.65); geos.push(toStandard(o1));
  const o2 = new THREE.DodecahedronGeometry(0.18, 0); o2.translate(1.48 - 0.14, 0.22, -0.65 + 0.24); geos.push(toStandard(o2));
  const o3 = new THREE.DodecahedronGeometry(0.16, 0); o3.translate(1.48 - 0.38, 0.20, -0.65 - 0.22); geos.push(toStandard(o3));
  return mergeGeometries(geos) || geos[0];
})();

export const smelterCharcoalGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const charPile = new THREE.DodecahedronGeometry(0.22, 0); charPile.translate(1.48 + 0.28, 0.45, -0.65); geos.push(toStandard(charPile));
  const flueSoot = new THREE.CylinderGeometry(0.21, 0.21, 0.08, 12).translate(-1.45, 1.94, 0); geos.push(toStandard(flueSoot));
  const fireCavity = new THREE.BoxGeometry(0.58, 0.48, 0.45); fireCavity.translate(-1.45, 0.38, 0.40); geos.push(toStandard(fireCavity));
  return mergeGeometries(geos) || geos[0];
})();

export const smelterSandSoilGeo = (() => {
  const sand = new THREE.BoxGeometry(0.95, 0.04, 0.85);
  sand.translate(0.40, 0.19, 0.45);
  return toStandard(sand);
})();

export const smelterPalletPlanksGeo = (() => {
  const pallet = new THREE.BoxGeometry(0.95, 0.04, 0.80);
  pallet.translate(1.48, 0.14, 0.48);
  return toStandard(pallet);
})();

export const smelterBellowsLeatherGeo = (() => {
  const belM = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-1.45 - 0.72, 0.11, 0);
  const bBody = new THREE.BoxGeometry(0.42, 0.28, 0.68);
  bBody.applyMatrix4(new THREE.Matrix4().makeRotationX(0.15).setPosition(0, 0.24, 0).premultiply(belM));
  return toStandard(bBody);
})();

export const smelterRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(2.75, 0.08, 1.50);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.42).setPosition(0.90, 2.12, -0.62));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(2.75, 0.08, 1.50);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.42).setPosition(0.90, 2.12, 0.62));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export function IronSmelterModel({
  isLightOn = false,
  isWorking = true,
  roofRef,
}: {
  isLightOn?: boolean;
  isWorking?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <mesh geometry={smelterStoneDarkGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={smelterStoneMedGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={smelterClayGeo} material={mats.clayOrange} castShadow receiveShadow />
      <mesh geometry={smelterStoneLightGeo} material={mats.stoneLight} />
      <mesh geometry={smelterTimberGeo} material={mats.timberDark} castShadow receiveShadow />
      <mesh geometry={smelterSteelGeo} material={mats.ironSteel} />
      <mesh geometry={smelterMoltenIronGeo} material={mats.moltenIron} receiveShadow />
      <mesh geometry={smelterOreGeo} material={mats.ironOre} />
      <mesh geometry={smelterCharcoalGeo} material={mats.charcoalBlack} />
      <mesh geometry={smelterSandSoilGeo} material={mats.richSoil} receiveShadow />
      <mesh geometry={smelterPalletPlanksGeo} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={smelterBellowsLeatherGeo} material={mats.bootsLeather} />

      <IndoorFireplaceFire position={[-1.45, 0.18, 0.62]} scale={0.88} isLit={isWorking || isLightOn} />

      {isWorking && <ChimneySmoke position={[-1.45, 2.02, 0]} />}

      <group ref={roofRef}>
        <mesh geometry={smelterRoofGeo} material={mats.shingleRoof} castShadow receiveShadow />
      </group>
    </group>
  );
}
