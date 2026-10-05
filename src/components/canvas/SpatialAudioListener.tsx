import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildingEntities, characterEntities, type GameEntity } from '../../engine/ecs/world';
import { audioManager } from '../../engine/audio/AudioManager';

const _nearbyChars: GameEntity[] = [];

export function SpatialAudioListener() {
  const { camera } = useThree();
  const lastUpdateRef = useRef(0);
  const lastChatterRef = useRef(0);
  const listenerRef = useRef<THREE.AudioListener | null>(null);

  useEffect(() => {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    listenerRef.current = listener;
    audioManager.setCameraListener(listener);

    return () => {
      camera.remove(listener);
      listenerRef.current = null;
    };
  }, [camera]);

  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;

    const orthoCam = camera as THREE.OrthographicCamera;
    const currentZoom = orthoCam.zoom ?? 38.0;

    const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
    const camX = camTarget ? camTarget[0] : camera.position.x;
    const camZ = camTarget ? camTarget[1] : camera.position.z;

    const SCAN_RADIUS = 30.0;
    const radiusSq = SCAN_RADIUS * SCAN_RADIUS;

    let nearbyBuildingsCount = 0;
    let minCampfireDist = Infinity;

    for (const b of buildingEntities) {
      if (!b.position) continue;
      const dx = b.position[0] - camX;
      const dz = b.position[2] - camZ;
      const distSq = dx * dx + dz * dz;

      if (distSq <= radiusSq) {
        nearbyBuildingsCount++;
      }
      if (b.buildingType === 'campfire') {
        const dist = Math.sqrt(distSq);
        if (dist < minCampfireDist) minCampfireDist = dist;
      }
    }

    const campfireProximity = (minCampfireDist <= 6.5 && currentZoom >= 36.0)
      ? Math.pow(1.0 - minCampfireDist / 6.5, 2.5)
      : 0.0;

    if (now - lastChatterRef.current > 7500 && currentZoom >= 36.0) {
      lastChatterRef.current = now + 5000 + Math.random() * 4000;
      _nearbyChars.length = 0;
      for (const c of characterEntities) {
        if (!c.position) continue;
        const dx = c.position[0] - camX;
        const dz = c.position[2] - camZ;
        if (dx * dx + dz * dz <= 22 * 22) {
          _nearbyChars.push(c);
          if (_nearbyChars.length >= 12) break;
        }
      }

      if (_nearbyChars.length >= 2) {
        for (let i = 0; i < _nearbyChars.length; i++) {
          const c1 = _nearbyChars[i];
          let greeted = false;
          for (let j = i + 1; j < _nearbyChars.length; j++) {
            const c2 = _nearbyChars[j];
            if (c1.position && c2.position) {
              const distSq = (c1.position[0] - c2.position[0]) ** 2 + (c1.position[2] - c2.position[2]) ** 2;
              if (distSq <= 3.2 * 3.2) {
                audioManager.playPeasantVocal(c1.position[0], c1.position[2], 'greet');
                greeted = true;
                break;
              }
            }
          }
          if (greeted) break;
        }
      }
    }

    const villageDensity = Math.min(1.0, nearbyBuildingsCount / 6.0);
    const forestDensity = Math.max(0.15, 1.0 - villageDensity * 0.85);
    const waterProximity = 0.0;

    audioManager.updateAreaAmbience({
      villageDensity,
      forestDensity,
      waterProximity,
      campfireProximity,
      zoom: currentZoom,
      camX,
      camZ,
    });
  });

  return null;
}

