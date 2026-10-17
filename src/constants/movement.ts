export const SURFACE_SPEED_ROAD = 1.5;
export const SURFACE_SPEED_MUD = 0.75;
export const SURFACE_SPEED_DEFAULT = 1.0;

export const ENTITY_COLLISION_DISTANCE = 0.46;
export const ENTITY_COLLISION_DISTANCE_SQ = ENTITY_COLLISION_DISTANCE * ENTITY_COLLISION_DISTANCE;

export const ENTITY_STUCK_TICK_LIMIT = 40;
export const ENTITY_STUCK_DISTANCE_EPSILON = 0.005;

export const ENTITY_WAYPOINT_PROXIMITY = 0.4;
export const ENTITY_VERTICAL_LERP_SPEED = 12.0;
export const ENTITY_VERTICAL_EPSILON = 0.005;

export const ENTITY_MAX_PUSH_SPEED = 1.6;
export const ENTITY_LATERAL_DODGE_MAX = 0.03;

export const DEFAULT_UNIT_MOVE_SPEED = 1.35;

export const MOVEMENT_LIMITS = {
  stuckTimeoutSeconds: 2,
  stuckProgressEpsilon: 0.005,
  worldMargin: 2.5,
  royalPlazaExclusionRadius: 3.8,
  minSimulationDistance: 30,
  simulationZoomScale: 900,
  simulationDistanceMargin: 10,
} as const;
