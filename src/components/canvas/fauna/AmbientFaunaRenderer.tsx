import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GridMap } from '../../../engine/grid/GridMap';
import { useGameStore } from '../../../store/useGameStore';

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
  birdFeather: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 }),
  birdWing: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.75, side: THREE.DoubleSide }),
  birdBeak: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.5 }),
  
  stagBody: new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.85 }),
  stagUnderbelly: new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.9 }),
  stagAntlers: new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.6 }),
  deerLeg: new THREE.MeshStandardMaterial({ color: '#713f12', roughness: 0.85 }),
  doeBody: new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.85 }),

  hareFur: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.9 }),
  hareEars: new THREE.MeshStandardMaterial({ color: '#fbcfe8', roughness: 0.8 }),
  hareTail: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 }),

  foxFur: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.8 }),
  foxWhite: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 }),
  foxLegs: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7 }),

  boarBody: new THREE.MeshStandardMaterial({ color: '#3f2e20', roughness: 0.9 }),
  boarSnout: new THREE.MeshStandardMaterial({ color: '#271c13', roughness: 0.8 }),
  boarTusk: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 }),
};

const FAUNA_GEOS = {
  birdBody: new THREE.ConeGeometry(0.08, 0.28, 5),
  birdBeak: new THREE.ConeGeometry(0.03, 0.08, 4),
  birdWing: new THREE.PlaneGeometry(0.24, 0.12),
  birdTail: new THREE.BufferGeometry(),
  
  deerTorso: new THREE.BoxGeometry(0.36, 0.42, 0.72),
  deerNeck: new THREE.BoxGeometry(0.18, 0.36, 0.20),
  deerHead: new THREE.BoxGeometry(0.16, 0.18, 0.26),
  deerMuzzle: new THREE.BoxGeometry(0.12, 0.12, 0.16),
  deerLeg: new THREE.BoxGeometry(0.08, 0.46, 0.08),
  antlerMain: new THREE.BoxGeometry(0.03, 0.32, 0.03),
  antlerTine: new THREE.BoxGeometry(0.025, 0.14, 0.025),

  hareBody: new THREE.BoxGeometry(0.18, 0.16, 0.26),
  hareHead: new THREE.BoxGeometry(0.12, 0.12, 0.14),
  hareEar: new THREE.BoxGeometry(0.03, 0.16, 0.05),
  hareTail: new THREE.BoxGeometry(0.06, 0.06, 0.06),
  hareLeg: new THREE.BoxGeometry(0.05, 0.10, 0.06),

  foxTorso: new THREE.BoxGeometry(0.22, 0.24, 0.54),
  foxHead: new THREE.BoxGeometry(0.14, 0.14, 0.20),
  foxSnout: new THREE.BoxGeometry(0.08, 0.08, 0.12),
  foxEar: new THREE.ConeGeometry(0.04, 0.09, 4),
  foxTail: new THREE.BoxGeometry(0.12, 0.12, 0.36),
  foxLeg: new THREE.BoxGeometry(0.06, 0.24, 0.06),

  boarTorso: new THREE.BoxGeometry(0.38, 0.38, 0.65),
  boarHead: new THREE.BoxGeometry(0.24, 0.24, 0.30),
  boarSnout: new THREE.BoxGeometry(0.16, 0.14, 0.16),
  boarLeg: new THREE.BoxGeometry(0.10, 0.22, 0.10),
  boarTusk: new THREE.ConeGeometry(0.02, 0.08, 3),
};

function BirdFlockGroup({ flock, grid }: { flock: BirdFlock; grid: GridMap }) {
  const groupRef = useRef<THREE.Group>(null);
  const birdRefs = useRef<THREE.Group[]>([]);
  const leftWingRefs = useRef<THREE.Mesh[]>([]);
  const rightWingRefs = useRef<THREE.Mesh[]>([]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    flock.angle += flock.speed * delta;
    if (flock.angle > Math.PI * 2) flock.angle -= Math.PI * 2;

    const fx = flock.centerX + Math.cos(flock.angle) * flock.radiusX;
    const fz = flock.centerZ + Math.sin(flock.angle) * flock.radiusZ;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || 38;
    if (camTarget) {
      const distSq = (fx - camTarget[0]) ** 2 + (fz - camTarget[1]) ** 2;
      const maxDist = Math.max(30, (900 / zoom) + 12);
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
      const flap = isGliding ? 0.05 : Math.sin(b.wingPhase) * 0.65;

      lWing.rotation.z = flap;
      rWing.rotation.z = -flap;
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
        >
          <mesh
            geometry={FAUNA_GEOS.birdBody}
            material={FAUNA_MATS.birdFeather}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            geometry={FAUNA_GEOS.birdBeak}
            position={[0, 0, 0.14]}
            rotation={[Math.PI / 2, 0, 0]}
            material={FAUNA_MATS.birdBeak}
          />
          <mesh
            ref={(el) => {
              if (el) leftWingRefs.current[idx] = el;
            }}
            geometry={FAUNA_GEOS.birdWing}
            material={FAUNA_MATS.birdWing}
            position={[-0.12, 0.02, 0]}
          />
          <mesh
            ref={(el) => {
              if (el) rightWingRefs.current[idx] = el;
            }}
            geometry={FAUNA_GEOS.birdWing}
            material={FAUNA_MATS.birdWing}
            position={[0.12, 0.02, 0]}
          />
        </group>
      ))}
    </group>
  );
}

function DeerHerdMember({ deer, grid }: { deer: DeerAnimal; grid: GridMap }) {
  const rootRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const legFLRef = useRef<THREE.Group>(null);
  const legFRRef = useRef<THREE.Group>(null);
  const legBLRef = useRef<THREE.Group>(null);
  const legBRRef = useRef<THREE.Group>(null);
  const walkPhase = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || 38;
    if (camTarget) {
      const distSq = (deer.x - camTarget[0]) ** 2 + (deer.z - camTarget[1]) ** 2;
      const maxDist = Math.max(26, (900 / zoom) + 8);
      const isVis = distSq < maxDist * maxDist;
      rootRef.current.visible = isVis;
      if (!isVis) return;
    }

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
        deer.x += (dx / dist) * step;
        deer.z += (dz / dist) * step;
        walkPhase.current += delta * 6.5;

        const swing = Math.sin(walkPhase.current) * 0.45;
        if (legFLRef.current) legFLRef.current.rotation.x = swing;
        if (legFRRef.current) legFRRef.current.rotation.x = -swing;
        if (legBLRef.current) legBLRef.current.rotation.x = -swing;
        if (legBRRef.current) legBRRef.current.rotation.x = swing;
      } else {
        deer.state = 'graze';
        deer.stateTimer = 4.0 + Math.random() * 4.0;
      }
    } else {
      if (legFLRef.current) legFLRef.current.rotation.x = 0;
      if (legFRRef.current) legFRRef.current.rotation.x = 0;
      if (legBLRef.current) legBLRef.current.rotation.x = 0;
      if (legBRRef.current) legBRRef.current.rotation.x = 0;
    }

    if (neckRef.current) {
      if (deer.state === 'graze') {
        neckRef.current.rotation.x = THREE.MathUtils.lerp(neckRef.current.rotation.x, 0.75, delta * 3.0);
      } else {
        neckRef.current.rotation.x = THREE.MathUtils.lerp(neckRef.current.rotation.x, 0.0, delta * 3.0);
      }
    }

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(deer.x)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(deer.z)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    rootRef.current.position.set(deer.x, groundH, deer.z);
    rootRef.current.rotation.y = deer.angle;
  });

  const bodyMat = deer.isStag ? FAUNA_MATS.stagBody : FAUNA_MATS.doeBody;

  return (
    <group ref={rootRef} position={[deer.x, 0, deer.z]}>
      <mesh
        geometry={FAUNA_GEOS.deerTorso}
        material={bodyMat}
        position={[0, 0.48, 0]}
      />
      <mesh
        geometry={FAUNA_GEOS.deerTorso}
        material={FAUNA_MATS.stagUnderbelly}
        position={[0, 0.38, 0]}
        scale={[0.85, 0.3, 0.75]}
      />

      <group ref={neckRef} position={[0, 0.62, 0.30]}>
        <mesh
          geometry={FAUNA_GEOS.deerNeck}
          material={bodyMat}
          position={[0, 0.16, 0.06]}
          rotation={[0.35, 0, 0]}
        />
        <mesh
          geometry={FAUNA_GEOS.deerHead}
          material={bodyMat}
          position={[0, 0.34, 0.16]}
        />
        <mesh
          geometry={FAUNA_GEOS.deerMuzzle}
          material={FAUNA_MATS.stagUnderbelly}
          position={[0, 0.30, 0.28]}
        />

        {deer.isStag && (
          <group position={[0, 0.44, 0.14]}>
            <mesh
              geometry={FAUNA_GEOS.antlerMain}
              material={FAUNA_MATS.stagAntlers}
              position={[-0.09, 0.14, 0]}
              rotation={[-0.15, 0, -0.35]}
            />
            <mesh
              geometry={FAUNA_GEOS.antlerTine}
              material={FAUNA_MATS.stagAntlers}
              position={[-0.14, 0.22, 0.05]}
              rotation={[-0.4, 0, -0.6]}
            />
            <mesh
              geometry={FAUNA_GEOS.antlerMain}
              material={FAUNA_MATS.stagAntlers}
              position={[0.09, 0.14, 0]}
              rotation={[-0.15, 0, 0.35]}
            />
            <mesh
              geometry={FAUNA_GEOS.antlerTine}
              material={FAUNA_MATS.stagAntlers}
              position={[0.14, 0.22, 0.05]}
              rotation={[-0.4, 0, 0.6]}
            />
          </group>
        )}
      </group>

      <group ref={legFLRef} position={[-0.12, 0.24, 0.24]}>
        <mesh
          geometry={FAUNA_GEOS.deerLeg}
          material={FAUNA_MATS.deerLeg}
          position={[0, -0.12, 0]}
        />
      </group>
      <group ref={legFRRef} position={[0.12, 0.24, 0.24]}>
        <mesh
          geometry={FAUNA_GEOS.deerLeg}
          material={FAUNA_MATS.deerLeg}
          position={[0, -0.12, 0]}
        />
      </group>
      <group ref={legBLRef} position={[-0.12, 0.24, -0.24]}>
        <mesh
          geometry={FAUNA_GEOS.deerLeg}
          material={FAUNA_MATS.deerLeg}
          position={[0, -0.12, 0]}
        />
      </group>
      <group ref={legBRRef} position={[0.12, 0.24, -0.24]}>
        <mesh
          geometry={FAUNA_GEOS.deerLeg}
          material={FAUNA_MATS.deerLeg}
          position={[0, -0.12, 0]}
        />
      </group>
    </group>
  );
}

function HareAnimalMember({ hare, grid }: { hare: HareAnimal; grid: GridMap }) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || 38;
    if (camTarget) {
      const distSq = (hare.x - camTarget[0]) ** 2 + (hare.z - camTarget[1]) ** 2;
      const maxDist = Math.max(26, (900 / zoom) + 8);
      const isVis = distSq < maxDist * maxDist;
      rootRef.current.visible = isVis;
      if (!isVis) return;
    }

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
        const speed = 2.4;
        const step = Math.min(dist, speed * delta);
        hare.x += (dx / dist) * step;
        hare.z += (dz / dist) * step;
        hare.hopPhase += delta * 14.0;
        hopY = Math.abs(Math.sin(hare.hopPhase)) * 0.16;
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

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(hare.x)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(hare.z)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    rootRef.current.position.set(hare.x, groundH + hopY, hare.z);
    rootRef.current.rotation.y = hare.angle;
  });

  return (
    <group ref={rootRef} position={[hare.x, 0, hare.z]}>
      <mesh
        geometry={FAUNA_GEOS.hareBody}
        material={FAUNA_MATS.hareFur}
        position={[0, 0.12, 0]}
      />
      <mesh
        geometry={FAUNA_GEOS.hareTail}
        material={FAUNA_MATS.hareTail}
        position={[0, 0.14, -0.14]}
      />
      <group ref={headRef} position={[0, 0.18, 0.12]}>
        <mesh
          geometry={FAUNA_GEOS.hareHead}
          material={FAUNA_MATS.hareFur}
          position={[0, 0.04, 0.04]}
        />
        <mesh
          geometry={FAUNA_GEOS.hareEar}
          material={FAUNA_MATS.hareEars}
          position={[-0.04, 0.15, -0.02]}
          rotation={[0.1, 0, -0.1]}
        />
        <mesh
          geometry={FAUNA_GEOS.hareEar}
          material={FAUNA_MATS.hareEars}
          position={[0.04, 0.15, -0.02]}
          rotation={[0.1, 0, 0.1]}
        />
      </group>
    </group>
  );
}

function FoxAnimalMember({ fox, grid }: { fox: FoxAnimal; grid: GridMap }) {
  const rootRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || 38;
    if (camTarget) {
      const distSq = (fox.x - camTarget[0]) ** 2 + (fox.z - camTarget[1]) ** 2;
      const maxDist = Math.max(26, (900 / zoom) + 8);
      const isVis = distSq < maxDist * maxDist;
      rootRef.current.visible = isVis;
      if (!isVis) return;
    }

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
        fox.x += (dx / dist) * step;
        fox.z += (dz / dist) * step;
        fox.trotPhase += delta * 7.0;

        if (tailRef.current) {
          tailRef.current.rotation.y = Math.sin(fox.trotPhase) * 0.4;
        }
      } else {
        fox.state = 'idle';
        fox.stateTimer = 3.0 + Math.random() * 3.0;
      }
    }

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(fox.x)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(fox.z)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    rootRef.current.position.set(fox.x, groundH, fox.z);
    rootRef.current.rotation.y = fox.angle;
  });

  return (
    <group ref={rootRef} position={[fox.x, 0, fox.z]}>
      <mesh
        geometry={FAUNA_GEOS.foxTorso}
        material={FAUNA_MATS.foxFur}
        position={[0, 0.22, 0]}
      />
      <group position={[0, 0.28, 0.24]}>
        <mesh
          geometry={FAUNA_GEOS.foxHead}
          material={FAUNA_MATS.foxFur}
          position={[0, 0.04, 0.06]}
        />
        <mesh
          geometry={FAUNA_GEOS.foxSnout}
          material={FAUNA_MATS.foxWhite}
          position={[0, 0.02, 0.18]}
        />
        <mesh
          geometry={FAUNA_GEOS.foxEar}
          material={FAUNA_MATS.foxLegs}
          position={[-0.06, 0.14, 0.02]}
          rotation={[0, 0, -0.2]}
        />
        <mesh
          geometry={FAUNA_GEOS.foxEar}
          material={FAUNA_MATS.foxLegs}
          position={[0.06, 0.14, 0.02]}
          rotation={[0, 0, 0.2]}
        />
      </group>

      <group ref={tailRef} position={[0, 0.24, -0.26]}>
        <mesh
          geometry={FAUNA_GEOS.foxTail}
          material={FAUNA_MATS.foxFur}
          position={[0, -0.06, -0.16]}
          rotation={[-0.45, 0, 0]}
        />
        <mesh
          geometry={FAUNA_GEOS.hareTail}
          material={FAUNA_MATS.foxWhite}
          position={[0, -0.14, -0.32]}
        />
      </group>
    </group>
  );
}

function BoarAnimalMember({ boar, grid }: { boar: BoarAnimal; grid: GridMap }) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || 38;
    if (camTarget) {
      const distSq = (boar.x - camTarget[0]) ** 2 + (boar.z - camTarget[1]) ** 2;
      const maxDist = Math.max(26, (900 / zoom) + 8);
      const isVis = distSq < maxDist * maxDist;
      rootRef.current.visible = isVis;
      if (!isVis) return;
    }

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
        boar.x += (dx / dist) * step;
        boar.z += (dz / dist) * step;
        boar.trotPhase += delta * 6.0;
      } else {
        boar.state = 'snuffle';
        boar.stateTimer = 3.0 + Math.random() * 4.0;
      }
    }

    if (headRef.current) {
      if (boar.state === 'snuffle') {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.45, delta * 3.0);
      } else {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.0, delta * 3.0);
      }
    }

    const gx = Math.max(0, Math.min(grid.width - 1, Math.floor(boar.x)));
    const gz = Math.max(0, Math.min(grid.height - 1, Math.floor(boar.z)));
    const groundH = grid.getTile(gx, gz)?.height || 0.1;

    rootRef.current.position.set(boar.x, groundH, boar.z);
    rootRef.current.rotation.y = boar.angle;
  });

  return (
    <group ref={rootRef} position={[boar.x, 0, boar.z]}>
      <mesh
        geometry={FAUNA_GEOS.boarTorso}
        material={FAUNA_MATS.boarBody}
        position={[0, 0.28, 0]}
      />
      <group ref={headRef} position={[0, 0.26, 0.28]}>
        <mesh
          geometry={FAUNA_GEOS.boarHead}
          material={FAUNA_MATS.boarBody}
          position={[0, 0.02, 0.10]}
        />
        <mesh
          geometry={FAUNA_GEOS.boarSnout}
          material={FAUNA_MATS.boarSnout}
          position={[0, -0.02, 0.24]}
        />
        <mesh
          geometry={FAUNA_GEOS.boarTusk}
          material={FAUNA_MATS.boarTusk}
          position={[-0.09, 0.02, 0.22]}
          rotation={[0.4, 0, -0.4]}
        />
        <mesh
          geometry={FAUNA_GEOS.boarTusk}
          material={FAUNA_MATS.boarTusk}
          position={[0.09, 0.02, 0.22]}
          rotation={[0.4, 0, 0.4]}
        />
      </group>
    </group>
  );
}

export function AmbientFaunaRenderer({ grid }: Props) {
  const isStrategicView = useGameStore((s) => s.isStrategicView);

  const birdFlocks = useMemo<BirdFlock[]>(() => {
    const list: BirdFlock[] = [];
    const count = 4;
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
    const herdCenters = [
      [grid.width * 0.25, grid.height * 0.3],
      [grid.width * 0.75, grid.height * 0.25],
      [grid.width * 0.3, grid.height * 0.75],
      [grid.width * 0.8, grid.height * 0.7],
    ];

    herdCenters.forEach((center, hIdx) => {
      const stagX = center[0] + (Math.random() - 0.5) * 6;
      const stagZ = center[1] + (Math.random() - 0.5) * 6;
      list.push({
        id: `deer-${hIdx}-stag`,
        isStag: true,
        x: stagX,
        z: stagZ,
        targetX: stagX,
        targetZ: stagZ,
        angle: Math.random() * Math.PI * 2,
        state: 'graze',
        stateTimer: 4.0 + Math.random() * 4.0,
        speed: 0.85,
      });

      const numDoes = 2 + Math.floor(Math.random() * 2);
      for (let d = 0; d < numDoes; d++) {
        const dx = stagX + (Math.random() - 0.5) * 4;
        const dz = stagZ + (Math.random() - 0.5) * 4;
        list.push({
          id: `deer-${hIdx}-doe-${d}`,
          isStag: false,
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
  }, [grid.width, grid.height]);

  const hares = useMemo<HareAnimal[]>(() => {
    const list: HareAnimal[] = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const hx = 12 + Math.random() * (grid.width - 24);
      const hz = 12 + Math.random() * (grid.height - 24);
      list.push({
        id: `hare-${i}`,
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
  }, [grid.width, grid.height]);

  const foxes = useMemo<FoxAnimal[]>(() => {
    const list: FoxAnimal[] = [];
    const count = 3;
    for (let i = 0; i < count; i++) {
      const fx = 16 + Math.random() * (grid.width - 32);
      const fz = 16 + Math.random() * (grid.height - 32);
      list.push({
        id: `fox-${i}`,
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
  }, [grid.width, grid.height]);

  const boars = useMemo<BoarAnimal[]>(() => {
    const list: BoarAnimal[] = [];
    const count = 3;
    for (let i = 0; i < count; i++) {
      const bx = 16 + Math.random() * (grid.width - 32);
      const bz = 16 + Math.random() * (grid.height - 32);
      list.push({
        id: `boar-${i}`,
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
  }, [grid.width, grid.height]);

  if (isStrategicView) return null;

  return (
    <group>
      {birdFlocks.map((flock) => (
        <BirdFlockGroup key={flock.id} flock={flock} grid={grid} />
      ))}
      {deerHerds.map((deer) => (
        <DeerHerdMember key={deer.id} deer={deer} grid={grid} />
      ))}
      {hares.map((hare) => (
        <HareAnimalMember key={hare.id} hare={hare} grid={grid} />
      ))}
      {foxes.map((fox) => (
        <FoxAnimalMember key={fox.id} fox={fox} grid={grid} />
      ))}
      {boars.map((boar) => (
        <BoarAnimalMember key={boar.id} boar={boar} grid={grid} />
      ))}
    </group>
  );
}
