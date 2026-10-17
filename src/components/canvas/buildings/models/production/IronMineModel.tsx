import { DEFAULT_CAMERA_ZOOM } from '../../../../../constants/camera';
import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { isObjectEffectivelyVisible } from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const ironMineStoneGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const px of [-1.85, 1.85]) {
    for (const pz of [-1.35, 1.35]) {
      const g = new THREE.BoxGeometry(0.55, 0.48, 0.55);
      g.translate(px, 0.24, pz);
      geos.push(toStandard(g));
    }
  }
  for (const pz of [-1.0, 1.0]) {
    const g = new THREE.BoxGeometry(0.35, 1.20, 0.35);
    g.translate(-1.35 - 0.45, 0.60, pz);
    geos.push(toStandard(g));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const ironMineTimberLogsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const r1 = new THREE.BoxGeometry(0.24, 0.24, 2.9); r1.translate(-1.85, 0.48, 0); geos.push(toStandard(r1));
  const r2 = new THREE.BoxGeometry(0.24, 0.24, 2.9); r2.translate(1.85, 0.48, 0); geos.push(toStandard(r2));
  const r3 = new THREE.BoxGeometry(3.8, 0.24, 0.24); r3.translate(0, 0.48, -1.35); geos.push(toStandard(r3));
  const r4 = new THREE.BoxGeometry(3.8, 0.24, 0.24); r4.translate(0, 0.48, 1.35); geos.push(toStandard(r4));

  const legAngles: [number, number, number, number][] = [
    [-1.0, -0.6, 0.12, -0.12],
    [1.0, -0.6, 0.12, 0.12],
    [-1.0, 0.6, -0.12, -0.12],
    [1.0, 0.6, -0.12, 0.12],
  ];
  for (const [x, z, rx, rz] of legAngles) {
    const g = new THREE.BoxGeometry(0.22, 3.4, 0.22);
    const m = new THREE.Matrix4()
      .makeRotationFromEuler(new THREE.Euler(rx, 0, rz))
      .setPosition(x, 2.05, z);
    g.applyMatrix4(m);
    geos.push(toStandard(g));
  }

  for (const pz of [-0.40, 0.40]) {
    const g = new THREE.CylinderGeometry(0.06, 0.06, 0.85, 5);
    g.translate(1.35 - 0.15, 0.48 + 0.35, 0.15 + pz);
    geos.push(toStandard(g));
  }

  const ladderM = new THREE.Matrix4()
    .makeRotationZ(-0.35)
    .setPosition(-1.35 + 0.45, 0.62, 0.85);
  for (const lx of [-0.14, 0.14]) {
    const g = new THREE.BoxGeometry(0.04, 1.45, 0.04);
    g.translate(lx, 0, 0);
    g.applyMatrix4(ladderM);
    geos.push(toStandard(g));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const ironMineTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const top = new THREE.BoxGeometry(2.1, 0.26, 0.26); top.translate(0, 3.65, 0); geos.push(toStandard(top));

  const cb1 = new THREE.BoxGeometry(1.9, 0.16, 0.16); cb1.translate(0, 2.35, -0.52); geos.push(toStandard(cb1));
  const cb2 = new THREE.BoxGeometry(1.9, 0.16, 0.16); cb2.translate(0, 2.35, 0.52); geos.push(toStandard(cb2));
  const cb3 = new THREE.BoxGeometry(0.16, 0.16, 1.25); cb3.translate(-0.85, 2.35, 0); geos.push(toStandard(cb3));
  const cb4 = new THREE.BoxGeometry(0.16, 0.16, 1.25); cb4.translate(0.85, 2.35, 0); geos.push(toStandard(cb4));

  const d1 = new THREE.BoxGeometry(2.2, 0.10, 0.10);
  d1.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.52).setPosition(0, 2.35, -0.52));
  geos.push(toStandard(d1));

  const d2 = new THREE.BoxGeometry(2.2, 0.10, 0.10);
  d2.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.52).setPosition(0, 2.35, -0.52));
  geos.push(toStandard(d2));

  for (const sz of [-0.43, 0.43]) {
    const g = new THREE.BoxGeometry(1.25, 0.20, 0.04);
    const m = new THREE.Matrix4()
      .makeRotationZ(0.45)
      .setPosition(1.35 - 0.50, 0.48 + 0.78, 0.15 + sz);
    g.applyMatrix4(m);
    geos.push(toStandard(g));
  }

  const cartM = new THREE.Matrix4()
    .makeRotationY(-0.4)
    .setPosition(1.35 + 0.30, 0.48 + 0.02, 0.15 + 0.65);

  const wheel = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 8);
  wheel.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, 0.12, 0.48).premultiply(cartM));
  geos.push(toStandard(wheel));

  for (const hx of [-0.20, 0.20]) {
    const handle = new THREE.CylinderGeometry(0.018, 0.018, 0.65, 5);
    handle.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.2).setPosition(hx, 0.22, -0.48).premultiply(cartM));
    geos.push(toStandard(handle));
  }

  const bench = new THREE.BoxGeometry(0.60, 0.52, 1.05);
  bench.translate(-1.35, 1.62, -0.40);
  geos.push(toStandard(bench));

  return mergeGeometries(geos) || geos[0];
})();

export const ironMineTimberPlanksGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const chute = new THREE.BoxGeometry(1.25, 0.05, 0.90);
  chute.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.45).setPosition(1.35 - 0.50, 0.48 + 0.70, 0.15));
  geos.push(toStandard(chute));

  const cartM = new THREE.Matrix4()
    .makeRotationY(-0.4)
    .setPosition(1.35 + 0.30, 0.48 + 0.02, 0.15 + 0.65);
  const cart = new THREE.BoxGeometry(0.48, 0.24, 0.75);
  cart.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.18, 0).premultiply(cartM));
  geos.push(toStandard(cart));

  const deck = new THREE.BoxGeometry(1.35, 0.08, 2.5);
  deck.translate(-1.35, 1.25, 0);
  geos.push(toStandard(deck));

  const ladderM = new THREE.Matrix4()
    .makeRotationZ(-0.35)
    .setPosition(-1.35 + 0.45, 0.62, 0.85);
  for (const ry of [-0.5, -0.25, 0, 0.25, 0.5]) {
    const rung = new THREE.CylinderGeometry(0.018, 0.018, 0.28, 4);
    rung.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, ry, 0).premultiply(ladderM));
    geos.push(toStandard(rung));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const ironMineIronHardwareGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const bx of [-0.85, 0.85]) {
    const g = new THREE.BoxGeometry(0.30, 0.30, 0.30);
    g.translate(bx, 3.65, 0);
    geos.push(toStandard(g));
  }
  const anvil = new THREE.BoxGeometry(0.24, 0.16, 0.38);
  anvil.translate(-1.35, 1.94, -0.50);
  geos.push(toStandard(anvil));

  const hammerM = new THREE.Matrix4().makeRotationY(0.3).setPosition(-1.35 + 0.05, 1.92, -0.08);
  const hHead = new THREE.BoxGeometry(0.11, 0.10, 0.10);
  hHead.applyMatrix4(new THREE.Matrix4().setPosition(0.22, 0.02, 0).premultiply(hammerM));
  geos.push(toStandard(hHead));

  const lantern = new THREE.CylinderGeometry(0.04, 0.06, 0.14, 6);
  lantern.translate(-1.35 + 0.25, 2.55, 0.55);
  geos.push(toStandard(lantern));

  return mergeGeometries(geos) || geos[0];
})();

export const ironMineTimberLightGeo = (() => {
  const hammerM = new THREE.Matrix4().makeRotationY(0.3).setPosition(-1.35 + 0.05, 1.92, -0.08);
  const hHandle = new THREE.CylinderGeometry(0.018, 0.018, 0.52, 5);
  hHandle.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, 0.02, 0).premultiply(hammerM));
  return toStandard(hHandle);
})();

export const ironMineOreGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const o1 = new THREE.DodecahedronGeometry(0.42, 0);
  o1.translate(1.35 + 0.30, 0.48 + 0.24, 0.15 - 0.40);
  geos.push(toStandard(o1));

  const o2 = new THREE.DodecahedronGeometry(0.28, 0);
  o2.translate(1.35 + 0.58, 0.48 + 0.15, 0.15 - 0.15);
  geos.push(toStandard(o2));

  const o3 = new THREE.DodecahedronGeometry(0.26, 0);
  o3.translate(1.35 + 0.20, 0.48 + 0.15, 0.15 + 0.30);
  geos.push(toStandard(o3));

  const cartM = new THREE.Matrix4()
    .makeRotationY(-0.4)
    .setPosition(1.35 + 0.30, 0.48 + 0.02, 0.15 + 0.65);
  const cartOre = new THREE.DodecahedronGeometry(0.20, 0);
  cartOre.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.30, 0).premultiply(cartM));
  geos.push(toStandard(cartOre));

  return mergeGeometries(geos) || geos[0];
})();

export const ironMineRoofWoodGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const p1 = new THREE.BoxGeometry(0.16, 1.85, 0.16); p1.translate(-1.85, 2.15, -1.15); geos.push(toStandard(p1));
  const p2 = new THREE.BoxGeometry(0.16, 1.85, 0.16); p2.translate(-1.85, 2.15, 1.15); geos.push(toStandard(p2));
  const p3 = new THREE.BoxGeometry(0.16, 2.05, 0.16); p3.translate(-0.85, 2.25, 1.15); geos.push(toStandard(p3));
  return mergeGeometries(geos) || geos[0];
})();

export const ironMineRoofPlanksGeo = (() => {
  const roof = new THREE.BoxGeometry(1.65, 0.09, 2.65);
  roof.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.12, 0, -0.15)).setPosition(-1.40, 3.10, 0));
  return toStandard(roof);
})();

export const bucketIronGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const ring = new THREE.TorusGeometry(0.09, 0.02, 6, 12); ring.translate(0, 0.38, 0); geos.push(toStandard(ring));

  const s1 = new THREE.CylinderGeometry(0.02, 0.02, 0.40, 5);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.22).setPosition(-0.28, 0.22, 0));
  geos.push(toStandard(s1));

  const s2 = new THREE.CylinderGeometry(0.02, 0.02, 0.40, 5);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.22).setPosition(0.28, 0.22, 0));
  geos.push(toStandard(s2));

  const b1 = new THREE.CylinderGeometry(0.305, 0.305, 0.05, 8); b1.translate(0, 0.16, 0); geos.push(toStandard(b1));
  const b2 = new THREE.CylinderGeometry(0.255, 0.255, 0.05, 8); b2.translate(0, -0.13, 0); geos.push(toStandard(b2));

  return mergeGeometries(geos) || geos[0];
})();

export const bucketWoodGeo = (() => {
  return toStandard(new THREE.CylinderGeometry(0.30, 0.24, 0.50, 8));
})();

export const sheaveWheelGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const axle = new THREE.CylinderGeometry(0.045, 0.045, 0.60, 8).rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(0.42, 0.42, 0.07, 14).rotateZ(Math.PI / 2);
  const wood = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 14).rotateZ(Math.PI / 2);
  geos.push(toStandard(axle), toStandard(rim), toStandard(wood));

  for (const ang of [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]) {
    const spoke = new THREE.BoxGeometry(0.04, 0.78, 0.03).rotateX(ang);
    geos.push(toStandard(spoke));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const windlassMechanismGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const drum = new THREE.CylinderGeometry(0.11, 0.11, 1.7, 8).rotateZ(Math.PI / 2);
  const ropeWrap = new THREE.CylinderGeometry(0.13, 0.13, 0.75, 8).rotateZ(Math.PI / 2);
  const axle = new THREE.CylinderGeometry(0.025, 0.025, 0.20, 6).rotateZ(Math.PI / 2).translate(0.92, 0, 0);
  const crank = new THREE.BoxGeometry(0.038, 0.38, 0.038).translate(1.02, -0.18, 0);
  const handle = new THREE.CylinderGeometry(0.026, 0.026, 0.22, 6).rotateX(Math.PI / 2).translate(1.02, -0.36, 0.12);
  geos.push(toStandard(drum), toStandard(ropeWrap), toStandard(axle), toStandard(crank), toStandard(handle));
  return mergeGeometries(geos) || geos[0];
})();

export const oreInBucketGeo = (() => {
  const o1 = new THREE.DodecahedronGeometry(0.20, 0).translate(0, 0.06, 0);
  const o2 = new THREE.DodecahedronGeometry(0.14, 0).translate(0.11, 0.08, 0.09);
  const o3 = new THREE.DodecahedronGeometry(0.13, 0).translate(-0.10, 0.07, -0.08);
  return mergeGeometries([toStandard(o1), toStandard(o2), toStandard(o3)]) || toStandard(o1);
})();

export function IronMineModel({
  isLightOn = false,
  isWorking = true,
  roofRef,
}: {
  isLightOn?: boolean;
  isWorking?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
}) {
  const mats = SHARED_BUILDING_MATS;

  const rootGroupRef = useRef<THREE.Group>(null);
  const bucketRef = useRef<THREE.Group>(null);
  const ropeRef = useRef<THREE.Mesh>(null);
  const sheaveRef = useRef<THREE.Group>(null);
  const windlassRef = useRef<THREE.Group>(null);
  const oreInBucketRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!rootGroupRef.current || !isObjectEffectivelyVisible(rootGroupRef.current)) return;
    if (!bucketRef.current || !isWorking) return;
    const currentZoom = (window as any).__lastCameraZoom ?? DEFAULT_CAMERA_ZOOM;
    if (currentZoom <= 18.5) return;
    const t = clock.getElapsedTime();
    const period = 7.5;
    const progress = (t % period) / period;

    const topY = 1.55;
    const bottomY = 0.22;
    const headframeSheaveY = 3.65;

    let currentBucketY = topY;
    let wheelSpeed = 0;
    let oreScale = 1.0;

    if (progress < 0.35) {
      const p = progress / 0.35;
      const ease = p * p * (3 - 2 * p);
      currentBucketY = topY - ease * (topY - bottomY);
      wheelSpeed = 5.2;
      oreScale = Math.max(0, 1.0 - p * 3.5);
    } else if (progress < 0.50) {
      const p = (progress - 0.35) / 0.15;
      currentBucketY = bottomY + Math.sin(t * 24) * 0.012;
      wheelSpeed = 0.1;
      oreScale = Math.min(1.0, p * 2.2);
    } else if (progress < 0.85) {
      const p = (progress - 0.50) / 0.35;
      const ease = p * p * (3 - 2 * p);
      currentBucketY = bottomY + ease * (topY - bottomY);
      wheelSpeed = -5.2;
      oreScale = 1.0;
    } else {
      currentBucketY = topY;
      wheelSpeed = 0;
      oreScale = 1.0;
    }

    if (bucketRef.current) {
      bucketRef.current.position.y = currentBucketY;
    }

    if (oreInBucketRef.current) {
      oreInBucketRef.current.scale.set(oreScale, oreScale, oreScale);
    }

    if (ropeRef.current) {
      const ropeLength = Math.max(0.1, headframeSheaveY - (currentBucketY + 0.36));
      ropeRef.current.position.y = headframeSheaveY - ropeLength / 2;
      ropeRef.current.scale.y = ropeLength;
    }

    if (sheaveRef.current) {
      sheaveRef.current.rotation.x += wheelSpeed * 0.025;
    }

    if (windlassRef.current) {
      windlassRef.current.rotation.x += wheelSpeed * 0.025;
    }
  });

  return (
    <group ref={rootGroupRef}>
      <mesh geometry={ironMineStoneGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={ironMineTimberLogsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={ironMineTimberDarkGeo} material={mats.timberDark} castShadow receiveShadow />
      <mesh geometry={ironMineTimberPlanksGeo} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={ironMineIronHardwareGeo} material={mats.ironHardware} />
      <mesh geometry={ironMineTimberLightGeo} material={mats.timberLight} />
      <mesh geometry={ironMineOreGeo} material={mats.ironOre} castShadow />

      <group ref={sheaveRef} position={[0, 3.65, 0]}>
        <mesh geometry={sheaveWheelGeo} material={mats.ironHardware} />
      </group>

      <group ref={windlassRef} position={[0, 1.85, 0.52]}>
        <mesh geometry={windlassMechanismGeo} material={mats.timberLogs} />
      </group>

      <mesh ref={ropeRef} material={mats.richSoil} position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 5]} />
      </mesh>

      <group ref={bucketRef} position={[0, 1.55, 0]}>
        <mesh geometry={bucketIronGeo} material={mats.ironSteel} />
        <mesh geometry={bucketWoodGeo} material={mats.timberDark} receiveShadow />
        <group ref={oreInBucketRef} position={[0, 0.22, 0]}>
          <mesh geometry={oreInBucketGeo} material={mats.ironOre} />
        </group>
      </group>

      <mesh material={isLightOn ? mats.windowLit : mats.candleGlow} position={[-1.35 + 0.25, 2.53, 0.55]}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>

      <group ref={roofRef}>
        <mesh geometry={ironMineRoofWoodGeo} material={mats.timberLogs} />
        <mesh geometry={ironMineRoofPlanksGeo} material={mats.timberPlanks} receiveShadow />
      </group>
    </group>
  );
}
