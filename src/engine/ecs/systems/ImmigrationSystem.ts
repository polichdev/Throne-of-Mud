import { IMMIGRANTS } from '../../../constants/systems';
import { world, characterEntities, buildingEntities } from '../world';
import { GridMap } from '../../grid/GridMap';
import { AStar } from '../../pathfinding/AStar';
import { useGameStore } from '../../../store/useGameStore';
import {
  IMMIGRATION_TICK_INTERVAL,
  DEFAULT_APPROVAL_RATING,
  MIN_APPROVAL_FOR_IMMIGRATION,
  HIGH_APPROVAL_THRESHOLD,
  EXCELLENT_APPROVAL_THRESHOLD,
  BASE_IMMIGRATION_PROGRESS_DELTA,
  HIGH_APPROVAL_PROGRESS_DELTA,
  EXCELLENT_APPROVAL_PROGRESS_DELTA,
  IMMIGRATION_DECAY_DELTA,
  MAX_IMMIGRATION_PROGRESS,
  FEMALE_SPAWN_CHANCE,
  DEFAULT_PEASANT_MOVE_SPEED,
  IMMIGRANT_STARTING_HUNGER,
  IMMIGRANT_STARTING_ENERGY,
  IMMIGRANT_STARTING_MOOD,
  IMMIGRANT_STARTING_ALE,
  IMMIGRANT_STARTING_HYGIENE,
  IMMIGRANT_THOUGHT_MODIFIER,
  IMMIGRANT_THOUGHT_DURATION_TICKS,
} from '../../../constants/immigration';
import { DEFAULT_SPEECH_BUBBLE_TICKS } from '../../../constants/economy';
import { HOUSE_TIERS_CONFIG, TENT_BED_CAPACITY } from '../../../constants/housing';
import { translations } from '../../../i18n';

function getVillagerNamePool(lang: 'uk' | 'en', isFemale: boolean): string[] {
  const dict = translations[lang]?.villagers || translations.uk.villagers;
  return isFemale ? dict.femaleNames : dict.maleNames;
}

const PEASANT_COLORS = [
  '#3b82f6', '#10b981', '#06b6d4', '#8b5cf6',
  '#f97316', '#14b8a6', '#84cc16', '#0284c7',
];

export class ImmigrationSystem {
  public static update(grid: GridMap, currentTick: number): void {
    if (currentTick % IMMIGRATION_TICK_INTERVAL !== 0) return;

    const {
      immigrationProgress,
      setImmigrationProgress,
      addChronicleEvent,
      setSaveNotification,
      settlementName,
      regions,
      playerRegionId,
      playerSpawnPoint,
    } = useGameStore.getState();

    let totalCharacters = 0;
    let totalMood = 0;
    for (const c of characterEntities) {
      if ((c.factionId === 'player' || c.factionId === undefined) && (c.regionId === playerRegionId || c.regionId === undefined)) {
        totalCharacters++;
        totalMood += (c.needs?.mood || IMMIGRANTS.fallbackMood);
      }
    }

    let totalBeds = 0;
    for (const b of buildingEntities) {
      if (b.isCompleted && (b.factionId === 'player' || b.factionId === undefined) && (b.regionId === playerRegionId || b.regionId === undefined)) {
        if (b.buildingType === 'peasant_house') {
          const tier = b.houseTier || 1;
          totalBeds += (HOUSE_TIERS_CONFIG[tier]?.capacity || TENT_BED_CAPACITY);
        } else if (b.buildingType === 'tent') {
          totalBeds += TENT_BED_CAPACITY;
        } else if (b.buildingType === 'manor') {
          const tier = b.houseTier || 1;
          totalBeds += (HOUSE_TIERS_CONFIG[tier]?.capacity || TENT_BED_CAPACITY) + TENT_BED_CAPACITY;
        }
      }
    }

    const freeBeds = totalBeds - totalCharacters;
    const approvalRating = totalCharacters > 0 ? Math.round(totalMood / totalCharacters) : DEFAULT_APPROVAL_RATING;

    if (freeBeds <= 0 || approvalRating < MIN_APPROVAL_FOR_IMMIGRATION) {
      if (immigrationProgress > 0) {
        setImmigrationProgress(Math.max(0, immigrationProgress - IMMIGRATION_DECAY_DELTA));
      }
      return;
    }

    let progressDelta = BASE_IMMIGRATION_PROGRESS_DELTA;
    if (approvalRating >= HIGH_APPROVAL_THRESHOLD) {
      progressDelta += HIGH_APPROVAL_PROGRESS_DELTA;
    }
    if (approvalRating >= EXCELLENT_APPROVAL_THRESHOLD) {
      progressDelta += EXCELLENT_APPROVAL_PROGRESS_DELTA;
    }

    const nextProgress = immigrationProgress + progressDelta;

    if (nextProgress < MAX_IMMIGRATION_PROGRESS) {
      setImmigrationProgress(nextProgress);
      return;
    }

    setImmigrationProgress(0);

    const lang = useGameStore.getState().language;
    const isFemale = Math.random() < FEMALE_SPAWN_CHANCE;
    const namePool = getVillagerNamePool(lang, isFemale);
    const chosenName = namePool[Math.floor(Math.random() * namePool.length)];
    const avatarColor = PEASANT_COLORS[Math.floor(Math.random() * PEASANT_COLORS.length)];

    const pRegion = regions.find((r) => r.id === (playerRegionId ?? 0)) || regions[0];
    const bounds = pRegion?.bounds || { minX: 0, maxX: 127, minZ: 0, maxZ: 127 };
    const campPos = pRegion?.campPosition || playerSpawnPoint || [52, 52];
    const cx = campPos[0];
    const cz = campPos[1];

    let spawnX = bounds.minX + 2;
    let spawnZ = Math.floor((bounds.minZ + bounds.maxZ) / 2);

    let foundRoadEdge = false;
    for (let z = bounds.minZ + 2; z < bounds.maxZ - 2; z++) {
      const tile = grid.getTile(spawnX, z);
      if (tile && tile.terrain === 'road') {
        spawnZ = z;
        foundRoadEdge = true;
        break;
      }
    }

    if (!foundRoadEdge) {
      for (let z = bounds.minZ + 2; z < bounds.maxZ - 2; z++) {
        if (grid.isWalkable(spawnX, z)) {
          spawnZ = z;
          break;
        }
      }
    }

    const newUnitId = `unit-peasant-immigrant-${Date.now()}`;
    const entryPath = AStar.findPath(grid, [spawnX, spawnZ], [cx, cz], true, bounds) || [];
    const dict = translations[lang].chronicle;

    world.add({
      id: newUnitId,
      name: chosenName,
      title: dict.newSettlerTitle,
      characterClass: 'peasant',
      avatarColor,
      isCharacter: true,
      factionId: 'player',
      regionId: pRegion.id,
      gridPosition: [spawnX, spawnZ],
      position: [spawnX + 0.5, IMMIGRANTS.spawnHeight, spawnZ + 0.5],
      path: entryPath,
      moveSpeed: DEFAULT_PEASANT_MOVE_SPEED,
      gold: Math.floor(Math.random() * IMMIGRANTS.goldRange) + IMMIGRANTS.goldMin,
      workBuildingId: undefined,
      thoughts: [
        {
          id: 'new_settler',
          text: dict.arrivedAtNewSettlementThought(IMMIGRANT_THOUGHT_MODIFIER),
          modifier: IMMIGRANT_THOUGHT_MODIFIER,
          durationTicks: IMMIGRANT_THOUGHT_DURATION_TICKS,
        },
      ],
      needs: {
        hunger: IMMIGRANT_STARTING_HUNGER,
        energy: IMMIGRANT_STARTING_ENERGY,
        mood: IMMIGRANT_STARTING_MOOD,
        ale: IMMIGRANT_STARTING_ALE,
        hygiene: IMMIGRANT_STARTING_HYGIENE,
      },
      skills: {
        farming: Math.floor(Math.random() * IMMIGRANTS.farmingRange) + IMMIGRANTS.farmingMin,
        woodcutting: Math.floor(Math.random() * IMMIGRANTS.woodcuttingRange) + IMMIGRANTS.woodcuttingMin,
        mining: Math.floor(Math.random() * IMMIGRANTS.miningRange) + IMMIGRANTS.miningMin,
        building: Math.floor(Math.random() * IMMIGRANTS.buildingRange) + IMMIGRANTS.buildingMin,
        cooking: Math.floor(Math.random() * IMMIGRANTS.cookingRange) + IMMIGRANTS.cookingMin,
        brewing: Math.floor(Math.random() * IMMIGRANTS.brewingRange) + IMMIGRANTS.brewingMin,
        combat: Math.floor(Math.random() * IMMIGRANTS.combatRange) + IMMIGRANTS.combatMin,
        intellect: Math.floor(Math.random() * IMMIGRANTS.intellectRange) + IMMIGRANTS.intellectMin,
        charisma: Math.floor(Math.random() * IMMIGRANTS.charismaRange) + IMMIGRANTS.charismaMin,
      },
      currentJob: {
        id: `journey-${newUnitId}`,
        type: 'wander',
        progress: 0,
        totalWork: IMMIGRANTS.journeyWork,
      },
      speechBubble: {
        text: dict.immigrantSeekingWorkSpeech,
        expiresAtTick: currentTick + DEFAULT_SPEECH_BUBBLE_TICKS,
        type: 'mood',
      },
    });

    addChronicleEvent({
      title: dict.migrantsArrivedTitle,
      description: dict.newImmigrantJoinedDesc(chosenName),
      type: 'success',
    });

    setSaveNotification(dict.newImmigrantNotification(settlementName, chosenName));
  }
}
