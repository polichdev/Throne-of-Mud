import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { characterEntities } from '../../engine/ecs/world';
import { GridMap } from '../../engine/grid/GridMap';
import { audioManager } from '../../engine/audio/AudioManager';
import { isMilitiaDestinationAllowed } from '../../engine/combat/formationUtils';
import type { MilitiaSquad } from '../../types/game';

interface MilitiaMarchRendererProps {
  grid?: GridMap;
}

const UNIFIED_CIRCLE_GEO = new THREE.CircleGeometry(2.15, 40);
const UNIFIED_RING_GEO = new THREE.RingGeometry(2.05, 2.22, 40);
const UNIFIED_GLOW_RING_GEO = new THREE.RingGeometry(1.96, 2.30, 40);

export const MilitiaMarchRenderer: React.FC<MilitiaMarchRendererProps> = React.memo(({ grid }) => {
  const isStrategicView = useGameStore((s) => s.isStrategicView);
  const selectedMilitiaSquadId = useGameStore((s) => s.selectedMilitiaSquadId);
  const militiaSquads = useGameStore((s) => s.militiaSquads);
  const hoveredTile = useGameStore((s) => s.hoveredTile);

  const [isParchmentMode, setIsParchmentMode] = useState(isStrategicView);
  const lastParchmentRef = useRef(isStrategicView);

  useEffect(() => {
    setIsParchmentMode(isStrategicView);
    lastParchmentRef.current = isStrategicView;
  }, [isStrategicView]);

  useFrame(({ camera }) => {
    const orthoCam = camera as THREE.OrthographicCamera;
    const zoom = (window as any).__lastCameraZoom ?? orthoCam.zoom ?? 38;
    const isParchment = isStrategicView || zoom <= 18.5;
    if (isParchment !== lastParchmentRef.current) {
      lastParchmentRef.current = isParchment;
      setIsParchmentMode(isParchment);
    }
  });

  return (
    <group>
      {selectedMilitiaSquadId && hoveredTile && (
        <SquadCursorPreviewLine
          squadId={selectedMilitiaSquadId}
          hoveredTile={hoveredTile}
          isParchment={isParchmentMode}
          grid={grid}
        />
      )}

      {militiaSquads.map((squad) => (
        <SquadVisuals
          key={`squad-vis-${squad.id}`}
          squad={squad}
          isSelected={selectedMilitiaSquadId === squad.id}
          isParchment={isParchmentMode}
          grid={grid}
        />
      ))}
    </group>
  );
});

MilitiaMarchRenderer.displayName = 'MilitiaMarchRenderer';

function KnightIcon({
  isSwordsmen,
  isSelected,
}: {
  isSwordsmen: boolean;
  isSelected?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-transform duration-150"
    >
      <defs>
        <linearGradient id="knightSteel" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="25%" stopColor="#e2e8f0" />
          <stop offset="65%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="knightGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id="knightWeapon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      {isSwordsmen ? (
        <g opacity="0.85">
          <line x1="5" y1="5" x2="27" y2="27" stroke="url(#knightWeapon)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="7" y1="10" x2="10" y2="7" stroke="url(#knightGold)" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="26" cy="26" r="1.3" fill="url(#knightGold)" />

          <line x1="27" y1="5" x2="5" y2="27" stroke="url(#knightWeapon)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="25" y1="10" x2="22" y2="7" stroke="url(#knightGold)" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="6" cy="26" r="1.3" fill="url(#knightGold)" />
        </g>
      ) : (
        <g opacity="0.85">
          <line x1="4" y1="4" x2="28" y2="28" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
          <polygon points="4,4 8,5 5,8" fill="url(#knightWeapon)" />

          <line x1="28" y1="4" x2="4" y2="28" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
          <polygon points="28,4 24,5 27,8" fill="url(#knightWeapon)" />
        </g>
      )}

      <path d="M16 2.5 L18 6 H14 Z" fill="url(#knightGold)" />
      <circle cx="16" cy="3.5" r="1.1" fill="#fef08a" />

      <path
        d="M9.5 13.5 C9.5 7.8 12.4 5 16 5 C19.6 5 22.5 7.8 22.5 13.5 L23 19.5 C23 21.8 21 24.5 16 24.5 C11 24.5 9 21.8 9 19.5 Z"
        fill="url(#knightSteel)"
        stroke={isSelected ? '#f59e0b' : '#1e293b'}
        strokeWidth="0.8"
      />

      <path
        d="M9 12.8 C12.2 11.8 19.8 11.8 23 12.8 L23.2 14.8 C19.8 13.8 12.2 13.8 8.8 14.8 Z"
        fill="url(#knightGold)"
      />

      <rect x="10.8" y="15" width="10.4" height="1.8" rx="0.4" fill="#090d16" />
      <rect x="15.2" y="15" width="1.6" height="7.2" rx="0.4" fill="#090d16" />

      <circle cx="12.2" cy="18.5" r="0.6" fill="#090d16" />
      <circle cx="13.8" cy="18.5" r="0.6" fill="#090d16" />
      <circle cx="12.2" cy="20.5" r="0.6" fill="#090d16" />
      <circle cx="13.8" cy="20.5" r="0.6" fill="#090d16" />

      <circle cx="18.2" cy="18.5" r="0.6" fill="#090d16" />
      <circle cx="19.8" cy="18.5" r="0.6" fill="#090d16" />
      <circle cx="18.2" cy="20.5" r="0.6" fill="#090d16" />
      <circle cx="19.8" cy="20.5" r="0.6" fill="#090d16" />

      <path
        d="M10 23 C12.4 25.8 19.6 25.8 22 23 L23.4 25.4 C19.6 28.2 12.4 28.2 8.6 25.4 Z"
        fill="url(#knightGold)"
      />
    </svg>
  );
}

function SquadVisuals({
  squad,
  isSelected,
  isParchment,
  grid,
}: {
  squad: MilitiaSquad;
  isSelected: boolean;
  isParchment: boolean;
  grid?: GridMap;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  const [livingCount, setLivingCount] = useState(() => {
    let count = 0;
    for (const c of characterEntities) {
      if (c.isCharacter && c.isLevy && (c.militiaSquadId === squad.id || squad.memberIds.includes(c.id))) {
        count++;
      }
    }
    return count;
  });

  useFrame(({ clock }) => {
    let sumX = 0;
    let sumZ = 0;
    let count = 0;
    for (const c of characterEntities) {
      if (c.isCharacter && c.isLevy && (c.militiaSquadId === squad.id || squad.memberIds.includes(c.id))) {
        const x = c.position ? c.position[0] : (c.gridPosition ? c.gridPosition[0] : 0);
        const z = c.position ? c.position[2] : (c.gridPosition ? c.gridPosition[1] : 0);
        sumX += x;
        sumZ += z;
        count++;
      }
    }

    if (groupRef.current && count > 0) {
      groupRef.current.position.set(sumX / count, 0, sumZ / count);
    }

    if (ringRef.current && isSelected) {
      const pulse = 0.98 + Math.sin(clock.elapsedTime * 3.5) * 0.035;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }

    if (count !== livingCount) {
      setLivingCount(count);
    }

    if (squad.activeMarch) {
      let anyMoving = false;
      for (const c of characterEntities) {
        if (c.isCharacter && c.isLevy && (c.militiaSquadId === squad.id || squad.memberIds.includes(c.id))) {
          if (c.path && c.path.length > 0) {
            anyMoving = true;
            break;
          }
        }
      }
      if (!anyMoving) {
        useGameStore.getState().clearMilitiaSquadMarch(squad.id);
      }
    }
  });

  if (livingCount === 0) return null;

  const isSwordsmen = squad.type === 'swordsmen';
  const ringColor = isSwordsmen ? '#f59e0b' : '#38bdf8';
  const maxMembers = squad.maxMembers || 5;
  const fillPercent = Math.min(100, Math.round((livingCount / maxMembers) * 100));

  const handleSelectSquad = (e: React.MouseEvent) => {
    e.stopPropagation();
    useGameStore.getState().syncMilitiaSquadsFromWorld();
    useGameStore.getState().setSelectedEntityId(null);
    useGameStore.getState().setSelectedMilitiaSquadId(squad.id);
    useGameStore.getState().setActiveMenuTab('military');
    audioManager.playUIClick();
  };

  const handleCancelSquad = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    useGameStore.getState().setSelectedMilitiaSquadId(null);
    if (useGameStore.getState().activeMenuTab === 'military') {
      useGameStore.getState().setActiveMenuTab(null);
    }
    useGameStore.getState().setHoveredTile(null);
    audioManager.playUIPanelClose();
  };

  const badgeY = isParchment ? 6.35 : 2.4;
  const ringY = isParchment ? 6.22 : 0.015;

  return (
    <>
      <group ref={groupRef}>
        {isSelected && (
          <group ref={ringRef} position={[0, ringY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={UNIFIED_CIRCLE_GEO}>
              <meshBasicMaterial color={ringColor} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh geometry={UNIFIED_RING_GEO}>
              <meshBasicMaterial color={ringColor} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh geometry={UNIFIED_GLOW_RING_GEO}>
              <meshBasicMaterial color={ringColor} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
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
            onClick={handleSelectSquad}
            onContextMenu={handleCancelSquad}
            className={`group flex flex-col items-center select-none pointer-events-auto cursor-pointer transition-all duration-200 ${
              isParchment ? 'scale-105' : isSelected ? 'scale-115 -translate-y-1' : 'hover:scale-110'
            }`}
            title={squad.name}
          >
            <div
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSelected
                  ? 'border-[2.5px] border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.85),0_4px_12px_rgba(0,0,0,0.9)]'
                  : 'border-[2.5px] border-[#a8a29e] hover:border-amber-300 shadow-[0_4px_10px_rgba(20,12,5,0.75)]'
              } bg-gradient-to-b from-[#25221e] to-[#141210]`}
            >
              <div
                className={`absolute inset-[2.5px] rounded-full pointer-events-none transition-colors duration-200 ${
                  isSelected ? 'border border-amber-400/50' : 'border border-white/20'
                }`}
              />

              <KnightIcon isSwordsmen={isSwordsmen} isSelected={isSelected} />
            </div>

            {!isParchment && (
              <div className="w-9 h-1.5 bg-black/90 rounded-full mt-1 overflow-hidden border border-stone-700/80 shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                <div
                  className={`h-full transition-all duration-300 ${
                    fillPercent > 50
                      ? 'bg-[#22c55e]'
                      : fillPercent > 25
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            )}
          </div>
        </Html>
      </group>

      {squad.activeMarch && (
        <SquadMarchVisuals squad={squad} isParchment={isParchment} grid={grid} />
      )}
    </>
  );
}

function SquadCursorPreviewLine({
  squadId,
  hoveredTile,
  isParchment,
  grid,
}: {
  squadId: string;
  hoveredTile: [number, number];
  isParchment: boolean;
  grid?: GridMap;
}) {
  const groundRingRef = useRef<THREE.Mesh>(null);

  const squadCenter = useMemo<[number, number] | null>(() => {
    let sumX = 0;
    let sumZ = 0;
    let count = 0;
    for (const c of characterEntities) {
      if (c.isCharacter && c.isLevy && c.militiaSquadId === squadId) {
        const x = c.position ? c.position[0] : (c.gridPosition ? c.gridPosition[0] : 0);
        const z = c.position ? c.position[2] : (c.gridPosition ? c.gridPosition[1] : 0);
        sumX += x;
        sumZ += z;
        count++;
      }
    }
    if (count === 0) return null;
    return [sumX / count, sumZ / count];
  }, [squadId, hoveredTile]);

  const isAllowed = useMemo(() => {
    if (!grid) return true;
    const { playerRegionId = 0, regions } = useGameStore.getState();
    const pRegion = regions.find((r) => r.id === (playerRegionId ?? 0));
    return isMilitiaDestinationAllowed(grid, hoveredTile[0], hoveredTile[1], pRegion?.bounds);
  }, [grid, hoveredTile]);

  const targetX = hoveredTile[0] + 0.5;
  const targetZ = hoveredTile[1] + 0.5;
  const tileH = grid ? (grid.getTile(hoveredTile[0], hoveredTile[1])?.height || 0.0) : 0.0;
  const lineY = isParchment ? 6.25 : Math.max(0.06, tileH + 0.05);
  const ringY = isParchment ? 6.24 : Math.max(0.025, tileH + 0.025);

  const points = useMemo(() => {
    if (!isAllowed || !squadCenter) return null;
    const dist = Math.hypot(targetX - squadCenter[0], targetZ - squadCenter[1]);
    if (dist < 0.6) return null;

    return [
      new THREE.Vector3(squadCenter[0], lineY, squadCenter[1]),
      new THREE.Vector3(targetX, lineY, targetZ),
    ];
  }, [squadCenter, targetX, targetZ, lineY]);

  const previewLine = useMemo(() => {
    if (!points) return null;
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: isParchment ? '#b45309' : '#fef08a',
      dashSize: 0.45,
      gapSize: 0.32,
      transparent: true,
      opacity: isParchment ? 0.75 : 0.55,
      depthWrite: false,
    });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    return line;
  }, [points, isParchment]);

  useEffect(() => {
    return () => {
      if (previewLine) {
        previewLine.geometry.dispose();
        (previewLine.material as THREE.Material)?.dispose();
      }
    };
  }, [previewLine]);

  useFrame(({ clock }) => {
    if (groundRingRef.current) {
      const pulse = 0.65 + Math.sin(clock.elapsedTime * 6) * 0.2;
      (groundRingRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  if (!previewLine) return null;

  return (
    <group raycast={() => null}>
      <primitive object={previewLine} />

      <mesh
        ref={groundRingRef}
        position={[targetX, ringY, targetZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <ringGeometry args={[0.35, 0.55, 28]} />
        <meshBasicMaterial color={isParchment ? '#b45309' : '#fbbf24'} transparent opacity={0.75} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh
        position={[targetX, ringY - 0.002, targetZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color={isParchment ? '#b45309' : '#fbbf24'} transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SquadMarchVisuals({
  squad,
  isParchment,
  grid,
}: {
  squad: MilitiaSquad;
  isParchment: boolean;
  grid?: GridMap;
}) {
  const march = squad.activeMarch;
  if (!march) return null;

  const [tx, tz] = march.targetPos;
  const targetWorldX = tx + 0.5;
  const targetWorldZ = tz + 0.5;
  const tileH = grid ? (grid.getTile(tx, tz)?.height || 0.0) : 0.0;
  const lineY = isParchment ? 6.25 : Math.max(0.06, tileH + 0.05);
  const flagY = isParchment ? 6.23 : Math.max(0.025, tileH + 0.025);

  const pathPoints = useMemo(() => {
    let sumX = 0;
    let sumZ = 0;
    let count = 0;
    for (const c of characterEntities) {
      if (c.isCharacter && c.isLevy && (c.militiaSquadId === squad.id || squad.memberIds.includes(c.id))) {
        const x = c.position ? c.position[0] : (c.gridPosition ? c.gridPosition[0] : 0);
        const z = c.position ? c.position[2] : (c.gridPosition ? c.gridPosition[1] : 0);
        sumX += x;
        sumZ += z;
        count++;
      }
    }

    const pts: THREE.Vector3[] = [];
    if (count > 0) {
      pts.push(new THREE.Vector3(sumX / count, lineY, sumZ / count));
    }

    if (march.path && march.path.length > 0) {
      for (const [wx, wz] of march.path) {
        pts.push(new THREE.Vector3(wx + 0.5, lineY, wz + 0.5));
      }
    }

    pts.push(new THREE.Vector3(targetWorldX, lineY, targetWorldZ));
    return pts;
  }, [march, squad, targetWorldX, targetWorldZ, lineY]);

  const marchLine = useMemo(() => {
    if (pathPoints.length < 2) return null;
    const geom = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const mat = new THREE.LineDashedMaterial({
      color: isParchment ? '#b45309' : (squad.type === 'swordsmen' ? '#f59e0b' : '#38bdf8'),
      dashSize: 0.55,
      gapSize: 0.35,
      transparent: true,
      opacity: isParchment ? 0.8 : 0.6,
      depthWrite: false,
    });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    return line;
  }, [pathPoints, squad.type, isParchment]);

  useEffect(() => {
    return () => {
      if (marchLine) {
        marchLine.geometry.dispose();
        (marchLine.material as THREE.Material)?.dispose();
      }
    };
  }, [marchLine]);

  return (
    <group>
      {marchLine && <primitive object={marchLine} />}

      <MilitiaFlagMarker
        x={targetWorldX}
        y={flagY}
        z={targetWorldZ}
        facingAngle={march.facingAngle}
        isSwordsmen={squad.type === 'swordsmen'}
      />
    </group>
  );
}

function MilitiaFlagMarker({
  x,
  y = 0,
  z,
  facingAngle,
  isSwordsmen,
}: {
  x: number;
  y?: number;
  z: number;
  facingAngle: number;
  isSwordsmen: boolean;
}) {
  const pennantRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (pennantRef.current) {
      pennantRef.current.rotation.y = Math.sin(clock.elapsedTime * 6) * 0.12;
    }
    if (ringRef.current) {
      const pulse = 0.65 + Math.sin(clock.elapsedTime * 4) * 0.25;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  const bannerColor = isSwordsmen ? '#dc2626' : '#f59e0b';
  const ringColor = isSwordsmen ? '#ef4444' : '#fbbf24';

  return (
    <group position={[x, y, z]} raycast={() => null}>
      <mesh
        ref={ringRef}
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.35, 0.55, 28]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh
        position={[0, 0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.02, 0.028, 1.1, 8]} />
        <meshStandardMaterial color="#5c2d12" roughness={0.7} />
      </mesh>

      <mesh position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.2} />
      </mesh>

      <group ref={pennantRef} position={[0, 0.95, 0]} rotation={[0, facingAngle - Math.PI / 2, 0]}>
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.38, 0.22, 0.012]} />
          <meshStandardMaterial color={bannerColor} roughness={0.5} />
        </mesh>
        <mesh position={[0.2, -0.11, 0]}>
          <boxGeometry args={[0.38, 0.02, 0.015]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
