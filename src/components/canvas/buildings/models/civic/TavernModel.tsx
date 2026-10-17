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

export const tavernBaseGeometry = (() => {
  return toStandard(new THREE.BoxGeometry(3.92, 0.10, 2.92).translate(0, 0.05, 0));
})();

export const tavernFloorGeometry = (() => {
  const f = new THREE.BoxGeometry(3.76, 0.04, 2.76).translate(0, 0.11, 0);
  return toStandard(f);
})();

export const tavernWallsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(3.76, 1.35, 0.12).translate(0, 0.785, -1.36)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.35, 2.76).translate(-1.86, 0.785, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 1.35, 2.76).translate(1.86, 0.785, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(1.44, 1.35, 0.12).translate(-1.14, 0.785, 1.36)));
  geos.push(toStandard(new THREE.BoxGeometry(1.44, 1.35, 0.12).translate(1.14, 0.785, 1.36)));
  geos.push(toStandard(new THREE.BoxGeometry(0.84, 0.23, 0.12).translate(0, 1.345, 1.36)));
  return mergeGeometries(geos) || geos[0];
})();

export const tavernBeamsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const px of [-1.86, 1.86]) {
    for (const pz of [-1.36, 1.36]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.15, 1.38, 0.15).translate(px, 0.785, pz)));
    }
  }

  geos.push(
    toStandard(new THREE.BoxGeometry(3.80, 0.08, 0.14).translate(0, 1.44, -1.36)),
    toStandard(new THREE.BoxGeometry(0.14, 0.08, 2.80).translate(-1.86, 1.44, 0)),
    toStandard(new THREE.BoxGeometry(0.14, 0.08, 2.80).translate(1.86, 1.44, 0)),
    toStandard(new THREE.BoxGeometry(3.80, 0.08, 0.14).translate(0, 1.44, 1.36))
  );

  geos.push(toStandard(new THREE.BoxGeometry(0.26, 0.03, 0.03).translate(0.55 - 0.12, 1.25, 1.44)));
  geos.push(toStandard(new THREE.BoxGeometry(0.24, 0.20, 0.025).translate(0.55, 1.25 - 0.15, 1.44)));

  return mergeGeometries(geos) || geos[0];
})();

export const tavernRoofGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const r1 = new THREE.BoxGeometry(3.96, 0.10, 1.85);
  r1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.67).setPosition(0, 2.05, -0.69));
  const r2 = new THREE.BoxGeometry(3.96, 0.10, 1.85);
  r2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.67).setPosition(0, 2.05, 0.69));
  geos.push(toStandard(r1), toStandard(r2));

  const s = new THREE.Shape();
  const halfD = 2.76 / 2;
  s.moveTo(-halfD, 0);
  s.lineTo(halfD, 0);
  s.lineTo(0, 1.30);
  s.closePath();

  const gL = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  gL.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-1.86, 1.44, 0));

  const gR = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  gR.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(1.86, 1.44, 0));

  geos.push(toStandard(gL), toStandard(gR));

  return mergeGeometries(geos) || geos[0];
})();

export const tavernRoofTrimGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const e1 = new THREE.BoxGeometry(3.98, 0.10, 0.12);
  e1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.67).setPosition(0, 1.46, -1.40));
  const e2 = new THREE.BoxGeometry(3.98, 0.10, 0.12);
  e2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.67).setPosition(0, 1.46, 1.40));
  geos.push(toStandard(e1), toStandard(e2));

  geos.push(toStandard(new THREE.BoxGeometry(4.0, 0.10, 0.14).translate(0, 2.72, 0)));

  return mergeGeometries(geos) || geos[0];
})();

export const tavernChimneyGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const m1 = new THREE.BoxGeometry(0.38, 2.45, 0.44).translate(1.50, 2.16, -0.45);
  const m2 = new THREE.CylinderGeometry(0.15, 0.18, 0.20, 12).translate(1.50, 2.16 + 1.37, -0.45);
  const m3 = new THREE.TorusGeometry(0.14, 0.028, 8, 16);
  m3.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(1.50, 2.16 + 1.47, -0.45));
  const c = new THREE.BoxGeometry(0.46, 0.07, 0.52).translate(1.50, 2.16 + 1.23, -0.45);
  geos.push(toStandard(m1), toStandard(m2), toStandard(m3), toStandard(c));
  return mergeGeometries(geos) || geos[0];
})();

export const tavernRoofSootGeometry = (() => {
  const darkFlue = new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12).translate(1.50, 2.16 + 1.46, -0.45);
  return toStandard(darkFlue);
})();

const tavernInteriorHearthGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const bx = 1.45; const bz = -0.45;
  geos.push(toStandard(new THREE.BoxGeometry(0.55, 0.08, 0.95).translate(bx, 0.11 + 0.04, bz)));
  geos.push(toStandard(new THREE.BoxGeometry(0.10, 0.72, 0.88).translate(bx + 0.14, 0.11 + 0.40, bz)));
  geos.push(toStandard(new THREE.BoxGeometry(0.32, 0.72, 0.20).translate(bx - 0.03, 0.11 + 0.40, bz - 0.36)));
  geos.push(toStandard(new THREE.BoxGeometry(0.32, 0.72, 0.20).translate(bx - 0.03, 0.11 + 0.40, bz + 0.36)));
  geos.push(toStandard(new THREE.BoxGeometry(0.34, 0.15, 0.88).translate(bx - 0.03, 0.11 + 0.74, bz)));
  geos.push(toStandard(new THREE.BoxGeometry(0.40, 0.05, 0.98).translate(bx - 0.08, 0.11 + 0.83, bz)));
  return mergeGeometries(geos) || geos[0];
})();

const tavernInteriorFurnitureGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const barX = -0.95; const barZ = -0.55;
  geos.push(toStandard(new THREE.BoxGeometry(1.35, 0.46, 0.26).translate(barX + 0.25, 0.11 + 0.23, barZ + 0.12)));
  geos.push(toStandard(new THREE.BoxGeometry(1.42, 0.035, 0.32).translate(barX + 0.25, 0.11 + 0.47, barZ + 0.12)));
  geos.push(toStandard(new THREE.BoxGeometry(0.26, 0.46, 0.34).translate(barX - 0.38, 0.11 + 0.23, barZ + 0.34)));
  geos.push(toStandard(new THREE.BoxGeometry(0.32, 0.035, 0.38).translate(barX - 0.38, 0.11 + 0.47, barZ + 0.34)));
  geos.push(toStandard(new THREE.BoxGeometry(1.6, 0.95, 0.05).translate(barX + 0.15, 0.11 + 0.55, barZ - 0.72)));
  geos.push(toStandard(new THREE.BoxGeometry(1.55, 0.035, 0.26).translate(barX + 0.15, 0.11 + 0.28, barZ - 0.58)));
  geos.push(toStandard(new THREE.BoxGeometry(1.55, 0.035, 0.22).translate(barX + 0.15, 0.11 + 0.65, barZ - 0.60)));

  const t1X = 0.65; const t1Z = 0.55;
  geos.push(toStandard(new THREE.BoxGeometry(1.05, 0.04, 0.52).translate(t1X, 0.11 + 0.34, t1Z)));
  for (const lx of [-0.44, 0.44]) {
    for (const lz of [-0.20, 0.20]) {
      geos.push(toStandard(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 4).translate(t1X + lx, 0.11 + 0.17, t1Z + lz)));
    }
  }
  geos.push(toStandard(new THREE.BoxGeometry(1.0, 0.035, 0.18).translate(t1X, 0.11 + 0.18, t1Z - 0.38)));
  geos.push(toStandard(new THREE.BoxGeometry(1.0, 0.035, 0.18).translate(t1X, 0.11 + 0.18, t1Z + 0.38)));

  const t2X = -0.95; const t2Z = 0.60;
  geos.push(toStandard(new THREE.BoxGeometry(0.65, 0.04, 0.65).translate(t2X, 0.11 + 0.34, t2Z)));
  for (const lx of [-0.25, 0.25]) {
    for (const lz of [-0.25, 0.25]) {
      geos.push(toStandard(new THREE.CylinderGeometry(0.028, 0.028, 0.34, 4).translate(t2X + lx, 0.11 + 0.17, t2Z + lz)));
    }
  }
  for (const sx of [-0.38, 0.38]) {
    for (const sz of [-0.38, 0.38]) {
      const stool = new THREE.CylinderGeometry(0.09, 0.10, 0.16, 6).translate(t2X + sx, 0.11 + 0.16, t2Z + sz);
      geos.push(toStandard(stool));
    }
  }

  const logRackX = 1.45; const logRackZ = 0.25;
  for (let l = 0; l < 3; l++) {
    const log = new THREE.CylinderGeometry(0.045, 0.045, 0.42, 6);
    log.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(logRackX, 0.11 + 0.05 + l * 0.07, logRackZ));
    geos.push(toStandard(log));
  }

  return mergeGeometries(geos) || geos[0];
})();

const tavernInteriorKegsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const barX = -0.95; const barZ = -0.55;

  for (const bx of [-0.40, 0.15, 0.65]) {
    const keg = new THREE.CylinderGeometry(0.13, 0.11, 0.28, 8);
    keg.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(barX + bx, 0.11 + 0.44, barZ - 0.58));
    geos.push(toStandard(keg));
  }

  return mergeGeometries(geos) || geos[0];
})();

const tavernInteriorSpigotsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const barX = -0.95; const barZ = -0.55;

  for (const bx of [-0.40, 0.15, 0.65]) {
    const spigot = new THREE.CylinderGeometry(0.015, 0.015, 0.07, 4);
    spigot.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(barX + bx, 0.11 + 0.40, barZ - 0.42));
    geos.push(toStandard(spigot));
  }

  const coinBox = new THREE.BoxGeometry(0.12, 0.06, 0.09).translate(barX + 0.6, 0.11 + 0.50, barZ + 0.12);
  geos.push(toStandard(coinBox));

  return mergeGeometries(geos) || geos[0];
})();

const tavernInteriorMugsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const barX = -0.95; const barZ = -0.55;
  for (const mx of [-0.15, 0.05, 0.35]) {
    const mug = new THREE.CylinderGeometry(0.03, 0.032, 0.07, 6).translate(barX + mx, 0.11 + 0.51, barZ + 0.12);
    geos.push(toStandard(mug));
  }

  const t1X = 0.65; const t1Z = 0.55;
  for (const [mx, mz] of [[-0.25, -0.1], [0.3, 0.1], [-0.1, 0.15]]) {
    const mug = new THREE.CylinderGeometry(0.03, 0.032, 0.07, 6).translate(t1X + mx, 0.11 + 0.38, t1Z + mz);
    geos.push(toStandard(mug));
  }

  const t2X = -0.95; const t2Z = 0.60;
  const mug2 = new THREE.CylinderGeometry(0.03, 0.032, 0.07, 6).translate(t2X - 0.12, 0.11 + 0.38, t2Z + 0.1);
  geos.push(toStandard(mug2));

  for (const bx of [-0.25, 0.45]) {
    const pot = new THREE.CylinderGeometry(0.035, 0.045, 0.14, 6).translate(barX + bx, 0.11 + 0.74, barZ - 0.60);
    geos.push(toStandard(pot));
  }

  return mergeGeometries(geos) || geos[0];
})();

const tavernInteriorFoodGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const t1X = 0.65; const t1Z = 0.55;
  const plate = new THREE.CylinderGeometry(0.09, 0.07, 0.015, 8).translate(t1X + 0.05, 0.11 + 0.36, t1Z - 0.05);
  const meat = new THREE.SphereGeometry(0.045, 6, 5).translate(t1X + 0.05, 0.11 + 0.39, t1Z - 0.05);
  const bread = new THREE.DodecahedronGeometry(0.04, 0).translate(t1X - 0.32, 0.11 + 0.38, t1Z + 0.08);
  geos.push(toStandard(plate), toStandard(meat), toStandard(bread));

  const t2X = -0.95; const t2Z = 0.60;
  const bread2 = new THREE.DodecahedronGeometry(0.04, 0).translate(t2X + 0.12, 0.11 + 0.38, t2Z - 0.08);
  geos.push(toStandard(bread2));

  return mergeGeometries(geos) || geos[0];
})();

const tavernInteriorPeltGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const hx = 1.05; const hz = -0.45;

  const pelt = new THREE.BoxGeometry(0.65, 0.015, 0.55).translate(hx, 0.11 + 0.01, hz);
  geos.push(toStandard(pelt));

  return mergeGeometries(geos) || geos[0];
})();

const tavernInteriorCandlesGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const t1X = 0.65; const t1Z = 0.55;
  const candle1 = new THREE.DodecahedronGeometry(0.02, 0).translate(t1X, 0.11 + 0.40, t1Z + 0.15);
  const t2X = -0.95; const t2Z = 0.60;
  const candle2 = new THREE.DodecahedronGeometry(0.02, 0).translate(t2X, 0.11 + 0.40, t2Z);
  const barX = -0.95; const barZ = -0.55;
  const candle3 = new THREE.DodecahedronGeometry(0.02, 0).translate(barX + 0.45, 0.11 + 0.52, barZ + 0.12);
  geos.push(toStandard(candle1), toStandard(candle2), toStandard(candle3));

  return mergeGeometries(geos) || geos[0];
})();

export function TavernModel({
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
      <mesh geometry={tavernBaseGeometry} material={mats.stoneDark} receiveShadow />
      <mesh geometry={tavernFloorGeometry} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={tavernWallsGeometry} material={mats.timberPlanks} castShadow receiveShadow />
      <mesh geometry={tavernBeamsGeometry} material={mats.timberDark} />
      <MedievalDoor position={[0, 0.12, 1.36]} width={0.84} height={1.12} />
      <MedievalWindow position={[-1.15, 0.75, 1.38]} width={0.52} height={0.52} isLightOn={isLightOn} hasFlowerBox={true} />
      <MedievalWindow position={[1.15, 0.75, 1.38]} width={0.52} height={0.52} isLightOn={isLightOn} hasFlowerBox={true} />
      <MedievalWindow position={[-1.87, 0.75, 0]} rotation={[0, -Math.PI / 2, 0]} width={0.52} height={0.52} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[1.87, 0.75, 0.5]} rotation={[0, Math.PI / 2, 0]} width={0.52} height={0.52} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[-0.85, 0.75, -1.38]} rotation={[0, Math.PI, 0]} width={0.52} height={0.52} isLightOn={isLightOn} hasFlowerBox={false} />
      <MedievalWindow position={[0.85, 0.75, -1.38]} rotation={[0, Math.PI, 0]} width={0.52} height={0.52} isLightOn={isLightOn} hasFlowerBox={false} />

      <mesh material={mats.goldTrim} position={[0.55, 1.25 - 0.15, 1.44 + 0.018]}>
        <cylinderGeometry args={[0.035, 0.04, 0.08, 8]} />
      </mesh>

      <group ref={interiorRef} visible={false}>
        <mesh geometry={tavernInteriorHearthGeo} material={mats.stoneMed} receiveShadow />
        <IndoorFireplaceFire position={[1.43, 0.11, -0.45]} scale={0.78} isLit={isWorking || isLightOn} />
        <mesh geometry={tavernInteriorFurnitureGeo} material={mats.timberDark} receiveShadow />
        <mesh geometry={tavernInteriorKegsGeo} material={mats.barrelWood || mats.timberLogs} receiveShadow />
        <mesh geometry={tavernInteriorSpigotsGeo} material={mats.goldTrim} />
        <mesh geometry={tavernInteriorMugsGeo} material={mats.ceramicPot} receiveShadow />
        <mesh geometry={tavernInteriorFoodGeo} material={mats.meatRed} receiveShadow />
        <mesh geometry={tavernInteriorPeltGeo} material={mats.hideTan} receiveShadow />
        <mesh geometry={tavernInteriorCandlesGeo} material={mats.candleGlow} />
      </group>

      <group ref={roofRef}>
        <mesh geometry={tavernRoofGeometry} material={mats.shingleRoof} castShadow receiveShadow />
        <mesh geometry={tavernRoofTrimGeometry} material={mats.timberDark} />
        <mesh geometry={tavernChimneyGeometry} material={mats.stoneMed} receiveShadow />
        <mesh geometry={tavernRoofSootGeometry} material={mats.charcoalBlack} />
        {isWorking && <ChimneySmoke position={[1.50, 2.16 + 1.55, -0.45]} />}
      </group>
    </group>
  );
}
