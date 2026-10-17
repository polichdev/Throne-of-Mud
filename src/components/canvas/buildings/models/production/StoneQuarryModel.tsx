import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const quarryStoneDarkGeo = (() => {
  const g = new THREE.BoxGeometry(3.92, 0.08, 2.92); g.translate(0, 0.04, 0);
  return toStandard(g);
})();

export const quarryStoneMedGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const tier1 = new THREE.BoxGeometry(1.90, 0.44, 1.40); tier1.translate(-0.85, 0.08 + 0.22, -0.65); geos.push(toStandard(tier1));
  const tier2 = new THREE.BoxGeometry(1.70, 0.40, 0.85); tier2.translate(-0.85, 0.08 + 0.60, -0.65 - 0.25); geos.push(toStandard(tier2));
  return mergeGeometries(geos) || geos[0];
})();

export const quarryStoneCutGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const b1 = new THREE.BoxGeometry(0.45, 0.32, 0.45); b1.translate(0.95 - 0.28, 0.08 + 0.18, 0.75); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(0.42, 0.28, 0.42); b2.translate(0.95 + 0.28, 0.08 + 0.16, 0.75); geos.push(toStandard(b2));
  const b3 = new THREE.BoxGeometry(0.40, 0.24, 0.38); b3.translate(0.95, 0.08 + 0.44, 0.75); geos.push(toStandard(b3));

  return mergeGeometries(geos) || geos[0];
})();

export const quarryStoneRawGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const r1 = new THREE.DodecahedronGeometry(0.22, 0); r1.translate(-0.15, 0.08 + 0.10, 0.85); geos.push(toStandard(r1));
  const r2 = new THREE.DodecahedronGeometry(0.16, 0); r2.translate(-0.15 + 0.22, 0.08 + 0.08, 0.85 + 0.10); geos.push(toStandard(r2));
  const r3 = new THREE.DodecahedronGeometry(0.15, 0); r3.translate(-0.15 - 0.20, 0.08 + 0.07, 0.85 - 0.08); geos.push(toStandard(r3));
  return mergeGeometries(geos) || geos[0];
})();

export const quarryTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const derrickM = new THREE.Matrix4().setPosition(1.05, 0.08, -0.45);

  const mast = new THREE.BoxGeometry(0.18, 2.50, 0.18);
  mast.applyMatrix4(new THREE.Matrix4().setPosition(0, 1.25, 0).premultiply(derrickM));
  geos.push(toStandard(mast));

  const s1 = new THREE.BoxGeometry(0.10, 1.15, 0.10);
  s1.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.58).setPosition(-0.28, 0.45, 0).premultiply(derrickM));
  geos.push(toStandard(s1));

  const s2 = new THREE.BoxGeometry(0.10, 1.15, 0.10);
  s2.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.58).setPosition(0.28, 0.45, 0).premultiply(derrickM));
  geos.push(toStandard(s2));

  const s3 = new THREE.BoxGeometry(0.10, 1.15, 0.10);
  s3.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.58).setPosition(0, 0.45, 0.28).premultiply(derrickM));
  geos.push(toStandard(s3));

  const boom = new THREE.BoxGeometry(0.14, 1.70, 0.14);
  boom.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.70).setPosition(-0.45, 2.05, 0).premultiply(derrickM));
  geos.push(toStandard(boom));

  const shedM = new THREE.Matrix4().setPosition(-1.10, 0.08, 0.55);
  for (const px of [-0.50, 0.50]) {
    const pBack = new THREE.BoxGeometry(0.08, 1.30, 0.08);
    pBack.applyMatrix4(new THREE.Matrix4().setPosition(px, 0.65, -0.32).premultiply(shedM));
    geos.push(toStandard(pBack));

    const pFront = new THREE.BoxGeometry(0.08, 1.00, 0.08);
    pFront.applyMatrix4(new THREE.Matrix4().setPosition(px, 0.50, 0.32).premultiply(shedM));
    geos.push(toStandard(pFront));
  }

  return mergeGeometries(geos) || geos[0];
})();

export const quarryTimberPlanksGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const derrickM = new THREE.Matrix4().setPosition(1.05, 0.08, -0.45);
  const drum = new THREE.CylinderGeometry(0.12, 0.12, 0.28, 8);
  drum.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0.12, 0.70, 0).premultiply(derrickM));
  geos.push(toStandard(drum));

  for (const z of [-0.18, 0.18]) {
    const runner = new THREE.BoxGeometry(1.10, 0.04, 0.08);
    runner.translate(0.95, 0.08 + 0.02, 0.75 + z);
    geos.push(toStandard(runner));
  }

  const bench = new THREE.BoxGeometry(0.90, 0.05, 0.45);
  bench.translate(-1.10, 0.08 + 0.26, 0.55);
  geos.push(toStandard(bench));

  return mergeGeometries(geos) || geos[0];
})();

export const quarrySteelGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const wx of [-0.40, 0.40]) {
    const w = new THREE.BoxGeometry(0.04, 0.12, 0.04);
    w.applyMatrix4(new THREE.Matrix4().makeRotationX(0.2).setPosition(-0.85 + wx, 0.08 + 0.82, -0.65 - 0.20));
    geos.push(toStandard(w));
  }

  const derrickM = new THREE.Matrix4().setPosition(1.05, 0.08, -0.45);
  const crank = new THREE.BoxGeometry(0.04, 0.22, 0.04);
  crank.applyMatrix4(new THREE.Matrix4().setPosition(0.28, 0.70, 0).premultiply(derrickM));
  geos.push(toStandard(crank));

  const sheave = new THREE.CylinderGeometry(0.10, 0.10, 0.05, 10);
  sheave.applyMatrix4(new THREE.Matrix4().setPosition(-0.95, 2.50, 0).premultiply(derrickM));
  geos.push(toStandard(sheave));

  const shedM = new THREE.Matrix4().setPosition(-1.10, 0.08, 0.55);
  const mallet = new THREE.BoxGeometry(0.16, 0.06, 0.06);
  mallet.applyMatrix4(new THREE.Matrix4().makeRotationY(0.4).setPosition(-0.20, 0.32, 0).premultiply(shedM));
  geos.push(toStandard(mallet));

  const chisel = new THREE.BoxGeometry(0.18, 0.04, 0.04);
  chisel.applyMatrix4(new THREE.Matrix4().makeRotationY(-0.3).setPosition(0.20, 0.31, 0).premultiply(shedM));
  geos.push(toStandard(chisel));

  return mergeGeometries(geos) || geos[0];
})();

export const quarryRoofGeo = (() => {
  const roof = new THREE.BoxGeometry(1.25, 0.07, 0.85);
  roof.applyMatrix4(new THREE.Matrix4().makeRotationX(0.24).setPosition(-1.10, 0.08 + 1.25, 0.55));
  return toStandard(roof);
})();

function QuarryAnimatedHoist({ isWorking = true }: { isWorking?: boolean }) {
  const hoistRef = useRef<THREE.Group>(null);
  const cableRef = useRef<THREE.Mesh>(null);
  const mats = SHARED_BUILDING_MATS;

  useFrame(({ clock }) => {
    if (!hoistRef.current || !cableRef.current) return;
    const t = isWorking ? clock.getElapsedTime() : 0;
    const hoistY = 0.52 + Math.sin(t * 1.2) * 0.32;
    hoistRef.current.position.y = hoistY;

    const pulleyTopY = 2.58;
    const cableLen = Math.max(0.2, pulleyTopY - hoistY);
    cableRef.current.position.y = hoistY + cableLen / 2;
    cableRef.current.scale.y = cableLen;
  });

  return (
    <group position={[0.10, 0, -0.45]}>
      <mesh ref={cableRef} material={mats.clothWhite} position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.0, 6]} />
      </mesh>
      <group ref={hoistRef} position={[0, 0.52, 0]}>
        <mesh material={mats.clothWhite} position={[0, 0.24, 0]}>
          <boxGeometry args={[0.57, 0.03, 0.52]} />
        </mesh>
        <mesh material={mats.stoneLight} position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[0.55, 0.45, 0.50]} />
        </mesh>
      </group>
    </group>
  );
}

export function StoneQuarryModel({
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
      <mesh geometry={quarryStoneDarkGeo} material={mats.stoneDark} receiveShadow />
      <mesh geometry={quarryStoneMedGeo} material={mats.stoneMed} castShadow receiveShadow />
      <mesh geometry={quarryStoneCutGeo} material={mats.stoneLight} receiveShadow />
      <mesh geometry={quarryStoneRawGeo} material={mats.stoneRaw} />
      <mesh geometry={quarryTimberDarkGeo} material={mats.timberDark} castShadow />
      <mesh geometry={quarryTimberPlanksGeo} material={mats.timberPlanks} receiveShadow />
      <mesh geometry={quarrySteelGeo} material={mats.ironSteel} />

      <QuarryAnimatedHoist isWorking={isWorking} />

      <mesh
        material={mats.timberLight}
        position={[-1.10 - 0.12, 0.40, 0.55]}
        rotation={[0, 0.4, 0]}
      >
        <boxGeometry args={[0.22, 0.03, 0.03]} />
      </mesh>

      <group ref={roofRef}>
        <mesh geometry={quarryRoofGeo} material={mats.shingleRoof} castShadow receiveShadow />
      </group>
    </group>
  );
}
