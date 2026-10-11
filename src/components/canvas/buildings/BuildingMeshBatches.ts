import * as THREE from 'three';
import { cacheBatchedDrawList } from '../performance/batchedDrawCache';

interface Part { source: THREE.Mesh; geometry: THREE.BufferGeometry; material: THREE.Material; }
interface Binding { source: THREE.Mesh; id: number; initialized: boolean; enabled: boolean | null; }
interface Batch { mesh: THREE.BatchedMesh; geometries: string; bindings: Binding[]; visibleCount: number; }
interface Source { mesh: THREE.Mesh; bindings: { batch: Batch; binding: Binding }[]; world: THREE.Matrix4; initialized: boolean; safe: boolean; }
interface Branch { root: THREE.Object3D; sources: Source[]; visible: boolean | null; }

export class BuildingMeshBatches {
  readonly group = new THREE.Group();
  private batches = new Map<string, Batch>();
  private originalLayers = new Map<THREE.Mesh, number>();
  private prepared = new Map<string, THREE.BufferGeometry>();
  private root: THREE.Group | null = null;
  private visibility = new WeakMap<THREE.Object3D, { epoch: number; visible: boolean }>();
  private epoch = 0;
  private sources = new Map<THREE.Mesh, Source>();
  private branches: Branch[] = [];
  private inverse = new THREE.Matrix4();
  private local = new THREE.Matrix4();
  private groupWorld = new THREE.Matrix4();

  sync(root: THREE.Group) {
    this.restoreLayers();
    this.root = root;
    const entries = new Map<string, Part[]>();
    const usedGeometry = new Set<string>();
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || object instanceof THREE.BatchedMesh || object instanceof THREE.SkinnedMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (materials.some(mat => !mat.visible || mat.transparent || ('wireframe' in mat && mat.wireframe)) || object.morphTargetInfluences?.length || object.customDepthMaterial || object.customDistanceMaterial) return;
      if (!batchableTransform(object.matrixWorld)) return;
      const geometry: THREE.BufferGeometry = object.geometry;
      if (!geometry.attributes.position || Object.keys(geometry.morphAttributes).length) return;
      const groups = Array.isArray(object.material) ? geometry.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
      if (!groups.length || groups.some(part => !materials[part.materialIndex ?? 0])) return;
      const schema = Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b))
        .map(([name, attr]) => `${name}:${attr.itemSize}:${attr.normalized}:${attr.array.constructor.name}`).join(',');
      for (const part of groups) {
        const start = Math.max(part.start, geometry.drawRange.start);
        const end = Math.min(part.start + part.count, geometry.drawRange.start + geometry.drawRange.count, geometry.index?.count ?? geometry.attributes.position.count);
        if (end <= start) continue;
        const geometryKey = `${geometry.uuid}:${start}:${end}`;
        usedGeometry.add(geometryKey);
        let prepared = this.prepared.get(geometryKey);
        if (!prepared) {
          prepared = new THREE.BufferGeometry();
          for (const [name, attribute] of Object.entries(geometry.attributes)) prepared.setAttribute(name, attribute);
          const index = new Uint32Array(end - start);
          for (let i = start; i < end; i++) index[i - start] = geometry.index?.getX(i) ?? i;
          prepared.setIndex(new THREE.BufferAttribute(index, 1));
          this.prepared.set(geometryKey, prepared);
        }
        const material = materials[part.materialIndex ?? 0];
        const key = `${material.uuid}:${object.castShadow}:${object.receiveShadow}:${object.renderOrder}:${object.layers.mask}:${object.frustumCulled}:${schema}`;
        let list = entries.get(key);
        if (!list) { list = []; entries.set(key, list); }
        list.push({ source: object, geometry: prepared, material });
      }
    });

    const eligible = (parts: Part[] | undefined) => Boolean(parts && (parts.length >= 2 || parts.some(part => Array.isArray(part.source.material))));
    for (const [key, batch] of this.batches) {
      if (eligible(entries.get(key))) continue;
      this.group.remove(batch.mesh); batch.mesh.dispose(); this.batches.delete(key);
    }
    for (const [key, parts] of entries) {
      if (!eligible(parts)) continue;
      const geometries = [...new Set(parts.map(part => part.geometry))];
      const signature = geometries.map(geo => geo.uuid).sort().join(':');
      let batch = this.batches.get(key);
      if (batch && (batch.geometries !== signature || batch.bindings.length !== parts.length || batch.bindings.some((binding, i) => binding.source !== parts[i].source))) {
        this.group.remove(batch.mesh); batch.mesh.dispose(); batch = undefined;
      }
      if (!batch) {
        const vertices = geometries.reduce((sum, geo) => sum + geo.attributes.position.count, 0);
        const indices = geometries.reduce((sum, geo) => sum + geo.index!.count, 0);
        const mesh = new THREE.BatchedMesh(2 ** Math.ceil(Math.log2(parts.length)), vertices, indices, parts[0].material);
        const source = parts[0].source;
        mesh.castShadow = source.castShadow; mesh.receiveShadow = source.receiveShadow;
        mesh.renderOrder = source.renderOrder; mesh.layers.mask = this.originalLayers.get(source) ?? source.layers.mask;
        mesh.frustumCulled = false;
        mesh.perObjectFrustumCulled = source.frustumCulled;
        mesh.raycast = () => {};
        const ids = new Map(geometries.map(geo => [geo, mesh.addGeometry(geo)]));
        batch = { mesh, geometries: signature, bindings: [], visibleCount: 0 };
        for (const part of parts) batch.bindings.push({ source: part.source, id: mesh.addInstance(ids.get(part.geometry)!), initialized: false, enabled: null });
        cacheBatchedDrawList(mesh);
        this.batches.set(key, batch); this.group.add(mesh);
      }
      for (const part of parts) {
        if (!this.originalLayers.has(part.source)) this.originalLayers.set(part.source, part.source.layers.mask);
        part.source.layers.mask = 0;
      }
    }
    for (const [key, geometry] of this.prepared) {
      if (usedGeometry.has(key)) continue;
      geometry.dispose(); this.prepared.delete(key);
    }
    const sources = new Map<THREE.Mesh, Source>(), branches = new Map<THREE.Object3D, Branch>();
    for (const batch of this.batches.values()) {
      batch.visibleCount = 0;
      for (const binding of batch.bindings) {
        if (binding.enabled) batch.visibleCount++;
        let source = sources.get(binding.source);
        if (!source) {
          source = this.sources.get(binding.source) ?? { mesh: binding.source, bindings: [], world: new THREE.Matrix4(), initialized: false, safe: true };
          source.bindings = []; sources.set(binding.source, source);
          let branchRoot: THREE.Object3D = binding.source;
          while (branchRoot.parent && branchRoot.parent !== root) branchRoot = branchRoot.parent;
          let branch = branches.get(branchRoot);
          if (!branch) { branch = { root: branchRoot, sources: [], visible: null }; branches.set(branchRoot, branch); }
          branch.sources.push(source);
        }
        source.bindings.push({ batch, binding });
      }
    }
    this.sources = sources; this.branches = [...branches.values()];
  }

  update() {
    const root = this.root;
    let visible = Boolean(root);
    for (let parent: THREE.Object3D | null = root; parent; parent = parent.parent) if (!parent.visible) { visible = false; break; }
    this.group.visible = visible;
    if (!root || !visible) return;
    this.epoch++; this.visibility.set(root, { epoch: this.epoch, visible: true });
    const moved = !this.groupWorld.equals(this.group.matrixWorld);
    if (moved) this.inverse.copy(this.group.matrixWorld).invert();
    this.groupWorld.copy(this.group.matrixWorld);
    for (const branch of this.branches) {
      const branchVisible = branch.root.parent === root && branch.root.visible;
      if (!branchVisible && branch.visible === false) continue;
      branch.visible = branchVisible;
      for (const source of branch.sources) {
        const visible = branchVisible && this.visibleWithinRoot(source.mesh);
        const changed = visible && (!source.initialized || !source.world.equals(source.mesh.matrixWorld));
        if (changed) {
          source.world.copy(source.mesh.matrixWorld); source.initialized = true;
          source.safe = batchableTransform(source.world);
        }
        const enabled = visible && source.safe;
        if (visible) source.mesh.layers.mask = source.safe ? 0 : this.originalLayers.get(source.mesh)!;
        let transformed = false;
        for (const { batch, binding } of source.bindings) {
          if (binding.enabled !== enabled) {
            batch.mesh.setVisibleAt(binding.id, enabled);
            batch.visibleCount += enabled ? 1 : binding.enabled ? -1 : 0;
            binding.enabled = enabled;
          }
          if (!enabled) continue;
          if (!binding.initialized || changed || moved) {
            if (!transformed) { this.local.multiplyMatrices(this.inverse, source.world); transformed = true; }
            batch.mesh.setMatrixAt(binding.id, this.local); binding.initialized = true;
          }
        }
      }
    }
    for (const batch of this.batches.values()) {
      batch.mesh.matrixWorld.copy(this.group.matrixWorld);
      batch.mesh.visible = batch.visibleCount > 0;
    }
  }

  dispose() {
    this.restoreLayers();
    for (const batch of this.batches.values()) batch.mesh.dispose();
    for (const geometry of this.prepared.values()) geometry.dispose();
    this.batches.clear(); this.prepared.clear(); this.sources.clear(); this.branches = [];
    this.visibility = new WeakMap(); this.group.clear(); this.root = null;
  }

  private restoreLayers() { for (const [source, layers] of this.originalLayers) source.layers.mask = layers; this.originalLayers.clear(); }
  private visibleWithinRoot(object: THREE.Object3D): boolean {
    const cached = this.visibility.get(object);
    if (cached?.epoch === this.epoch) return cached.visible;
    const visible = object.visible && Boolean(object.parent && this.visibleWithinRoot(object.parent));
    if (cached) { cached.epoch = this.epoch; cached.visible = visible; }
    else this.visibility.set(object, { epoch: this.epoch, visible });
    return visible;
  }
}

function batchableTransform(matrix: THREE.Matrix4) {
  if (matrix.determinant() <= 0) return false;
  const m = matrix.elements;
  const xx = m[0] ** 2 + m[1] ** 2 + m[2] ** 2, yy = m[4] ** 2 + m[5] ** 2 + m[6] ** 2, zz = m[8] ** 2 + m[9] ** 2 + m[10] ** 2;
  const xy = m[0] * m[4] + m[1] * m[5] + m[2] * m[6], xz = m[0] * m[8] + m[1] * m[9] + m[2] * m[10], yz = m[4] * m[8] + m[5] * m[9] + m[6] * m[10];
  return xy * xy < xx * yy * 1e-10 && xz * xz < xx * zz * 1e-10 && yz * yz < yy * zz * 1e-10;
}
