import { getBuildingVisibilityDistance } from '../../../constants/rendering';
import * as THREE from 'three';
import type { HouseBatch } from './InstancedHousesRenderer';
import { getHouseWorldMatrix } from './houseTransforms';
import { getPeasantHouseExteriorMaterial } from './models/housing/PeasantHouseModel';
import { cacheBatchedDrawList } from '../performance/batchedDrawCache';

interface Chunk {
  matrices: THREE.Matrix4[];
  bindings: { mesh: THREE.BatchedMesh; id: number }[];
  visible: boolean | null;
}
interface Part {
  chunk: Chunk;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  castShadow: boolean;
  receiveShadow: boolean;
}

export class HouseMultiDrawBatches {
  readonly group = new THREE.Group();
  private chunks: Chunk[] = [];
  private visibleCounts = new Map<THREE.BatchedMesh, number>();

  sync(batches: HouseBatch[], isNight: boolean) {
    this.dispose();
    const groups = new Map<string, Part[]>();
    for (const batch of batches) {
      const chunk: Chunk = { matrices: batch.buildings.map(getHouseWorldMatrix), bindings: [], visible: null };
      this.chunks.push(chunk);
      for (const part of batch.parts) {
        const material = getPeasantHouseExteriorMaterial(part.material, isNight);
        const schema = Object.entries(part.geometry.attributes).sort(([a], [b]) => a.localeCompare(b))
          .map(([name, attr]) => `${name}:${attr.itemSize}:${attr.normalized}:${attr.array.constructor.name}`).join(',');
        const key = `${material.uuid}:${part.castShadow}:${part.receiveShadow}:${schema}`;
        let list = groups.get(key); if (!list) { list = []; groups.set(key, list); }
        list.push({ ...part, material, chunk });
      }
    }
    for (const parts of groups.values()) {
      const originals = [...new Set(parts.map(part => part.geometry))];
      const prepared = originals.map(geometry => {
        const copy = new THREE.BufferGeometry();
        for (const [name, attribute] of Object.entries(geometry.attributes)) copy.setAttribute(name, attribute);
        copy.setIndex(geometry.index ?? new THREE.BufferAttribute(Uint32Array.from({ length: geometry.attributes.position.count }, (_, i) => i), 1));
        return copy;
      });
      const count = parts.reduce((total, part) => total + part.chunk.matrices.length, 0);
      if (!count) { prepared.forEach(geometry => geometry.dispose()); continue; }
      const mesh = new THREE.BatchedMesh(2 ** Math.ceil(Math.log2(count)),
        prepared.reduce((total, geometry) => total + geometry.attributes.position.count, 0),
        prepared.reduce((total, geometry) => total + geometry.index!.count, 0), parts[0].material);
      mesh.castShadow = parts[0].castShadow; mesh.receiveShadow = parts[0].receiveShadow;
      mesh.frustumCulled = false; mesh.raycast = () => {};
      const ids = new Map(originals.map((geometry, i) => [geometry, mesh.addGeometry(prepared[i])]));
      for (const part of parts) for (const matrix of part.chunk.matrices) {
        const id = mesh.addInstance(ids.get(part.geometry)!);
        mesh.setMatrixAt(id, matrix); part.chunk.bindings.push({ mesh, id });
      }
      prepared.forEach(geometry => geometry.dispose());
      cacheBatchedDrawList(mesh);
      this.visibleCounts.set(mesh, 0); this.group.add(mesh);
    }
  }

  update(target: readonly [number, number] | undefined, zoom: number) {
    const distance = getBuildingVisibilityDistance(zoom);
    for (const chunk of this.chunks) {
      const visible = !target || chunk.matrices.some(matrix =>
        (matrix.elements[12] - target[0]) ** 2 + (matrix.elements[14] - target[1]) ** 2 < distance ** 2);
      if (visible === chunk.visible) continue;
      for (const { mesh, id } of chunk.bindings) {
        mesh.setVisibleAt(id, visible);
        this.visibleCounts.set(mesh, this.visibleCounts.get(mesh)! + (visible ? 1 : chunk.visible ? -1 : 0));
      }
      chunk.visible = visible;
    }
    for (const [mesh, count] of this.visibleCounts) mesh.visible = count > 0;
  }

  dispose() {
    for (const mesh of this.visibleCounts.keys()) mesh.dispose();
    this.group.clear(); this.visibleCounts.clear(); this.chunks = [];
  }
}
