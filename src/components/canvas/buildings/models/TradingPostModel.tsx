import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../buildingMaterials';
import { MedievalDoor, MedievalWindow, TimberBarrel } from '../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    const count = g.attributes.position.count;
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
  }
  const cleaned = new THREE.BufferGeometry();
  cleaned.setAttribute('position', g.attributes.position);
  cleaned.setAttribute('normal', g.attributes.normal);
  cleaned.setAttribute('uv', g.attributes.uv);
  return cleaned;
}

export const tradingPostBaseGeometry = (() => {
  return toStandard(new THREE.BoxGeometry(4.92, 0.12, 2.92).translate(0, 0.06, 0));
})();

export const tradingPostFloorGeometry = (() => {
  return toStandard(new THREE.BoxGeometry(4.76, 0.04, 2.76).translate(0, 0.13, 0));
})();

export const tradingPostWallsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(2.4, 1.35, 0.12).translate(-1.15, 0.80, -1.32)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.35, 2.64).translate(-2.34, 0.80, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.35, 2.64).translate(0.05, 0.80, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.9, 1.35, 0.12).translate(-1.9, 0.80, 1.32)));
  geos.push(toStandard(new THREE.BoxGeometry(0.9, 1.35, 0.12).translate(-0.4, 0.80, 1.32)));
  geos.push(toStandard(new THREE.BoxGeometry(0.6, 0.25, 0.12).translate(-1.15, 1.35, 1.32)));

  geos.push(toStandard(new THREE.BoxGeometry(2.25, 0.85, 0.12).translate(1.25, 0.55, -1.32)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 0.85, 2.64).translate(2.34, 0.55, 0)));

  return mergeGeometries(geos) || geos[0];
})();

export const tradingPostBeamsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const px of [-2.34, 0.05, 2.34]) {
    for (const pz of [-1.32, 1.32]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.14, 1.40, 0.14).translate(px, 0.80, pz)));
    }
  }

  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.40, 0.12).translate(1.2, 0.80, 1.32)));

  geos.push(
    toStandard(new THREE.BoxGeometry(4.80, 0.08, 0.14).translate(0, 1.46, -1.32)),
    toStandard(new THREE.BoxGeometry(0.14, 0.08, 2.76).translate(-2.34, 1.46, 0)),
    toStandard(new THREE.BoxGeometry(0.14, 0.08, 2.76).translate(0.05, 1.46, 0)),
    toStandard(new THREE.BoxGeometry(0.14, 0.08, 2.76).translate(2.34, 1.46, 0)),
    toStandard(new THREE.BoxGeometry(4.80, 0.08, 0.14).translate(0, 1.46, 1.32))
  );

  geos.push(toStandard(new THREE.BoxGeometry(1.95, 0.45, 0.35).translate(1.15, 0.35, 0.45)));
  geos.push(toStandard(new THREE.BoxGeometry(2.05, 0.04, 0.42).translate(1.15, 0.59, 0.45)));

  geos.push(toStandard(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6).translate(2.1, 0.4, -1.9)));
  geos.push(toStandard(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6).translate(0.7, 0.4, -1.9)));
  geos.push(toStandard(new THREE.BoxGeometry(1.6, 0.06, 0.06).translate(1.4, 0.72, -1.9)));

  geos.push(toStandard(new THREE.BoxGeometry(0.35, 0.03, 0.03).translate(0.35, 1.30, 1.42)));
  geos.push(toStandard(new THREE.BoxGeometry(0.32, 0.22, 0.025).translate(0.35, 1.12, 1.42)));

  return mergeGeometries(geos) || geos[0];
})();

export const tradingPostCratesGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  geos.push(toStandard(new THREE.BoxGeometry(0.42, 0.38, 0.42).translate(1.85, 0.32, -0.6)));
  geos.push(toStandard(new THREE.BoxGeometry(0.38, 0.35, 0.38).translate(1.85, 0.68, -0.6)));
  geos.push(toStandard(new THREE.BoxGeometry(0.48, 0.40, 0.40).translate(1.35, 0.33, -0.65)));

  geos.push(toStandard(new THREE.BoxGeometry(0.36, 0.22, 0.28).translate(1.7, 0.24, 0.85)));
  geos.push(toStandard(new THREE.BoxGeometry(0.32, 0.20, 0.24).translate(1.7, 0.45, 0.85)));

  geos.push(toStandard(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6).translate(0.85, 0.73, 0.45)));
  geos.push(toStandard(new THREE.BoxGeometry(0.18, 0.02, 0.02).translate(0.85, 0.84, 0.45)));
  geos.push(toStandard(new THREE.CylinderGeometry(0.04, 0.05, 0.02, 8).translate(0.78, 0.76, 0.45)));
  geos.push(toStandard(new THREE.CylinderGeometry(0.04, 0.05, 0.02, 8).translate(0.92, 0.76, 0.45)));

  return mergeGeometries(geos) || geos[0];
})();

export const tradingPostRoofGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const r1 = new THREE.BoxGeometry(5.02, 0.10, 1.88);
  r1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.67).setPosition(0, 2.05, -0.69));
  const r2 = new THREE.BoxGeometry(5.02, 0.10, 1.88);
  r2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.67).setPosition(0, 2.05, 0.69));
  geos.push(toStandard(r1), toStandard(r2));

  const s = new THREE.Shape();
  const halfD = 2.76 / 2;
  s.moveTo(-halfD, 0);
  s.lineTo(halfD, 0);
  s.lineTo(0, 1.30);
  s.closePath();

  const gL = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  gL.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-2.34, 1.46, 0));

  const gR = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  gR.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(2.34, 1.46, 0));

  geos.push(toStandard(gL), toStandard(gR));

  return mergeGeometries(geos) || geos[0];
})();

export const tradingPostRoofTrimGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const e1 = new THREE.BoxGeometry(5.04, 0.10, 0.12);
  e1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.67).setPosition(0, 1.48, -1.40));
  const e2 = new THREE.BoxGeometry(5.04, 0.10, 0.12);
  e2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.67).setPosition(0, 1.48, 1.40));
  geos.push(toStandard(e1), toStandard(e2));

  geos.push(toStandard(new THREE.BoxGeometry(5.06, 0.10, 0.14).translate(0, 2.73, 0)));

  return mergeGeometries(geos) || geos[0];
})();

export function TradingPostModel({
  isLightOn = false,
  roofRef,
  interiorRef,
}: {
  isLightOn?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
  interiorRef?: RefObject<THREE.Group | null>;
}) {
  return (
    <group>
      <mesh geometry={tradingPostBaseGeometry} material={SHARED_BUILDING_MATS.stoneDark} receiveShadow castShadow />
      <mesh geometry={tradingPostFloorGeometry} material={SHARED_BUILDING_MATS.timberPlanks} receiveShadow />
      <mesh geometry={tradingPostWallsGeometry} material={SHARED_BUILDING_MATS.plaster} castShadow receiveShadow />
      <mesh geometry={tradingPostBeamsGeometry} material={SHARED_BUILDING_MATS.timberDark} castShadow receiveShadow />
      <mesh geometry={tradingPostCratesGeometry} material={SHARED_BUILDING_MATS.timberLight} castShadow receiveShadow />

      <TimberBarrel position={[0.7, 0.32, -0.65]} scale={0.9} />
      <TimberBarrel position={[0.95, 0.32, -0.65]} scale={0.9} />
      <TimberBarrel position={[1.4, 0.32, 0.85]} scale={0.85} />

      <MedievalDoor position={[-1.15, 0.13, 1.34]} width={0.65} height={1.1} />
      <MedievalWindow position={[-1.15, 0.8, -1.34]} width={0.5} height={0.5} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[-2.36, 0.8, 0]} width={0.5} height={0.5} rotation={[0, -Math.PI / 2, 0]} isLightOn={isLightOn} hasFlowerBox={false} />

      <group ref={interiorRef} visible={false}>
        <mesh material={SHARED_BUILDING_MATS.timberDark} position={[-1.15, 0.4, 0]}>
          <boxGeometry args={[1.2, 0.5, 0.6]} />
        </mesh>
        <mesh material={SHARED_BUILDING_MATS.timberLight} position={[-1.15, 0.3, -0.6]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
        </mesh>
      </group>

      <group ref={roofRef}>
        <mesh geometry={tradingPostRoofGeometry} material={SHARED_BUILDING_MATS.thatchRoof} castShadow receiveShadow />
        <mesh geometry={tradingPostRoofTrimGeometry} material={SHARED_BUILDING_MATS.timberDark} castShadow receiveShadow />
      </group>
    </group>
  );
}
