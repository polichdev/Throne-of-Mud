import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../buildingMaterials';
import { ChimneySmoke, GothicPortal } from '../common/BuildingPrimitives';

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

function createButtressGeo(pos: [number, number, number], rotY: number, height = 1.75): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const b1 = new THREE.BoxGeometry(0.26, height * 0.5, 0.36).translate(0, height * 0.25, 0);
  const b2 = new THREE.BoxGeometry(0.22, height * 0.44, 0.26).translate(0, height * 0.72, -0.04);
  const cap1 = new THREE.BoxGeometry(0.27, 0.12, 0.28);
  cap1.applyMatrix4(new THREE.Matrix4().makeRotationX(0.45).setPosition(0, height * 0.5 + 0.04, -0.02));
  const cap2 = new THREE.BoxGeometry(0.23, 0.1, 0.2);
  cap2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.45).setPosition(0, height * 0.94 + 0.04, -0.05));
  geos.push(b1, b2, cap1, cap2);
  const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(pos[0], pos[1], pos[2]);
  return toStandard(mergeGeometries(geos) || b1).applyMatrix4(m);
}

function createLancetWindowGeo(pos: [number, number, number], rotY: number, width: number, height: number) {
  const geos: THREE.BufferGeometry[] = [];
  const sill = new THREE.BoxGeometry(width + 0.22, 0.08, 0.16).translate(0, -height / 2 - 0.04, 0.08);
  const jambL = new THREE.BoxGeometry(0.10, height, 0.12).translate(-width / 2 - 0.05, 0, 0.04);
  const jambR = new THREE.BoxGeometry(0.10, height, 0.12).translate(width / 2 + 0.05, 0, 0.04);
  const archL = new THREE.BoxGeometry(0.10, width * 0.72, 0.12);
  archL.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.6).setPosition(-width * 0.25, height / 2 + 0.08, 0.04));
  const archR = new THREE.BoxGeometry(0.10, width * 0.72, 0.12);
  archR.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.6).setPosition(width * 0.25, height / 2 + 0.08, 0.04));
  const mVert = new THREE.BoxGeometry(0.035, height, 0.02).translate(0, 0, 0.05);
  const mHoriz = new THREE.BoxGeometry(width, 0.035, 0.02).translate(0, height * 0.15, 0.05);
  const ring = new THREE.TorusGeometry(0.07, 0.015, 6, 12).translate(0, height / 2 + 0.05, 0.05);
  geos.push(sill, jambL, jambR, archL, archR, mVert, mHoriz, ring);

  const g1 = new THREE.BoxGeometry(width, height, 0.04).translate(0, 0, 0.02);
  const g2 = new THREE.BoxGeometry(width * 0.62, width * 0.62, 0.04);
  g2.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 4).setPosition(0, height / 2 + 0.06, 0.02));
  const glass = mergeGeometries([g1, g2]) || g1;

  const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(pos[0], pos[1], pos[2]);
  return {
    frame: toStandard(mergeGeometries(geos) || sill).applyMatrix4(m),
    glass: toStandard(glass).applyMatrix4(m),
  };
}

export const manorBaseGeometry = (() => {
  return toStandard(new THREE.BoxGeometry(5.06, 0.32, 4.06).translate(0, 0.16, 0));
})();

export const manorWallsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(4.88, 0.04, 3.88).translate(0, 0.18, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(4.88, 1.68, 0.16).translate(0, 1.0, -1.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.16, 1.68, 3.88).translate(-2.38, 1.0, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.16, 1.68, 3.88).translate(2.38, 1.0, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(1.28, 1.68, 0.16).translate(-1.72, 1.0, 1.88)));
  geos.push(toStandard(new THREE.BoxGeometry(1.28, 1.68, 0.16).translate(1.72, 1.0, 1.88)));
  geos.push(toStandard(new THREE.BoxGeometry(2.20, 0.28, 0.16).translate(0, 1.72, 1.88)));

  const pJambL = new THREE.BoxGeometry(0.18, 1.55, 0.20).translate(-0.71, 0.18 + 0.775, 1.88);
  const pJambR = new THREE.BoxGeometry(0.18, 1.55, 0.20).translate(0.71, 0.18 + 0.775, 1.88);
  geos.push(toStandard(pJambL), toStandard(pJambR));

  const s = new THREE.Shape();
  const halfD = 3.88 / 2;
  s.moveTo(-halfD, 0); s.lineTo(halfD, 0); s.lineTo(0, 1.58); s.closePath();

  const gL = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
  gL.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-2.38, 1.84, 0));

  const gR = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
  gR.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(2.38, 1.84, 0));
  geos.push(toStandard(gL), toStandard(gR));

  geos.push(createButtressGeo([-2.48, 0.16, 1.98], -Math.PI / 4));
  geos.push(createButtressGeo([2.48, 0.16, 1.98], Math.PI / 4));
  geos.push(createButtressGeo([-2.48, 0.16, -1.98], -Math.PI * 0.75));
  geos.push(createButtressGeo([2.48, 0.16, -1.98], Math.PI * 0.75));
  geos.push(createButtressGeo([-0.96, 0.16, 1.96], 0, 1.60));
  geos.push(createButtressGeo([0.96, 0.16, 1.96], 0, 1.60));
  geos.push(createButtressGeo([-1.2, 0.16, -1.96], Math.PI, 1.60));
  geos.push(createButtressGeo([1.2, 0.16, -1.96], Math.PI, 1.60));
  geos.push(createButtressGeo([-2.46, 0.16, 0], -Math.PI / 2));
  geos.push(createButtressGeo([2.46, 0.16, 0], Math.PI / 2));

  const w1 = createLancetWindowGeo([-1.72, 1.05, 1.90], 0, 0.48, 0.78);
  const w2 = createLancetWindowGeo([1.72, 1.05, 1.90], 0, 0.48, 0.78);
  const w3 = createLancetWindowGeo([-2.40, 1.05, -0.9], -Math.PI / 2, 0.48, 0.78);
  const w4 = createLancetWindowGeo([-2.40, 1.05, 0.9], -Math.PI / 2, 0.48, 0.78);
  const w5 = createLancetWindowGeo([2.40, 1.05, -0.9], Math.PI / 2, 0.48, 0.78);
  const w6 = createLancetWindowGeo([2.40, 1.05, 0.9], Math.PI / 2, 0.48, 0.78);
  const w7 = createLancetWindowGeo([-1.72, 1.05, -1.90], Math.PI, 0.48, 0.78);
  const w8 = createLancetWindowGeo([1.72, 1.05, -1.90], Math.PI, 0.48, 0.78);
  geos.push(w1.frame, w2.frame, w3.frame, w4.frame, w5.frame, w6.frame, w7.frame, w8.frame);

  return mergeGeometries(geos) || geos[0];
})();

export const manorGlassGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const w1 = createLancetWindowGeo([-1.72, 1.05, 1.90], 0, 0.48, 0.78);
  const w2 = createLancetWindowGeo([1.72, 1.05, 1.90], 0, 0.48, 0.78);
  const w3 = createLancetWindowGeo([-2.40, 1.05, -0.9], -Math.PI / 2, 0.48, 0.78);
  const w4 = createLancetWindowGeo([-2.40, 1.05, 0.9], -Math.PI / 2, 0.48, 0.78);
  const w5 = createLancetWindowGeo([2.40, 1.05, -0.9], Math.PI / 2, 0.48, 0.78);
  const w6 = createLancetWindowGeo([2.40, 1.05, 0.9], Math.PI / 2, 0.48, 0.78);
  const w7 = createLancetWindowGeo([-1.72, 1.05, -1.90], Math.PI, 0.48, 0.78);
  const w8 = createLancetWindowGeo([1.72, 1.05, -1.90], Math.PI, 0.48, 0.78);
  geos.push(w1.glass, w2.glass, w3.glass, w4.glass, w5.glass, w6.glass, w7.glass, w8.glass);
  return mergeGeometries(geos) || geos[0];
})();

export const manorCorniceGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(5.06, 0.08, 0.14).translate(0, 1.86, 1.94)));
  geos.push(toStandard(new THREE.BoxGeometry(5.06, 0.08, 0.14).translate(0, 1.86, -1.94)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.08, 4.02).translate(-2.44, 1.86, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.08, 4.02).translate(2.44, 1.86, 0)));

  for (const cx of [-2.52, 2.52]) {
    for (const cz of [-2.02, 2.02]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.2, 0.6, 0.2).translate(cx, 1.9 + 0.3, cz)));
      const cone = new THREE.ConeGeometry(0.14, 0.32, 4).translate(cx, 1.9 + 0.72, cz);
      geos.push(toStandard(cone));
    }
  }

  for (const gx of [-2.52, 2.52]) {
    geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.6, 0.14).translate(gx, 3.44 + 0.3, 0)));
    geos.push(toStandard(new THREE.ConeGeometry(0.11, 0.36, 4).translate(gx, 3.44 + 0.72, 0)));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const manorRoofGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const ridgeY = 3.50;
  const halfSpan = 2.13;
  const pitch = 1.58 / 1.94;
  const eaveY = ridgeY - pitch * halfSpan;
  const angle = Math.atan(pitch);
  const slopeLength = Math.hypot(halfSpan, ridgeY - eaveY);
  for (const side of [-1, 1]) {
    const slope = new THREE.BoxGeometry(5.34, 0.14, slopeLength);
    slope.applyMatrix4(new THREE.Matrix4().makeRotationX(side * angle)
      .setPosition(0, (ridgeY + eaveY) / 2, side * halfSpan / 2));
    geos.push(toStandard(slope));
  }
  const ridge = new THREE.BoxGeometry(5.38, 0.14, 0.20).translate(0, ridgeY + 0.025, 0);
  geos.push(toStandard(ridge));
  return mergeGeometries(geos)!;
})();

export const manorChimneyGeometry = (() => {
  const chim = new THREE.BoxGeometry(0.52, 1.45, 0.64).translate(2.28, 2.85 + 0.725, 0);
  const chimCap = new THREE.BoxGeometry(0.60, 0.08, 0.72).translate(2.28, 2.85 + 1.49, 0);
  const pot1 = new THREE.CylinderGeometry(0.10, 0.12, 0.30, 8).translate(2.28, 2.85 + 1.68, -0.16);
  const pot2 = new THREE.CylinderGeometry(0.10, 0.12, 0.30, 8).translate(2.28, 2.85 + 1.68, 0.16);

  return mergeGeometries([chim, chimCap, pot1, pot2].map(toStandard))!;
})();

export const manorBannersGeometry = (() => {
  const b1 = new THREE.BoxGeometry(0.26, 0.85, 0.03).translate(-0.88, 1.15, 1.97);
  const b2 = new THREE.BoxGeometry(0.26, 0.85, 0.03).translate(0.88, 1.15, 1.97);
  return mergeGeometries([toStandard(b1), toStandard(b2)]) || toStandard(b1);
})();

export function ManorModel({
  buildingId,
  isLightOn = false,
  roofRef,
  interiorRef,
}: {
  buildingId?: string;
  isLightOn?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
  interiorRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <mesh geometry={manorBaseGeometry} material={mats.stoneDark} receiveShadow />
      <mesh geometry={manorWallsGeometry} material={mats.stoneMed} castShadow receiveShadow />
      <mesh geometry={manorCorniceGeometry} material={mats.stoneLight} />
      <mesh geometry={manorBannersGeometry} material={mats.redBanner} />
      <mesh geometry={manorGlassGeometry} material={isLightOn ? mats.windowLit : mats.windowUnlit} />
      <mesh material={mats.velvetRed} position={[0, 0.19, 0.1]} receiveShadow>
        <boxGeometry args={[1.5, 0.01, 2.9]} />
      </mesh>
      <GothicPortal position={[0, 0.18, 1.88]} width={1.25} height={1.42} />

      <group ref={roofRef}>
        <mesh geometry={manorRoofGeometry} material={mats.gothicSlateRoof} castShadow receiveShadow />
        <mesh geometry={manorChimneyGeometry} material={mats.stoneMed} castShadow receiveShadow />
        {[-0.16, 0.16].map((z) => (
          <mesh key={z} material={mats.charcoalBlack} position={[2.28, 4.685, z]}>
            <cylinderGeometry args={[0.075, 0.075, 0.012, 8]} />
          </mesh>
        ))}
        <ChimneySmoke position={[2.28, 2.85 + 1.70, 0]} residentialBuildingId={buildingId ?? null} />
      </group>

      <group ref={interiorRef} visible={false}>
        <group position={[0, 0.18, -1.25]}>
          <mesh material={mats.stoneDark} position={[0, 0.06, 0]} receiveShadow>
            <boxGeometry args={[2.2, 0.12, 1.1]} />
          </mesh>
          <mesh material={mats.timberDark} position={[0, 0.24, 0]}>
            <boxGeometry args={[0.7, 0.44, 0.6]} />
          </mesh>
          <mesh material={mats.velvetRed} position={[0, 0.47, 0.02]}>
            <boxGeometry args={[0.54, 0.06, 0.48]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
