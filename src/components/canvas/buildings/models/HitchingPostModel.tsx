import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SHARED_BUILDING_MATS } from '../buildingMaterials';
import { characterEntities } from '../../../../engine/ecs/world';
import type { GameEntity } from '../../../../engine/ecs/world';

const MULE_MATS = {
  muleCoat: new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.85, flatShading: true }),
  muleMuzzle: new THREE.MeshStandardMaterial({ color: '#d6d3d1', roughness: 0.9, flatShading: true }),
  muleHarness: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.7, flatShading: true }),
  muleHoof: new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.9, flatShading: true }),
  hay: new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.9, flatShading: true }),
  water: new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 }),
  lanternOn: new THREE.MeshBasicMaterial({ color: '#fbbf24' }),
  lanternOff: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5 }),
};

function TiedMule({
  position,
  rotation = [0, 0, 0],
  headOffset = 0,
  innerRef,
  defaultVisible = true,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  headOffset?: number;
  innerRef?: React.RefObject<THREE.Group | null>;
  defaultVisible?: boolean;
}) {
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + headOffset;
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 1.5) * 0.06 + 0.05;
      headRef.current.rotation.y = Math.cos(t * 0.8) * 0.05;
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 3.0) * 0.12;
    }
  });

  return (
    <group ref={innerRef} position={position} rotation={rotation} visible={defaultVisible}>
      <mesh material={MULE_MATS.muleCoat} position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.34, 0.6]} />
      </mesh>

      <mesh material={MULE_MATS.muleHarness} position={[0, 0.44, 0.02]}>
        <boxGeometry args={[0.32, 0.2, 0.24]} />
      </mesh>

      <group position={[0, 0.48, -0.24]}>
        <mesh material={MULE_MATS.muleCoat} position={[0, 0.14, -0.06]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.28, 0.18]} />
        </mesh>

        <group ref={headRef} position={[0, 0.26, -0.12]}>
          <mesh material={MULE_MATS.muleCoat} position={[0, 0, -0.06]} castShadow>
            <boxGeometry args={[0.18, 0.18, 0.24]} />
          </mesh>
          <mesh material={MULE_MATS.muleMuzzle} position={[0, -0.04, -0.18]}>
            <boxGeometry args={[0.14, 0.12, 0.12]} />
          </mesh>
          <mesh material={MULE_MATS.muleCoat} position={[-0.07, 0.14, 0.02]} rotation={[0, 0, -0.22]} castShadow>
            <boxGeometry args={[0.04, 0.22, 0.07]} />
          </mesh>
          <mesh material={MULE_MATS.muleCoat} position={[0.07, 0.14, 0.02]} rotation={[0, 0, 0.22]} castShadow>
            <boxGeometry args={[0.04, 0.22, 0.07]} />
          </mesh>
        </group>
      </group>

      {[
        [-0.11, 0.18, -0.2],
        [0.11, 0.18, -0.2],
        [-0.11, 0.18, 0.2],
        [0.11, 0.18, 0.2],
      ].map(([lx, ly, lz], idx) => (
        <group key={`leg-${idx}`} position={[lx, ly, lz]}>
          <mesh material={MULE_MATS.muleCoat} position={[0, 0, 0]}>
            <boxGeometry args={[0.08, 0.36, 0.08]} />
          </mesh>
          <mesh material={MULE_MATS.muleHoof} position={[0, -0.16, 0]}>
            <boxGeometry args={[0.09, 0.06, 0.09]} />
          </mesh>
        </group>
      ))}

      <group ref={tailRef} position={[0, 0.5, 0.3]}>
        <mesh material={MULE_MATS.muleCoat} position={[0, -0.14, 0.04]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.04]} />
        </mesh>
      </group>

      <mesh material={MULE_MATS.muleHarness} position={[0, 0.52, -0.42]} rotation={[0.42, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.32, 4]} />
      </mesh>
    </group>
  );
}

export function HitchingPostModel({
  isLightOn = false,
  building,
  mulesCount = 1,
}: {
  isLightOn?: boolean;
  mulesCount?: number;
  roofRef?: React.RefObject<THREE.Group | null>;
  building?: GameEntity;
}) {
  const mats = SHARED_BUILDING_MATS;

  const mule1Ref = useRef<THREE.Group>(null);
  const mule2Ref = useRef<THREE.Group>(null);
  const mule3Ref = useRef<THREE.Group>(null);

  useFrame(() => {
    let inUse = 0;
    if (building) {
      for (const c of characterEntities) {
        if ((c.hasMule || c.muleTransition === 'taking' || c.muleTransition === 'returning') && c.assignedMuleHutId === building.id) inUse++;
      }
    }
    const total = building?.mulesCount ?? mulesCount ?? 1;
    const available = Math.max(0, total - inUse);

    if (mule1Ref.current) mule1Ref.current.visible = available >= 1;
    if (mule2Ref.current) mule2Ref.current.visible = available >= 2;
    if (mule3Ref.current) mule3Ref.current.visible = available >= 3;
  });

  return (
    <group>
      <mesh material={mats.richSoil} position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[2.8, 0.04, 1.8]} />
      </mesh>
      <mesh material={MULE_MATS.hay} position={[0, 0.045, 0]} receiveShadow>
        <boxGeometry args={[2.5, 0.03, 1.5]} />
      </mesh>

      {[-1.0, 0, 1.0].map((px, idx) => (
        <group key={`post-${idx}`} position={[px, 0.5, -0.2]}>
          <mesh material={mats.timberDark} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 1.0, 6]} />
          </mesh>
        </group>
      ))}

      <mesh material={mats.timberMed} position={[0, 0.8, -0.2]} castShadow>
        <boxGeometry args={[2.4, 0.07, 0.07]} />
      </mesh>
      <mesh material={mats.timberMed} position={[0, 0.42, -0.2]} castShadow>
        <boxGeometry args={[2.4, 0.05, 0.05]} />
      </mesh>

      <group position={[0, 0.25, -0.5]}>
        <mesh material={mats.timberDark} position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.22, 0.32]} />
        </mesh>
        <mesh material={MULE_MATS.hay} position={[0, 0.08, 0]}>
          <boxGeometry args={[1.7, 0.12, 0.26]} />
        </mesh>
      </group>

      <group position={[-1.1, 0.15, 0.45]}>
        <mesh material={mats.timberDark} position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.16, 0.28, 8]} />
        </mesh>
        <mesh material={MULE_MATS.water} position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.04, 8]} />
        </mesh>
      </group>

      <group position={[1.0, 0.75, -0.2]}>
        <mesh material={mats.timberDark} position={[0, 0.08, 0.1]}>
          <boxGeometry args={[0.04, 0.04, 0.18]} />
        </mesh>
        <mesh material={isLightOn ? MULE_MATS.lanternOn : MULE_MATS.lanternOff} position={[0, -0.05, 0.16]}>
          <boxGeometry args={[0.09, 0.13, 0.09]} />
        </mesh>
        {isLightOn && (
          <pointLight color="#f59e0b" intensity={0.8} distance={3.5} position={[0, -0.05, 0.16]} />
        )}
      </group>

      <TiedMule innerRef={mule1Ref} position={[0, 0, 0.42]} headOffset={0} defaultVisible={true} />
      <TiedMule innerRef={mule2Ref} position={[-0.75, 0, 0.42]} headOffset={1.2} defaultVisible={false} />
      <TiedMule innerRef={mule3Ref} position={[0.75, 0, 0.42]} headOffset={2.5} defaultVisible={false} />
    </group>
  );
}
