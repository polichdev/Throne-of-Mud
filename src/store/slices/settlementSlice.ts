import type { StateCreator } from 'zustand';
import type { ChronicleEvent, WorldSetupConfig } from '../../types/game';
import { GridMap } from '../../engine/grid/GridMap';
import { world, characterEntities, buildingEntities, type GameEntity } from '../../engine/ecs/world';
import { BUILDING_BLUEPRINTS } from '../../engine/buildings/blueprints';
import {
  INITIAL_RESOURCES,
  STARTING_INFLUENCE,
  STARTING_ROYAL_FAVOR,
  MIN_BUILDING_WAGE,
  MAX_BUILDING_WAGE,
} from '../../constants/economy';
import { DEFAULT_REGIONS } from '../../constants/world';
import { getTargetSnowAccumulation } from '../../constants/time';
import { INITIAL_RESOURCE_DEPOSITS } from '../../engine/resources/ResourceDeposits';
import {
  assignWorkerToBuilding as assignWorkerHelper,
  dismissWorkerFromBuilding as dismissWorkerHelper,
} from '../../engine/ecs/entityHelpers';
import { initializeWorldEntities } from '../../engine/world/worldInitializer';
import { BotAISystem } from '../../engine/ecs/systems/BotAISystem';
import { BanditAISystem } from '../../engine/ecs/systems/BanditAISystem';
import { DEFAULT_TRADE_RULES } from '../../engine/trade/tradeConfig';
import { clearBuildingFrameStates } from '../../components/canvas/BuildingsRenderer';
import { AStar } from '../../engine/pathfinding/AStar';
import { getFormationOffsets, isMilitiaDestinationAllowed } from '../../engine/combat/formationUtils';
import { audioManager } from '../../engine/audio/AudioManager';
import { HOUSE_TIERS_CONFIG, BACKYARD_EXTENSIONS_CONFIG, FOOD_RESOURCE_KEYS } from '../../constants/housing';
import type { MilitiaSquad, MilitiaUnitType, HouseTier, BackyardExtensionType, ResourceInventory } from '../../types/game';
import type { GameState, SettlementSlice } from '../types';

export type { SettlementSlice };

export const createSettlementSlice: StateCreator<GameState, [], [], SettlementSlice> = (set, get) => {
  let pendingBuildingVersion = false;
  let foliageDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  return {
  resources: { ...INITIAL_RESOURCES },

  addResource: (type, amount) => {
    set((state) => ({
      resources: {
        ...state.resources,
        [type]: Math.max(0, (state.resources[type] || 0) + amount),
      },
    }));
  },

  consumeResource: (type, amount) => {
    const current = get().resources[type] || 0;
    if (current >= amount) {
      set((state) => ({
        resources: {
          ...state.resources,
          [type]: current - amount,
        },
      }));

      const playerRegionId = get().playerRegionId ?? 0;
      let remainingToDeduct = amount;
      for (const b of buildingEntities) {
        if (
          b.isBuilding &&
          (b.factionId === 'player' || (!b.factionId && (b.regionId === undefined || b.regionId === playerRegionId))) &&
          b.localInventory &&
          (b.localInventory[type] || 0) > 0
        ) {
          const deduct = Math.min(remainingToDeduct, b.localInventory[type] || 0);
          b.localInventory[type] = (b.localInventory[type] || 0) - deduct;
          remainingToDeduct -= deduct;
          if (remainingToDeduct <= 0) break;
        }
      }

      return true;
    }
    return false;
  },

  settlementName: 'GOLDHOF',
  setSettlementName: (name) => set({ settlementName: name }),
  influence: STARTING_INFLUENCE,
  royalFavor: STARTING_ROYAL_FAVOR,

  pendingJobs: [],
  addPendingJob: (job) => {
    set((state) => {
      const exists = state.pendingJobs.some(
        (j) =>
          j.type === job.type &&
          j.targetPosition?.[0] === job.targetPosition?.[0] &&
          j.targetPosition?.[1] === job.targetPosition?.[1]
      );
      if (exists) return state;
      return { pendingJobs: [...state.pendingJobs, job] };
    });
  },

  removePendingJob: (jobId) => {
    set((state) => ({
      pendingJobs: state.pendingJobs.filter((j) => j.id !== jobId),
    }));
  },

  activeTreeHits: [],
  registerTreeHit: (x: number, z: number, intensity = 1.0) => {
    const now = performance.now() / 1000;
    set((state) => {
      const freshHits = state.activeTreeHits.filter((h) => now - h.hitTime < 2.5);
      return {
        activeTreeHits: [
          ...freshHits,
          { id: `${x.toFixed(2)}_${z.toFixed(2)}_${now.toFixed(3)}`, x, z, hitTime: now, intensity },
        ].slice(-8),
      };
    });
  },

  fallingTrees: [],
  registerTreeFall: (x: number, z: number, treeType = 'oak', fallAngle = Math.random() * Math.PI * 2) => {
    const now = performance.now() / 1000;
    set((state) => {
      const freshFalling = state.fallingTrees.filter((f) => now - f.startTime < 3.0);
      return {
        fallingTrees: [
          ...freshFalling,
          { id: `fall_${x}_${z}_${now}`, x, z, startTime: now, fallAngle, treeType },
        ],
      };
    });
  },

  assignWorkerToBuilding: (buildingId: string) => {
    const building = world.entities.find((e) => e.id === buildingId);
    if (!building || !building.isBuilding || !building.buildingType) return false;

    const { playerRegionId } = get();
    if (building.factionId && building.factionId !== 'player') return false;
    if (building.regionId !== undefined && building.regionId !== playerRegionId) return false;

    const blueprint = BUILDING_BLUEPRINTS[building.buildingType];
    const maxSlots = building.workerSlots ?? blueprint?.workSlots ?? 1;
    const currentWorkers = building.assignedWorkers || [];

    if (currentWorkers.length >= maxSlots) {
      return false;
    }

    const availablePeasant = Array.from(characterEntities).find(
      (c) =>
        c.characterClass === 'peasant' &&
        !c.workBuildingId &&
        !c.isLevy &&
        (c.factionId === 'player' || c.factionId === undefined) &&
        (c.regionId === playerRegionId || c.regionId === undefined)
    );

    if (!availablePeasant) {
      return false;
    }

    if (building.wage === undefined) {
      building.wage = blueprint?.defaultWage ?? 2;
    }

    assignWorkerHelper(building, availablePeasant, get().time.tick || 0);

    set((state) => ({ ...state }));
    return true;
  },

  removeWorkerFromBuilding: (buildingId: string, workerId: string) => {
    const building = world.entities.find((e) => e.id === buildingId);
    const worker = world.entities.find((e) => e.id === workerId);
    if (building && worker) {
      dismissWorkerHelper(building, worker, get().time.tick || 0);
    }
    set((state) => ({ ...state }));
  },

  assignLordToBuilding: (buildingId: string, lordId: string | null) => {
    const building = world.entities.find((e) => e.id === buildingId);
    if (!building) return;

    const { playerRegionId } = get();
    if (building.factionId && building.factionId !== 'player') return;
    if (building.regionId !== undefined && building.regionId !== playerRegionId) return;

    if (building.assignedLordId && building.assignedLordId !== lordId) {
      const oldLord = world.entities.find((e) => e.id === building.assignedLordId);
      if (oldLord) {
        oldLord.currentJob = { id: `idle-${oldLord.id}`, type: 'idle', progress: 0, totalWork: 0 };
      }
    }

    building.assignedLordId = lordId || undefined;

    if (lordId) {
      const lord = world.entities.find((e) => e.id === lordId);
      if (lord) {
        if (building.gridPosition) {
          lord.currentJob = {
            id: `supervise-${lord.id}`,
            type: 'work_at_building',
            targetBuildingId: buildingId,
            targetPosition: building.gridPosition,
            progress: 0,
            totalWork: 100,
          };
        }
        lord.speechBubble = {
          text: `Наглядаю за виробництвом: ${building.name}`,
          expiresAtTick: (get().time.tick || 0) + 35,
          type: 'work',
        };
      }
    }

    set((state) => ({ ...state }));
  },

  setBuildingWage: (buildingId: string, wage: number) => {
    const building = world.entities.find((e) => e.id === buildingId);
    if (building) {
      building.wage = Math.max(MIN_BUILDING_WAGE, Math.min(MAX_BUILDING_WAGE, wage));
      set((state) => ({ ...state }));
    }
  },

  callLevyMilitia: (lordId: string) => {
    const lord = world.entities.find((e) => e.id === lordId);
    if (!lord) return;

    const existingMilitia = Array.from(characterEntities).filter(
      (c) => c.isLevy && c.commandingLordId === lordId
    );

    const tick = get().time.tick || 0;

    if (existingMilitia.length > 0) {
      for (const levy of existingMilitia) {
        levy.isLevy = false;
        levy.commandingLordId = undefined;
        levy.speechBubble = {
          text: 'Ополчення розпущено, повертаюсь до мирного життя',
          expiresAtTick: tick + 30,
          type: 'work',
        };
      }
      lord.speechBubble = {
        text: 'Ополчення розпущено.',
        expiresAtTick: tick + 25,
        type: 'alert',
      };
      get().addChronicleEvent({
        title: 'Ополчення розпущено',
        description: `${lord.name} розпустив селянське ополчення.`,
        type: 'info',
      });
    } else {
      const freePeasants = Array.from(characterEntities)
        .filter((c) => c.characterClass === 'peasant' && !c.isLevy)
        .slice(0, 3);

      if (freePeasants.length === 0) {
        lord.speechBubble = {
          text: 'Немає вільних селян для ополчення!',
          expiresAtTick: tick + 25,
          type: 'alert',
        };
        return;
      }

      for (const peasant of freePeasants) {
        peasant.isLevy = true;
        peasant.commandingLordId = lordId;
        peasant.speechBubble = {
          text: 'Стаю під стяги мого Лорда!',
          expiresAtTick: tick + 35,
          type: 'alert',
        };
        if (!peasant.thoughts) peasant.thoughts = [];
        peasant.thoughts = peasant.thoughts.filter((t) => t.id !== 'levy');
        peasant.thoughts.push({
          id: 'levy',
          text: 'Скликаний до ополчення (-5)',
          modifier: -5,
          durationTicks: 1500,
        });
      }

      lord.speechBubble = {
        text: 'До зброї, селяни! Захистимо наш трон!',
        expiresAtTick: tick + 40,
        type: 'alert',
      };

      get().addChronicleEvent({
        title: 'Скликано ополчення!',
        description: `${lord.name} зібрав загін із ${freePeasants.length} селян-ополченців.`,
        type: 'warning',
      });
    }

    set((state) => ({ ...state }));
  },

  lordPreach: (lordId: string) => {
    const lord = world.entities.find((e) => e.id === lordId);
    if (!lord) return;

    const tick = get().time.tick || 0;
    lord.speechBubble = {
      text: 'Покора Лорду — благословення Небес!',
      expiresAtTick: tick + 35,
      type: 'mood',
    };

    let blessedCount = 0;
    for (const peasant of characterEntities) {
      if (peasant.characterClass === 'peasant' && peasant.needs) {
        blessedCount++;
        peasant.needs.mood = Math.min(100, peasant.needs.mood + 15);
        if (!peasant.thoughts) peasant.thoughts = [];
        peasant.thoughts = peasant.thoughts.filter((t) => t.id !== 'preach');
        peasant.thoughts.push({
          id: 'preach',
          text: 'Натхненний проповіддю Лорда (+15)',
          modifier: 15,
          durationTicks: 1200,
        });
        peasant.speechBubble = {
          text: 'Слава Господу і нашому королю!',
          expiresAtTick: tick + 30,
          type: 'mood',
        };
      }
    }

    set((state) => ({ ...state }));
  },

  upgradeHouseTier: (buildingId: string) => {
    const state = get();
    const building = world.entities.find((e) => e.id === buildingId);
    if (!building || !building.isCompleted || building.pendingHouseTier || building.pendingBackyardExtension || (building.buildingType !== 'peasant_house' && building.buildingType !== 'manor')) {
      audioManager.playUIError();
      return false;
    }

    const currentTier = (building.houseTier || 1) as HouseTier;
    if (currentTier >= 3) {
      audioManager.playUIError();
      return false;
    }

    const nextTier = (currentTier + 1) as HouseTier;
    const tierConfig = HOUSE_TIERS_CONFIG[nextTier];
    if (!tierConfig) {
      audioManager.playUIError();
      return false;
    }

    for (const [res, amount] of Object.entries(tierConfig.upgradeCost)) {
      if ((state.resources[res as keyof ResourceInventory] || 0) < (amount || 0)) {
        audioManager.playUIError();
        return false;
      }
    }

    let availableFoodTypesCount = 0;
    for (const foodKey of FOOD_RESOURCE_KEYS) {
      if ((state.resources[foodKey] || 0) > 0) {
        availableFoodTypesCount++;
      }
    }

    if (availableFoodTypesCount < tierConfig.upgradeMinFoodTypes) {
      audioManager.playUIError();
      return false;
    }

    for (const reqGood of tierConfig.upgradeRequiredGoods) {
      if ((state.resources[reqGood] || 0) <= 0) {
        audioManager.playUIError();
        return false;
      }
    }

    state.consumeResource('gold', tierConfig.upgradeCost.gold || 0);
    building.pendingHouseTier = nextTier;
    building.requiredMaterials = { ...tierConfig.upgradeCost };
    delete building.requiredMaterials.gold;
    building.deliveredMaterials = {};
    building.constructionProgress = 0;
    building.isCompleted = false;
    state.addPendingJob({
      id: `job-upgrade-house-${buildingId}-${Date.now()}`,
      type: 'build_structure',
      targetPosition: building.gridPosition || [0, 0],
      targetBuildingId: buildingId,
      progress: 0,
      totalWork: 80 + nextTier * 35,
    });

    state.incrementBuildingVersion();
    audioManager.playUISuccess();

    state.addChronicleEvent({
      type: 'success',
      title: `${tierConfig.nameUk}`,
      description: `Розпочато покращення садиби до ${tierConfig.nameUk}. Доставте матеріали та завершіть роботу будівельників.`,
    });

    set((s) => ({ ...s }));
    return true;
  },

  setBackyardExtension: (buildingId: string, extension: BackyardExtensionType) => {
    const state = get();
    const building = world.entities.find((e) => e.id === buildingId);
    if (!building || !building.isCompleted || building.pendingHouseTier || building.pendingBackyardExtension || (building.buildingType !== 'peasant_house' && building.buildingType !== 'manor')) {
      audioManager.playUIError();
      return false;
    }

    const tier = (building.houseTier || 1) as HouseTier;
    const extConfig = BACKYARD_EXTENSIONS_CONFIG[extension];
    if (!extConfig) {
      audioManager.playUIError();
      return false;
    }

    if (tier < extConfig.requiredTier) {
      audioManager.playUIError();
      return false;
    }

    for (const [res, amount] of Object.entries(extConfig.cost)) {
      if ((state.resources[res as keyof ResourceInventory] || 0) < (amount || 0)) {
        audioManager.playUIError();
        return false;
      }
    }

    state.consumeResource('gold', extConfig.cost.gold || 0);
    building.pendingBackyardExtension = extension;
    building.requiredMaterials = { ...extConfig.cost };
    delete building.requiredMaterials.gold;
    building.deliveredMaterials = {};
    building.constructionProgress = 0;
    building.isCompleted = false;
    state.addPendingJob({
      id: `job-upgrade-yard-${buildingId}-${Date.now()}`,
      type: 'build_structure',
      targetPosition: building.gridPosition || [0, 0],
      targetBuildingId: buildingId,
      progress: 0,
      totalWork: 55 + (extConfig.requiredTier - 1) * 25,
    });

    state.incrementBuildingVersion();
    audioManager.playUIClick();

    if (extension !== 'none') {
      state.addChronicleEvent({
        type: 'info',
        title: `Присадибне господарство: ${extConfig.nameUk}`,
        description: `Розпочато облаштування: ${extConfig.nameUk}. Доставте матеріали та завершіть роботу будівельників.`,
      });
    }

    set((s) => ({ ...s }));
    return true;
  },

  militiaSquads: [],
  selectedMilitiaSquadId: null,
  setSelectedMilitiaSquadId: (squadId: string | null) => {
    set({ selectedMilitiaSquadId: squadId });
  },

  createMilitiaSquad: (type: MilitiaUnitType, grid: GridMap) => {
    const state = get();
    const currentTick = state.time.tick || 0;
    const playerRegionId = state.playerRegionId ?? 0;

    const eligiblePeasants = Array.from(characterEntities).filter(
      (c) =>
        c.isCharacter &&
        c.characterClass === 'peasant' &&
        (!c.factionId || c.factionId === 'player') &&
        !c.isLevy
    );

    if (eligiblePeasants.length === 0) {
      return null;
    }

    eligiblePeasants.sort((a, b) => {
      const aIdle = !a.workBuildingId ? 0 : 1;
      const bIdle = !b.workBuildingId ? 0 : 1;
      return aIdle - bIdle;
    });

    let draftCount = Math.min(5, eligiblePeasants.length);

    if (type === 'swordsmen') {
      const availableWeapons = state.resources.weapons || 0;
      if (availableWeapons < 1) {
        return null;
      }
      draftCount = Math.min(draftCount, availableWeapons);
      get().consumeResource('weapons', draftCount);
    }

    const drafted = eligiblePeasants.slice(0, draftCount);
    if (drafted.length === 0) return null;

    const squadNum = state.militiaSquads.length + 1;
    const squadId = `squad-${Date.now()}-${squadNum}`;

    const region = state.regions.find((r) => r.id === playerRegionId) || state.regions[0];
    const campPos = region?.campPosition || state.playerSpawnPoint || [64, 60];

    const squadIndexOffset = state.militiaSquads.length * 4.5;
    let rallyBaseX = Math.round(campPos[0] + 5 + squadIndexOffset);
    let rallyBaseZ = Math.round(campPos[1] + 3);

    if (!grid.isWalkable(rallyBaseX, rallyBaseZ)) {
      const neighbors = grid.getNeighbors(rallyBaseX, rallyBaseZ).filter((n) => grid.isWalkable(n.x, n.z));
      if (neighbors.length > 0) {
        rallyBaseX = neighbors[0].x;
        rallyBaseZ = neighbors[0].z;
      }
    }

    const rallyPoint: [number, number] = [rallyBaseX, rallyBaseZ];
    const offsets = getFormationOffsets(drafted.length, 0);

    drafted.forEach((peasant, idx) => {
      const off = offsets[idx] || [0, 0];
      const targetX = Math.max(1, Math.min(grid.width - 2, Math.round(rallyPoint[0] + off[0])));
      const targetZ = Math.max(1, Math.min(grid.height - 2, Math.round(rallyPoint[1] + off[1])));

      peasant.isLevy = true;
      peasant.militiaSquadId = squadId;
      peasant.militiaWeapon = type === 'swordsmen' ? 'sword' : 'spear';
      peasant.formationIndex = idx;

      const px = peasant.gridPosition ? peasant.gridPosition[0] : Math.floor(peasant.position ? peasant.position[0] : targetX);
      const pz = peasant.gridPosition ? peasant.gridPosition[1] : Math.floor(peasant.position ? peasant.position[2] : targetZ);
      const path = AStar.findPath(grid, [px, pz], [targetX, targetZ], true);

      peasant.path = path && path.length > 0 ? path : [[targetX, targetZ]];
      peasant.targetPosition = [targetX, targetZ];
      peasant.currentJob = {
        id: `militia-rally-${peasant.id}`,
        type: 'patrol',
        targetPosition: [targetX, targetZ],
        targetAngle: 0,
        progress: 0,
        totalWork: 0,
      };

      peasant.speechBubble = {
        text: type === 'swordsmen' ? 'Беру меч та щит за наш трон!' : 'Беру спис, стаю до строю!',
        expiresAtTick: currentTick + 45,
        type: 'alert',
      };
    });

    const isUkr = (get() as any).language === 'uk';
    const squadName =
      type === 'swordsmen'
        ? (isUkr ? `Ополченці-мечники ${squadNum}` : `Swordsmen Militia ${squadNum}`)
        : (isUkr ? `Селянські списники ${squadNum}` : `Peasant Spearmen ${squadNum}`);

    const newSquad: MilitiaSquad = {
      id: squadId,
      name: squadName,
      type,
      memberIds: drafted.map((p) => p.id),
      maxMembers: 5,
      rallyPoint,
      facingAngle: 0,
      createdAt: Date.now(),
    };

    set((s) => ({
      militiaSquads: [...s.militiaSquads, newSquad],
      selectedMilitiaSquadId: squadId,
    }));

    get().addChronicleEvent({
      title: isUkr ? 'Скликано ополчення!' : 'Militia Formed!',
      description: isUkr
        ? `Сформовано загін "${squadName}" (${drafted.length} бійців). Вони стають у 2 шеренги неподалік від табору.`
        : `Formed squad "${squadName}" (${drafted.length} soldiers) assembled in 2 ranks near camp.`,
      type: 'warning',
    });

    audioManager.playUISuccess();
    return newSquad;
  },

  syncMilitiaSquadsFromWorld: () => {
    const state = get();
    const currentSquads = [...state.militiaSquads];
    const squadMap = new Map<string, MilitiaSquad>();
    for (const sq of currentSquads) {
      squadMap.set(sq.id, { ...sq, memberIds: [...sq.memberIds] });
    }

    const levies = Array.from(characterEntities).filter(
      (c) => c.isCharacter && c.isLevy && (!c.factionId || c.factionId === 'player')
    );

    if (levies.length === 0) {
      if (currentSquads.length > 0) {
        set({ militiaSquads: [], selectedMilitiaSquadId: null });
      }
      return;
    }

    const groups = new Map<string, GameEntity[]>();
    for (const levy of levies) {
      const sqId = levy.militiaSquadId || 'squad-recovered-1';
      levy.militiaSquadId = sqId;
      if (!levy.militiaWeapon) {
        levy.militiaWeapon = 'spear';
      }
      const list = groups.get(sqId) || [];
      list.push(levy);
      groups.set(sqId, list);
    }

    const isUkr = (get() as any).language === 'uk';
    let idx = 1;

    for (const [sqId, members] of groups.entries()) {
      let existing = squadMap.get(sqId);
      if (!existing) {
        let sumX = 0;
        let sumZ = 0;
        for (const m of members) {
          const mx = m.gridPosition ? m.gridPosition[0] : (m.position ? m.position[0] : 52);
          const mz = m.gridPosition ? m.gridPosition[1] : (m.position ? m.position[2] : 52);
          sumX += mx;
          sumZ += mz;
        }
        const rallyPoint: [number, number] = [Math.round(sumX / members.length), Math.round(sumZ / members.length)];
        const isSwords = members.some((m) => m.militiaWeapon === 'sword');
        const squadType: MilitiaUnitType = isSwords ? 'swordsmen' : 'spearmen';
        const name = isSwords
          ? (isUkr ? `Ополченці-мечники ${idx}` : `Swordsmen Militia ${idx}`)
          : (isUkr ? `Селянські списники ${idx}` : `Peasant Spearmen ${idx}`);

        existing = {
          id: sqId,
          name,
          type: squadType,
          memberIds: members.map((m) => m.id),
          maxMembers: 5,
          rallyPoint,
          facingAngle: 0,
          createdAt: Date.now(),
        };
        squadMap.set(sqId, existing);
      } else {
        existing.memberIds = members.map((m) => m.id);
      }
      idx++;
    }

    const updatedSquads = Array.from(squadMap.values());
    const nextSelected = state.selectedMilitiaSquadId && updatedSquads.some((s) => s.id === state.selectedMilitiaSquadId)
      ? state.selectedMilitiaSquadId
      : null;

    set({
      militiaSquads: updatedSquads,
      selectedMilitiaSquadId: nextSelected,
    });
  },

  disbandMilitiaSquad: (squadId: string) => {
    const state = get();
    const currentTick = state.time.tick || 0;
    const squad = state.militiaSquads.find((sq) => sq.id === squadId);

    let livingCount = 0;
    let hadSwords = squad ? squad.type === 'swordsmen' : false;

    for (const peasant of characterEntities) {
      if (!peasant.isCharacter || !peasant.isLevy) continue;
      const belongs = peasant.militiaSquadId === squadId || (squad && squad.memberIds.includes(peasant.id)) || squadId === 'all';
      if (belongs) {
        livingCount++;
        if (peasant.militiaWeapon === 'sword') hadSwords = true;
        peasant.isLevy = false;
        peasant.militiaSquadId = undefined;
        peasant.militiaWeapon = undefined;
        peasant.formationIndex = undefined;
        peasant.currentJob = {
          id: `idle-${peasant.id}`,
          type: 'idle',
          progress: 0,
          totalWork: 0,
        };
        peasant.speechBubble = {
          text: (get() as any).language === 'uk' ? 'Ополчення розпущено, повертаюсь до роботи' : 'Militia dismissed, returning to work',
          expiresAtTick: currentTick + 35,
          type: 'work',
        };
      }
    }

    if (hadSwords && livingCount > 0) {
      get().addResource('weapons', livingCount);
    }

    set((s) => {
      const remaining = s.militiaSquads.filter((sq) => sq.id !== squadId && squadId !== 'all');
      return {
        militiaSquads: remaining,
        selectedMilitiaSquadId: null,
      };
    });

    const isUkr = (get() as any).language === 'uk';
    const squadName = squad ? squad.name : (isUkr ? 'Ополчення' : 'Militia');
    get().addChronicleEvent({
      title: isUkr ? 'Ополчення розпущено' : 'Militia Disbanded',
      description: isUkr
        ? `Загін "${squadName}" розпущено (${livingCount} бійців). Селяни повертаються до мирної праці у селі.`
        : `Squad "${squadName}" disbanded (${livingCount} soldiers). Peasants return to civilian life.`,
      type: 'info',
    });

    audioManager.playUIClick();
  },

  rallyMilitiaSquad: (squadId: string, grid: GridMap) => {
    let state = get();
    let squad = state.militiaSquads.find((sq) => sq.id === squadId);
    if (!squad) {
      get().syncMilitiaSquadsFromWorld();
      state = get();
      squad = state.militiaSquads.find((sq) => sq.id === squadId) || state.militiaSquads[0];
    }
    if (!squad) return;

    const livingMembers = Array.from(characterEntities).filter(
      (c) => c.isCharacter && c.isLevy && (c.militiaSquadId === squad!.id || squad!.memberIds.includes(c.id))
    );
    if (livingMembers.length === 0) return;

    const offsets = getFormationOffsets(livingMembers.length, squad.facingAngle);
    livingMembers.forEach((peasant, idx) => {
      const off = offsets[idx] || [0, 0];
      let targetX = Math.max(1, Math.min(grid.width - 2, Math.round(squad!.rallyPoint[0] + off[0])));
      let targetZ = Math.max(1, Math.min(grid.height - 2, Math.round(squad!.rallyPoint[1] + off[1])));

      if (!grid.isWalkable(targetX, targetZ)) {
        const neighbors = grid.getNeighbors(targetX, targetZ).filter((n) => grid.isWalkable(n.x, n.z));
        if (neighbors.length > 0) {
          targetX = neighbors[0].x;
          targetZ = neighbors[0].z;
        } else if (grid.isWalkable(squad!.rallyPoint[0], squad!.rallyPoint[1])) {
          targetX = squad!.rallyPoint[0];
          targetZ = squad!.rallyPoint[1];
        }
      }

      const px = peasant.gridPosition ? peasant.gridPosition[0] : Math.floor(peasant.position ? peasant.position[0] : targetX);
      const pz = peasant.gridPosition ? peasant.gridPosition[1] : Math.floor(peasant.position ? peasant.position[2] : targetZ);
      const path = AStar.findPath(grid, [px, pz], [targetX, targetZ], true);

      peasant.path = path && path.length > 0 ? path : [[targetX, targetZ]];
      peasant.targetPosition = [targetX, targetZ];
      peasant.currentJob = {
        id: `militia-rally-${peasant.id}`,
        type: 'patrol',
        targetPosition: [targetX, targetZ],
        targetAngle: squad!.facingAngle,
        progress: 0,
        totalWork: 0,
      };
    });

    squad.activeMarch = null;
    set((s) => ({
      militiaSquads: s.militiaSquads.map((sq) =>
        sq.id === squadId ? { ...sq, activeMarch: null } : sq
      ),
    }));

    audioManager.playUIClick();
  },

  moveMilitiaSquad: (squadId: string, targetPos: [number, number], grid: GridMap) => {
    let state = get();
    const currentTick = state.time.tick || 0;
    const playerRegionId = state.playerRegionId ?? 0;
    const pRegion = state.regions.find((r) => r.id === playerRegionId);

    if (!isMilitiaDestinationAllowed(grid, targetPos[0], targetPos[1], pRegion?.bounds)) {
      return;
    }

    let squad = state.militiaSquads.find((sq) => sq.id === squadId);
    if (!squad) {
      get().syncMilitiaSquadsFromWorld();
      state = get();
      squad = state.militiaSquads.find((sq) => sq.id === squadId) || state.militiaSquads[0];
    }

    const livingMembers = Array.from(characterEntities).filter(
      (c) => c.isCharacter && c.isLevy && (!squad || c.militiaSquadId === squad.id || squad.memberIds.includes(c.id))
    );

    if (livingMembers.length === 0) return;

    let sumX = 0;
    let sumZ = 0;
    livingMembers.forEach((p) => {
      const px = p.gridPosition ? p.gridPosition[0] : (p.position ? p.position[0] : targetPos[0]);
      const pz = p.gridPosition ? p.gridPosition[1] : (p.position ? p.position[2] : targetPos[1]);
      sumX += px;
      sumZ += pz;
    });
    const curCenterX = sumX / livingMembers.length;
    const curCenterZ = sumZ / livingMembers.length;

    const startPos: [number, number] = [Math.round(curCenterX), Math.round(curCenterZ)];
    const masterPath = AStar.findPath(grid, startPos, targetPos, true) || [[targetPos[0], targetPos[1]]];

    let facingAngle = Math.atan2(targetPos[0] - curCenterX, targetPos[1] - curCenterZ);
    if (isNaN(facingAngle)) facingAngle = 0;

    const finalOffsets = getFormationOffsets(livingMembers.length, facingAngle);

    livingMembers.forEach((peasant, idx) => {
      const finalOff = finalOffsets[idx] || [0, 0];
      let finalTargetX = Math.round(targetPos[0] + finalOff[0]);
      let finalTargetZ = Math.round(targetPos[1] + finalOff[1]);

      if (!grid.isWalkable(finalTargetX, finalTargetZ)) {
        let bestX = targetPos[0];
        let bestZ = targetPos[1];
        let bestDistSq = Infinity;
        for (let r = 1; r <= 3; r++) {
          for (let odx = -r; odx <= r; odx++) {
            for (let odz = -r; odz <= r; odz++) {
              const nx = finalTargetX + odx;
              const nz = finalTargetZ + odz;
              if (nx >= 1 && nx < grid.width - 1 && nz >= 1 && nz < grid.height - 1 && grid.isWalkable(nx, nz)) {
                const dSq = (nx - finalTargetX) ** 2 + (nz - finalTargetZ) ** 2;
                if (dSq < bestDistSq) {
                  bestDistSq = dSq;
                  bestX = nx;
                  bestZ = nz;
                }
              }
            }
          }
          if (bestDistSq < Infinity) break;
        }
        finalTargetX = bestX;
        finalTargetZ = bestZ;
      }

      const curX = peasant.gridPosition
        ? peasant.gridPosition[0]
        : Math.round(peasant.position ? peasant.position[0] : finalTargetX);
      const curZ = peasant.gridPosition
        ? peasant.gridPosition[1]
        : Math.round(peasant.position ? peasant.position[2] : finalTargetZ);

      let soldierPath = AStar.findPath(grid, [curX, curZ], [finalTargetX, finalTargetZ], true);

      if (!soldierPath || soldierPath.length === 0) {
        soldierPath = [[finalTargetX, finalTargetZ]];
      } else if (soldierPath.length > 1 && soldierPath[0][0] === curX && soldierPath[0][1] === curZ) {
        soldierPath.shift();
      }

      peasant.path = soldierPath;
      peasant.targetPosition = [finalTargetX, finalTargetZ];
      peasant.currentJob = {
        id: `militia-move-${peasant.id}-${Date.now()}`,
        type: 'patrol',
        targetPosition: [finalTargetX, finalTargetZ],
        targetAngle: facingAngle,
        progress: 0,
        totalWork: 0,
      };

      if (idx === 0) {
        const isUkr = (get() as any).language === 'uk';
        const phrases = isUkr
          ? ['Шикуйсь! Кроком руш!', 'Рушаймо у похід!', 'Так, пане!', 'Тримати стрій!']
          : ['Advance in formation!', 'Marching forth!', 'Hold the line!', 'Yes, my Lord!'];
        const text = phrases[Math.floor(Math.random() * phrases.length)];
        peasant.speechBubble = {
          text,
          expiresAtTick: currentTick + 35,
          type: 'alert',
        };
      }
    });

    const activeMarch = {
      targetPos,
      facingAngle,
      path: masterPath,
    };

    if (squad) {
      squad.rallyPoint = targetPos;
      squad.facingAngle = facingAngle;
      squad.activeMarch = activeMarch;
      set((s) => ({
        militiaSquads: s.militiaSquads.map((sq) =>
          sq.id === squad!.id ? { ...sq, rallyPoint: targetPos, facingAngle, activeMarch } : sq
        ),
        selectedMilitiaSquadId: null,
      }));
    } else {
      get().syncMilitiaSquadsFromWorld();
      set({ selectedMilitiaSquadId: null });
    }

    audioManager.playUIClick();
  },

  clearMilitiaSquadMarch: (squadId: string) => {
    const squad = get().militiaSquads.find((sq) => sq.id === squadId);
    if (squad) {
      squad.activeMarch = null;
    }
    set((s) => ({
      militiaSquads: s.militiaSquads.map((sq) =>
        sq.id === squadId ? { ...sq, activeMarch: null } : sq
      ),
    }));
  },

  chronicle: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      gameDay: 1,
      gameHour: 7,
      title: 'Заснування Трону з Грязі',
      description: 'Король Болеслав прибув на болотисті землі разом зі шляхтою та першими поселенцями.',
      type: 'info',
    },
    {
      id: 'init-letter-hildegard',
      timestamp: new Date().toLocaleTimeString(),
      gameDay: 1,
      gameHour: 8,
      title: 'Лист від: Леді Хільдеґард',
      description: 'Отримано дипломатичне послання: Грамота про добросусідство та визнання кордонів.',
      type: 'social',
    },
    {
      id: 'init-letter-wilhelm',
      timestamp: new Date().toLocaleTimeString(),
      gameDay: 1,
      gameHour: 9,
      title: 'Лист від: Герцог Вільгельм',
      description: 'Отримано дипломатичне послання: Про гірські перевали та безпеку купецьких валок.',
      type: 'social',
    },
  ],

  addChronicleEvent: (event) => {
    const { time } = get();
    const currentDay = time.day;
    const newEvent: ChronicleEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
      gameDay: currentDay,
      gameHour: time.hour,
    };
    set((state) => {
      let filtered = (state.chronicle || []).filter((e) => e.gameDay >= currentDay - 1);
      const yesterdayEvents = filtered.filter((e) => e.gameDay < currentDay);
      if (yesterdayEvents.length > 0) {
        let oldestYesterdayIdx = -1;
        let oldestScore = Infinity;
        for (let i = 0; i < filtered.length; i++) {
          const item = filtered[i];
          if (item.gameDay < currentDay) {
            const score = item.gameDay * 100 + (item.gameHour ?? 0);
            if (score < oldestScore) {
              oldestScore = score;
              oldestYesterdayIdx = i;
            }
          }
        }
        if (oldestYesterdayIdx !== -1) {
          filtered = filtered.filter((_, idx) => idx !== oldestYesterdayIdx);
        }
      }
      return {
        chronicle: [newEvent, ...filtered].slice(0, 50),
      };
    });
  },

  buildingVersion: 0,
  incrementBuildingVersion: () => {
    if (!pendingBuildingVersion) {
      pendingBuildingVersion = true;
      queueMicrotask(() => {
        pendingBuildingVersion = false;
        set((state) => ({ buildingVersion: state.buildingVersion + 1 }));
      });
    }
  },

  foliageVersion: 0,
  incrementFoliageVersion: (immediate?: boolean) => {
    if (immediate) {
      if (foliageDebounceTimer) {
        clearTimeout(foliageDebounceTimer);
        foliageDebounceTimer = null;
      }
      set((state) => ({ foliageVersion: state.foliageVersion + 1 }));
      return;
    }
    if (foliageDebounceTimer) {
      clearTimeout(foliageDebounceTimer);
    }
    foliageDebounceTimer = setTimeout(() => {
      foliageDebounceTimer = null;
      set((state) => ({ foliageVersion: state.foliageVersion + 1 }));
    }, 150);
  },

  terrainVersion: 0,
  incrementTerrainVersion: () => {
    set((state) => ({ terrainVersion: state.terrainVersion + 1 }));
  },

  regions: JSON.parse(JSON.stringify(DEFAULT_REGIONS)),
  playerRegionId: 0,
  playerSpawnPoint: [52, 52],
  botCount: 3,
  updateRegionStats: (regionId, partial) => {
    set((state) => {
      const target = state.regions.find((r) => r.id === regionId);
      if (!target) return state;
      let changed = false;
      for (const [k, v] of Object.entries(partial)) {
        if ((target as any)[k] !== v) {
          changed = true;
          break;
        }
      }
      if (!changed) return state;
      return {
        regions: state.regions.map((r) => (r.id === regionId ? { ...r, ...partial } : r)),
      };
    });
  },

  immigrationProgress: 0,
  setImmigrationProgress: (val) => set({ immigrationProgress: Math.max(0, Math.min(100, val)) }),

  tradeRules: { ...DEFAULT_TRADE_RULES },
  setTradeRule: (resource, partial) => {
    set((state) => ({
      tradeRules: {
        ...state.tradeRules,
        [resource]: {
          ...(state.tradeRules[resource] || { resource, mode: 'none', targetStock: 30 }),
          ...partial,
        },
      },
    }));
  },

  caravanStatus: {
    state: 'waiting',
    merchantName: 'Альбрехт з Аугсбурга',
    nextArrivalHour: 11,
    nextArrivalMinute: 30,
  },
  setCaravanStatus: (status) => {
    set((state) => ({
      caravanStatus: {
        ...state.caravanStatus,
        ...status,
      },
    }));
  },

  resourceDeposits: INITIAL_RESOURCE_DEPOSITS,
  updateResourceDeposit: (depositId, partial) => {
    set((state) => ({
      resourceDeposits: state.resourceDeposits.map((d) =>
        d.id === depositId ? { ...d, ...partial } : d
      ),
    }));
    const entity = world.entities.find((e) => e.id === depositId);
    if (entity) {
      if (partial.currentAmount !== undefined) entity.resourceAmount = partial.currentAmount;
      if (partial.maxAmount !== undefined) entity.maxResourceAmount = partial.maxAmount;
    }
  },

  isInitialized: false,
  initWorld: (grid: GridMap, config?: WorldSetupConfig) => {
    BotAISystem.reset();
    BanditAISystem.reset();
    clearBuildingFrameStates();
    const result = initializeWorldEntities(grid, config, get().playerRegionId, get().botCount);

    set({
      isInitialized: true,
      selectedEntityId: null,
      playerRegionId: result.playerRegionId,
      playerSpawnPoint: result.playerSpawnPoint,
      botCount: result.botCount,
      regions: result.regions,
      settlementName: result.settlementName,
      cameraFocusTarget: result.cameraFocusTarget,
      isStrategicMapOpen: false,
      resourceDeposits: result.resourceDeposits,
    });
    get().incrementBuildingVersion();
    get().incrementTerrainVersion();
    get().incrementFoliageVersion(true);
  },

  resetWorld: (grid: GridMap, config?: WorldSetupConfig) => {
    BotAISystem.reset();
    BanditAISystem.reset();
    clearBuildingFrameStates();
    grid.clearAllRoads();
    grid.generate(Date.now() % 100000 + Math.random() * 500);
    grid.isFullTerrainDirty = true;
    grid.dirtyTerrainCoords = [];

    set({
      resources: { ...INITIAL_RESOURCES },
      time: {
        tick: 0,
        day: 1,
        dayOfMonth: 1,
        month: 'March',
        monthIndex: 0,
        monthInSeason: 0,
        year: 1,
        hour: 7,
        minute: 0,
        season: 'Spring',
        weather: 'clear',
        targetWeather: 'clear',
        nextWeather: 'clear',
        isWeatherLocked: false,
        rainIntensity: 0,
        stormIntensity: 0,
        snowIntensity: 0,
        snowAccumulation: getTargetSnowAccumulation('Spring', 1, 7, 0),
        lightningFlash: 0,
        speedMultiplier: 1,
        isPaused: false,
      },
      influence: STARTING_INFLUENCE,
      royalFavor: STARTING_ROYAL_FAVOR,
      pendingJobs: [],
      activeTool: 'select',
      activeBuildType: null,
      activeMenuTab: null,
      chronicle: [
        {
          id: 'init-1',
          timestamp: new Date().toLocaleTimeString(),
          gameDay: 1,
          gameHour: 7,
          title: 'Заснування Трону з Грязі',
          description: 'Король Болеслав прибув на болотисті землі разом зі шляхтою та першими поселенцями.',
          type: 'info',
        },
      ],
      immigrationProgress: 0,
      isLordsBarOpen: false,
      isInitialized: true,
      isStrategicMapOpen: false,
      militiaSquads: [],
      selectedMilitiaSquadId: null,
    });

    get().initWorld(grid, config);
    get().incrementBuildingVersion();
    get().incrementTerrainVersion();
    get().incrementFoliageVersion(true);
  },
  };
};
