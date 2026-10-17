import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { MedievalDoor, MedievalWindow } from '../../common/BuildingPrimitives';

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

export const barracksStoneBaseGeo = (() => {
  const base = new THREE.BoxGeometry(4.96, 0.10, 2.96); base.translate(0, 0.05, 0);
  return toStandard(base);
})();

export const barracksFloorGeo = (() => {
  const f = new THREE.BoxGeometry(4.76, 0.04, 2.76).translate(0, 0.11, 0);
  return toStandard(f);
})();

export const barracksLogWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const back = new THREE.BoxGeometry(4.84, 1.25, 0.14); back.translate(0, 0.8, -1.35); geos.push(toStandard(back));
  const left = new THREE.BoxGeometry(0.14, 1.25, 2.74); left.translate(-2.35, 0.8, 0); geos.push(toStandard(left));
  const right = new THREE.BoxGeometry(0.14, 1.25, 2.74); right.translate(2.35, 0.8, 0); geos.push(toStandard(right));
  const fLeft = new THREE.BoxGeometry(1.76, 1.25, 0.14); fLeft.translate(-1.48, 0.8, 1.35); geos.push(toStandard(fLeft));
  const fRight = new THREE.BoxGeometry(1.76, 1.25, 0.14); fRight.translate(1.48, 0.8, 1.35); geos.push(toStandard(fRight));
  return mergeGeometries(geos) || geos[0];
})();

export const barracksTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const lintel = new THREE.BoxGeometry(1.24, 0.22, 0.16); lintel.translate(0, 1.32, 1.35); geos.push(toStandard(lintel));

  for (const cx of [-2.38, 2.38]) {
    for (const cz of [-1.38, 1.38]) {
      const p = new THREE.BoxGeometry(0.18, 1.4, 0.18).translate(cx, 0.8, cz);
      geos.push(toStandard(p));
    }
  }

  for (const dx of [-0.62, 0.62]) {
    const p = new THREE.BoxGeometry(0.14, 1.35, 0.16).translate(dx, 0.8, 1.36);
    geos.push(toStandard(p));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const barracksRoofGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const sLeft = new THREE.BoxGeometry(5.02, 1.95, 0.16);
  sLeft.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.73).setPosition(0, 2.05, 0.72));
  const sRight = new THREE.BoxGeometry(5.02, 1.95, 0.16);
  sRight.applyMatrix4(new THREE.Matrix4().makeRotationX(0.73).setPosition(0, 2.05, -0.72));
  geos.push(toStandard(sLeft), toStandard(sRight));

  const baseW = 2.74;
  const gHeight = 1.25;
  const half = baseW / 2;
  const s = new THREE.Shape();
  s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, gHeight); s.closePath();

  const gL = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false });
  gL.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-2.35, 1.42, 0));
  const gR = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false });
  gR.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(2.35, 1.42, 0));
  geos.push(toStandard(gL), toStandard(gR));

  return mergeGeometries(geos) || geos[0];
})();

export const barracksRoofTrimGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(5.06, 0.16, 0.16).translate(0, 2.72, 0)));
  const fLeft = new THREE.BoxGeometry(5.02, 0.12, 0.16);
  fLeft.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.73).setPosition(0, 1.45, 1.38));
  const fRight = new THREE.BoxGeometry(5.02, 0.12, 0.16);
  fRight.applyMatrix4(new THREE.Matrix4().makeRotationX(0.73).setPosition(0, 1.45, -1.38));
  geos.push(toStandard(fLeft), toStandard(fRight));

  for (const gx of [-2.45, 2.45]) {
    const post = new THREE.BoxGeometry(0.08, 0.44, 0.08).translate(gx, 2.85, 0);
    geos.push(toStandard(post));
  }
  return mergeGeometries(geos) || geos[0];
})();

const barracksInteriorTimberGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const bedX = -1.65; const bedZ = -0.5;
  for (const px of [-0.42, 0.42]) {
    for (const pz of [-0.75, 0.75]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.08, 1.35, 0.08).translate(bedX + px, 0.11 + 0.675, bedZ + pz)));
    }
  }
  geos.push(toStandard(new THREE.BoxGeometry(0.8, 0.06, 1.45).translate(bedX, 0.11 + 0.32, bedZ)));
  geos.push(toStandard(new THREE.BoxGeometry(0.8, 0.06, 1.45).translate(bedX, 0.11 + 0.95, bedZ)));

  for (let r = 1; r <= 3; r++) {
    geos.push(toStandard(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 4).translate(bedX + 0.44, 0.11 + 0.25 * r, bedZ + 0.4)));
  }

  const chest1 = new THREE.BoxGeometry(0.42, 0.24, 0.28).translate(bedX, 0.11 + 0.12, bedZ + 0.92);
  const chest2 = new THREE.BoxGeometry(0.42, 0.24, 0.28).translate(bedX, 0.11 + 0.12, bedZ - 0.92);
  geos.push(toStandard(chest1), toStandard(chest2));

  const tX = 0.25; const tZ = 0;
  geos.push(toStandard(new THREE.BoxGeometry(1.15, 0.06, 0.72).translate(tX, 0.11 + 0.36, tZ)));
  for (const tx of [-0.48, 0.48]) {
    for (const tz of [-0.28, 0.28]) {
      geos.push(toStandard(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 4).translate(tX + tx, 0.11 + 0.18, tZ + tz)));
    }
  }
  geos.push(toStandard(new THREE.BoxGeometry(1.1, 0.04, 0.22).translate(tX, 0.11 + 0.20, tZ - 0.55)));
  geos.push(toStandard(new THREE.BoxGeometry(1.1, 0.04, 0.22).translate(tX, 0.11 + 0.20, tZ + 0.55)));

  const rackX = 1.85; const rackZ = -0.55;
  geos.push(toStandard(new THREE.BoxGeometry(0.08, 0.9, 1.2).translate(rackX, 0.11 + 0.55, rackZ)));
  geos.push(toStandard(new THREE.BoxGeometry(0.18, 0.06, 1.25).translate(rackX - 0.05, 0.11 + 0.22, rackZ)));
  geos.push(toStandard(new THREE.BoxGeometry(0.18, 0.06, 1.25).translate(rackX - 0.05, 0.11 + 0.78, rackZ)));

  const dummyX = 1.75; const dummyZ = 0.65;
  const dummyPost = new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6).translate(dummyX, 0.11 + 0.65, dummyZ);
  const dummyCross = new THREE.BoxGeometry(0.06, 0.06, 0.65).translate(dummyX, 0.11 + 0.95, dummyZ);
  const dummyBase = new THREE.BoxGeometry(0.38, 0.06, 0.38).translate(dummyX, 0.11 + 0.03, dummyZ);
  geos.push(toStandard(dummyPost), toStandard(dummyCross), toStandard(dummyBase));

  return mergeGeometries(geos) || geos[0];
})();

const barracksInteriorBeddingGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const bedX = -1.65; const bedZ = -0.5;

  const mat1 = new THREE.BoxGeometry(0.72, 0.08, 1.36).translate(bedX, 0.11 + 0.38, bedZ);
  const mat2 = new THREE.BoxGeometry(0.72, 0.08, 1.36).translate(bedX, 0.11 + 1.01, bedZ);
  geos.push(toStandard(mat1), toStandard(mat2));

  return mergeGeometries(geos) || geos[0];
})();

const barracksInteriorBlanketsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const bedX = -1.65; const bedZ = -0.5;

  const b1 = new THREE.BoxGeometry(0.74, 0.09, 0.85).translate(bedX, 0.11 + 0.39, bedZ + 0.24);
  const b2 = new THREE.BoxGeometry(0.74, 0.09, 0.85).translate(bedX, 0.11 + 1.02, bedZ + 0.24);
  geos.push(toStandard(b1), toStandard(b2));

  return mergeGeometries(geos) || geos[0];
})();

const barracksInteriorPillowsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const bedX = -1.65; const bedZ = -0.5;

  const p1 = new THREE.BoxGeometry(0.62, 0.08, 0.28).translate(bedX, 0.11 + 0.44, bedZ - 0.5);
  const p2 = new THREE.BoxGeometry(0.62, 0.08, 0.28).translate(bedX, 0.11 + 1.07, bedZ - 0.5);
  geos.push(toStandard(p1), toStandard(p2));

  return mergeGeometries(geos) || geos[0];
})();

const barracksInteriorWeaponsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const rackX = 1.85; const rackZ = -0.55;

  for (let s = -2; s <= 2; s++) {
    const swordBlade = new THREE.BoxGeometry(0.02, 0.65, 0.04).translate(rackX - 0.08, 0.11 + 0.52, rackZ + s * 0.18);
    const swordCross = new THREE.BoxGeometry(0.04, 0.02, 0.12).translate(rackX - 0.08, 0.11 + 0.82, rackZ + s * 0.18);
    geos.push(toStandard(swordBlade), toStandard(swordCross));
  }

  for (let sp = -1; sp <= 1; sp++) {
    const spearTip = new THREE.ConeGeometry(0.025, 0.14, 4);
    spearTip.applyMatrix4(new THREE.Matrix4().setPosition(rackX - 0.05, 0.11 + 1.15, rackZ + sp * 0.35));
    geos.push(toStandard(spearTip));
  }

  const dummyX = 1.75; const dummyZ = 0.65;
  const helmet = new THREE.BoxGeometry(0.24, 0.24, 0.24).translate(dummyX, 0.11 + 1.28, dummyZ);
  geos.push(toStandard(helmet));

  return mergeGeometries(geos) || geos[0];
})();

const barracksInteriorShieldsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const rackX = 1.85;

  for (const [sz, sy, rotZ] of [[-1.1, 0.55, 0.15], [0.15, 0.55, -0.15]]) {
    const shield = new THREE.BoxGeometry(0.04, 0.44, 0.32);
    shield.applyMatrix4(new THREE.Matrix4().makeRotationZ(rotZ).setPosition(rackX - 0.02, 0.11 + sy, sz));
    geos.push(toStandard(shield));
  }

  return mergeGeometries(geos) || geos[0];
})();

const barracksInteriorMapDetailGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const tX = 0.25; const tZ = 0;

  const mapParchment = new THREE.BoxGeometry(0.55, 0.01, 0.38).translate(tX, 0.11 + 0.40, tZ);
  const scroll = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6);
  scroll.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(tX - 0.32, 0.11 + 0.41, tZ + 0.12));
  geos.push(toStandard(mapParchment), toStandard(scroll));

  return mergeGeometries(geos) || geos[0];
})();

export function BarracksModel({
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
      <mesh geometry={barracksStoneBaseGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={barracksFloorGeo} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={barracksLogWallsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={barracksTimberDarkGeo} material={mats.timberDark} />
      <MedievalDoor position={[0, 0.13, 1.35]} width={1.10} height={1.22} isDouble={true} />
      <MedievalWindow position={[-1.48, 0.82, 1.36]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[1.48, 0.82, 1.36]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[-2.36, 0.82, -0.45]} rotation={[0, -Math.PI / 2, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[-2.36, 0.82, 0.45]} rotation={[0, -Math.PI / 2, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[2.36, 0.82, -0.45]} rotation={[0, Math.PI / 2, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[2.36, 0.82, 0.45]} rotation={[0, Math.PI / 2, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />

      <group ref={roofRef}>
        <mesh geometry={barracksRoofGeometry} material={mats.thatchRoof} castShadow receiveShadow />
        <mesh geometry={barracksRoofTrimGeometry} material={mats.thatchDark} />
      </group>

      <group ref={interiorRef} visible={false}>
        <mesh geometry={barracksInteriorTimberGeo} material={mats.timberDark} receiveShadow />
        <mesh geometry={barracksInteriorBeddingGeo} material={mats.flourSack} receiveShadow />
        <mesh geometry={barracksInteriorBlanketsGeo} material={mats.bedLinenRed} receiveShadow />
        <mesh geometry={barracksInteriorPillowsGeo} material={mats.pillowWhite} receiveShadow />
        <mesh geometry={barracksInteriorWeaponsGeo} material={mats.ironSteel} />
        <mesh geometry={barracksInteriorShieldsGeo} material={mats.shieldWood} />
        <mesh geometry={barracksInteriorMapDetailGeo} material={mats.goldWheat} receiveShadow />
      </group>
    </group>
  );
}
