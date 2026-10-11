import * as THREE from 'three';

export class StablePointLightPool {
  readonly group = new THREE.Group();
  private sources = new Map<THREE.PointLight, number>();
  private owners = new Map<object, Set<THREE.PointLight>>();
  private active = false;

  sync(owner: object, root: THREE.Object3D) {
    const next = new Set<THREE.PointLight>();
    root.traverse(node => { if (node instanceof THREE.PointLight && !node.castShadow) next.add(node); });
    this.owners.set(owner, next);
    this.releaseUnusedSources();
    for (const light of next) {
      if (!this.sources.has(light)) this.sources.set(light, light.layers.mask);
      if (this.active) light.layers.mask = 0;
    }
    if (this.active) this.reserve(this.sources.size);
  }

  remove(owner: object) {
    this.owners.delete(owner);
    this.releaseUnusedSources();
  }

  start() {
    this.active = true;
    this.reserve(Math.max(16, this.sources.size));
    for (const light of this.sources.keys()) light.layers.mask = 0;
  }

  stop() {
    this.active = false;
    for (const [light, mask] of this.sources) light.layers.mask = mask;
    this.group.clear();
  }

  update(camera: THREE.Camera) {
    if (!this.active) return;
    let count = 0;
    for (const [source, mask] of this.sources) {
      source.layers.mask = source.castShadow ? mask : 0;
      if (!(mask & camera.layers.mask) || !source.intensity || source.castShadow) continue;
      let visible = true;
      for (let parent: THREE.Object3D | null = source; parent; parent = parent.parent) {
        if (!parent.visible) { visible = false; break; }
      }
      if (!visible) continue;
      this.reserve(count + 1);
      const light = this.group.children[count++] as THREE.PointLight;
      light.layers.mask = camera.layers.mask;
      light.color.copy(source.color); light.intensity = source.intensity;
      light.distance = source.distance; light.decay = source.decay;
      light.position.setFromMatrixPosition(source.matrixWorld);
      light.matrixWorld.copy(source.matrixWorld);
    }
    for (let i = count; i < this.group.children.length; i++) {
      const light = this.group.children[i] as THREE.PointLight;
      light.layers.mask = camera.layers.mask;
      light.intensity = 0; light.distance = 1;
      light.position.set(1e6, 1e6, 1e6); light.matrixWorld.makeTranslation(1e6, 1e6, 1e6);
    }
  }

  private releaseUnusedSources() {
    const retained = new Set<THREE.PointLight>();
    for (const sources of this.owners.values()) for (const light of sources) retained.add(light);
    for (const [light, mask] of this.sources) {
      if (retained.has(light)) continue;
      light.layers.mask = mask; this.sources.delete(light);
    }
  }

  private reserve(required: number) {
    if (required <= this.group.children.length) return;
    const capacity = 2 ** Math.ceil(Math.log2(required));
    while (this.group.children.length < capacity) {
      const light = new THREE.PointLight(0, 0, 1);
      light.matrixAutoUpdate = false;
      this.group.add(light);
    }
  }
}

const pools = new WeakMap<THREE.Scene, StablePointLightPool>();
export function getScenePointLightPool(scene: THREE.Scene) {
  let pool = pools.get(scene);
  if (!pool) { pool = new StablePointLightPool(); pools.set(scene, pool); }
  return pool;
}
export function syncScenePointLights(scene: THREE.Scene, owner: object, root: THREE.Object3D) { getScenePointLightPool(scene).sync(owner, root); }
export function removeScenePointLights(scene: THREE.Scene, owner: object) { pools.get(scene)?.remove(owner); }

