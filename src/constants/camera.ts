export const DEFAULT_CAMERA_ZOOM = 38.0;
export const MIN_CAMERA_ZOOM = 4.0;
export const MAX_CAMERA_ZOOM = 85.0;
export const STRATEGIC_ZOOM_THRESHOLD = 17.0;
export const STRATEGIC_ZOOM_EXIT_THRESHOLD = 18.0;
export const STRATEGIC_VIEW_ZOOM = 5.0;

export const CAMERA_DISTANCE = 339.408;
export const CAMERA_HEIGHT = 288.0;
export const CAMERA_BOUNDS_MARGIN = 4.0;
export const CAMERA_INITIAL_OFFSET = 240.0;

export const CAMERA_CLIPPING = { near: -500, far: 3000 } as const;
export const DEFAULT_CAMERA_ANGLE = Math.PI / 4;
export const CAMERA_CONTROLS = {
  maxPointerDeltaPixels: 90,
  dragProjectionFactor: 0.707,
  wheelZoomIn: 1.15,
  wheelZoomOut: 0.87,
  menuOrbitRadiansPerSecond: 0.007,
  rotationRadiansPerSecond: 2.4,
  panUnitsPerSecond: 14,
  angleLerpRate: 12,
  positionLerpRate: 14,
  zoomLerpRate: 18,
  zoomUpdateEpsilon: 0.002,
  zoomSnapEpsilon: 0.02,
} as const;
