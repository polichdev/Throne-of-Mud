import { WOOD_CHIPS } from '../../constants/particles';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  scale: number;
  birthTime: number;
  lifeSpan: number;
  color: THREE.Color;
}

const MAX_PARTICLES = WOOD_CHIPS.capacity;
const WOOD_COLORS = WOOD_CHIPS.colors.map(color => new THREE.Color(color));
const SHARED_WOOD_CHIP_GEO = new THREE.BoxGeometry(...WOOD_CHIPS.size);
const SHARED_WOOD_CHIP_MAT = new THREE.MeshLambertMaterial();

export function WoodChipsRenderer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);
  const processedHitsRef = useRef<Set<string>>(new Set());
  const dummyRef = useRef<THREE.Object3D>(new THREE.Object3D());

  const activeTreeHits = useGameStore((s) => s.activeTreeHits);
  const isStrategicView = useGameStore((s) => s.isStrategicView);

  useEffect(() => {
    const now = performance.now() / 1000;

    const activeIds = new Set(activeTreeHits.map(hit => hit.id));
    for (const id of processedHitsRef.current) {
      if (!activeIds.has(id)) processedHitsRef.current.delete(id);
    }
    for (const hit of activeTreeHits) {
      if (processedHitsRef.current.has(hit.id)) continue;
      processedHitsRef.current.add(hit.id);



      const count = Math.floor(WOOD_CHIPS.count + Math.random() * WOOD_CHIPS.countVariation * hit.intensity);
      for (let i = 0; i < count; i++) {
        if (particlesRef.current.length >= MAX_PARTICLES) {
          particlesRef.current.shift();
        }

        const angle = Math.random() * Math.PI * 2;
        const spreadSpeed = WOOD_CHIPS.spreadSpeed + Math.random() * WOOD_CHIPS.spreadSpeedVariation * hit.intensity;
        const upSpeed = WOOD_CHIPS.upSpeed + Math.random() * WOOD_CHIPS.upSpeedVariation * hit.intensity;

        const p: Particle = {
          x: hit.x + (Math.random() - 0.5) * WOOD_CHIPS.spawnSpread,
          y: WOOD_CHIPS.spawnHeight + Math.random() * WOOD_CHIPS.heightVariation,
          z: hit.z + (Math.random() - 0.5) * WOOD_CHIPS.spawnSpread,
          vx: Math.cos(angle) * spreadSpeed,
          vy: upSpeed,
          vz: Math.sin(angle) * spreadSpeed,
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
          rotZ: Math.random() * Math.PI * 2,
          vRotX: (Math.random() - 0.5) * WOOD_CHIPS.angularSpeed,
          vRotY: (Math.random() - 0.5) * WOOD_CHIPS.angularSpeed,
          vRotZ: (Math.random() - 0.5) * WOOD_CHIPS.angularSpeed,
          scale: WOOD_CHIPS.minScale + Math.random() * WOOD_CHIPS.scaleVariation,
          birthTime: now,
          lifeSpan: WOOD_CHIPS.minLifetimeSeconds + Math.random() * WOOD_CHIPS.lifetimeVariation,
          color: WOOD_COLORS[Math.floor(Math.random() * WOOD_COLORS.length)],
        };

        particlesRef.current.push(p);
      }
    }
  }, [activeTreeHits]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const now = performance.now() / 1000;
    const dt = Math.min(delta, WOOD_CHIPS.maxDeltaSeconds);
    const particles = particlesRef.current;
    const dummy = dummyRef.current;

    let aliveCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const age = now - p.birthTime;

      if (age < p.lifeSpan) {
        p.vy -= WOOD_CHIPS.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        if (p.y < WOOD_CHIPS.groundHeight) {
          p.y = WOOD_CHIPS.groundHeight;
          p.vy = -p.vy * WOOD_CHIPS.restitution;
          p.vx *= WOOD_CHIPS.groundFriction;
          p.vz *= WOOD_CHIPS.groundFriction;
        }

        p.rotX += p.vRotX * dt;
        p.rotY += p.vRotY * dt;
        p.rotZ += p.vRotZ * dt;

        particles[aliveCount] = p;
        aliveCount++;
      }
    }

    particles.length = aliveCount;

    if (aliveCount === 0) {
      if (meshRef.current.count !== 0) {
        meshRef.current.count = 0;
        meshRef.current.visible = false;
      }
      return;
    }

    meshRef.current.visible = true;
    meshRef.current.count = Math.min(aliveCount, MAX_PARTICLES);

    for (let i = 0; i < meshRef.current.count; i++) {
      const p = particles[i];
      const age = now - p.birthTime;
      const lifeProgress = age / p.lifeSpan;
      const currentScale = p.scale * (1.0 - Math.pow(lifeProgress, WOOD_CHIPS.shrinkExponent));

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
      dummy.scale.set(currentScale, currentScale, currentScale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, p.color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group visible={!isStrategicView}>
      <instancedMesh
        ref={meshRef}
        args={[SHARED_WOOD_CHIP_GEO, SHARED_WOOD_CHIP_MAT, MAX_PARTICLES]}
        frustumCulled={false}
      />
    </group>
  );
}
