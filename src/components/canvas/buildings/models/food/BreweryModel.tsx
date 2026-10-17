import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { ChimneySmoke, MedievalDoor, MedievalWindow } from '../../common/BuildingPrimitives';

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

export const breweryStoneGeometry = (() => {
  const g = new THREE.BoxGeometry(3.96, 0.10, 1.96).translate(0, 0.05, 0);
  return toStandard(g);
})();

export const breweryWallsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(3.80, 0.03, 1.80).translate(0, 0.11, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(3.78, 1.05, 0.12).translate(0, 0.65, -0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.05, 1.78).translate(-1.88, 0.65, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.05, 1.78).translate(1.88, 0.65, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.58, 1.05, 0.12).translate(-1.59, 0.65, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.50, 0.31, 0.12).translate(-1.05, 0.275, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.50, 0.25, 0.12).translate(-1.05, 1.055, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.60, 1.05, 0.12).translate(-0.50, 0.65, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.70, 0.06, 0.12).translate(0.15, 1.15, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(1.38, 1.05, 0.12).translate(1.19, 0.65, 0.88)));
  return mergeGeometries(geos) || geos[0];
})();

export const breweryBeamsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const bx of [-1.88, 1.88]) {
    for (const bz of [-0.88, 0.88]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.14, 1.15, 0.14).translate(bx, 0.65, bz)));
    }
  }

  geos.push(toStandard(new THREE.BoxGeometry(3.92, 0.12, 0.14).translate(0, 1.18, -0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(3.92, 0.12, 0.14).translate(0, 1.18, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.12, 1.90).translate(-1.88, 1.18, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.12, 1.90).translate(1.88, 1.18, 0)));

  const keg = new THREE.CylinderGeometry(0.45, 0.5, 0.75, 10).translate(1.38, 0.12 + 0.42, -0.28);
  geos.push(toStandard(keg));

  const b1 = new THREE.CylinderGeometry(0.18, 0.16, 0.42, 8).translate(1.15 - 0.4, 0.12 + 0.21, 0.45);
  const b2 = new THREE.CylinderGeometry(0.18, 0.16, 0.42, 8).translate(1.15 + 0.4, 0.12 + 0.21, 0.45);
  const b3 = new THREE.CylinderGeometry(0.16, 0.15, 0.38, 8).translate(1.15, 0.12 + 0.50, 0.45);
  geos.push(toStandard(b1), toStandard(b2), toStandard(b3));

  return mergeGeometries(geos) || geos[0];
})();

export const breweryRoofGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const g1 = new THREE.BoxGeometry(3.96, 1.40, 0.14);
  g1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.818).setPosition(0, 1.65, 0.44));
  const g2 = new THREE.BoxGeometry(3.96, 1.40, 0.14);
  g2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.818).setPosition(0, 1.65, -0.44));
  const ridge = new THREE.BoxGeometry(3.98, 0.14, 0.14).translate(0, 2.12, 0);
  geos.push(toStandard(g1), toStandard(g2), toStandard(ridge));

  const baseW = 1.76;
  const gHeight = 0.94;
  const half = baseW / 2;
  const s = new THREE.Shape();
  s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, gHeight); s.closePath();

  const gL = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  gL.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-1.88, 1.18, 0));
  const gR = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  gR.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(1.88, 1.18, 0));
  geos.push(toStandard(gL), toStandard(gR));

  return mergeGeometries(geos) || geos[0];
})();

export const breweryCopperGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.CylinderGeometry(0.42, 0.46, 0.48, 12).translate(-0.75, 0.54, -0.2)));
  geos.push(toStandard(new THREE.CylinderGeometry(0.1, 0.42, 0.22, 12).translate(-0.75, 0.84, -0.2)));
  geos.push(toStandard(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8).translate(-0.75, 1.32, -0.2)));

  geos.push(toStandard(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 8).translate(-0.75, 2.05, -0.2)));
  geos.push(toStandard(new THREE.ConeGeometry(0.14, 0.12, 8).translate(-0.75, 2.38, -0.2)));

  return mergeGeometries(geos) || geos[0];
})();

export function BreweryModel({
  isLightOn = false,
  isWorking = true,
  roofRef,
}: {
  isLightOn?: boolean;
  isWorking?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <mesh geometry={breweryStoneGeometry} material={mats.stoneMed} receiveShadow />
      <mesh geometry={breweryWallsGeometry} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={breweryBeamsGeometry} material={mats.timberDark} />
      <mesh geometry={breweryCopperGeometry} material={mats.copperBrew} />
      <MedievalDoor position={[0.15, 0.12, 0.88]} width={0.68} height={1.02} />
      <MedievalWindow position={[-1.05, 0.68, 0.88]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />

      <group ref={roofRef}>
        <mesh geometry={breweryRoofGeometry} material={mats.thatchRoof} castShadow receiveShadow />
        {isWorking && <ChimneySmoke position={[-0.75, 2.45, -0.2]} />}
      </group>
    </group>
  );
}
