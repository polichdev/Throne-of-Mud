import * as THREE from 'three';
import { markInstancePrefixForUpload } from '../performance/instanceUploads';

interface Batch {
  mesh: THREE.InstancedMesh;
  sources: THREE.Mesh[];
  slots: { source: THREE.Mesh; world: THREE.Matrix4 }[];
}

export class AnimatedMeshBatches {
  readonly group = new THREE.Group();
  private batches = new Map<string, Batch>();
  private originalLayers = new Map<THREE.Mesh, number>();
  private slices = new Map<THREE.BufferGeometry, Map<string, THREE.BufferGeometry>>();
  private inverse = new THREE.Matrix4();
  private local = new THREE.Matrix4();
  private sourceRoot: THREE.Group | null = null;
  private groupWorld = new THREE.Matrix4();
  private visibility = new Map<THREE.Object3D, boolean>();

  sync(root: THREE.Group) {
    this.restoreLayers();
    this.sourceRoot = root;
    const sources: THREE.Mesh[] = [];
    const uses = new Map<THREE.BufferGeometry, number>();
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || object instanceof THREE.SkinnedMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (materials.some(material => !material.visible || material.transparent) || object.morphTargetInfluences?.length) return;
      sources.push(object);
      uses.set(object.geometry, (uses.get(object.geometry) ?? 0) + 1);
    });

    const next = new Map<string, { geometry: THREE.BufferGeometry; material: THREE.Material; source: THREE.Mesh; sources: THREE.Mesh[] }>();
    for (const source of sources) {
      if ((uses.get(source.geometry) ?? 0) < 2) continue;
      const materials = source.material;
      const parts = Array.isArray(materials)
        ? source.geometry.groups.map(part => ({ geometry: this.slice(source.geometry, part.start, part.count), material: materials[part.materialIndex ?? 0] }))
        : [{ geometry: source.geometry, material: materials }];
      if (!parts.length || parts.some(part => !part.material)) continue;
      for (const { geometry, material } of parts) {
        const key = `${geometry.uuid}:${material.uuid}:${source.castShadow}:${source.receiveShadow}:${source.renderOrder}:${source.layers.mask}`;
        let entry = next.get(key);
        if (!entry) {
          entry = { geometry, material, source, sources: [] };
          next.set(key, entry);
        }
        entry.sources.push(source);
      }
      this.originalLayers.set(source, source.layers.mask);
      source.layers.mask = 0;
    }

    for (const [key, batch] of this.batches) {
      if (next.has(key)) continue;
      this.group.remove(batch.mesh);
      batch.mesh.dispose();
      this.batches.delete(key);
    }
    for (const [key, entry] of next) {
      let batch = this.batches.get(key);
      const required = entry.sources.length;
      if (batch && batch.mesh.instanceMatrix.count < required) {
        this.group.remove(batch.mesh);
        batch.mesh.dispose();
        batch = undefined;
      }
      if (!batch) {
        const capacity = 2 ** Math.ceil(Math.log2(Math.max(2, required)));
        const mesh = new THREE.InstancedMesh(entry.geometry, entry.material, capacity);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.castShadow = entry.source.castShadow;
        mesh.receiveShadow = entry.source.receiveShadow;
        mesh.renderOrder = entry.source.renderOrder;
        mesh.layers.mask = this.originalLayers.get(entry.source)!;
        mesh.frustumCulled = false;
        mesh.raycast = () => {};
        mesh.count = 0;
        mesh.visible = false;
        batch = { mesh, sources: [], slots: [] };
        this.batches.set(key, batch);
        this.group.add(mesh);
      }
      batch.sources = entry.sources;
      batch.slots.length = Math.min(batch.slots.length, entry.sources.length);
    }
  }

  update() {
    const root = this.sourceRoot;
    this.group.visible = Boolean(root && this.isVisible(root, root));
    if (!root || !this.group.visible) return;
    this.visibility.clear(); this.visibility.set(root, true);
    const moved = !this.groupWorld.equals(this.group.matrixWorld);
    if (moved) this.inverse.copy(this.group.matrixWorld).invert();
    this.groupWorld.copy(this.group.matrixWorld);
    for (const batch of this.batches.values()) {
      batch.mesh.matrixWorld.copy(this.group.matrixWorld);
      let count = 0;
      let changed = false;
      for (const source of batch.sources) {
        if (!this.visibleWithinRoot(source)) continue;
        let slot = batch.slots[count];
        if (!slot || slot.source !== source || moved || !slot.world.equals(source.matrixWorld)) {
          this.local.multiplyMatrices(this.inverse, source.matrixWorld);
          batch.mesh.setMatrixAt(count, this.local);
          if (!slot) { slot = { source, world: new THREE.Matrix4() }; batch.slots[count] = slot; }
          slot.source = source; slot.world.copy(source.matrixWorld);
          changed = true;
        }
        count++;
      }
      batch.mesh.count = count;
      batch.mesh.visible = count > 0;
      if (changed) markInstancePrefixForUpload(batch.mesh.instanceMatrix, count);
    }
  }

  dispose() {
    this.restoreLayers();
    for (const batch of this.batches.values()) batch.mesh.dispose();
    this.batches.clear();
    this.group.clear();
    for (const parts of this.slices.values()) for (const geometry of parts.values()) geometry.dispose();
    this.slices.clear();
    this.sourceRoot = null;
    this.visibility.clear();
  }

  private restoreLayers() {
    for (const [source, mask] of this.originalLayers) source.layers.mask = mask;
    this.originalLayers.clear();
  }

  private isVisible(object: THREE.Object3D, root: THREE.Group) {
    let inRoot = false;
    for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent) {
      if (!parent.visible) return false;
      if (parent === root) inRoot = true;
    }
    return inRoot;
  }

  private visibleWithinRoot(object: THREE.Object3D): boolean {
    const cached = this.visibility.get(object);
    if (cached !== undefined) return cached;
    const visible = object.visible && Boolean(object.parent && this.visibleWithinRoot(object.parent));
    this.visibility.set(object, visible);
    return visible;
  }

  private slice(geometry: THREE.BufferGeometry, start: number, count: number) {
    let parts = this.slices.get(geometry);
    if (!parts) { parts = new Map(); this.slices.set(geometry, parts); }
    const rangeStart = Math.max(start, geometry.drawRange.start);
    const rangeEnd = Math.min(start + count, geometry.drawRange.start + geometry.drawRange.count);
    const key = `${rangeStart}:${rangeEnd}`;
    let part = parts.get(key);
    if (!part) {
      part = geometry.clone();
      part.clearGroups();
      part.setDrawRange(rangeStart, Math.max(0, rangeEnd - rangeStart));
      parts.set(key, part);
    }
    return part;
  }
}
