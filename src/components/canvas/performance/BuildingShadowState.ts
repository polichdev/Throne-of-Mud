import type { GameEntity } from '../../../engine/ecs/world';

export class BuildingShadowState {
  private buildings = new Map<string, string>();
  private selectedId: string | null = null;
  private floor = 1;

  update(entities: Iterable<GameEntity>, selectedId: string | null, floor: number): boolean {
    const next = new Map<string, string>();
    let changed = false;
    for (const b of entities) {
      const key = [b.buildingType, b.position?.[0], b.position?.[1], b.position?.[2], b.gridPosition?.[0], b.gridPosition?.[1],
        b.buildingWidth, b.buildingHeight, b.rotationAngle, b.houseTier, b.backyardExtension,
        Boolean(b.isCompleted || (b.constructionProgress || 0) >= 100), Boolean(b.isDemolishing),
        b.pendingHouseTier, b.pendingBackyardExtension].join('|');
      next.set(b.id, key);
      if (this.buildings.get(b.id) !== key) changed = true;
    }
    if (next.size !== this.buildings.size) changed = true;
    const inspected = selectedId !== null && next.has(selectedId) ? selectedId : null;
    if (inspected !== this.selectedId || (inspected !== null && floor !== this.floor)) changed = true;
    this.buildings = next;
    this.selectedId = inspected;
    this.floor = floor;
    return changed;
  }
}
