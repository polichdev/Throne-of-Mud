import type { GameEntity } from '../../../engine/ecs/world';
import { characterEntities } from '../../../engine/ecs/world';
import { BUILDING_BLUEPRINTS } from '../../../engine/buildings/blueprints';
import { HOUSE_TIERS_CONFIG, FOOD_RESOURCE_KEYS } from '../../../constants/housing';
import type { HouseTier, ResourceInventory } from '../../../types/game';
import { useGameStore } from '../../../store/useGameStore';

export function canUpgradeHouse(entity: GameEntity, resources: ResourceInventory, isForeign: boolean) {
  if (isForeign || !entity.isCompleted || entity.pendingHouseTier || entity.pendingBackyardExtension ||
    (entity.buildingType !== 'peasant_house' && entity.buildingType !== 'manor')) return false;
  const tier = (entity.houseTier || 1) as HouseTier;
  if (tier >= 3) return false;
  const next = HOUSE_TIERS_CONFIG[(tier + 1) as HouseTier];
  return FOOD_RESOURCE_KEYS.filter(key => (resources[key] || 0) > 0).length >= next.upgradeMinFoodTypes &&
    next.upgradeRequiredGoods.every(key => (resources[key] || 0) > 0) &&
    Object.entries(next.upgradeCost).every(([key, amount]) => (resources[key as keyof ResourceInventory] || 0) >= (amount || 0));
}

export function toggleBuildingDemolition(entity: GameEntity) {
  const state = useGameStore.getState();
  const jobs = state.pendingJobs.filter(job => job.targetBuildingId === entity.id);
  const pending = entity.isDemolishing || jobs.some(job => job.type === 'demolish_structure');
  if (pending) {
    for (const job of jobs) if (job.type === 'demolish_structure') state.removePendingJob(job.id);
    for (const character of characterEntities) {
      if (character.currentJob?.targetBuildingId === entity.id && character.currentJob.type === 'demolish_structure')
        character.currentJob = { id: `idle-${character.id}`, type: 'idle', progress: 0, totalWork: 0 };
    }
    entity.isDemolishing = false;
    entity.demolitionProgress = 0;
  } else {
    for (const job of jobs) if (job.type === 'build_structure') state.removePendingJob(job.id);
    const blueprint = entity.buildingType ? BUILDING_BLUEPRINTS[entity.buildingType] : undefined;
    state.addPendingJob({
      id: `job-demolish-${entity.id}`, type: 'demolish_structure',
      targetPosition: entity.gridPosition || [0, 0], targetBuildingId: entity.id,
      progress: 0, totalWork: blueprint ? 30 + blueprint.width * blueprint.height * 10 : 60,
    });
    entity.isDemolishing = true;
    entity.demolitionProgress = 0;
  }
  state.incrementBuildingVersion();
}
