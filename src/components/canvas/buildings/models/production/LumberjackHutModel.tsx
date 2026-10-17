import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import {
  MedievalDoor,
  MedievalWindow,
  MedievalBed,
  firewoodSupportsGeometry,
  firewoodLogsGeometry,
} from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

function createLumberjackGable(posX: number, rotY: number) {
  const baseWidth = 1.76;
  const height = 0.94;
  const thickness = 0.12;
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

  const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(posX, 1.18, 0);
  return {
    wall: toStandard(sGeo).applyMatrix4(m),
    frame: toStandard(frameGeo).applyMatrix4(m),
  };
}

const _ljGableL = createLumberjackGable(-1.88, -Math.PI / 2);
const _ljGableR = createLumberjackGable(1.88, Math.PI / 2);

export const lumberjackBaseGeo = (() => {
  const g = new THREE.BoxGeometry(3.92, 0.10, 1.92); g.translate(0, 0.05, 0);
  return toStandard(g);
})();

export const lumberjackFloorGeo = (() => {
  const g = new THREE.BoxGeometry(3.80, 0.03, 1.80); g.translate(0, 0.11, 0);
  return toStandard(g);
})();

export const lumberjackWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const back = new THREE.BoxGeometry(2.78, 1.07, 0.12); back.translate(-0.49, 0.11 + 1.07 / 2, -0.88); geos.push(toStandard(back));
  const left = new THREE.BoxGeometry(0.12, 1.07, 1.76); left.translate(-1.88, 0.11 + 1.07 / 2, 0); geos.push(toStandard(left));
  const mid = new THREE.BoxGeometry(0.12, 1.07, 1.76); mid.translate(0.90, 0.11 + 1.07 / 2, 0); geos.push(toStandard(mid));

  const f1 = new THREE.BoxGeometry(0.62, 1.07, 0.12); f1.translate(-1.57, 0.11 + 1.07 / 2, 0.88); geos.push(toStandard(f1));
  const f2 = new THREE.BoxGeometry(0.46, 0.32, 0.12); f2.translate(-1.03, 0.28, 0.88); geos.push(toStandard(f2));
  const f3 = new THREE.BoxGeometry(0.46, 0.28, 0.12); f3.translate(-1.03, 1.04, 0.88); geos.push(toStandard(f3));
  const f4 = new THREE.BoxGeometry(0.62, 1.07, 0.12); f4.translate(-0.49, 0.11 + 1.07 / 2, 0.88); geos.push(toStandard(f4));
  const f5 = new THREE.BoxGeometry(0.66, 0.16, 0.12); f5.translate(0.15, 1.10, 0.88); geos.push(toStandard(f5));
  const f6 = new THREE.BoxGeometry(0.42, 1.07, 0.12); f6.translate(0.69, 0.11 + 1.07 / 2, 0.88); geos.push(toStandard(f6));

  for (const px of [1.85, 0.90]) {
    for (const pz of [0.88, -0.88]) {
      const post = new THREE.CylinderGeometry(0.09, 0.09, 1.07, 6);
      post.translate(px, 0.11 + 1.07 / 2, pz);
      geos.push(toStandard(post));
    }
  }

  const fwLogs = firewoodLogsGeometry.clone().translate(1.38 + 0.05, 0.12, -0.45);
  geos.push(toStandard(fwLogs));

  return mergeGeometries(geos) || geos[0];
})();

export const lumberjackTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const l1 = new THREE.BoxGeometry(0.98, 0.08, 0.08); l1.translate(1.38, 1.15, 0.88); geos.push(toStandard(l1));
  const l2 = new THREE.BoxGeometry(0.98, 0.08, 0.08); l2.translate(1.38, 1.15, -0.88); geos.push(toStandard(l2));

  const stump = new THREE.CylinderGeometry(0.2, 0.23, 0.36, 6);
  stump.translate(1.38 - 0.15, 0.12 + 0.18, 0.2);
  geos.push(toStandard(stump));

  const fwSup = firewoodSupportsGeometry.clone().translate(1.38 + 0.05, 0.12, -0.45);
  geos.push(toStandard(fwSup));

  const axe = new THREE.BoxGeometry(0.12, 0.08, 0.03);
  axe.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.4).setPosition(1.38 - 0.15, 0.12 + 0.42, 0.2));
  const saw = new THREE.BoxGeometry(0.08, 0.8, 0.015);
  saw.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.3).setPosition(1.38 + 0.3, 0.12 + 0.38, 0.3));
  geos.push(toStandard(axe), toStandard(saw));

  return mergeGeometries(geos) || geos[0];
})();

export const lumberjackGablesWallGeo = (() => {
  return mergeGeometries([_ljGableL.wall, _ljGableR.wall]) || _ljGableL.wall;
})();

export const lumberjackGablesFrameGeo = (() => {
  return mergeGeometries([_ljGableL.frame, _ljGableR.frame]) || _ljGableL.frame;
})();

export const lumberjackRoofGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(4.10, 1.40, 0.14);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.818).setPosition(0, 1.65, 0.44));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(4.10, 1.40, 0.14);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.818).setPosition(0, 1.65, -0.44));
  geos.push(toStandard(s2));

  return mergeGeometries(geos) || geos[0];
})();

export const lumberjackRoofFasciaGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const f1 = new THREE.BoxGeometry(4.10, 0.12, 0.16);
  f1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.818).setPosition(0, 1.18, 0.88));
  geos.push(toStandard(f1));

  const f2 = new THREE.BoxGeometry(4.10, 0.12, 0.16);
  f2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.818).setPosition(0, 1.18, -0.88));
  geos.push(toStandard(f2));

  const ridge = new THREE.BoxGeometry(4.16, 0.14, 0.14).translate(0, 2.12, 0);
  geos.push(toStandard(ridge));

  return mergeGeometries(geos) || geos[0];
})();

export function LumberjackHutModel({
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
      <mesh geometry={lumberjackBaseGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={lumberjackFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={lumberjackWallsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={lumberjackTimberDarkGeo} material={mats.timberDark} />

      <MedievalDoor position={[0.15, 0.12, 0.88]} width={0.65} height={1.0} />
      <MedievalWindow position={[-1.03, 0.66, 0.89]} width={0.44} height={0.44} isLightOn={isLightOn} hasFlowerBox={false} />

      <group ref={interiorRef} visible={false}>
        <MedievalBed position={[-1.25, 0.12, -0.2]} quiltMaterial={mats.bedLinenGreen} />
        <group position={[-0.2, 0.12, -0.2]}>
          <mesh material={mats.timberLight} position={[0, 0.2, 0]} receiveShadow>
            <boxGeometry args={[0.45, 0.05, 0.45]} />
          </mesh>
          <mesh material={isLightOn ? mats.candleGlow : mats.candleUnlit} position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.016, 0.02, 0.06, 5]} />
          </mesh>
        </group>
      </group>

      <group ref={roofRef}>
        <mesh geometry={lumberjackGablesWallGeo} material={mats.timberLogs} receiveShadow />
        <mesh geometry={lumberjackGablesFrameGeo} material={mats.timberDark} />
        <mesh geometry={lumberjackRoofGeo} material={mats.thatchRoof} castShadow receiveShadow />
        <mesh geometry={lumberjackRoofFasciaGeo} material={mats.thatchDark} />
      </group>
    </group>
  );
}
