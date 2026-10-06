import type { GameEntity } from './world';
import type { Thought } from '../../types/game';
import {
  DEFAULT_SPEECH_BUBBLE_TICKS,
  EMPLOYED_THOUGHT_TICKS,
  DISMISSED_THOUGHT_TICKS,
} from '../../constants/economy';
import { getBuildingWorkstation } from '../buildings/buildingNavigation';

export function setEntitySpeech(
  entity: GameEntity,
  text: string,
  type: 'mood' | 'alert' | 'work' = 'work',
  currentTick: number = 0,
  durationTicks: number = DEFAULT_SPEECH_BUBBLE_TICKS
): void {
  entity.speechBubble = {
    text,
    type,
    expiresAtTick: currentTick + durationTicks,
  };
}

export function addEntityThought(entity: GameEntity, thought: Thought): void {
  if (!entity.thoughts) {
    entity.thoughts = [];
  }
  entity.thoughts = entity.thoughts.filter((t) => t.id !== thought.id);
  entity.thoughts.push(thought);
}

export function removeEntityThought(entity: GameEntity, thoughtId: string): void {
  if (entity.thoughts) {
    entity.thoughts = entity.thoughts.filter((t) => t.id !== thoughtId);
  }
}

export function assignWorkerToBuilding(
  building: GameEntity,
  worker: GameEntity,
  currentTick: number = 0
): void {
  if (!building.assignedWorkers) {
    building.assignedWorkers = [];
  }
  if (!building.assignedWorkers.includes(worker.id)) {
    building.assignedWorkers.push(worker.id);
  }
  worker.workBuildingId = building.id;

  if (worker.hasMule || worker.muleTransition || worker.isHaulingLog) {
    worker.hasMule = false;
    worker.muleTransition = undefined;
    worker.muleTransitionProgress = undefined;
    worker.assignedMuleHutId = undefined;
    worker.isHaulingLog = false;
  }

  if (building.buildingType === 'lumberjack_hut') {
    setEntitySpeech(worker, `Став лісорубом у ${building.name}`, 'work', currentTick);
    worker.currentJob = {
      id: `idle-${worker.id}`,
      type: 'idle',
      progress: 0,
      totalWork: 0,
    };
  } else {
    if (building.gridPosition) {
      const workerIndex = Math.max(0, (building.assignedWorkers || []).indexOf(worker.id));
      const station = getBuildingWorkstation(building, workerIndex);
      const facingAngle = Math.atan2(
        station.facingTarget[0] - station.workWorldPos[0],
        station.facingTarget[1] - station.workWorldPos[1]
      );
      worker.currentJob = {
        id: `work-${worker.id}-${Date.now()}`,
        type: 'work_at_building',
        targetBuildingId: building.id,
        targetPosition: [station.workWorldPos[0], station.workWorldPos[1]],
        targetAngle: facingAngle,
        progress: 0,
        totalWork: 100,
      };
    }
    setEntitySpeech(worker, `Став до роботи: ${building.name || 'споруда'}`, 'work', currentTick);
  }

  addEntityThought(worker, {
    id: 'employed',
    text: 'Маю постійну роботу (+8)',
    modifier: 8,
    durationTicks: EMPLOYED_THOUGHT_TICKS,
  });
}

export function dismissWorkerFromBuilding(
  building: GameEntity,
  worker: GameEntity,
  currentTick: number = 0
): void {
  if (building.assignedWorkers) {
    building.assignedWorkers = building.assignedWorkers.filter((id) => id !== worker.id);
  }
  worker.workBuildingId = undefined;
  worker.currentJob = { id: `idle-${worker.id}`, type: 'idle', progress: 0, totalWork: 0 };

  setEntitySpeech(worker, 'Звільнений з роботи...', 'alert', currentTick);
  removeEntityThought(worker, 'employed');
  addEntityThought(worker, {
    id: 'dismissed',
    text: 'Мене звільнили з роботи (-6)',
    modifier: -6,
    durationTicks: DISMISSED_THOUGHT_TICKS,
  });
}

export function isNoble(entity: GameEntity): boolean {
  return (
    entity.characterClass === 'king' ||
    entity.characterClass === 'lady' ||
    entity.characterClass === 'warrior' ||
    entity.characterClass === 'lord'
  );
}

export function isPeasant(entity: GameEntity): boolean {
  return entity.characterClass === 'peasant';
}

export function isFreeWorker(entity: GameEntity): boolean {
  return (
    isPeasant(entity) &&
    !entity.workBuildingId &&
    !entity.isLevy &&
    !entity.hasMule &&
    !entity.muleTransition &&
    entity.currentJob?.type !== 'haul_construction_mule' &&
    entity.currentJob?.type !== 'haul_log_with_mule' &&
    entity.currentJob?.type !== 'return_mule'
  );
}
