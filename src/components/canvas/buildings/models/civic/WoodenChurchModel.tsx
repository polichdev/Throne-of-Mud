import { DEFAULT_CAMERA_ZOOM } from '../../../../../constants/camera';
import { useRef, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { isObjectEffectivelyVisible } from '../../common/BuildingPrimitives';
import { characterEntities } from '../../../../../engine/ecs/world';

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

function createLancetWindow(pos: [number, number, number], rotY: number, width: number, height: number) {
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

function createButtress(pos: [number, number, number], rotY: number, height = 1.8) {
  const geos: THREE.BufferGeometry[] = [];
  const b1 = new THREE.BoxGeometry(0.26, height * 0.5, 0.36).translate(0, height * 0.25, 0);
  const b2 = new THREE.BoxGeometry(0.22, height * 0.44, 0.26).translate(0, height * 0.72, -0.04);
  const cap1 = new THREE.BoxGeometry(0.27, 0.12, 0.28);
  cap1.applyMatrix4(new THREE.Matrix4().makeRotationX(0.45).setPosition(0, height * 0.5 + 0.04, -0.02));
  const cap2 = new THREE.BoxGeometry(0.23, 0.1, 0.2);
  cap2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.45).setPosition(0, height * 0.94 + 0.04, -0.05));
  const cone = new THREE.ConeGeometry(0.12, 0.28, 4).translate(0, height + 0.12, -0.06);

  geos.push(b1, b2, cap1, cap2, cone);
  const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(pos[0], pos[1], pos[2]);
  return toStandard(mergeGeometries(geos) || b1).applyMatrix4(m);
}

function createStoneGableWall(posZ: number, rotY: number) {
  const baseWidth = 4.72;
  const height = 1.6;
  const thickness = 0.14;
  const half = baseWidth / 2;

  const s = new THREE.Shape();
  s.moveTo(-half, 0);
  s.lineTo(half, 0);
  s.lineTo(0, height);
  s.closePath();

  const g = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false });
  g.translate(0, 0, -thickness / 2);
  g.applyMatrix4(new THREE.Matrix4().makeRotationY(rotY).setPosition(0, 1.96, posZ));
  return toStandard(g);
}

export const churchStoneGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  geos.push(toStandard(new THREE.BoxGeometry(4.88, 0.12, 2.88).translate(0, 0.06, 0)));

  geos.push(toStandard(new THREE.BoxGeometry(4.72, 1.8, 0.14).translate(0, 1.04, -1.36)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 1.8, 2.72).translate(-2.36, 1.04, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 1.8, 2.72).translate(2.36, 1.04, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(1.86, 1.8, 0.14).translate(-1.43, 1.04, 1.36)));
  geos.push(toStandard(new THREE.BoxGeometry(1.86, 1.8, 0.14).translate(1.43, 1.04, 1.36)));
  geos.push(toStandard(new THREE.BoxGeometry(1.00, 0.45, 0.14).translate(0, 1.715, 1.36)));

  geos.push(createButtress([-2.36, 0.12, 1.44], 0));
  geos.push(createButtress([2.36, 0.12, 1.44], 0));
  geos.push(createButtress([-2.36, 0.12, -1.44], Math.PI));
  geos.push(createButtress([2.36, 0.12, -1.44], Math.PI));

  const w1 = createLancetWindow([-2.42, 1.15, -0.7], -Math.PI / 2, 0.48, 0.95);
  const w2 = createLancetWindow([-2.42, 1.15, 0.7], -Math.PI / 2, 0.48, 0.95);
  const w3 = createLancetWindow([2.42, 1.15, -0.7], Math.PI / 2, 0.48, 0.95);
  const w4 = createLancetWindow([2.42, 1.15, 0.7], Math.PI / 2, 0.48, 0.95);
  const w5 = createLancetWindow([0, 1.25, -1.42], Math.PI, 0.60, 1.1);
  geos.push(w1.frame, w2.frame, w3.frame, w4.frame, w5.frame);

  geos.push(toStandard(new THREE.BoxGeometry(4.88, 0.08, 0.20).translate(0, 1.96, -1.36)));
  geos.push(toStandard(new THREE.BoxGeometry(0.20, 0.08, 2.88).translate(-2.36, 1.96, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.20, 0.08, 2.88).translate(2.36, 1.96, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(4.88, 0.08, 0.20).translate(0, 1.96, 1.36)));

  const rose = new THREE.TorusGeometry(0.22, 0.035, 8, 16);
  rose.applyMatrix4(new THREE.Matrix4().setPosition(0, 1.66, 1.43));
  geos.push(toStandard(rose));

  return mergeGeometries(geos) || geos[0];
})();

export const churchGlassGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const roseGlass = toStandard(new THREE.CylinderGeometry(0.20, 0.20, 0.03, 12).rotateX(Math.PI / 2).translate(0, 1.66, 1.41));
  geos.push(roseGlass);

  const w1 = createLancetWindow([-2.42, 1.15, -0.7], -Math.PI / 2, 0.48, 0.95);
  const w2 = createLancetWindow([-2.42, 1.15, 0.7], -Math.PI / 2, 0.48, 0.95);
  const w3 = createLancetWindow([2.42, 1.15, -0.7], Math.PI / 2, 0.48, 0.95);
  const w4 = createLancetWindow([2.42, 1.15, 0.7], Math.PI / 2, 0.48, 0.95);
  const w5 = createLancetWindow([0, 1.25, -1.42], Math.PI, 0.60, 1.1);
  geos.push(w1.glass, w2.glass, w3.glass, w4.glass, w5.glass);

  return mergeGeometries(geos) || roseGlass;
})();

export const churchRoofGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const leftSlope = new THREE.BoxGeometry(2.92, 0.10, 3.02);
  leftSlope.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.595).setPosition(-1.18, 2.80, 0));

  const rightSlope = new THREE.BoxGeometry(2.92, 0.10, 3.02);
  rightSlope.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.595).setPosition(1.18, 2.80, 0));

  geos.push(toStandard(leftSlope), toStandard(rightSlope));

  geos.push(createStoneGableWall(1.36, 0));
  geos.push(createStoneGableWall(-1.36, Math.PI));

  geos.push(toStandard(new THREE.BoxGeometry(1.35, 1.6, 1.35).translate(0, 1.96 + 0.8, 0.6)));

  return mergeGeometries(geos) || geos[0];
})();

export const churchRoofTrimGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  geos.push(toStandard(new THREE.BoxGeometry(0.16, 0.16, 3.08).translate(0, 3.60, 0)));

  const eLeft = new THREE.BoxGeometry(0.14, 0.12, 3.06);
  eLeft.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.595).setPosition(-2.40, 1.97, 0));
  const eRight = new THREE.BoxGeometry(0.14, 0.12, 3.06);
  eRight.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.595).setPosition(2.40, 1.97, 0));
  geos.push(toStandard(eLeft), toStandard(eRight));

  for (const gz of [-1.36, 1.36]) {
    const post = new THREE.BoxGeometry(0.07, 0.38, 0.07).translate(0, 3.66 + 0.19, gz);
    const crossbar = new THREE.BoxGeometry(0.22, 0.05, 0.05).translate(0, 3.66 + 0.28, gz);
    geos.push(toStandard(post), toStandard(crossbar));
  }

  geos.push(toStandard(new THREE.BoxGeometry(1.46, 0.06, 1.46).translate(0, 1.96 + 1.63, 0.6)));
  geos.push(toStandard(new THREE.BoxGeometry(1.25, 0.06, 1.25).translate(0, 1.96 + 2.05 + 0.38, 0.6)));

  for (const px of [-0.55, 0.55]) {
    for (const pz of [-0.55, 0.55]) {
      const p = new THREE.BoxGeometry(0.10, 0.75, 0.10).translate(px, 1.96 + 2.05, 0.6 + pz);
      geos.push(toStandard(p));
    }
  }

  const spireCone = new THREE.ConeGeometry(1.0, 1.8, 8);
  spireCone.applyMatrix4(new THREE.Matrix4().setPosition(0, 1.96 + 3.25, 0.6));
  geos.push(toStandard(spireCone));

  return mergeGeometries(geos) || geos[0];
})();

export const churchBelfryBellGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  const bell = new THREE.CylinderGeometry(0.15, 0.24, 0.30, 10).translate(0, 1.96 + 2.05 + 0.04, 0.6);
  geos.push(toStandard(bell));

  const orb = new THREE.SphereGeometry(0.05, 8, 8).translate(0, 1.96 + 4.35 + 0.14, 0.6);
  geos.push(toStandard(orb));

  return mergeGeometries(geos) || geos[0];
})();

export const churchSpireCrossGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const cVert = new THREE.BoxGeometry(0.05, 0.65, 0.05).translate(0, 1.96 + 4.35, 0.6);
  const cHoriz = new THREE.BoxGeometry(0.38, 0.05, 0.05).translate(0, 1.96 + 4.35 + 0.14, 0.6);
  geos.push(toStandard(cVert), toStandard(cHoriz));
  return mergeGeometries(geos) || geos[0];
})();

const churchInteriorWoodGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  geos.push(toStandard(new THREE.BoxGeometry(0.45, 0.56, 0.45).translate(-1.55, 0.35 + 0.28, -0.35)));

  for (const px of [-1.25, 1.25]) {
    for (const pz of [0.25, 0.75]) {
      const seat = new THREE.BoxGeometry(1.25, 0.04, 0.26).translate(px, 0.14 + 0.22, pz);
      const back = new THREE.BoxGeometry(1.25, 0.34, 0.03);
      back.applyMatrix4(new THREE.Matrix4().makeRotationX(0.1).setPosition(px, 0.14 + 0.40, pz + 0.11));
      const endL = new THREE.BoxGeometry(0.05, 0.56, 0.30).translate(px - 0.60, 0.14 + 0.30, pz);
      const endR = new THREE.BoxGeometry(0.05, 0.56, 0.30).translate(px + 0.60, 0.14 + 0.30, pz);
      geos.push(toStandard(seat), toStandard(back), toStandard(endL), toStandard(endR));
    }
  }

  return mergeGeometries(geos) || geos[0];
})();

const churchAltarStoneGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(2.2, 0.12, 0.85).translate(0, 0.14 + 0.06, -0.85)));
  geos.push(toStandard(new THREE.BoxGeometry(1.35, 0.38, 0.50).translate(0, 0.14 + 0.40, -0.85 - 0.08)));
  return mergeGeometries(geos) || geos[0];
})();

const churchAltarLinenGeometry = toStandard(new THREE.BoxGeometry(1.42, 0.025, 0.55).translate(0, 0.14 + 0.60, -0.85 - 0.08));
const churchAltarVelvetGeometry = toStandard(new THREE.BoxGeometry(0.55, 0.01, 0.57).translate(0, 0.14 + 0.615, -0.85 - 0.08));

const churchAltarCrossGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const cV = new THREE.BoxGeometry(0.045, 0.55, 0.045).translate(0, 0.14 + 0.92, -0.85 - 0.10);
  const cH = new THREE.BoxGeometry(0.30, 0.045, 0.045).translate(0, 0.14 + 1.02, -0.85 - 0.10);
  const cB = new THREE.CylinderGeometry(0.07, 0.10, 0.05, 8).translate(0, 0.14 + 0.67, -0.85 - 0.10);
  geos.push(toStandard(cV), toStandard(cH), toStandard(cB));

  for (const cx of [-0.55, 0.55]) {
    const cs = new THREE.CylinderGeometry(0.025, 0.05, 0.12, 8).translate(cx, 0.14 + 0.70, -0.85 - 0.08);
    geos.push(toStandard(cs));
  }

  return mergeGeometries(geos) || geos[0];
})();

const churchAltarCandlesGeometry = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const cx of [-0.55, 0.55]) {
    const fl = new THREE.CylinderGeometry(0.015, 0.015, 0.09, 6).translate(cx, 0.14 + 0.79, -0.85 - 0.08);
    geos.push(toStandard(fl));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const churchGothicDoorStoneGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(1.28, 0.08, 0.28).translate(0, -0.04, 0.08)));

  for (const cx of [-0.52, 0.52]) {
    geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.08, 0.14).translate(cx, 0.04, 0.06)));
    geos.push(toStandard(new THREE.CylinderGeometry(0.05, 0.055, 1.04, 8).translate(cx, 0.60, 0.06)));
    geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.08, 0.14).translate(cx, 1.15, 0.06)));
  }

  const archL = new THREE.BoxGeometry(0.10, 0.62, 0.12);
  archL.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.52).setPosition(-0.26, 1.28, 0.06));
  geos.push(toStandard(archL));

  const archR = new THREE.BoxGeometry(0.10, 0.62, 0.12);
  archR.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.52).setPosition(0.26, 1.28, 0.06));
  geos.push(toStandard(archR));

  geos.push(toStandard(new THREE.BoxGeometry(0.76, 0.26, 0.06).translate(0, 1.24, 0.02)));

  return mergeGeometries(geos) || geos[0];
})();

export const churchGothicDoorGoldGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.04, 0.18, 0.02).translate(0, 1.25, 0.06)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 0.04, 0.02).translate(0, 1.27, 0.06)));
  return mergeGeometries(geos) || geos[0];
})();

export const churchGothicDoorLeftLeafGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.44, 1.10, 0.05).translate(0.22, 0.55, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.38, 0.035, 0.015).translate(0.22, 0.90, 0.03)));
  geos.push(toStandard(new THREE.BoxGeometry(0.38, 0.035, 0.015).translate(0.22, 0.20, 0.03)));
  geos.push(toStandard(new THREE.TorusGeometry(0.035, 0.008, 6, 10).translate(0.36, 0.55, 0.04)));
  return mergeGeometries(geos) || geos[0];
})();

export const churchGothicDoorRightLeafGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.44, 1.10, 0.05).translate(-0.22, 0.55, 0)));
  geos.push(toStandard(new THREE.BoxGeometry(0.38, 0.035, 0.015).translate(-0.22, 0.90, 0.03)));
  geos.push(toStandard(new THREE.BoxGeometry(0.38, 0.035, 0.015).translate(-0.22, 0.20, 0.03)));
  geos.push(toStandard(new THREE.TorusGeometry(0.035, 0.008, 6, 10).translate(-0.36, 0.55, 0.04)));
  return mergeGeometries(geos) || geos[0];
})();

export const churchCarpetGeo = toStandard(new THREE.BoxGeometry(0.85, 0.005, 2.35).translate(0, 0.155, 0.15));

function ChurchGothicDoor({
  position = [0, 0.14, 1.36],
}: {
  position?: [number, number, number];
}) {
  const mats = SHARED_BUILDING_MATS;
  const rootRef = useRef<THREE.Group>(null);
  const leftLeafRef = useRef<THREE.Group>(null);
  const rightLeafRef = useRef<THREE.Group>(null);
  const cachedPos = useRef<[number, number] | null>(null);
  const isNearRef = useRef(false);
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!rootRef.current || !leftLeafRef.current || !rightLeafRef.current) return;
    if (!isObjectEffectivelyVisible(rootRef.current)) return;
    const currentZoom = (window as any).__lastCameraZoom ?? DEFAULT_CAMERA_ZOOM;
    if (currentZoom < 30) return;

    if (!cachedPos.current) {
      rootRef.current.getWorldPosition(worldPos);
      cachedPos.current = [worldPos.x, worldPos.z];
    }
    const [dx, dz] = cachedPos.current;

    let isNear = false;
    for (const char of characterEntities) {
      if (!char.position) continue;
      const distSq = (char.position[0] - dx) ** 2 + (char.position[2] - dz) ** 2;
      if (distSq < 2.5 * 2.5) {
        isNear = true;
        break;
      }
    }
    isNearRef.current = isNear;

    const targetL = isNear ? -1.45 : 0;
    const targetR = isNear ? 1.45 : 0;
    leftLeafRef.current.rotation.y = THREE.MathUtils.lerp(leftLeafRef.current.rotation.y, targetL, Math.min(1.0, (delta || 0.016) * 6.0));
    rightLeafRef.current.rotation.y = THREE.MathUtils.lerp(rightLeafRef.current.rotation.y, targetR, Math.min(1.0, (delta || 0.016) * 6.0));
  });

  return (
    <group ref={rootRef} position={position}>
      <mesh geometry={churchGothicDoorStoneGeo} material={mats.stoneLight} receiveShadow />
      <mesh geometry={churchGothicDoorGoldGeo} material={mats.goldTrim} />

      <group ref={leftLeafRef} position={[-0.44, 0, 0.02]}>
        <mesh geometry={churchGothicDoorLeftLeafGeo} material={mats.timberDark} receiveShadow />
      </group>

      <group ref={rightLeafRef} position={[0.44, 0, 0.02]}>
        <mesh geometry={churchGothicDoorRightLeafGeo} material={mats.timberDark} receiveShadow />
      </group>
    </group>
  );
}

export function WoodenChurchModel({
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
      <mesh geometry={churchStoneGeometry} material={mats.stoneLight} castShadow receiveShadow />
      <mesh geometry={churchGlassGeometry} material={isLightOn ? mats.windowLit : mats.windowUnlit} />
      <mesh geometry={churchCarpetGeo} material={mats.velvetRed} receiveShadow />
      <ChurchGothicDoor position={[0, 0.14, 1.36]} />

      <group ref={interiorRef} visible={false}>
        <mesh geometry={churchAltarStoneGeometry} material={mats.stoneLight} receiveShadow />
        <mesh geometry={churchAltarLinenGeometry} material={mats.clothWhite} receiveShadow />
        <mesh geometry={churchAltarVelvetGeometry} material={mats.velvetRed} />
        <mesh geometry={churchInteriorWoodGeometry} material={mats.timberDark} receiveShadow />
        <mesh geometry={churchAltarCrossGeometry} material={mats.goldTrim} />
        <mesh geometry={churchAltarCandlesGeometry} material={isLightOn ? mats.candleGlow : mats.candleUnlit} />
      </group>

      <group ref={roofRef}>
        <mesh geometry={churchRoofGeometry} material={mats.timberPlanks} castShadow receiveShadow />
        <mesh geometry={churchRoofTrimGeometry} material={mats.timberDark} />
        <mesh geometry={churchBelfryBellGeometry} material={mats.goldTrim} />
        <mesh geometry={churchSpireCrossGeometry} material={mats.ironSteel} />
      </group>
    </group>
  );
}
