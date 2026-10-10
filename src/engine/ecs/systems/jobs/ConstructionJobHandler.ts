import type { GameEntity, Job } from '../../world';
import { buildingEntities, characterEntities, world } from '../../world';
import { GridMap } from '../../../grid/GridMap';
import { BUILDING_BLUEPRINTS } from '../../../buildings/blueprints';
import { useGameStore } from '../../../../store/useGameStore';
import type { RegionData } from '../../../../types/game';
import {
  DEFAULT_BASE_WORK_STEP,
  WORK_SKILL_STEP_MULTIPLIER,
} from '../../../../constants/jobs';

export class ConstructionJobHandler {
  public static handleConstructionProgress(
    unit: GameEntity,
    job: Job,
    currentTick: number,
    buildSkill: number
  ): boolean {
    const workStep = DEFAULT_BASE_WORK_STEP + Math.floor(buildSkill * WORK_SKILL_STEP_MULTIPLIER);

    if (unit.hasMule || unit.muleTransition || unit.isHaulingLog) {
      unit.hasMule = false;
      unit.muleTransition = undefined;
      unit.muleTransitionProgress = undefined;
      unit.assignedMuleHutId = undefined;
      unit.isHaulingLog = false;
    }

    if (job.type === 'build_structure' && currentTick % 12 === 0) {
      unit.speechBubble = {
        text: 'Зводжу споруду...',
        expiresAtTick: currentTick + 15,
        type: 'work',
      };
    } else if (job.type === 'demolish_structure' && currentTick % 12 === 0) {
      unit.speechBubble = {
        text: 'Розбираю споруду...',
        expiresAtTick: currentTick + 15,
        type: 'work',
      };
    }

    if (job.targetBuildingId) {
      let bEnt: GameEntity | undefined;
      for (const b of buildingEntities) {
        if (b.id === job.targetBuildingId) {
          bEnt = b;
          break;
        }
      }
      if (bEnt) {
        if (job.type === 'build_structure' && bEnt.isCompleted) {
          unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
          return true;
        }

        if (job.type === 'build_structure' && bEnt.requiredMaterials) {
          let materialsDelivered = true;
          for (const [res, needed] of Object.entries(bEnt.requiredMaterials)) {
            const del = (bEnt.deliveredMaterials && (bEnt.deliveredMaterials as any)[res]) || 0;
            if (del < (needed || 0)) {
              materialsDelivered = false;
              break;
            }
          }
          if (!materialsDelivered) {
            unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
            return false;
          }
        }

        if (unit.gridPosition && bEnt.gridPosition) {
          const [ux, uz] = unit.gridPosition;
          const [bx, bz] = bEnt.gridPosition;
          const bw = bEnt.buildingWidth || 2;
          const bh = bEnt.buildingHeight || 2;
          const isAdjacent = ux >= bx - 1 && ux <= bx + bw && uz >= bz - 1 && uz <= bz + bh;
          if (!isAdjacent && (!unit.path || unit.path.length === 0)) {
            unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
            return false;
          }
        }

        const pendingJob = useGameStore.getState().pendingJobs.find((pj) => pj.id === job.id || pj.targetBuildingId === job.targetBuildingId);
        if (pendingJob) {
          pendingJob.progress = (pendingJob.progress || 0) + workStep;
          job.progress = pendingJob.progress;
          job.totalWork = pendingJob.totalWork || 100;
        } else {
          job.progress = (job.progress || 0) + workStep;
          if (!job.totalWork) job.totalWork = 100;
        }

        const newProg = Math.min(99, Math.round((job.progress / (job.totalWork || 100)) * 100));
        if (job.type === 'build_structure') {
          bEnt.constructionProgress = newProg;
        } else {
          bEnt.isDemolishing = true;
          bEnt.demolitionProgress = newProg;
        }

        return job.progress >= job.totalWork;
      } else {
        unit.currentJob = { id: `idle-${Date.now()}`, type: 'idle', progress: 0, totalWork: 0 };
        return true;
      }
    }

    job.progress += workStep;
    return job.progress >= (job.totalWork || 100);
  }

  public static completeBuilding(
    job: Job,
    unit: GameEntity,
    currentTick: number,
    isPlayerUnit: boolean,
    regions: RegionData[],
    updateRegionStats: (regionId: number, partial: Partial<RegionData>) => void
  ): void {
    const { addChronicleEvent, incrementBuildingVersion } = useGameStore.getState();

    if (!job.targetBuildingId) return;

    for (const b of buildingEntities) {
      const bEnt = b as GameEntity;
      if (bEnt.id === job.targetBuildingId) {
        const upgradedTier = bEnt.pendingHouseTier;
        const upgradedYard = bEnt.pendingBackyardExtension;
        if (upgradedTier) {
          bEnt.houseTier = upgradedTier;
          bEnt.pendingHouseTier = undefined;
          bEnt.maxBuildingHealth = (bEnt.maxBuildingHealth || 150) + 100;
        }
        if (upgradedYard) {
          bEnt.backyardExtension = upgradedYard;
          bEnt.pendingBackyardExtension = undefined;
          bEnt.backyardProgress = 0;
        }
        bEnt.constructionProgress = 100;
        bEnt.isCompleted = true;
        bEnt.buildingHealth = bEnt.maxBuildingHealth || 150;
        bEnt.requiredMaterials = undefined;
        bEnt.deliveredMaterials = undefined;
        incrementBuildingVersion();

        if (isPlayerUnit) {
          addChronicleEvent({
            title: upgradedTier || upgradedYard ? 'Покращення завершено!' : 'Будівництво завершено!',
            description: upgradedTier || upgradedYard
              ? `Садибу ${bEnt.name || 'Будівля'} покращено.`
              : `Зведено нову споруду: ${bEnt.name || 'Будівля'}.`,
            type: 'success',
          });
        } else if (bEnt.factionId && bEnt.factionId.startsWith('bot-')) {
          const reg = regions.find((r: RegionData) => r.id === bEnt.regionId);
          if (reg) {
            if (bEnt.buildingType === 'peasant_house') {
              const newPId = `unit-${bEnt.factionId}-immigrant-${Date.now() % 1000}`;
              world.add({
                id: newPId,
                name: `Селянин (${reg.lordName})`,
                title: 'Поселенець',
                characterClass: 'peasant',
                avatarColor: reg.heraldryColor,
                isCharacter: true,
                factionId: bEnt.factionId,
                regionId: reg.id,
                gridPosition: [bEnt.gridPosition ? bEnt.gridPosition[0] + 1 : 0, bEnt.gridPosition ? bEnt.gridPosition[1] + 1 : 0],
                position: [bEnt.gridPosition ? bEnt.gridPosition[0] + 1.5 : 0, 0.3, bEnt.gridPosition ? bEnt.gridPosition[1] + 1.5 : 0],
                moveSpeed: 1.35,
                gold: 4,
                needs: { hunger: 90, energy: 90, mood: 80, ale: 60, hygiene: 80 },
                skills: { farming: 5, woodcutting: 6, mining: 5, building: 6, cooking: 4, brewing: 3, combat: 3, intellect: 4, charisma: 4 },
                currentJob: { id: `idle-${newPId}`, type: 'idle', progress: 0, totalWork: 0 },
              });
            }
            let botPop = 0;
            for (const e of characterEntities) {
              if (e.isCharacter && e.regionId === reg.id) {
                botPop++;
              }
            }
            updateRegionStats(reg.id, {
              buildingsCount: reg.buildingsCount + 1,
              population: botPop,
              wealth: reg.wealth + 15,
            });
          }
        }

        unit.speechBubble = {
          text: 'Будівлю зведено!',
          expiresAtTick: currentTick + 25,
          type: 'work',
        };

        for (const other of characterEntities) {
          const otherEnt = other as GameEntity;
          if (otherEnt.id !== unit.id && otherEnt.currentJob?.targetBuildingId === bEnt.id) {
            otherEnt.currentJob = { id: `idle-${otherEnt.id}`, type: 'idle', progress: 0, totalWork: 0 };
          }
        }
        break;
      }
    }
  }

  public static completeDemolition(
    job: Job,
    unit: GameEntity,
    grid: GridMap,
    currentTick: number,
    isPlayerUnit: boolean
  ): void {
    const { addResource, addChronicleEvent, incrementBuildingVersion, incrementFoliageVersion } = useGameStore.getState();

    if (!job.targetBuildingId) return;

    let b: GameEntity | undefined;
    for (const be of buildingEntities) {
      if (be.id === job.targetBuildingId) {
        b = be;
        break;
      }
    }
    if (!b) return;

    const blueprint = b.buildingType ? BUILDING_BLUEPRINTS[b.buildingType] : null;
    const refundWood = blueprint?.cost?.wood || 0;
    const refundStone = blueprint?.cost?.stone || 0;
    const refundGold = blueprint?.cost?.gold || 0;
    const storedWood = b.localInventory?.wood || 0;

    if (isPlayerUnit) {
      if (refundWood + storedWood > 0) addResource('wood', refundWood + storedWood);
      if (refundStone > 0) addResource('stone', refundStone);
      if (refundGold > 0) addResource('gold', refundGold);
    }

    if (b.assignedWorkers && b.assignedWorkers.length > 0) {
      const workerSet = new Set(b.assignedWorkers);
      for (const w of characterEntities) {
        if (workerSet.has(w.id)) {
          w.workBuildingId = undefined;
          w.currentJob = { id: `idle-${w.id}`, type: 'idle', progress: 0, totalWork: 0 };
        }
      }
    }

    for (const other of characterEntities) {
      const otherEnt = other as GameEntity;
      if (otherEnt.currentJob?.targetBuildingId === b.id && otherEnt.id !== unit.id) {
        otherEnt.currentJob = { id: `idle-${otherEnt.id}`, type: 'idle', progress: 0, totalWork: 0 };
      }
    }

    if (b.gridPosition) {
      grid.clearBuilding(
        b.gridPosition[0],
        b.gridPosition[1],
        b.buildingWidth || 1,
        b.buildingHeight || 1
      );
    }

    world.remove(b);
    incrementBuildingVersion();
    incrementFoliageVersion();

    if (useGameStore.getState().selectedEntityId === b.id) {
      useGameStore.getState().setSelectedEntityId(null);
    }

    if (isPlayerUnit) {
      const refundsText = [
        refundWood + storedWood > 0 ? `+${refundWood + storedWood} деревини` : '',
        refundStone > 0 ? `+${refundStone} каменю` : '',
        refundGold > 0 ? `+${refundGold} золота` : '',
      ].filter(Boolean).join(', ');

      addChronicleEvent({
        title: 'Споруду розібрано!',
        description: `${b.name || 'Будівлю'} демонтовано. Повернуто: ${refundsText || 'ресурси'}.`,
        type: 'info',
      });
    }

    unit.speechBubble = {
      text: 'Споруду розібрано! Ресурси повернуто.',
      expiresAtTick: currentTick + 25,
      type: 'work',
    };
  }
}
