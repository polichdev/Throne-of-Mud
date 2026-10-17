import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

function createStonecutterGable(posX: number, rotY: number) {
  const baseWidth = 2.70;
  const height = 0.95;
  const thickness = 0.14;
  const half = baseWidth / 2;
  const slopeAngle = Math.atan2(height, half);
  const hypotenuse = Math.sqrt(half * half + height * height);

  const s = new THREE.Shape();
  s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, height); s.closePath();
  const sGeo = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false });

  const g1 = new THREE.BoxGeometry(0.08, height, 0.04).translate(0, height / 2, thickness + 0.01);
  const g2 = new THREE.BoxGeometry(0.07, hypotenuse, 0.05);
  g2.applyMatrix4(new THREE.Matrix4().makeRotationZ(slopeAngle - Math.PI / 2).setPosition(-half / 2, height / 2, thickness + 0.01));
  const g3 = new THREE.BoxGeometry(0.07, hypotenuse, 0.05);
  g3.applyMatrix4(new THREE.Matrix4().makeRotationZ(-(slopeAngle - Math.PI / 2)).setPosition(half / 2, height / 2, thickness + 0.01));
  const frameGeo = mergeGeometries([toStandard(g1), toStandard(g2), toStandard(g3)]) || g1;

  const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(posX, 1.85, 0);
  return {
    wall: toStandard(sGeo).applyMatrix4(m),
    frame: toStandard(frameGeo).applyMatrix4(m),
  };
}

const _scGableL = createStonecutterGable(-2.25, Math.PI / 2);
const _scGableR = createStonecutterGable(2.25, -Math.PI / 2);

export const stonecutterBaseGeo = (() => {
  const base = new THREE.BoxGeometry(4.92, 0.10, 2.92); base.translate(0, 0.05, 0);
  return toStandard(base);
})();

export const stonecutterFloorGeo = (() => {
  const floor = new THREE.BoxGeometry(4.76, 0.04, 2.76); floor.translate(0, 0.11, 0);
  return toStandard(floor);
})();

export const stonecutterStoneDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const wBase = new THREE.BoxGeometry(1.55, 0.52, 0.85); wBase.translate(-1.35, 0.11 + 0.28, -0.15); geos.push(toStandard(wBase));
  const cone = new THREE.ConeGeometry(0.12, 0.20, 5); cone.translate(0, 0.11 + 0.72, 0.35); geos.push(toStandard(cone));
  return mergeGeometries(geos) || geos[0];
})();

export const stonecutterStoneLightGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const drum = new THREE.CylinderGeometry(0.20, 0.22, 0.32, 12); drum.translate(-1.35 - 0.35, 0.11 + 0.74, -0.15); geos.push(toStandard(drum));
  const cap = new THREE.BoxGeometry(0.44, 0.05, 0.44); cap.translate(-1.35 - 0.35, 0.11 + 0.92, -0.15); geos.push(toStandard(cap));

  const sStone = new THREE.DodecahedronGeometry(0.22, 0); sStone.translate(0, 0.11 + 0.55, 0.35); geos.push(toStandard(sStone));

  const b1 = new THREE.BoxGeometry(0.60, 0.34, 0.55); b1.translate(1.45 - 0.38, 0.11 + 0.18, -0.25); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(0.60, 0.34, 0.55); b2.translate(1.45 + 0.38, 0.11 + 0.18, -0.25); geos.push(toStandard(b2));
  const b3 = new THREE.BoxGeometry(0.60, 0.28, 0.55); b3.translate(1.45, 0.11 + 0.48, -0.25); geos.push(toStandard(b3));
  const b4 = new THREE.BoxGeometry(0.72, 0.16, 0.55); b4.translate(1.45 - 0.15, 0.11 + 0.10, 0.55); geos.push(toStandard(b4));
  const b5 = new THREE.BoxGeometry(0.65, 0.06, 0.48); b5.translate(1.45 - 0.15, 0.11 + 0.21, 0.55); geos.push(toStandard(b5));
  const dust = new THREE.ConeGeometry(0.28, 0.10, 8); dust.translate(1.45 + 0.55, 0.11 + 0.05, 0.55); geos.push(toStandard(dust));

  return mergeGeometries(geos) || geos[0];
})();

export const stonecutterTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const malHead = new THREE.BoxGeometry(0.08, 0.08, 0.20);
  malHead.applyMatrix4(new THREE.Matrix4().makeRotationY(0.35).setPosition(-1.35 + 0.38, 0.11 + 0.62, -0.15 + 0.15));
  geos.push(toStandard(malHead));

  const malHandle = new THREE.CylinderGeometry(0.016, 0.016, 0.20, 5);
  malHandle.applyMatrix4(new THREE.Matrix4().makeRotationY(0.35).setPosition(-1.35 + 0.38, 0.11 + 0.62, -0.15 + 0.27));
  geos.push(toStandard(malHandle));

  const chisel = new THREE.BoxGeometry(0.04, 0.03, 0.24);
  chisel.applyMatrix4(new THREE.Matrix4().makeRotationY(-0.25).setPosition(-1.35 + 0.35, 0.11 + 0.60, -0.15 - 0.18));
  geos.push(toStandard(chisel));

  const stump = new THREE.CylinderGeometry(0.35, 0.40, 0.44, 8);
  stump.translate(0, 0.11 + 0.22, 0.35);
  geos.push(toStandard(stump));

  const posts: [number, number][] = [
    [-2.25, -1.30], [0, -1.30], [2.25, -1.30],
    [-2.25, 1.30], [0, 1.30], [2.25, 1.30]
  ];
  for (const [px, pz] of posts) {
    const p = new THREE.BoxGeometry(0.14, 1.70, 0.14);
    p.translate(px, 0.95, pz);
    geos.push(toStandard(p));
  }

  const b1 = new THREE.BoxGeometry(4.70, 0.12, 0.14); b1.translate(0, 1.80, -1.30); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(4.70, 0.12, 0.14); b2.translate(0, 1.80, 1.30); geos.push(toStandard(b2));
  const b3 = new THREE.BoxGeometry(0.14, 0.12, 2.70); b3.translate(-2.25, 1.80, 0); geos.push(toStandard(b3));
  const b4 = new THREE.BoxGeometry(0.14, 0.12, 2.70); b4.translate(2.25, 1.80, 0); geos.push(toStandard(b4));
  const ridge = new THREE.BoxGeometry(5.02, 0.12, 0.16); ridge.translate(0, 2.76, 0); geos.push(toStandard(ridge));

  geos.push(toStandard(b1), toStandard(b2), toStandard(b3), toStandard(b4), toStandard(ridge));
  geos.push(_scGableL.frame, _scGableR.frame);

  return mergeGeometries(geos) || geos[0];
})();

export const stonecutterPlanksGeo = (() => {
  const top = toStandard(new THREE.BoxGeometry(1.62, 0.04, 0.92).translate(-1.35, 0.11 + 0.56, -0.15));
  return mergeGeometries([top, _scGableL.wall, _scGableR.wall]) || top;
})();

export const stonecutterRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(4.96, 0.09, 1.75);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.65).setPosition(0, 2.26, -0.72));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(4.96, 0.09, 1.75);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.65).setPosition(0, 2.26, 0.72));
  geos.push(toStandard(s2));

  return mergeGeometries([toStandard(s1), toStandard(s2)]) || toStandard(s1);
})();

export function StonecutterModel({
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
      <mesh geometry={stonecutterBaseGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={stonecutterFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={stonecutterStoneDarkGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={stonecutterStoneLightGeo} material={mats.stoneLight} receiveShadow />
      <mesh geometry={stonecutterTimberDarkGeo} material={mats.timberDark} castShadow receiveShadow />
      <mesh geometry={stonecutterPlanksGeo} material={mats.timberPlanks} receiveShadow />

      <group ref={roofRef}>
        <mesh geometry={stonecutterRoofGeo} material={mats.shingleRoof} castShadow receiveShadow />
      </group>
    </group>
  );
}
