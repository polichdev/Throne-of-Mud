import { DEFAULT_CAMERA_ZOOM } from '../../../constants/camera';
import { FAUNA_LOD } from '../../../constants/rendering';
import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GridMap } from '../../../engine/grid/GridMap';
import { useGameStore } from '../../../store/useGameStore';
import { useHiddenGroupCulling } from '../performance/hiddenGroupCulling';

interface Props {
  grid: GridMap;
}

interface BirdIndividual {
  relX: number;
  relZ: number;
  relY: number;
  wingSpeed: number;
  wingPhase: number;
  glideTimer: number;
}

interface BirdFlock {
  id: string;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  angle: number;
  speed: number;
  altitude: number;
  isLanded: boolean;
  landTimer: number;
  birds: BirdIndividual[];
}

interface DeerAnimal {
  id: string;
  isStag: boolean;
  coat: number;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  angle: number;
  state: 'idle' | 'walk' | 'graze';
  stateTimer: number;
  speed: number;
}

interface HareAnimal {
  id: string;
  coat: number;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  angle: number;
  state: 'idle' | 'hop' | 'perk';
  stateTimer: number;
  hopPhase: number;
}

interface FoxAnimal {
  id: string;
  coat: number;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  angle: number;
  state: 'idle' | 'stalk';
  stateTimer: number;
  trotPhase: number;
}

interface BoarAnimal {
  id: string;
  coat: number;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  angle: number;
  state: 'idle' | 'trot' | 'snuffle';
  stateTimer: number;
  trotPhase: number;
}

const FAUNA_MATS = {
  birdFeather: new THREE.MeshStandardMaterial({ color: '#4a5360', roughness: 0.88, flatShading: true }),
  birdWing: new THREE.MeshStandardMaterial({ color: '#303b49', roughness: 0.92, flatShading: true, side: THREE.DoubleSide }),
  birdBelly: new THREE.MeshStandardMaterial({ color: '#8e9190', roughness: 0.9, flatShading: true }),
  birdBeak: new THREE.MeshStandardMaterial({ color: '#b89a60', roughness: 0.75, flatShading: true }),

  stagBody: new THREE.MeshStandardMaterial({ color: '#8d6040', roughness: 0.95, flatShading: true }),
  doeBody: new THREE.MeshStandardMaterial({ color: '#a57b55', roughness: 0.95, flatShading: true }),
  doeBodyLight: new THREE.MeshStandardMaterial({ color: '#b58c64', roughness: 0.95, flatShading: true }),
  doeBodyDark: new THREE.MeshStandardMaterial({ color: '#8b664b', roughness: 0.95, flatShading: true }),
  deerShoulder: new THREE.MeshStandardMaterial({ color: '#765037', roughness: 0.95, flatShading: true }),
  deerRump: new THREE.MeshStandardMaterial({ color: '#d1bb91', roughness: 0.95, flatShading: true }),
  deerBelly: new THREE.MeshStandardMaterial({ color: '#c5ad85', roughness: 0.95, flatShading: true }),
  deerAntler: new THREE.MeshStandardMaterial({ color: '#d5bd8e', roughness: 0.9, flatShading: true }),
  deerLeg: new THREE.MeshStandardMaterial({ color: '#604b3c', roughness: 0.95, flatShading: true }),

  hareFur: new THREE.MeshStandardMaterial({ color: '#927254', roughness: 0.98, flatShading: true }),
  hareFurLight: new THREE.MeshStandardMaterial({ color: '#ab906e', roughness: 0.98, flatShading: true }),
  hareFurDark: new THREE.MeshStandardMaterial({ color: '#79634f', roughness: 0.98, flatShading: true }),
  hareBack: new THREE.MeshStandardMaterial({ color: '#715b49', roughness: 0.98, flatShading: true }),
  hareBelly: new THREE.MeshStandardMaterial({ color: '#d3c5aa', roughness: 0.95, flatShading: true }),
  hareEars: new THREE.MeshStandardMaterial({ color: '#aa796e', roughness: 0.95, flatShading: true }),
  hareTail: new THREE.MeshStandardMaterial({ color: '#ded5bd', roughness: 0.95, flatShading: true }),

  foxFur: new THREE.MeshStandardMaterial({ color: '#a95530', roughness: 0.94, flatShading: true }),
  foxFurDark: new THREE.MeshStandardMaterial({ color: '#875039', roughness: 0.94, flatShading: true }),
  foxBack: new THREE.MeshStandardMaterial({ color: '#763d2d', roughness: 0.94, flatShading: true }),
  foxWhite: new THREE.MeshStandardMaterial({ color: '#eee0bf', roughness: 0.92, flatShading: true }),
  foxLegs: new THREE.MeshStandardMaterial({ color: '#352d2b', roughness: 0.94, flatShading: true }),

  boarBody: new THREE.MeshStandardMaterial({ color: '#5b4b3e', roughness: 0.98, flatShading: true }),
  boarBodyLight: new THREE.MeshStandardMaterial({ color: '#716050', roughness: 0.98, flatShading: true }),
  boarMane: new THREE.MeshStandardMaterial({ color: '#352e29', roughness: 0.98, flatShading: true }),
  boarSnout: new THREE.MeshStandardMaterial({ color: '#806452', roughness: 0.94, flatShading: true }),
  boarTusk: new THREE.MeshStandardMaterial({ color: '#dfd2ac', roughness: 0.78, flatShading: true }),
  eye: new THREE.MeshStandardMaterial({ color: '#1d1b19', roughness: 0.4 }),
  hoof: new THREE.MeshStandardMaterial({ color: '#312b28', roughness: 0.95, flatShading: true }),
};

const softShape = (width: number, height: number, depth: number) =>
  new THREE.IcosahedronGeometry(1, 1).scale(width / 2, height / 2, depth / 2);

const FAUNA_GEOS = {
  birdBody: softShape(0.27, 0.17, 0.36),
  birdHead: softShape(0.14, 0.14, 0.14),
  birdBeak: new THREE.ConeGeometry(0.035, 0.11, 4),
  birdWing: softShape(0.31, 0.025, 0.13),
  birdFeather: softShape(0.16, 0.02, 0.07),
  birdTail: new THREE.ConeGeometry(0.07, 0.21, 4),

  deerTorso: softShape(0.45, 0.44, 0.83),
  deerShoulder: softShape(0.42, 0.44, 0.36),
  deerRump: softShape(0.31, 0.25, 0.20),
  deerNeck: softShape(0.21, 0.45, 0.26),
  deerHead: softShape(0.23, 0.19, 0.30),
  deerMuzzle: softShape(0.15, 0.11, 0.22),
  deerLeg: new THREE.CylinderGeometry(0.035, 0.052, 0.43, 5),
  deerHoof: softShape(0.105, 0.065, 0.14),
  deerEar: new THREE.ConeGeometry(0.075, 0.21, 4),
  deerTail: softShape(0.10, 0.10, 0.16),
  antlerMain: new THREE.CylinderGeometry(0.017, 0.035, 0.34, 5),
  antlerTine: new THREE.CylinderGeometry(0.009, 0.022, 0.22, 5),

  hareBody: softShape(0.26, 0.22, 0.38),
  hareHaunch: softShape(0.16, 0.20, 0.19),
  hareHead: softShape(0.17, 0.16, 0.20),
  hareEar: softShape(0.055, 0.27, 0.075),
  hareInnerEar: softShape(0.026, 0.22, 0.025),
  hareTail: softShape(0.09, 0.09, 0.09),
  hareLeg: softShape(0.07, 0.08, 0.14),

  foxTorso: softShape(0.30, 0.27, 0.66),
  foxHead: softShape(0.22, 0.19, 0.26),
  foxSnout: new THREE.ConeGeometry(0.083, 0.24, 5),
  foxEar: new THREE.ConeGeometry(0.068, 0.15, 4),
  foxTail: softShape(0.24, 0.23, 0.53),
  foxTailTip: softShape(0.17, 0.16, 0.20),
  foxLeg: new THREE.CylinderGeometry(0.036, 0.049, 0.25, 5),

  boarTorso: softShape(0.52, 0.49, 0.80),
  boarShoulder: softShape(0.54, 0.55, 0.45),
  boarHead: softShape(0.32, 0.29, 0.37),
  boarSnout: new THREE.CylinderGeometry(0.095, 0.11, 0.12, 8),
  boarLeg: new THREE.CylinderGeometry(0.063, 0.08, 0.24, 5),
  boarTusk: new THREE.ConeGeometry(0.032, 0.15, 5),
  boarBristle: new THREE.ConeGeometry(0.05, 0.17, 4),
  eye: new THREE.SphereGeometry(0.023, 6, 5),
};

function canRoam(grid: GridMap, x: number, z: number): boolean {
  const tile = grid.getTile(Math.floor(x), Math.floor(z));
  return !!tile && tile.isPassable && tile.terrain !== 'water' && !tile.buildingId;
}

function wildlifeSpawn(grid: GridMap, nearX?: number, nearZ?: number, radius = 15): [number, number] {
  for (let attempt = 0; attempt < 24; attempt++) {
    const x = Math.max(8, Math.min(grid.width - 8, nearX === undefined ? 8 + Math.random() * (grid.width - 16) : nearX + (Math.random() - 0.5) * radius * 2));
    const z = Math.max(8, Math.min(grid.height - 8, nearZ === undefined ? 8 + Math.random() * (grid.height - 16) : nearZ + (Math.random() - 0.5) * radius * 2));
    if (canRoam(grid, x, z) && GridMap.getDistanceToHighway(x, z) > 4) return [x, z];
  }
  return [Math.max(8, Math.min(grid.width - 8, nearX ?? grid.width / 2)), Math.max(8, Math.min(grid.height - 8, nearZ ?? grid.height / 2))];
}

function turnToward(current: number, target: number, delta: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * (1 - Math.exp(-7 * delta));
}

function animateLegs(legs: (THREE.Group | null | undefined)[], phase: number, moving: boolean, delta: number, stride: number) {
  legs.forEach((leg, index) => {
    if (!leg) return;
    const gait = moving ? Math.sin(phase + (index === 0 || index === 3 ? 0 : Math.PI)) : 0;
    leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, gait * stride, 11, delta);
    const lower = leg.getObjectByName('lower-leg');
    if (lower) lower.rotation.x = THREE.MathUtils.damp(lower.rotation.x, moving ? -Math.max(0, gait) * 0.50 : 0, 11, delta);
  });
}

function wildlifePaused(): boolean {
  const { isStrategicView, time } = useGameStore.getState();
  return isStrategicView || time.isPaused || time.speedMultiplier === 0;
}

function BirdFlockGroup({ flock, grid }: { flock: BirdFlock; grid: GridMap }) {
  const groupRef = useRef<THREE.Group>(null);
  const birdRefs = useRef<THREE.Group[]>([]);
  const leftWingRefs = useRef<THREE.Group[]>([]);
  const rightWingRefs = useRef<THREE.Group[]>([]);

  useFrame((_, delta) => {
    if (wildlifePaused()) return;
    if (!groupRef.current) return;

    flock.angle += flock.speed * delta;
    if (flock.angle > Math.PI * 2) flock.angle -= Math.PI * 2;

    const fx = flock.centerX + Math.cos(flock.angle) * flock.radiusX;
    const fz = flock.centerZ + Math.sin(flock.angle) * flock.radiusZ;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || DEFAULT_CAMERA_ZOOM;
    if (camTarget) {
      const distSq = (fx - camTarget[0]) ** 2 + (fz - camTarget[1]) ** 2;
      const maxDist = Math.max(FAUNA_LOD.flockMinDistance, (FAUNA_LOD.flockZoomScale / zoom) + FAUNA_LOD.flockMargin);
      if (distSq > maxDist * maxDist) {
        groupRef.current.visible = false;
        return;
      }
      groupRef.current.visible = true;
    }

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(fx)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(fz)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    groupRef.current.position.set(fx, groundH + flock.altitude, fz);

    const tangentAngle = flock.angle + Math.PI / 2;
    groupRef.current.rotation.y = -tangentAngle + Math.PI / 2;
    groupRef.current.rotation.z = Math.sin(flock.angle) * 0.18;

    flock.birds.forEach((b, idx) => {
      const bObj = birdRefs.current[idx];
      const lWing = leftWingRefs.current[idx];
      const rWing = rightWingRefs.current[idx];
      if (!bObj || !lWing || !rWing) return;

      b.wingPhase += b.wingSpeed * delta;
      b.glideTimer -= delta;
      if (b.glideTimer <= 0) {
        b.glideTimer = 2.0 + Math.random() * 3.5;
      }

      const isGliding = b.glideTimer > 1.8;
      const flap = isGliding ? 0.10 : Math.sin(b.wingPhase) * 0.75;

      lWing.rotation.z = flap;
      rWing.rotation.z = -flap;
      bObj.position.y = b.relY + Math.sin(b.wingPhase) * (isGliding ? 0.015 : 0.045);
    });
  });

  return (
    <group ref={groupRef}>
      {flock.birds.map((b, idx) => (
        <group
          key={`bird-${flock.id}-${idx}`}
          ref={(el) => {
            if (el) birdRefs.current[idx] = el;
          }}
          position={[b.relX, b.relY, b.relZ]}
          scale={0.55}
        >
          <mesh geometry={FAUNA_GEOS.birdBody} material={FAUNA_MATS.birdFeather} />
          <mesh geometry={FAUNA_GEOS.birdBody} material={FAUNA_MATS.birdBelly} position={[0, -0.045, 0.04]} scale={[0.83, 0.46, 0.72]} />
          <mesh geometry={FAUNA_GEOS.birdHead} material={FAUNA_MATS.birdFeather} position={[0, 0.045, 0.16]} />
          <mesh geometry={FAUNA_GEOS.birdBeak} material={FAUNA_MATS.birdBeak} position={[0, 0.025, 0.27]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={FAUNA_GEOS.birdTail} material={FAUNA_MATS.birdWing} position={[0, 0.005, -0.23]} rotation={[-Math.PI / 2, 0, 0]} />
          <group ref={el => { if (el) leftWingRefs.current[idx] = el; }} position={[-0.10, 0.04, 0]}>
            <mesh geometry={FAUNA_GEOS.birdWing} material={FAUNA_MATS.birdWing} position={[-0.14, 0, -0.01]} rotation={[0, 0.15, 0]} />
            <mesh geometry={FAUNA_GEOS.birdFeather} material={FAUNA_MATS.birdFeather} position={[-0.25, -0.005, -0.035]} />
          </group>
          <group ref={el => { if (el) rightWingRefs.current[idx] = el; }} position={[0.10, 0.04, 0]}>
            <mesh geometry={FAUNA_GEOS.birdWing} material={FAUNA_MATS.birdWing} position={[0.14, 0, -0.01]} rotation={[0, -0.15, 0]} />
            <mesh geometry={FAUNA_GEOS.birdFeather} material={FAUNA_MATS.birdFeather} position={[0.25, -0.005, -0.035]} />
          </group>
        </group>
      ))}
    </group>
  );
}

function DeerHerdMember({ deer, grid }: { deer: DeerAnimal; grid: GridMap }) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const legFLRef = useRef<THREE.Group>(null);
  const legFRRef = useRef<THREE.Group>(null);
  const legBLRef = useRef<THREE.Group>(null);
  const legBRRef = useRef<THREE.Group>(null);
  const walkPhase = useRef(Math.random() * Math.PI * 2);
  const lifePhase = useRef(deer.x * 0.37 + deer.z * 0.19);

  useFrame((_, delta) => {
    if (wildlifePaused()) return;
    if (!rootRef.current) return;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || DEFAULT_CAMERA_ZOOM;
    if (camTarget) {
      const distSq = (deer.x - camTarget[0]) ** 2 + (deer.z - camTarget[1]) ** 2;
      const maxDist = Math.max(FAUNA_LOD.minDistance, Math.min(FAUNA_LOD.maxDistance, (FAUNA_LOD.zoomScale / zoom) + FAUNA_LOD.margin));
      const isVis = distSq < maxDist * maxDist;
      rootRef.current.visible = isVis;
      if (!isVis) return;
    }
    lifePhase.current += delta;

    deer.stateTimer -= delta;
    if (deer.stateTimer <= 0) {
      const r = Math.random();
      if (r < 0.45) {
        deer.state = 'graze';
        deer.stateTimer = 4.0 + Math.random() * 6.0;
      } else if (r < 0.75) {
        deer.state = 'walk';
        deer.stateTimer = 3.0 + Math.random() * 5.0;
        const dist = 3.0 + Math.random() * 5.0;
        const ang = Math.random() * Math.PI * 2;
        deer.targetX = Math.max(6, Math.min(grid.width - 6, deer.x + Math.cos(ang) * dist));
        deer.targetZ = Math.max(6, Math.min(grid.height - 6, deer.z + Math.sin(ang) * dist));
      } else {
        deer.state = 'idle';
        deer.stateTimer = 3.0 + Math.random() * 4.0;
      }
    }

    if (deer.state === 'walk') {
      const dx = deer.targetX - deer.x;
      const dz = deer.targetZ - deer.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.2) {
        deer.angle = Math.atan2(dx, dz);
        const step = Math.min(dist, deer.speed * delta);
        const nextX = deer.x + (dx / dist) * step;
        const nextZ = deer.z + (dz / dist) * step;
        if (!canRoam(grid, nextX, nextZ)) {
          deer.state = 'idle';
          deer.stateTimer = 1 + Math.random() * 2;
        } else {
          deer.x = nextX;
          deer.z = nextZ;
        }
        walkPhase.current += delta * 6.5;
      } else {
        deer.state = 'graze';
        deer.stateTimer = 4.0 + Math.random() * 4.0;
      }
    }
    animateLegs([legFLRef.current, legFRRef.current, legBLRef.current, legBRRef.current], walkPhase.current, deer.state === 'walk', delta, 0.38);

    if (bodyRef.current) bodyRef.current.position.y = deer.state === 'walk' ? Math.sin(walkPhase.current * 2) * 0.018 : Math.sin(lifePhase.current * 1.8) * 0.006;
    if (neckRef.current) {
      if (deer.state === 'graze') {
        neckRef.current.rotation.x = THREE.MathUtils.damp(neckRef.current.rotation.x, 0.62 + Math.sin(lifePhase.current * 1.2) * 0.08, 3.0, delta);
      } else {
        neckRef.current.rotation.x = THREE.MathUtils.damp(neckRef.current.rotation.x, 0.0, 3.0, delta);
      }
    }

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(deer.x)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(deer.z)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    rootRef.current.position.set(deer.x, groundH, deer.z);
    rootRef.current.rotation.y = turnToward(rootRef.current.rotation.y, deer.angle, delta);
  });

  const bodyMat = deer.isStag ? FAUNA_MATS.stagBody : [FAUNA_MATS.doeBody, FAUNA_MATS.doeBodyLight, FAUNA_MATS.doeBodyDark][deer.coat];

  return (
    <group ref={rootRef} position={[deer.x, 0, deer.z]} scale={0.65}>
      <group ref={bodyRef}>
      <mesh geometry={FAUNA_GEOS.deerTorso} material={bodyMat} position={[0, 0.51, 0]} />
      <mesh geometry={FAUNA_GEOS.deerShoulder} material={deer.isStag ? FAUNA_MATS.deerShoulder : bodyMat} position={[0, 0.53, 0.25]} />
      <mesh geometry={FAUNA_GEOS.deerTorso} material={FAUNA_MATS.deerBelly} position={[0, 0.38, 0.03]} scale={[0.82, 0.27, 0.86]} />
      <mesh geometry={FAUNA_GEOS.deerRump} material={FAUNA_MATS.deerRump} position={[0, 0.51, -0.40]} />
      <mesh geometry={FAUNA_GEOS.deerTail} material={FAUNA_MATS.deerRump} position={[0, 0.57, -0.51]} rotation={[-0.4, 0, 0]} />

      <group ref={neckRef} position={[0, 0.64, 0.32]}>
        <mesh geometry={FAUNA_GEOS.deerNeck} material={bodyMat} position={[0, 0.17, 0.07]} rotation={[0.28, 0, 0]} />
        <mesh geometry={FAUNA_GEOS.deerHead} material={bodyMat} position={[0, 0.37, 0.18]} />
        <mesh geometry={FAUNA_GEOS.deerMuzzle} material={FAUNA_MATS.deerBelly} position={[0, 0.32, 0.37]} />
        <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[-0.115, 0.395, 0.23]} />
        <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[0.115, 0.395, 0.23]} />
        <mesh geometry={FAUNA_GEOS.deerEar} material={bodyMat} position={[-0.17, 0.48, 0.11]} rotation={[0.12, 0, 0.86]} />
        <mesh geometry={FAUNA_GEOS.deerEar} material={bodyMat} position={[0.17, 0.48, 0.11]} rotation={[0.12, 0, -0.86]} />

        {deer.isStag && (
          <group position={[0, 0.46, 0.13]}>
            {([-1, 1] as const).map(side => <group key={side}>
              <mesh geometry={FAUNA_GEOS.antlerMain} material={FAUNA_MATS.deerAntler} position={[side * 0.18, 0.17, 0]} rotation={[0, 0, side * -0.48]} />
              <mesh geometry={FAUNA_GEOS.antlerMain} material={FAUNA_MATS.deerAntler} position={[side * 0.31, 0.43, 0]} rotation={[0, 0, side * -0.35]} scale={0.8} />
              <mesh geometry={FAUNA_GEOS.antlerTine} material={FAUNA_MATS.deerAntler} position={[side * 0.17, 0.29, 0.12]} rotation={[0.48, 0, side * 0.20]} />
              <mesh geometry={FAUNA_GEOS.antlerTine} material={FAUNA_MATS.deerAntler} position={[side * 0.32, 0.49, 0.09]} rotation={[0.36, 0, side * 0.32]} />
              <mesh geometry={FAUNA_GEOS.antlerTine} material={FAUNA_MATS.deerAntler} position={[side * 0.41, 0.56, -0.06]} rotation={[-0.4, 0, side * -0.45]} scale={0.8} />
            </group>)}
          </group>
        )}
      </group>
      </group>

      {([[-1, 1, legFLRef], [1, 1, legFRRef], [-1, -1, legBLRef], [1, -1, legBRRef]] as const).map(([side, end, ref]) =>
        <group key={`${side}-${end}`} ref={ref} position={[side * 0.15, 0.42, end * 0.29]}>
          <mesh geometry={FAUNA_GEOS.deerLeg} material={end === 1 ? bodyMat : FAUNA_MATS.deerLeg} position={[0, -0.11, 0]} scale={[1, 0.52, 1]} />
          <group name="lower-leg" position={[0, -0.22, 0]}>
            <mesh geometry={FAUNA_GEOS.deerLeg} material={FAUNA_MATS.deerLeg} position={[0, -0.10, 0]} scale={[0.82, 0.48, 0.82]} />
            <mesh geometry={FAUNA_GEOS.deerHoof} material={FAUNA_MATS.hoof} position={[0, -0.22, 0.03]} />
          </group>
        </group>)}
    </group>
  );
}

function HareAnimalMember({ hare, grid }: { hare: HareAnimal; grid: GridMap }) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const earsRef = useRef<THREE.Group>(null);
  const hindLegRefs = useRef<THREE.Group[]>([]);
  const lifePhase = useRef(hare.x * 0.37 + hare.z * 0.19);
  const furMat = [FAUNA_MATS.hareFur, FAUNA_MATS.hareFurLight, FAUNA_MATS.hareFurDark][hare.coat];

  useFrame((_, delta) => {
    if (wildlifePaused()) return;
    if (!rootRef.current) return;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || DEFAULT_CAMERA_ZOOM;
    if (camTarget) {
      const distSq = (hare.x - camTarget[0]) ** 2 + (hare.z - camTarget[1]) ** 2;
      const maxDist = Math.max(FAUNA_LOD.minDistance, Math.min(FAUNA_LOD.maxDistance, (FAUNA_LOD.zoomScale / zoom) + FAUNA_LOD.margin));
      const isVis = distSq < maxDist * maxDist;
      rootRef.current.visible = isVis;
      if (!isVis) return;
    }
    lifePhase.current += delta;

    hare.stateTimer -= delta;
    if (hare.stateTimer <= 0) {
      const r = Math.random();
      if (r < 0.5) {
        hare.state = 'hop';
        hare.stateTimer = 2.0 + Math.random() * 3.0;
        const dist = 2.5 + Math.random() * 4.0;
        const ang = Math.random() * Math.PI * 2;
        hare.targetX = Math.max(5, Math.min(grid.width - 5, hare.x + Math.cos(ang) * dist));
        hare.targetZ = Math.max(5, Math.min(grid.height - 5, hare.z + Math.sin(ang) * dist));
      } else if (r < 0.8) {
        hare.state = 'perk';
        hare.stateTimer = 2.5 + Math.random() * 3.5;
      } else {
        hare.state = 'idle';
        hare.stateTimer = 2.0 + Math.random() * 3.0;
      }
    }

    let hopY = 0;
    if (hare.state === 'hop') {
      const dx = hare.targetX - hare.x;
      const dz = hare.targetZ - hare.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.15) {
        hare.angle = Math.atan2(dx, dz);
        const speed = 1.7 + Math.max(0, Math.sin(hare.hopPhase)) * 1.2;
        const step = Math.min(dist, speed * delta);
        const nextX = hare.x + (dx / dist) * step;
        const nextZ = hare.z + (dz / dist) * step;
        if (!canRoam(grid, nextX, nextZ)) {
          hare.state = 'idle';
          hare.stateTimer = 1 + Math.random() * 2;
        } else {
          hare.x = nextX;
          hare.z = nextZ;
        }
        hare.hopPhase += delta * 14.0;
        hopY = Math.max(0, Math.sin(hare.hopPhase)) * 0.24;
      } else {
        hare.state = 'idle';
        hare.stateTimer = 2.0 + Math.random() * 3.0;
      }
    }

    if (headRef.current) {
      if (hare.state === 'perk') {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.4, delta * 6.0);
      } else {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.0, delta * 4.0);
      }
    }
    if (earsRef.current) {
      earsRef.current.rotation.z = Math.sin(lifePhase.current * 2.5) * (hare.state === 'perk' ? 0.13 : 0.04);
      earsRef.current.rotation.x = THREE.MathUtils.damp(earsRef.current.rotation.x, hare.state === 'hop' ? -0.35 : 0, 6, delta);
    }
    if (bodyRef.current) bodyRef.current.scale.y = hare.state === 'hop' ? 1 - Math.max(0, -Math.sin(hare.hopPhase)) * 0.11 : 1;
    hindLegRefs.current.forEach((leg, index) => {
      leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, hare.state === 'hop' ? Math.sin(hare.hopPhase + index * 0.14) * 0.5 : 0, 9, delta);
    });

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(hare.x)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(hare.z)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    rootRef.current.position.set(hare.x, groundH + hopY, hare.z);
    rootRef.current.rotation.y = turnToward(rootRef.current.rotation.y, hare.angle, delta);
  });

  return (
    <group ref={rootRef} position={[hare.x, 0, hare.z]} scale={0.70}>
      <group ref={bodyRef}>
        <mesh geometry={FAUNA_GEOS.hareBody} material={furMat} position={[0, 0.16, 0]} />
        <mesh geometry={FAUNA_GEOS.hareBody} material={FAUNA_MATS.hareBack} position={[0, 0.22, -0.02]} scale={[0.84, 0.45, 0.82]} />
        <mesh geometry={FAUNA_GEOS.hareBody} material={FAUNA_MATS.hareBelly} position={[0, 0.09, 0.045]} scale={[0.76, 0.35, 0.76]} />
        <mesh geometry={FAUNA_GEOS.hareTail} material={FAUNA_MATS.hareTail} position={[0, 0.19, -0.21]} />
        <group ref={headRef} position={[0, 0.23, 0.17]}>
          <mesh geometry={FAUNA_GEOS.hareHead} material={furMat} position={[0, 0.015, 0.025]} />
          <mesh geometry={FAUNA_GEOS.hareHead} material={FAUNA_MATS.hareBelly} position={[0, -0.035, 0.095]} scale={[0.6, 0.40, 0.55]} />
          <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[-0.078, 0.045, 0.085]} scale={0.75} />
          <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[0.078, 0.045, 0.085]} scale={0.75} />
          <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[0, -0.005, 0.135]} scale={0.42} />
          <group ref={earsRef} position={[0, 0.09, -0.04]}>
            {([-1, 1] as const).map(side => <group key={side} position={[side * 0.05, 0, 0]} rotation={[0, 0, -side * 0.12]}>
              <mesh geometry={FAUNA_GEOS.hareEar} material={furMat} position={[0, 0.14, 0]} />
              <mesh geometry={FAUNA_GEOS.hareInnerEar} material={FAUNA_MATS.hareEars} position={[0, 0.14, 0.03]} />
            </group>)}
          </group>
        </group>
      </group>
      {([-1, 1] as const).map((side, index) => <group key={side} ref={node => { if (node) hindLegRefs.current[index] = node; }} position={[side * 0.10, 0.13, -0.12]}>
        <mesh geometry={FAUNA_GEOS.hareHaunch} material={furMat} position={[0, 0.02, 0]} />
        <mesh geometry={FAUNA_GEOS.hareLeg} material={furMat} position={[0, -0.09, 0.08]} />
      </group>)}
    </group>
  );
}

function FoxAnimalMember({ fox, grid }: { fox: FoxAnimal; grid: GridMap }) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const legRefs = useRef<THREE.Group[]>([]);
  const lifePhase = useRef(fox.x * 0.37 + fox.z * 0.19);
  const furMat = fox.coat === 0 ? FAUNA_MATS.foxFur : FAUNA_MATS.foxFurDark;

  useFrame((_, delta) => {
    if (wildlifePaused()) return;
    if (!rootRef.current) return;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || DEFAULT_CAMERA_ZOOM;
    if (camTarget) {
      const distSq = (fox.x - camTarget[0]) ** 2 + (fox.z - camTarget[1]) ** 2;
      const maxDist = Math.max(FAUNA_LOD.minDistance, Math.min(FAUNA_LOD.maxDistance, (FAUNA_LOD.zoomScale / zoom) + FAUNA_LOD.margin));
      const isVis = distSq < maxDist * maxDist;
      rootRef.current.visible = isVis;
      if (!isVis) return;
    }
    lifePhase.current += delta;

    fox.stateTimer -= delta;
    if (fox.stateTimer <= 0) {
      if (Math.random() < 0.65) {
        fox.state = 'stalk';
        fox.stateTimer = 3.5 + Math.random() * 5.0;
        const dist = 3.5 + Math.random() * 6.0;
        const ang = Math.random() * Math.PI * 2;
        fox.targetX = Math.max(5, Math.min(grid.width - 5, fox.x + Math.cos(ang) * dist));
        fox.targetZ = Math.max(5, Math.min(grid.height - 5, fox.z + Math.sin(ang) * dist));
      } else {
        fox.state = 'idle';
        fox.stateTimer = 2.5 + Math.random() * 4.0;
      }
    }

    if (fox.state === 'stalk') {
      const dx = fox.targetX - fox.x;
      const dz = fox.targetZ - fox.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.2) {
        fox.angle = Math.atan2(dx, dz);
        const speed = 1.35;
        const step = Math.min(dist, speed * delta);
        const nextX = fox.x + (dx / dist) * step;
        const nextZ = fox.z + (dz / dist) * step;
        if (!canRoam(grid, nextX, nextZ)) {
          fox.state = 'idle';
          fox.stateTimer = 1 + Math.random() * 2;
        } else {
          fox.x = nextX;
          fox.z = nextZ;
        }
        fox.trotPhase += delta * 7.0;

      } else {
        fox.state = 'idle';
        fox.stateTimer = 3.0 + Math.random() * 3.0;
      }
    }
    const moving = fox.state === 'stalk';
    animateLegs(legRefs.current, fox.trotPhase, moving, delta, 0.34);
    if (bodyRef.current) bodyRef.current.position.y = moving ? Math.sin(fox.trotPhase * 2) * 0.014 : Math.sin(lifePhase.current * 1.7) * 0.004;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(lifePhase.current * 0.8) * (moving ? 0.07 : 0.13);
      headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, moving ? 0.13 : 0, 4, delta);
    }
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(lifePhase.current * 2) * 0.32;

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(fox.x)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(fox.z)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    rootRef.current.position.set(fox.x, groundH, fox.z);
    rootRef.current.rotation.y = turnToward(rootRef.current.rotation.y, fox.angle, delta);
  });

  return (
    <group ref={rootRef} position={[fox.x, 0, fox.z]} scale={0.85}>
      <group ref={bodyRef}>
        <mesh geometry={FAUNA_GEOS.foxTorso} material={furMat} position={[0, 0.28, 0]} />
        <mesh geometry={FAUNA_GEOS.foxTorso} material={FAUNA_MATS.foxBack} position={[0, 0.38, -0.045]} scale={[0.83, 0.31, 0.86]} />
        <mesh geometry={FAUNA_GEOS.foxTorso} material={FAUNA_MATS.foxWhite} position={[0, 0.19, 0.07]} scale={[0.77, 0.36, 0.8]} />
        <mesh geometry={FAUNA_GEOS.foxHead} material={FAUNA_MATS.foxWhite} position={[0, 0.28, 0.25]} scale={[0.88, 0.92, 0.9]} />
      <group ref={headRef} position={[0, 0.34, 0.30]}>
        <mesh geometry={FAUNA_GEOS.foxHead} material={furMat} position={[0, 0.04, 0.02]} />
        <mesh geometry={FAUNA_GEOS.foxHead} material={FAUNA_MATS.foxWhite} position={[0, -0.025, 0.09]} scale={[0.88, 0.48, 0.8]} />
        <mesh geometry={FAUNA_GEOS.foxSnout} material={furMat} position={[0, 0.005, 0.22]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[0, 0.005, 0.34]} scale={0.62} />
        <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[-0.105, 0.075, 0.105]} scale={0.75} />
        <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[0.105, 0.075, 0.105]} scale={0.75} />
        {([-1, 1] as const).map(side => <group key={side} position={[side * 0.09, 0.19, -0.015]} rotation={[0, 0, -side * 0.18]}>
          <mesh geometry={FAUNA_GEOS.foxEar} material={FAUNA_MATS.foxLegs} position={[0, 0.035, 0]} />
          <mesh geometry={FAUNA_GEOS.foxEar} material={furMat} position={[0, 0.026, 0.025]} scale={[0.65, 0.72, 0.64]} />
        </group>)}
      </group>

      <group ref={tailRef} position={[0, 0.30, -0.30]}>
        <mesh geometry={FAUNA_GEOS.foxTail} material={furMat} position={[0, -0.04, -0.24]} rotation={[-0.30, 0, 0]} />
        <mesh geometry={FAUNA_GEOS.foxTailTip} material={FAUNA_MATS.foxWhite} position={[0, -0.11, -0.48]} rotation={[-0.30, 0, 0]} />
      </group>
      </group>
      {([-1, 1] as const).flatMap((side, sideIndex) => ([-1, 1] as const).map((end, endIndex) => (
        <group key={`${side}-${end}`} ref={node => { if (node) legRefs.current[sideIndex * 2 + endIndex] = node; }} position={[side * 0.10, 0.26, end * 0.21]}>
          <mesh geometry={FAUNA_GEOS.foxLeg} material={end === 1 ? furMat : FAUNA_MATS.foxLegs} position={[0, -0.065, 0]} scale={[1, 0.52, 1]} />
          <group name="lower-leg" position={[0, -0.13, 0]}>
            <mesh geometry={FAUNA_GEOS.foxLeg} material={FAUNA_MATS.foxLegs} position={[0, -0.06, 0]} scale={[0.9, 0.48, 0.9]} />
            <mesh geometry={FAUNA_GEOS.hareTail} material={FAUNA_MATS.foxLegs} position={[0, -0.13, 0.035]} scale={[0.8, 0.38, 1.1]} />
          </group>
        </group>
      )))}
    </group>
  );
}

function BoarAnimalMember({ boar, grid }: { boar: BoarAnimal; grid: GridMap }) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const legRefs = useRef<THREE.Group[]>([]);
  const lifePhase = useRef(boar.x * 0.37 + boar.z * 0.19);
  const bodyMat = boar.coat === 0 ? FAUNA_MATS.boarBody : FAUNA_MATS.boarBodyLight;

  useFrame((_, delta) => {
    if (wildlifePaused()) return;
    if (!rootRef.current) return;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || DEFAULT_CAMERA_ZOOM;
    if (camTarget) {
      const distSq = (boar.x - camTarget[0]) ** 2 + (boar.z - camTarget[1]) ** 2;
      const maxDist = Math.max(FAUNA_LOD.minDistance, Math.min(FAUNA_LOD.maxDistance, (FAUNA_LOD.zoomScale / zoom) + FAUNA_LOD.margin));
      const isVis = distSq < maxDist * maxDist;
      rootRef.current.visible = isVis;
      if (!isVis) return;
    }
    lifePhase.current += delta;

    boar.stateTimer -= delta;
    if (boar.stateTimer <= 0) {
      const r = Math.random();
      if (r < 0.5) {
        boar.state = 'trot';
        boar.stateTimer = 3.0 + Math.random() * 5.0;
        const dist = 2.5 + Math.random() * 4.5;
        const ang = Math.random() * Math.PI * 2;
        boar.targetX = Math.max(5, Math.min(grid.width - 5, boar.x + Math.cos(ang) * dist));
        boar.targetZ = Math.max(5, Math.min(grid.height - 5, boar.z + Math.sin(ang) * dist));
      } else if (r < 0.8) {
        boar.state = 'snuffle';
        boar.stateTimer = 3.5 + Math.random() * 4.5;
      } else {
        boar.state = 'idle';
        boar.stateTimer = 2.0 + Math.random() * 3.0;
      }
    }

    if (boar.state === 'trot') {
      const dx = boar.targetX - boar.x;
      const dz = boar.targetZ - boar.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.2) {
        boar.angle = Math.atan2(dx, dz);
        const speed = 0.95;
        const step = Math.min(dist, speed * delta);
        const nextX = boar.x + (dx / dist) * step;
        const nextZ = boar.z + (dz / dist) * step;
        if (!canRoam(grid, nextX, nextZ)) {
          boar.state = 'idle';
          boar.stateTimer = 1 + Math.random() * 2;
        } else {
          boar.x = nextX;
          boar.z = nextZ;
        }
        boar.trotPhase += delta * 6.0;
      } else {
        boar.state = 'snuffle';
        boar.stateTimer = 3.0 + Math.random() * 4.0;
      }
    }

    if (headRef.current) {
      if (boar.state === 'snuffle') {
        headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, 0.32 + Math.sin(lifePhase.current * 2.1) * 0.08, 3.0, delta);
      } else {
        headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, 0.0, 3.0, delta);
      }
    }
    animateLegs(legRefs.current, boar.trotPhase, boar.state === 'trot', delta, 0.29);
    if (bodyRef.current) bodyRef.current.position.y = boar.state === 'trot' ? Math.sin(boar.trotPhase * 2) * 0.018 : Math.sin(lifePhase.current * 1.7) * 0.005;

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(boar.x)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(boar.z)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    rootRef.current.position.set(boar.x, groundH, boar.z);
    rootRef.current.rotation.y = turnToward(rootRef.current.rotation.y, boar.angle, delta);
  });

  return (
    <group ref={rootRef} position={[boar.x, 0, boar.z]} scale={0.80}>
      <group ref={bodyRef}>
        <mesh geometry={FAUNA_GEOS.boarTorso} material={bodyMat} position={[0, 0.39, -0.025]} />
        <mesh geometry={FAUNA_GEOS.boarShoulder} material={bodyMat} position={[0, 0.43, 0.20]} />
        <mesh geometry={FAUNA_GEOS.boarTorso} material={FAUNA_MATS.boarMane} position={[0, 0.57, -0.055]} scale={[0.92, 0.39, 0.9]} />
        {[-0.33, -0.20, -0.07, 0.06, 0.19, 0.31].map((z, index) =>
          <mesh key={z} geometry={FAUNA_GEOS.boarBristle} material={FAUNA_MATS.boarMane} position={[0, 0.70 + Math.sin(index * 0.7) * 0.025, z]} rotation={[0.18, 0, 0]} />)}
        <mesh geometry={FAUNA_GEOS.deerTail} material={FAUNA_MATS.boarMane} position={[0, 0.34, -0.45]} rotation={[-0.7, 0, 0]} scale={0.7} />
      <group ref={headRef} position={[0, 0.40, 0.33]}>
        <mesh geometry={FAUNA_GEOS.boarHead} material={bodyMat} position={[0, 0.01, 0.11]} />
        <mesh geometry={FAUNA_GEOS.boarHead} material={FAUNA_MATS.boarSnout} position={[0, -0.09, 0.25]} scale={[0.78, 0.68, 0.72]} />
        <mesh geometry={FAUNA_GEOS.boarSnout} material={FAUNA_MATS.boarSnout} position={[0, -0.10, 0.36]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[-0.15, 0.08, 0.19]} />
        <mesh geometry={FAUNA_GEOS.eye} material={FAUNA_MATS.eye} position={[0.15, 0.08, 0.19]} />
        <mesh geometry={FAUNA_GEOS.foxEar} material={bodyMat} position={[-0.16, 0.17, -0.03]} rotation={[0, 0, 0.78]} scale={1.15} />
        <mesh geometry={FAUNA_GEOS.foxEar} material={bodyMat} position={[0.16, 0.17, -0.03]} rotation={[0, 0, -0.78]} scale={1.15} />
        <mesh geometry={FAUNA_GEOS.boarTusk} material={FAUNA_MATS.boarTusk} position={[-0.13, -0.10, 0.31]} rotation={[0.32, 0, -0.36]} />
        <mesh geometry={FAUNA_GEOS.boarTusk} material={FAUNA_MATS.boarTusk} position={[0.13, -0.10, 0.31]} rotation={[0.32, 0, 0.36]} />
      </group>
      </group>
      {([-1, 1] as const).flatMap((side, sideIndex) => ([-1, 1] as const).map((end, endIndex) => (
        <group key={`${side}-${end}`} ref={node => { if (node) legRefs.current[sideIndex * 2 + endIndex] = node; }} position={[side * 0.18, 0.27, end * 0.25]}>
          <mesh geometry={FAUNA_GEOS.boarLeg} material={bodyMat} position={[0, -0.065, 0]} scale={[1, 0.54, 1]} />
          <group name="lower-leg" position={[0, -0.13, 0]}>
            <mesh geometry={FAUNA_GEOS.boarLeg} material={bodyMat} position={[0, -0.055, 0]} scale={[0.87, 0.46, 0.87]} />
            <mesh geometry={FAUNA_GEOS.deerHoof} material={FAUNA_MATS.hoof} position={[0, -0.125, 0.025]} scale={[1.3, 0.9, 1.05]} />
          </group>
        </group>
      )))}
    </group>
  );
}

const BirdFlockGroupMemo = memo(BirdFlockGroup);
const DeerHerdMemberMemo = memo(DeerHerdMember);
const HareAnimalMemberMemo = memo(HareAnimalMember);
const FoxAnimalMemberMemo = memo(FoxAnimalMember);
const BoarAnimalMemberMemo = memo(BoarAnimalMember);

export function AmbientFaunaRenderer({ grid }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  useHiddenGroupCulling(rootRef);
  const isStrategicView = useGameStore((s) => s.isStrategicView);

  const birdFlocks = useMemo<BirdFlock[]>(() => {
    const list: BirdFlock[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const cx = (grid.width * 0.2) + Math.random() * (grid.width * 0.6);
      const cz = (grid.height * 0.2) + Math.random() * (grid.height * 0.6);
      const birds: BirdIndividual[] = [];
      const numBirds = 4 + Math.floor(Math.random() * 3);
      for (let b = 0; b < numBirds; b++) {
        birds.push({
          relX: (Math.random() - 0.5) * 1.8,
          relZ: (Math.random() - 0.5) * 2.2,
          relY: (Math.random() - 0.5) * 0.6,
          wingSpeed: 9.0 + Math.random() * 4.0,
          wingPhase: Math.random() * Math.PI * 2,
          glideTimer: 1.0 + Math.random() * 3.0,
        });
      }

      list.push({
        id: `flock-${i}`,
        centerX: cx,
        centerZ: cz,
        radiusX: 18 + Math.random() * 24,
        radiusZ: 14 + Math.random() * 20,
        angle: (i * (Math.PI * 2)) / count,
        speed: 0.18 + Math.random() * 0.12,
        altitude: 5.5 + Math.random() * 2.5,
        isLanded: false,
        landTimer: 20 + Math.random() * 30,
        birds,
      });
    }
    return list;
  }, [grid.width, grid.height]);

  const deerHerds = useMemo<DeerAnimal[]>(() => {
    const list: DeerAnimal[] = [];
    const herdCenters = [0.18, 0.5, 0.82].flatMap(z => [0.12, 0.37, 0.63, 0.88].map(x => [x, z]));

    herdCenters.forEach((center, hIdx) => {
      const [stagX, stagZ] = wildlifeSpawn(grid, center[0] * grid.width, center[1] * grid.height, 19);
      list.push({
        id: `deer-${hIdx}-stag`,
        isStag: true,
        coat: 0,
        x: stagX,
        z: stagZ,
        targetX: stagX,
        targetZ: stagZ,
        angle: Math.random() * Math.PI * 2,
        state: 'graze',
        stateTimer: 4.0 + Math.random() * 4.0,
        speed: 0.85,
      });

      const numDoes = 2 + Math.floor(Math.random() * 3);
      for (let d = 0; d < numDoes; d++) {
        const [dx, dz] = wildlifeSpawn(grid, stagX, stagZ, 5);
        list.push({
          id: `deer-${hIdx}-doe-${d}`,
          isStag: false,
          coat: d % 3,
          x: dx,
          z: dz,
          targetX: dx,
          targetZ: dz,
          angle: Math.random() * Math.PI * 2,
          state: 'graze',
          stateTimer: 3.0 + Math.random() * 5.0,
          speed: 0.90,
        });
      }
    });

    return list;
  }, [grid]);

  const hares = useMemo<HareAnimal[]>(() => {
    const list: HareAnimal[] = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      const [hx, hz] = wildlifeSpawn(grid);
      list.push({
        id: `hare-${i}`,
        coat: i % 3,
        x: hx,
        z: hz,
        targetX: hx,
        targetZ: hz,
        angle: Math.random() * Math.PI * 2,
        state: 'idle',
        stateTimer: 2.0 + Math.random() * 4.0,
        hopPhase: Math.random() * Math.PI * 2,
      });
    }
    return list;
  }, [grid]);

  const foxes = useMemo<FoxAnimal[]>(() => {
    const list: FoxAnimal[] = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const [fx, fz] = wildlifeSpawn(grid);
      list.push({
        id: `fox-${i}`,
        coat: i % 2,
        x: fx,
        z: fz,
        targetX: fx,
        targetZ: fz,
        angle: Math.random() * Math.PI * 2,
        state: 'idle',
        stateTimer: 3.0 + Math.random() * 3.0,
        trotPhase: Math.random() * Math.PI * 2,
      });
    }
    return list;
  }, [grid]);

  const boars = useMemo<BoarAnimal[]>(() => {
    const list: BoarAnimal[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const [bx, bz] = wildlifeSpawn(grid);
      list.push({
        id: `boar-${i}`,
        coat: i % 2,
        x: bx,
        z: bz,
        targetX: bx,
        targetZ: bz,
        angle: Math.random() * Math.PI * 2,
        state: 'snuffle',
        stateTimer: 3.0 + Math.random() * 4.0,
        trotPhase: Math.random() * Math.PI * 2,
      });
    }
    return list;
  }, [grid]);

  return (
    <group ref={rootRef} visible={!isStrategicView} dispose={null}>
      {birdFlocks.map((flock) => (
        <BirdFlockGroupMemo key={flock.id} flock={flock} grid={grid} />
      ))}
      {deerHerds.map((deer) => (
        <DeerHerdMemberMemo key={deer.id} deer={deer} grid={grid} />
      ))}
      {hares.map((hare) => (
        <HareAnimalMemberMemo key={hare.id} hare={hare} grid={grid} />
      ))}
      {foxes.map((fox) => (
        <FoxAnimalMemberMemo key={fox.id} fox={fox} grid={grid} />
      ))}
      {boars.map((boar) => (
        <BoarAnimalMemberMemo key={boar.id} boar={boar} grid={grid} />
      ))}
    </group>
  );
}
