import { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { characterEntities, buildingEntities } from '../engine/ecs/world';
import { BUILDING_BLUEPRINTS } from '../engine/buildings/blueprints';
import { BASE_STORAGE_CAPACITY } from '../constants/economy';
import { isNoble, isPeasant } from '../engine/ecs/entityHelpers';

export function useSettlementMetrics() {
  const playerRegionId = useGameStore((s) => s.playerRegionId);
  const resources = useGameStore((s) => s.resources);

  const allCharacters = useMemo(() => {
    return Array.from(characterEntities).filter(
      (c) =>
        (c.factionId === 'player' || c.factionId === undefined) &&
        (c.regionId === playerRegionId || c.regionId === undefined)
    );
  }, [playerRegionId, characterEntities.size]);

  const lords = useMemo(() => {
    return allCharacters.filter(isNoble);
  }, [allCharacters]);

  const king = useMemo(() => {
    return lords.find((l) => l.characterClass === 'king') || lords[0];
  }, [lords]);

  const peasants = useMemo(() => {
    return allCharacters.filter(isPeasant);
  }, [allCharacters]);

  const employedPeasants = useMemo(() => {
    return peasants.filter((p) => Boolean(p.workBuildingId));
  }, [peasants]);

  const freePeasants = useMemo(() => {
    return peasants.filter((p) => !p.workBuildingId && !p.isLevy);
  }, [peasants]);

  const levyPeasants = useMemo(() => {
    return peasants.filter((p) => p.isLevy);
  }, [peasants]);

  const approvalRating = useMemo(() => {
    if (allCharacters.length === 0) return 50;
    const totalMood = allCharacters.reduce((acc, c) => acc + (c.needs?.mood || 60), 0);
    return Math.round(totalMood / allCharacters.length);
  }, [allCharacters]);

  const housingStats = useMemo(() => {
    const buildings = Array.from(buildingEntities).filter(
      (b) =>
        b.isCompleted &&
        (b.factionId === 'player' || b.factionId === undefined) &&
        (b.regionId === playerRegionId || b.regionId === undefined)
    );

    let totalBeds = 0;
    for (const b of buildings) {
      if (b.buildingType === 'peasant_house') totalBeds += 2;
      else if (b.buildingType === 'tent') totalBeds += 1;
      else if (b.buildingType === 'manor') totalBeds += 4;
    }

    return {
      occupied: allCharacters.length,
      capacity: Math.max(totalBeds, allCharacters.length),
    };
  }, [allCharacters.length, playerRegionId, buildingEntities.size]);

  const storageUsage = useMemo(() => {
    const buildings = Array.from(buildingEntities).filter(
      (b) =>
        b.isCompleted &&
        (b.factionId === 'player' || b.factionId === undefined) &&
        (b.regionId === playerRegionId || b.regionId === undefined)
    );

    let current = 0;
    let max = 0;
    for (const b of buildings) {
      const bpMax = BUILDING_BLUEPRINTS[b.buildingType]?.maxStorage;
      if (bpMax) {
        max += bpMax;
      }
      if (b.localInventory) {
        for (const count of Object.values(b.localInventory)) {
          current += (count as number) || 0;
        }
      }
    }

    return { current, max: Math.max(max, BASE_STORAGE_CAPACITY || 100) };
  }, [playerRegionId, buildingEntities.size]);

  const totalFood = useMemo(() => {
    return (resources.bread || 0) + (resources.wheat || 0) + (resources.fish || 0) + (resources.berries || 0);
  }, [resources.bread, resources.wheat, resources.fish, resources.berries]);

  const muleStats = useMemo(() => {
    const hitchingPosts = Array.from(buildingEntities).filter(
      (b) =>
        b.isCompleted &&
        b.buildingType === 'hitching_post' &&
        (b.factionId === 'player' || b.factionId === undefined) &&
        (b.regionId === playerRegionId || b.regionId === undefined)
    );

    let total = 0;
    for (const hp of hitchingPosts) {
      total += hp.mulesCount ?? 1;
    }
    const inUse = allCharacters.filter((c) => c.hasMule).length;
    return {
      total,
      inUse,
      available: Math.max(0, total - inUse),
    };
  }, [playerRegionId, buildingEntities.size, allCharacters]);

  return {
    allCharacters,
    lords,
    king,
    peasants,
    employedPeasants,
    freePeasants,
    levyPeasants,
    approvalRating,
    housingStats,
    storageUsage,
    totalFood,
    muleStats,
  };
}

