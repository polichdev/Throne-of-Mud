export const WEATHER_PARTICLES = {
  span: 200, minVisibleZoom: 16.5, minIntensity: 0.005,
  edgeFadeStartRatio: 0.85, edgeFadeEndRatio: 0.98,
  rain: {
    count: 7000, height: 12, minLength: 0.4, lengthVariation: 0.3,
    minSpeed: 22, speedVariation: 8, seedRange: 100, seedPhase: 13,
    trailWind: 0.8, tipAlpha: 0.85, tailAlpha: 0.35, drift: 0.25,
    groundFade: 0.4, topFade: 0.75, alphaCutoff: 0.02,
    color: [0.8, 0.89, 1], opacity: 0.75,
    baseIntensity: 0.85, stormIntensity: 0.55,
    windX: 0.04, windZ: 0.02, stormWindX: 0.09, stormWindZ: 0.06,
  },
  snow: {
    count: 3200, height: 10.5, minScale: 0.8, scaleVariation: 1.3,
    seedRange: 200, speed: 2.6, seedPhase: 2, swaySpeed: 1.1,
    swayX: 0.8, swayZ: 0.7, swayAmplitude: 0.65,
    groundFadeStart: 0.04, groundFadeEnd: 0.35, opacity: 0.85,
    pointSize: 3.4, softCoreRadius: 0.1, alphaCutoff: 0.01,
    color: [0.96, 0.98, 1],
  },
} as const;

export const WOOD_CHIPS = {
  capacity: 120,
  size: [0.045, 0.035, 0.075] as [number, number, number],
  colors: ['#b45309', '#78350f', '#d97706', '#f59e0b', '#fef08a'],
  count: 10, countVariation: 6,
  spreadSpeed: 1, spreadSpeedVariation: 1.8,
  upSpeed: 1.8, upSpeedVariation: 1.6,
  spawnSpread: 0.25, spawnHeight: 0.4, heightVariation: 0.35,
  angularSpeed: 20, minScale: 0.7, scaleVariation: 0.6,
  minLifetimeSeconds: 0.75, lifetimeVariation: 0.45,
  maxDeltaSeconds: 0.05, gravity: 9.5, groundHeight: 0.04,
  restitution: 0.32, groundFriction: 0.65, shrinkExponent: 2.5,
} as const;
