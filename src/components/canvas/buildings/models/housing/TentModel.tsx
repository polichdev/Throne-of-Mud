import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { TimberBarrel, TriangularGable } from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const tentGroundGeo = (() => {
  const g = new THREE.BoxGeometry(2.92, 0.04, 1.92); g.translate(0, 0.02, 0);
  return toStandard(g);
})();

export const tentStrawFloorGeo = (() => {
  const g = new THREE.BoxGeometry(2.7, 0.04, 1.7); g.translate(0, 0.04, 0);
  return toStandard(g);
})();

export const tentSillsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(0.08, 0.08, 1.8); s1.translate(-1.35, 0.08, 0); geos.push(toStandard(s1));
  const s2 = new THREE.BoxGeometry(0.08, 0.08, 1.8); s2.translate(1.35, 0.08, 0); geos.push(toStandard(s2));

  const bFrame = new THREE.BoxGeometry(0.70, 0.05, 1.22); bFrame.translate(0.55, 0.085, 0); geos.push(toStandard(bFrame));
  return mergeGeometries(geos) || geos[0];
})();

export const tentPolesAndPegsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const ridge = new THREE.BoxGeometry(0.1, 0.1, 2.05); ridge.translate(0, 1.45, 0); geos.push(toStandard(ridge));

  for (const pz of [-0.9, 0.9]) {
    const p1 = new THREE.CylinderGeometry(0.04, 0.05, 2.0, 5);
    p1.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.78).setPosition(-0.72, 0.72, pz));
    geos.push(toStandard(p1));

    const p2 = new THREE.CylinderGeometry(0.04, 0.05, 2.0, 5);
    p2.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.78).setPosition(0.72, 0.72, pz));
    geos.push(toStandard(p2));
  }

  const pegs: [number, number][] = [
    [-1.4, -0.95], [1.4, -0.95], [-1.4, 0.95], [1.4, 0.95]
  ];
  for (const [px, pz] of pegs) {
    const peg = new THREE.CylinderGeometry(0.02, 0.01, 0.2, 4);
    peg.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.2, 0, px > 0 ? -0.3 : 0.3)).setPosition(px, 0.04, pz));
    geos.push(toStandard(peg));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const tentFabricRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(0.04, 2.05, 1.95);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.78).setPosition(-0.78, 0.74, 0));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(0.04, 2.05, 1.95);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.78).setPosition(0.78, 0.74, 0));
  geos.push(toStandard(s2));

  const roll = new THREE.CylinderGeometry(0.08, 0.08, 0.85, 6);
  roll.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, 1.32, 0.92));
  geos.push(toStandard(roll));

  return mergeGeometries(geos) || geos[0];
})();

export function TentModel({
  isLightOn = false,
  roofRef,
}: {
  isLightOn?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <mesh geometry={tentGroundGeo} material={mats.richSoil} receiveShadow />
      <mesh geometry={tentStrawFloorGeo} material={mats.goldWheat} receiveShadow />
      <mesh geometry={tentSillsGeo} material={mats.timberDark} />

      <mesh material={mats.bedStraw} position={[0.55, 0.14, 0]} receiveShadow>
        <boxGeometry args={[0.64, 0.07, 1.16]} />
      </mesh>
      <mesh material={mats.pillowWhite} position={[0.55, 0.19, -0.42]}>
        <boxGeometry args={[0.48, 0.06, 0.24]} />
      </mesh>
      <mesh material={mats.bedLinenGreen} position={[0.55, 0.19, 0.14]}>
        <boxGeometry args={[0.65, 0.05, 0.82]} />
      </mesh>

      <group position={[-0.75, 0, -0.25]}>
        <mesh material={mats.timberMed} position={[0, 0.15, 0]} receiveShadow>
          <boxGeometry args={[0.48, 0.24, 0.52]} />
        </mesh>
        <mesh material={mats.goldTrim} position={[0, 0.18, 0.27]}>
          <boxGeometry args={[0.1, 0.06, 0.02]} />
        </mesh>
        <mesh material={mats.timberDark} position={[0, 0.28, 0]}>
          <boxGeometry args={[0.52, 0.04, 0.56]} />
        </mesh>
      </group>

      <TimberBarrel position={[-0.75, 0, -0.6]} scale={0.75} />

      <mesh material={mats.timberDark} position={[-0.75, 0.14, 0.4]}>
        <cylinderGeometry args={[0.12, 0.14, 0.26, 6]} />
      </mesh>
      <mesh material={isLightOn ? mats.candleGlow : mats.candleUnlit} position={[-0.75, 0.32, 0.4]}>
        <cylinderGeometry args={[0.018, 0.022, 0.09, 5]} />
      </mesh>

      <group ref={roofRef}>
        <mesh geometry={tentPolesAndPegsGeo} material={mats.timberDark} />
        <mesh geometry={tentFabricRoofGeo} material={mats.tentFabric} castShadow receiveShadow />
        <mesh material={mats.thatchRidge} position={[0, 1.48, 0]}>
          <boxGeometry args={[0.16, 0.12, 2.1]} />
        </mesh>
        <TriangularGable
          baseWidth={2.4}
          height={1.38}
          thickness={0.06}
          position={[0, 0.06, -0.94]}
          material={mats.tentFabric}
        />
      </group>
    </group>
  );
}
