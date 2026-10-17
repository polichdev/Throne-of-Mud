import { WEATHER_PARTICLES as WEATHER } from '../../constants/particles';
import { DEFAULT_CAMERA_ZOOM } from '../../constants/camera';
import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

const LOCAL_SPAN = WEATHER.span;
const RAIN_COUNT = WEATHER.rain.count;
const RAIN_HEIGHT = WEATHER.rain.height;
const SNOW_COUNT = WEATHER.snow.count;
const SNOW_HEIGHT = WEATHER.snow.height;
const glsl = (value: number) => Number.isInteger(value) ? value.toFixed(1) : String(value);

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
      const len = WEATHER.rain.minLength + Math.random() * WEATHER.rain.lengthVariation;
      const spd = WEATHER.rain.minSpeed + Math.random() * WEATHER.rain.speedVariation;
      const seed = Math.random() * WEATHER.rain.seedRange;

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
        uWind: { value: new THREE.Vector2(WEATHER.rain.windX, WEATHER.rain.windZ) },
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
          float cycleHeight = ${glsl(WEATHER.rain.height)};

          float fall = mod(pos.y - uTime * aSpeed + aSeed * ${glsl(WEATHER.rain.seedPhase)}, cycleHeight);
          pos.y = fall;

          if (aDropLen > 0.0) {
            pos.y -= aDropLen;
            pos.x -= uWind.x * aDropLen * ${glsl(WEATHER.rain.trailWind)};
            pos.z -= uWind.y * aDropLen * ${glsl(WEATHER.rain.trailWind)};
            vAlpha = ${glsl(WEATHER.rain.tipAlpha)};
          } else {
            vAlpha = ${glsl(WEATHER.rain.tailAlpha)};
          }

          pos.x += uWind.x * (cycleHeight - pos.y) * ${glsl(WEATHER.rain.drift)};
          pos.z += uWind.y * (cycleHeight - pos.y) * ${glsl(WEATHER.rain.drift)};

          float groundImpact = smoothstep(0.0, ${glsl(WEATHER.rain.groundFade)}, pos.y);

          float topFade = (1.0 - smoothstep(cycleHeight - ${glsl(WEATHER.rain.topFade)}, cycleHeight, pos.y));
          vAlpha *= groundImpact * topFade;

          float distFromCenter = length(pos.xz);
          float edgeFade = 1.0 - smoothstep(${glsl(WEATHER.span / 2 * WEATHER.edgeFadeStartRatio)}, ${glsl(WEATHER.span / 2 * WEATHER.edgeFadeEndRatio)}, distFromCenter);
          vAlpha *= edgeFade;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform float uIntensity;

        void main() {
          float alpha = vAlpha * uIntensity;
          if (alpha < ${glsl(WEATHER.rain.alphaCutoff)}) discard;

          gl_FragColor = vec4(${WEATHER.rain.color.map(glsl).join(", ")}, alpha * ${glsl(WEATHER.rain.opacity)});
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
      scales[i] = WEATHER.snow.minScale + Math.random() * WEATHER.snow.scaleVariation;
      seeds[i] = Math.random() * WEATHER.snow.seedRange;
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
          float cycleHeight = ${glsl(WEATHER.snow.height)};

          float fall = mod(pos.y - uTime * ${glsl(WEATHER.snow.speed)} + aSeed * ${glsl(WEATHER.snow.seedPhase)}, cycleHeight);
          pos.y = fall;

          float t = uTime * ${glsl(WEATHER.snow.swaySpeed)} + aSeed;
          pos.x += sin(t * ${glsl(WEATHER.snow.swayX)}) * ${glsl(WEATHER.snow.swayAmplitude)};
          pos.z += cos(t * ${glsl(WEATHER.snow.swayZ)}) * ${glsl(WEATHER.snow.swayAmplitude)};

          float groundLanding = smoothstep(${glsl(WEATHER.snow.groundFadeStart)}, ${glsl(WEATHER.snow.groundFadeEnd)}, pos.y);
          vAlpha = groundLanding * ${glsl(WEATHER.snow.opacity)};

          float distFromCenter = length(pos.xz);
          float edgeFade = 1.0 - smoothstep(${glsl(WEATHER.span / 2 * WEATHER.edgeFadeStartRatio)}, ${glsl(WEATHER.span / 2 * WEATHER.edgeFadeEndRatio)}, distFromCenter);
          vAlpha *= edgeFade;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aScale * ${glsl(WEATHER.snow.pointSize)};
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform float uIntensity;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float alpha = (1.0 - smoothstep(${glsl(WEATHER.snow.softCoreRadius)}, 0.5, dist)) * vAlpha * uIntensity;
          if (alpha < ${glsl(WEATHER.snow.alphaCutoff)}) discard;
          gl_FragColor = vec4(${WEATHER.snow.color.map(glsl).join(", ")}, alpha);
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
    const currentZoom = orthoCam.zoom || DEFAULT_CAMERA_ZOOM;

    if (isStrategicView || currentZoom <= WEATHER.minVisibleZoom) {
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
      rainMeshRef.current.visible = rainIntensity > WEATHER.minIntensity;
    }
    if (snowMeshRef.current) {
      snowMeshRef.current.visible = snowIntensity > WEATHER.minIntensity;
    }

    if (rainMaterial?.uniforms?.uTime) {
      rainMaterial.uniforms.uTime.value = time;
      rainMaterial.uniforms.uIntensity.value = rainIntensity * (WEATHER.rain.baseIntensity + stormIntensity * WEATHER.rain.stormIntensity);
      rainMaterial.uniforms.uWind.value.set(
        WEATHER.rain.windX + stormIntensity * WEATHER.rain.stormWindX,
        WEATHER.rain.windZ + stormIntensity * WEATHER.rain.stormWindZ
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
