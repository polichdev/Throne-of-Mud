import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { characterEntities } from '../../../../engine/ecs/world';
import { SHARED_BUILDING_MATS } from '../buildingMaterials';
import { useGameStore } from '../../../../store/useGameStore';
import { ResidentialSmokeState } from '../residentialSmoke';

const residentialSmokeState = new ResidentialSmokeState();

export function isObjectEffectivelyVisible(obj: THREE.Object3D | null): boolean {
  let curr = obj;
  while (curr) {
    if (!curr.visible) return false;
    curr = curr.parent;
  }
  return true;
}

export function TriangularGable({
  baseWidth,
  height,
  thickness = 0.12,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  material = SHARED_BUILDING_MATS.wattleDaub,
  hasTimberFrame = true,
  hasVent = true,
}: {
  baseWidth: number;
  height: number;
  thickness?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  material?: THREE.Material;
  hasTimberFrame?: boolean;
  hasVent?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;
  const half = baseWidth / 2;

  const { gableGeo, timberFrameGeo } = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-half, 0);
    s.lineTo(half, 0);
    s.lineTo(0, height);
    s.closePath();

    const gGable = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false });

    if (!hasTimberFrame) {
      return { gableGeo: gGable, timberFrameGeo: null };
    }

    const slopeAngle = Math.atan2(height, half);
    const hypotenuse = Math.sqrt(half * half + height * height);
    const geos: THREE.BufferGeometry[] = [];
    const g1 = new THREE.BoxGeometry(0.08, height, 0.04);
    g1.translate(0, height / 2, thickness + 0.01);
    geos.push(g1);

    const g2 = new THREE.BoxGeometry(0.07, hypotenuse, 0.05);
    const m2 = new THREE.Matrix4().makeRotationZ(slopeAngle - Math.PI / 2).setPosition(-half / 2, height / 2, thickness + 0.01);
    g2.applyMatrix4(m2);
    geos.push(g2);

    const g3 = new THREE.BoxGeometry(0.07, hypotenuse, 0.05);
    const m3 = new THREE.Matrix4().makeRotationZ(-(slopeAngle - Math.PI / 2)).setPosition(half / 2, height / 2, thickness + 0.01);
    g3.applyMatrix4(m3);
    geos.push(g3);

    if (hasVent) {
      const vent = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 6);
      vent.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, height * 0.45, thickness + 0.02));
      geos.push(vent);
    }

    return {
      gableGeo: gGable,
      timberFrameGeo: mergeGeometries(geos) || g1,
    };
  }, [baseWidth, height, thickness, half, hasTimberFrame, hasVent]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={gableGeo} material={material} receiveShadow />
      {timberFrameGeo && (
        <mesh geometry={timberFrameGeo} material={mats.timberDark} />
      )}
    </group>
  );
}

export function MedievalDoor({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.72,
  height = 1.05,
  isDouble = false,
  hasCanopy = false,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  isDouble?: boolean;
  hasCanopy?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;
  const jambWidth = 0.10;
  const rootRef = useRef<THREE.Group>(null);
  const leftHingeRef = useRef<THREE.Group>(null);
  const rightHingeRef = useRef<THREE.Group>(null);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const cachedPos = useRef<[number, number] | null>(null);
  const frameCount = useRef(0);
  const isNearRef = useRef(false);
  const doorHash = useMemo(() => Math.abs(Math.round((position[0] * 11 + position[2] * 19) % 30)), [position]);

  useFrame((_, delta) => {
    if (!rootRef.current || !leftHingeRef.current) return;
    if (!rootRef.current.visible) return;
    const currentZoom = (window as any).__lastCameraZoom ?? 38;
    if (currentZoom < 42) {
      if (leftHingeRef.current.rotation.y !== 0) leftHingeRef.current.rotation.y = 0;
      if (rightHingeRef.current && rightHingeRef.current.rotation.y !== 0) rightHingeRef.current.rotation.y = 0;
      isNearRef.current = false;
      return;
    }

    frameCount.current++;
    if ((frameCount.current + doorHash) % 30 === 0) {
      const camTarget = (window as any).__lastCameraTarget;
      if (!cachedPos.current) {
        rootRef.current.getWorldPosition(worldPos);
        cachedPos.current = [worldPos.x, worldPos.z];
      }
      const dx = cachedPos.current[0];
      const dz = cachedPos.current[1];

      if (camTarget && (dx - camTarget[0]) ** 2 + (dz - camTarget[1]) ** 2 > 30 * 30) {
        isNearRef.current = false;
      } else {
        let isNear = false;
        for (const char of characterEntities) {
          if (!char.position || !char.path || char.path.length === 0) continue;
          const dist = Math.hypot(char.position[0] - dx, char.position[2] - dz);
          if (dist > 1.35) continue;

          let pathPassesDoor = false;
          const checkSteps = Math.min(3, char.path.length);
          for (let i = 0; i < checkSteps; i++) {
            const wp = char.path[i];
            if (Math.hypot(wp[0] + 0.5 - dx, wp[1] + 0.5 - dz) < 0.95) {
              pathPassesDoor = true;
              break;
            }
          }

          if (pathPassesDoor || dist < 0.45) {
            isNear = true;
            break;
          }
        }
        isNearRef.current = isNear;
      }
    }

    if (!isNearRef.current && Math.abs(leftHingeRef.current.rotation.y) < 0.001) {
      if (leftHingeRef.current.rotation.y !== 0) leftHingeRef.current.rotation.y = 0;
      if (rightHingeRef.current && rightHingeRef.current.rotation.y !== 0) rightHingeRef.current.rotation.y = 0;
      return;
    }

    const openAngle = isNearRef.current ? -1.45 : 0;
    leftHingeRef.current.rotation.y = THREE.MathUtils.lerp(
      leftHingeRef.current.rotation.y,
      openAngle,
      Math.min(1.0, (delta || 0.016) * 7.0)
    );

    if (rightHingeRef.current) {
      rightHingeRef.current.rotation.y = THREE.MathUtils.lerp(
        rightHingeRef.current.rotation.y,
        isNearRef.current ? 1.45 : 0,
        Math.min(1.0, (delta || 0.016) * 7.0)
      );
    }
  });

  const { sillGeo, jambsGeo, singleDoorGeo, doubleLeftDoorGeo, doubleRightDoorGeo, canopyRoofGeo } = useMemo(() => {
    const sGeo = new THREE.BoxGeometry(width + 0.32, 0.08, 0.28).translate(0, -0.04, 0.08);

    const jGeos: THREE.BufferGeometry[] = [];
    const g1 = new THREE.BoxGeometry(jambWidth, height + 0.14, 0.14).translate(-width / 2 - jambWidth / 2, height / 2, 0.04);
    const g2 = new THREE.BoxGeometry(jambWidth, height + 0.14, 0.14).translate(width / 2 + jambWidth / 2, height / 2, 0.04);
    const g3 = new THREE.BoxGeometry(width + jambWidth * 2 + 0.08, 0.12, 0.16).translate(0, height + 0.05, 0.04);
    jGeos.push(g1, g2, g3);

    if (hasCanopy) {
      const cStrutL = new THREE.BoxGeometry(0.06, 0.28, 0.06);
      cStrutL.applyMatrix4(new THREE.Matrix4().makeRotationX(0.4).setPosition(-width * 0.5 - 0.02, height + 0.04, 0.14));
      const cStrutR = new THREE.BoxGeometry(0.06, 0.28, 0.06);
      cStrutR.applyMatrix4(new THREE.Matrix4().makeRotationX(0.4).setPosition(width * 0.5 + 0.02, height + 0.04, 0.14));
      jGeos.push(cStrutL, cStrutR);
    }

    const sLeaf = new THREE.BoxGeometry(width, height, 0.045).translate(width / 2, height / 2, 0);
    const s1 = new THREE.BoxGeometry(width * 0.65, 0.035, 0.015).translate(width * 0.35, height * 0.75, 0.028);
    const s2 = new THREE.BoxGeometry(width * 0.65, 0.035, 0.015).translate(width * 0.35, height * 0.25, 0.028);
    const ring = new THREE.TorusGeometry(0.035, 0.008, 6, 12).translate(width - 0.09, height * 0.5, 0.035);
    const singleMerged = mergeGeometries([sLeaf, s1, s2, ring]) || sLeaf;

    const dlLeaf = new THREE.BoxGeometry(width / 2, height, 0.04).translate(width / 4, height / 2, 0);
    const dl1 = new THREE.BoxGeometry(width * 0.42, 0.035, 0.015).translate(width / 4, height * 0.75, 0.025);
    const dl2 = new THREE.BoxGeometry(width * 0.42, 0.035, 0.015).translate(width / 4, height * 0.25, 0.025);
    const dlRing = new THREE.TorusGeometry(0.03, 0.008, 6, 12).translate(width / 2 - 0.06, height * 0.5, 0.03);
    const doubleLeftMerged = mergeGeometries([dlLeaf, dl1, dl2, dlRing]) || dlLeaf;

    const drLeaf = new THREE.BoxGeometry(width / 2, height, 0.04).translate(-width / 4, height / 2, 0);
    const dr1 = new THREE.BoxGeometry(width * 0.42, 0.035, 0.015).translate(-width / 4, height * 0.75, 0.025);
    const dr2 = new THREE.BoxGeometry(width * 0.42, 0.035, 0.015).translate(-width / 4, height * 0.25, 0.025);
    const drRing = new THREE.TorusGeometry(0.03, 0.008, 6, 12).translate(-width / 2 + 0.06, height * 0.5, 0.03);
    const doubleRightMerged = mergeGeometries([drLeaf, dr1, dr2, drRing]) || drLeaf;

    let cRoof: THREE.BufferGeometry | null = null;
    if (hasCanopy) {
      const cr = new THREE.BoxGeometry(width + 0.38, 0.08, 0.42);
      cr.applyMatrix4(new THREE.Matrix4().makeRotationX(0.4).setPosition(0, height + 0.18, 0.24));
      cRoof = cr;
    }

    return {
      sillGeo: sGeo,
      jambsGeo: mergeGeometries(jGeos) || g1,
      singleDoorGeo: singleMerged,
      doubleLeftDoorGeo: doubleLeftMerged,
      doubleRightDoorGeo: doubleRightMerged,
      canopyRoofGeo: cRoof,
    };
  }, [width, height, jambWidth, hasCanopy]);

  return (
    <group ref={rootRef} position={position} rotation={rotation}>
      <mesh geometry={sillGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={jambsGeo} material={mats.timberDark} />

      {isDouble ? (
        <group>
          <group ref={leftHingeRef} position={[-width / 2, 0, 0.04]}>
            <mesh geometry={doubleLeftDoorGeo} material={mats.floorPlanks} receiveShadow />
          </group>
          <group ref={rightHingeRef} position={[width / 2, 0, 0.04]}>
            <mesh geometry={doubleRightDoorGeo} material={mats.floorPlanks} receiveShadow />
          </group>
        </group>
      ) : (
        <group ref={leftHingeRef} position={[-width / 2, 0, 0.04]}>
          <mesh geometry={singleDoorGeo} material={mats.floorPlanks} receiveShadow />
        </group>
      )}

      {canopyRoofGeo && (
        <mesh geometry={canopyRoofGeo} material={mats.thatchRoof} />
      )}
    </group>
  );
}

export function MedievalWindow({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.52,
  height = 0.52,
  isLightOn = false,
  hasFlowerBox = true,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  isLightOn?: boolean;
  hasFlowerBox?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;

  const { woodGeo, glassGeo, flowersGeo } = useMemo(() => {
    const wGeos: THREE.BufferGeometry[] = [];
    const jL = new THREE.BoxGeometry(0.09, height + 0.16, 0.14).translate(-width / 2 - 0.045, 0, 0.07);
    const jR = new THREE.BoxGeometry(0.09, height + 0.16, 0.14).translate(width / 2 + 0.045, 0, 0.07);
    const head = new THREE.BoxGeometry(width + 0.24, 0.08, 0.14).translate(0, height / 2 + 0.04, 0.07);
    const sill = new THREE.BoxGeometry(width + 0.26, 0.08, 0.16).translate(0, -height / 2 - 0.04, 0.08);
    const mVert = new THREE.BoxGeometry(0.045, height, 0.035).translate(0, 0, 0.09);
    const mHoriz = new THREE.BoxGeometry(width, 0.045, 0.035).translate(0, 0, 0.09);
    wGeos.push(jL, jR, head, sill, mVert, mHoriz);

    const sL = new THREE.BoxGeometry(width * 0.48, height * 0.96, 0.03);
    const mL = new THREE.Matrix4().makeRotationY(-0.55).setPosition(-width / 2 - 0.14, 0, 0.12);
    sL.applyMatrix4(mL);
    wGeos.push(sL);

    const sR = new THREE.BoxGeometry(width * 0.48, height * 0.96, 0.03);
    const mR = new THREE.Matrix4().makeRotationY(0.55).setPosition(width / 2 + 0.14, 0, 0.12);
    sR.applyMatrix4(mR);
    wGeos.push(sR);

    const i1 = new THREE.BoxGeometry(width * 0.4, 0.02, 0.01).translate(0, height * 0.3, 0.02).applyMatrix4(mL);
    const i2 = new THREE.BoxGeometry(width * 0.4, 0.02, 0.01).translate(0, -height * 0.3, 0.02).applyMatrix4(mL);
    const i3 = new THREE.BoxGeometry(width * 0.4, 0.02, 0.01).translate(0, height * 0.3, 0.02).applyMatrix4(mR);
    const i4 = new THREE.BoxGeometry(width * 0.4, 0.02, 0.01).translate(0, -height * 0.3, 0.02).applyMatrix4(mR);
    wGeos.push(i1, i2, i3, i4);

    if (hasFlowerBox) {
      const fb = new THREE.BoxGeometry(width * 0.95, 0.12, 0.14).translate(0, -height / 2 - 0.12, 0.18);
      wGeos.push(fb);
    }

    const glass = new THREE.BoxGeometry(width, height, 0.02).translate(0, 0, 0.075);

    let fGeo: THREE.BufferGeometry | null = null;
    if (hasFlowerBox) {
      const leaves = new THREE.BoxGeometry(width * 0.9, 0.06, 0.12).translate(0, -height / 2 - 0.12 + 0.06, 0.18);
      const f1 = new THREE.DodecahedronGeometry(0.04, 0).translate(-width * 0.25, -height / 2 - 0.12 + 0.11, 0.18);
      const f2 = new THREE.DodecahedronGeometry(0.04, 0).translate(width * 0.25, -height / 2 - 0.12 + 0.11, 0.18);
      const f3 = new THREE.DodecahedronGeometry(0.04, 0).translate(0, -height / 2 - 0.12 + 0.12, 0.18);
      fGeo = mergeGeometries([leaves, f1, f2, f3]) || leaves;
    }

    return {
      woodGeo: mergeGeometries(wGeos) || jL,
      glassGeo: glass,
      flowersGeo: fGeo,
    };
  }, [width, height, hasFlowerBox]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={woodGeo} material={mats.timberDark} />
      <mesh geometry={glassGeo} material={isLightOn ? mats.windowLit : mats.windowUnlit} />
      {flowersGeo && <mesh geometry={flowersGeo} material={mats.leafGreen} />}
    </group>
  );
}

export const firewoodSupportsGeometry = (() => {
  const g1 = new THREE.BoxGeometry(0.04, 0.36, 0.4); g1.translate(-0.32, 0.18, 0);
  const g2 = new THREE.BoxGeometry(0.04, 0.36, 0.4); g2.translate(0.32, 0.18, 0);
  return mergeGeometries([g1, g2]) || g1;
})();

export const firewoodLogsGeometry = (() => {
  const logs: THREE.BufferGeometry[] = [];
  for (const x of [-0.2, -0.07, 0.07, 0.2]) {
    const g = new THREE.CylinderGeometry(0.065, 0.065, 0.36, 6);
    g.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(x, 0.07, 0));
    logs.push(g);
  }
  for (const x of [-0.14, 0, 0.14]) {
    const g = new THREE.CylinderGeometry(0.06, 0.06, 0.36, 6);
    g.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(x, 0.19, 0));
    logs.push(g);
  }
  for (const x of [-0.07, 0.07]) {
    const g = new THREE.CylinderGeometry(0.055, 0.055, 0.36, 6);
    g.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(x, 0.3, 0));
    logs.push(g);
  }
  return mergeGeometries(logs) || logs[0];
})();

export function FirewoodStack({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={firewoodSupportsGeometry} material={mats.timberDark} />
      <mesh geometry={firewoodLogsGeometry} material={mats.timberLight} />
    </group>
  );
}

const barrelBandsGeometry = (() => {
  const g1 = new THREE.CylinderGeometry(0.205, 0.205, 0.03, 8); g1.translate(0, 0.36, 0);
  const g2 = new THREE.CylinderGeometry(0.195, 0.195, 0.03, 8); g2.translate(0, 0.12, 0);
  return mergeGeometries([g1, g2]) || g1;
})();

export function TimberBarrel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <mesh material={mats.barrelWood} position={[0, 0.24, 0]} receiveShadow>
        <cylinderGeometry args={[0.2, 0.18, 0.48, 8]} />
      </mesh>
      <mesh geometry={barrelBandsGeometry} material={mats.ironHardware} />
    </group>
  );
}

const smokeClumpGeometry = (() => {
  const g1 = new THREE.IcosahedronGeometry(0.24, 1);
  const g2 = new THREE.IcosahedronGeometry(0.18, 1);
  g2.translate(-0.11, 0.04, 0.07);
  const g3 = new THREE.IcosahedronGeometry(0.19, 1);
  g3.translate(0.12, -0.03, -0.05);
  const g4 = new THREE.IcosahedronGeometry(0.16, 1);
  g4.translate(0.02, 0.12, 0.08);

  const geos = [g1, g2, g3, g4];
  let totalPos = 0;
  for (const g of geos) {
    totalPos += g.attributes.position.count * 3;
  }
  const positions = new Float32Array(totalPos);
  let posOff = 0;
  for (const g of geos) {
    positions.set(g.attributes.position.array, posOff);
    posOff += g.attributes.position.count * 3;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.computeVertexNormals();
  return merged;
})();

export function ChimneySmoke({
  position = [0, 0, 0],
  residentialBuildingId,
}: {
  position?: [number, number, number];
  residentialBuildingId?: string | null;
}) {
  const mats = SHARED_BUILDING_MATS;
  const groupRef = useRef<THREE.Group>(null);
  const frameCount = useRef(0);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const cachedPos = useRef<[number, number] | null>(null);
  const wasEnabled = useRef(false);

  const materials = [mats.smokeWhite, mats.smokeWhite];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const currentZoom = (window as any).__lastCameraZoom ?? 38;
    const state = useGameStore.getState();
    const hasSmoke = residentialBuildingId === undefined || residentialSmokeState.hasSleepingResident(
      residentialBuildingId, Math.floor(clock.elapsedTime * 10), state.time?.hour ?? 12, characterEntities,
    );
    if (!hasSmoke || state.isStrategicView || currentZoom <= 18.5) {
      if (groupRef.current.visible) groupRef.current.visible = false;
      wasEnabled.current = false;
      return;
    }

    frameCount.current++;

    if (!wasEnabled.current || frameCount.current % 30 === 0) {
      wasEnabled.current = true;
      const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
      if (camTarget) {
        if (!cachedPos.current) {
          groupRef.current.getWorldPosition(worldPos);
          cachedPos.current = [worldPos.x, worldPos.z];
        }
        const distSq = (cachedPos.current[0] - camTarget[0]) ** 2 + (cachedPos.current[1] - camTarget[1]) ** 2;
        groupRef.current.visible = distSq < 26 * 26;
      } else groupRef.current.visible = true;
    }

    if (!groupRef.current.visible) return;

    if (frameCount.current % 2 !== 0) return;

    const t = clock.getElapsedTime();
    const children = groupRef.current.children;
    const count = children.length;
    for (let i = 0; i < count; i++) {
      const puff = children[i] as THREE.Mesh;
      const prog = (t * 0.22 + i / count) % 1.0;
      const y = 0.02 + Math.pow(prog, 0.85) * 2.85;

      const angle = i * 2.399963;
      const dispersion = Math.pow(prog, 1.25) * 0.55;
      const driftTurbulenceX = Math.sin(t * 0.8 + i * 1.7) * Math.pow(prog, 1.1) * 0.18;
      const driftTurbulenceZ = Math.cos(t * 0.7 + i * 2.1) * Math.pow(prog, 1.1) * 0.18;
      const windX = Math.pow(prog, 1.35) * 0.72;
      const windZ = Math.pow(prog, 1.35) * 0.32;

      puff.position.set(
        windX + Math.cos(angle) * dispersion + driftTurbulenceX,
        y,
        windZ + Math.sin(angle) * dispersion + driftTurbulenceZ
      );

      const s = 0.28 + Math.pow(prog, 0.7) * 1.1;
      puff.scale.set(s, s * 1.06, s);
      puff.rotation.set(t * 0.25 + i * 1.1, t * 0.2 + i * 0.9, t * 0.18 + i * 1.4);

      let opacity = 0.42;
      if (prog < 0.12) {
        opacity = (prog / 0.12) * 0.42;
      } else if (prog > 0.35) {
        opacity = 0.42 * Math.pow((1.0 - prog) / 0.65, 1.4);
      }
      if (puff.material && !Array.isArray(puff.material)) {
        (puff.material as THREE.MeshStandardMaterial).opacity = Math.max(0, opacity);
      }
    }
  });

  return (
    <group ref={groupRef} position={position} visible={false}>
      {materials.map((mat, i) => (
        <mesh key={`cs-${i}`} geometry={smokeClumpGeometry} material={mat} />
      ))}
    </group>
  );
}

export function DetailedChimney({
  position = [0, 0, 0],
  width = 0.44,
  depth = 0.44,
  height = 1.25,
  potCount = 1,
  hasSmoke = true,
}: {
  position?: [number, number, number];
  width?: number;
  depth?: number;
  height?: number;
  potCount?: 1 | 2;
  hasSmoke?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;
  const capY = height / 2 + 0.03;
  const crownY = capY + 0.05;
  const potY = crownY + 0.16;

  const { chimneyStoneGeo, chimneySootGeo } = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const base = new THREE.BoxGeometry(width, height, depth);
    geos.push(base);

    const g1 = new THREE.BoxGeometry(width + 0.08, 0.06, depth + 0.08).translate(0, capY, 0);
    const g2 = new THREE.BoxGeometry(width + 0.14, 0.05, depth + 0.14).translate(0, crownY, 0);
    geos.push(g1, g2);

    const rimRot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    const sootGeos: THREE.BufferGeometry[] = [];

    if (potCount === 2) {
      const p1 = new THREE.CylinderGeometry(0.09, 0.11, 0.28, 12).translate(-width * 0.22, potY, 0);
      const p2 = new THREE.CylinderGeometry(0.09, 0.11, 0.28, 12).translate(width * 0.22, potY, 0);
      const r1 = new THREE.TorusGeometry(0.085, 0.025, 8, 16).applyMatrix4(rimRot).translate(-width * 0.22, potY + 0.13, 0);
      const r2 = new THREE.TorusGeometry(0.085, 0.025, 8, 16).applyMatrix4(rimRot).translate(width * 0.22, potY + 0.13, 0);
      const s1 = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 12).translate(-width * 0.22, potY + 0.12, 0);
      const s2 = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 12).translate(width * 0.22, potY + 0.12, 0);
      geos.push(p1, p2, r1, r2);
      sootGeos.push(s1, s2);
    } else {
      const p = new THREE.CylinderGeometry(0.11, 0.13, 0.28, 12).translate(0, potY, 0);
      const r = new THREE.TorusGeometry(0.10, 0.028, 8, 16).applyMatrix4(rimRot).translate(0, potY + 0.13, 0);
      const s = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12).translate(0, potY + 0.12, 0);
      geos.push(p, r);
      sootGeos.push(s);
    }

    return {
      chimneyStoneGeo: mergeGeometries(geos) || base,
      chimneySootGeo: mergeGeometries(sootGeos) || sootGeos[0],
    };
  }, [width, height, depth, capY, crownY, potY, potCount]);

  return (
    <group position={position}>
      <mesh geometry={chimneyStoneGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={chimneySootGeo} material={mats.charcoalBlack} />
      {hasSmoke && (
        potCount === 2 ? (
          <>
            <ChimneySmoke position={[-width * 0.22, potY + 0.14, 0]} />
            <ChimneySmoke position={[width * 0.22, potY + 0.14, 0]} />
          </>
        ) : (
          <ChimneySmoke position={[0, potY + 0.14, 0]} />
        )
      )}
    </group>
  );
}

export function GothicLancetWindow({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.52,
  height = 0.82,
  isLightOn = false,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  isLightOn?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;

  const { stoneGeo, glassGeo } = useMemo(() => {
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
    const gGlass = mergeGeometries([g1, g2]) || g1;

    return {
      stoneGeo: mergeGeometries(geos) || sill,
      glassGeo: gGlass,
    };
  }, [width, height]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={stoneGeo} material={mats.stoneLight} />
      <mesh geometry={glassGeo} material={isLightOn ? mats.windowLit : mats.windowUnlit} />
    </group>
  );
}

export function GothicButtress({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  height = 1.8,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
}) {
  const mats = SHARED_BUILDING_MATS;

  const buttressGeo = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const b1 = new THREE.BoxGeometry(0.26, height * 0.5, 0.36).translate(0, height * 0.25, 0);
    const b2 = new THREE.BoxGeometry(0.22, height * 0.44, 0.26).translate(0, height * 0.72, -0.04);
    const cap1 = new THREE.BoxGeometry(0.27, 0.12, 0.28);
    cap1.applyMatrix4(new THREE.Matrix4().makeRotationX(0.45).setPosition(0, height * 0.5 + 0.04, -0.02));
    const cap2 = new THREE.BoxGeometry(0.23, 0.1, 0.2);
    cap2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.45).setPosition(0, height * 0.94 + 0.04, -0.05));
    const cone = new THREE.ConeGeometry(0.12, 0.28, 4).translate(0, height + 0.12, -0.06);

    geos.push(b1, b2, cap1, cap2, cone);
    return mergeGeometries(geos) || b1;
  }, [height]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={buttressGeo} material={mats.stoneLight} receiveShadow />
    </group>
  );
}

export function GothicPortal({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 1.3,
  height = 1.45,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) {
  const mats = SHARED_BUILDING_MATS;
  const rootRef = useRef<THREE.Group>(null);
  const leftHingeRef = useRef<THREE.Group>(null);
  const rightHingeRef = useRef<THREE.Group>(null);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const cachedPos = useRef<[number, number] | null>(null);
  const frameCount = useRef(0);
  const isNearRef = useRef(false);
  const doorHash = useMemo(() => Math.abs(Math.round((position[0] * 13 + position[2] * 23) % 30)), [position]);

  useFrame((_, delta) => {
    if (!rootRef.current || !leftHingeRef.current || !rightHingeRef.current) return;
    if (!rootRef.current.visible) return;
    const currentZoom = (window as any).__lastCameraZoom ?? 38;
    if (currentZoom < 26) return;

    frameCount.current++;
    if ((frameCount.current + doorHash) % 30 === 0) {
      const camTarget = (window as any).__lastCameraTarget;
      if (!cachedPos.current) {
        rootRef.current.getWorldPosition(worldPos);
        cachedPos.current = [worldPos.x, worldPos.z];
      }
      const dx = cachedPos.current[0];
      const dz = cachedPos.current[1];

      if (camTarget && (dx - camTarget[0]) ** 2 + (dz - camTarget[1]) ** 2 > 35 * 35) {
        isNearRef.current = false;
      } else {
        let isNear = false;
        for (const char of characterEntities) {
          if (!char.position || !char.path || char.path.length === 0) continue;
          const dist = Math.hypot(char.position[0] - dx, char.position[2] - dz);
          if (dist > 1.6) continue;

          let pathPassesDoor = false;
          const checkSteps = Math.min(3, char.path.length);
          for (let i = 0; i < checkSteps; i++) {
            const wp = char.path[i];
            if (Math.hypot(wp[0] + 0.5 - dx, wp[1] + 0.5 - dz) < 1.1) {
              pathPassesDoor = true;
              break;
            }
          }

          if (pathPassesDoor || dist < 0.55) {
            isNear = true;
            break;
          }
        }
        isNearRef.current = isNear;
      }
    }

    if (!isNearRef.current && Math.abs(leftHingeRef.current.rotation.y) < 0.001) {
      if (leftHingeRef.current.rotation.y !== 0) leftHingeRef.current.rotation.y = 0;
      if (rightHingeRef.current.rotation.y !== 0) rightHingeRef.current.rotation.y = 0;
      return;
    }

    leftHingeRef.current.rotation.y = THREE.MathUtils.lerp(
      leftHingeRef.current.rotation.y,
      isNearRef.current ? -1.45 : 0,
      Math.min(1.0, (delta || 0.016) * 6.0)
    );
    rightHingeRef.current.rotation.y = THREE.MathUtils.lerp(
      rightHingeRef.current.rotation.y,
      isNearRef.current ? 1.45 : 0,
      Math.min(1.0, (delta || 0.016) * 6.0)
    );
  });

  return (
    <group ref={rootRef} position={position} rotation={rotation}>
      <mesh material={mats.stoneDark} position={[0, -0.06, 0.1]} receiveShadow>
        <boxGeometry args={[width + 0.5, 0.12, 0.35]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[-width / 2 - 0.1, height * 0.45, 0.06]}>
        <cylinderGeometry args={[0.07, 0.08, height * 0.9, 8]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[width / 2 + 0.1, height * 0.45, 0.06]}>
        <cylinderGeometry args={[0.07, 0.08, height * 0.9, 8]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[-width / 2 - 0.1, height * 0.9 + 0.04, 0.06]}>
        <boxGeometry args={[0.18, 0.1, 0.18]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[width / 2 + 0.1, height * 0.9 + 0.04, 0.06]}>
        <boxGeometry args={[0.18, 0.1, 0.18]} />
      </mesh>
      <group position={[-width * 0.28, height + 0.12, 0.06]} rotation={[0, 0, -0.58]}>
        <mesh material={mats.stoneLight}>
          <boxGeometry args={[0.14, width * 0.82, 0.16]} />
        </mesh>
      </group>
      <group position={[width * 0.28, height + 0.12, 0.06]} rotation={[0, 0, 0.58]}>
        <mesh material={mats.stoneLight}>
          <boxGeometry args={[0.14, width * 0.82, 0.16]} />
        </mesh>
      </group>
      <mesh material={mats.stoneMed} position={[0, height * 0.88, 0.02]}>
        <boxGeometry args={[width * 0.88, 0.38, 0.08]} />
      </mesh>
      <mesh material={mats.goldTrim} position={[0, height * 0.92, 0.07]}>
        <boxGeometry args={[0.28, 0.24, 0.04]} />
      </mesh>
      <group ref={leftHingeRef} position={[-width / 2, 0, 0.02]}>
        <mesh material={mats.timberDark} position={[width / 4, height * 0.42, 0]} receiveShadow>
          <boxGeometry args={[width / 2, height * 0.84, 0.06]} />
        </mesh>
        <mesh material={mats.ironHardware} position={[width / 4, height * 0.65, 0.035]}>
          <boxGeometry args={[width * 0.42, 0.04, 0.015]} />
        </mesh>
        <mesh material={mats.ironHardware} position={[width / 4, height * 0.2, 0.035]}>
          <boxGeometry args={[width * 0.42, 0.04, 0.015]} />
        </mesh>
        <mesh material={mats.ironHardware} position={[width / 2 - 0.08, height * 0.42, 0.045]}>
          <torusGeometry args={[0.04, 0.01, 6, 12]} />
        </mesh>
      </group>
      <group ref={rightHingeRef} position={[width / 2, 0, 0.02]}>
        <mesh material={mats.timberDark} position={[-width / 4, height * 0.42, 0]} receiveShadow>
          <boxGeometry args={[width / 2, height * 0.84, 0.06]} />
        </mesh>
        <mesh material={mats.ironHardware} position={[-width / 4, height * 0.65, 0.035]}>
          <boxGeometry args={[width * 0.42, 0.04, 0.015]} />
        </mesh>
        <mesh material={mats.ironHardware} position={[-width / 4, height * 0.2, 0.035]}>
          <boxGeometry args={[width * 0.42, 0.04, 0.015]} />
        </mesh>
        <mesh material={mats.ironHardware} position={[-width / 2 + 0.08, height * 0.42, 0.045]}>
          <torusGeometry args={[0.04, 0.01, 6, 12]} />
        </mesh>
      </group>
    </group>
  );
}

export const wallBeams4x2Geometry = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const z of [0.89, -0.89]) {
    for (const y of [0.15, 1.15]) {
      const g = new THREE.BoxGeometry(3.84, 0.08, 0.08);
      g.translate(0, y, z);
      geos.push(g);
    }
  }

  for (const x of [-1.89, 1.89]) {
    for (const y of [0.15, 1.15]) {
      const g = new THREE.BoxGeometry(0.08, 0.08, 1.84);
      g.translate(x, y, 0);
      geos.push(g);
    }
  }

  for (const bx of [-1.9, -0.65, 0.65, 1.9]) {
    for (const bz of [-0.9, 0.9]) {
      const g = new THREE.BoxGeometry(0.12, 1.05, 0.12);
      g.translate(bx, 0.65, bz);
      geos.push(g);
    }
  }

  const diagConfigs = [
    [-1.25, 0.65, 0.89, 0, 0, 0.55],
    [1.25, 0.65, 0.89, 0, 0, -0.55],
    [-1.25, 0.65, -0.89, 0, 0, -0.55],
    [1.25, 0.65, -0.89, 0, 0, 0.55],
    [-1.89, 0.65, 0, 0.55, 0, 0],
    [1.89, 0.65, 0, -0.55, 0, 0],
  ];
  for (const [x, y, z, rx, ry, rz] of diagConfigs) {
    const g = new THREE.BoxGeometry(0.06, 1.15, 0.06);
    const m4 = new THREE.Matrix4();
    const euler = new THREE.Euler(rx, ry, rz);
    m4.makeRotationFromEuler(euler);
    m4.setPosition(x, y, z);
    g.applyMatrix4(m4);
    geos.push(g);
  }

  return mergeGeometries(geos) || new THREE.BufferGeometry();
})();

export function WallBeams4x2() {
  const mats = SHARED_BUILDING_MATS;
  return <mesh geometry={wallBeams4x2Geometry} material={mats.timberDark} />;
}

export function MedievalBed({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  quiltMaterial = SHARED_BUILDING_MATS.bedLinenRed,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  quiltMaterial?: THREE.Material;
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>
      <mesh material={mats.timberDark} position={[-0.34, 0.24, -0.6]}>
        <boxGeometry args={[0.07, 0.48, 0.07]} />
      </mesh>
      <mesh material={mats.timberLight} position={[-0.34, 0.5, -0.6]}>
        <sphereGeometry args={[0.045, 6, 6]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0.34, 0.24, -0.6]}>
        <boxGeometry args={[0.07, 0.48, 0.07]} />
      </mesh>
      <mesh material={mats.timberLight} position={[0.34, 0.5, -0.6]}>
        <sphereGeometry args={[0.045, 6, 6]} />
      </mesh>

      <mesh material={mats.timberDark} position={[-0.34, 0.17, 0.6]}>
        <boxGeometry args={[0.07, 0.34, 0.07]} />
      </mesh>
      <mesh material={mats.timberLight} position={[-0.34, 0.36, 0.6]}>
        <sphereGeometry args={[0.04, 6, 6]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0.34, 0.17, 0.6]}>
        <boxGeometry args={[0.07, 0.34, 0.07]} />
      </mesh>
      <mesh material={mats.timberLight} position={[0.34, 0.36, 0.6]}>
        <sphereGeometry args={[0.04, 6, 6]} />
      </mesh>

      <mesh material={mats.timberPlanks} position={[-0.34, 0.17, 0]}>
        <boxGeometry args={[0.04, 0.1, 1.14]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0.34, 0.17, 0]}>
        <boxGeometry args={[0.04, 0.1, 1.14]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[0.64, 0.03, 1.14]} />
      </mesh>

      <mesh material={mats.timberPlanks} position={[0, 0.31, -0.6]}>
        <boxGeometry args={[0.62, 0.26, 0.04]} />
      </mesh>
      <mesh material={mats.timberDark} position={[0, 0.45, -0.6]}>
        <boxGeometry args={[0.42, 0.05, 0.05]} />
      </mesh>

      <mesh material={mats.timberPlanks} position={[0, 0.22, 0.6]}>
        <boxGeometry args={[0.62, 0.14, 0.04]} />
      </mesh>

      <mesh material={mats.bedStraw} position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[0.62, 0.1, 1.12]} />
      </mesh>

      <mesh material={mats.pillowWhite} position={[0, 0.252, -0.22]}>
        <boxGeometry args={[0.62, 0.015, 0.16]} />
      </mesh>

      <mesh material={mats.pillowWhite} position={[0, 0.27, -0.42]}>
        <boxGeometry args={[0.48, 0.07, 0.24]} />
      </mesh>

      <mesh material={quiltMaterial} position={[0, 0.255, 0.2]}>
        <boxGeometry args={[0.63, 0.02, 0.74]} />
      </mesh>
      <mesh material={quiltMaterial} position={[-0.32, 0.22, 0.2]}>
        <boxGeometry args={[0.02, 0.07, 0.72]} />
      </mesh>
      <mesh material={quiltMaterial} position={[0.32, 0.22, 0.2]}>
        <boxGeometry args={[0.02, 0.07, 0.72]} />
      </mesh>
      <mesh material={quiltMaterial} position={[0, 0.22, 0.57]}>
        <boxGeometry args={[0.62, 0.07, 0.02]} />
      </mesh>
    </group>
  );
}

export function BarracksBunkBed({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position}>
      {[-0.56, 0.56].map((px) =>
        [-0.36, 0.36].map((pz) => (
          <group key={`bunk-post-${px}-${pz}`} position={[px, 0.52, pz]}>
            <mesh material={mats.timberDark}>
              <boxGeometry args={[0.07, 1.04, 0.07]} />
            </mesh>
            <mesh material={mats.timberLight} position={[0, 0.53, 0]}>
              <coneGeometry args={[0.045, 0.06, 4]} />
            </mesh>
          </group>
        ))
      )}

      <mesh material={mats.timberPlanks} position={[-0.56, 0.22, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.68]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0.56, 0.22, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.68]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0, 0.22, -0.36]}>
        <boxGeometry args={[1.08, 0.1, 0.04]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0, 0.22, 0.36]}>
        <boxGeometry args={[1.08, 0.1, 0.04]} />
      </mesh>
      <mesh material={mats.timberDark} position={[0, 0.18, 0]} receiveShadow>
        <boxGeometry args={[1.06, 0.03, 0.68]} />
      </mesh>
      <mesh material={mats.bedStraw} position={[0, 0.24, 0]} receiveShadow>
        <boxGeometry args={[1.05, 0.1, 0.66]} />
      </mesh>
      <mesh material={mats.bedLinenRed} position={[0.16, 0.285, 0]}>
        <boxGeometry args={[0.7, 0.03, 0.65]} />
      </mesh>
      <mesh material={mats.pillowWhite} position={[-0.2, 0.285, 0]}>
        <boxGeometry args={[0.12, 0.015, 0.64]} />
      </mesh>
      <mesh material={mats.pillowWhite} position={[-0.38, 0.3, 0]}>
        <boxGeometry args={[0.26, 0.07, 0.44]} />
      </mesh>

      <mesh material={mats.timberPlanks} position={[-0.56, 0.6, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.68]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0.56, 0.6, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.68]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0, 0.6, -0.36]}>
        <boxGeometry args={[1.08, 0.1, 0.04]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0, 0.6, 0.36]}>
        <boxGeometry args={[1.08, 0.1, 0.04]} />
      </mesh>
      <mesh material={mats.timberDark} position={[-0.14, 0.72, 0.36]}>
        <boxGeometry args={[0.76, 0.04, 0.03]} />
      </mesh>
      <mesh material={mats.timberDark} position={[0, 0.72, -0.36]}>
        <boxGeometry args={[1.08, 0.04, 0.03]} />
      </mesh>
      <mesh material={mats.timberDark} position={[0, 0.56, 0]} receiveShadow>
        <boxGeometry args={[1.06, 0.03, 0.68]} />
      </mesh>
      <mesh material={mats.bedStraw} position={[0, 0.62, 0]} receiveShadow>
        <boxGeometry args={[1.05, 0.1, 0.66]} />
      </mesh>
      <mesh material={mats.bedLinenBlue} position={[0.16, 0.665, 0]}>
        <boxGeometry args={[0.7, 0.03, 0.65]} />
      </mesh>
      <mesh material={mats.pillowWhite} position={[-0.2, 0.665, 0]}>
        <boxGeometry args={[0.12, 0.015, 0.64]} />
      </mesh>
      <mesh material={mats.pillowWhite} position={[-0.38, 0.68, 0]}>
        <boxGeometry args={[0.26, 0.07, 0.44]} />
      </mesh>

      <group position={[0.38, 0, 0.38]}>
        <mesh material={mats.timberDark} position={[-0.1, 0.48, 0]}>
          <boxGeometry args={[0.03, 0.96, 0.03]} />
        </mesh>
        <mesh material={mats.timberDark} position={[0.1, 0.48, 0]}>
          <boxGeometry args={[0.03, 0.96, 0.03]} />
        </mesh>
        {[0.18, 0.38, 0.58, 0.78].map((ry, ri) => (
          <mesh key={`rung-${ri}`} material={mats.timberLight} position={[0, ry, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.19, 4]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function LordManorBed({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>
      {[-0.45, 0.45].map((px) =>
        [-0.65, 0.65].map((pz) => (
          <group key={`mb-post-${px}-${pz}`} position={[px, 0.65, pz]}>
            <mesh material={mats.timberDark}>
              <boxGeometry args={[0.08, 1.3, 0.08]} />
            </mesh>
            <mesh material={mats.goldTrim} position={[0, 0.68, 0]}>
              <sphereGeometry args={[0.045, 6, 6]} />
            </mesh>
            <mesh material={mats.goldTrim} position={[0, 0.74, 0]}>
              <coneGeometry args={[0.03, 0.08, 5]} />
            </mesh>
          </group>
        ))
      )}

      <mesh material={mats.timberDark} position={[0, 1.3, -0.65]}>
        <boxGeometry args={[0.96, 0.04, 0.08]} />
      </mesh>
      <mesh material={mats.timberDark} position={[0, 1.3, 0.65]}>
        <boxGeometry args={[0.96, 0.04, 0.08]} />
      </mesh>
      <mesh material={mats.timberDark} position={[-0.45, 1.3, 0]}>
        <boxGeometry args={[0.08, 0.04, 1.36]} />
      </mesh>
      <mesh material={mats.timberDark} position={[0.45, 1.3, 0]}>
        <boxGeometry args={[0.08, 0.04, 1.36]} />
      </mesh>
      <mesh material={mats.velvetRed} position={[0, 1.22, -0.65]}>
        <boxGeometry args={[0.94, 0.14, 0.02]} />
      </mesh>
      <mesh material={mats.goldTrim} position={[0, 1.15, -0.65]}>
        <boxGeometry args={[0.96, 0.015, 0.025]} />
      </mesh>
      <mesh material={mats.velvetRed} position={[0, 1.22, 0.65]}>
        <boxGeometry args={[0.94, 0.14, 0.02]} />
      </mesh>
      <mesh material={mats.goldTrim} position={[0, 1.15, 0.65]}>
        <boxGeometry args={[0.96, 0.015, 0.025]} />
      </mesh>
      <mesh material={mats.velvetRed} position={[-0.45, 1.22, 0]}>
        <boxGeometry args={[0.02, 0.14, 1.32]} />
      </mesh>
      <mesh material={mats.goldTrim} position={[-0.45, 1.15, 0]}>
        <boxGeometry args={[0.025, 0.015, 1.34]} />
      </mesh>
      <mesh material={mats.velvetRed} position={[0.45, 1.22, 0]}>
        <boxGeometry args={[0.02, 0.14, 1.32]} />
      </mesh>
      <mesh material={mats.goldTrim} position={[0.45, 1.15, 0]}>
        <boxGeometry args={[0.025, 0.015, 1.34]} />
      </mesh>

      {[-0.43, 0.43].map((dx) => (
        <group key={`drape-back-${dx}`} position={[dx, 0.72, -0.62]}>
          <mesh material={mats.velvetRed}>
            <boxGeometry args={[0.12, 0.88, 0.08]} />
          </mesh>
          <mesh material={mats.goldTrim} position={[0, -0.1, 0]}>
            <boxGeometry args={[0.13, 0.04, 0.09]} />
          </mesh>
        </group>
      ))}

      <mesh material={mats.timberDark} position={[0, 0.18, 0]} receiveShadow>
        <boxGeometry args={[0.88, 0.12, 1.28]} />
      </mesh>
      <mesh material={mats.timberLight} position={[0, 0.23, 0]} receiveShadow>
        <boxGeometry args={[0.84, 0.04, 1.24]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0, 0.48, -0.63]}>
        <boxGeometry args={[0.82, 0.52, 0.05]} />
      </mesh>
      <mesh material={mats.velvetRed} position={[0, 0.48, -0.6]}>
        <boxGeometry args={[0.68, 0.4, 0.02]} />
      </mesh>
      <mesh material={mats.goldTrim} position={[0, 0.68, -0.6]}>
        <dodecahedronGeometry args={[0.06, 0]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0, 0.32, 0.63]}>
        <boxGeometry args={[0.82, 0.22, 0.05]} />
      </mesh>

      <mesh material={mats.bedStraw} position={[0, 0.28, 0]} receiveShadow>
        <boxGeometry args={[0.8, 0.12, 1.2]} />
      </mesh>

      <mesh material={mats.pillowWhite} position={[0, 0.345, -0.22]}>
        <boxGeometry args={[0.8, 0.015, 0.22]} />
      </mesh>

      {[-0.22, 0.22].map((px) => (
        <group key={`r-pillow-${px}`} position={[px, 0.36, -0.42]}>
          <mesh material={mats.pillowWhite}>
            <boxGeometry args={[0.34, 0.09, 0.24]} />
          </mesh>
          <mesh material={mats.goldTrim} position={[0, 0.046, 0]}>
            <boxGeometry args={[0.35, 0.008, 0.03]} />
          </mesh>
        </group>
      ))}

      <mesh material={mats.velvetRed} position={[0, 0.345, 0.16]}>
        <boxGeometry args={[0.81, 0.02, 0.84]} />
      </mesh>
      <mesh material={mats.velvetRed} position={[-0.41, 0.3, 0.16]}>
        <boxGeometry args={[0.02, 0.09, 0.82]} />
      </mesh>
      <mesh material={mats.velvetRed} position={[0.41, 0.3, 0.16]}>
        <boxGeometry args={[0.02, 0.09, 0.82]} />
      </mesh>
      <mesh material={mats.goldTrim} position={[0, 0.35, 0.16]}>
        <boxGeometry args={[0.76, 0.005, 0.8]} />
      </mesh>

      <group position={[0.58, 0, 0.45]}>
        <mesh material={mats.timberDark} position={[0, 0.16, 0]} receiveShadow>
          <boxGeometry args={[0.26, 0.32, 0.28]} />
        </mesh>
        <mesh material={mats.goldTrim} position={[0, 0.16, 0.145]}>
          <boxGeometry args={[0.04, 0.04, 0.015]} />
        </mesh>
        <mesh material={mats.goldTrim} position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.025, 0.035, 0.04, 6]} />
        </mesh>
        <mesh material={mats.candleGlow} position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.01, 0.012, 0.06, 5]} />
        </mesh>
      </group>
    </group>
  );
}

export function GothicManorFireplace({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isLightOn = false,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  isLightOn?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>
      <mesh material={mats.stoneDark} position={[0, 0.03, 0.12]} receiveShadow>
        <boxGeometry args={[1.36, 0.06, 0.82]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[0, 0.065, 0.52]} receiveShadow>
        <boxGeometry args={[1.4, 0.03, 0.08]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[-0.66, 0.065, 0.12]} receiveShadow>
        <boxGeometry args={[0.08, 0.03, 0.74]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[0.66, 0.065, 0.12]} receiveShadow>
        <boxGeometry args={[0.08, 0.03, 0.74]} />
      </mesh>

      <mesh material={mats.charredWood} position={[0, 0.48, -0.22]} receiveShadow>
        <boxGeometry args={[0.96, 0.88, 0.14]} />
      </mesh>
      <mesh material={mats.charredWood} position={[-0.45, 0.48, -0.05]} receiveShadow>
        <boxGeometry args={[0.08, 0.88, 0.26]} />
      </mesh>
      <mesh material={mats.charredWood} position={[0.45, 0.48, -0.05]} receiveShadow>
        <boxGeometry args={[0.08, 0.88, 0.26]} />
      </mesh>

      <mesh material={mats.stoneMed} position={[-0.56, 0.48, 0.04]} receiveShadow>
        <boxGeometry args={[0.2, 0.88, 0.38]} />
      </mesh>
      <mesh material={mats.stoneMed} position={[0.56, 0.48, 0.04]} receiveShadow>
        <boxGeometry args={[0.2, 0.88, 0.38]} />
      </mesh>

      <mesh material={mats.stoneLight} position={[-0.6, 0.48, 0.22]}>
        <cylinderGeometry args={[0.04, 0.045, 0.86, 8]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[-0.6, 0.08, 0.22]}>
        <boxGeometry args={[0.11, 0.08, 0.11]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[-0.6, 0.88, 0.22]}>
        <boxGeometry args={[0.11, 0.08, 0.11]} />
      </mesh>

      <mesh material={mats.stoneLight} position={[0.6, 0.48, 0.22]}>
        <cylinderGeometry args={[0.04, 0.045, 0.86, 8]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[0.6, 0.08, 0.22]}>
        <boxGeometry args={[0.11, 0.08, 0.11]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[0.6, 0.88, 0.22]}>
        <boxGeometry args={[0.11, 0.08, 0.11]} />
      </mesh>

      <mesh material={mats.stoneLight} position={[0, 0.98, 0.06]} receiveShadow>
        <boxGeometry args={[1.38, 0.16, 0.46]} />
      </mesh>

      <mesh material={mats.goldTrim} position={[0, 1.15, 0.18]}>
        <dodecahedronGeometry args={[0.07, 0]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0, 1.08, 0.08]} receiveShadow>
        <boxGeometry args={[1.44, 0.06, 0.52]} />
      </mesh>

      <mesh material={mats.stoneMed} position={[0, 1.38, -0.06]} receiveShadow>
        <boxGeometry args={[1.22, 0.54, 0.38]} />
      </mesh>
      <mesh material={mats.stoneDark} position={[0, 1.84, -0.1]} receiveShadow>
        <boxGeometry args={[1.04, 0.4, 0.3]} />
      </mesh>

      <mesh material={mats.ashBed} position={[0, 0.07, -0.06]} receiveShadow>
        <boxGeometry args={[0.76, 0.03, 0.34]} />
      </mesh>

      {[-0.24, 0.24].map((ax) => (
        <group key={`andiron-${ax}`} position={[ax, 0.07, -0.04]}>
          <mesh material={mats.ironHardware} position={[0, 0.04, 0]}>
            <boxGeometry args={[0.03, 0.04, 0.28]} />
          </mesh>
          <mesh material={mats.ironHardware} position={[0, 0.12, 0.13]}>
            <boxGeometry args={[0.035, 0.18, 0.035]} />
          </mesh>
          <mesh material={mats.ironHardware} position={[0, 0.22, 0.13]}>
            <sphereGeometry args={[0.03, 6, 6]} />
          </mesh>
        </group>
      ))}

      <mesh material={mats.timberLogs} position={[0, 0.16, -0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.048, 0.052, 0.56, 6]} />
      </mesh>
      <mesh material={mats.timberLogs} position={[-0.05, 0.22, -0.02]} rotation={[0.2, 0.1, Math.PI / 2 + 0.15]}>
        <cylinderGeometry args={[0.042, 0.045, 0.52, 6]} />
      </mesh>
      <mesh material={mats.timberLogs} position={[0.04, 0.22, -0.1]} rotation={[-0.2, -0.1, Math.PI / 2 - 0.15]}>
        <cylinderGeometry args={[0.04, 0.042, 0.5, 6]} />
      </mesh>

      {isLightOn ? (
        <group position={[0, 0.16, -0.04]}>
          <mesh material={mats.emberGlow} position={[0, 0, 0]}>
            <boxGeometry args={[0.45, 0.06, 0.2]} />
          </mesh>
          <mesh material={mats.fireOrange} position={[0, 0.12, 0]}>
            <dodecahedronGeometry args={[0.16, 0]} />
          </mesh>
          <mesh material={mats.fireYellow} position={[0, 0.2, 0]}>
            <coneGeometry args={[0.09, 0.22, 5]} />
          </mesh>
          <mesh material={mats.fireOrange} position={[-0.1, 0.1, 0.02]}>
            <coneGeometry args={[0.07, 0.18, 5]} />
          </mesh>
          <mesh material={mats.fireOrange} position={[0.1, 0.1, -0.02]}>
            <coneGeometry args={[0.07, 0.18, 5]} />
          </mesh>
        </group>
      ) : (
        <mesh material={mats.charredWood} position={[0, 0.1, -0.05]}>
          <boxGeometry args={[0.4, 0.05, 0.18]} />
        </mesh>
      )}

      <group position={[-0.5, 1.11, 0.08]}>
        <mesh material={mats.goldTrim} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.025, 0.035, 0.08, 6]} />
        </mesh>
        <mesh material={isLightOn ? mats.candleGlow : mats.candleUnlit} position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.012, 0.014, 0.08, 5]} />
        </mesh>
      </group>

      <group position={[0.5, 1.11, 0.08]}>
        <mesh material={mats.goldTrim} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.025, 0.035, 0.08, 6]} />
        </mesh>
        <mesh material={isLightOn ? mats.candleGlow : mats.candleUnlit} position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.012, 0.014, 0.08, 5]} />
        </mesh>
      </group>

      <mesh material={mats.goldTrim} position={[0.18, 1.16, 0.08]}>
        <cylinderGeometry args={[0.028, 0.015, 0.09, 8]} />
      </mesh>

      <group position={[0.7, 0.32, 0.18]} rotation={[0.15, 0, 0.18]}>
        <mesh material={mats.ironHardware}>
          <cylinderGeometry args={[0.01, 0.01, 0.64, 5]} />
        </mesh>
        <mesh material={mats.goldTrim} position={[0, 0.32, 0]}>
          <sphereGeometry args={[0.022, 6, 6]} />
        </mesh>
      </group>

      <group position={[-0.64, 0.12, 0.28]}>
        <mesh material={mats.timberDark} position={[0, 0.04, 0]}>
          <boxGeometry args={[0.22, 0.1, 0.26]} />
        </mesh>
        <mesh material={mats.timberLogs} position={[-0.04, 0.11, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.22, 6]} />
        </mesh>
        <mesh material={mats.timberLogs} position={[0.04, 0.11, 0]} rotation={[Math.PI / 2, 0, -0.2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.22, 6]} />
        </mesh>
      </group>
    </group>
  );
}

export function MedievalStoneHearth({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isLightOn = false,
  hasSmoke = true,
  chimneyHeight = 2.15,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  isLightOn?: boolean;
  hasSmoke?: boolean;
  chimneyHeight?: number;
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>

      <mesh material={mats.stoneDark} position={[0, 0.03, 0.08]} receiveShadow>
        <boxGeometry args={[0.88, 0.06, 0.62]} />
      </mesh>

      <mesh material={mats.ashBed} position={[0, 0.065, -0.04]} receiveShadow>
        <boxGeometry args={[0.56, 0.02, 0.32]} />
      </mesh>

      <mesh material={mats.charredWood} position={[0, 0.40, -0.16]} receiveShadow>
        <boxGeometry args={[0.68, 0.72, 0.12]} />
      </mesh>

      <mesh material={mats.stoneMed} position={[-0.34, 0.40, 0]} receiveShadow>
        <boxGeometry args={[0.18, 0.72, 0.36]} />
      </mesh>

      <mesh material={mats.stoneMed} position={[0.34, 0.40, 0]} receiveShadow>
        <boxGeometry args={[0.18, 0.72, 0.36]} />
      </mesh>

      <mesh material={mats.stoneLight} position={[0, 0.78, 0.02]} receiveShadow>
        <boxGeometry args={[0.88, 0.12, 0.40]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0, 0.86, 0.04]}>
        <boxGeometry args={[0.94, 0.05, 0.44]} />
      </mesh>

      <mesh material={mats.ceramicPot} position={[-0.28, 0.94, 0.04]}>
        <cylinderGeometry args={[0.045, 0.035, 0.10, 7]} />
      </mesh>
      <mesh material={isLightOn ? mats.candleGlow : mats.candleUnlit} position={[0.28, 0.92, 0.04]}>
        <cylinderGeometry args={[0.012, 0.015, 0.07, 5]} />
      </mesh>

      <mesh material={mats.ironHardware} position={[0.22, 0.48, -0.04]}>
        <cylinderGeometry args={[0.008, 0.008, 0.38, 4]} />
      </mesh>
      <mesh material={mats.ironHardware} position={[0.12, 0.65, -0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.22, 4]} />
      </mesh>
      <mesh material={mats.ironHardware} position={[0.02, 0.52, -0.04]}>
        <cylinderGeometry args={[0.005, 0.005, 0.24, 4]} />
      </mesh>
      <mesh material={mats.ironHardware} position={[0.02, 0.36, -0.04]}>
        <cylinderGeometry args={[0.09, 0.07, 0.12, 8]} />
      </mesh>
      <mesh material={mats.ironHardware} position={[0.02, 0.43, -0.04]}>
        <torusGeometry args={[0.07, 0.01, 5, 8]} />
      </mesh>

      <IndoorFireplaceFire position={[0, 0.08, -0.04]} scale={0.78} isLit={isLightOn} />

      <mesh material={mats.stoneMed} position={[0, chimneyHeight * 0.58, -0.08]} receiveShadow>
        <boxGeometry args={[0.48, chimneyHeight * 0.78, 0.44]} />
      </mesh>
      <mesh material={mats.stoneLight} position={[0, chimneyHeight - 0.14, -0.08]}>
        <boxGeometry args={[0.54, 0.06, 0.50]} />
      </mesh>
      <mesh material={mats.stoneMed} position={[0, chimneyHeight + 0.02, -0.08]}>
        <cylinderGeometry args={[0.12, 0.14, 0.26, 12]} />
      </mesh>

      <mesh material={mats.stoneLight} position={[0, chimneyHeight + 0.15, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.11, 0.028, 8, 16]} />
      </mesh>

      <mesh material={mats.charcoalBlack} position={[0, chimneyHeight + 0.14, -0.08]}>
        <cylinderGeometry args={[0.085, 0.085, 0.04, 12]} />
      </mesh>

      {hasSmoke && <ChimneySmoke position={[0, chimneyHeight + 0.16, -0.08]} />}
    </group>
  );
}

export function IndoorFireplaceFire({
  position = [0, 0, 0],
  scale = 1.0,
  isLit = true,
}: {
  position?: [number, number, number];
  scale?: number;
  isLit?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;
  const flameRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!flameRef.current || !isLit || !isObjectEffectivelyVisible(flameRef.current)) return;
    const currentZoom = (window as any).__lastCameraZoom ?? 38;
    if (currentZoom <= 18.5) return;
    const t = clock.getElapsedTime();

    const flames = flameRef.current.children;
    for (let i = 0; i < flames.length; i++) {
      const flame = flames[i];
      const seed = i * 2.1;
      const wobbleX = Math.sin(t * 10 + seed) * 0.03 + Math.cos(t * 17 + seed * 1.5) * 0.015;
      const wobbleZ = Math.cos(t * 12 + seed * 1.3) * 0.03 + Math.sin(t * 19 + seed) * 0.015;
      const scaleY = 0.85 + Math.sin(t * 13 + seed * 2) * 0.25 + Math.cos(t * 21 + seed) * 0.15;
      const scaleXZ = 0.8 + Math.cos(t * 11 + seed * 1.5) * 0.18;
      flame.scale.set(scaleXZ * scale, scaleY * scale, scaleXZ * scale);
      flame.position.x = wobbleX;
      flame.position.z = wobbleZ;
      flame.rotation.y = t * (1.8 + (i % 2 === 0 ? 0.8 : -0.8));
    }

    if (lightRef.current) {
      lightRef.current.intensity = 1.8 + Math.sin(t * 15) * 0.4 + Math.cos(t * 23) * 0.2;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh material={mats.ashBed} position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.02, 8]} />
      </mesh>

      <group position={[0, 0.04, 0]}>
        <mesh material={mats.charredWood} position={[-0.04, 0.03, 0]} rotation={[0.2, 0.4, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.035, 0.28, 5]} />
        </mesh>
        <mesh material={mats.charredWood} position={[0.04, 0.05, 0]} rotation={[-0.2, -0.6, Math.PI / 2]}>
          <cylinderGeometry args={[0.028, 0.032, 0.26, 5]} />
        </mesh>
        <mesh material={mats.charredWood} position={[0, 0.07, -0.02]} rotation={[0.4, 0.1, -0.4]}>
          <cylinderGeometry args={[0.024, 0.028, 0.24, 5]} />
        </mesh>
      </group>

      {isLit ? (
        <>
          <group position={[0, 0.04, 0]}>
            <mesh material={mats.emberGlow} position={[-0.04, 0.02, 0.03]}>
              <dodecahedronGeometry args={[0.03, 0]} />
            </mesh>
            <mesh material={mats.emberGlow} position={[0.04, 0.02, -0.03]}>
              <dodecahedronGeometry args={[0.028, 0]} />
            </mesh>
            <mesh material={mats.emberGlow} position={[0, 0.03, 0]}>
              <dodecahedronGeometry args={[0.035, 0]} />
            </mesh>
          </group>

          <group ref={flameRef} position={[0, 0.08, 0]}>
            <group position={[0, 0, 0]}>
              <mesh material={mats.fireOrange} position={[0, 0.18, 0]}>
                <coneGeometry args={[0.12, 0.42, 6]} />
              </mesh>
              <mesh material={mats.fireYellow} position={[0, 0.14, 0]}>
                <coneGeometry args={[0.085, 0.32, 5]} />
              </mesh>
              <mesh material={mats.fireCore} position={[0, 0.09, 0]}>
                <coneGeometry args={[0.05, 0.20, 4]} />
              </mesh>
            </group>

            <group position={[-0.06, 0, 0.04]} rotation={[0.15, 0.4, -0.15]}>
              <mesh material={mats.fireOrange} position={[0, 0.13, 0]}>
                <coneGeometry args={[0.08, 0.30, 5]} />
              </mesh>
              <mesh material={mats.fireYellow} position={[0, 0.10, 0]}>
                <coneGeometry args={[0.055, 0.22, 4]} />
              </mesh>
            </group>

            <group position={[0.06, 0, 0.03]} rotation={[-0.2, -0.5, 0.15]}>
              <mesh material={mats.fireOrange} position={[0, 0.12, 0]}>
                <coneGeometry args={[0.075, 0.28, 5]} />
              </mesh>
              <mesh material={mats.fireYellow} position={[0, 0.09, 0]}>
                <coneGeometry args={[0.05, 0.20, 4]} />
              </mesh>
            </group>
          </group>

          <pointLight
            ref={lightRef}
            position={[0, 0.25, 0]}
            color="#ff7711"
            intensity={1.8}
            distance={5.0}
            decay={2}
          />
        </>
      ) : null}
    </group>
  );
}

export function RusticCabinBed({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  blanketMaterial = SHARED_BUILDING_MATS.bedLinenRed,
  pillowMaterial = SHARED_BUILDING_MATS.pillowWhite,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  blanketMaterial?: THREE.Material;
  pillowMaterial?: THREE.Material;
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>

      <mesh material={mats.timberDark} position={[-0.32, 0.22, -0.52]}>
        <boxGeometry args={[0.065, 0.44, 0.065]} />
      </mesh>
      <mesh material={mats.timberLight} position={[-0.32, 0.46, -0.52]}>
        <sphereGeometry args={[0.04, 6, 6]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0.32, 0.22, -0.52]}>
        <boxGeometry args={[0.065, 0.44, 0.065]} />
      </mesh>
      <mesh material={mats.timberLight} position={[0.32, 0.46, -0.52]}>
        <sphereGeometry args={[0.04, 6, 6]} />
      </mesh>

      <mesh material={mats.timberDark} position={[-0.32, 0.16, 0.52]}>
        <boxGeometry args={[0.065, 0.32, 0.065]} />
      </mesh>
      <mesh material={mats.timberLight} position={[-0.32, 0.34, 0.52]}>
        <sphereGeometry args={[0.035, 6, 6]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0.32, 0.16, 0.52]}>
        <boxGeometry args={[0.065, 0.32, 0.065]} />
      </mesh>
      <mesh material={mats.timberLight} position={[0.32, 0.34, 0.52]}>
        <sphereGeometry args={[0.035, 6, 6]} />
      </mesh>

      <mesh material={mats.timberPlanks} position={[-0.32, 0.15, 0]}>
        <boxGeometry args={[0.035, 0.09, 0.98]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0.32, 0.15, 0]}>
        <boxGeometry args={[0.035, 0.09, 0.98]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0, 0.15, 0.52]}>
        <boxGeometry args={[0.58, 0.09, 0.035]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0, 0.28, -0.52]}>
        <boxGeometry args={[0.58, 0.22, 0.035]} />
      </mesh>

      <mesh material={mats.timberDark} position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[0.58, 0.03, 0.98]} />
      </mesh>

      <mesh material={mats.bedStraw} position={[0, 0.18, 0]} receiveShadow>
        <boxGeometry args={[0.58, 0.10, 0.96]} />
      </mesh>

      <mesh material={pillowMaterial} position={[0, 0.25, -0.34]}>
        <boxGeometry args={[0.46, 0.06, 0.22]} />
      </mesh>

      <mesh material={blanketMaterial} position={[0, 0.24, 0.12]}>
        <boxGeometry args={[0.59, 0.025, 0.68]} />
      </mesh>
      <mesh material={blanketMaterial} position={[-0.30, 0.20, 0.12]}>
        <boxGeometry args={[0.02, 0.07, 0.66]} />
      </mesh>
      <mesh material={blanketMaterial} position={[0.30, 0.20, 0.12]}>
        <boxGeometry args={[0.02, 0.07, 0.66]} />
      </mesh>
      <mesh material={blanketMaterial} position={[0, 0.20, 0.49]}>
        <boxGeometry args={[0.58, 0.07, 0.02]} />
      </mesh>
    </group>
  );
}

export function RusticCabinTable({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  hasBenches = true,
  hasFood = true,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  hasBenches?: boolean;
  hasFood?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>

      <mesh material={mats.timberPlanks} position={[0, 0.36, 0]} receiveShadow>
        <boxGeometry args={[0.96, 0.045, 0.54]} />
      </mesh>

      {[-0.40, 0.40].map((lx) =>
        [-0.20, 0.20].map((lz) => (
          <mesh key={`tleg-${lx}-${lz}`} material={mats.timberDark} position={[lx, 0.17, lz]}>
            <boxGeometry args={[0.05, 0.34, 0.05]} />
          </mesh>
        ))
      )}

      <mesh material={mats.timberDark} position={[0, 0.14, -0.20]}>
        <boxGeometry args={[0.76, 0.03, 0.03]} />
      </mesh>
      <mesh material={mats.timberDark} position={[0, 0.14, 0.20]}>
        <boxGeometry args={[0.76, 0.03, 0.03]} />
      </mesh>

      {hasFood && (
        <group position={[0, 0.38, 0]}>

          <mesh material={mats.breadCrust} position={[-0.22, 0.03, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.06, 7]} />
          </mesh>

          <mesh material={mats.ceramicPot} position={[0.08, 0.025, -0.06]}>
            <cylinderGeometry args={[0.065, 0.045, 0.05, 7]} />
          </mesh>

          <mesh material={mats.ceramicPot} position={[0.24, 0.04, 0.10]}>
            <cylinderGeometry args={[0.03, 0.025, 0.08, 6]} />
          </mesh>

          <mesh material={mats.timberDark} position={[-0.04, 0.015, 0.12]}>
            <cylinderGeometry args={[0.035, 0.04, 0.03, 6]} />
          </mesh>
          <mesh material={mats.candleUnlit} position={[-0.04, 0.06, 0.12]}>
            <cylinderGeometry args={[0.01, 0.012, 0.07, 5]} />
          </mesh>
        </group>
      )}

      {hasBenches && (
        <group>

          <group position={[0, 0, 0.42]}>
            <mesh material={mats.timberPlanks} position={[0, 0.20, 0]}>
              <boxGeometry args={[0.88, 0.035, 0.20]} />
            </mesh>
            <mesh material={mats.timberDark} position={[-0.34, 0.09, 0]}>
              <boxGeometry args={[0.04, 0.18, 0.16]} />
            </mesh>
            <mesh material={mats.timberDark} position={[0.34, 0.09, 0]}>
              <boxGeometry args={[0.04, 0.18, 0.16]} />
            </mesh>
          </group>

          <group position={[0, 0, -0.42]}>
            <mesh material={mats.timberPlanks} position={[0, 0.20, 0]}>
              <boxGeometry args={[0.88, 0.035, 0.20]} />
            </mesh>
            <mesh material={mats.timberDark} position={[-0.34, 0.09, 0]}>
              <boxGeometry args={[0.04, 0.18, 0.16]} />
            </mesh>
            <mesh material={mats.timberDark} position={[0.34, 0.09, 0]}>
              <boxGeometry args={[0.04, 0.18, 0.16]} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}

export function RusticWallShelf({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.82,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>
      <mesh material={mats.timberPlanks} position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.03, 0.18]} />
      </mesh>
      <mesh material={mats.timberDark} position={[-width * 0.35, -0.07, -0.04]}>
        <boxGeometry args={[0.03, 0.12, 0.08]} />
      </mesh>
      <mesh material={mats.timberDark} position={[width * 0.35, -0.07, -0.04]}>
        <boxGeometry args={[0.03, 0.12, 0.08]} />
      </mesh>
      <mesh material={mats.ceramicPot} position={[-width * 0.25, 0.06, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.09, 6]} />
      </mesh>
      <mesh material={mats.ceramicPot} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.03, 0.025, 0.07, 6]} />
      </mesh>
      <mesh material={mats.driedHerbs} position={[width * 0.25, 0.05, 0]}>
        <dodecahedronGeometry args={[0.045, 0]} />
      </mesh>
    </group>
  );
}

export function RusticChest({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={position} rotation={rotation}>
      <mesh material={mats.timberDark} position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[0.54, 0.28, 0.34]} />
      </mesh>
      <mesh material={mats.timberDark} position={[0, 0.30, 0]}>
        <boxGeometry args={[0.56, 0.05, 0.36]} />
      </mesh>
      <mesh material={mats.ironHardware} position={[-0.18, 0.17, 0]}>
        <boxGeometry args={[0.03, 0.31, 0.35]} />
      </mesh>
      <mesh material={mats.ironHardware} position={[0.18, 0.17, 0]}>
        <boxGeometry args={[0.03, 0.31, 0.35]} />
      </mesh>
      <mesh material={mats.ironHardware} position={[0, 0.22, 0.18]}>
        <boxGeometry args={[0.06, 0.08, 0.02]} />
      </mesh>
    </group>
  );
}
