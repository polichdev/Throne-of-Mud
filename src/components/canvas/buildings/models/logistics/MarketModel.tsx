import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { TimberBarrel } from '../../common/BuildingPrimitives';

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

export const marketBaseGeometry = (() => {
  return toStandard(new THREE.BoxGeometry(3.96, 0.1, 1.96).translate(0, 0.05, 0));
})();

export const marketStructureGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  geos.push(toStandard(new THREE.BoxGeometry(3.96, 0.08, 0.08).translate(0, 0.15, 0.94)));
  geos.push(toStandard(new THREE.BoxGeometry(3.96, 0.08, 0.08).translate(0, 0.15, -0.94)));
  geos.push(toStandard(new THREE.BoxGeometry(0.08, 0.08, 1.96).translate(-1.94, 0.15, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.08, 0.08, 1.96).translate(1.94, 0.15, 0)));

  for (const cx of [-1.6, 0, 1.6]) {
    for (const cz of [-0.75, 0.75]) {
      const post = new THREE.CylinderGeometry(0.06, 0.08, 1.45, 6).translate(cx, 0.82, cz);
      const strut = new THREE.BoxGeometry(0.06, 0.35, 0.06);
      strut.applyMatrix4(new THREE.Matrix4().makeRotationX(0.4).setPosition(cx, 0.82 + 0.58, cz));
      geos.push(toStandard(post), toStandard(strut));
    }
  }

  for (const lx of [-0.52, 0.52]) {
    for (const lz of [-0.18, 0.18]) {
      const leg = new THREE.CylinderGeometry(0.03, 0.035, 0.28, 6).translate(-0.9 + lx, 0.16 + 0.14, lz);
      geos.push(toStandard(leg));
    }
  }

  for (const lx of [-0.52, 0.52]) {
    for (const lz of [-0.18, 0.18]) {
      const leg = new THREE.CylinderGeometry(0.03, 0.035, 0.28, 6).translate(0.9 + lx, 0.16 + 0.14, lz);
      geos.push(toStandard(leg));
    }
  }

  geos.push(toStandard(new THREE.BoxGeometry(3.95, 0.1, 0.1).translate(0, 1.62, 0)));

  return mergeGeometries(geos) || geos[0];
})();

export const marketPlanksGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(3.92, 0.06, 1.92).translate(0, 0.13, 0)));

  geos.push(toStandard(new THREE.BoxGeometry(1.06, 0.02, 0.36).translate(-0.9, 0.16 + 0.06, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(1.18, 0.04, 0.46).translate(-0.9, 0.16 + 0.28, 0)));

  geos.push(toStandard(new THREE.BoxGeometry(1.06, 0.02, 0.36).translate(0.9, 0.16 + 0.06, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(1.18, 0.04, 0.46).translate(0.9, 0.16 + 0.28, 0)));

  return mergeGeometries(geos) || geos[0];
})();

export const marketRoofGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const s1 = new THREE.BoxGeometry(3.96, 1.15, 0.1);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.55).setPosition(0, 1.45, 0.5));

  const s2 = new THREE.BoxGeometry(3.96, 1.15, 0.1);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.55).setPosition(0, 1.45, -0.5));

  const ridge = new THREE.BoxGeometry(3.98, 0.12, 0.15).translate(0, 1.76, 0);

  geos.push(toStandard(s1), toStandard(s2), toStandard(ridge));
  return mergeGeometries(geos) || geos[0];
})();

export const marketAwningsGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.56, 0.18, 0.02).translate(-0.9, 0.16 + 0.18, 0.23)));
  geos.push(toStandard(new THREE.BoxGeometry(0.56, 0.18, 0.02).translate(0.9, 0.16 + 0.18, 0.23)));

  return mergeGeometries(geos) || geos[0];
})();

export const marketGoodsBreadGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const tX = -0.9;
  const tY = 0.46;
  const tZ = 0;

  for (const bx of [-0.35, -0.15]) {
    const loaf = new THREE.CylinderGeometry(0.07, 0.08, 0.05, 8).translate(tX + bx, tY + 0.025, tZ - 0.08);
    geos.push(toStandard(loaf));
  }
  for (const bz of [-0.05, 0.08]) {
    const roundLoaf = new THREE.SphereGeometry(0.065, 7, 6).translate(tX + 0.1, tY + 0.05, tZ + bz);
    geos.push(toStandard(roundLoaf));
  }
  const baguette = new THREE.CylinderGeometry(0.025, 0.025, 0.28, 6);
  baguette.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.2).setPosition(tX - 0.32, tY + 0.03, tZ + 0.08));
  geos.push(toStandard(baguette));

  for (const cx of [0.28, 0.38]) {
    const bun = new THREE.DodecahedronGeometry(0.035, 0).translate(tX + cx, tY + 0.03, tZ - 0.05);
    geos.push(toStandard(bun));
  }

  const cheese = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10).translate(tX + 0.32, tY + 0.03, tZ + 0.08);
  geos.push(toStandard(cheese));

  return mergeGeometries(geos) || geos[0];
})();

export const marketGoodsProduceRedGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const tX = -0.9;
  const tY = 0.46;
  for (const [ox, oz] of [[-0.08, -0.06], [-0.03, -0.09], [-0.04, -0.03], [0.01, -0.06], [-0.06, -0.06]]) {
    const apple = new THREE.DodecahedronGeometry(0.028, 0).translate(tX + ox, tY + 0.04, oz);
    geos.push(toStandard(apple));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const marketGoodsProduceGreenGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const tX = -0.9;
  const tY = 0.46;
  for (const [ox, oz] of [[-0.08, 0.08], [-0.02, 0.1], [-0.05, 0.05]]) {
    const cabbage = new THREE.DodecahedronGeometry(0.04, 0).translate(tX + ox, tY + 0.04, oz);
    geos.push(toStandard(cabbage));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const marketGoodsFishGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const tX = 0.9;
  const tY = 0.46;
  const tZ = 0;

  for (const [fx, fz, rot] of [[-0.3, -0.05, 0.4], [-0.26, 0.08, -0.3], [-0.34, 0.04, 0.1]]) {
    const fishBody = new THREE.ConeGeometry(0.035, 0.22, 5);
    fishBody.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).makeRotationY(rot).setPosition(tX + fx, tY + 0.025, tZ + fz));
    geos.push(toStandard(fishBody));
  }

  const scalesPole = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 5).translate(tX + 0.35, tY + 0.11, tZ - 0.05);
  const scalesBar = new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4);
  scalesBar.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(tX + 0.35, tY + 0.21, tZ - 0.05));
  const pan1 = new THREE.CylinderGeometry(0.04, 0.01, 0.02, 6).translate(tX + 0.27, tY + 0.14, tZ - 0.05);
  const pan2 = new THREE.CylinderGeometry(0.04, 0.01, 0.02, 6).translate(tX + 0.43, tY + 0.12, tZ - 0.05);
  geos.push(toStandard(scalesPole), toStandard(scalesBar), toStandard(pan1), toStandard(pan2));

  for (let c = 0; c < 4; c++) {
    const coin = new THREE.CylinderGeometry(0.02, 0.02, 0.008, 6).translate(tX + 0.18, tY + 0.004 * c + 0.008, tZ - 0.06);
    geos.push(toStandard(coin));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const marketGoodsSacksGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const s1 = new THREE.CylinderGeometry(0.12, 0.15, 0.28, 7).translate(-1.42, 0.14 + 0.14, -0.45);
  const s2 = new THREE.CylinderGeometry(0.11, 0.14, 0.26, 7).translate(-1.25, 0.14 + 0.13, -0.52);
  const s3 = new THREE.CylinderGeometry(0.12, 0.15, 0.28, 7).translate(1.42, 0.14 + 0.14, -0.45);
  const s4 = new THREE.CylinderGeometry(0.10, 0.13, 0.24, 7).translate(-0.9, 0.14 + 0.12, 0.38);
  geos.push(toStandard(s1), toStandard(s2), toStandard(s3), toStandard(s4));

  return mergeGeometries(geos) || geos[0];
})();

export const marketGoodsPotsFabricGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const tX = 0.9;
  const tY = 0.46;
  const tZ = 0;

  const pot1 = new THREE.CylinderGeometry(0.05, 0.04, 0.14, 8).translate(tX + 0.02, tY + 0.07, tZ + 0.08);
  const pot2 = new THREE.SphereGeometry(0.055, 6, 6).translate(tX - 0.08, tY + 0.06, tZ - 0.08);
  geos.push(toStandard(pot1), toStandard(pot2));

  const roll1 = new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6);
  roll1.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(tX + 0.05, tY + 0.035, tZ - 0.06));
  const roll2 = new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6);
  roll2.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(tX + 0.05, tY + 0.09, tZ - 0.06));
  geos.push(toStandard(roll1), toStandard(roll2));

  return mergeGeometries(geos) || geos[0];
})();

export const marketCratesDetailGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const c1 = new THREE.BoxGeometry(0.26, 0.10, 0.26).translate(-0.95, 0.46 + 0.05, -0.06);
  const c2 = new THREE.BoxGeometry(0.26, 0.10, 0.26).translate(-0.95, 0.46 + 0.05, 0.08);
  const c3 = new THREE.BoxGeometry(0.38, 0.24, 0.32).translate(-1.42, 0.14 + 0.12, 0.35);
  const c4 = new THREE.BoxGeometry(0.36, 0.22, 0.30).translate(1.42, 0.14 + 0.11, 0.35);
  geos.push(toStandard(c1), toStandard(c2), toStandard(c3), toStandard(c4));

  return mergeGeometries(geos) || geos[0];
})();

export function MarketModel({
  roofRef,
}: {
  roofRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <mesh geometry={marketBaseGeometry} material={mats.stoneDark} receiveShadow />
      <mesh geometry={marketStructureGeometry} material={mats.timberDark} />
      <mesh geometry={marketPlanksGeometry} material={mats.floorPlanks} receiveShadow />
      <mesh geometry={marketAwningsGeometry} material={mats.redBanner} />

      <mesh geometry={marketCratesDetailGeo} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={marketGoodsBreadGeo} material={mats.breadCrust} receiveShadow />
      <mesh geometry={marketGoodsProduceRedGeo} material={mats.flowerRed} />
      <mesh geometry={marketGoodsProduceGreenGeo} material={mats.leafGreen} />
      <mesh geometry={marketGoodsFishGeo} material={mats.fishSilver} />
      <mesh geometry={marketGoodsSacksGeo} material={mats.flourSack} receiveShadow />
      <mesh geometry={marketGoodsPotsFabricGeo} material={mats.ceramicPot} receiveShadow />

      <TimberBarrel position={[1.45, 0.12, 0.05]} scale={0.55} />
      <TimberBarrel position={[-1.48, 0.12, -0.05]} scale={0.52} />

      <group ref={roofRef}>
        <mesh geometry={marketRoofGeometry} material={mats.thatchRoof} castShadow />
      </group>
    </group>
  );
}
