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
  FirewoodStack,
} from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const forestersBaseGeo = (() => {
  const g = new THREE.BoxGeometry(3.92, 0.10, 2.92); g.translate(0, 0.05, 0);
  return toStandard(g);
})();

export const forestersFloorGeo = (() => {
  const g = new THREE.BoxGeometry(3.76, 0.04, 2.76); g.translate(0, 0.11, 0);
  return toStandard(g);
})();

export const forestersWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const back = new THREE.BoxGeometry(3.76, 1.10, 0.14); back.translate(0, 0.68, -1.31); geos.push(toStandard(back));
  const left = new THREE.BoxGeometry(0.14, 1.10, 2.76); left.translate(-1.81, 0.68, 0); geos.push(toStandard(left));
  const right = new THREE.BoxGeometry(0.14, 1.10, 2.76); right.translate(1.81, 0.68, 0); geos.push(toStandard(right));
  const fLeft = new THREE.BoxGeometry(0.82, 1.10, 0.14); fLeft.translate(-1.40, 0.68, 1.31); geos.push(toStandard(fLeft));
  const fLint = new THREE.BoxGeometry(0.72, 0.22, 0.14); fLint.translate(-0.80, 1.12, 1.31); geos.push(toStandard(fLint));
  const fRight = new THREE.BoxGeometry(2.28, 1.10, 0.14); fRight.translate(0.60, 0.68, 1.31); geos.push(toStandard(fRight));
  return mergeGeometries(geos) || geos[0];
})();

export const forestersTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const px of [-1.84, 1.84]) {
    for (const pz of [-1.34, 1.34]) {
      const g = new THREE.BoxGeometry(0.18, 1.16, 0.18);
      g.translate(px, 0.68, pz);
      geos.push(toStandard(g));
    }
  }

  const sawM = new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-1.89, 0.85, 0.4);
  for (const hx of [-0.52, 0.52]) {
    const h = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 5);
    h.applyMatrix4(new THREE.Matrix4().setPosition(hx, 0.04, 0).premultiply(sawM));
    geos.push(toStandard(h));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const forestersPropsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const bed = new THREE.BoxGeometry(0.85, 0.40, 0.65); bed.translate(1.25, 0.32, 0.75); geos.push(toStandard(bed));
  return mergeGeometries(geos) || geos[0];
})();

export const forestersSoilGeo = (() => {
  const soil = new THREE.BoxGeometry(0.78, 0.04, 0.58); soil.translate(1.25, 0.53, 0.75);
  return toStandard(soil);
})();

export const forestersChoppingStumpGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const stump = new THREE.CylinderGeometry(0.22, 0.26, 0.36, 8); stump.translate(-1.25, 0.30, 1.85); geos.push(toStandard(stump));
  return mergeGeometries(geos) || geos[0];
})();

export const forestersRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.72).setPosition(0, 1.76, -0.80));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.72).setPosition(0, 1.76, 0.80));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export function ForestersHutModel({
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
      <mesh geometry={forestersBaseGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={forestersFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={forestersWallsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={forestersTimberDarkGeo} material={mats.timberDark} />
      <mesh geometry={forestersPropsGeo} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={forestersSoilGeo} material={mats.richSoil} />
      <mesh geometry={forestersChoppingStumpGeo} material={mats.timberLogs} receiveShadow />

      <mesh material={mats.timberLight} position={[-1.21, 0.57, 1.85]} rotation={[0.2, 0, -0.4]}>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 5]} />
      </mesh>
      <mesh material={mats.ironSteel} position={[-1.07, 0.48, 1.85]} rotation={[0.2, 0, -0.4]}>
        <boxGeometry args={[0.08, 0.14, 0.03]} />
      </mesh>

      <mesh material={mats.sawBlade} position={[-1.89, 0.85, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[1.10, 0.08, 0.015]} />
      </mesh>

      {[-0.24, 0, 0.24].map((x, idx) => (
        <group key={`sapling-${idx}`} position={[1.25 + x, 0.57, 0.75 + (idx % 2 === 0 ? 0.12 : -0.12)]}>
          <mesh material={mats.timberDark} position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.012, 0.015, 0.10, 5]} />
          </mesh>
          <mesh material={mats.leafGreen} position={[0, 0.14, 0]}>
            <coneGeometry args={[0.08, 0.18, 6]} />
          </mesh>
        </group>
      ))}

      <MedievalDoor position={[-0.80, 0.12, 1.31]} width={0.66} height={1.0} />
      <MedievalWindow position={[0.85, 0.68, 1.33]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={true} />
      <MedievalWindow position={[0, 0.68, -1.33]} rotation={[0, Math.PI, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <FirewoodStack position={[-1.92, 0.12, 0]} rotation={[0, Math.PI / 2, 0]} />

      <group ref={interiorRef} visible={false}>
        <MedievalStoneHearth
          position={[0, 0.12, -1.18]}
          isLightOn={isLightOn}
          hasSmoke={false}
          chimneyHeight={2.35}
        />
        <RusticCabinBed
          position={[-1.25, 0.12, -0.40]}
          rotation={[0, 0, 0]}
          blanketMaterial={mats.bedLinenGreen}
        />
        <RusticChest position={[-1.25, 0.12, 0.70]} rotation={[0, 0, 0]} />
        <RusticCabinTable position={[0.85, 0.12, -0.30]} hasBenches={true} hasFood={true} />
        <RusticWallShelf position={[0.85, 0.95, -1.22]} width={0.80} />
      </group>

      <group ref={roofRef}>
        <TriangularGable
          baseWidth={2.76}
          height={1.05}
          thickness={0.14}
          position={[-1.81, 1.23, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={mats.timberLogs}
        />
        <TriangularGable
          baseWidth={2.76}
          height={1.05}
          thickness={0.14}
          position={[1.81, 1.23, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          material={mats.timberLogs}
        />
        <mesh geometry={forestersRoofGeo} material={mats.thatchDark} receiveShadow />
        <mesh material={mats.thatchRidge} position={[0, 2.34, 0]}>
          <boxGeometry args={[4.02, 0.12, 0.20]} />
        </mesh>
      </group>
    </group>
  );
}
