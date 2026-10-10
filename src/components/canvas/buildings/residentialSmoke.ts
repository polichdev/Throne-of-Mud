import type { GameEntity } from '../../../engine/ecs/world';

export class ResidentialSmokeState {
  private frame = NaN;
  private night = false;
  private sleepingBuildings = new Set<string>();

  hasSleepingResident(buildingId: string | null, frame: number, hour: number, residents: Iterable<GameEntity>): boolean {
    const night = hour >= 20 || hour < 6;
    if (frame !== this.frame || night !== this.night) {
      this.frame = frame;
      this.night = night;
      this.sleepingBuildings.clear();
      if (night) {
        for (const resident of residents) {
          const job = resident.currentJob;
          if (job?.type !== 'sleep' || !job.targetBuildingId || resident.path?.length || !resident.position || !job.targetPosition) continue;
          const dx = resident.position[0] - job.targetPosition[0];
          const dz = resident.position[2] - job.targetPosition[1];
          if (dx * dx + dz * dz <= 1) this.sleepingBuildings.add(job.targetBuildingId);
        }
      }
    }
    return buildingId !== null && this.sleepingBuildings.has(buildingId);
  }
}
