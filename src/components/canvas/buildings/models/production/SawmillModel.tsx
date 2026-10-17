import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const sawmillBaseGeo = (() => {
  const base = new THREE.BoxGeometry(4.92, 0.10, 2.92); base.translate(0, 0.05, 0);
  return toStandard(base);
})();

export const sawmillFloorGeo = (() => {
  const floor = new THREE.BoxGeometry(4.76, 0.04, 2.76); floor.translate(0, 0.11, 0);
  return toStandard(floor);
})();

export const sawmillTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const sawM = new THREE.Matrix4().setPosition(-1.0, 0.11, 0);

  const u1 = new THREE.BoxGeometry(0.16, 1.20, 0.85); u1.applyMatrix4(new THREE.Matrix4().setPosition(-0.85, 0.65, 0).premultiply(sawM)); geos.push(toStandard(u1));
  const u2 = new THREE.BoxGeometry(0.16, 1.20, 0.85); u2.applyMatrix4(new THREE.Matrix4().setPosition(0.85, 0.65, 0).premultiply(sawM)); geos.push(toStandard(u2));
  const topB = new THREE.BoxGeometry(1.86, 0.12, 0.20); topB.applyMatrix4(new THREE.Matrix4().setPosition(0, 1.25, 0).premultiply(sawM)); geos.push(toStandard(topB));

  const g1 = new THREE.BoxGeometry(0.08, 0.08, 0.45); g1.applyMatrix4(new THREE.Matrix4().setPosition(0, 1.22, 0).premultiply(sawM)); geos.push(toStandard(g1));
  const g2 = new THREE.BoxGeometry(0.08, 0.08, 0.45); g2.applyMatrix4(new THREE.Matrix4().setPosition(0, -0.01, 0).premultiply(sawM)); geos.push(toStandard(g2));

  for (const sx of [-0.55, 0.55]) {
    const sp = new THREE.BoxGeometry(0.04, 0.03, 0.72);
    sp.translate(1.35 + sx, 0.11 + 0.15, -0.65);
    geos.push(toStandard(sp));
  }

  for (const px of [-2.20, -0.70, 0.70, 2.20]) {
    for (const pz of [1.25, -1.25]) {
      const p = new THREE.BoxGeometry(0.14, 1.70, 0.14);
      p.translate(px, 0.95, pz);
      geos.push(toStandard(p));
    }
  }

  const h1 = new THREE.BoxGeometry(4.70, 0.10, 0.14); h1.translate(0, 1.80, 1.25); geos.push(toStandard(h1));
  const h2 = new THREE.BoxGeometry(4.70, 0.10, 0.14); h2.translate(0, 1.80, -1.25); geos.push(toStandard(h2));

  return mergeGeometries(geos) || geos[0];
})();

export const sawmillLogsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const activeLog = new THREE.CylinderGeometry(0.22, 0.24, 2.10, 12);
  activeLog.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(-1.0, 0.11 + 0.70, 0));
  geos.push(toStandard(activeLog));

  const l1 = new THREE.CylinderGeometry(0.13, 0.13, 1.45, 8);
  l1.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(1.35, 0.11 + 0.12, 0.65 - 0.22));
  geos.push(toStandard(l1));

  const l2 = new THREE.CylinderGeometry(0.14, 0.14, 1.45, 8);
  l2.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(1.35, 0.11 + 0.12, 0.65 + 0.22));
  geos.push(toStandard(l2));

  const l3 = new THREE.CylinderGeometry(0.13, 0.13, 1.35, 8);
  l3.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(1.35, 0.11 + 0.34, 0.65));
  geos.push(toStandard(l3));

  return mergeGeometries(geos) || geos[0];
})();

export const sawmillPlanksGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const b1 = new THREE.BoxGeometry(1.50, 0.12, 0.75); b1.translate(1.35, 0.11 + 0.08, -0.65); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(1.45, 0.12, 0.70); b2.translate(1.35, 0.11 + 0.22, -0.65); geos.push(toStandard(b2));
  const b3 = new THREE.BoxGeometry(1.40, 0.12, 0.65); b3.translate(1.35, 0.11 + 0.35, -0.65); geos.push(toStandard(b3));
  return mergeGeometries(geos) || geos[0];
})();

export const sawmillSawGeo = (() => {
  const blade = new THREE.BoxGeometry(0.04, 1.25, 0.18);
  blade.translate(-1.0, 0.11 + 0.60, 0);
  return toStandard(blade);
})();

export const sawmillShavingsGeo = (() => {
  const shavings = new THREE.ConeGeometry(0.55, 0.20, 10);
  shavings.translate(-1.0, 0.11 + 0.10, 0);
  return toStandard(shavings);
})();

export const sawmillRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(4.98, 0.09, 1.55);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.42).setPosition(0, 2.12, -0.68));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(4.98, 0.09, 1.55);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.42).setPosition(0, 2.12, 0.68));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export const sawmillRoofRidgeGeo = (() => {
  const r = new THREE.BoxGeometry(5.02, 0.10, 0.16);
  r.translate(0, 2.45, 0);
  return toStandard(r);
})();

export function SawmillModel({
  isLightOn = false,
  roofRef,
}: {
  isLightOn?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;
  void isLightOn;

  return (
    <group>
      <mesh geometry={sawmillBaseGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={sawmillFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={sawmillTimberDarkGeo} material={mats.timberDark} castShadow receiveShadow />
      <mesh geometry={sawmillLogsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={sawmillPlanksGeo} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={sawmillSawGeo} material={mats.sawBlade} />
      <mesh geometry={sawmillShavingsGeo} material={mats.woodShavings} />

      <group position={[1.35 - 0.60, 0.11 + 0.22, 0.65]} rotation={[0, 0, 0.35]}>
        <mesh material={mats.timberLight} position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.55, 5]} />
        </mesh>
        <mesh material={mats.axeBlade} position={[0, 0.50, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.12, 0.10, 0.02]} />
        </mesh>
      </group>

      <group ref={roofRef}>
        <mesh geometry={sawmillRoofGeo} material={mats.thatchRoof} castShadow receiveShadow />
        <mesh geometry={sawmillRoofRidgeGeo} material={mats.thatchRidge} />
      </group>
    </group>
  );
}
