import { type GameEntity, buildingEntities } from '../ecs/world';
import { GridMap } from '../grid/GridMap';
import { AStar, type RegionBounds } from '../pathfinding/AStar';
import { BUILDING_BLUEPRINTS } from './blueprints';

export interface WorkstationInfo {
  doorApproachPos: [number, number];
  doorWorldPos: [number, number];
  workWorldPos: [number, number];
  facingTarget: [number, number];
  intermediatePos?: [number, number];
}

export interface SleepSpotInfo {
  doorApproachPos: [number, number];
  doorWorldPos: [number, number];
  bedWorldPos: [number, number];
  bedY: number;
  facingAngle: number;
  intermediatePos?: [number, number];
}

export interface CampfireSitSpotInfo {
  position: [number, number];
  approachTile: [number, number];
  spotY: number;
  facingAngle: number;
  isBench: boolean;
}

export function getBuildingDimensions(bType?: string): [number, number] {
  if (bType && (BUILDING_BLUEPRINTS as any)[bType]) {
    const bp = (BUILDING_BLUEPRINTS as any)[bType];
    return [bp.width, bp.height];
  }
  return [4, 2];
}

export function getBuildingFloorHeight(bType?: string): number {
  switch (bType) {
    case 'wooden_church':
      return 0.22;
    case 'manor':
      return 0.24;
    case 'tavern':
    case 'market':
    case 'stockpile':
      return 0.16;
    case 'barracks':
    case 'bakery':
    case 'brewery':
    case 'peasant_house':
    case 'lumberjack_hut':
    case 'fishermans_hut':
    case 'foragers_hut':
    case 'hunters_hut':
    case 'stonecutter':
    case 'weavers_workshop':
    case 'foresters_hut':
    case 'sawmill':
      return 0.14;
    case 'iron_smelter':
    case 'brickworks':
    case 'salt_works':
      return 0.12;
    case 'windmill':
      return 0.10;
    case 'wheat_farm':
      return 0.08;
    case 'iron_mine':
    case 'stone_quarry':
    case 'clay_pit':
    case 'charcoal_kiln':
      return 0.05;
    case 'tent':
      return 0.02;
    default:
      return 0;
  }
}

function getBuildingCenter(building: GameEntity): [number, number] {
  const bType = building.buildingType || 'peasant_house';
  const [defW, defH] = getBuildingDimensions(bType);
  const cx = building.position ? building.position[0] : (building.gridPosition ? building.gridPosition[0] + defW / 2 : 0);
  const cz = building.position ? building.position[2] : (building.gridPosition ? building.gridPosition[1] + defH / 2 : 0);
  return [cx, cz];
}

function localToWorldPt(
  cx: number,
  cz: number,
  rot: number,
  lx: number,
  lz: number
): [number, number] {
  if (Math.abs(rot) < 0.0001) {
    return [cx + lx, cz + lz];
  }
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return [
    cx + lx * cos + lz * sin,
    cz - lx * sin + lz * cos,
  ];
}

function localToTilePt(
  cx: number,
  cz: number,
  rot: number,
  lx: number,
  lz: number
): [number, number] {
  const [wx, wz] = localToWorldPt(cx, cz, rot, lx, lz);
  return [Math.floor(wx), Math.floor(wz)];
}

export function getBuildingDoorInfo(building: GameEntity): {
  doorApproachPos: [number, number];
  doorWorldPos: [number, number];
  intermediatePos?: [number, number];
} {
  const bType = building.buildingType || 'peasant_house';
  const [, defH] = getBuildingDimensions(bType);
  const rot = building.rotationAngle || 0;
  const [cx, cz] = getBuildingCenter(building);

  let localDoorApproach: [number, number];
  let localDoorPos: [number, number];
  let localIntermediate: [number, number] | undefined = undefined;

  switch (bType) {
    case 'market': {
      localDoorApproach = [0, 1.6];
      localDoorPos = [0, 0.75];
      localIntermediate = [0, -0.55];
      break;
    }
    case 'bakery': {
      localDoorApproach = [1.05, 1.5];
      localDoorPos = [1.05, 0.88];
      localIntermediate = [0, 0.08];
      break;
    }
    case 'brewery': {
      localDoorApproach = [0.15, 1.5];
      localDoorPos = [0.15, 0.88];
      break;
    }
    case 'lumberjack_hut': {
      localDoorApproach = [0.15, 1.5];
      localDoorPos = [0.15, 0.88];
      break;
    }
    case 'barracks': {
      localDoorApproach = [0, 2.0];
      localDoorPos = [0, 1.35];
      break;
    }
    case 'windmill': {
      localDoorApproach = [0, 1.8];
      localDoorPos = [0, 1.25];
      break;
    }
    case 'tent': {
      localDoorApproach = [-0.45, 1.4];
      localDoorPos = [-0.45, 0.85];
      break;
    }
    case 'manor': {
      localDoorApproach = [0, 2.5];
      localDoorPos = [0, 1.88];
      break;
    }
    case 'wooden_church':
    case 'tavern': {
      localDoorApproach = [0, 2.0];
      localDoorPos = [0, 1.38];
      break;
    }
    case 'peasant_house':
    default: {
      if (defH === 3) {
        localDoorApproach = [0, 2.0];
        localDoorPos = [0, 1.38];
      } else {
        localDoorApproach = [0, 1.5];
        localDoorPos = [0, 0.88];
      }
      break;
    }
  }

  return {
    doorApproachPos: localToTilePt(cx, cz, rot, localDoorApproach[0], localDoorApproach[1]),
    doorWorldPos: localToWorldPt(cx, cz, rot, localDoorPos[0], localDoorPos[1]),
    intermediatePos: localIntermediate ? localToWorldPt(cx, cz, rot, localIntermediate[0], localIntermediate[1]) : undefined,
  };
}

export function getBuildingWorkstation(
  building: GameEntity,
  workerIndex: number = 0,
  currentTick: number = 0
): WorkstationInfo {
  const bType = building.buildingType || 'peasant_house';
  const rot = building.rotationAngle || 0;
  const [cx, cz] = getBuildingCenter(building);
  const door = getBuildingDoorInfo(building);

  let localWorkPos: [number, number];
  let localFacingTarget: [number, number];

  switch (bType) {
    case 'market': {
      const isRightStall = workerIndex === 1;
      const xOff = isRightStall ? 0.9 : -0.9;
      localWorkPos = [xOff, -0.55];
      localFacingTarget = [xOff, 1.2];
      break;
    }
    case 'bakery': {
      if (workerIndex === 1) {
        localWorkPos = [1.15, 0.42];
        localFacingTarget = [1.15, -0.35];
      } else {
        localWorkPos = [-0.95, 0.45];
        localFacingTarget = [-0.95, 1.5];
      }
      break;
    }
    case 'brewery': {
      if (workerIndex === 1) {
        localWorkPos = [0.85, -0.28];
        localFacingTarget = [1.38, -0.28];
      } else {
        localWorkPos = [-0.25, -0.2];
        localFacingTarget = [-0.75, -0.2];
      }
      break;
    }
    case 'lumberjack_hut': {
      localWorkPos = [1.38, 0];
      localFacingTarget = [1.38, -0.5];
      break;
    }
    case 'barracks': {
      const bHash = (building.id.charCodeAt(0) * 3 + building.id.charCodeAt(building.id.length - 1) * 7) % 4;
      const barracksStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [0.25, 0.55], facing: [0.25, 0] },
        { pos: [1.35, -0.55], facing: [1.85, -0.55] },
        { pos: [1.35, 0.65], facing: [1.80, 0.65] },
        { pos: [0, 1.35], facing: [0, 2.0] },
      ];
      const step = (bHash + workerIndex + Math.floor(currentTick / 350)) % barracksStations.length;
      const st = barracksStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'windmill': {
      localWorkPos = [0, 0];
      localFacingTarget = [-0.5, 0];
      break;
    }
    case 'wheat_farm': {
      const farmSpots: [number, number][] = [
        [-1.35, -1.15],
        [1.20, -1.30],
        [-0.75, 1.25],
        [1.35, 1.10],
        [-1.25, 0.45],
        [0.85, -0.65],
        [-0.45, -1.25],
        [1.15, 0.20],
        [0.40, 1.35],
        [-1.10, -0.45],
        [0.70, 0.85],
        [-0.60, 0.35],
      ];
      const bHash = (building.id.charCodeAt(0) * 11 + building.id.charCodeAt(building.id.length - 1) * 17) % farmSpots.length;
      const shift = Math.floor(currentTick / 300);
      const spotIdx = (bHash + workerIndex * 5 + shift) % farmSpots.length;
      const spot = farmSpots[spotIdx];
      localWorkPos = [spot[0], spot[1]];
      localFacingTarget = [
        spot[0] + (spot[0] > 0 ? -0.45 : 0.45),
        spot[1] + (spot[1] > 0 ? -0.35 : 0.35),
      ];
      break;
    }
    case 'manor': {
      localWorkPos = [0, -0.8];
      localFacingTarget = [0, 1.0];
      break;
    }
    case 'stockpile': {
      const offsets = [-1.25, -0.4, 0.4, 1.25];
      const xOff = offsets[workerIndex % 4] || 0;
      localWorkPos = [xOff, 0.2];
      localFacingTarget = [xOff, -0.6];
      break;
    }
    case 'fishermans_hut': {
      if (workerIndex === 1) {
        localWorkPos = [0.6, 0];
        localFacingTarget = [0.6, -0.8];
      } else {
        localWorkPos = [-0.6, -0.3];
        localFacingTarget = [-0.6, -1.2];
      }
      break;
    }
    case 'foragers_hut': {
      if (workerIndex === 1) {
        localWorkPos = [0.5, 0];
        localFacingTarget = [0.5, -0.8];
      } else {
        localWorkPos = [-0.5, 0];
        localFacingTarget = [-0.5, 0.8];
      }
      break;
    }
    case 'hunters_hut': {
      if (workerIndex === 1) {
        localWorkPos = [-0.6, 0];
        localFacingTarget = [-0.6, -0.8];
      } else {
        localWorkPos = [0.6, -0.2];
        localFacingTarget = [0.6, 0.8];
      }
      break;
    }
    case 'iron_mine': {
      const xOff = workerIndex === 1 ? -1.0 : workerIndex === 2 ? 1.0 : 0;
      localWorkPos = [xOff, 0];
      localFacingTarget = [xOff, -1.0];
      break;
    }
    case 'stone_quarry': {
      const bHash = (building.id.charCodeAt(0) * 3 + building.id.charCodeAt(building.id.length - 1) * 7) % 3;
      const quarryStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [1.05, 0.45], facing: [1.05, -0.30] },
        { pos: [0.55, -0.45], facing: [0.10, -0.45] },
        { pos: [-1.10, 0.95], facing: [-1.10, 0.45] },
      ];
      const step = (bHash + workerIndex) % quarryStations.length;
      const st = quarryStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'clay_pit': {
      const bHash = (building.id.charCodeAt(0) * 5 + building.id.charCodeAt(building.id.length - 1) * 7) % 3;
      const clayStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [-0.75, 0.25], facing: [0, 0] },
        { pos: [0.75, -0.45], facing: [0, -0.45] },
        { pos: [1.25, 0.45], facing: [0.65, 0.45] },
      ];
      const step = (bHash + workerIndex + Math.floor(currentTick / 300)) % clayStations.length;
      const st = clayStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'salt_works': {
      const bHash = (building.id.charCodeAt(0) * 3 + building.id.charCodeAt(building.id.length - 1) * 7) % 2;
      const saltStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [-0.60, 0.80], facing: [-0.60, 0] },
        { pos: [0.80, 0.80], facing: [0.80, 0] },
      ];
      const step = (bHash + workerIndex + Math.floor(currentTick / 400)) % saltStations.length;
      const st = saltStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'charcoal_kiln': {
      const bHash = (building.id.charCodeAt(0) * 5 + building.id.charCodeAt(building.id.length - 1) * 11) % 3;
      const kilnStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [-1.15, 1.35], facing: [-1.15, 0.96] },
        { pos: [1.35, 0.45], facing: [1.65, -0.35] },
        { pos: [0.35, 0.75], facing: [0.35, 0.25] },
      ];
      const step = (bHash + workerIndex + Math.floor(currentTick / 350)) % kilnStations.length;
      const st = kilnStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'iron_smelter': {
      const bHash = (building.id.charCodeAt(0) * 5 + building.id.charCodeAt(building.id.length - 1) * 7) % 4;
      const smelterStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [-1.45, -0.65], facing: [-1.45, 0] },
        { pos: [-0.02, -0.15], facing: [-0.02, -0.65] },
        { pos: [-1.45, 1.25], facing: [-1.45, 0.70] },
        { pos: [1.40, -0.35], facing: [1.40, 0.35] },
      ];
      const step = (bHash + workerIndex + Math.floor(currentTick / 350)) % smelterStations.length;
      const st = smelterStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'stonecutter': {
      const xOff = workerIndex === 1 ? 0.6 : -0.6;
      localWorkPos = [xOff, 0];
      localFacingTarget = [xOff, 0.8];
      break;
    }
    case 'brickworks': {
      const bHash = (building.id.charCodeAt(0) * 5 + building.id.charCodeAt(building.id.length - 1) * 7) % 3;
      const brickStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [0, -0.15], facing: [0, -0.65] },
        { pos: [-1.45, 1.25], facing: [-1.45, 0.70] },
        { pos: [1.45, -0.15], facing: [1.45, 0.45] },
      ];
      const step = (bHash + workerIndex + Math.floor(currentTick / 350)) % brickStations.length;
      const st = brickStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'sawmill': {
      const bHash = (building.id.charCodeAt(0) * 3 + building.id.charCodeAt(building.id.length - 1) * 7) % 3;
      const sawStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [-1.0, 0.75], facing: [-1.0, 0] },
        { pos: [-1.0, -0.75], facing: [-1.0, 0] },
        { pos: [0.35, 0.0], facing: [1.35, -0.65] },
      ];
      const step = (bHash + workerIndex + Math.floor(currentTick / 400)) % sawStations.length;
      const st = sawStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'weavers_workshop': {
      const bHash = (building.id.charCodeAt(0) * 3 + building.id.charCodeAt(building.id.length - 1) * 7) % 3;
      const weaverStations: { pos: [number, number]; facing: [number, number] }[] = [
        { pos: [-1.05, 0.65], facing: [-1.05, -0.20] },
        { pos: [0.65, -0.30], facing: [0.95, -0.30] },
        { pos: [1.15, 0.45], facing: [1.55, 0.45] },
      ];
      const step = (bHash + workerIndex + Math.floor(currentTick / 400)) % weaverStations.length;
      const st = weaverStations[step];
      localWorkPos = st.pos;
      localFacingTarget = st.facing;
      break;
    }
    case 'foresters_hut': {
      const xOff = workerIndex === 1 ? 0.6 : -0.6;
      localWorkPos = [xOff, 0];
      localFacingTarget = [xOff, 0.8];
      break;
    }
    case 'wooden_church': {
      localWorkPos = [0, -0.8];
      localFacingTarget = [0, 0.8];
      break;
    }
    case 'tavern': {
      if (workerIndex === 1) {
        localWorkPos = [0.55, 0.25];
        localFacingTarget = [-0.40, 0.25];
      } else {
        localWorkPos = [-0.95, -0.40];
        localFacingTarget = [-0.20, -0.40];
      }
      break;
    }
    default: {
      localWorkPos = [0, 0];
      localFacingTarget = [0, 1.0];
      break;
    }
  }

  return {
    doorApproachPos: door.doorApproachPos,
    doorWorldPos: door.doorWorldPos,
    intermediatePos: door.intermediatePos,
    workWorldPos: localToWorldPt(cx, cz, rot, localWorkPos[0], localWorkPos[1]),
    facingTarget: localToWorldPt(cx, cz, rot, localFacingTarget[0], localFacingTarget[1]),
  };
}

export function getBuildingSleepSpot(
  building: GameEntity,
  bedIndex: number = 0
): SleepSpotInfo {
  const bType = building.buildingType || 'peasant_house';
  const rot = building.rotationAngle || 0;
  const [cx, cz] = getBuildingCenter(building);
  const door = getBuildingDoorInfo(building);
  const buildingBaseY = building.position ? building.position[1] : 0.05;

  let localBedPos: [number, number];
  let bedY: number;
  let localFacingAngle: number = 0;
  let localIntermediatePos: [number, number] | undefined = undefined;

  switch (bType) {
    case 'tent': {
      localBedPos = [0.55, 0];
      bedY = buildingBaseY + 0.22;
      localFacingAngle = 0;
      break;
    }
    case 'manor': {
      const manorOffsets: [number, number][] = [
        [-1.55, -0.2],
        [-1.55, -0.9],
        [1.55, -0.9],
        [1.55, 0.4],
      ];
      const off = manorOffsets[bedIndex % manorOffsets.length];
      localBedPos = [off[0], off[1]];
      bedY = buildingBaseY + 0.48;
      localFacingAngle = 0;
      localIntermediatePos = [-1.25, 1.1];
      break;
    }
    case 'lumberjack_hut': {
      localBedPos = [-1.25, -0.2];
      bedY = buildingBaseY + 0.37;
      localFacingAngle = 0;
      localIntermediatePos = [0, 0.3];
      break;
    }
    case 'barracks': {
      localBedPos = [-1.65, -0.5];
      bedY = bedIndex === 1 ? buildingBaseY + 0.95 : buildingBaseY + 0.35;
      localFacingAngle = Math.PI / 2;
      localIntermediatePos = [0, 0.4];
      break;
    }
    case 'peasant_house':
    default: {
      localBedPos = [bedIndex === 1 ? 1.25 : -1.25, -0.15];
      bedY = buildingBaseY + 0.28;
      localFacingAngle = 0;
      localIntermediatePos = [0, 0.3];
      break;
    }
  }

  const bedWorldPos = localToWorldPt(cx, cz, rot, localBedPos[0], localBedPos[1]);
  const intermediatePos = localIntermediatePos
    ? localToWorldPt(cx, cz, rot, localIntermediatePos[0], localIntermediatePos[1])
    : door.intermediatePos;

  return {
    doorApproachPos: door.doorApproachPos,
    doorWorldPos: door.doorWorldPos,
    bedWorldPos,
    bedY,
    facingAngle: localFacingAngle + rot,
    intermediatePos,
  };
}

export function getCampfireSitSpot(campfire: GameEntity, seatIndex: number): CampfireSitSpotInfo {
  const [bx, bz] = campfire.gridPosition || [52, 52];
  const cx = bx + 1.0;
  const cz = bz + 1.0;
  const campH = campfire.position ? campfire.position[1] : 0.05;

  const benchSeats: { offset: [number, number]; approachOffset: [number, number]; angle: number }[] = [
    { offset: [-0.85, -0.32], approachOffset: [-1, 0], angle: Math.PI / 2 },
    { offset: [-0.85, 0.32], approachOffset: [-1, 1], angle: Math.PI / 2 },
    { offset: [0.85, -0.32], approachOffset: [2, 0], angle: -Math.PI / 2 },
    { offset: [0.85, 0.32], approachOffset: [2, 1], angle: -Math.PI / 2 },
    { offset: [-0.32, -0.85], approachOffset: [0, -1], angle: 0 },
    { offset: [0.32, -0.85], approachOffset: [1, -1], angle: 0 },
    { offset: [-0.32, 0.85], approachOffset: [0, 2], angle: Math.PI },
    { offset: [0.32, 0.85], approachOffset: [1, 2], angle: Math.PI },
  ];

  if (seatIndex < benchSeats.length) {
    const seat = benchSeats[seatIndex];
    return {
      position: [cx + seat.offset[0], cz + seat.offset[1]],
      approachTile: [bx + seat.approachOffset[0], bz + seat.approachOffset[1]],
      spotY: campH + 0.22,
      facingAngle: seat.angle,
      isBench: true,
    };
  }

  const extraIndex = seatIndex - benchSeats.length;
  const ring = Math.floor(extraIndex / 8);
  const ringIndex = extraIndex % 8;
  const rad = 1.45 + ring * 0.55;
  const angle = (ringIndex * (Math.PI / 4) + Math.PI / 8 + ring * 0.25) % (Math.PI * 2);
  const px = cx + Math.cos(angle) * rad;
  const pz = cz + Math.sin(angle) * rad;
  const facing = Math.atan2(cx - px, cz - pz);

  return {
    position: [px, pz],
    approachTile: [Math.floor(px), Math.floor(pz)],
    spotY: campH + 0.07,
    facingAngle: facing,
    isBench: false,
  };
}

export function getCampfireSleepSpot(campfire: GameEntity, sleeperIndex: number): {
  bedWorldPos: [number, number];
  bedY: number;
  facingAngle: number;
} {
  const [bx, bz] = campfire.gridPosition || [52, 52];
  const cx = bx + 1.0;
  const cz = bz + 1.0;
  const campH = campfire.position ? campfire.position[1] : 0.05;

  const corners: [number, number][] = [
    [-1.25, -1.25],
    [1.25, 1.25],
    [1.25, -1.25],
    [-1.25, 1.25],
  ];

  const c = corners[sleeperIndex % corners.length];
  const px = cx + c[0];
  const pz = cz + c[1];
  const facing = Math.atan2(-c[0], -c[1]);

  return {
    bedWorldPos: [px, pz],
    bedY: campH + 0.03,
    facingAngle: facing,
  };
}

export function findBuildingContainingPos(
  worldX: number,
  worldZ: number,
  buildings: Iterable<GameEntity>
): GameEntity | undefined {
  for (const b of buildings) {
    if (!b.isCompleted) continue;
    if (b.buildingType === 'campfire') continue;
    const [defW, defH] = getBuildingDimensions(b.buildingType);
    if (b.position) {
      const cx = b.position[0];
      const cz = b.position[2];
      const dx = worldX - cx;
      const dz = worldZ - cz;
      const maxHalfDim = (defW > defH ? defW : defH) * 0.75;
      if (Math.abs(dx) > maxHalfDim || Math.abs(dz) > maxHalfDim) continue;
      const rot = b.rotationAngle || 0;
      let lx = dx;
      let lz = dz;
      if (Math.abs(rot) > 0.001) {
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        lx = dx * cos - dz * sin;
        lz = dx * sin + dz * cos;
      }
      if (Math.abs(lx) < defW / 2 - 0.15 && Math.abs(lz) < defH / 2 - 0.15) {
        return b;
      }
    } else if (b.gridPosition) {
      const w = b.buildingWidth || defW;
      const h = b.buildingHeight || defH;
      if (
        worldX >= b.gridPosition[0] + 0.15 &&
        worldX <= b.gridPosition[0] + w - 0.15 &&
        worldZ >= b.gridPosition[1] + 0.15 &&
        worldZ <= b.gridPosition[1] + h - 0.15
      ) {
        return b;
      }
    }
  }
  return undefined;
}

export function createPathToInterior(
  grid: GridMap,
  startGrid: [number, number],
  doorApproachPos: [number, number],
  doorWorldPos: [number, number],
  destWorldPos: [number, number],
  intermediatePos?: [number, number],
  bounds?: RegionBounds,
  startPos?: [number, number, number],
  targetBuilding?: GameEntity
): [number, number][] | null {
  if (startPos && targetBuilding) {
    const isInsideTarget = findBuildingContainingPos(startPos[0], startPos[2], [targetBuilding]);
    if (isInsideTarget) {
      const distToDest = Math.hypot(startPos[0] - destWorldPos[0], startPos[2] - destWorldPos[1]);
      if (distToDest < 0.6) {
        return [];
      }
      const internalPath: [number, number][] = [];
      const distToInter = intermediatePos
        ? Math.hypot(startPos[0] - intermediatePos[0], startPos[2] - intermediatePos[1])
        : 999;
      if (intermediatePos && distToInter > 0.4 && distToDest > distToInter) {
        internalPath.push([intermediatePos[0] - 0.5, intermediatePos[1] - 0.5]);
      }
      internalPath.push([destWorldPos[0] - 0.5, destWorldPos[1] - 0.5]);
      return internalPath;
    }
  }

  const exitWps: [number, number][] = [];
  let navStartGrid: [number, number] = [startGrid[0], startGrid[1]];

  if (startPos && targetBuilding) {
    const insideOther = findBuildingContainingPos(startPos[0], startPos[2], buildingEntities);
    if (insideOther && insideOther.id !== targetBuilding.id) {
      const otherDoor = getBuildingDoorInfo(insideOther);
      if (otherDoor.intermediatePos) {
        exitWps.push([otherDoor.intermediatePos[0] - 0.5, otherDoor.intermediatePos[1] - 0.5]);
      }
      exitWps.push([otherDoor.doorWorldPos[0] - 0.5, otherDoor.doorWorldPos[1] - 0.5]);
      exitWps.push(otherDoor.doorApproachPos);
      navStartGrid = [Math.floor(otherDoor.doorApproachPos[0]), Math.floor(otherDoor.doorApproachPos[1])];
    }
  }

  const isAlreadyAtApproach =
    Math.abs(navStartGrid[0] - doorApproachPos[0]) <= 1 &&
    Math.abs(navStartGrid[1] - doorApproachPos[1]) <= 1;

  let approachPath: [number, number][] | null = null;
  if (!isAlreadyAtApproach) {
    approachPath = AStar.findPath(grid, navStartGrid, doorApproachPos, true, bounds);
    if (!approachPath || approachPath.length === 0) {
      const candidates: [number, number][] = [
        [doorApproachPos[0], doorApproachPos[1] + 1],
        [doorApproachPos[0] + 1, doorApproachPos[1]],
        [doorApproachPos[0] - 1, doorApproachPos[1]],
        [doorApproachPos[0], doorApproachPos[1] - 1],
        [doorApproachPos[0] + 1, doorApproachPos[1] + 1],
        [doorApproachPos[0] - 1, doorApproachPos[1] + 1],
      ];
      for (const [cx, cz] of candidates) {
        if (grid.isWalkable(cx, cz)) {
          const testPath = AStar.findPath(grid, navStartGrid, [cx, cz], true, bounds);
          if (testPath && testPath.length > 0) {
            approachPath = testPath;
            break;
          }
        }
      }
    }

    if (!approachPath || approachPath.length === 0) {
      return null;
    }
  }

  const path: [number, number][] = [...exitWps];
  if (approachPath && approachPath.length > 0) {
    path.push(...approachPath);
  }

  const doorWp: [number, number] = [doorWorldPos[0] - 0.5, doorWorldPos[1] - 0.5];
  path.push(doorWp);

  if (intermediatePos) {
    path.push([intermediatePos[0] - 0.5, intermediatePos[1] - 0.5]);
  }

  const destWp: [number, number] = [destWorldPos[0] - 0.5, destWorldPos[1] - 0.5];
  path.push(destWp);

  return path;
}

export function createPathFromInterior(
  grid: GridMap,
  doorWorldPos: [number, number],
  doorApproachPos: [number, number],
  targetGrid: [number, number],
  intermediatePos?: [number, number],
  bounds?: RegionBounds
): [number, number][] {
  const path: [number, number][] = [];

  if (intermediatePos) {
    path.push([intermediatePos[0] - 0.5, intermediatePos[1] - 0.5]);
  }

  const doorWp: [number, number] = [doorWorldPos[0] - 0.5, doorWorldPos[1] - 0.5];
  path.push(doorWp);
  path.push(doorApproachPos);

  const outsidePath = AStar.findPath(grid, doorApproachPos, targetGrid, true, bounds);
  if (outsidePath && outsidePath.length > 0) {
    for (const wp of outsidePath) {
      if (wp[0] !== doorApproachPos[0] || wp[1] !== doorApproachPos[1]) {
        path.push(wp);
      }
    }
  }

  return path;
}

export function createPathSafely(
  grid: GridMap,
  unitPos: [number, number, number] | undefined,
  unitGrid: [number, number] | undefined,
  targetGrid: [number, number],
  buildings: Iterable<GameEntity>,
  allowAdjacent = true,
  bounds?: RegionBounds
): [number, number][] | null {
  const currentPos = unitPos;
  if (currentPos) {
    const insideBuilding = findBuildingContainingPos(currentPos[0], currentPos[2], buildings);
    if (insideBuilding) {
      const door = getBuildingDoorInfo(insideBuilding);
      const distToDoor = Math.hypot(currentPos[0] - door.doorWorldPos[0], currentPos[2] - door.doorWorldPos[1]);
      const distToApproach = Math.hypot(currentPos[0] - door.doorApproachPos[0], currentPos[2] - door.doorApproachPos[1]);
      if (distToApproach > 0.8 && distToDoor > 0.3) {
        return createPathFromInterior(
          grid,
          door.doorWorldPos,
          door.doorApproachPos,
          targetGrid,
          door.intermediatePos,
          bounds
        );
      }
    }
  }

  const startGrid = unitGrid || (currentPos ? [Math.floor(currentPos[0]), Math.floor(currentPos[2])] : targetGrid);
  return AStar.findPath(grid, startGrid, targetGrid, allowAdjacent, bounds);
}

export function createPathToAreaSafely(
  grid: GridMap,
  unitPos: [number, number, number] | undefined,
  unitGrid: [number, number] | undefined,
  areaX: number,
  areaZ: number,
  width: number,
  height: number,
  buildings: Iterable<GameEntity>,
  bounds?: RegionBounds
): [number, number][] | null {
  const currentPos = unitPos;
  if (currentPos) {
    const insideBuilding = findBuildingContainingPos(currentPos[0], currentPos[2], buildings);
    if (insideBuilding) {
      const door = getBuildingDoorInfo(insideBuilding);
      const distToDoor = Math.hypot(currentPos[0] - door.doorWorldPos[0], currentPos[2] - door.doorWorldPos[1]);
      const distToApproach = Math.hypot(currentPos[0] - door.doorApproachPos[0], currentPos[2] - door.doorApproachPos[1]);
      if (distToApproach > 0.8 && distToDoor > 0.3) {
        const path: [number, number][] = [];
        if (door.intermediatePos) {
          path.push([door.intermediatePos[0] - 0.5, door.intermediatePos[1] - 0.5]);
        }
        path.push([door.doorWorldPos[0] - 0.5, door.doorWorldPos[1] - 0.5]);
        path.push(door.doorApproachPos);
        const outsidePath = AStar.findPathToArea(grid, door.doorApproachPos, areaX, areaZ, width, height, bounds);
        if (outsidePath && outsidePath.length > 0) {
          for (const wp of outsidePath) {
            if (wp[0] !== door.doorApproachPos[0] || wp[1] !== door.doorApproachPos[1]) {
              path.push(wp);
            }
          }
        }
        return path;
      }
    }
  }

  const startGrid = unitGrid || (currentPos ? [Math.floor(currentPos[0]), Math.floor(currentPos[2])] : [areaX, areaZ]);
  return AStar.findPathToArea(grid, startGrid, areaX, areaZ, width, height, bounds);
}
