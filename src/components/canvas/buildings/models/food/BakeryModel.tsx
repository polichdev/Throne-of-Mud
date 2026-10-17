import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { ChimneySmoke, IndoorFireplaceFire, MedievalDoor, MedievalWindow } from '../../common/BuildingPrimitives';

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

export const bakeryStoneGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(3.96, 0.10, 1.96).translate(0, 0.05, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(1.85, 1.05, 0.12).translate(1.0, 0.65, -0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.05, 1.78).translate(1.88, 0.65, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.70, 1.05, 0.12).translate(0.4, 0.65, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.50, 1.05, 0.12).translate(1.65, 0.65, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(1.85, 0.44, 0.12).translate(-0.95, 0.22, 0.88)));
  return mergeGeometries(geos) || geos[0];
})();

export const bakeryWattleGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(1.9, 1.05, 0.12).translate(-0.95, 0.65, -0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.05, 1.78).translate(-1.88, 0.65, 0)));
  return mergeGeometries(geos) || geos[0];
})();

export const bakeryWoodGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(3.80, 0.03, 1.80).translate(0, 0.11, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.05, 0.58).translate(0.0, 0.65, -0.6)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.05, 0.42).translate(0.0, 0.65, 0.68)));
  geos.push(toStandard(new THREE.BoxGeometry(1.95, 0.06, 0.36).translate(-0.95, 0.46, 0.88)));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3 - row; col++) {
      const log = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6).rotateZ(Math.PI / 2);
      log.translate(1.85, 0.10 + row * 0.09, -0.45 + (col - (2 - row) * 0.5) * 0.11);
      geos.push(toStandard(log));
    }
  }
  return mergeGeometries(geos) || geos[0];
})();

export const bakeryTimberDarkGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.12, 0.88).translate(0.0, 1.12, 0.04)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 1.05, 0.08).translate(0.0, 0.65, -0.31)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 1.05, 0.08).translate(0.0, 0.65, 0.47)));
  geos.push(toStandard(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 6).translate(-1.88, 0.8, 0.88)));
  geos.push(toStandard(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 6).translate(0.0, 0.8, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(1.95, 0.1, 0.12).translate(-0.95, 1.15, 0.88)));

  geos.push(toStandard(new THREE.BoxGeometry(0.4, 0.03, 0.03).translate(-0.95, 1.26, 0.98)));

  return mergeGeometries(geos) || geos[0];
})();

export const bakeryBreadPropsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.18, 0.08, 0.14).translate(-1.45, 0.53, 0.88)));
  geos.push(toStandard(new THREE.BoxGeometry(0.16, 0.07, 0.13).translate(-1.20, 0.53, 0.88)));
  geos.push(toStandard(new THREE.DodecahedronGeometry(0.08, 0).translate(-0.95, 0.54, 0.88)));
  const b1 = new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6);
  b1.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).makeRotationY(0.3).setPosition(-0.6, 0.53, 0.88));
  const b2 = new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6);
  b2.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).makeRotationY(-0.2).setPosition(-0.38, 0.53, 0.88));
  geos.push(toStandard(b1), toStandard(b2));
  return mergeGeometries(geos) || geos[0];
})();

export const bakeryFlourSacksGeometry = (() => {
  const s1 = toStandard(new THREE.SphereGeometry(0.15, 6, 6).translate(-1.6, 0.16, 0.7));
  const s2 = toStandard(new THREE.SphereGeometry(0.14, 6, 6).translate(-1.75, 0.14, 0.5));
  return mergeGeometries([s1, s2]) || s1;
})();

export const bakeryRoofGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const g1 = new THREE.BoxGeometry(3.96, 1.40, 0.14);
  g1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.818).setPosition(0, 1.65, 0.44));
  const g2 = new THREE.BoxGeometry(3.96, 1.40, 0.14);
  g2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.818).setPosition(0, 1.65, -0.44));
  geos.push(toStandard(g1), toStandard(g2));

  const baseW = 1.76;
  const gHeight = 0.94;
  const half = baseW / 2;
  const s = new THREE.Shape();
  s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, gHeight); s.closePath();

  const gR = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  gR.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(1.88, 1.18, 0));
  geos.push(toStandard(gR));

  return mergeGeometries(geos) || geos[0];
})();

export const bakeryRoofWattleGableGeo = (() => {
  const baseW = 1.76;
  const gHeight = 0.94;
  const half = baseW / 2;
  const s = new THREE.Shape();
  s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, gHeight); s.closePath();

  const gL = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  gL.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-1.88, 1.18, 0));
  return toStandard(gL);
})();

export const bakeryRoofTrimGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const t1 = new THREE.BoxGeometry(3.96, 0.12, 0.16);
  t1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.818).setPosition(0, 1.18, 0.88));
  const t2 = new THREE.BoxGeometry(3.96, 0.12, 0.16);
  t2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.818).setPosition(0, 1.18, -0.88));
  geos.push(toStandard(t1), toStandard(t2));

  geos.push(toStandard(new THREE.BoxGeometry(3.98, 0.14, 0.14).translate(0, 2.12, 0)));

  const baseW = 1.76;
  const gHeight = 0.94;
  const half = baseW / 2;
  const slopeAngle = Math.atan2(gHeight, half);
  const hypotenuse = Math.sqrt(half * half + gHeight * gHeight);

  const addGableFrame = (posX: number, rotY: number) => {
    const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(posX, 1.18, 0);
    const post = new THREE.BoxGeometry(0.08, gHeight, 0.04).translate(0, gHeight / 2, 0.13);
    const leftRafter = new THREE.BoxGeometry(0.07, hypotenuse, 0.05);
    leftRafter.applyMatrix4(new THREE.Matrix4().makeRotationZ(slopeAngle - Math.PI / 2).setPosition(-half / 2, gHeight / 2, 0.13));
    const rightRafter = new THREE.BoxGeometry(0.07, hypotenuse, 0.05);
    rightRafter.applyMatrix4(new THREE.Matrix4().makeRotationZ(-(slopeAngle - Math.PI / 2)).setPosition(half / 2, gHeight / 2, 0.13));
    geos.push(toStandard(post).applyMatrix4(m), toStandard(leftRafter).applyMatrix4(m), toStandard(rightRafter).applyMatrix4(m));
  };
  addGableFrame(-1.88, -Math.PI / 2);
  addGableFrame(1.88, Math.PI / 2);

  for (const gx of [-1.98, 1.98]) {
    const f1 = new THREE.BoxGeometry(0.06, 0.44, 0.05);
    f1.applyMatrix4(new THREE.Matrix4().makeRotationX(0.55).setPosition(gx, 2.16, 0));
    const f2 = new THREE.BoxGeometry(0.06, 0.44, 0.05);
    f2.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.55).setPosition(gx, 2.16, 0));
    geos.push(toStandard(f1), toStandard(f2));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const bakeryChimneyGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.44, 1.05, 0.44).translate(1.15, 1.95, -0.38)));
  geos.push(toStandard(new THREE.BoxGeometry(0.52, 0.06, 0.52).translate(1.15, 2.505, -0.38)));
  geos.push(toStandard(new THREE.CylinderGeometry(0.12, 0.14, 0.28, 12).translate(1.15, 2.715, -0.38)));
  const rim = toStandard(new THREE.TorusGeometry(0.11, 0.028, 8, 16).rotateX(Math.PI / 2).translate(1.15, 2.845, -0.38));
  geos.push(rim);
  return mergeGeometries(geos) || geos[0];
})();

export const bakeryRoofSootGeometry = (() => {
  const soot = new THREE.CylinderGeometry(0.085, 0.085, 0.04, 12).translate(1.15, 2.835, -0.38);
  return toStandard(soot);
})();

const bakeryInteriorStoneOvenGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const ox = 1.15; const oz = -0.35; const oy = 0.08;

  const base = new THREE.BoxGeometry(1.08, 0.28, 0.95).translate(ox, oy + 0.14, oz);
  const backWall = new THREE.BoxGeometry(1.00, 0.56, 0.16).translate(ox, oy + 0.56, oz - 0.38);
  const leftWall = new THREE.BoxGeometry(0.18, 0.56, 0.68).translate(ox - 0.42, oy + 0.56, oz - 0.04);
  const rightWall = new THREE.BoxGeometry(0.18, 0.56, 0.68).translate(ox + 0.42, oy + 0.56, oz - 0.04);
  const domeTop = new THREE.BoxGeometry(1.04, 0.14, 0.88).translate(ox, oy + 0.88, oz - 0.04);

  const cheekL = new THREE.BoxGeometry(0.22, 0.46, 0.10).translate(ox - 0.32, oy + 0.51, oz + 0.26);
  const cheekR = new THREE.BoxGeometry(0.22, 0.46, 0.10).translate(ox + 0.32, oy + 0.51, oz + 0.26);
  const archLintel = new THREE.BoxGeometry(0.86, 0.14, 0.12).translate(ox, oy + 0.78, oz + 0.26);
  const hearthShelf = new THREE.BoxGeometry(0.56, 0.06, 0.18).translate(ox, oy + 0.29, oz + 0.35);

  const domeVault = new THREE.SphereGeometry(0.44, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(ox, oy + 0.80, oz - 0.08);

  geos.push(
    toStandard(base),
    toStandard(backWall),
    toStandard(leftWall),
    toStandard(rightWall),
    toStandard(domeTop),
    toStandard(cheekL),
    toStandard(cheekR),
    toStandard(archLintel),
    toStandard(hearthShelf),
    toStandard(domeVault)
  );

  return mergeGeometries(geos) || geos[0];
})();

const bakeryInteriorFirewoodGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const ox = 1.15; const oz = -0.35; const oy = 0.08;

  for (let i = 0; i < 3; i++) {
    const log = new THREE.CylinderGeometry(0.035, 0.035, 0.34, 6);
    log.applyMatrix4(
      new THREE.Matrix4()
        .makeRotationZ(Math.PI / 2)
        .makeRotationY((i - 1) * 0.3)
        .setPosition(ox + (i - 1) * 0.10, oy + 0.32, oz + (i % 2) * 0.04)
    );
    geos.push(toStandard(log));
  }

  const peelHandle = new THREE.CylinderGeometry(0.015, 0.015, 1.15, 5);
  peelHandle.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.28).setPosition(0.55, oy + 0.55, 0.15));
  const peelBlade = new THREE.BoxGeometry(0.20, 0.26, 0.02);
  peelBlade.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.28).setPosition(0.40, oy + 0.15, 0.15));
  geos.push(toStandard(peelHandle), toStandard(peelBlade));

  return mergeGeometries(geos) || geos[0];
})();

const bakeryInteriorDoughTableGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const bx = -1.1; const bz = -0.15;
  geos.push(toStandard(new THREE.BoxGeometry(1.0, 0.05, 0.65).translate(bx, 0.12 + 0.28, bz)));
  for (const lx of [-0.42, 0.42]) {
    for (const lz of [-0.26, 0.26]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.06, 0.28, 0.06).translate(bx + lx, 0.12 + 0.14, bz + lz)));
    }
  }
  geos.push(toStandard(new THREE.BoxGeometry(0.18, 0.08, 0.14).translate(bx - 0.22, 0.12 + 0.34, bz)));
  return mergeGeometries(geos) || geos[0];
})();

const bakeryInteriorTableFlourSackGeo = toStandard(new THREE.SphereGeometry(0.16, 6, 6).translate(-1.1 + 0.26, 0.12 + 0.38, -0.15 - 0.05));

export function BakeryModel({
  isLightOn = false,
  isWorking = true,
  roofRef,
  interiorRef,
}: {
  isLightOn?: boolean;
  isWorking?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
  interiorRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <mesh geometry={bakeryStoneGeometry} material={mats.stoneMed} receiveShadow />
      <mesh geometry={bakeryWattleGeometry} material={mats.wattleDaub} castShadow receiveShadow />
      <mesh geometry={bakeryWoodGeometry} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={bakeryTimberDarkGeometry} material={mats.timberDark} />
      <mesh geometry={bakeryBreadPropsGeometry} material={mats.breadCrust} />
      <mesh geometry={bakeryFlourSacksGeometry} material={mats.flourSack} />
      <MedievalDoor position={[1.05, 0.12, 0.88]} width={0.72} height={1.05} />
      <MedievalWindow position={[-1.89, 0.68, 0]} rotation={[0, -Math.PI / 2, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={true} />
      <MedievalWindow position={[1.89, 0.68, 0]} rotation={[0, Math.PI / 2, 0]} width={0.48} height={0.48} isLightOn={isLightOn} hasFlowerBox={false} />

      <mesh material={mats.goldTrim} position={[-0.95, 1.26 - 0.16, 0.98]}>
        <torusGeometry args={[0.08, 0.02, 6, 12]} />
      </mesh>

      <group ref={interiorRef} visible={false}>
        <mesh geometry={bakeryInteriorStoneOvenGeo} material={mats.stoneMed} receiveShadow />
        <mesh geometry={bakeryInteriorFirewoodGeo} material={mats.timberLogs} receiveShadow />
        <IndoorFireplaceFire position={[1.15, 0.08 + 0.35, -0.28]} scale={0.65} isLit={isWorking || isLightOn} />
        <mesh geometry={bakeryInteriorDoughTableGeo} material={mats.timberLight} receiveShadow />
        <mesh geometry={bakeryInteriorTableFlourSackGeo} material={mats.flourSack} />
      </group>

      <group ref={roofRef}>
        <mesh geometry={bakeryRoofGeometry} material={mats.shingleRoof} castShadow receiveShadow />
        <mesh geometry={bakeryRoofWattleGableGeo} material={mats.wattleDaub} receiveShadow />
        <mesh geometry={bakeryRoofTrimGeometry} material={mats.timberDark} />
        <mesh geometry={bakeryChimneyGeometry} material={mats.stoneMed} receiveShadow />
        <mesh geometry={bakeryRoofSootGeometry} material={mats.charcoalBlack} />
        <ChimneySmoke position={[1.15, 2.85, -0.38]} />
      </group>
    </group>
  );
}
