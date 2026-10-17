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

export const huntersBaseGeo = (() => {
  const g = new THREE.BoxGeometry(3.92, 0.10, 2.92); g.translate(0, 0.05, 0);
  return toStandard(g);
})();

export const huntersFloorGeo = (() => {
  const g = new THREE.BoxGeometry(3.76, 0.04, 2.76); g.translate(0, 0.11, 0);
  return toStandard(g);
})();

export const huntersWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const back = new THREE.BoxGeometry(3.76, 1.10, 0.14); back.translate(0, 0.68, -1.31); geos.push(toStandard(back));
  const left = new THREE.BoxGeometry(0.14, 1.10, 2.76); left.translate(-1.81, 0.68, 0); geos.push(toStandard(left));
  const right = new THREE.BoxGeometry(0.14, 1.10, 2.76); right.translate(1.81, 0.68, 0); geos.push(toStandard(right));
  const fLeft = new THREE.BoxGeometry(0.82, 1.10, 0.14); fLeft.translate(-1.40, 0.68, 1.31); geos.push(toStandard(fLeft));
  const fLint = new THREE.BoxGeometry(0.72, 0.22, 0.14); fLint.translate(-0.80, 1.12, 1.31); geos.push(toStandard(fLint));
  const fRight = new THREE.BoxGeometry(2.28, 1.10, 0.14); fRight.translate(0.60, 0.68, 1.31); geos.push(toStandard(fRight));
  return mergeGeometries(geos) || geos[0];
})();

export const huntersTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const px of [-1.84, 1.84]) {
    for (const pz of [-1.34, 1.34]) {
      const g = new THREE.BoxGeometry(0.18, 1.16, 0.18);
      g.translate(px, 0.68, pz);
      geos.push(toStandard(g));
    }
  }

  const hRackM = new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-1.94, 0.12, 0);
  for (const rx of [-0.45, 0.45]) {
    const post = new THREE.BoxGeometry(0.05, 1.10, 0.05);
    post.applyMatrix4(new THREE.Matrix4().setPosition(rx, 0.55, 0).premultiply(hRackM));
    geos.push(toStandard(post));
  }
  const hrTop = new THREE.BoxGeometry(0.95, 0.05, 0.05); hrTop.applyMatrix4(new THREE.Matrix4().setPosition(0, 1.05, 0).premultiply(hRackM)); geos.push(toStandard(hrTop));
  const hrBot = new THREE.BoxGeometry(0.95, 0.05, 0.05); hrBot.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.05, 0).premultiply(hRackM)); geos.push(toStandard(hrBot));

  const mRackM = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(1.94, 0.12, 0);
  for (const rx of [-0.40, 0.40]) {
    const post = new THREE.BoxGeometry(0.04, 0.90, 0.04);
    post.applyMatrix4(new THREE.Matrix4().setPosition(rx, 0.45, 0).premultiply(mRackM));
    geos.push(toStandard(post));
  }
  const mrTop = new THREE.BoxGeometry(0.88, 0.04, 0.04); mrTop.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.85, 0).premultiply(mRackM)); geos.push(toStandard(mrTop));

  const bowM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.12, 0, -0.15)).setPosition(0.22, 0.12, 1.15);
  const bow = new THREE.CylinderGeometry(0.012, 0.016, 1.05, 6);
  bow.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.50, 0).premultiply(bowM));
  geos.push(toStandard(bow));

  return mergeGeometries(geos) || geos[0];
})();

export const huntersAntlerGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const trophyM = new THREE.Matrix4().setPosition(-0.80, 1.28, 1.41);

  const skull = new THREE.ConeGeometry(0.045, 0.11, 5);
  skull.applyMatrix4(trophyM);
  geos.push(toStandard(skull));

  const t1 = new THREE.CylinderGeometry(0.014, 0.022, 0.22, 5);
  t1.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.6).setPosition(-0.10, 0.10, 0).premultiply(trophyM));
  geos.push(toStandard(t1));

  const t2 = new THREE.CylinderGeometry(0.01, 0.014, 0.12, 4);
  t2.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.4).setPosition(-0.16, 0.18, 0).premultiply(trophyM));
  geos.push(toStandard(t2));

  const t3 = new THREE.CylinderGeometry(0.014, 0.022, 0.22, 5);
  t3.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.6).setPosition(0.10, 0.10, 0).premultiply(trophyM));
  geos.push(toStandard(t3));

  const t4 = new THREE.CylinderGeometry(0.01, 0.014, 0.12, 4);
  t4.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.4).setPosition(0.16, 0.18, 0).premultiply(trophyM));
  geos.push(toStandard(t4));

  return mergeGeometries(geos) || geos[0];
})();

export const huntersRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.72).setPosition(0, 1.76, -0.80));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.72).setPosition(0, 1.76, 0.80));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export const huntersFinialsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const gx of [-1.81, 1.81]) {
    const f1 = new THREE.BoxGeometry(0.06, 0.40, 0.05);
    f1.applyMatrix4(new THREE.Matrix4().makeRotationX(0.45).setPosition(gx, 2.42, 0));
    geos.push(toStandard(f1));

    const f2 = new THREE.BoxGeometry(0.06, 0.40, 0.05);
    f2.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.45).setPosition(gx, 2.42, 0));
    geos.push(toStandard(f2));
  }
  return mergeGeometries(geos) || geos[0];
})();

export function HuntersHutModel({
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
      <mesh geometry={huntersBaseGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={huntersFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={huntersWallsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={huntersTimberDarkGeo} material={mats.timberDark} />
      <mesh geometry={huntersAntlerGeo} material={mats.antlerBone} />

      <mesh
        material={mats.hideTan}
        position={[-1.94, 0.67, 0.01]}
        rotation={[0, -Math.PI / 2, 0]}
        castShadow
      >
        <boxGeometry args={[0.78, 0.88, 0.02]} />
      </mesh>

      <group position={[1.94, 0.12, 0]} rotation={[0, Math.PI / 2, 0]}>
        {[-0.24, 0, 0.24].map((mx, idx) => (
          <mesh key={`meat-${idx}`} material={mats.meatRed} position={[mx, 0.65, 0.04]}>
            <cylinderGeometry args={[0.05, 0.07, 0.28, 6]} />
          </mesh>
        ))}
      </group>

      <MedievalDoor position={[-0.80, 0.12, 1.31]} width={0.66} height={1.0} />
      <MedievalWindow position={[0.85, 0.68, 1.33]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[0, 0.68, -1.33]} rotation={[0, Math.PI, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <FirewoodStack position={[1.45, 0.12, 1.45]} rotation={[0, 0, 0]} />

      <group ref={interiorRef} visible={false}>
        <mesh
          material={mats.furPelt}
          position={[-0.20, 0.115, -0.20]}
          rotation={[-Math.PI / 2, 0, 0.2]}
          receiveShadow
        >
          <planeGeometry args={[1.10, 0.85]} />
        </mesh>
        <MedievalStoneHearth
          position={[0, 0.12, -1.18]}
          isLightOn={isLightOn}
          hasSmoke={false}
          chimneyHeight={2.35}
        />
        <RusticCabinBed
          position={[-1.25, 0.12, -0.40]}
          rotation={[0, 0, 0]}
          blanketMaterial={mats.furPelt}
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
        <mesh geometry={huntersRoofGeo} material={mats.thatchDark} receiveShadow />
        <mesh material={mats.thatchRidge} position={[0, 2.34, 0]}>
          <boxGeometry args={[4.02, 0.12, 0.20]} />
        </mesh>
        <mesh geometry={huntersFinialsGeo} material={mats.timberDark} />
      </group>
    </group>
  );
}
