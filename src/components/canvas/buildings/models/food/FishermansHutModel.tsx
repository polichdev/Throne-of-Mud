import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import {
  MedievalDoor,
  MedievalWindow,
  TriangularGable,
  RusticCabinBed,
  RusticCabinTable,
  RusticWallShelf,
  RusticChest,
} from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const fishStiltsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const px of [-1.65, -0.55, 0.55, 1.65]) {
    for (const pz of [-1.15, 0, 1.15]) {
      const s = new THREE.CylinderGeometry(0.07, 0.08, 0.22, 6);
      s.translate(px, 0.08, pz);
      geos.push(toStandard(s));
    }
  }
  return mergeGeometries(geos) || geos[0];
})();

export const fishFloorGeo = (() => {
  const f = new THREE.BoxGeometry(3.92, 0.06, 2.92); f.translate(0, 0.16, 0);
  return toStandard(f);
})();

export const fishWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const back = new THREE.BoxGeometry(2.86, 1.05, 0.14); back.translate(-0.45, 0.72, -1.31); geos.push(toStandard(back));
  const left = new THREE.BoxGeometry(0.14, 1.05, 2.76); left.translate(-1.81, 0.72, 0); geos.push(toStandard(left));
  const fLeft = new THREE.BoxGeometry(0.82, 1.05, 0.14); fLeft.translate(-1.40, 0.72, 1.31); geos.push(toStandard(fLeft));
  const fLint = new THREE.BoxGeometry(0.72, 0.22, 0.14); fLint.translate(-0.80, 1.14, 1.31); geos.push(toStandard(fLint));
  const fRight = new THREE.BoxGeometry(1.56, 1.05, 0.14); fRight.translate(0.20, 0.72, 1.31); geos.push(toStandard(fRight));
  return mergeGeometries(geos) || geos[0];
})();

export const fishTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const px of [-1.81, -0.45, 0.98, 1.81]) {
    for (const pz of [-1.31, 1.31]) {
      const p = new THREE.BoxGeometry(0.14, 1.12, 0.14);
      p.translate(px, 0.72, pz);
      geos.push(toStandard(p));
    }
  }
  const b1 = new THREE.BoxGeometry(3.76, 0.08, 0.14); b1.translate(0, 1.25, 1.31); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(3.76, 0.08, 0.14); b2.translate(0, 1.25, -1.31); geos.push(toStandard(b2));

  for (const pz of [1.15, -1.15]) {
    const c = new THREE.CylinderGeometry(0.06, 0.07, 0.36, 6);
    c.translate(1.40 + 0.42, 0.19 + 0.18, pz);
    geos.push(toStandard(c));
  }

  const r1 = new THREE.BoxGeometry(0.04, 0.80, 0.04); r1.translate(1.40 - 0.05 - 0.25, 0.19 + 0.40, -0.45); geos.push(toStandard(r1));
  const r2 = new THREE.BoxGeometry(0.04, 0.80, 0.04); r2.translate(1.40 - 0.05 + 0.25, 0.19 + 0.40, -0.45); geos.push(toStandard(r2));
  const r3 = new THREE.BoxGeometry(0.54, 0.03, 0.03); r3.translate(1.40 - 0.05, 0.19 + 0.72, -0.45); geos.push(toStandard(r3));

  return mergeGeometries(geos) || geos[0];
})();

export const fishPropsGeo = (() => {
  const barrel = new THREE.CylinderGeometry(0.16, 0.13, 0.32, 8);
  barrel.translate(1.40 - 0.05 + 0.15, 0.19 + 0.16, 0.55);
  return toStandard(barrel);
})();

export const fishSilverGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const fx = [-0.18, -0.06, 0.06, 0.18][i];
    const f = new THREE.ConeGeometry(0.04, 0.22, 5);
    f.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.1).setPosition(1.40 - 0.05 + fx, 0.19 + 0.55, -0.45));
    geos.push(toStandard(f));
  }
  const bFish = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 8);
  bFish.translate(1.40 - 0.05 + 0.15, 0.19 + 0.31, 0.55);
  geos.push(toStandard(bFish));

  return mergeGeometries(geos) || geos[0];
})();

export const fishRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.72).setPosition(0, 1.78, -0.80));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.72).setPosition(0, 1.78, 0.80));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export function FishermansHutModel({
  isLightOn = false,
  roofRef,
  interiorRef,
}: {
  isLightOn?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
  interiorRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <mesh geometry={fishStiltsGeo} material={mats.timberDark} />
      <mesh geometry={fishFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={fishWallsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={fishTimberDarkGeo} material={mats.timberDark} />
      <mesh geometry={fishPropsGeo} material={mats.barrelWood} />
      <mesh geometry={fishSilverGeo} material={mats.fishSilver} />

      <mesh material={mats.clothWhite} position={[1.15, 0.27, 0.55]} rotation={[0, 0.4, 0]}>
        <torusGeometry args={[0.12, 0.04, 6, 12]} />
      </mesh>
      <mesh material={mats.timberLight} position={[1.68, 0.74, 0.30]} rotation={[-0.35, 0, 0.15]}>
        <cylinderGeometry args={[0.010, 0.016, 1.35, 5]} />
      </mesh>

      <MedievalDoor position={[-0.80, 0.19, 1.31]} width={0.66} height={0.96} />
      <MedievalWindow position={[0.25, 0.72, 1.33]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[-0.45, 0.72, -1.33]} rotation={[0, Math.PI, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />

      <group ref={interiorRef} visible={false}>
        <RusticCabinBed
          position={[-1.25, 0.19, -0.40]}
          rotation={[0, 0, 0]}
          blanketMaterial={mats.bedLinenBlue}
        />
        <RusticChest position={[-1.25, 0.19, 0.70]} rotation={[0, 0, 0]} />
        <RusticCabinTable position={[-0.10, 0.19, 0.30]} hasBenches={true} hasFood={true} />
        <RusticWallShelf position={[-1.25, 1.0, -1.22]} width={0.75} />
      </group>

      <group ref={roofRef}>
        <TriangularGable
          baseWidth={2.76}
          height={1.05}
          thickness={0.14}
          position={[-1.81, 1.25, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={mats.timberLogs}
        />
        <TriangularGable
          baseWidth={2.76}
          height={1.05}
          thickness={0.14}
          position={[1.81, 1.25, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          material={mats.timberPlanks}
        />
        <mesh geometry={fishRoofGeo} material={mats.thatchRoof} castShadow receiveShadow />
        <mesh material={mats.thatchRidge} position={[0, 2.36, 0]}>
          <boxGeometry args={[4.02, 0.12, 0.20]} />
        </mesh>
      </group>
    </group>
  );
}
