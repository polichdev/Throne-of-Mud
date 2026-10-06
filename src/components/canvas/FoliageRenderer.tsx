import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GridMap } from '../../engine/grid/GridMap';
import { useGameStore } from '../../store/useGameStore';
import type { ResourceDeposit } from '../../types/game';
import { getTreeProceduralData } from '../../engine/world/foliageGeneration';
import { pseudoRandom, distanceSq2D } from '../../utils/mathUtils';

interface Props {
  grid: GridMap;
}

function createGrassTuftGeometry(bladeCount: number, height: number, spread: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2 + (i % 2 === 0 ? 0.35 : -0.25);
    const bladeW = 0.065 * (0.85 + Math.sin(i * 3.5) * 0.25);
    const bladeH = height * (0.85 + Math.cos(i * 4.2) * 0.25);
    const lean = spread * (0.22 + (i % 3) * 0.12);

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const perpX = -sinA * bladeW;
    const perpZ = cosA * bladeW;

    const baseIdx = positions.length / 3;

    positions.push(-perpX, 0, -perpZ);
    normals.push(sinA, 0.2, -cosA);

    positions.push(perpX, 0, perpZ);
    normals.push(sinA, 0.2, -cosA);

    positions.push(cosA * lean, bladeH, sinA * lean);
    normals.push(cosA * 0.5, 0.8, sinA * 0.5);

    indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

function mergeBufferGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  let totalPos = 0;
  let totalIdx = 0;
  for (const g of geos) {
    totalPos += g.attributes.position.count * 3;
    totalIdx += g.index ? g.index.count : g.attributes.position.count;
  }
  const positions = new Float32Array(totalPos);
  const normals = new Float32Array(totalPos);
  const indices = new Uint32Array(totalIdx);

  let posOffset = 0;
  let idxOffset = 0;
  let vertOffset = 0;

  for (const g of geos) {
    const p = g.attributes.position.array;
    const n = g.attributes.normal?.array;
    positions.set(p, posOffset);
    if (n) normals.set(n, posOffset);

    if (g.index) {
      const idx = g.index.array;
      for (let i = 0; i < idx.length; i++) {
        indices[idxOffset + i] = idx[i] + vertOffset;
      }
      idxOffset += idx.length;
    } else {
      for (let i = 0; i < g.attributes.position.count; i++) {
        indices[idxOffset + i] = i + vertOffset;
      }
      idxOffset += g.attributes.position.count;
    }

    vertOffset += g.attributes.position.count;
    posOffset += g.attributes.position.count * 3;
  }

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();
  return merged;
}

function createBranch(
  start: [number, number, number],
  end: [number, number, number],
  rStart: number,
  rEnd: number,
  radialSegs: number = 5
): THREE.BufferGeometry {
  const p1 = new THREE.Vector3(...start);
  const p2 = new THREE.Vector3(...end);
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();

  const geo = new THREE.CylinderGeometry(rEnd, rStart, len, radialSegs);
  geo.translate(0, len / 2, 0);

  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
  geo.applyQuaternion(quat);

  geo.translate(p1.x, p1.y, p1.z);
  return geo;
}

function createBareWinterTreeGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  parts.push(createBranch([0, 0, 0], [0.02, 0.55, 0], 0.20, 0.15, 6));
  parts.push(createBranch([-0.04, 0.16, 0.02], [-0.22, 0.0, 0.12], 0.09, 0.04, 4));
  parts.push(createBranch([0.04, 0.16, -0.02], [0.22, 0.0, -0.12], 0.09, 0.04, 4));
  parts.push(createBranch([-0.01, 0.16, -0.04], [-0.08, 0.0, -0.24], 0.09, 0.04, 4));

  parts.push(createBranch([0.02, 0.55, 0], [-0.02, 0.95, 0.02], 0.15, 0.11, 6));

  parts.push(createBranch([-0.02, 0.95, 0.02], [0.02, 1.45, -0.02], 0.11, 0.075, 5));
  parts.push(createBranch([0.02, 1.45, -0.02], [-0.03, 1.90, 0.02], 0.075, 0.045, 4));
  parts.push(createBranch([-0.03, 1.90, 0.02], [0.01, 2.22, -0.01], 0.045, 0.02, 4));

  parts.push(createBranch([-0.02, 0.90, 0.02], [0.34, 1.35, 0.18], 0.085, 0.055, 5));
  parts.push(createBranch([0.34, 1.35, 0.18], [0.58, 1.68, 0.30], 0.05, 0.03, 4));
  parts.push(createBranch([0.58, 1.68, 0.30], [0.72, 1.92, 0.36], 0.028, 0.014, 4));
  parts.push(createBranch([0.34, 1.35, 0.18], [0.26, 1.78, 0.10], 0.045, 0.025, 4));

  parts.push(createBranch([-0.02, 0.98, 0.01], [-0.38, 1.42, -0.12], 0.08, 0.05, 5));
  parts.push(createBranch([-0.38, 1.42, -0.12], [-0.62, 1.72, -0.22], 0.048, 0.028, 4));
  parts.push(createBranch([-0.62, 1.72, -0.22], [-0.75, 1.95, -0.28], 0.026, 0.013, 4));
  parts.push(createBranch([-0.38, 1.42, -0.12], [-0.28, 1.85, -0.02], 0.045, 0.024, 4));

  parts.push(createBranch([0.01, 1.22, -0.02], [0.30, 1.58, -0.32], 0.065, 0.042, 4));
  parts.push(createBranch([0.30, 1.58, -0.32], [0.48, 1.88, -0.42], 0.038, 0.02, 4));
  parts.push(createBranch([0.30, 1.58, -0.32], [0.18, 1.98, -0.26], 0.036, 0.018, 4));

  parts.push(createBranch([0.0, 1.32, 0.01], [-0.30, 1.65, 0.25], 0.06, 0.038, 4));
  parts.push(createBranch([-0.30, 1.65, 0.25], [-0.45, 1.96, 0.35], 0.035, 0.018, 4));

  parts.push(createBranch([-0.02, 1.70, 0.01], [0.12, 2.05, 0.18], 0.04, 0.018, 4));

  return mergeBufferGeometries(parts);
}

function createBareBushGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  parts.push(createBranch([0, 0, 0], [-0.18, 0.26, 0.08], 0.032, 0.012, 4));
  parts.push(createBranch([-0.18, 0.26, 0.08], [-0.28, 0.42, 0.14], 0.012, 0.006, 3));
  parts.push(createBranch([0, 0, 0], [0.20, 0.28, -0.06], 0.032, 0.012, 4));
  parts.push(createBranch([0.20, 0.28, -0.06], [0.30, 0.44, -0.10], 0.012, 0.006, 3));
  parts.push(createBranch([0, 0, 0], [0.04, 0.32, 0.18], 0.028, 0.011, 4));
  parts.push(createBranch([0, 0, 0], [-0.06, 0.30, -0.18], 0.028, 0.011, 4));
  parts.push(createBranch([0, 0, 0], [0.01, 0.38, 0.02], 0.035, 0.014, 4));
  parts.push(createBranch([0.01, 0.38, 0.02], [-0.04, 0.52, 0.05], 0.014, 0.007, 3));
  return mergeBufferGeometries(parts);
}

function createPineCanopyGeometry(): THREE.BufferGeometry {
  const g1 = new THREE.ConeGeometry(0.68, 0.65, 6);
  g1.translate(0, 0.65, 0);
  const g2 = new THREE.ConeGeometry(0.54, 0.6, 6);
  g2.translate(0, 1.05, 0);
  const g3 = new THREE.ConeGeometry(0.4, 0.5, 6);
  g3.translate(0, 1.45, 0);
  const g4 = new THREE.ConeGeometry(0.25, 0.4, 6);
  g4.translate(0, 1.8, 0);
  return mergeBufferGeometries([g1, g2, g3, g4]);
}

const defaultBareWinterTreeGeo = createBareWinterTreeGeometry();
const defaultBareBushGeo = createBareBushGeometry();
const defaultPineCanopyGeo = createPineCanopyGeometry();

const FALLING_TREE_GEOS = {
  pineTrunk: new THREE.CylinderGeometry(0.09, 0.15, 0.65, 6),
  pineCone1: new THREE.ConeGeometry(0.68, 0.65, 6),
  pineCone2: new THREE.ConeGeometry(0.54, 0.6, 6),
  pineCone3: new THREE.ConeGeometry(0.4, 0.5, 6),
  pineCone4: new THREE.ConeGeometry(0.25, 0.4, 6),
  oakTrunk: new THREE.CylinderGeometry(0.12, 0.22, 0.85, 6),
  oakCanopy: new THREE.DodecahedronGeometry(0.72, 1),
};

const FALLING_TREE_MATS = {
  trunk: new THREE.MeshLambertMaterial({ color: '#422817' }),
  pine1: new THREE.MeshLambertMaterial({ color: '#13351b' }),
  pine2: new THREE.MeshLambertMaterial({ color: '#184223' }),
  pine3: new THREE.MeshLambertMaterial({ color: '#1f4f2c' }),
  pine4: new THREE.MeshLambertMaterial({ color: '#286237' }),
  oakCanopy: new THREE.MeshLambertMaterial({ color: '#2b6524' }),
  autumnCanopy: new THREE.MeshLambertMaterial({ color: '#c2410c' }),
};

function FallingTreeItem({
  tree,
  grid,
}: {
  tree: { id: string; x: number; z: number; startTime: number; fallAngle: number; treeType: string };
  grid: GridMap;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const landedRef = useRef(false);
  const gx = Math.floor(tree.x);
  const gz = Math.floor(tree.z);
  const tileH = grid.getTile(gx, gz)?.height ?? 0.05;
  const isWinter = (useGameStore.getState().time?.season || 'Spring') === 'Winter';

  const { treeType, sc, rotY, jitterX, jitterZ } = useMemo(() => {
    return getTreeProceduralData(gx, gz);
  }, [gx, gz]);

  const posX = gx + 0.5 + jitterX;
  const posZ = gz + 0.5 + jitterZ;

  useFrame(() => {
    if (!groupRef.current) return;
    const now = performance.now() / 1000;
    const elapsed = now - tree.startTime;
    const fallDuration = 1.35;
    const norm = Math.min(1.0, elapsed / fallDuration);
    const fallTilt = norm * norm * norm * (Math.PI / 2);

    let impactBounce = 0;
    if (elapsed >= fallDuration && elapsed < fallDuration + 0.6) {
      const bNorm = (elapsed - fallDuration) / 0.6;
      impactBounce = Math.sin(bNorm * Math.PI * 4) * 0.05 * (1 - bNorm);

      if (!landedRef.current) {
        landedRef.current = true;
        grid.setFoliage(gx, gz, 'fallen_tree', tree.fallAngle, treeType);
        useGameStore.getState().registerTreeHit(posX, posZ, 1.8);
        useGameStore.getState().incrementFoliageVersion();
      }
    }

    groupRef.current.position.set(posX, tileH, posZ);
    groupRef.current.rotation.set(0, tree.fallAngle, 0);
    if (groupRef.current.children[0]) {
      groupRef.current.children[0].visible = elapsed < fallDuration;
      groupRef.current.children[0].rotation.set(fallTilt + impactBounce, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[0, 0, 0]} scale={[sc, sc, sc]}>
        {treeType === 'pine' ? (
          <>
            <mesh position={[0, 0.32, 0]} geometry={FALLING_TREE_GEOS.pineTrunk} material={FALLING_TREE_MATS.trunk} />
            <mesh position={[0, 0.65, 0]} geometry={FALLING_TREE_GEOS.pineCone1} material={FALLING_TREE_MATS.pine1} />
            <mesh position={[0, 1.05, 0]} geometry={FALLING_TREE_GEOS.pineCone2} material={FALLING_TREE_MATS.pine2} />
            <mesh position={[0, 1.45, 0]} geometry={FALLING_TREE_GEOS.pineCone3} material={FALLING_TREE_MATS.pine3} />
            <mesh position={[0, 1.8, 0]} geometry={FALLING_TREE_GEOS.pineCone4} material={FALLING_TREE_MATS.pine4} />
          </>
        ) : isWinter ? (
          <mesh position={[0, 0, 0]} rotation={[0, rotY, 0]} geometry={defaultBareWinterTreeGeo} material={FALLING_TREE_MATS.trunk} />
        ) : (
          <>
            <mesh position={[0, 0.42, 0]} rotation={[0, rotY, 0]} geometry={FALLING_TREE_GEOS.oakTrunk} material={FALLING_TREE_MATS.trunk} />
            <mesh
              position={[0, 1.25, 0]}
              scale={[1.1, 1.1, 1.1]}
              geometry={FALLING_TREE_GEOS.oakCanopy}
              material={treeType === 'autumn' ? FALLING_TREE_MATS.autumnCanopy : FALLING_TREE_MATS.oakCanopy}
            />
          </>
        )}
      </group>
    </group>
  );
}

interface FoliageBucket {
  cx: number;
  cz: number;
  bareTrees: THREE.Matrix4[];
  treeTrunks: THREE.Matrix4[];
  oakCanopies: THREE.Matrix4[];
  autumnCanopies: THREE.Matrix4[];
  pineTrunks: THREE.Matrix4[];
  pineCanopies: THREE.Matrix4[];
  stumps: THREE.Matrix4[];
  fallenLogs: THREE.Matrix4[];
  fallenOakCanopies: THREE.Matrix4[];
  fallenAutumnCanopies: THREE.Matrix4[];
  fallenPineCanopies: THREE.Matrix4[];
  rocks: THREE.Matrix4[];
  bareBushes: THREE.Matrix4[];
  bushes: THREE.Matrix4[];
  tallGrass: THREE.Matrix4[];
  medGrass: THREE.Matrix4[];
  shortGrass: THREE.Matrix4[];
  reeds: THREE.Matrix4[];
  lilies: THREE.Matrix4[];
  flowers: THREE.Matrix4[];
  flowerColors: number[];
  pebbles: THREE.Matrix4[];
  mushrooms: THREE.Matrix4[];
}

const BUCKET_SIZE = 16;

const CAPACITIES = {
  tree: 4500,
  bush: 1800,
  rock: 1000,
  fallen: 600,
  tallGrass: 6000,
  medGrass: 6000,
  shortGrass: 6000,
  reed: 800,
  lily: 400,
  flower: 2000,
  pebble: 1000,
  mushroom: 600,
};

function FallingTreesContainer({ grid }: { grid: GridMap }) {
  const fallingTrees = useGameStore((state) => state.fallingTrees);
  const isStrategicView = useGameStore((state) => state.isStrategicView);
  if (isStrategicView || !fallingTrees || fallingTrees.length === 0) return null;

  return (
    <group raycast={() => null}>
      {fallingTrees.map((tree) => (
        <FallingTreeItem key={tree.id} tree={tree} grid={grid} />
      ))}
    </group>
  );
}

export function FoliageRenderer({ grid }: Props) {
  const foliageVersion = useGameStore((state) => state.foliageVersion);
  const resourceDeposits = useGameStore((state) => state.resourceDeposits);
  const isStrategicView = useGameStore((state) => state.isStrategicView);

  const bareWinterTreeRef = useRef<THREE.InstancedMesh>(null);
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const oakCanopyRef = useRef<THREE.InstancedMesh>(null);
  const autumnCanopyRef = useRef<THREE.InstancedMesh>(null);
  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineCanopyRef = useRef<THREE.InstancedMesh>(null);

  const stumpRef = useRef<THREE.InstancedMesh>(null);
  const fallenLogRef = useRef<THREE.InstancedMesh>(null);
  const fallenOakCanopyRef = useRef<THREE.InstancedMesh>(null);
  const fallenAutumnCanopyRef = useRef<THREE.InstancedMesh>(null);
  const fallenPineCanopyRef = useRef<THREE.InstancedMesh>(null);

  const rockRef = useRef<THREE.InstancedMesh>(null);
  const bareBushRef = useRef<THREE.InstancedMesh>(null);
  const bushRef = useRef<THREE.InstancedMesh>(null);

  const tallGrassRef = useRef<THREE.InstancedMesh>(null);
  const medGrassRef = useRef<THREE.InstancedMesh>(null);
  const shortGrassRef = useRef<THREE.InstancedMesh>(null);
  const reedRef = useRef<THREE.InstancedMesh>(null);
  const lilyRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const pebbleRef = useRef<THREE.InstancedMesh>(null);
  const mushroomRef = useRef<THREE.InstancedMesh>(null);

  const lastUpdateRef = useRef({
    minBx: -1,
    maxBx: -1,
    minBz: -1,
    maxBz: -1,
    season: '',
    showGrass: true,
    foliageVersion: -1,
    strategic: false,
  });
  const forceUpdateRef = useRef(true);

  const cols = Math.ceil(grid.width / BUCKET_SIZE);
  const rows = Math.ceil(grid.height / BUCKET_SIZE);

function populateBucketFoliage(
  bucket: FoliageBucket,
  bx: number,
  bz: number,
  grid: GridMap,
  dummy: THREE.Object3D,
  resourceDeposits?: ResourceDeposit[]
) {
  bucket.bareTrees.length = 0;
  bucket.treeTrunks.length = 0;
  bucket.oakCanopies.length = 0;
  bucket.autumnCanopies.length = 0;
  bucket.pineTrunks.length = 0;
  bucket.pineCanopies.length = 0;
  bucket.stumps.length = 0;
  bucket.fallenLogs.length = 0;
  bucket.fallenOakCanopies.length = 0;
  bucket.fallenAutumnCanopies.length = 0;
  bucket.fallenPineCanopies.length = 0;
  bucket.rocks.length = 0;
  bucket.bareBushes.length = 0;
  bucket.bushes.length = 0;
  bucket.tallGrass.length = 0;
  bucket.medGrass.length = 0;
  bucket.shortGrass.length = 0;
  bucket.reeds.length = 0;
  bucket.lilies.length = 0;
  bucket.flowers.length = 0;
  bucket.flowerColors.length = 0;
  bucket.pebbles.length = 0;
  bucket.mushrooms.length = 0;

  const minX = bx * BUCKET_SIZE;
  const maxX = Math.min(grid.width, minX + BUCKET_SIZE);
  const minZ = bz * BUCKET_SIZE;
  const maxZ = Math.min(grid.height, minZ + BUCKET_SIZE);

  const depositClearings: Array<{ gx: number; gz: number; rSq: number }> = [];
  if (resourceDeposits) {
    for (const dep of resourceDeposits) {
      const r = dep.type === 'berries' ? 1.4 : 2.7;
      depositClearings.push({ gx: dep.gridPosition[0], gz: dep.gridPosition[1], rSq: r * r });
    }
  }

  for (let x = minX; x < maxX; x++) {
    for (let z = minZ; z < maxZ; z++) {
      const tile = grid.tiles[x]?.[z];
      if (!tile) continue;

      const isRoadOrBuilding = tile.terrain === 'road' || Boolean(tile.buildingId) || GridMap.isTradeHighwayTile(x, z);
      if (isRoadOrBuilding) continue;

      let inDeposit = false;
      for (let i = 0; i < depositClearings.length; i++) {
        const d = depositClearings[i];
        if (distanceSq2D(x, z, d.gx, d.gz) <= d.rSq) {
          inDeposit = true;
          break;
        }
      }
      if (inDeposit) continue;

      const tileH = tile.height || 0.05;
      const jitterX = (pseudoRandom(x, z) - 0.5) * 0.35;
      const jitterZ = (pseudoRandom(z, x + 37) - 0.5) * 0.35;
      const posX = x + 0.5 + jitterX;
      const posZ = z + 0.5 + jitterZ;
      const rotY = pseudoRandom(x + 17, z + 53) * Math.PI * 2;

      if (tile.foliageType) {
        if (tile.foliageType === 'tree') {
          const { treeType, sc } = getTreeProceduralData(x, z);
          if (treeType === 'pine') {
            dummy.position.set(posX, tileH + 0.32 * sc, posZ);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.pineTrunks.push(dummy.matrix.clone());

            dummy.position.set(posX, tileH, posZ);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.pineCanopies.push(dummy.matrix.clone());
          } else if (treeType === 'oak') {
            dummy.position.set(posX, tileH + 0.42 * sc, posZ);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.treeTrunks.push(dummy.matrix.clone());

            dummy.position.set(posX, tileH + 1.25 * sc, posZ);
            dummy.scale.set(sc * 1.1, sc * 1.1, sc * 1.1);
            dummy.updateMatrix();
            bucket.oakCanopies.push(dummy.matrix.clone());

            dummy.position.set(posX, tileH, posZ);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.bareTrees.push(dummy.matrix.clone());
          } else {
            dummy.position.set(posX, tileH + 0.42 * sc, posZ);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.treeTrunks.push(dummy.matrix.clone());

            dummy.position.set(posX, tileH + 1.25 * sc, posZ);
            dummy.scale.set(sc * 1.1, sc * 1.1, sc * 1.1);
            dummy.updateMatrix();
            bucket.autumnCanopies.push(dummy.matrix.clone());

            dummy.position.set(posX, tileH, posZ);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.bareTrees.push(dummy.matrix.clone());
          }
        } else if (tile.foliageType === 'fallen_tree') {
          const proc = getTreeProceduralData(x, z);
          const treeType = tile.foliageTreeType || proc.treeType;
          const sc = proc.sc;
          const logAngle = tile.foliageAngle !== undefined ? tile.foliageAngle : rotY;
          const sinA = Math.sin(logAngle);
          const cosA = Math.cos(logAngle);

          dummy.position.set(posX, tileH + 0.08 * sc, posZ);
          dummy.rotation.set(0, logAngle, 0);
          dummy.scale.set(sc, sc, sc);
          dummy.updateMatrix();
          bucket.stumps.push(dummy.matrix.clone());

          dummy.position.set(posX + sinA * 0.42 * sc, tileH + 0.09 * sc, posZ + cosA * 0.42 * sc);
          dummy.rotation.set(0, logAngle, 0);
          dummy.rotateX(Math.PI / 2);
          dummy.scale.set(sc, sc, sc);
          dummy.updateMatrix();
          bucket.fallenLogs.push(dummy.matrix.clone());

          if (treeType === 'pine') {
            dummy.position.set(posX, tileH + 0.16 * sc, posZ);
            dummy.rotation.set(0, logAngle, 0);
            dummy.rotateX(Math.PI / 2);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.fallenPineCanopies.push(dummy.matrix.clone());
          } else if (treeType === 'oak') {
            dummy.position.set(posX + sinA * 1.25 * sc, tileH + 0.32 * sc, posZ + cosA * 1.25 * sc);
            dummy.rotation.set(0, logAngle, 0);
            dummy.rotateX(Math.PI / 2);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.fallenOakCanopies.push(dummy.matrix.clone());
          } else {
            dummy.position.set(posX + sinA * 1.25 * sc, tileH + 0.32 * sc, posZ + cosA * 1.25 * sc);
            dummy.rotation.set(0, logAngle, 0);
            dummy.rotateX(Math.PI / 2);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            bucket.fallenAutumnCanopies.push(dummy.matrix.clone());
          }
        } else if (tile.foliageType === 'rock') {
          const sc = 0.95 + (pseudoRandom(x + 13, z + 7) - 0.5) * 0.25;
          dummy.position.set(posX, tileH + 0.18 * sc, posZ);
          dummy.rotation.set(0.1, rotY, 0.05);
          dummy.scale.set(sc * 1.2, sc * 0.8, sc * 1.05);
          dummy.updateMatrix();
          bucket.rocks.push(dummy.matrix.clone());
        } else if (tile.foliageType === 'bush') {
          const sc = 0.85 + (pseudoRandom(x * 7, z * 13) - 0.5) * 0.35;
          dummy.position.set(posX, tileH + 0.15 * sc, posZ);
          dummy.rotation.set(0, rotY, 0);
          dummy.scale.set(sc, sc, sc);
          dummy.updateMatrix();
          bucket.bushes.push(dummy.matrix.clone());

          dummy.position.set(posX, tileH, posZ);
          dummy.rotation.set(0, rotY, 0);
          dummy.scale.set(sc, sc, sc);
          dummy.updateMatrix();
          bucket.bareBushes.push(dummy.matrix.clone());
        }
      }

      if (tile.terrain === 'water') {
        if (pseudoRandom(x + 43, z + 17) > 0.90) {
          const sc = 0.65 + pseudoRandom(x, z) * 0.25;
          dummy.position.set(posX, -0.06, posZ);
          dummy.rotation.set(0, rotY, 0);
          dummy.scale.set(sc, sc, sc);
          dummy.updateMatrix();
          bucket.lilies.push(dummy.matrix.clone());
        }
      } else if (tile.terrain === 'fertile_soil' || tile.terrain === 'mud') {
        if (pseudoRandom(x + 11, z + 89) > 0.55) {
          const sc = 0.75 + pseudoRandom(x, z) * 0.35;
          dummy.position.set(posX, tileH, posZ);
          dummy.rotation.set(0, rotY, 0);
          dummy.scale.set(sc, sc, sc);
          dummy.updateMatrix();
          bucket.reeds.push(dummy.matrix.clone());
        }
        if (pseudoRandom(x * 37, z * 29) > 0.40) {
          const sc = 0.65 + pseudoRandom(x, z) * 0.35;
          dummy.position.set(posX + 0.15, tileH + 0.02 * sc, posZ + 0.15);
          dummy.rotation.set(0.1, rotY, 0.05);
          dummy.scale.set(sc * 1.3, sc * 0.5, sc * 1.1);
          dummy.updateMatrix();
          bucket.pebbles.push(dummy.matrix.clone());
        }
      } else if (tile.terrain === 'grass') {
        const patchNoise = Math.sin(x * 0.24 + z * 0.16) * 0.55 + Math.cos(x * 0.12 - z * 0.26) * 0.45;

        if (patchNoise > 0.15) {
          const tuftCount = 2 + Math.floor(pseudoRandom(x * 3, z * 7) * 1.5);
          for (let k = 0; k < tuftCount; k++) {
            const subJitterX = (pseudoRandom(x * 13 + k * 17, z * 19 + k) - 0.5) * 0.94;
            const subJitterZ = (pseudoRandom(z * 23 + k * 31, x * 7 + k) - 0.5) * 0.94;
            const subRotY = pseudoRandom(x + k * 37, z + k * 53) * Math.PI * 2;
            const subScale = 0.95 + pseudoRandom(x * 5 + k, z * 11) * 0.40;

            dummy.position.set(x + 0.5 + subJitterX, tileH, z + 0.5 + subJitterZ);
            dummy.rotation.set(0, subRotY, 0);
            dummy.scale.set(subScale, subScale, subScale);
            dummy.updateMatrix();

            if (k < 1) bucket.tallGrass.push(dummy.matrix.clone());
            else if (k < 2) bucket.medGrass.push(dummy.matrix.clone());
            else bucket.shortGrass.push(dummy.matrix.clone());
          }

          const randFlower = pseudoRandom(x * 19 + 5, z * 23 + 17);
          if (randFlower > 0.45) {
            const fType = pseudoRandom(x + 31, z + 73);
            const sc = 0.85 + pseudoRandom(x, z) * 0.35;
            const fJitterX = (pseudoRandom(x * 41, z * 29) - 0.5) * 0.75;
            const fJitterZ = (pseudoRandom(z * 17, x * 53) - 0.5) * 0.75;

            dummy.position.set(x + 0.5 + fJitterX, tileH + 0.05 * sc, z + 0.5 + fJitterZ);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();

            bucket.flowers.push(dummy.matrix.clone());
            if (fType < 0.28) {
              bucket.flowerColors.push(0.937, 0.267, 0.267);
            } else if (fType < 0.56) {
              bucket.flowerColors.push(0.980, 0.800, 0.082);
            } else if (fType < 0.82) {
              bucket.flowerColors.push(0.220, 0.741, 0.973);
            } else {
              bucket.flowerColors.push(0.973, 0.980, 0.988);
            }
          }

          if (pseudoRandom(x * 47, z * 31) > 0.78) {
            const scM = 0.7 + pseudoRandom(x, z) * 0.3;
            dummy.position.set(posX + 0.28, tileH + 0.05 * scM, posZ + 0.22);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(scM, scM, scM);
            dummy.updateMatrix();
            bucket.mushrooms.push(dummy.matrix.clone());
          }
        } else if (patchNoise > -0.20) {
          const tuftCount = 1 + Math.floor(pseudoRandom(x * 5, z * 11) * 1.5);
          for (let k = 0; k < tuftCount; k++) {
            const subJitterX = (pseudoRandom(x * 11 + k * 13, z * 17 + k) - 0.5) * 0.92;
            const subJitterZ = (pseudoRandom(z * 19 + k * 23, x * 5 + k) - 0.5) * 0.92;
            const subRotY = pseudoRandom(x + k * 19, z + k * 29) * Math.PI * 2;
            const subScale = 0.85 + pseudoRandom(x * 3 + k, z * 7) * 0.35;

            dummy.position.set(x + 0.5 + subJitterX, tileH, z + 0.5 + subJitterZ);
            dummy.rotation.set(0, subRotY, 0);
            dummy.scale.set(subScale, subScale, subScale);
            dummy.updateMatrix();

            if (k < 1) bucket.medGrass.push(dummy.matrix.clone());
            else bucket.shortGrass.push(dummy.matrix.clone());
          }
        } else {
          if (pseudoRandom(x * 23 + 7, z * 17 + 11) > 0.60) {
            const subJitterX = (pseudoRandom(x * 17, z * 13) - 0.5) * 0.90;
            const subJitterZ = (pseudoRandom(z * 29, x * 19) - 0.5) * 0.90;
            const subRotY = pseudoRandom(x + 11, z + 17) * Math.PI * 2;
            const subScale = 0.80 + pseudoRandom(x, z) * 0.30;

            dummy.position.set(x + 0.5 + subJitterX, tileH, z + 0.5 + subJitterZ);
            dummy.rotation.set(0, subRotY, 0);
            dummy.scale.set(subScale, subScale, subScale);
            dummy.updateMatrix();

            bucket.shortGrass.push(dummy.matrix.clone());
          }
        }
      }
    }
  }
}

  const geos = useMemo(() => ({
    trunkGeo: new THREE.CylinderGeometry(0.12, 0.22, 0.85, 6),
    bareWinterTreeGeo: defaultBareWinterTreeGeo,
    oakCanopyGeo: new THREE.DodecahedronGeometry(0.72, 0),
    pineTrunkGeo: new THREE.CylinderGeometry(0.09, 0.15, 0.65, 6),
    pineCanopyGeo: defaultPineCanopyGeo,
    rockGeo: new THREE.DodecahedronGeometry(0.42, 0),
    bushGeo: new THREE.DodecahedronGeometry(0.32, 0),
    bareBushGeo: defaultBareBushGeo,

    stumpGeo: new THREE.CylinderGeometry(0.15, 0.22, 0.22, 6),
    fallenLogGeo: new THREE.CylinderGeometry(0.13, 0.16, 1.35, 6),
    fallenBranchGeo: new THREE.DodecahedronGeometry(0.42, 0),

    tallGrassGeo: createGrassTuftGeometry(3, 0.50, 0.35),
    medGrassGeo: createGrassTuftGeometry(2, 0.38, 0.26),
    shortGrassGeo: createGrassTuftGeometry(2, 0.25, 0.20),

    reedGeo: new THREE.CylinderGeometry(0.02, 0.03, 0.65, 4),
    lilyGeo: new THREE.CylinderGeometry(0.20, 0.20, 0.02, 6),
    flowerGeo: new THREE.OctahedronGeometry(0.09, 0),
    pebbleGeo: new THREE.DodecahedronGeometry(0.11, 0),
    shroomGeo: new THREE.ConeGeometry(0.11, 0.12, 5),
  }), []);

  const registeredShadersRef = useRef<WeakSet<any>>(new WeakSet());
  const windShadersRef = useRef<Array<{ shader: { uniforms: Record<string, THREE.IUniform> }; isFlower: boolean }>>([]);
  const treeShadersRef = useRef<Array<{ shader: { uniforms: Record<string, THREE.IUniform> }; isCanopy: boolean }>>([]);
  const canopyScaleRef = useRef(1.0);
  const flowerScaleRef = useRef(1.0);

  const createWindMaterial = useMemo(() => {
    return (colorHex: string, swayIntensity: number = 1.0, isFlower: boolean = false) => {
      const mat = new THREE.MeshLambertMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
      });

      mat.onBeforeCompile = (shader) => {
        if (!registeredShadersRef.current.has(shader)) {
          registeredShadersRef.current.add(shader);
          windShadersRef.current.push({ shader, isFlower });
        }
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uFlowerScale = { value: 1.0 };

        shader.vertexShader = `
          uniform float uTime;
          uniform float uFlowerScale;
          ${shader.vertexShader}
        `.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          ${isFlower ? 'transformed *= uFlowerScale;' : ''}

          #ifdef USE_INSTANCING
          vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #else
          vec4 instPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #endif
          float windPhase = instPos.x * 0.38 + instPos.z * 0.26 + uTime * 2.5;
          float gust = sin(windPhase) * 0.70 + sin(windPhase * 0.5 + uTime * 1.2) * 0.30;

          float heightFactor = max(0.0, position.y);
          float sway = heightFactor * heightFactor * ${swayIntensity.toFixed(2)};

          transformed.x += gust * sway * 0.22;
          transformed.z += gust * sway * 0.16;
          transformed.y -= abs(gust) * sway * 0.04;
          `
        );
      };

      return mat;
    };
  }, []);

  const createTreeMaterial = useMemo(() => {
    return (colorHex: string, _roughness: number = 0.82, isCanopy: boolean = false) => {
      const mat = new THREE.MeshLambertMaterial({
        color: colorHex,
      });

      mat.onBeforeCompile = (shader) => {
        if (!registeredShadersRef.current.has(shader)) {
          registeredShadersRef.current.add(shader);
          treeShadersRef.current.push({ shader, isCanopy });
        }
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uCanopyScale = { value: 1.0 };
        shader.uniforms.uTreeHits = {
          value: [
            new THREE.Vector4(0, 0, 0, 0),
            new THREE.Vector4(0, 0, 0, 0),
            new THREE.Vector4(0, 0, 0, 0),
            new THREE.Vector4(0, 0, 0, 0),
            new THREE.Vector4(0, 0, 0, 0),
            new THREE.Vector4(0, 0, 0, 0),
            new THREE.Vector4(0, 0, 0, 0),
            new THREE.Vector4(0, 0, 0, 0),
          ],
        };

        shader.vertexShader = `
          uniform float uTime;
          uniform float uCanopyScale;
          uniform vec4 uTreeHits[8];
          ${shader.vertexShader}
        `.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          ${isCanopy ? 'transformed *= uCanopyScale;' : ''}
          #ifdef USE_INSTANCING
          vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #else
          vec4 instPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #endif

          float windPhase = instPos.x * 0.28 + instPos.z * 0.22 + uTime * 2.0;
          float gust = sin(windPhase) * 0.65 + sin(windPhase * 0.4 + uTime * 1.1) * 0.35;
          float heightFactor = max(0.0, position.y);
          transformed.x += gust * heightFactor * 0.035;
          transformed.z += gust * heightFactor * 0.025;

          for (int i = 0; i < 8; i++) {
            vec4 hit = uTreeHits[i];
            if (hit.w > 0.01) {
              float d = distance(instPos.xz, hit.xy);

              if (d < 0.38) {
                float dt = uTime - hit.z;
                if (dt >= 0.0 && dt < 0.9) {

                  float decay = exp(-dt * 7.5);
                  float wobble = sin(dt * 45.0) * decay * 0.30 * hit.w;

                  float swayArm = max(0.2, position.y + (instPos.y > 0.2 ? 0.7 : 0.0));
                  transformed.x += wobble * swayArm;
                  transformed.z += wobble * 0.35 * swayArm;
                  transformed.y -= abs(sin(dt * 45.0)) * decay * 0.03;
                }
              }
            }
          }
          `
        );
      };

      return mat;
    };
  }, []);

  const mats = useMemo(() => ({
    wood: createTreeMaterial('#422817', 0.9, false),
    oak: createTreeMaterial('#22c55e', 0.8, true),
    autumn: createTreeMaterial('#ea580c', 0.8, true),
    pine: createTreeMaterial('#1c4a28', 0.85, true),
    rock: new THREE.MeshLambertMaterial({ color: '#4b5563' }),
    bush: createTreeMaterial('#22c55e', 0.85, true),

    tallGrassMat: createWindMaterial('#3f782c', 1.35, false),
    medGrassMat: createWindMaterial('#4a8c32', 1.15, false),
    shortGrassMat: createWindMaterial('#5ea338', 0.95, false),

    reed: createWindMaterial('#4d7c0f', 1.20, false),
    lily: new THREE.MeshLambertMaterial({ color: '#166534' }),
    flowerMat: createWindMaterial('#ffffff', 0.80, true),
    pebble: new THREE.MeshLambertMaterial({ color: '#64748b' }),
    mushroom: new THREE.MeshLambertMaterial({ color: '#dc2626' }),
  }), [createWindMaterial, createTreeMaterial]);

  const targetPalette = useMemo(() => ({
    Spring: {
      oak: new THREE.Color('#22c55e'),
      autumn: new THREE.Color('#4ade80'),
      pine: new THREE.Color('#1c4a28'),
      bush: new THREE.Color('#22c55e'),
      tallGrass: new THREE.Color('#38a169'),
      medGrass: new THREE.Color('#48bb78'),
      shortGrass: new THREE.Color('#68d391'),
    },
    Summer: {
      oak: new THREE.Color('#1e5e1a'),
      autumn: new THREE.Color('#287024'),
      pine: new THREE.Color('#153a1f'),
      bush: new THREE.Color('#226118'),
      tallGrass: new THREE.Color('#33691e'),
      medGrass: new THREE.Color('#3f782c'),
      shortGrass: new THREE.Color('#558b2f'),
    },
    Autumn: {
      oak: new THREE.Color('#d97706'),
      autumn: new THREE.Color('#ea580c'),
      pine: new THREE.Color('#1b4525'),
      bush: new THREE.Color('#c2410c'),
      tallGrass: new THREE.Color('#a16207'),
      medGrass: new THREE.Color('#b45309'),
      shortGrass: new THREE.Color('#ca8a04'),
    },
    Winter: {
      oak: new THREE.Color('#422817'),
      autumn: new THREE.Color('#422817'),
      pine: new THREE.Color('#224b30'),
      bush: new THREE.Color('#422817'),
      tallGrass: new THREE.Color('#94a3b8'),
      medGrass: new THREE.Color('#cbd5e1'),
      shortGrass: new THREE.Color('#e2e8f0'),
    },
  }), []);

  const bucketsRef = useRef<FoliageBucket[] | null>(null);
  const lastProcessedFoliageVersionRef = useRef<number>(-1);
  const lastSeenGenerationIdRef = useRef<number>(-1);
  const dummyObjRef = useRef<THREE.Object3D>(new THREE.Object3D());

  if (lastSeenGenerationIdRef.current !== (grid.generationId || 0)) {
    lastSeenGenerationIdRef.current = grid.generationId || 0;
    bucketsRef.current = null;
    lastProcessedFoliageVersionRef.current = -1;
  }

  if (!bucketsRef.current) {
    const list: FoliageBucket[] = [];
    for (let bz = 0; bz < rows; bz++) {
      for (let bx = 0; bx < cols; bx++) {
        const bucket: FoliageBucket = {
          cx: (bx + 0.5) * BUCKET_SIZE,
          cz: (bz + 0.5) * BUCKET_SIZE,
          bareTrees: [],
          treeTrunks: [],
          oakCanopies: [],
          autumnCanopies: [],
          pineTrunks: [],
          pineCanopies: [],
          stumps: [],
          fallenLogs: [],
          fallenOakCanopies: [],
          fallenAutumnCanopies: [],
          fallenPineCanopies: [],
          rocks: [],
          bareBushes: [],
          bushes: [],
          tallGrass: [],
          medGrass: [],
          shortGrass: [],
          reeds: [],
          lilies: [],
          flowers: [],
          flowerColors: [],
          pebbles: [],
          mushrooms: [],
        };
        populateBucketFoliage(bucket, bx, bz, grid, dummyObjRef.current, resourceDeposits);
        list.push(bucket);
      }
    }
    bucketsRef.current = list;
    lastProcessedFoliageVersionRef.current = foliageVersion;
    grid.dirtyFoliageBuckets.clear();
  } else if (lastProcessedFoliageVersionRef.current !== foliageVersion) {
    lastProcessedFoliageVersionRef.current = foliageVersion;
    const bucketList = bucketsRef.current;
    if (grid.dirtyFoliageBuckets.size > 0) {
      for (const bucketIdx of grid.dirtyFoliageBuckets) {
        const bz = Math.floor(bucketIdx / cols);
        const bx = bucketIdx % cols;
        const b = bucketList[bucketIdx];
        if (b) {
          populateBucketFoliage(b, bx, bz, grid, dummyObjRef.current, resourceDeposits);
        }
      }
      grid.dirtyFoliageBuckets.clear();
      forceUpdateRef.current = true;
    }
  }
  const buckets = bucketsRef.current;

  useEffect(() => {
    const allMeshes = [
      bareWinterTreeRef.current,
      treeTrunkRef.current,
      oakCanopyRef.current,
      autumnCanopyRef.current,
      pineTrunkRef.current,
      pineCanopyRef.current,
      stumpRef.current,
      fallenLogRef.current,
      fallenOakCanopyRef.current,
      fallenAutumnCanopyRef.current,
      fallenPineCanopyRef.current,
      rockRef.current,
      bareBushRef.current,
      bushRef.current,
      tallGrassRef.current,
      medGrassRef.current,
      shortGrassRef.current,
      reedRef.current,
      lilyRef.current,
      flowerRef.current,
      pebbleRef.current,
      mushroomRef.current,
    ];
    for (const m of allMeshes) {
      if (m) {
        m.count = 0;
        m.visible = false;
      }
    }
    if (flowerRef.current && !flowerRef.current.instanceColor) {
      flowerRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITIES.flower * 3), 3);
    }
    forceUpdateRef.current = true;
  }, []);

  useFrame(() => {
    const curZoom = (window as any).__lastCameraZoom ?? 38;
    const curShowGrass = curZoom >= 11;

    const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
    const camX = camTarget ? camTarget[0] : grid.width / 2;
    const camZ = camTarget ? camTarget[1] : grid.height / 2;

    const { activeTreeHits, time, foliageVersion = 0 } = useGameStore.getState();
    const curSeason = time?.season || 'Spring';
    const isWinterSeason = curSeason === 'Winter';

    const halfSpan = Math.max(54, Math.min(80, Math.ceil((1800 / curZoom) + 14)));
    const minX = Math.max(0, camX - halfSpan);
    const maxX = Math.min(grid.width, camX + halfSpan);
    const minZ = Math.max(0, camZ - halfSpan);
    const maxZ = Math.min(grid.height, camZ + halfSpan);

    const minBx = Math.max(0, Math.floor(minX / BUCKET_SIZE));
    const maxBx = Math.min(cols - 1, Math.floor(maxX / BUCKET_SIZE));
    const minBz = Math.max(0, Math.floor(minZ / BUCKET_SIZE));
    const maxBz = Math.min(rows - 1, Math.floor(maxZ / BUCKET_SIZE));

    const boundsChanged =
      minBx !== lastUpdateRef.current.minBx ||
      maxBx !== lastUpdateRef.current.maxBx ||
      minBz !== lastUpdateRef.current.minBz ||
      maxBz !== lastUpdateRef.current.maxBz;

    const seasonChanged = curSeason !== lastUpdateRef.current.season;
    const grassToggled = curShowGrass !== lastUpdateRef.current.showGrass;
    const verChanged = foliageVersion !== lastUpdateRef.current.foliageVersion;
    const stratChanged = isStrategicView !== lastUpdateRef.current.strategic;

    if (
      forceUpdateRef.current ||
      boundsChanged ||
      seasonChanged ||
      grassToggled ||
      verChanged ||
      stratChanged
    ) {
      if (!isStrategicView) {
        lastUpdateRef.current = {
          minBx,
          maxBx,
          minBz,
          maxBz,
          season: curSeason,
          showGrass: curShowGrass,
          foliageVersion,
          strategic: isStrategicView,
        };
        forceUpdateRef.current = false;

        const visibleBuckets: FoliageBucket[] = [];
        for (let bz = minBz; bz <= maxBz; bz++) {
          const rowOffset = bz * cols;
          for (let bx = minBx; bx <= maxBx; bx++) {
            visibleBuckets.push(buckets[rowOffset + bx]);
          }
        }

        visibleBuckets.sort((a, b) => {
          const da = (a.cx - camX) * (a.cx - camX) + (a.cz - camZ) * (a.cz - camZ);
          const db = (b.cx - camX) * (b.cx - camX) + (b.cz - camZ) * (b.cz - camZ);
          return da - db;
        });

        const updateMesh = (
          meshRef: React.RefObject<THREE.InstancedMesh | null>,
          key: keyof FoliageBucket,
          capacity: number,
          visibleCondition: boolean
        ) => {
          const mesh = meshRef.current;
          if (!mesh) return;

          if (!visibleCondition) {
            if (mesh.count !== 0) {
              mesh.count = 0;
              mesh.visible = false;
            }
            return;
          }

          const array = mesh.instanceMatrix.array as Float32Array;
          let count = 0;

          for (let i = 0; i < visibleBuckets.length; i++) {
            const list = visibleBuckets[i][key] as THREE.Matrix4[];
            if (!list || list.length === 0) continue;
            for (let j = 0; j < list.length; j++) {
              if (count < capacity) {
                array.set(list[j].elements, count * 16);
                count++;
              }
            }
          }

          if (count === 0 && mesh.count === 0) {
            mesh.visible = false;
            return;
          }

          mesh.count = count;
          mesh.visible = count > 0;
          mesh.instanceMatrix.needsUpdate = true;
        };

        updateMesh(bareWinterTreeRef, 'bareTrees', CAPACITIES.tree, isWinterSeason);
        updateMesh(treeTrunkRef, 'treeTrunks', CAPACITIES.tree, !isWinterSeason);
        updateMesh(oakCanopyRef, 'oakCanopies', CAPACITIES.tree, !isWinterSeason);
        updateMesh(autumnCanopyRef, 'autumnCanopies', CAPACITIES.tree, !isWinterSeason);
        updateMesh(pineTrunkRef, 'pineTrunks', CAPACITIES.tree, true);
        updateMesh(pineCanopyRef, 'pineCanopies', CAPACITIES.tree, true);

        updateMesh(stumpRef, 'stumps', CAPACITIES.fallen, true);
        updateMesh(fallenLogRef, 'fallenLogs', CAPACITIES.fallen, true);
        updateMesh(fallenOakCanopyRef, 'fallenOakCanopies', CAPACITIES.fallen, !isWinterSeason);
        updateMesh(fallenAutumnCanopyRef, 'fallenAutumnCanopies', CAPACITIES.fallen, !isWinterSeason);
        updateMesh(fallenPineCanopyRef, 'fallenPineCanopies', CAPACITIES.fallen, true);

        updateMesh(rockRef, 'rocks', CAPACITIES.rock, true);
        updateMesh(bareBushRef, 'bareBushes', CAPACITIES.bush, isWinterSeason);
        updateMesh(bushRef, 'bushes', CAPACITIES.bush, !isWinterSeason);

        updateMesh(tallGrassRef, 'tallGrass', CAPACITIES.tallGrass, curShowGrass && !isWinterSeason);
        updateMesh(medGrassRef, 'medGrass', CAPACITIES.medGrass, curShowGrass && !isWinterSeason);
        updateMesh(shortGrassRef, 'shortGrass', CAPACITIES.shortGrass, curShowGrass);
        updateMesh(reedRef, 'reeds', CAPACITIES.reed, curShowGrass && !isWinterSeason);
        updateMesh(lilyRef, 'lilies', CAPACITIES.lily, curShowGrass && !isWinterSeason);
        updateMesh(pebbleRef, 'pebbles', CAPACITIES.pebble, curShowGrass);
        updateMesh(mushroomRef, 'mushrooms', CAPACITIES.mushroom, curShowGrass && !isWinterSeason);

        const flowerMesh = flowerRef.current;
        if (flowerMesh) {
          const renderFlowers = curShowGrass && !isWinterSeason;
          if (!renderFlowers) {
            if (flowerMesh.count !== 0) {
              flowerMesh.count = 0;
              flowerMesh.visible = false;
            }
          } else {
            const matArray = flowerMesh.instanceMatrix.array as Float32Array;
            if (!flowerMesh.instanceColor) {
              flowerMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITIES.flower * 3), 3);
            }
            const colArray = flowerMesh.instanceColor.array as Float32Array;
            let count = 0;

            for (let i = 0; i < visibleBuckets.length; i++) {
              const b = visibleBuckets[i];
              const matsList = b.flowers;
              const colsList = b.flowerColors;
              if (!matsList || matsList.length === 0) continue;
              for (let j = 0; j < matsList.length; j++) {
                if (count < CAPACITIES.flower) {
                  matArray.set(matsList[j].elements, count * 16);
                  colArray[count * 3] = colsList[j * 3];
                  colArray[count * 3 + 1] = colsList[j * 3 + 1];
                  colArray[count * 3 + 2] = colsList[j * 3 + 2];
                  count++;
                }
              }
            }

            if (count > 0 || flowerMesh.count > 0) {
              flowerMesh.count = count;
              flowerMesh.visible = count > 0;
              flowerMesh.instanceMatrix.needsUpdate = true;
              flowerMesh.instanceColor.needsUpdate = true;
            }
          }
        }
      }
    }

    const t = performance.now() / 1000;
    const palette = targetPalette[curSeason];
    if (palette) {
      const factor = 0.08;
      mats.oak.color.lerp(palette.oak, factor);
      mats.autumn.color.lerp(palette.autumn, factor);
      mats.pine.color.lerp(palette.pine, factor);
      mats.bush.color.lerp(palette.bush, factor);
      mats.tallGrassMat.color.lerp(palette.tallGrass, factor);
      mats.medGrassMat.color.lerp(palette.medGrass, factor);
      mats.shortGrassMat.color.lerp(palette.shortGrass, factor);
    }

    const targetCanopyScale = curSeason === 'Winter' ? 0.0 : 1.0;
    const targetFlowerScale = curSeason === 'Winter' ? 0.0 : curSeason === 'Autumn' ? 0.35 : 1.0;

    canopyScaleRef.current = THREE.MathUtils.lerp(canopyScaleRef.current, targetCanopyScale, 0.08);
    flowerScaleRef.current = THREE.MathUtils.lerp(flowerScaleRef.current, targetFlowerScale, 0.08);

    for (let i = 0; i < windShadersRef.current.length; i++) {
      const item = windShadersRef.current[i];
      if (!item) continue;
      if (item.shader?.uniforms?.uTime) {
        item.shader.uniforms.uTime.value = t;
      }
      if (item.isFlower && item.shader?.uniforms?.uFlowerScale) {
        item.shader.uniforms.uFlowerScale.value = flowerScaleRef.current;
      }
    }

    for (let i = 0; i < treeShadersRef.current.length; i++) {
      const item = treeShadersRef.current[i];
      if (!item) continue;
      const shader = item.shader;
      if (shader.uniforms?.uTime) {
        shader.uniforms.uTime.value = t;
      }
      if (item.isCanopy && shader.uniforms?.uCanopyScale) {
        shader.uniforms.uCanopyScale.value = canopyScaleRef.current;
      }
      if (shader.uniforms?.uTreeHits) {
        const uniformHits: THREE.Vector4[] = shader.uniforms.uTreeHits.value;
        for (let j = 0; j < 8; j++) {
          const hit = activeTreeHits[j];
          if (hit) {
            uniformHits[j].set(hit.x, hit.z, hit.hitTime, hit.intensity);
          } else {
            uniformHits[j].set(0, 0, 0, 0);
          }
        }
      }
    }
  });

  return (
    <group visible={!isStrategicView} raycast={() => null}>
      <instancedMesh ref={bareWinterTreeRef} args={[geos.bareWinterTreeGeo, mats.wood, CAPACITIES.tree]} frustumCulled={false} />
      <instancedMesh ref={treeTrunkRef} args={[geos.trunkGeo, mats.wood, CAPACITIES.tree]} frustumCulled={false} />
      <instancedMesh ref={oakCanopyRef} args={[geos.oakCanopyGeo, mats.oak, CAPACITIES.tree]} frustumCulled={false} />
      <instancedMesh ref={autumnCanopyRef} args={[geos.oakCanopyGeo, mats.autumn, CAPACITIES.tree]} frustumCulled={false} />

      <instancedMesh ref={pineTrunkRef} args={[geos.pineTrunkGeo, mats.wood, CAPACITIES.tree]} frustumCulled={false} />
      <instancedMesh ref={pineCanopyRef} args={[geos.pineCanopyGeo, mats.pine, CAPACITIES.tree]} frustumCulled={false} />

      <instancedMesh ref={stumpRef} args={[geos.stumpGeo, mats.wood, CAPACITIES.fallen]} frustumCulled={false} />
      <instancedMesh ref={fallenLogRef} args={[geos.fallenLogGeo, mats.wood, CAPACITIES.fallen]} frustumCulled={false} />
      <instancedMesh ref={fallenOakCanopyRef} args={[geos.oakCanopyGeo, mats.oak, CAPACITIES.fallen]} frustumCulled={false} />
      <instancedMesh ref={fallenAutumnCanopyRef} args={[geos.oakCanopyGeo, mats.autumn, CAPACITIES.fallen]} frustumCulled={false} />
      <instancedMesh ref={fallenPineCanopyRef} args={[geos.pineCanopyGeo, mats.pine, CAPACITIES.fallen]} frustumCulled={false} />

      <instancedMesh ref={rockRef} args={[geos.rockGeo, mats.rock, CAPACITIES.rock]} frustumCulled={false} />
      <instancedMesh ref={bareBushRef} args={[geos.bareBushGeo, mats.wood, CAPACITIES.bush]} frustumCulled={false} />
      <instancedMesh ref={bushRef} args={[geos.bushGeo, mats.bush, CAPACITIES.bush]} frustumCulled={false} />

      <instancedMesh ref={tallGrassRef} args={[geos.tallGrassGeo, mats.tallGrassMat, CAPACITIES.tallGrass]} frustumCulled={false} />
      <instancedMesh ref={medGrassRef} args={[geos.medGrassGeo, mats.medGrassMat, CAPACITIES.medGrass]} frustumCulled={false} />
      <instancedMesh ref={shortGrassRef} args={[geos.shortGrassGeo, mats.shortGrassMat, CAPACITIES.shortGrass]} frustumCulled={false} />
      <instancedMesh ref={reedRef} args={[geos.reedGeo, mats.reed, CAPACITIES.reed]} frustumCulled={false} />
      <instancedMesh ref={lilyRef} args={[geos.lilyGeo, mats.lily, CAPACITIES.lily]} frustumCulled={false} />
      <instancedMesh ref={flowerRef} args={[geos.flowerGeo, mats.flowerMat, CAPACITIES.flower]} frustumCulled={false} />
      <instancedMesh ref={pebbleRef} args={[geos.pebbleGeo, mats.pebble, CAPACITIES.pebble]} frustumCulled={false} />
      <instancedMesh ref={mushroomRef} args={[geos.shroomGeo, mats.mushroom, CAPACITIES.mushroom]} frustumCulled={false} />
      <FallingTreesContainer grid={grid} />
    </group>
  );
}
