import * as THREE from 'three';

interface LightingKey {
  hour: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
}

export function createLightingTimeline(): LightingKey[] {
  return [
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
  ];
}

export function createLightingColors() {
  return {
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
  };
}

export const LIGHTING = {
  shadowRecenterDistance: 24,
  initialTarget: [24, 24] as [number, number],
  sunOffset: [18, 36, 20] as [number, number, number],
  ambientIntensity: 0.48,
  sunIntensity: 1.35,
  hemisphere: ['#fef9c3', '#334155', 0.22] as [string, string, number],
  shadow: { mapSize: 1024, near: 0.5, far: 130, extent: 22, bias: -0.0004, normalBias: 0.02 },
  minuteUpdateThreshold: 0.05,
  minWeatherIntensity: 0.005,
  minAmbientIntensity: 0.42,
  minSunIntensity: 0.25,
  winter: { sunColor: 0.18, ambientColor: 0.2, groundColor: 0.35, sunIntensity: 0.92, ambientIntensity: 1.12 },
  autumn: { sunColor: 0.15, ambientColor: 0.12 },
  spring: { sunColor: 0.08 },
  rain: { weight: 0.4, ambientWeight: 0.85, sunIntensity: 0.65, ambientIntensity: 0.9 },
  storm: { weight: 0.5, ambientWeight: 0.85, sunIntensity: 0.45, ambientIntensity: 0.8 },
  lightning: { minIntensity: 0.01, sunIntensity: 4.2, ambientIntensity: 2.2 },
  snow: { weight: 0.35, ambientWeight: 0.7, groundWeight: 0.8, sunIntensity: 0.75, ambientIntensity: 1.1 },
} as const;
