import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

const LOCAL_SPAN = 56;
const RAIN_COUNT = 2200;
const RAIN_HEIGHT = 11.5;

const SNOW_COUNT = 1000;
const SNOW_HEIGHT = 10.0;

export function WeatherRenderer() {
  const { rainGeometry, rainMaterial } = useMemo(() => {
    const positions = new Float32Array(RAIN_COUNT * 2 * 3);
    const dropLengths = new Float32Array(RAIN_COUNT * 2);
    const speeds = new Float32Array(RAIN_COUNT * 2);
    const randomSeeds = new Float32Array(RAIN_COUNT * 2);

    for (let i = 0; i < RAIN_COUNT; i++) {
      const rx = (Math.random() - 0.5) * LOCAL_SPAN;
      const ry = Math.random() * RAIN_HEIGHT;
      const rz = (Math.random() - 0.5) * LOCAL_SPAN;
      const len = 0.35 + Math.random() * 0.25;
      const spd = 22 + Math.random() * 8;
      const seed = Math.random() * 100;

      const idx = i * 6;
      positions[idx] = rx;
      positions[idx + 1] = ry;
      positions[idx + 2] = rz;
      dropLengths[i * 2] = 0.0;
      speeds[i * 2] = spd;
      randomSeeds[i * 2] = seed;

      positions[idx + 3] = rx;
      positions[idx + 4] = ry;
      positions[idx + 5] = rz;
      dropLengths[i * 2 + 1] = len;
      speeds[i * 2 + 1] = spd;
      randomSeeds[i * 2 + 1] = seed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aDropLen', new THREE.BufferAttribute(dropLengths, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(randomSeeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uWind: { value: new THREE.Vector2(0.05, 0.02) },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uWind;
        attribute float aDropLen;
        attribute float aSpeed;
        attribute float aSeed;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          float cycleHeight = 11.5;

          float fall = mod(pos.y - uTime * aSpeed + aSeed * 13.0, cycleHeight);
          pos.y = fall;

          if (aDropLen > 0.0) {
            pos.y -= aDropLen;
            pos.x -= uWind.x * aDropLen * 0.8;
            pos.z -= uWind.y * aDropLen * 0.8;
            vAlpha = 0.85;
          } else {
            vAlpha = 0.35;
          }

          pos.x += uWind.x * (cycleHeight - pos.y) * 0.25;
          pos.z += uWind.y * (cycleHeight - pos.y) * 0.25;

          float groundImpact = smoothstep(0.0, 0.40, pos.y);

          float topFade = smoothstep(cycleHeight, cycleHeight - 0.75, pos.y);
          vAlpha *= groundImpact * topFade;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform float uIntensity;

        void main() {
          float alpha = vAlpha * uIntensity;
          if (alpha < 0.02) discard;

          gl_FragColor = vec4(0.80, 0.89, 1.0, alpha * 0.75);
        }
      `,
    });

    return { rainGeometry: geo, rainMaterial: mat };
  }, []);

  const { snowGeometry, snowMaterial } = useMemo(() => {
    const positions = new Float32Array(SNOW_COUNT * 3);
    const scales = new Float32Array(SNOW_COUNT);
    const seeds = new Float32Array(SNOW_COUNT);

    for (let i = 0; i < SNOW_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * LOCAL_SPAN;
      positions[i * 3 + 1] = Math.random() * SNOW_HEIGHT;
      positions[i * 3 + 2] = (Math.random() - 0.5) * LOCAL_SPAN;
      scales[i] = 0.8 + Math.random() * 1.3;
      seeds[i] = Math.random() * 200.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aScale;
        attribute float aSeed;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          float cycleHeight = 10.0;

          float fall = mod(pos.y - uTime * 2.6 + aSeed * 2.0, cycleHeight);
          pos.y = fall;

          float t = uTime * 1.1 + aSeed;
          pos.x += sin(t * 0.8) * 0.65;
          pos.z += cos(t * 0.7) * 0.65;

          float groundLanding = smoothstep(0.04, 0.35, pos.y);
          vAlpha = groundLanding * 0.85;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aScale * 3.4;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform float uIntensity;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.1, dist) * vAlpha * uIntensity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(0.96, 0.98, 1.0, alpha);
        }
      `,
    });

    return { snowGeometry: geo, snowMaterial: mat };
  }, []);

  useEffect(() => {
    return () => {
      rainGeometry.dispose();
      rainMaterial.dispose();
      snowGeometry.dispose();
      snowMaterial.dispose();
    };
  }, [rainGeometry, rainMaterial, snowGeometry, snowMaterial]);

  const groupRef = useRef<THREE.Group>(null);
  const rainMeshRef = useRef<THREE.LineSegments>(null);
  const snowMeshRef = useRef<THREE.Points>(null);
  const isStrategicView = useGameStore((state) => state.isStrategicView);

  useFrame(({ camera }) => {
    const orthoCam = camera as THREE.OrthographicCamera;
    const currentZoom = orthoCam.zoom || 38;

    if (isStrategicView || currentZoom <= 18.5) {
      if (rainMeshRef.current) rainMeshRef.current.visible = false;
      if (snowMeshRef.current) snowMeshRef.current.visible = false;
      return;
    }

    const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
    if (groupRef.current && camTarget) {
      groupRef.current.position.set(camTarget[0], 0, camTarget[1]);
    }

    const time = performance.now() / 1000;
    const { rainIntensity = 0, stormIntensity = 0, snowIntensity = 0 } = useGameStore.getState().time;

    if (rainMeshRef.current) {
      rainMeshRef.current.visible = rainIntensity > 0.005;
    }
    if (snowMeshRef.current) {
      snowMeshRef.current.visible = snowIntensity > 0.005;
    }

    if (rainMaterial?.uniforms?.uTime) {
      rainMaterial.uniforms.uTime.value = time;
      rainMaterial.uniforms.uIntensity.value = rainIntensity * (0.85 + stormIntensity * 0.55);
      rainMaterial.uniforms.uWind.value.set(
        0.04 + stormIntensity * 0.09,
        0.02 + stormIntensity * 0.06
      );
    }

    if (snowMaterial?.uniforms?.uTime) {
      snowMaterial.uniforms.uTime.value = time;
      snowMaterial.uniforms.uIntensity.value = snowIntensity;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} visible={!isStrategicView}>
      <lineSegments
        ref={rainMeshRef}
        geometry={rainGeometry}
        material={rainMaterial}
        visible={false}
      />
      <points
        ref={snowMeshRef}
        geometry={snowGeometry}
        material={snowMaterial}
        visible={false}
      />
    </group>
  );
}

