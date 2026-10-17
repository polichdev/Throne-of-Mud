import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { FirewoodStack, TimberBarrel, TriangularGable } from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const stockpileBaseGeo = (() => {
  const base = new THREE.BoxGeometry(3.96, 0.12, 1.96); base.translate(0, 0.06, 0);
  return toStandard(base);
})();

export const stockpileFloorGeo = (() => {
  const floor = new THREE.BoxGeometry(3.84, 0.04, 1.84); floor.translate(0, 0.14, 0);
  return toStandard(floor);
})();

export const stockpileTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(3.92, 0.06, 0.08); s1.translate(0, 0.15, 0.92); geos.push(toStandard(s1));
  const s2 = new THREE.BoxGeometry(3.92, 0.06, 0.08); s2.translate(0, 0.15, -0.92); geos.push(toStandard(s2));
  const s3 = new THREE.BoxGeometry(0.08, 0.06, 1.92); s3.translate(-1.92, 0.15, 0); geos.push(toStandard(s3));
  const s4 = new THREE.BoxGeometry(0.08, 0.06, 1.92); s4.translate(1.92, 0.15, 0); geos.push(toStandard(s4));

  for (const bx of [-1.85, -0.65, 0.65, 1.85]) {
    for (const bz of [-0.88, 0.88]) {
      const p = new THREE.BoxGeometry(0.14, 1.28, 0.14);
      p.translate(bx, 0.72, bz);
      geos.push(toStandard(p));
    }
  }

  const h1 = new THREE.BoxGeometry(3.92, 0.1, 0.12); h1.translate(0, 1.32, 0.88); geos.push(toStandard(h1));
  const h2 = new THREE.BoxGeometry(3.92, 0.1, 0.12); h2.translate(0, 1.32, -0.88); geos.push(toStandard(h2));

  return mergeGeometries(geos) || geos[0];
})();

export const stockpileLogWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const back = new THREE.BoxGeometry(3.82, 1.22, 0.08); back.translate(0, 0.14 + 1.22 / 2, -0.88); geos.push(toStandard(back));
  const left = new THREE.BoxGeometry(0.08, 1.22, 1.82); left.translate(-1.88, 0.14 + 1.22 / 2, 0); geos.push(toStandard(left));
  const right = new THREE.BoxGeometry(0.08, 1.22, 1.82); right.translate(1.88, 0.14 + 1.22 / 2, 0); geos.push(toStandard(right));
  return mergeGeometries(geos) || geos[0];
})();

export const stockpileGoodsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const st1 = new THREE.BoxGeometry(0.55, 0.24, 0.45); st1.translate(1.15, 0.16 + 0.12, -0.35); geos.push(toStandard(st1));
  return toStandard(st1);
})();

export const stockpileIronHardwareGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const w = new THREE.BoxGeometry(0.04, 0.025, 0.16);
  w.applyMatrix4(new THREE.Matrix4().makeRotationY(0.3).setPosition(1.15 + 0.14, 0.16 + 0.25, -0.35 + 0.12));
  geos.push(toStandard(w));

  const cBand = new THREE.BoxGeometry(0.57, 0.04, 0.02); cBand.translate(-1.15, 0.16 + 0.18, 0.4 + 0.23); geos.push(toStandard(cBand));
  const cLock = new THREE.BoxGeometry(0.06, 0.08, 0.02); cLock.translate(-1.15, 0.16 + 0.28, 0.4 + 0.23); geos.push(toStandard(cLock));

  const i1 = new THREE.BoxGeometry(0.2, 0.06, 0.12); i1.translate(-0.1, 0.16 + 0.03, -0.4); geos.push(toStandard(i1));
  const i2 = new THREE.BoxGeometry(0.2, 0.06, 0.12); i2.translate(0.1, 0.16 + 0.03, -0.4); geos.push(toStandard(i2));
  const i3 = new THREE.BoxGeometry(0.18, 0.05, 0.1); i3.translate(0, 0.16 + 0.08, -0.4); geos.push(toStandard(i3));

  return mergeGeometries(geos) || geos[0];
})();

export const stockpileFlourSacksGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const sM = new THREE.Matrix4().setPosition(0, 0.16, 0.35);

  const s1 = new THREE.CylinderGeometry(0.13, 0.16, 0.24, 7);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationY(0.2).setPosition(-0.2, 0.12, 0).premultiply(sM));
  geos.push(toStandard(s1));

  const s2 = new THREE.CylinderGeometry(0.14, 0.16, 0.24, 7);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationY(-0.3).setPosition(0.2, 0.12, 0.02).premultiply(sM));
  geos.push(toStandard(s2));

  const s3 = new THREE.CylinderGeometry(0.1, 0.11, 0.32, 6);
  s3.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, 0.26, -0.05).premultiply(sM));
  geos.push(toStandard(s3));

  return mergeGeometries(geos) || geos[0];
})();

export const stockpileRoofThatchGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(4.12, 1.34, 0.14);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.75).setPosition(0, 1.74, 0.45));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(4.12, 1.34, 0.14);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.75).setPosition(0, 1.74, -0.45));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export const stockpileRoofFasciaGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const f1 = new THREE.BoxGeometry(4.12, 0.12, 0.16);
  f1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.75).setPosition(0, 1.32, 0.91));
  geos.push(toStandard(f1));

  const f2 = new THREE.BoxGeometry(4.12, 0.12, 0.16);
  f2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.75).setPosition(0, 1.32, -0.91));
  geos.push(toStandard(f2));

  return mergeGeometries(geos) || geos[0];
})();

export function StockpileModel({
  isLightOn = false,
  roofRef,
}: {
  isLightOn?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <mesh geometry={stockpileBaseGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={stockpileFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={stockpileTimberDarkGeo} material={mats.timberDark} />
      <mesh geometry={stockpileLogWallsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={stockpileGoodsGeo} material={mats.stoneLight} receiveShadow />
      <mesh geometry={stockpileIronHardwareGeo} material={mats.ironHardware} />
      <mesh geometry={stockpileFlourSacksGeo} material={mats.flourSack} />

      <mesh material={mats.timberPlanks} position={[-1.15, 0.34, 0.4]}>
        <boxGeometry args={[0.55, 0.36, 0.45]} />
      </mesh>

      <mesh material={mats.stoneMed} position={[1.10, 0.47, -0.30]} receiveShadow>
        <boxGeometry args={[0.42, 0.16, 0.35]} />
      </mesh>

      <FirewoodStack position={[-1.15, 0.16, -0.35]} />
      <TimberBarrel position={[1.15, 0.16, 0.38]} scale={0.9} />

      <mesh material={isLightOn ? mats.candleGlow : mats.candleUnlit} position={[0, 1.15, 0.92]}>
        <cylinderGeometry args={[0.03, 0.04, 0.1, 5]} />
      </mesh>

      <group ref={roofRef}>
        <TriangularGable
          baseWidth={1.82}
          height={0.85}
          thickness={0.12}
          position={[-1.88, 1.32, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          material={mats.timberPlanks}
        />
        <TriangularGable
          baseWidth={1.82}
          height={0.85}
          thickness={0.12}
          position={[1.88, 1.32, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={mats.timberPlanks}
        />
        <mesh geometry={stockpileRoofThatchGeo} material={mats.thatchRoof} castShadow receiveShadow />
        <mesh geometry={stockpileRoofFasciaGeo} material={mats.thatchDark} />
        <mesh material={mats.thatchRidge} position={[0, 2.17, 0]}>
          <boxGeometry args={[4.16, 0.14, 0.14]} />
        </mesh>
      </group>
    </group>
  );
}
