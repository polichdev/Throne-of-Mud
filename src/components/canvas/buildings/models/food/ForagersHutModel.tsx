import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import {
  MedievalDoor,
  MedievalWindow,
  TriangularGable,
  MedievalStoneHearth,
  RusticCabinBed,
  RusticCabinTable,
  RusticWallShelf,
  RusticChest,
} from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const foragersBaseGeo = (() => {
  const g = new THREE.BoxGeometry(3.92, 0.10, 2.92); g.translate(0, 0.05, 0);
  return toStandard(g);
})();

export const foragersFloorGeo = (() => {
  const g = new THREE.BoxGeometry(3.76, 0.04, 2.76); g.translate(0, 0.11, 0);
  return toStandard(g);
})();

export const foragersWattleWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const back = new THREE.BoxGeometry(2.86, 1.10, 0.12); back.translate(-0.45, 0.68, -1.31); geos.push(toStandard(back));
  const left = new THREE.BoxGeometry(0.12, 1.10, 2.76); left.translate(-1.81, 0.68, 0); geos.push(toStandard(left));
  const fLeft = new THREE.BoxGeometry(0.82, 1.10, 0.12); fLeft.translate(-1.40, 0.68, 1.31); geos.push(toStandard(fLeft));
  const fLint = new THREE.BoxGeometry(0.72, 0.22, 0.12); fLint.translate(-0.80, 1.12, 1.31); geos.push(toStandard(fLint));
  const fRight = new THREE.BoxGeometry(1.56, 1.10, 0.12); fRight.translate(0.20, 0.68, 1.31); geos.push(toStandard(fRight));
  return mergeGeometries(geos) || geos[0];
})();

export const foragersTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const px of [-1.81, -0.45, 0.98, 1.81]) {
    for (const pz of [-1.31, 1.31]) {
      const p = new THREE.BoxGeometry(0.14, 1.14, 0.14);
      p.translate(px, 0.68, pz);
      geos.push(toStandard(p));
    }
  }
  const b1 = new THREE.BoxGeometry(3.76, 0.08, 0.14); b1.translate(0, 1.22, 1.31); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(3.76, 0.08, 0.14); b2.translate(0, 1.22, -1.31); geos.push(toStandard(b2));

  for (const lx of [-0.28, 0.28]) {
    for (const lz of [-0.45, 0.45]) {
      const leg = new THREE.BoxGeometry(0.05, 0.26, 0.05);
      leg.translate(1.35 + lx, 0.28, -0.45 + lz);
      geos.push(toStandard(leg));
    }
  }

  for (const z of [-0.85, -0.40, 0.05, 0.50, 0.95]) {
    const str = new THREE.CylinderGeometry(0.005, 0.005, 0.14, 4);
    str.translate(1.40 + 0.25, 0.11 + 1.05 + 0.08, z);
    geos.push(toStandard(str));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const foragersTimberPlanksGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const tableTop = new THREE.BoxGeometry(0.68, 0.04, 1.10); tableTop.translate(1.35, 0.43, -0.45); geos.push(toStandard(tableTop));
  const crate = new THREE.BoxGeometry(0.28, 0.14, 0.30); crate.translate(1.35 + 0.12, 0.23, 0.65 - 0.32); geos.push(toStandard(crate));
  return mergeGeometries(geos) || geos[0];
})();

export const foragersPropsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const b1 = new THREE.CylinderGeometry(0.14, 0.11, 0.22, 8); b1.translate(1.35 - 0.16, 0.27, 0.65); geos.push(toStandard(b1));
  const b2 = new THREE.CylinderGeometry(0.13, 0.10, 0.20, 8); b2.translate(1.35 + 0.16, 0.25, 0.65 + 0.12); geos.push(toStandard(b2));
  return mergeGeometries(geos) || geos[0];
})();

export const foragersRoofThatchGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.72).setPosition(0, 1.76, -0.80));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.72).setPosition(0, 1.76, 0.80));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export const foragersRoofMossGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const m1 = new THREE.BoxGeometry(0.85, 0.02, 0.85);
  m1.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.72, 0, 0.1)).setPosition(-0.85, 1.81, 0.72));
  geos.push(toStandard(m1));

  const m2 = new THREE.BoxGeometry(0.75, 0.02, 0.75);
  m2.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.72, 0, -0.1)).setPosition(0.65, 1.81, -0.72));
  geos.push(toStandard(m2));

  return mergeGeometries(geos) || geos[0];
})();

export function ForagersHutModel({
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
      <mesh geometry={foragersBaseGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={foragersFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={foragersWattleWallsGeo} material={mats.wattleDaub} castShadow receiveShadow />
      <mesh geometry={foragersTimberDarkGeo} material={mats.timberDark} />
      <mesh geometry={foragersTimberPlanksGeo} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={foragersPropsGeo} material={mats.barrelWood} />

      <mesh material={mats.berriesBlue} position={[1.19, 0.38, 0.65]}>
        <sphereGeometry args={[0.11, 7, 7]} />
      </mesh>
      <mesh material={mats.berriesPurple} position={[1.51, 0.35, 0.77]}>
        <sphereGeometry args={[0.10, 7, 7]} />
      </mesh>

      {[-0.85, -0.40, 0.05, 0.50, 0.95].map((z, idx) => (
        <mesh
          key={`herbs-${idx}`}
          material={idx % 2 === 0 ? mats.driedHerbs : mats.flowerRed}
          position={[1.65, 1.10, z]}
        >
          <coneGeometry args={[0.055, 0.18, 5]} />
        </mesh>
      ))}

      <MedievalDoor position={[-0.80, 0.12, 1.31]} width={0.66} height={1.0} />
      <MedievalWindow position={[0.25, 0.68, 1.33]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={true} />
      <MedievalWindow position={[-0.45, 0.68, -1.33]} rotation={[0, Math.PI, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />

      <group ref={interiorRef} visible={false}>
        <MedievalStoneHearth
          position={[-0.45, 0.12, -1.18]}
          isLightOn={isLightOn}
          hasSmoke={false}
          chimneyHeight={2.35}
        />
        <RusticCabinBed
          position={[-1.25, 0.12, -0.40]}
          rotation={[0, 0, 0]}
          blanketMaterial={mats.bedLinenBlue}
        />
        <RusticChest position={[-1.25, 0.12, 0.70]} rotation={[0, 0, 0]} />
        <RusticCabinTable position={[-0.10, 0.12, 0.30]} hasBenches={true} hasFood={true} />
        <RusticWallShelf position={[-1.25, 0.95, -1.22]} width={0.75} />
      </group>

      <group ref={roofRef}>
        <TriangularGable
          baseWidth={2.76}
          height={1.05}
          thickness={0.14}
          position={[-1.81, 1.23, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={mats.wattleDaub}
        />
        <TriangularGable
          baseWidth={2.76}
          height={1.05}
          thickness={0.14}
          position={[1.81, 1.23, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          material={mats.timberPlanks}
        />
        <mesh geometry={foragersRoofThatchGeo} material={mats.thatchRoof} castShadow receiveShadow />
        <mesh geometry={foragersRoofMossGeo} material={mats.mossGreen} />
        <mesh material={mats.thatchRidge} position={[0, 2.34, 0]}>
          <boxGeometry args={[4.02, 0.12, 0.20]} />
        </mesh>
      </group>
    </group>
  );
}
