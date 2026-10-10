import type { Job } from '../../../types/game';

export function isHouseSleeperVisible(
  job: Job | undefined,
  hasPath: boolean,
  targetBuildingType: string | undefined,
  inspectedEntityId: string | null,
  floorView: 1 | 2,
): boolean {
  if (job?.type !== 'sleep' || hasPath || targetBuildingType !== 'peasant_house' || (job.bedIndex ?? 0) < 2) {
    return true;
  }
  return inspectedEntityId === job.targetBuildingId && floorView === 2;
}
