export const PATHFINDING = {
  initialHeapCapacity: 2048,
  roadHeapCapacity: 4096,
  regionalMaxIterations: 700,
  maxIterations: 1600,
  roadMaxIterations: 15000,
  maxUnreachableEntries: 4000,
  adjacentTargetCandidates: 2,
  runIdResetThreshold: 2 ** 31 - 8,
} as const;
