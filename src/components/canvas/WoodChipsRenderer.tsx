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

const MAX_PARTICLES = 120;
const WOOD_COLORS = [
  new THREE.Color('#b45309'),
  new THREE.Color('#78350f'),
  new THREE.Color('#d97706'),
  new THREE.Color('#f59e0b'),
  new THREE.Color('#fef08a'),
];

const SHARED_WOOD_CHIP_GEO = new THREE.BoxGeometry(0.045, 0.035, 0.075);
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

    for (const hit of activeTreeHits) {
      if (processedHitsRef.current.has(hit.id)) continue;
      processedHitsRef.current.add(hit.id);

      if (processedHitsRef.current.size > 50) {
        processedHitsRef.current.clear();
      }

      const count = Math.floor(10 + Math.random() * 6 * hit.intensity);
      for (let i = 0; i < count; i++) {
        if (particlesRef.current.length >= MAX_PARTICLES) {
          particlesRef.current.shift();
        }

        const angle = Math.random() * Math.PI * 2;
        const spreadSpeed = 1.0 + Math.random() * 1.8 * hit.intensity;
        const upSpeed = 1.8 + Math.random() * 1.6 * hit.intensity;

        const p: Particle = {
          x: hit.x + (Math.random() - 0.5) * 0.25,
          y: 0.4 + Math.random() * 0.35,
          z: hit.z + (Math.random() - 0.5) * 0.25,
          vx: Math.cos(angle) * spreadSpeed,
          vy: upSpeed,
          vz: Math.sin(angle) * spreadSpeed,
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
          rotZ: Math.random() * Math.PI * 2,
          vRotX: (Math.random() - 0.5) * 20,
          vRotY: (Math.random() - 0.5) * 20,
          vRotZ: (Math.random() - 0.5) * 20,
          scale: 0.7 + Math.random() * 0.6,
          birthTime: now,
          lifeSpan: 0.75 + Math.random() * 0.45,
          color: WOOD_COLORS[Math.floor(Math.random() * WOOD_COLORS.length)],
        };

        particlesRef.current.push(p);
      }
    }
  }, [activeTreeHits]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const now = performance.now() / 1000;
    const dt = Math.min(delta, 0.05);
    const particles = particlesRef.current;
    const dummy = dummyRef.current;

    let aliveCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const age = now - p.birthTime;

      if (age < p.lifeSpan) {
        p.vy -= 9.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        if (p.y < 0.04) {
          p.y = 0.04;
          p.vy = -p.vy * 0.32;
          p.vx *= 0.65;
          p.vz *= 0.65;
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
      const currentScale = p.scale * (1.0 - Math.pow(lifeProgress, 2.5));

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

