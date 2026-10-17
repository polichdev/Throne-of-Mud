import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';

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

export const clayPitSoilGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const base = new THREE.BoxGeometry(3.92, 0.08, 2.92).translate(0, 0.04, 0);
  geos.push(toStandard(base));

  for (const [bx, bz, bw, bd, bh] of [
    [-1.25, -0.85, 1.25, 0.95, 0.12],
    [1.25, -0.85, 1.25, 0.95, 0.12],
    [-1.25, 0.85, 1.25, 0.95, 0.14],
    [1.25, 0.85, 1.25, 0.95, 0.14],
  ]) {
    const mound = new THREE.BoxGeometry(bw, bh, bd).translate(bx, 0.08 + bh / 2, bz);
    geos.push(toStandard(mound));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const clayPitTerracesGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const pitFloor = new THREE.BoxGeometry(1.85, 0.06, 1.85).translate(0, 0.08 + 0.03, 0);
  geos.push(toStandard(pitFloor));

  const t1 = new THREE.BoxGeometry(0.75, 0.18, 1.65).translate(-0.85, 0.08 + 0.09, 0);
  const t2 = new THREE.BoxGeometry(1.65, 0.18, 0.65).translate(0, 0.08 + 0.09, -0.85);
  const t3 = new THREE.BoxGeometry(0.65, 0.20, 1.45).translate(0.85, 0.08 + 0.10, 0);
  const t4 = new THREE.BoxGeometry(1.55, 0.18, 0.55).translate(0, 0.08 + 0.09, 0.85);
  geos.push(toStandard(t1), toStandard(t2), toStandard(t3), toStandard(t4));

  for (const [mx, mz, r] of [
    [-0.55, -0.55, 0.22],
    [0.55, -0.45, 0.20],
    [-0.45, 0.55, 0.18],
    [0.45, 0.45, 0.20],
    [-0.25, 0.15, 0.16],
    [0.25, -0.20, 0.18],
  ]) {
    const lump = new THREE.DodecahedronGeometry(r, 0).translate(mx, 0.08 + r * 0.7, mz);
    geos.push(toStandard(lump));
  }

  const puddle = new THREE.BoxGeometry(0.85, 0.06, 0.85).translate(0, 0.08 + 0.02, 0);
  geos.push(toStandard(puddle));

  const barrowClay = new THREE.BoxGeometry(0.55, 0.12, 0.32).translate(1.25, 0.08 + 0.22, 0.55);
  geos.push(toStandard(barrowClay));

  return mergeGeometries(geos) || geos[0];
})();

export const clayPitTimberShoringGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const [lx, lz] of [
    [-0.95, -0.95],
    [0.95, -0.95],
    [-0.95, 0.95],
    [0.95, 0.95],
  ]) {
    const post = new THREE.BoxGeometry(0.12, 0.65, 0.12).translate(lx, 0.08 + 0.325, lz);
    geos.push(toStandard(post));
  }

  const logN = new THREE.BoxGeometry(1.90, 0.12, 0.10).translate(0, 0.08 + 0.32, -0.95);
  const logS = new THREE.BoxGeometry(1.90, 0.12, 0.10).translate(0, 0.08 + 0.32, 0.95);
  const logW = new THREE.BoxGeometry(0.10, 0.12, 1.90).translate(-0.95, 0.08 + 0.32, 0);
  const logE = new THREE.BoxGeometry(0.10, 0.12, 1.90).translate(0.95, 0.08 + 0.32, 0);
  geos.push(toStandard(logN), toStandard(logS), toStandard(logW), toStandard(logE));

  const ladderM = new THREE.Matrix4().makeRotationX(-0.42).setPosition(-0.55, 0.08 + 0.32, -0.65);
  for (const rx of [-0.14, 0.14]) {
    const rail = new THREE.BoxGeometry(0.04, 0.85, 0.04).translate(rx, 0, 0);
    rail.applyMatrix4(ladderM);
    geos.push(toStandard(rail));
  }
  for (let r = -2; r <= 2; r++) {
    const rung = new THREE.BoxGeometry(0.28, 0.03, 0.03).translate(0, r * 0.14, 0);
    rung.applyMatrix4(ladderM);
    geos.push(toStandard(rung));
  }

  const mastL = new THREE.BoxGeometry(0.14, 2.55, 0.14);
  mastL.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.16).setPosition(-0.55, 0.08 + 1.25, -0.75));
  const mastR = new THREE.BoxGeometry(0.14, 2.55, 0.14);
  mastR.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.16).setPosition(0.55, 0.08 + 1.25, -0.75));
  geos.push(toStandard(mastL), toStandard(mastR));

  const crossBeamTop = new THREE.BoxGeometry(1.45, 0.14, 0.14).translate(0, 0.08 + 2.45, -0.75);
  const crossBeamMid = new THREE.BoxGeometry(1.25, 0.10, 0.10).translate(0, 0.08 + 1.15, -0.75);
  geos.push(toStandard(crossBeamTop), toStandard(crossBeamMid));

  const boom = new THREE.BoxGeometry(0.12, 0.12, 1.25).translate(0, 0.08 + 2.45, -0.15);
  geos.push(toStandard(boom));

  const braceL = new THREE.BoxGeometry(0.09, 1.85, 0.09);
  braceL.applyMatrix4(new THREE.Matrix4().makeRotationX(0.48).setPosition(-0.55, 0.08 + 1.15, -1.25));
  const braceR = new THREE.BoxGeometry(0.09, 1.85, 0.09);
  braceR.applyMatrix4(new THREE.Matrix4().makeRotationX(0.48).setPosition(0.55, 0.08 + 1.15, -1.25));
  geos.push(toStandard(braceL), toStandard(braceR));

  const drum = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8);
  drum.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, 0.08 + 0.85, -0.75));
  geos.push(toStandard(drum));

  const crankPost = new THREE.BoxGeometry(0.08, 0.65, 0.08).translate(0.72, 0.08 + 0.45, -0.75);
  const crankArm = new THREE.BoxGeometry(0.04, 0.24, 0.04).translate(0.78, 0.08 + 0.85, -0.75);
  const crankHandle = new THREE.BoxGeometry(0.14, 0.04, 0.04).translate(0.85, 0.08 + 0.95, -0.75);
  geos.push(toStandard(crankPost), toStandard(crankArm), toStandard(crankHandle));

  const sheave = new THREE.CylinderGeometry(0.10, 0.10, 0.05, 8);
  sheave.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.08 + 2.40, 0.35));
  geos.push(toStandard(sheave));

  return mergeGeometries(geos) || geos[0];
})();

export const clayPitShedGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const sx = -1.35; const sz = 0.45; const sy = 0.08;

  for (const px of [-0.45, 0.45]) {
    for (const pz of [-0.45, 0.45]) {
      const isBack = pz < 0;
      const h = isBack ? 1.45 : 1.15;
      const post = new THREE.BoxGeometry(0.09, h, 0.09).translate(sx + px, sy + h / 2, sz + pz);
      geos.push(toStandard(post));
    }
  }

  const beam1 = new THREE.BoxGeometry(1.05, 0.08, 0.08).translate(sx, sy + 1.40, sz - 0.45);
  const beam2 = new THREE.BoxGeometry(1.05, 0.08, 0.08).translate(sx, sy + 1.10, sz + 0.45);
  geos.push(toStandard(beam1), toStandard(beam2));

  const barrowBody = new THREE.BoxGeometry(0.65, 0.18, 0.42).translate(1.25, sy + 0.18, 0.55);
  const wheel = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8);
  wheel.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(1.25 - 0.38, sy + 0.12, 0.55));
  const handleL = new THREE.BoxGeometry(0.55, 0.04, 0.04).translate(1.25 + 0.38, sy + 0.22, 0.55 - 0.16);
  const handleR = new THREE.BoxGeometry(0.55, 0.04, 0.04).translate(1.25 + 0.38, sy + 0.22, 0.55 + 0.16);
  geos.push(toStandard(barrowBody), toStandard(wheel), toStandard(handleL), toStandard(handleR));

  return mergeGeometries(geos) || geos[0];
})();

export const clayPitPropsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const sy = 0.08;

  const barrel1 = new THREE.CylinderGeometry(0.20, 0.18, 0.48, 8).translate(1.45, sy + 0.24, -0.65);
  const barrel2 = new THREE.CylinderGeometry(0.15, 0.14, 0.35, 7).translate(1.15, sy + 0.18, -0.85);
  geos.push(toStandard(barrel1), toStandard(barrel2));

  const spadeHandle1 = new THREE.CylinderGeometry(0.015, 0.015, 0.85, 5);
  spadeHandle1.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.22).setPosition(-1.25, sy + 0.45, 0.35));
  const spadeBlade1 = new THREE.BoxGeometry(0.14, 0.20, 0.02);
  spadeBlade1.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.22).setPosition(-1.32, sy + 0.12, 0.35));

  const pickHandle = new THREE.CylinderGeometry(0.016, 0.016, 0.75, 5);
  pickHandle.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.25).setPosition(-1.45, sy + 0.40, 0.65));
  const pickHead = new THREE.BoxGeometry(0.28, 0.05, 0.05);
  pickHead.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.25).setPosition(-1.38, sy + 0.72, 0.65));

  geos.push(toStandard(spadeHandle1), toStandard(spadeBlade1), toStandard(pickHandle), toStandard(pickHead));

  return mergeGeometries(geos) || geos[0];
})();

export const clayPitRoofGeo = (() => {
  const roof = new THREE.BoxGeometry(1.25, 0.08, 1.25);
  roof.applyMatrix4(new THREE.Matrix4().makeRotationX(0.22).setPosition(-1.35, 0.08 + 1.28, 0.45));
  return toStandard(roof);
})();

function ClayPitAnimatedHoist({ isWorking = true }: { isWorking?: boolean }) {
  const hoistRef = useRef<THREE.Group>(null);
  const cableRef = useRef<THREE.Mesh>(null);
  const mats = SHARED_BUILDING_MATS;

  useFrame(({ clock }) => {
    if (!hoistRef.current || !cableRef.current) return;
    const t = isWorking ? clock.getElapsedTime() : 0;
    const hoistY = 0.38 + Math.sin(t * 1.2) * 0.32;
    hoistRef.current.position.y = hoistY;

    const pulleyTopY = 2.48;
    const cableLen = Math.max(0.18, pulleyTopY - hoistY);
    cableRef.current.position.y = hoistY + cableLen / 2;
    cableRef.current.scale.y = cableLen;
  });

  return (
    <group position={[0, 0.08, 0.35]}>
      <mesh ref={cableRef} material={mats.clothWhite} position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 1.0, 6]} />
      </mesh>
      <group ref={hoistRef} position={[0, 0.38, 0]}>
        <mesh material={mats.timberDark} position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.22, 0.17, 0.30, 8, 1, true]} />
        </mesh>
        <mesh material={mats.clayOrange} position={[0, 0.16, 0]}>
          <dodecahedronGeometry args={[0.17, 0]} />
        </mesh>
        <mesh material={mats.ironSteel} position={[0, 0.30, 0]}>
          <torusGeometry args={[0.19, 0.015, 4, 12, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
}

export function ClayPitModel({
  isLightOn = false,
  isWorking = true,
  roofRef,
}: {
  isLightOn?: boolean;
  isWorking?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;
  void isLightOn;

  return (
    <group>
      <mesh geometry={clayPitSoilGeo} material={mats.richSoil} receiveShadow />
      <mesh geometry={clayPitTerracesGeo} material={mats.clayOrange} receiveShadow />
      <mesh geometry={clayPitTimberShoringGeo} material={mats.timberLogs} receiveShadow />
      <mesh geometry={clayPitShedGeo} material={mats.timberDark} castShadow receiveShadow />
      <mesh geometry={clayPitPropsGeo} material={mats.barrelWood} />

      <ClayPitAnimatedHoist isWorking={isWorking} />

      <group ref={roofRef}>
        <mesh geometry={clayPitRoofGeo} material={mats.thatchRoof} castShadow receiveShadow />
      </group>
    </group>
  );
}
