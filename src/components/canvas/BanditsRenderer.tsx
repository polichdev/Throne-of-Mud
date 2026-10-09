import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { characterEntities, type GameEntity } from '../../engine/ecs/world';
import { audioManager } from '../../engine/audio/AudioManager';

const BANDIT_RING_GEO = new THREE.RingGeometry(1.45, 1.62, 32);
const BANDIT_GLOW_GEO = new THREE.RingGeometry(1.38, 1.70, 32);
const BANDIT_FILL_GEO = new THREE.CircleGeometry(1.55, 32);

export const BanditsRenderer: React.FC = React.memo(() => {
  const isStrategicView = useGameStore((s) => s.isStrategicView);
  const selectedEntityId = useGameStore((s) => s.selectedEntityId);

  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  const [isParchmentMode, setIsParchmentMode] = useState(isStrategicView);
  const lastParchmentRef = useRef(isStrategicView);
  const [livingCount, setLivingCount] = useState(0);

  const currentLeaderRef = useRef<GameEntity | null>(null);

  useFrame(({ camera, clock }) => {
    const orthoCam = camera as THREE.OrthographicCamera;
    const zoom = (window as any).__lastCameraZoom ?? orthoCam.zoom ?? 38;
    const isParchment = isStrategicView || zoom <= 18.5;
    if (isParchment !== lastParchmentRef.current) {
      lastParchmentRef.current = isParchment;
      setIsParchmentMode(isParchment);
    }

    let leader: GameEntity | null = null;
    let count = 0;
    let sumX = 0;
    let sumZ = 0;

    for (const c of characterEntities) {
      if (c.isCharacter && (c.factionId === 'bandit' || c.characterClass === 'bandit')) {
        count++;
        const x = c.position ? c.position[0] : (c.gridPosition ? c.gridPosition[0] : 0);
        const z = c.position ? c.position[2] : (c.gridPosition ? c.gridPosition[1] : 0);
        sumX += x;
        sumZ += z;
        if (!leader || c.id.includes('leader') || c.title === 'Ватажок розбійників' || c.title === 'Ватажок') {
          leader = c;
        }
      }
    }

    currentLeaderRef.current = leader;
    if (count !== livingCount) {
      setLivingCount(count);
    }

    if (groupRef.current && count > 0) {
      const posX = leader?.position ? leader.position[0] : sumX / count;
      const posZ = leader?.position ? leader.position[2] : sumZ / count;
      groupRef.current.position.set(posX, 0, posZ);
    }

    if (ringRef.current) {
      const pulse = 0.97 + Math.sin(clock.elapsedTime * 4.0) * 0.04;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  if (livingCount === 0 || !currentLeaderRef.current) return null;

  const leader = currentLeaderRef.current;
  const isSelected = selectedEntityId === leader.id;
  const badgeY = isParchmentMode ? 6.35 : 2.4;
  const ringY = isParchmentMode ? 6.22 : 0.015;
  const fillPercent = Math.min(100, Math.round((livingCount / 8) * 100));

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    useGameStore.getState().setSelectedMilitiaSquadId(null);
    useGameStore.getState().setSelectedEntityId(leader.id);
    audioManager.playUIClick();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (useGameStore.getState().selectedEntityId === leader.id) {
      useGameStore.getState().setSelectedEntityId(null);
      audioManager.playUIPanelClose();
    }
  };

  return (
    <group ref={groupRef}>
      {isSelected && (
        <group ref={ringRef} position={[0, ringY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={BANDIT_FILL_GEO}>
            <meshBasicMaterial color="#e11d48" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh geometry={BANDIT_RING_GEO}>
            <meshBasicMaterial color="#f43f5e" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh geometry={BANDIT_GLOW_GEO}>
            <meshBasicMaterial color="#fb7185" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      )}

      <Html
        position={[0, badgeY, 0]}
        center
        zIndexRange={[50, 0]}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          onClick={handleSelect}
          onContextMenu={handleCancel}
          className={`group flex flex-col items-center select-none pointer-events-auto cursor-pointer transition-all duration-200 ${
            isParchmentMode ? 'scale-105' : isSelected ? 'scale-115 -translate-y-1' : 'hover:scale-110'
          }`}
          title="Загін лісових розбійників"
        >
          <div
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? 'border-[2.5px] border-rose-500 ring-2 ring-rose-500/80 shadow-[0_0_18px_rgba(244,63,94,0.85),0_4px_12px_rgba(0,0,0,0.9)] bg-gradient-to-b from-[#2a0e14] to-[#120508]'
                : 'border-[2.5px] border-[#a8a29e] hover:border-rose-400 shadow-[0_4px_10px_rgba(20,5,5,0.85)] bg-gradient-to-b from-[#221815] to-[#140e0c]'
            }`}
          >
            <div
              className={`absolute inset-[2.5px] rounded-full pointer-events-none transition-colors duration-200 ${
                isSelected ? 'border border-rose-500/50' : 'border border-white/20'
              }`}
            />
            <span className="text-xl leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none">💀</span>
          </div>

          {!isParchmentMode && (
            <div className="w-9 h-1.5 bg-black/90 rounded-full mt-1 overflow-hidden border border-stone-700/80 shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          )}
        </div>
      </Html>
    </group>
  );
});

BanditsRenderer.displayName = 'BanditsRenderer';
