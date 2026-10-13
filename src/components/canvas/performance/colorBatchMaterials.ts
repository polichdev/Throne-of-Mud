import * as THREE from 'three';

const bindings = new WeakMap<THREE.Material, THREE.MeshStandardMaterial>();
const shared = new Map<string, THREE.MeshStandardMaterial>();

export function registerColorBatchMaterial(material: THREE.MeshStandardMaterial): void {
  if (bindings.has(material) || material.map || material.transparent || material.vertexColors ||
    material.onBeforeRender !== THREE.Material.prototype.onBeforeRender) return;
  const serialized: Record<string, unknown> = { ...material.toJSON() };
  delete serialized.uuid; delete serialized.name; delete serialized.metadata; delete serialized.color;
  const key = JSON.stringify(serialized) + ':' + material.customProgramCacheKey();
  let base = shared.get(key);
  if (!base) {
    base = material.clone(); base.color.set(0xffffff);
    base.onBeforeCompile = material.onBeforeCompile;
    base.customProgramCacheKey = material.customProgramCacheKey;
    shared.set(key, base);
  }
  bindings.set(material, base);
}

export function getColorBatchMaterial(material: THREE.Material): THREE.MeshStandardMaterial | undefined {
  return bindings.get(material);
}
