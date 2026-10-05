import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

interface LightingKey {
  hour: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
}

const SHADOW_RECENTER_DISTANCE = 10;

export function DayNightLighting() {
  const { gl } = useThree();
  const buildingVersion = useGameStore((s) => s.buildingVersion);

  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const lastLightPosRef = useRef<[number, number]>([24, 24]);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
  }, [gl]);

  useEffect(() => {
    gl.shadowMap.needsUpdate = true;
  }, [buildingVersion, gl]);

  const lightTarget = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(24, 0, 24);
    return obj;
  }, []);

  const timeline = useMemo<LightingKey[]>(() => [
    {
      hour: 0,
      sunColor: new THREE.Color('#93c5fd'),
      sunIntensity: 0.50,
      ambientColor: new THREE.Color('#475569'),
      ambientIntensity: 0.45,
      hemiSkyColor: new THREE.Color('#64748b'),
      hemiGroundColor: new THREE.Color('#334155'),
    },
    {
      hour: 5.0,
      sunColor: new THREE.Color('#f97316'),
      sunIntensity: 0.65,
      ambientColor: new THREE.Color('#334155'),
      ambientIntensity: 0.38,
      hemiSkyColor: new THREE.Color('#475569'),
      hemiGroundColor: new THREE.Color('#1e293b'),
    },
    {
      hour: 6.5,
      sunColor: new THREE.Color('#f59e0b'),
      sunIntensity: 1.15,
      ambientColor: new THREE.Color('#64748b'),
      ambientIntensity: 0.42,
      hemiSkyColor: new THREE.Color('#fef08a'),
      hemiGroundColor: new THREE.Color('#334155'),
    },
    {
      hour: 8.5,
      sunColor: new THREE.Color('#fef08a'),
      sunIntensity: 1.30,
      ambientColor: new THREE.Color('#cbd5e1'),
      ambientIntensity: 0.46,
      hemiSkyColor: new THREE.Color('#fef9c3'),
      hemiGroundColor: new THREE.Color('#334155'),
    },
    {
      hour: 12.0,
      sunColor: new THREE.Color('#fff3cd'),
      sunIntensity: 1.35,
      ambientColor: new THREE.Color('#e2e8f0'),
      ambientIntensity: 0.48,
      hemiSkyColor: new THREE.Color('#fef9c3'),
      hemiGroundColor: new THREE.Color('#334155'),
    },
    {
      hour: 16.5,
      sunColor: new THREE.Color('#fed7aa'),
      sunIntensity: 1.30,
      ambientColor: new THREE.Color('#cbd5e1'),
      ambientIntensity: 0.46,
      hemiSkyColor: new THREE.Color('#fed7aa'),
      hemiGroundColor: new THREE.Color('#334155'),
    },
    {
      hour: 18.5,
      sunColor: new THREE.Color('#f97316'),
      sunIntensity: 1.15,
      ambientColor: new THREE.Color('#64748b'),
      ambientIntensity: 0.42,
      hemiSkyColor: new THREE.Color('#fca5a5'),
      hemiGroundColor: new THREE.Color('#334155'),
    },
    {
      hour: 20.5,
      sunColor: new THREE.Color('#818cf8'),
      sunIntensity: 0.55,
      ambientColor: new THREE.Color('#334155'),
      ambientIntensity: 0.38,
      hemiSkyColor: new THREE.Color('#475569'),
      hemiGroundColor: new THREE.Color('#1e293b'),
    },
    {
      hour: 24.0,
      sunColor: new THREE.Color('#93c5fd'),
      sunIntensity: 0.50,
      ambientColor: new THREE.Color('#475569'),
      ambientIntensity: 0.45,
      hemiSkyColor: new THREE.Color('#64748b'),
      hemiGroundColor: new THREE.Color('#334155'),
    },
  ], []);

  const staticColors = useMemo(() => ({
    winterSun: new THREE.Color('#dbeafe'),
    winterAmb: new THREE.Color('#93c5fd'),
    winterHemiGnd: new THREE.Color('#bfdbfe'),
    autumnSun: new THREE.Color('#f59e0b'),
    autumnAmb: new THREE.Color('#78350f'),
    springSun: new THREE.Color('#fef08a'),
    rainSun: new THREE.Color('#94a3b8'),
    rainAmb: new THREE.Color('#475569'),
    stormSun: new THREE.Color('#505c6e'),
    stormAmb: new THREE.Color('#252e3d'),
    lightningSun: new THREE.Color('#ffffff'),
    lightningAmb: new THREE.Color('#e0f2fe'),
    snowSun: new THREE.Color('#cbd5e1'),
    snowAmb: new THREE.Color('#64748b'),
    snowHemiGnd: new THREE.Color('#e2e8f0'),
    scratchSun: new THREE.Color(),
    scratchAmb: new THREE.Color(),
    scratchHemiSky: new THREE.Color(),
    scratchHemiGnd: new THREE.Color(),
  }), []);

  const lastTimeRef = useRef({
    hour: -1,
    minute: -1,
    season: '',
    rain: -1,
    storm: -1,
    snow: -1,
    lightning: -1,
  });

  useFrame(() => {
    const { time } = useGameStore.getState();
    const currentHour = (time.hour + time.minute / 60) % 24;

    const timeChanged =
      time.hour !== lastTimeRef.current.hour ||
      Math.abs(time.minute - lastTimeRef.current.minute) >= 0.05 ||
      time.season !== lastTimeRef.current.season ||
      time.rainIntensity !== lastTimeRef.current.rain ||
      time.stormIntensity !== lastTimeRef.current.storm ||
      time.snowIntensity !== lastTimeRef.current.snow ||
      (time.lightningFlash || 0) !== lastTimeRef.current.lightning;

    if (timeChanged) {
      lastTimeRef.current = {
        hour: time.hour,
        minute: time.minute,
        season: time.season,
        rain: time.rainIntensity || 0,
        storm: time.stormIntensity || 0,
        snow: time.snowIntensity || 0,
        lightning: time.lightningFlash || 0,
      };

      let k0 = timeline[0];
      let k1 = timeline[timeline.length - 1];

      for (let i = 0; i < timeline.length - 1; i++) {
        if (currentHour >= timeline[i].hour && currentHour <= timeline[i + 1].hour) {
          k0 = timeline[i];
          k1 = timeline[i + 1];
          break;
        }
      }

      const span = k1.hour - k0.hour;
      const progress = span > 0 ? (currentHour - k0.hour) / span : 0;
      const smoothT = progress * progress * (3 - 2 * progress);

      const sunCol = staticColors.scratchSun.copy(k0.sunColor).lerp(k1.sunColor, smoothT);
      let sunInt = THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, smoothT);

      const ambCol = staticColors.scratchAmb.copy(k0.ambientColor).lerp(k1.ambientColor, smoothT);
      let ambInt = THREE.MathUtils.lerp(k0.ambientIntensity, k1.ambientIntensity, smoothT);

      const hemiSky = staticColors.scratchHemiSky.copy(k0.hemiSkyColor).lerp(k1.hemiSkyColor, smoothT);
      const hemiGnd = staticColors.scratchHemiGnd.copy(k0.hemiGroundColor).lerp(k1.hemiGroundColor, smoothT);

      const season = time.season;
      if (season === 'Winter') {
        sunCol.lerp(staticColors.winterSun, 0.18);
        ambCol.lerp(staticColors.winterAmb, 0.20);
        hemiGnd.lerp(staticColors.winterHemiGnd, 0.35);
        sunInt *= 0.92;
        ambInt *= 1.12;
      } else if (season === 'Autumn') {
        sunCol.lerp(staticColors.autumnSun, 0.15);
        ambCol.lerp(staticColors.autumnAmb, 0.12);
      } else if (season === 'Spring') {
        sunCol.lerp(staticColors.springSun, 0.08);
      }

      const { rainIntensity = 0, stormIntensity = 0, snowIntensity = 0, lightningFlash = 0 } = time;

      if (rainIntensity > 0.005) {
        const rainWeight = rainIntensity * 0.40;
        sunCol.lerp(staticColors.rainSun, rainWeight);
        ambCol.lerp(staticColors.rainAmb, rainWeight * 0.85);
        sunInt *= THREE.MathUtils.lerp(1.0, 0.65, rainIntensity);
        ambInt *= THREE.MathUtils.lerp(1.0, 0.90, rainIntensity);
      }

      if (stormIntensity > 0.005) {
        const stormWeight = stormIntensity * 0.50;
        sunCol.lerp(staticColors.stormSun, stormWeight);
        ambCol.lerp(staticColors.stormAmb, stormWeight * 0.85);
        sunInt *= THREE.MathUtils.lerp(1.0, 0.45, stormIntensity);
        ambInt *= THREE.MathUtils.lerp(1.0, 0.80, stormIntensity);

        if (lightningFlash > 0.01) {
          sunCol.lerp(staticColors.lightningSun, lightningFlash);
          ambCol.lerp(staticColors.lightningAmb, lightningFlash);
          sunInt += lightningFlash * 4.2;
          ambInt += lightningFlash * 2.2;
        }
      }

      if (snowIntensity > 0.005) {
        const snowWeight = snowIntensity * 0.35;
        sunCol.lerp(staticColors.snowSun, snowWeight);
        ambCol.lerp(staticColors.snowAmb, snowWeight * 0.70);
        hemiGnd.lerp(staticColors.snowHemiGnd, snowWeight * 0.80);
        sunInt *= THREE.MathUtils.lerp(1.0, 0.75, snowIntensity);
        ambInt *= THREE.MathUtils.lerp(1.0, 1.10, snowIntensity);
      }

      ambInt = Math.max(0.42, ambInt);
      sunInt = Math.max(0.25, sunInt);

      if (sunLightRef.current) {
        sunLightRef.current.color.copy(sunCol);
        sunLightRef.current.intensity = sunInt;
      }

      if (ambientLightRef.current) {
        ambientLightRef.current.color.copy(ambCol);
        ambientLightRef.current.intensity = ambInt;
      }

      if (hemiLightRef.current) {
        hemiLightRef.current.color.copy(hemiSky);
        hemiLightRef.current.groundColor.copy(hemiGnd);
      }
    }

    if (sunLightRef.current) {
      const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
      if (camTarget) {
        const dx = camTarget[0] - lastLightPosRef.current[0];
        const dz = camTarget[1] - lastLightPosRef.current[1];
        if (dx * dx + dz * dz >= SHADOW_RECENTER_DISTANCE * SHADOW_RECENTER_DISTANCE) {
          lastLightPosRef.current = [camTarget[0], camTarget[1]];
          lightTarget.position.set(camTarget[0], 0, camTarget[1]);
          sunLightRef.current.position.set(camTarget[0] + 18, 36, camTarget[1] + 20);
          gl.shadowMap.needsUpdate = true;
        }
      }
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.48} />
      <hemisphereLight
        ref={hemiLightRef}
        args={['#fef9c3', '#334155', 0.22]}
      />
      <primitive object={lightTarget} />
      <directionalLight
        ref={sunLightRef}
        target={lightTarget}
        position={[24 + 18, 36, 24 + 20]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={130}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  );
}

