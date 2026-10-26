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

export const FOLIAGE_PAGING = {
  minSpan: 36,
  maxSpan: 54,
  zoomScale: 1200,
  spanMargin: 8,
  bucketHysteresis: 1,
  grassZoomThreshold: 20,
} as const;

export const FAUNA_LOD = {
  minDistance: 24,
  maxDistance: 44,
  zoomScale: 850,
  margin: 8,
  flockMinDistance: 28,
  flockZoomScale: 900,
  flockMargin: 10,
} as const;

export const POINT_LIGHT_POOL = { minSlots: 16, shrinkDelayMs: 30_000 } as const;
