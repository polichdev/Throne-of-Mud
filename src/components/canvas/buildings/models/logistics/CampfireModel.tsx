import { DEFAULT_CAMERA_ZOOM } from '../../../../../constants/camera';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { isObjectEffectivelyVisible } from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const campfireStonesGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const g = new THREE.DodecahedronGeometry(1, 0);
    g.applyMatrix4(
      new THREE.Matrix4()
        .makeRotationFromEuler(new THREE.Euler(i * 0.4, i * 0.8, 0))
        .scale(new THREE.Vector3(0.2, 0.15, 0.2))
        .setPosition(Math.cos(angle) * 0.52, 0.08, Math.sin(angle) * 0.52)
    );
    geos.push(toStandard(g));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const campfireLogsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const logConfigs: [number, number, number, number, number, number][] = [
    [0.06, 0.08, 0.65, 0.2, 0.4, 0.1],
    [0.06, 0.08, 0.65, -0.2, -0.7, 0.1],
    [0.05, 0.07, 0.62, 0.6, 0.2, -0.4],
    [0.05, 0.07, 0.62, -0.5, 0.6, 0.3],
  ];
  for (let idx = 0; idx < logConfigs.length; idx++) {
    const [r1, r2, len, rx, ry, rz] = logConfigs[idx];
    const g = new THREE.CylinderGeometry(r1, r2, len, 5);
    const yOff = 0.08 + idx * 0.01;
    g.applyMatrix4(
      new THREE.Matrix4()
        .makeRotationFromEuler(new THREE.Euler(rx, ry, rz))
        .setPosition(0, yOff, 0)
    );
    geos.push(toStandard(g));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const campfireEmbersGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const ex of [-0.08, 0.08]) {
    for (const ez of [-0.08, 0.08]) {
      const g = new THREE.DodecahedronGeometry(1, 0);
      g.applyMatrix4(
        new THREE.Matrix4()
          .scale(new THREE.Vector3(0.05, 0.03, 0.05))
          .setPosition(ex, 0.05, ez)
      );
      geos.push(toStandard(g));
    }
  }
  return mergeGeometries(geos) || geos[0];
})();

export const campfireBenchesGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const b1 = new THREE.BoxGeometry(0.2, 0.14, 0.8); b1.translate(-0.75, 0.08, 0); geos.push(toStandard(b1));
  const b2 = new THREE.BoxGeometry(0.2, 0.14, 0.8); b2.translate(0.75, 0.08, 0); geos.push(toStandard(b2));
  const b3 = new THREE.BoxGeometry(0.8, 0.14, 0.2); b3.translate(0, 0.08, -0.75); geos.push(toStandard(b3));
  const b4 = new THREE.BoxGeometry(0.8, 0.14, 0.2); b4.translate(0, 0.08, 0.75); geos.push(toStandard(b4));
  return mergeGeometries(geos) || geos[0];
})();

export function CampfireModel() {
  const mats = SHARED_BUILDING_MATS;
  const fireFlameRef = useRef<THREE.Group>(null);
  const fireSparksRef = useRef<THREE.Group>(null);
  const fireLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!fireFlameRef.current || !isObjectEffectivelyVisible(fireFlameRef.current)) return;
    const currentZoom = (window as any).__lastCameraZoom ?? DEFAULT_CAMERA_ZOOM;
    if (currentZoom <= 18.5) return;
    const t = clock.getElapsedTime();

    if (fireFlameRef.current) {
      const flames = fireFlameRef.current.children;
      for (let i = 0; i < flames.length; i++) {
        const flame = flames[i];
        const seed = i * 2.1;
        const wobbleX = Math.sin(t * 10 + seed) * 0.05 + Math.cos(t * 17 + seed * 1.5) * 0.03;
        const wobbleZ = Math.cos(t * 12 + seed * 1.3) * 0.05 + Math.sin(t * 19 + seed) * 0.03;
        const scaleY = 0.8 + Math.sin(t * 13 + seed * 2) * 0.28 + Math.cos(t * 21 + seed) * 0.18;
        const scaleXZ = 0.75 + Math.cos(t * 11 + seed * 1.5) * 0.2;
        flame.scale.set(scaleXZ, scaleY, scaleXZ);
        flame.position.x = wobbleX;
        flame.position.z = wobbleZ;
        flame.rotation.y = t * (2.0 + (i % 2 === 0 ? 1.2 : -1.2));
      }
    }

    if (fireSparksRef.current) {
      const sparks = fireSparksRef.current.children;
      for (let i = 0; i < sparks.length; i++) {
        const spark = sparks[i];
        const offset = (t * 1.4 + i * 0.38) % 1.6;
        spark.position.y = 0.2 + offset * 0.85;
        spark.position.x = Math.sin(offset * 4.5 + i * 2.2) * (0.07 + offset * 0.14);
        spark.position.z = Math.cos(offset * 5.2 + i * 3.1) * (0.07 + offset * 0.14);
        const s = Math.max(0.01, (1 - offset / 1.6) * 0.045);
        spark.scale.set(s, s, s);
      }
    }

    if (fireLightRef.current) {
      fireLightRef.current.intensity = 2.4 + Math.sin(t * 15) * 0.5 + Math.cos(t * 23) * 0.3;
    }
  });

  return (
    <group>
      <mesh material={mats.ashBed} position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.02, 12]} />
      </mesh>
      <mesh geometry={campfireStonesGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={campfireLogsGeo} material={mats.charredWood} />
      <mesh geometry={campfireEmbersGeo} material={mats.emberGlow} />
      <mesh geometry={campfireBenchesGeo} material={mats.timberLight} receiveShadow />

      <group ref={fireFlameRef} position={[0, 0.10, 0]}>
        <group position={[0, 0, 0]}>
          <mesh material={mats.fireOrange} position={[0, 0.22, 0]}>
            <coneGeometry args={[0.16, 0.54, 6]} />
          </mesh>
          <mesh material={mats.fireYellow} position={[0, 0.18, 0]}>
            <coneGeometry args={[0.11, 0.42, 5]} />
          </mesh>
          <mesh material={mats.fireCore} position={[0, 0.12, 0]}>
            <coneGeometry args={[0.06, 0.26, 4]} />
          </mesh>
        </group>

        <group position={[-0.08, 0, 0.06]} rotation={[0.15, 0.4, -0.15]}>
          <mesh material={mats.fireOrange} position={[0, 0.16, 0]}>
            <coneGeometry args={[0.10, 0.40, 5]} />
          </mesh>
          <mesh material={mats.fireYellow} position={[0, 0.13, 0]}>
            <coneGeometry args={[0.07, 0.30, 4]} />
          </mesh>
        </group>

        <group position={[0.08, 0, 0.05]} rotation={[-0.2, -0.5, 0.15]}>
          <mesh material={mats.fireOrange} position={[0, 0.15, 0]}>
            <coneGeometry args={[0.09, 0.38, 5]} />
          </mesh>
          <mesh material={mats.fireYellow} position={[0, 0.12, 0]}>
            <coneGeometry args={[0.06, 0.28, 4]} />
          </mesh>
        </group>
      </group>

      <group ref={fireSparksRef}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={`spark-${i}`} material={mats.fireYellow} position={[0, 0.2, 0]}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
      </group>

      <pointLight
        ref={fireLightRef}
        position={[0, 0.35, 0]}
        color="#ff7711"
        intensity={2.4}
        distance={7.0}
        decay={2}
      />
    </group>
  );
}
