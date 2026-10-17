export const RENDERING = {
  pixelRatio: 1,
  exposure: 1,
  background: '#090d16',
  strategicBackground: '#18120c',
  metricsPublishMs: 200,
  submissionSampleFrames: 16,
  submissionSampleMaxAgeMs: 2000,
} as const;

export const BUILDING_VISIBILITY = { minDistance: 38, maxDistance: 50, zoomScale: 1200, margin: 12 } as const;

export function getBuildingVisibilityDistance(zoom: number): number {
  const { minDistance, maxDistance, zoomScale, margin } = BUILDING_VISIBILITY;
  return Math.max(minDistance, Math.min(maxDistance, zoomScale / zoom + margin));
}

export const POINT_LIGHT_POOL = { minSlots: 16, shrinkDelayMs: 30_000 } as const;
