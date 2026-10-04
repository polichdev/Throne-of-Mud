import { World } from 'miniplex';
import type {
  CharacterClass,
  CharacterNeeds,
  CharacterSkills,
  Job,
  ResourceInventory,
  BuildingType,
  Thought,
  ResourceDepositType
} from '../../types/game';

export type {
  CharacterClass,
  CharacterNeeds,
  CharacterSkills,
  Job,
  ResourceInventory,
  BuildingType,
  Thought,
  ResourceDepositType
};

export interface GameEntity {
  id: string;
  name?: string;
  avatarColor?: string;

  isCharacter?: boolean;
  characterClass?: CharacterClass;
  title?: string;
  familyId?: string;
  factionId?: string;
  regionId?: number;

  position?: [number, number, number];
  gridPosition?: [number, number];
  targetPosition?: [number, number];
  path?: [number, number][];
  moveSpeed?: number;

  needs?: CharacterNeeds;
  skills?: CharacterSkills;
  currentJob?: Job;
  inventory?: Partial<ResourceInventory>;
  selected?: boolean;
  gold?: number;
  workBuildingId?: string;
  thoughts?: Thought[];
  morale?: number;
  isLevy?: boolean;
  commandingLordId?: string;
  hasMule?: boolean;
  isHaulingLog?: boolean;
  assignedMuleHutId?: string;
  muleTransition?: 'taking' | 'returning';
  muleTransitionProgress?: number;
  speechBubble?: {
    text: string;
    expiresAtTick: number;
    type?: 'mood' | 'alert' | 'work';
  };

  isBuilding?: boolean;
  buildingType?: BuildingType;
  buildingHealth?: number;
  maxBuildingHealth?: number;
  buildingWidth?: number;
  buildingHeight?: number;
  rotationAngle?: number;
  isCompleted?: boolean;
  constructionProgress?: number;
  isDemolishing?: boolean;
  demolitionProgress?: number;
  productionProgress?: number;
  assignedWorkers?: string[];
  workerSlots?: number;
  assignedLordId?: string;
  wage?: number;
  efficiencyBonus?: number;
  localInventory?: Partial<ResourceInventory>;
  maxStorage?: number;
  mulesCount?: number;
  maxMules?: number;
  requiredMaterials?: Partial<ResourceInventory>;
  deliveredMaterials?: Partial<ResourceInventory>;

  isHarvestable?: boolean;
  resourceType?: 'wood' | 'stone' | 'wheat';
  resourceAmount?: number;

  isResourceDeposit?: boolean;
  depositType?: ResourceDepositType;
  maxResourceAmount?: number;
  isRichDeposit?: boolean;
  yearlyYield?: number;
  maxYearlyYield?: number;
  harvestBuildingLabel?: string;
  depositDescription?: string;
  depositIcon?: string;
}

export const world = new World<GameEntity>();

export const characterEntities = world.with('isCharacter', 'position', 'gridPosition', 'needs');
export const buildingEntities = world.with('isBuilding', 'position', 'gridPosition', 'buildingType');
export const resourceDepositEntities = world.with('isResourceDeposit', 'position', 'gridPosition');
export const movingEntities = world.with('position', 'gridPosition', 'path');

