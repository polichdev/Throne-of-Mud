import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { ChimneySmoke, IndoorFireplaceFire } from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const saltStoneDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const base = new THREE.BoxGeometry(3.92, 0.10, 2.92); base.translate(0, 0.05, 0); geos.push(toStandard(base));
  const fBase = new THREE.BoxGeometry(1.75, 0.60, 2.00); fBase.translate(-0.95, 0.46, -0.05); geos.push(toStandard(fBase));
  return mergeGeometries(geos) || geos[0];
})();

export const saltStoneMedGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const pad = new THREE.BoxGeometry(3.76, 0.03, 2.76); pad.translate(0, 0.105, 0); geos.push(toStandard(pad));
  const stack = new THREE.BoxGeometry(0.36, 1.50, 0.36); stack.translate(-0.95 - 0.60, 0.11 + 1.35, -0.05 - 0.75); geos.push(toStandard(stack));
  const pot = new THREE.CylinderGeometry(0.11, 0.13, 0.16, 8); pot.translate(-0.95 - 0.60, 0.11 + 2.22, -0.05 - 0.75); geos.push(toStandard(pot));
  return mergeGeometries(geos) || geos[0];
})();

export const saltStoneLightGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const cornice = new THREE.BoxGeometry(0.42, 0.08, 0.42); cornice.translate(-0.95 - 0.60, 0.11 + 2.12, -0.05 - 0.75); geos.push(toStandard(cornice));
  const rim = new THREE.CylinderGeometry(0.13, 0.13, 0.03, 8); rim.translate(-0.95 - 0.60, 0.11 + 2.30, -0.05 - 0.75); geos.push(toStandard(rim));
  return mergeGeometries(geos) || geos[0];
})();

export const saltIronPanGeo = (() => {
  const pan = new THREE.BoxGeometry(1.65, 0.08, 1.90);
  pan.translate(-0.95, 0.11 + 0.68, -0.05);
  return toStandard(pan);
})();

export const saltWhiteGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const pSalt = new THREE.BoxGeometry(1.50, 0.03, 1.75); pSalt.translate(-0.95, 0.11 + 0.72, -0.05); geos.push(toStandard(pSalt));

  const h1 = new THREE.ConeGeometry(0.22, 0.26, 6); h1.translate(0.95 - 0.40, 0.11 + 0.44, -0.55); geos.push(toStandard(h1));
  const h2 = new THREE.ConeGeometry(0.24, 0.28, 6); h2.translate(0.95 + 0.05, 0.11 + 0.44, -0.55); geos.push(toStandard(h2));
  const h3 = new THREE.ConeGeometry(0.20, 0.24, 6); h3.translate(0.95 + 0.45, 0.11 + 0.42, -0.55); geos.push(toStandard(h3));

  const bSalt = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 8); bSalt.translate(0.95 - 0.35, 0.11 + 0.36, 0.65); geos.push(toStandard(bSalt));

  return mergeGeometries(geos) || geos[0];
})();

export const saltTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const lx of [-0.58, 0.58]) {
    for (const lz of [-0.30, 0.30]) {
      const leg = new THREE.BoxGeometry(0.05, 0.28, 0.05);
      leg.translate(0.95 + lx, 0.11 + 0.14, -0.55 + lz);
      geos.push(toStandard(leg));
    }
  }

  const rakeM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.25, 0, 0.2)).setPosition(-0.05, 0.11, 0.85);
  const rHead = new THREE.BoxGeometry(0.28, 0.06, 0.03);
  rHead.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.92, 0).premultiply(rakeM));
  geos.push(toStandard(rHead));

  const posts: [number, number][] = [
    [0.10, 1.15], [1.75, 1.15], [0.10, -1.25], [1.75, -1.25]
  ];
  for (const [px, pz] of posts) {
    const post = new THREE.BoxGeometry(0.12, 1.70, 0.12);
    post.translate(px, 0.95, pz);
    geos.push(toStandard(post));
  }

  const b1 = new THREE.BoxGeometry(1.75, 0.10, 0.12); b1.translate(0.925, 1.80, 1.15); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(1.75, 0.10, 0.12); b2.translate(0.925, 1.80, -1.25); geos.push(toStandard(b2));
  const ridge = new THREE.BoxGeometry(1.88, 0.10, 0.14); ridge.translate(0.925, 2.36, -0.05); geos.push(toStandard(ridge));

  return mergeGeometries(geos) || geos[0];
})();

export const saltTimberPlanksGeo = (() => {
  const table = new THREE.BoxGeometry(1.35, 0.05, 0.75);
  table.translate(0.95, 0.11 + 0.28, -0.55);
  return toStandard(table);
})();

export const saltBarrelWoodGeo = (() => {
  const barrel = new THREE.CylinderGeometry(0.20, 0.17, 0.36, 8);
  barrel.translate(0.95 - 0.35, 0.11 + 0.18, 0.65);
  return toStandard(barrel);
})();

export const saltFireGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const charBack = new THREE.BoxGeometry(0.55, 0.40, 0.06); charBack.translate(-0.95, 0.11 + 0.22, -0.05 + 1.01); geos.push(toStandard(charBack));
  const soot = new THREE.CylinderGeometry(0.085, 0.085, 0.04, 8); soot.translate(-0.95 - 0.60, 0.11 + 2.29, -0.05 - 0.75); geos.push(toStandard(soot));
  return mergeGeometries(geos) || geos[0];
})();

export const saltSacksGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.SphereGeometry(0.17, 6, 6); s1.translate(0.95 + 0.15, 0.11 + 0.14, 0.65 - 0.10); geos.push(toStandard(s1));
  const s2 = new THREE.SphereGeometry(0.15, 6, 6); s2.translate(0.95 + 0.35, 0.11 + 0.12, 0.65 + 0.12); geos.push(toStandard(s2));
  return mergeGeometries(geos) || geos[0];
})();

export const saltRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(1.85, 0.08, 1.45);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.42).setPosition(0.925, 2.08, -0.60));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(1.85, 0.08, 1.45);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.42).setPosition(0.925, 2.08, 0.50));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export function SaltWorksModel({
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
      <mesh geometry={saltStoneDarkGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={saltStoneMedGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={saltStoneLightGeo} material={mats.stoneLight} />
      <mesh geometry={saltIronPanGeo} material={mats.ironSteel} />
      <mesh geometry={saltWhiteGeo} material={mats.saltWhite} />
      <mesh geometry={saltTimberDarkGeo} material={mats.timberDark} castShadow receiveShadow />
      <mesh geometry={saltTimberPlanksGeo} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={saltBarrelWoodGeo} material={mats.barrelWood} />
      <mesh geometry={saltFireGeo} material={mats.charcoalBlack} />
      <mesh geometry={saltSacksGeo} material={mats.flourSack} />

      <IndoorFireplaceFire position={[-0.95, 0.14, 0.88]} scale={0.72} isLit={isWorking || isLightOn} />

      <mesh
        material={mats.timberLight}
        position={[-0.05, 0.56, 0.85]}
        rotation={[0.25, 0, 0.2]}
      >
        <cylinderGeometry args={[0.015, 0.015, 0.95, 5]} />
      </mesh>

      {isWorking && <ChimneySmoke position={[-1.55, 2.45, -0.80]} />}

      <group ref={roofRef}>
        <mesh geometry={saltRoofGeo} material={mats.shingleRoof} castShadow receiveShadow />
      </group>
    </group>
  );
}
