import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import {
  MedievalDoor,
  MedievalWindow,
  TriangularGable,
  MedievalStoneHearth,
  RusticWallShelf,
} from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const weaversBaseGeo = (() => {
  const g1 = new THREE.BoxGeometry(3.92, 0.10, 2.92); g1.translate(0, 0.05, 0);
  return toStandard(g1);
})();

export const weaversFloorGeo = (() => {
  const g1 = new THREE.BoxGeometry(3.76, 0.04, 2.76); g1.translate(0, 0.11, 0);
  return toStandard(g1);
})();

export const weaversPlasterWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const back = new THREE.BoxGeometry(3.76, 1.10, 0.12); back.translate(0, 0.68, -1.31); geos.push(toStandard(back));
  const left = new THREE.BoxGeometry(0.12, 1.10, 2.76); left.translate(-1.81, 0.68, 0); geos.push(toStandard(left));
  const right = new THREE.BoxGeometry(0.12, 1.10, 2.76); right.translate(1.81, 0.68, 0); geos.push(toStandard(right));
  const fLeft = new THREE.BoxGeometry(1.92, 1.10, 0.12); fLeft.translate(-0.85, 0.68, 1.31); geos.push(toStandard(fLeft));
  const fRight = new THREE.BoxGeometry(0.82, 1.10, 0.12); fRight.translate(1.40, 0.68, 1.31); geos.push(toStandard(fRight));

  return mergeGeometries(geos) || geos[0];
})();

export const weaversTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const lintel = new THREE.BoxGeometry(0.78, 0.22, 0.14); lintel.translate(0.50, 1.12, 1.31); geos.push(toStandard(lintel));

  for (const px of [-1.81, 1.81]) {
    for (const pz of [-1.31, 1.31]) {
      const p = new THREE.BoxGeometry(0.14, 1.14, 0.14);
      p.translate(px, 0.68, pz);
      geos.push(toStandard(p));
    }
  }

  const loomM = new THREE.Matrix4().setPosition(-1.05, 0.12, -0.20);
  for (const lx of [-0.42, 0.42]) {
    for (const lz of [-0.45, 0.45]) {
      const post = new THREE.BoxGeometry(0.06, 1.10, 0.06);
      post.applyMatrix4(new THREE.Matrix4().setPosition(lx, 0.55, lz).premultiply(loomM));
      geos.push(toStandard(post));
    }
    const sideRail = new THREE.BoxGeometry(0.06, 0.06, 0.96);
    sideRail.applyMatrix4(new THREE.Matrix4().setPosition(lx, 1.05, 0).premultiply(loomM));
    geos.push(toStandard(sideRail));
  }
  const bSeat = new THREE.BoxGeometry(0.55, 0.04, 0.24);
  bSeat.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.16, 0.65).premultiply(loomM));
  geos.push(toStandard(bSeat));
  for (const bx of [-0.20, 0.20]) {
    const bLeg = new THREE.BoxGeometry(0.04, 0.16, 0.20);
    bLeg.applyMatrix4(new THREE.Matrix4().setPosition(bx, 0.08, 0.65).premultiply(loomM));
    geos.push(toStandard(bLeg));
  }

  const wheelM = new THREE.Matrix4().makeRotationY(-0.5).setPosition(0.95, 0.12, -0.30);
  const wSeat = new THREE.BoxGeometry(0.65, 0.04, 0.24);
  wSeat.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.15).setPosition(0, 0.26, 0).premultiply(wheelM));
  geos.push(toStandard(wSeat));

  const l1 = new THREE.CylinderGeometry(0.015, 0.02, 0.28, 5);
  l1.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.2).setPosition(-0.25, 0.12, 0).premultiply(wheelM));
  geos.push(toStandard(l1));

  const l2 = new THREE.CylinderGeometry(0.015, 0.02, 0.32, 5);
  l2.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.15, 0, -0.2)).setPosition(0.22, 0.14, -0.08).premultiply(wheelM));
  geos.push(toStandard(l2));

  const l3 = new THREE.CylinderGeometry(0.015, 0.02, 0.32, 5);
  l3.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.15, 0, -0.2)).setPosition(0.22, 0.14, 0.08).premultiply(wheelM));
  geos.push(toStandard(l3));

  const wRim = new THREE.TorusGeometry(0.22, 0.018, 6, 16);
  wRim.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0.20, 0.52, 0).premultiply(wheelM));
  geos.push(toStandard(wRim));

  const s1 = new THREE.CylinderGeometry(0.01, 0.01, 0.44, 4);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0.20, 0.52, 0).premultiply(wheelM));
  geos.push(toStandard(s1));

  const s2 = new THREE.CylinderGeometry(0.01, 0.01, 0.44, 4);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0.20, 0.52, 0).premultiply(wheelM));
  geos.push(toStandard(s2));

  const rackM = new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-1.94, 0.12, 0);
  for (const rx of [-0.65, 0.65]) {
    const post = new THREE.CylinderGeometry(0.03, 0.04, 1.30, 5);
    post.applyMatrix4(new THREE.Matrix4().setPosition(rx, 0.65, 0).premultiply(rackM));
    geos.push(toStandard(post));
  }
  const cross = new THREE.CylinderGeometry(0.025, 0.025, 1.45, 5);
  cross.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, 1.25, 0).premultiply(rackM));
  geos.push(toStandard(cross));

  return mergeGeometries(geos) || geos[0];
})();

export const weaversTimberLightGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const loomM = new THREE.Matrix4().setPosition(-1.05, 0.12, -0.20);

  const r1 = new THREE.CylinderGeometry(0.04, 0.04, 0.82, 6);
  r1.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, 1.05, -0.42).premultiply(loomM));
  geos.push(toStandard(r1));

  const r2 = new THREE.CylinderGeometry(0.05, 0.05, 0.82, 6);
  r2.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, 0.35, 0.42).premultiply(loomM));
  geos.push(toStandard(r2));

  const shuttle = new THREE.BoxGeometry(0.24, 0.03, 0.06);
  shuttle.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, 0.3, 0.2)).setPosition(0.15, 0.65, 0.08).premultiply(loomM));
  geos.push(toStandard(shuttle));

  const wheelM = new THREE.Matrix4().makeRotationY(-0.5).setPosition(0.95, 0.12, -0.30);
  const distaff = new THREE.CylinderGeometry(0.012, 0.015, 0.65, 5);
  distaff.applyMatrix4(new THREE.Matrix4().setPosition(-0.22, 0.58, 0).premultiply(wheelM));
  geos.push(toStandard(distaff));

  return mergeGeometries(geos) || geos[0];
})();

export const weaversPlanksGeo = (() => {
  const shelf = new THREE.BoxGeometry(1.05, 1.0, 0.42);
  shelf.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(1.55, 0.62, 0.45));
  return toStandard(shelf);
})();

export const weaversVatAndPropsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const vatBase = new THREE.CylinderGeometry(0.26, 0.30, 0.16, 8); vatBase.translate(-1.94, 0.20, 0.55); geos.push(toStandard(vatBase));
  const vatKettle = new THREE.CylinderGeometry(0.24, 0.20, 0.32, 8); vatKettle.translate(-1.94, 0.40, 0.55); geos.push(toStandard(vatKettle));
  return mergeGeometries(geos) || geos[0];
})();

export const weaversWoolGeo = (() => {
  const wheelM = new THREE.Matrix4().makeRotationY(-0.5).setPosition(0.95, 0.12, -0.30);
  const wool = new THREE.DodecahedronGeometry(0.12, 0);
  wool.applyMatrix4(new THREE.Matrix4().setPosition(-0.22, 0.78, 0).premultiply(wheelM));
  return toStandard(wool);
})();

export const weaversRoofThatchGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.72).setPosition(0, 1.76, -0.80));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(3.96, 0.10, 1.95);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.72).setPosition(0, 1.76, 0.80));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export const weaversRoofRidgeGeo = (() => {
  const r = new THREE.BoxGeometry(4.02, 0.12, 0.20);
  r.translate(0, 2.34, 0);
  return toStandard(r);
})();

export function WeaversWorkshopModel({
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
      <mesh geometry={weaversBaseGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={weaversFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={weaversPlasterWallsGeo} material={mats.plaster} castShadow receiveShadow />

      <mesh geometry={weaversTimberDarkGeo} material={mats.timberDark} castShadow receiveShadow />
      <mesh geometry={weaversTimberLightGeo} material={mats.timberLight} />
      <mesh geometry={weaversPlanksGeo} material={mats.timberPlanks} castShadow receiveShadow />

      <mesh geometry={weaversVatAndPropsGeo} material={mats.copperBronze} />
      <mesh geometry={weaversWoolGeo} material={mats.rawWool} />

      <mesh material={mats.clothCrimson} position={[-1.05, 0.82, -0.20]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.76, 0.65, 0.015]} />
      </mesh>
      <mesh material={mats.clothRoyalBlue} position={[-1.05, 0.54, 0.08]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.76, 0.32, 0.015]} />
      </mesh>

      <mesh material={mats.clothRoyalBlue} position={[1.55, 0.42, 0.45]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[0.85, 0.14, 0.28]} />
      </mesh>
      <mesh material={mats.clothGold} position={[1.55, 0.62, 0.45]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[0.75, 0.14, 0.26]} />
      </mesh>
      <mesh material={mats.clothEmerald} position={[1.55, 0.82, 0.45]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[0.78, 0.14, 0.26]} />
      </mesh>
      <mesh material={mats.clothCrimson} position={[1.55, 1.00, 0.45]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[0.82, 0.12, 0.24]} />
      </mesh>

      <mesh material={mats.clothRoyalBlue} position={[-1.94, 0.82, -0.35]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[0.55, 0.95, 0.015]} />
      </mesh>
      <mesh material={mats.clothCrimson} position={[-1.94, 0.77, 0.35]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[0.55, 1.05, 0.015]} />
      </mesh>
      <mesh material={mats.clothEmerald} position={[-1.94, 0.52, 0.55]}>
        <circleGeometry args={[0.21, 8]} />
      </mesh>

      <MedievalDoor position={[0.50, 0.12, 1.31]} width={0.70} height={1.0} />
      <MedievalWindow position={[-0.85, 0.68, 1.33]} width={0.52} height={0.52} isLightOn={isLightOn} hasFlowerBox={true} />
      <MedievalWindow position={[0, 0.68, -1.33]} rotation={[0, Math.PI, 0]} width={0.52} height={0.52} isLightOn={isLightOn} hasFlowerBox={false} />

      <group ref={interiorRef} visible={false}>
        <RusticWallShelf position={[-0.85, 0.95, -1.22]} width={0.85} />
        <MedievalStoneHearth
          position={[0, 0.12, -1.18]}
          isLightOn={isLightOn}
          hasSmoke={false}
          chimneyHeight={2.35}
        />
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
          material={mats.wattleDaub}
        />
        <mesh geometry={weaversRoofThatchGeo} material={mats.thatchRoof} castShadow receiveShadow />
        <mesh geometry={weaversRoofRidgeGeo} material={mats.thatchRidge} />
      </group>
    </group>
  );
}
