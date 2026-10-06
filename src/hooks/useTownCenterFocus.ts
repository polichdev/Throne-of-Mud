import { useCallback } from 'react';
import { buildingEntities } from '../engine/ecs/world';
import { useGameStore } from '../store/useGameStore';

export function useTownCenterFocus() {
  const setCameraFocusTarget = useGameStore((s) => s.setCameraFocusTarget);

  const focusTownCenter = useCallback(() => {
    const { playerSpawnPoint, playerRegionId } = useGameStore.getState();
    const tent = Array.from(buildingEntities).find(
      (b) =>
        (b.buildingType === 'tent' || b.buildingType === 'campfire' || b.buildingType === 'manor') &&
        (b.factionId === 'player' || b.regionId === playerRegionId)
    );

    if (tent?.position) {
      setCameraFocusTarget([tent.position[0], tent.position[2]]);
    } else if (tent?.gridPosition) {
      setCameraFocusTarget([tent.gridPosition[0], tent.gridPosition[1]]);
    } else if (playerSpawnPoint) {
      setCameraFocusTarget([playerSpawnPoint[0], playerSpawnPoint[1]]);
    } else {
      setCameraFocusTarget([52, 52]);
    }
  }, [setCameraFocusTarget]);

  return { focusTownCenter };
}
