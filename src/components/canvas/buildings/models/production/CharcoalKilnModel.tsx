import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { ChimneySmoke, IndoorFireplaceFire } from '../../common/BuildingPrimitives';

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

export const kilnStoneDarkGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(4.85, 0.08, 2.85).translate(0, 0.04, 0)));
  geos.push(toStandard(new THREE.CylinderGeometry(1.15, 1.20, 0.14, 24).translate(-1.15, 0.09, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.86, 0.08, 0.40).translate(-1.15, 0.16, 0.96)));
  return mergeGeometries(geos) || geos[0];
})();

export const kilnStoneGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const dome = new THREE.SphereGeometry(0.98, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
  dome.applyMatrix4(new THREE.Matrix4().setPosition(-1.15, 0.14, 0));
  geos.push(toStandard(dome));
  return mergeGeometries(geos) || geos[0];
})();

export const kilnStoneLightGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const jambL = new THREE.BoxGeometry(0.14, 0.60, 0.36).translate(-1.15 - 0.36, 0.44, 0.96);
  const jambR = new THREE.BoxGeometry(0.14, 0.60, 0.36).translate(-1.15 + 0.36, 0.44, 0.96);
  const archTop = new THREE.BoxGeometry(0.86, 0.18, 0.38).translate(-1.15, 0.74, 0.96);
  const archKeystone = new THREE.BoxGeometry(0.20, 0.22, 0.40).translate(-1.15, 0.78, 0.98);
  geos.push(toStandard(jambL), toStandard(jambR), toStandard(archTop), toStandard(archKeystone));

  const rim = new THREE.TorusGeometry(0.18, 0.035, 8, 16);
  rim.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(-1.15, 1.12, 0));
  geos.push(toStandard(rim));

  return mergeGeometries(geos) || geos[0];
})();

export const kilnFirewoodGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  geos.push(toStandard(new THREE.CylinderGeometry(0.25, 0.28, 0.36, 8).translate(0.35, 0.08 + 0.18, 0.25)));

  const px = 0.35; const pz = -0.75; const py = 0.08;
  const tiers = [
    { xs: [-0.38, -0.19, 0.0, 0.19, 0.38], y: 0.14, r: 0.075 },
    { xs: [-0.28, -0.09, 0.09, 0.28], y: 0.28, r: 0.07 },
    { xs: [-0.19, 0.0, 0.19], y: 0.41, r: 0.065 },
    { xs: [-0.09, 0.09], y: 0.53, r: 0.06 },
  ];

  for (const t of tiers) {
    for (const x of t.xs) {
      const log = new THREE.CylinderGeometry(t.r, t.r, 0.68, 6);
      log.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(px + x, py + t.y, pz));
      geos.push(toStandard(log));
    }
  }

  return mergeGeometries(geos) || geos[0];
})();

export const kilnShedGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const sx = 1.65; const sz = -0.45; const sy = 0.08;

  geos.push(toStandard(new THREE.BoxGeometry(0.09, 1.40, 0.09).translate(sx - 0.65, sy + 0.70, sz - 0.65)));
  geos.push(toStandard(new THREE.BoxGeometry(0.09, 1.40, 0.09).translate(sx + 0.65, sy + 0.70, sz - 0.65)));
  geos.push(toStandard(new THREE.BoxGeometry(0.09, 1.10, 0.09).translate(sx - 0.65, sy + 0.55, sz + 0.65)));
  geos.push(toStandard(new THREE.BoxGeometry(0.09, 1.10, 0.09).translate(sx + 0.65, sy + 0.55, sz + 0.65)));

  geos.push(toStandard(new THREE.BoxGeometry(0.08, 0.70, 0.75).translate(0.35 - 0.55, 0.08 + 0.35, -0.75)));
  geos.push(toStandard(new THREE.BoxGeometry(0.08, 0.70, 0.75).translate(0.35 + 0.55, 0.08 + 0.35, -0.75)));

  return mergeGeometries(geos) || geos[0];
})();

export const kilnRoofGeometry = (() => {
  const r = new THREE.BoxGeometry(1.65, 0.09, 1.65);
  r.applyMatrix4(new THREE.Matrix4().makeRotationX(0.18).setPosition(1.65, 0.08 + 1.25, -0.45));
  return toStandard(r);
})();

export const kilnCharcoalGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const flueHole = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16).translate(-1.15, 1.09, 0);
  geos.push(toStandard(flueHole));

  const ashBed = new THREE.BoxGeometry(0.60, 0.04, 0.36).translate(-1.15, 0.16, 0.94);
  geos.push(toStandard(ashBed));

  geos.push(toStandard(new THREE.DodecahedronGeometry(0.16, 0).translate(-0.45, 0.08 + 0.12, 0.95)));
  geos.push(toStandard(new THREE.DodecahedronGeometry(0.14, 0).translate(-0.30, 0.08 + 0.07, 0.95)));
  geos.push(toStandard(new THREE.DodecahedronGeometry(0.10, 0).translate(-0.18, 0.08 + 0.06, 0.95 + 0.12)));

  const sx = 1.65; const sz = -0.45;
  const pileMain = new THREE.ConeGeometry(0.55, 0.38, 9).translate(sx, 0.08 + 0.19, sz);
  geos.push(toStandard(pileMain));

  for (const [ox, oz, r] of [[-0.28, -0.2, 0.16], [0.25, -0.22, 0.14], [-0.22, 0.22, 0.15], [0.28, 0.18, 0.13], [0, -0.32, 0.12], [0, 0.3, 0.14]]) {
    const chunk = new THREE.DodecahedronGeometry(r, 0).translate(sx + ox, 0.08 + r * 0.7, sz + oz);
    geos.push(toStandard(chunk));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const kilnSacksGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const sx = 1.65; const sz = -0.45;

  const sack1 = new THREE.CylinderGeometry(0.13, 0.16, 0.32, 7).translate(sx + 0.42, 0.08 + 0.16, sz + 0.38);
  const sack2 = new THREE.CylinderGeometry(0.12, 0.15, 0.28, 7).translate(sx + 0.45, 0.08 + 0.14, sz - 0.15);
  geos.push(toStandard(sack1), toStandard(sack2));

  return mergeGeometries(geos) || geos[0];
})();

export function CharcoalKilnModel({
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
      <mesh geometry={kilnStoneDarkGeometry} material={mats.stoneDark} receiveShadow />
      <mesh geometry={kilnStoneGeometry} material={mats.stoneMed} receiveShadow />
      <mesh geometry={kilnStoneLightGeometry} material={mats.stoneLight} />
      <mesh geometry={kilnFirewoodGeometry} material={mats.timberLogs} receiveShadow />
      <mesh geometry={kilnShedGeometry} material={mats.timberDark} />
      <mesh geometry={kilnCharcoalGeometry} material={mats.charcoalBlack} receiveShadow />
      <mesh geometry={kilnSacksGeometry} material={mats.flourSack} receiveShadow />

      <IndoorFireplaceFire position={[-1.15, 0.18, 0.96]} scale={0.95} isLit={isWorking || isLightOn} />

      {isWorking && <ChimneySmoke position={[-1.15, 1.16, 0]} />}

      <group ref={roofRef}>
        <mesh geometry={kilnRoofGeometry} material={mats.thatchRoof} castShadow />
      </group>
    </group>
  );
}
