export const REGION = { goldhof: 0, waldau: 1, eichenau: 2, zweiau: 3, nordhain: 4, crown: 5 } as const;
export const REGION_BOUNDS: Readonly<Record<number, { minX: number; maxX: number; minZ: number; maxZ: number; regionId: number }>> = {
  0: { minX: 0, maxX: 127, minZ: 0, maxZ: 183, regionId: 0 },
  1: { minX: 256, maxX: 383, minZ: 0, maxZ: 183, regionId: 1 },
  2: { minX: 0, maxX: 191, minZ: 232, maxZ: 383, regionId: 2 },
  3: { minX: 192, maxX: 383, minZ: 232, maxZ: 383, regionId: 3 },
  4: { minX: 128, maxX: 255, minZ: 0, maxZ: 183, regionId: 4 },
  5: { minX: 0, maxX: 383, minZ: 184, maxZ: 231, regionId: 5 },
};
export const HIGHWAYS = {
  mainZ: 184, westJunctionX: 128, centralJunctionX: 192, eastJunctionX: 256,
  mainWave: { phaseX: 192, secondaryPhaseX: 96, frequency: 0.035, amplitude: 3, secondaryFrequency: 0.08, secondaryAmplitude: 1.5 },
  northWave: { frequency: 0.048, amplitude: 3, secondaryFrequency: 0.11, secondaryAmplitude: 1.5 },
  southWave: { phaseZ: 184, frequency: 0.035, amplitude: 2.5, secondaryFrequency: 0.08, secondaryAmplitude: 1 },
  halfWidth: 0.9, branchOverlap: 1.5, nearestBranchOverlap: 2,
  junctionRadius: 2.6, centralJunctionRadius: 2.8, worldMargin: 2,
} as const;
export const HIGHWAY_ACCESS: Readonly<Record<number, readonly (readonly [number, number, number, number])[]>> = {
  0: [[2,127,184,188], [128,132,2,183]],
  1: [[256,381,184,188], [252,255,2,183]],
  2: [[192,196,232,381]],
  3: [[188,191,232,381]],
  4: [[128,255,184,188], [124,127,2,183], [256,260,2,183]],
  5: [[1,382,182,233]],
};
export const FOLIAGE_BUCKET_SIZE = 16;
