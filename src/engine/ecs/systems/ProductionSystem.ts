import { buildingEntities, characterEntities, type GameEntity } from '../world';
import { BUILDING_BLUEPRINTS } from '../../buildings/blueprints';
import { useGameStore } from '../../../store/useGameStore';
import type { ResourceType } from '../../../types/game';
import {
  HARVEST_WHEAT_TOTAL_WORK,
  DEFAULT_WORK_SKILL,
  SUPERVISOR_SKILL_MULTIPLIER,
  RESOURCE_DEPOSIT_DRAIN_RADIUS,
} from '../../../constants/jobs';
import { BACKYARD_EXTENSIONS_CONFIG, HOUSE_TIERS_CONFIG } from '../../../constants/housing';

const _lordMap = new Map<string, GameEntity>();

export class ProductionSystem {
  private static lastTaxDayPaid = -1;

  public static update(): void {
    const { resources, addResource, consumeResource, addPendingJob, pendingJobs, playerRegionId, time } = useGameStore.getState();

    if (time && time.hour === 8 && this.lastTaxDayPaid !== time.day) {
      this.lastTaxDayPaid = time.day;
      let totalTaxCollected = 0;
      for (const b of buildingEntities) {
        if (b.isCompleted && (b.buildingType === 'peasant_house' || b.buildingType === 'manor')) {
          if (b.factionId === 'player' || b.factionId === undefined) {
            const tier = b.houseTier || 1;
            const tax = HOUSE_TIERS_CONFIG[tier]?.dailyTaxGold || 0;
            if (tax > 0) totalTaxCollected += tax;
          }
        }
      }
      if (totalTaxCollected > 0) {
        addResource('gold', totalTaxCollected);
      }
    }

    const isNight = time ? (time.hour >= 20 || time.hour < 6) : false;
    if (isNight) return;

    _lordMap.clear();
    for (const c of characterEntities) {
      _lordMap.set(c.id, c);
    }

    for (const building of buildingEntities) {
      if (!building.isCompleted || !building.buildingType) continue;

      if (building.factionId && building.factionId !== 'player') continue;
      if (building.regionId !== undefined && building.regionId !== playerRegionId) continue;

      if ((building.buildingType === 'peasant_house' || building.buildingType === 'manor') && building.backyardExtension && building.backyardExtension !== 'none') {
        const ext = BACKYARD_EXTENSIONS_CONFIG[building.backyardExtension];
        if (ext && ext.productionCycleTicks > 0) {
          building.backyardProgress = (building.backyardProgress || 0) + 1;
          if (building.backyardProgress >= ext.productionCycleTicks) {
            building.backyardProgress = 0;
            let canProduceBackyard = true;
            for (const [res, amount] of Object.entries(ext.inputs)) {
              if ((resources[res as keyof typeof resources] || 0) < (amount || 0)) {
                canProduceBackyard = false;
                break;
              }
            }
            if (canProduceBackyard) {
              for (const [res, amount] of Object.entries(ext.inputs)) {
                consumeResource(res as ResourceType, amount || 0);
              }
              for (const [res, amount] of Object.entries(ext.outputs)) {
                addResource(res as ResourceType, amount || 0);
              }
            }
          }
        }
      }

      const blueprint = BUILDING_BLUEPRINTS[building.buildingType];
      if (!blueprint || !blueprint.produces) continue;

      const maxStorage = blueprint.maxStorage || 30;
      building.localInventory = building.localInventory || {};
      const currentStored = Object.values(building.localInventory).reduce((acc, val) => acc + (val || 0), 0);

      if (currentStored >= maxStorage) {
        continue;
      }

      const assignedWorkers = building.assignedWorkers || [];
      if (blueprint.workSlots > 0 && assignedWorkers.length === 0) {
        continue;
      }

      const activeWorkersCount = Math.max(1, assignedWorkers.length);

      let supervisorMultiplier = 1.0;
      if (building.assignedLordId) {
        const lord = _lordMap.get(building.assignedLordId);
        if (lord && lord.skills) {
          const relevantSkill = Math.max(
            lord.skills.intellect,
            building.buildingType === 'wheat_farm' ? lord.skills.farming :
            building.buildingType === 'brewery' ? lord.skills.brewing :
            lord.skills.building
          );
          supervisorMultiplier += SUPERVISOR_SKILL_MULTIPLIER * (relevantSkill || DEFAULT_WORK_SKILL);
        }
      }

      const prodStep = activeWorkersCount * supervisorMultiplier;
      const prod = blueprint.produces;
      building.productionProgress = (building.productionProgress || 0) + prodStep;

      if (building.productionProgress >= prod.ticksRequired) {
        building.productionProgress = 0;

        if (building.buildingType === 'wheat_farm') {
          const farmJobId = `harvest-farm-${building.id}`;
          const existingJob = pendingJobs.find((j) => j.id === farmJobId);
          if (!existingJob && building.gridPosition) {
            addPendingJob({
              id: farmJobId,
              type: 'harvest_wheat',
              targetPosition: [building.gridPosition[0], building.gridPosition[1]],
              targetBuildingId: building.id,
              progress: 0,
              totalWork: HARVEST_WHEAT_TOTAL_WORK,
            });
          }
          continue;
        }

        let canProduce = true;
        for (const [res, amount] of Object.entries(prod.inputs)) {
          if ((resources[res as keyof typeof resources] || 0) < (amount || 0)) {
            canProduce = false;
            break;
          }
        }

        if (canProduce) {
          for (const [res, amount] of Object.entries(prod.inputs)) {
            consumeResource(res as ResourceType, amount || 0);
          }
          for (const [res, amount] of Object.entries(prod.outputs)) {
            const rType = res as ResourceType;
            building.localInventory[rType] = (building.localInventory[rType] || 0) + (amount || 0);
            addResource(rType, amount || 0);
          }

          if (
            building.buildingType === 'iron_mine' ||
            building.buildingType === 'stone_quarry' ||
            building.buildingType === 'clay_pit' ||
            building.buildingType === 'salt_works'
          ) {
            const bPos = building.gridPosition;
            if (bPos) {
              const deposits = useGameStore.getState().resourceDeposits || [];
              const dep = deposits.find(
                (d) =>
                  Math.hypot(d.gridPosition[0] - bPos[0], d.gridPosition[1] - bPos[1]) <= RESOURCE_DEPOSIT_DRAIN_RADIUS
              );
              if (dep && dep.currentAmount !== undefined && dep.currentAmount > 0) {
                dep.currentAmount = Math.max(0, dep.currentAmount - 1);
              }
            }
          }
        }
      }
    }
  }
}
