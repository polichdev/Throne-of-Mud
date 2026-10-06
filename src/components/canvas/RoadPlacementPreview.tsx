import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { GridMap } from '../../engine/grid/GridMap';
import { isRoadPathValid } from '../../engine/grid/roadGeneration';

export interface RoadSnapTarget {
  x: number;
  z: number;
  type: 'road' | 'highway' | 'building';
  label: string;
}

interface Props {
  grid: GridMap;
  startPoint: [number, number] | null;
  path: [number, number][];
  hoveredTile: [number, number] | null;
  snapTarget?: RoadSnapTarget | null;
}

function createRoadRibbonGeometry(
  path: [number, number][],
  grid: GridMap,
  width: number,
  yOffset: number,
  normalOffset: number = 0
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  if (path.length === 0) return geom;

  if (path.length === 1) {
    const [px, pz] = path[0];
    const y = (grid.getTile(px, pz)?.height || 0.05) + yOffset;
    const r = width / 2;
    const segments = 16;
    const positions: number[] = [px + 0.5, y, pz + 0.5];
    const normals: number[] = [0, 1, 0];
    const uvs: number[] = [0.5, 0.5];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const vx = px + 0.5 + Math.cos(angle) * r;
      const vz = pz + 0.5 + Math.sin(angle) * r;
      positions.push(vx, y, vz);
      normals.push(0, 1, 0);
      uvs.push(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
    }
    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1);
    }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    return geom;
  }

  const n = path.length;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let accumulatedDist = 0;
  const halfW = width / 2;

  for (let i = 0; i < n; i++) {
    const [cx, cz] = path[i];
    const cy = (grid.getTile(cx, cz)?.height || 0.05) + yOffset;
    const pCenterX = cx + 0.5;
    const pCenterZ = cz + 0.5;

    if (i > 0) {
      const [prevX, prevZ] = path[i - 1];
      accumulatedDist += Math.hypot(cx - prevX, cz - prevZ);
    }

    let tx = 0;
    let tz = 0;
    let miterScale = 1.0;

    if (i === 0) {
      const [nextX, nextZ] = path[1];
      tx = nextX - cx;
      tz = nextZ - cz;
      const len = Math.hypot(tx, tz) || 1;
      tx /= len;
      tz /= len;
    } else if (i === n - 1) {
      const [prevX, prevZ] = path[i - 1];
      tx = cx - prevX;
      tz = cz - prevZ;
      const len = Math.hypot(tx, tz) || 1;
      tx /= len;
      tz /= len;
    } else {
      const [prevX, prevZ] = path[i - 1];
      const [nextX, nextZ] = path[i + 1];
      const d1x = cx - prevX;
      const d1z = cz - prevZ;
      const len1 = Math.hypot(d1x, d1z) || 1;

      const d2x = nextX - cx;
      const d2z = nextZ - cz;
      const len2 = Math.hypot(d2x, d2z) || 1;

      const norm1x = d1x / len1;
      const norm1z = d1z / len1;
      const norm2x = d2x / len2;
      const norm2z = d2z / len2;

      tx = norm1x + norm2x;
      tz = norm1z + norm2z;
      const lenT = Math.hypot(tx, tz) || 1;
      tx /= lenT;
      tz /= lenT;

      const dot = norm1x * norm2x + norm1z * norm2z;
      miterScale = Math.min(1.35, 1.0 / Math.max(0.65, Math.sqrt(Math.max(0.1, (1.0 + dot) / 2.0))));
    }

    const nx = -tz;
    const nz = tx;

    const shiftedCenterX = pCenterX + nx * normalOffset;
    const shiftedCenterZ = pCenterZ + nz * normalOffset;
    const effHalfW = halfW * (normalOffset !== 0 ? 1.0 : miterScale);

    const lx = shiftedCenterX + nx * effHalfW;
    const lz = shiftedCenterZ + nz * effHalfW;
    const rx = shiftedCenterX - nx * effHalfW;
    const rz = shiftedCenterZ - nz * effHalfW;

    positions.push(lx, cy, lz);
    normals.push(0, 1, 0);
    uvs.push(0, accumulatedDist);

    positions.push(rx, cy, rz);
    normals.push(0, 1, 0);
    uvs.push(1, accumulatedDist);
  }

  for (let i = 0; i < n - 1; i++) {
    const l0 = 2 * i;
    const r0 = 2 * i + 1;
    const l1 = 2 * (i + 1);
    const r1 = 2 * (i + 1) + 1;

    indices.push(l0, r0, l1);
    indices.push(r0, r1, l1);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  return geom;
}

export function RoadPlacementPreview({ grid, startPoint, path, hoveredTile, snapTarget }: Props) {
  const isValid = useMemo(() => isRoadPathValid(grid, path), [grid, path]);

  const materials = useMemo(() => ({
    validDirt: new THREE.MeshStandardMaterial({
      color: '#5c3e26',
      roughness: 0.88,
      metalness: 0.04,
      transparent: true,
      opacity: 0.95,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    }),
    invalidDirt: new THREE.MeshStandardMaterial({
      color: '#b91c1c',
      roughness: 0.8,
      transparent: true,
      opacity: 0.88,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    }),
    cartRut: new THREE.MeshStandardMaterial({
      color: '#341f10',
      roughness: 0.95,
      transparent: true,
      opacity: 0.88,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5,
      side: THREE.DoubleSide,
    }),
    cartRutInvalid: new THREE.MeshStandardMaterial({
      color: '#6b1111',
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5,
      side: THREE.DoubleSide,
    }),
    pebbles: new THREE.MeshStandardMaterial({
      color: '#8c765c',
      roughness: 0.7,
      transparent: true,
      opacity: 0.75,
    }),
    surveyPeg: new THREE.MeshStandardMaterial({
      color: '#78350f',
      roughness: 0.7,
    }),
    pegRibbon: new THREE.MeshStandardMaterial({
      color: '#dc2626',
      roughness: 0.5,
    }),
    endpointRing: new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.92,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5,
      side: THREE.DoubleSide,
    }),
    endpointSnapRing: new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.2,
      metalness: 0.7,
      transparent: true,
      opacity: 0.95,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
      side: THREE.DoubleSide,
    }),
  }), []);

  const { roadGeom, leftRutGeom, rightRutGeom } = useMemo(() => {
    if (path.length === 0) {
      return { roadGeom: null, leftRutGeom: null, rightRutGeom: null };
    }
    const rg = createRoadRibbonGeometry(path, grid, 0.88, 0.020, 0);
    const lrg = createRoadRibbonGeometry(path, grid, 0.07, 0.024, -0.20);
    const rrg = createRoadRibbonGeometry(path, grid, 0.07, 0.024, 0.20);
    return { roadGeom: rg, leftRutGeom: lrg, rightRutGeom: rrg };
  }, [path, grid]);

  const pebbleCoords = useMemo(() => {
    if (path.length < 2) return [];
    const list: [number, number, number][] = [];
    for (let i = 0; i < path.length; i += 2) {
      const [px, pz] = path[i];
      const py = (grid.getTile(px, pz)?.height || 0.05) + 0.024;
      const side = (i % 4 === 0) ? 0.38 : -0.38;
      list.push([px + 0.5 + side, py, pz + 0.5 + (i % 3 === 0 ? 0.1 : -0.1)]);
    }
    return list;
  }, [path, grid]);

  if (path.length === 0 && !startPoint && hoveredTile) {
    const [hx, hz] = hoveredTile;
    const canStart = grid.isWalkable(hx, hz) || grid.getTile(hx, hz)?.terrain === 'road';
    const tileY = grid.getTile(hx, hz)?.height || 0.05;
    const isSnapped = Boolean(snapTarget);
    const ringColor = !canStart ? '#ef4444' : isSnapped ? (snapTarget?.type === 'building' ? '#38bdf8' : '#fbbf24') : '#f59e0b';

    return (
      <group position={[hx + 0.5, tileY + 0.02, hz + 0.5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.44, 24]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <circleGeometry args={[0.22, 20]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        {isSnapped && (
          <Html position={[0, 0.48, 0]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div className="bg-stone-950/95 text-amber-200 text-[10px] px-2.5 py-1 rounded-md border border-amber-500/70 whitespace-nowrap shadow-xl backdrop-blur-md flex items-center gap-1.5 animate-bounce">
              <span>{snapTarget?.type === 'building' ? '🚪' : '🔗'}</span>
              <span>Початок: <strong className="text-white">{snapTarget?.label}</strong></span>
            </div>
          </Html>
        )}
      </group>
    );
  }

  if (path.length === 0) return null;

  const dirtMat = isValid ? materials.validDirt : materials.invalidDirt;
  const rutMat = isValid ? materials.cartRut : materials.cartRutInvalid;
  const lastTile = path[path.length - 1];
  const lastTileY = lastTile ? (grid.getTile(lastTile[0], lastTile[1])?.height || 0.05) : 0.05;
  const startTile = path[0];
  const startTileY = startTile ? (grid.getTile(startTile[0], startTile[1])?.height || 0.05) : 0.05;

  return (
    <group>
      {startPoint && (
        <group position={[startPoint[0] + 0.5, (grid.getTile(startPoint[0], startPoint[1])?.height || 0.05) + 0.015, startPoint[1] + 0.5]}>
          <mesh material={materials.surveyPeg} position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.44, 6]} />
          </mesh>
          <mesh material={materials.pegRibbon} position={[0.08, 0.36, 0]} castShadow>
            <boxGeometry args={[0.14, 0.06, 0.02]} />
          </mesh>
          <mesh material={materials.pebbles} position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.04, 8]} />
          </mesh>
        </group>
      )}

      {startTile && (
        <mesh position={[startTile[0] + 0.5, startTileY + 0.020, startTile[1] + 0.5]} rotation={[-Math.PI / 2, 0, 0]} material={dirtMat}>
          <circleGeometry args={[0.44, 20]} />
        </mesh>
      )}
      {lastTile && (
        <mesh position={[lastTile[0] + 0.5, lastTileY + 0.020, lastTile[1] + 0.5]} rotation={[-Math.PI / 2, 0, 0]} material={dirtMat}>
          <circleGeometry args={[0.44, 20]} />
        </mesh>
      )}

      {roadGeom && (
        <mesh geometry={roadGeom} material={dirtMat} receiveShadow />
      )}

      {leftRutGeom && (
        <mesh geometry={leftRutGeom} material={rutMat} />
      )}
      {rightRutGeom && (
        <mesh geometry={rightRutGeom} material={rutMat} />
      )}

      {pebbleCoords.map(([px, py, pz], pIdx) => (
        <mesh key={`verge-pebble-${pIdx}`} position={[px, py, pz]} material={materials.pebbles}>
          <sphereGeometry args={[0.03, 4, 4]} />
        </mesh>
      ))}

      {lastTile && (
        <group position={[lastTile[0] + 0.5, lastTileY + 0.026, lastTile[1] + 0.5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={snapTarget ? materials.endpointSnapRing : materials.endpointRing}>
            <ringGeometry args={[0.30, 0.44, 24]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <circleGeometry args={[0.20, 20]} />
            <meshBasicMaterial
              color={snapTarget ? '#38bdf8' : '#fbbf24'}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>

          <Html
            position={[0, 0.65, 0]}
            center
            zIndexRange={[15, 0]}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {isValid ? (
              <div className="bg-gradient-to-r from-stone-950/95 via-amber-950/95 to-stone-950/95 text-amber-100 text-[11px] font-medium px-3.5 py-1.5 rounded-lg border border-amber-500/70 shadow-2xl flex items-center gap-2 whitespace-nowrap backdrop-blur-md">
                <span className="text-amber-400 font-bold">🛣️ Дорога: {path.length} м</span>
                {snapTarget && (
                  <>
                    <span className="text-stone-500">|</span>
                    <span className="text-cyan-300 font-semibold flex items-center gap-1">
                      <span>{snapTarget.type === 'building' ? '🚪' : '🔗'}</span>
                      <span>Приєднано: {snapTarget.label}</span>
                    </span>
                  </>
                )}
                <span className="text-stone-500">|</span>
                <span className="text-emerald-400 font-semibold">Безкоштовно</span>
                <span className="text-amber-300/90 text-[10px] ml-1">[ЛКМ: прокласти]</span>
                <span className="text-stone-400 text-[10px]">[ПКМ: скасувати]</span>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-stone-950/95 via-red-950/95 to-stone-950/95 text-red-200 text-[11px] font-medium px-3.5 py-1.5 rounded-lg border border-red-500/80 shadow-2xl flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md animate-pulse">
                <span className="text-red-400 font-bold">⛔ Перешкода:</span>
                <span>шлях заблоковано водою або спорудою</span>
              </div>
            )}
          </Html>
        </group>
      )}
    </group>
  );
}
