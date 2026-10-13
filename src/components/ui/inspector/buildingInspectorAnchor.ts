export interface BuildingAnchor { entityId: string; x: number; y: number; onScreen: boolean }
let anchor: BuildingAnchor | null = null;
const listeners = new Set<(anchor: BuildingAnchor | null) => void>();

export function publishBuildingAnchor(next: BuildingAnchor | null) {
  if (anchor?.entityId === next?.entityId && anchor?.onScreen === next?.onScreen &&
    Math.abs((anchor?.x ?? 0) - (next?.x ?? 0)) < .25 && Math.abs((anchor?.y ?? 0) - (next?.y ?? 0)) < .25) return;
  anchor = next;
  for (const listener of listeners) listener(anchor);
}
export function subscribeBuildingAnchor(listener: (anchor: BuildingAnchor | null) => void) {
  listeners.add(listener); listener(anchor);
  return () => { listeners.delete(listener); };
}

export function placeBuildingInspector(x: number, y: number, width: number, height: number, screenWidth: number, screenHeight: number) {
  const margin = 12, top = Math.min(96, Math.max(margin, screenHeight * .13)), bottom = 70;
  const left = x + 58 + width <= screenWidth - margin ? x + 58 : x - width - 58;
  return {
    x: Math.round(Math.max(margin, Math.min(left, screenWidth - width - margin))),
    y: Math.round(Math.max(top, Math.min(y - 100, screenHeight - height - bottom))),
  };
}
