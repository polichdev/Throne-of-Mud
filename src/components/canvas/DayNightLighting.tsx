import { LIGHTING, createLightingTimeline, createLightingColors } from './lightingSettings';
import { HOURS_PER_DAY, MINUTES_PER_HOUR } from '../../constants/time';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { buildingEntities } from '../../engine/ecs/world';
import { BuildingShadowState } from './performance/BuildingShadowState';

export function DayNightLighting() {
  const { gl } = useThree();
  const isStrategicView = useGameStore((state) => state.isStrategicView);
  const pendingShadowRef = useRef(true);
  const shadowState = useMemo(() => new BuildingShadowState(), []);
  const shadowRevisionRef = useRef({ version: -1, selectedId: null as string | null, floor: -1 });

  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const lastLightPosRef = useRef<[number, number]>([...LIGHTING.initialTarget]);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
  }, [gl]);

  const lightTarget = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(LIGHTING.initialTarget[0], 0, LIGHTING.initialTarget[1]);
    return obj;
  }, []);

  const timeline = useMemo(createLightingTimeline, []);

  const staticColors = useMemo(createLightingColors, []);

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
    const { time, buildingVersion, selectedEntityId, houseFloorView, isStrategicView: strategicNow } = useGameStore.getState();
    if (gl.shadowMap.needsUpdate) pendingShadowRef.current = true;
    const lastRevision = shadowRevisionRef.current;
    if (lastRevision.version !== buildingVersion || lastRevision.selectedId !== selectedEntityId || lastRevision.floor !== houseFloorView) {
      if (shadowState.update(buildingEntities, selectedEntityId, houseFloorView)) pendingShadowRef.current = true;
      lastRevision.version = buildingVersion;
      lastRevision.selectedId = selectedEntityId;
      lastRevision.floor = houseFloorView;
    }
    const currentHour = (time.hour + time.minute / MINUTES_PER_HOUR) % HOURS_PER_DAY;

    const timeChanged =
      time.hour !== lastTimeRef.current.hour ||
      Math.abs(time.minute - lastTimeRef.current.minute) >= LIGHTING.minuteUpdateThreshold ||
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
        sunCol.lerp(staticColors.winterSun, LIGHTING.winter.sunColor);
        ambCol.lerp(staticColors.winterAmb, LIGHTING.winter.ambientColor);
        hemiGnd.lerp(staticColors.winterHemiGnd, LIGHTING.winter.groundColor);
        sunInt *= LIGHTING.winter.sunIntensity;
        ambInt *= LIGHTING.winter.ambientIntensity;
      } else if (season === 'Autumn') {
        sunCol.lerp(staticColors.autumnSun, LIGHTING.autumn.sunColor);
        ambCol.lerp(staticColors.autumnAmb, LIGHTING.autumn.ambientColor);
      } else if (season === 'Spring') {
        sunCol.lerp(staticColors.springSun, LIGHTING.spring.sunColor);
      }

      const { rainIntensity = 0, stormIntensity = 0, snowIntensity = 0, lightningFlash = 0 } = time;

      if (rainIntensity > LIGHTING.minWeatherIntensity) {
        const rainWeight = rainIntensity * LIGHTING.rain.weight;
        sunCol.lerp(staticColors.rainSun, rainWeight);
        ambCol.lerp(staticColors.rainAmb, rainWeight * LIGHTING.rain.ambientWeight);
        sunInt *= THREE.MathUtils.lerp(1.0, LIGHTING.rain.sunIntensity, rainIntensity);
        ambInt *= THREE.MathUtils.lerp(1.0, LIGHTING.rain.ambientIntensity, rainIntensity);
      }

      if (stormIntensity > LIGHTING.minWeatherIntensity) {
        const stormWeight = stormIntensity * LIGHTING.storm.weight;
        sunCol.lerp(staticColors.stormSun, stormWeight);
        ambCol.lerp(staticColors.stormAmb, stormWeight * LIGHTING.storm.ambientWeight);
        sunInt *= THREE.MathUtils.lerp(1.0, LIGHTING.storm.sunIntensity, stormIntensity);
        ambInt *= THREE.MathUtils.lerp(1.0, LIGHTING.storm.ambientIntensity, stormIntensity);

        if (lightningFlash > LIGHTING.lightning.minIntensity) {
          sunCol.lerp(staticColors.lightningSun, lightningFlash);
          ambCol.lerp(staticColors.lightningAmb, lightningFlash);
          sunInt += lightningFlash * LIGHTING.lightning.sunIntensity;
          ambInt += lightningFlash * LIGHTING.lightning.ambientIntensity;
        }
      }

      if (snowIntensity > LIGHTING.minWeatherIntensity) {
        const snowWeight = snowIntensity * LIGHTING.snow.weight;
        sunCol.lerp(staticColors.snowSun, snowWeight);
        ambCol.lerp(staticColors.snowAmb, snowWeight * LIGHTING.snow.ambientWeight);
        hemiGnd.lerp(staticColors.snowHemiGnd, snowWeight * LIGHTING.snow.groundWeight);
        sunInt *= THREE.MathUtils.lerp(1.0, LIGHTING.snow.sunIntensity, snowIntensity);
        ambInt *= THREE.MathUtils.lerp(1.0, LIGHTING.snow.ambientIntensity, snowIntensity);
      }

      ambInt = Math.max(LIGHTING.minAmbientIntensity, ambInt);
      sunInt = Math.max(LIGHTING.minSunIntensity, sunInt);

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
        if (dx * dx + dz * dz >= LIGHTING.shadowRecenterDistance * LIGHTING.shadowRecenterDistance) {
          lastLightPosRef.current = [camTarget[0], camTarget[1]];
          lightTarget.position.set(camTarget[0], 0, camTarget[1]);
          sunLightRef.current.position.set(camTarget[0] + LIGHTING.sunOffset[0], LIGHTING.sunOffset[1], camTarget[1] + LIGHTING.sunOffset[2]);
          pendingShadowRef.current = true;
        }
      }
    }
    if (isStrategicView || strategicNow) {
      gl.shadowMap.needsUpdate = false;
    } else if (pendingShadowRef.current) {
      gl.shadowMap.needsUpdate = true;
      pendingShadowRef.current = false;
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={LIGHTING.ambientIntensity} />
      <hemisphereLight
        ref={hemiLightRef}
        args={LIGHTING.hemisphere}
      />
      <primitive object={lightTarget} />
      <directionalLight
        ref={sunLightRef}
        target={lightTarget}
        position={[LIGHTING.initialTarget[0] + LIGHTING.sunOffset[0], LIGHTING.sunOffset[1], LIGHTING.initialTarget[1] + LIGHTING.sunOffset[2]]}
        intensity={LIGHTING.sunIntensity}
        castShadow
        shadow-mapSize-width={LIGHTING.shadow.mapSize}
        shadow-mapSize-height={LIGHTING.shadow.mapSize}
        shadow-camera-near={LIGHTING.shadow.near}
        shadow-camera-far={LIGHTING.shadow.far}
        shadow-camera-left={-LIGHTING.shadow.extent}
        shadow-camera-right={LIGHTING.shadow.extent}
        shadow-camera-top={LIGHTING.shadow.extent}
        shadow-camera-bottom={-LIGHTING.shadow.extent}
        shadow-bias={LIGHTING.shadow.bias}
        shadow-normalBias={LIGHTING.shadow.normalBias}
      />
    </>
  );
}
