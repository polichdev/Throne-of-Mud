export const TERRAIN = {
  seedScale: 100_000, foliageSeedOffset: 4321,
  groundHeight: 0.05, waterHeight: -0.18, shoreHeight: -0.04,
  defaultFertility: 0.65, shoreFertility: 0.95, roadFertility: 0.1,
  defaultMovementCost: 1, shoreMovementCost: 1.1, roadMovementCost: 0.55, clearedMovementCost: 1.2,
  spawnClearHalfWidth: 4, spawnClearHalfDepth: 3,
  foliage: {
    primaryFrequency: 4.6, secondaryFrequency: 9.8, secondaryOffsetX: 14.2, secondaryOffsetZ: 26.5, secondaryWeight: 0.42,
    treeHash: { x: 127.1, z: 311.7, multiplier: 43758.5453 },
    rockHash: { x: 269.5, z: 183.3, multiplier: 23421.631 },
    denseThresholdOffset: 0.1, denseChance: 0.56, mediumChance: 0.36, solitaryChance: 0.085,
    mountainRockThreshold: -0.38, mountainRockChance: 0.06, rockThreshold: -0.55, rockChance: 0.012,
    bushMinDensity: -0.2, bushMaxDensity: 0.45, bushRandomThreshold: 0.5,
  },
} as const;
export const REGION_TERRAIN: Readonly<Record<number, { fertility: number; forestThreshold: number }>> = {
  0: { fertility: 0.78, forestThreshold: 0.01 },
  1: { fertility: 0.62, forestThreshold: -0.18 },
  2: { fertility: 0.74, forestThreshold: -0.08 },
  3: { fertility: 0.48, forestThreshold: -0.04 },
  4: { fertility: 0.68, forestThreshold: -0.18 },
  5: { fertility: 0.6, forestThreshold: -0.04 },
};
export const LAKES = [
  { x: 72, z: 70, radius: 3.8, shoreWidth: 1.6, rotationCos: 0.9, rotationSin: 0.35, bendFrequency: 0, bendAmplitude: 0, noiseFrequency: 14, noiseOffset: 0, noiseAmplitude: 1.1 },
  { x: 60, z: 195, radius: 4.2, shoreWidth: 1.8, rotationCos: 1, rotationSin: 0, bendFrequency: 0.4, bendAmplitude: 1.1, noiseFrequency: 13, noiseOffset: 20, noiseAmplitude: 1.2 },
  { x: 320, z: 72, radius: 3.5, shoreWidth: 1.6, rotationCos: 1, rotationSin: 0, bendFrequency: 0, bendAmplitude: 0, noiseFrequency: 15, noiseOffset: 40, noiseAmplitude: 1.1 },
  { x: 192, z: 50, radius: 3.2, shoreWidth: 1.5, rotationCos: 1, rotationSin: 0, bendFrequency: 0, bendAmplitude: 0, noiseFrequency: 16, noiseOffset: 60, noiseAmplitude: 1.1 },
] as const;
