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
import { HOUSE_TIERS_CONFIG } from '../../../constants/housing';

const UKRAINIAN_NAMES_MALE = [
  'Тарас', 'Богдан', 'Остап', 'Яромир', 'Михайло',
  'Любомир', 'Дмитро', 'Назар', 'Степан', 'Василь',
  'Олесь', 'Гриць', 'Юрко', 'Іван', 'Святослав',
];

const UKRAINIAN_NAMES_FEMALE = [
  'Одарка', 'Мирослава', 'Соломія', 'Ганна', 'Марічка',
  'Катерина', 'Богдана', 'Ярослава', 'Оксана', 'Наталка',
];

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
        totalMood += (c.needs?.mood || 60);
      }
    }

    let totalBeds = 0;
    for (const b of buildingEntities) {
      if (b.isCompleted && (b.factionId === 'player' || b.factionId === undefined) && (b.regionId === playerRegionId || b.regionId === undefined)) {
        if (b.buildingType === 'peasant_house') {
          const tier = b.houseTier || 1;
          totalBeds += (HOUSE_TIERS_CONFIG[tier]?.capacity || 2);
        } else if (b.buildingType === 'tent') {
          totalBeds += 2;
        } else if (b.buildingType === 'manor') {
          const tier = b.houseTier || 1;
          totalBeds += (HOUSE_TIERS_CONFIG[tier]?.capacity || 2) + 2;
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

    const isFemale = Math.random() < FEMALE_SPAWN_CHANCE;
    const namePool = isFemale ? UKRAINIAN_NAMES_FEMALE : UKRAINIAN_NAMES_MALE;
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

    world.add({
      id: newUnitId,
      name: chosenName,
      title: 'Новий поселенець',
      characterClass: 'peasant',
      avatarColor,
      isCharacter: true,
      factionId: 'player',
      regionId: pRegion.id,
      gridPosition: [spawnX, spawnZ],
      position: [spawnX + 0.5, 0.3, spawnZ + 0.5],
      path: entryPath,
      moveSpeed: DEFAULT_PEASANT_MOVE_SPEED,
      gold: Math.floor(Math.random() * 4) + 2,
      workBuildingId: undefined,
      thoughts: [
        {
          id: 'new_settler',
          text: `Прибув у нове поселення (+${IMMIGRANT_THOUGHT_MODIFIER})`,
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
        farming: Math.floor(Math.random() * 5) + 4,
        woodcutting: Math.floor(Math.random() * 5) + 4,
        mining: Math.floor(Math.random() * 4) + 3,
        building: Math.floor(Math.random() * 5) + 4,
        cooking: Math.floor(Math.random() * 4) + 2,
        brewing: Math.floor(Math.random() * 4) + 2,
        combat: Math.floor(Math.random() * 4) + 3,
        intellect: Math.floor(Math.random() * 5) + 3,
        charisma: Math.floor(Math.random() * 5) + 3,
      },
      currentJob: {
        id: `journey-${newUnitId}`,
        type: 'wander',
        progress: 0,
        totalWork: 10,
      },
      speechBubble: {
        text: 'Вітаю! Шукаю прихистку та роботи.',
        expiresAtTick: currentTick + DEFAULT_SPEECH_BUBBLE_TICKS,
        type: 'mood',
      },
    });

    addChronicleEvent({
      title: 'Нові поселенці прибули!',
      description: `До нашого поселення приєднався новий житель — ${chosenName}. Його привабило процвітання та високий рівень життя під владою Корони.`,
      type: 'success',
    });

    setSaveNotification(`👤 До ${settlementName} прибув новий житель: ${chosenName}!`);
  }
}
