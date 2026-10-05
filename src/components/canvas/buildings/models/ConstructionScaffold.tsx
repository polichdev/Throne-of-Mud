import { useState, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SHARED_BUILDING_MATS } from '../buildingMaterials';
import { useGameStore } from '../../../../store/useGameStore';

const _tempVec = new THREE.Vector3();

interface ConstructionScaffoldProps {
  type: string;
  width: number;
  height: number;
  progress: number;
  progressTextRef: RefObject<HTMLSpanElement | null>;
  progressBarRef: RefObject<HTMLDivElement | null>;
}

export function ConstructionScaffold({
  type,
  width,
  height,
  progress,
  progressTextRef,
  progressBarRef,
}: ConstructionScaffoldProps) {
  const mats = SHARED_BUILDING_MATS;
  const isMinimal =
    type === 'wooden_wall' ||
    type === 'wooden_gate' ||
    type === 'stone_wall' ||
    type === 'wheat_farm' ||
    type === 'campfire';

  return (
    <group>
      {!isMinimal && (
        <mesh material={mats.richSoil} position={[0, 0.02, 0]} receiveShadow>
          <boxGeometry args={[width * 0.95, 0.04, height * 0.95]} />
        </mesh>
      )}

      {!isMinimal && (
        <mesh material={mats.stoneMed} position={[0, 0.08, 0]} receiveShadow >
          <boxGeometry args={[width * 0.88, 0.08, height * 0.88]} />
        </mesh>
      )}

      {[
        [-width * 0.42, -height * 0.42],
        [width * 0.42, -height * 0.42],
        [-width * 0.42, height * 0.42],
        [width * 0.42, height * 0.42],
      ].map(([px, pz], idx) => (
        <group key={`scaff-post-${idx}`} position={[px, 0.6, pz]}>
          <mesh material={mats.timberDark} >
            <cylinderGeometry args={[0.04, 0.05, 1.2, 5]} />
          </mesh>
        </group>
      ))}

      <mesh material={mats.timberLight} position={[0, 1.1, -height * 0.42]} >
        <boxGeometry args={[width * 0.88, 0.05, 0.05]} />
      </mesh>
      <mesh material={mats.timberLight} position={[0, 1.1, height * 0.42]} >
        <boxGeometry args={[width * 0.88, 0.05, 0.05]} />
      </mesh>
      <mesh material={mats.timberLight} position={[-width * 0.42, 1.1, 0]} >
        <boxGeometry args={[0.05, 0.05, height * 0.88]} />
      </mesh>
      <mesh material={mats.timberLight} position={[width * 0.42, 1.1, 0]} >
        <boxGeometry args={[0.05, 0.05, height * 0.88]} />
      </mesh>

      <mesh material={mats.timberLight} position={[0, 0.55, -height * 0.42]} >
        <boxGeometry args={[width * 0.88, 0.04, 0.04]} />
      </mesh>
      <mesh material={mats.timberLight} position={[0, 0.55, height * 0.42]} >
        <boxGeometry args={[width * 0.88, 0.04, 0.04]} />
      </mesh>

      <mesh material={mats.timberMed} position={[0, 0.58, height * 0.35]} receiveShadow>
        <boxGeometry args={[width * 0.75, 0.03, 0.22]} />
      </mesh>

      <group position={[width * 0.44, 0.5, 0]} rotation={[0, 0, -0.25]}>
        <mesh material={mats.timberLight} position={[-0.08, 0, 0]} >
          <boxGeometry args={[0.03, 1.1, 0.03]} />
        </mesh>
        <mesh material={mats.timberLight} position={[0.08, 0, 0]} >
          <boxGeometry args={[0.03, 1.1, 0.03]} />
        </mesh>
        {[-0.35, -0.15, 0.05, 0.25, 0.45].map((ry, i) => (
          <mesh key={`rung-${i}`} material={mats.timberLight} position={[0, ry, 0]} >
            <boxGeometry args={[0.18, 0.02, 0.02]} />
          </mesh>
        ))}
      </group>

      {progress > 5 && (
        <mesh material={mats.timberDark} position={[0, 0.1 + (progress / 100) * 0.3, 0]} receiveShadow>
          <boxGeometry args={[width * 0.78, Math.max(0.1, (progress / 100) * 0.6), height * 0.78]} />
        </mesh>
      )}

      <group position={[-width * 0.35, 0, height * 0.35]}>
        <mesh material={mats.timberLight} position={[0, 0.06, 0]} rotation={[0, 0.15, 0]} >
          <boxGeometry args={[0.15, 0.08, 0.6]} />
        </mesh>
        <mesh material={mats.timberLight} position={[0.08, 0.12, 0]} rotation={[0, -0.1, 0]} >
          <boxGeometry args={[0.15, 0.06, 0.55]} />
        </mesh>
      </group>

      <mesh material={mats.timberMed} position={[width * 0.32, 0.1, -height * 0.32]} >
        <boxGeometry args={[0.2, 0.18, 0.2]} />
      </mesh>

      <mesh material={mats.blueprintGhost} position={[0, 0.5, 0]}>
        <boxGeometry args={[width * 0.8, 0.9, height * 0.8]} />
      </mesh>
      <mesh material={mats.blueprintGhost} position={[0, 1.15, height * 0.2]} rotation={[-0.85, 0, 0]}>
        <boxGeometry args={[width * 0.85, height * 0.55, 0.05]} />
      </mesh>
      <mesh material={mats.blueprintGhost} position={[0, 1.15, -height * 0.2]} rotation={[0.85, 0, 0]}>
        <boxGeometry args={[width * 0.85, height * 0.55, 0.05]} />
      </mesh>

      <ConstructionHUD
        progress={progress}
        progressTextRef={progressTextRef}
        progressBarRef={progressBarRef}
      />
    </group>
  );
}

function ConstructionHUD({
  progress,
  progressTextRef,
  progressBarRef,
}: {
  progress: number;
  progressTextRef: RefObject<HTMLSpanElement | null>;
  progressBarRef: RefObject<HTMLDivElement | null>;
}) {
  const isStrategicView = useGameStore((s) => s.isStrategicView);
  const [inView, setInView] = useState(true);
  const frameCount = useRef(0);
  const inViewRef = useRef(true);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (isStrategicView) {
      if (inViewRef.current) {
        inViewRef.current = false;
        setInView(false);
      }
      return;
    }

    frameCount.current++;
    if (frameCount.current % 12 === 0 || frameCount.current === 1) {
      const zoom = (window as any).__lastCameraZoom ?? (camera as THREE.OrthographicCamera).zoom ?? 38;
      const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
      if (camTarget && groupRef.current) {
        groupRef.current.getWorldPosition(_tempVec);
        const distSq = (_tempVec.x - camTarget[0]) ** 2 + (_tempVec.z - camTarget[1]) ** 2;
        const maxDist = Math.max(50, (1800 / zoom) + 16);
        const shouldBeInView = zoom >= 12 && distSq < maxDist * maxDist;
        if (shouldBeInView !== inViewRef.current) {
          inViewRef.current = shouldBeInView;
          setInView(shouldBeInView);
        }
      }
    }
  });

  if (isStrategicView || !inView) {
    return <group ref={groupRef} />;
  }

  return (
    <group ref={groupRef}>
      <Html position={[0, 1.45, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div className="bg-slate-950 text-amber-300 text-[11px] px-3 py-1.5 rounded-xl border border-amber-500/70 shadow-2xl font-mono flex items-center gap-2 whitespace-nowrap pointer-events-none">
          <span ref={progressTextRef} className="font-bold flex items-center gap-1 text-amber-400">
            🔨 {Math.round(progress)}%
          </span>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-200 shadow-sm"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

interface DemolitionHUDProps {
  demolitionProgress: number;
  progressTextRef: RefObject<HTMLSpanElement | null>;
  progressBarRef: RefObject<HTMLDivElement | null>;
}

export function DemolitionHUD({
  demolitionProgress,
  progressTextRef,
  progressBarRef,
}: DemolitionHUDProps) {
  const isStrategicView = useGameStore((s) => s.isStrategicView);
  const [inView, setInView] = useState(true);
  const frameCount = useRef(0);
  const inViewRef = useRef(true);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (isStrategicView) {
      if (inViewRef.current) {
        inViewRef.current = false;
        setInView(false);
      }
      return;
    }

    frameCount.current++;
    if (frameCount.current % 12 === 0 || frameCount.current === 1) {
      const zoom = (window as any).__lastCameraZoom ?? (camera as THREE.OrthographicCamera).zoom ?? 38;
      const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
      if (camTarget && groupRef.current) {
        groupRef.current.getWorldPosition(_tempVec);
        const distSq = (_tempVec.x - camTarget[0]) ** 2 + (_tempVec.z - camTarget[1]) ** 2;
        const maxDist = Math.max(50, (1800 / zoom) + 16);
        const shouldBeInView = zoom >= 12 && distSq < maxDist * maxDist;
        if (shouldBeInView !== inViewRef.current) {
          inViewRef.current = shouldBeInView;
          setInView(shouldBeInView);
        }
      }
    }
  });

  if (isStrategicView || !inView) {
    return <group ref={groupRef} />;
  }

  return (
    <group ref={groupRef}>
      <Html position={[0, 1.45, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div className="bg-slate-950 text-rose-300 text-[11px] px-3 py-1.5 rounded-xl border border-rose-500/70 shadow-2xl font-mono flex items-center gap-2 whitespace-nowrap pointer-events-none">
          <span ref={progressTextRef} className="font-bold flex items-center gap-1 text-rose-400">
            💣 {Math.round(demolitionProgress)}%
          </span>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-200 shadow-sm"
              style={{ width: `${Math.max(4, demolitionProgress)}%` }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}
