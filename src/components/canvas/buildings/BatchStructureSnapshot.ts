import * as THREE from 'three';

type MaterialState = { material: THREE.Material; visible: boolean; transparent: boolean; wireframe: boolean; color?: [number, number, number] };
type AttributeState = { name: string; attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute; count: number; itemSize: number; normalized: boolean; arrayType: Function };
type GeometryState = { geometry: THREE.BufferGeometry; index: THREE.BufferAttribute | null; indexCount: number; start: number; count: number; attributes: AttributeState[]; groups: { start: number; count: number; materialIndex?: number }[]; morphCount: number };
type NodeState = { object: THREE.Object3D; parent: THREE.Object3D | null; childCount: number; allowShear: boolean; lightCast?: boolean; mesh?: THREE.Mesh; geometry?: THREE.BufferGeometry; materials?: THREE.Material[]; multiMaterial?: boolean; layer?: number; cast?: boolean; receive?: boolean; order?: number; cull?: boolean; morphCount?: number; depth?: THREE.Material; distance?: THREE.Material };

export class BatchStructureSnapshot {
  private nodes: NodeState[] = [];
  private geometries = new Map<THREE.BufferGeometry, GeometryState>();
  private materials = new Map<THREE.Material, MaterialState>();

  constructor(root: THREE.Object3D, originalLayers: Map<THREE.Mesh, number>) {
    root.traverse(object => {
      const state: NodeState = { object, parent: object.parent, childCount: object.children.length, allowShear: object.userData.allowShearedBatching === true };
      if (object instanceof THREE.PointLight) state.lightCast = object.castShadow;
      if (object instanceof THREE.Mesh && !(object instanceof THREE.InstancedMesh) && !(object instanceof THREE.BatchedMesh) && !(object instanceof THREE.SkinnedMesh)) {
        const mesh = object, geometry = mesh.geometry;
        const materials = Array.isArray(mesh.material) ? mesh.material.slice() : [mesh.material];
        Object.assign(state, { mesh, geometry, materials, multiMaterial: Array.isArray(mesh.material), layer: originalLayers.get(mesh) ?? mesh.layers.mask,
          cast: mesh.castShadow, receive: mesh.receiveShadow, order: mesh.renderOrder, cull: mesh.frustumCulled,
          morphCount: mesh.morphTargetInfluences?.length ?? 0, depth: mesh.customDepthMaterial, distance: mesh.customDistanceMaterial });
        if (!this.geometries.has(geometry)) this.geometries.set(geometry, this.captureGeometry(geometry));
        for (const material of materials) if (!this.materials.has(material)) {
          const color = 'color' in material && material.color instanceof THREE.Color ? material.color : null;
          this.materials.set(material, { material, visible: material.visible, transparent: material.transparent,
            wireframe: 'wireframe' in material && Boolean(material.wireframe), color: color ? [color.r, color.g, color.b] : undefined });
        }
      }
      this.nodes.push(state);
    });
  }

  matches(root: THREE.Object3D, originalLayers: Map<THREE.Mesh, number>): boolean {
    let index = 0, matches = true;
    root.traverse(object => {
      if (!matches) return;
      const state = this.nodes[index++];
      if (!state || state.object !== object || state.parent !== object.parent || state.childCount !== object.children.length || state.allowShear !== (object.userData.allowShearedBatching === true)) { matches = false; return; }
      if (object instanceof THREE.PointLight && state.lightCast !== object.castShadow) { matches = false; return; }
      const mesh = state.mesh;
      if (!mesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : null;
      if (mesh.geometry !== state.geometry || Boolean(materials) !== state.multiMaterial || (materials ? materials.length !== state.materials!.length || materials.some((m, i) => m !== state.materials![i]) : state.materials!.length !== 1 || mesh.material !== state.materials![0]) ||
        mesh.castShadow !== state.cast || mesh.receiveShadow !== state.receive || mesh.renderOrder !== state.order || mesh.frustumCulled !== state.cull ||
        (mesh.morphTargetInfluences?.length ?? 0) !== state.morphCount || mesh.customDepthMaterial !== state.depth || mesh.customDistanceMaterial !== state.distance ||
        (originalLayers.get(mesh) ?? mesh.layers.mask) !== state.layer) matches = false;
    });
    if (!matches || index !== this.nodes.length) return false;
    for (const state of this.materials.values()) {
      const m = state.material;
      if (m.visible !== state.visible || m.transparent !== state.transparent || ('wireframe' in m && Boolean(m.wireframe)) !== state.wireframe) return false;
      const color = 'color' in m && m.color instanceof THREE.Color ? m.color : null;
      if (state.color ? !color || color.r !== state.color[0] || color.g !== state.color[1] || color.b !== state.color[2] : Boolean(color)) return false;
    }
    for (const state of this.geometries.values()) {
      const g = state.geometry;
      if (g.index !== state.index || (g.index?.count ?? 0) !== state.indexCount || g.drawRange.start !== state.start || g.drawRange.count !== state.count ||
        Object.keys(g.morphAttributes).length !== state.morphCount || g.groups.length !== state.groups.length) return false;
      for (let i = 0; i < state.groups.length; i++) {
        const a = g.groups[i], b = state.groups[i];
        if (a.start !== b.start || a.count !== b.count || a.materialIndex !== b.materialIndex) return false;
      }
      if (Object.keys(g.attributes).length !== state.attributes.length) return false;
      for (const a of state.attributes) {
        const current = g.attributes[a.name];
        if (current !== a.attribute || current.count !== a.count || current.itemSize !== a.itemSize || current.normalized !== a.normalized || current.array.constructor !== a.arrayType) return false;
      }
    }
    return true;
  }

  private captureGeometry(geometry: THREE.BufferGeometry): GeometryState {
    return { geometry, index: geometry.index, indexCount: geometry.index?.count ?? 0, start: geometry.drawRange.start, count: geometry.drawRange.count,
      attributes: Object.entries(geometry.attributes).map(([name, attribute]) => ({ name, attribute, count: attribute.count,
        itemSize: attribute.itemSize, normalized: attribute.normalized, arrayType: attribute.array.constructor })),
      groups: geometry.groups.map(group => ({ ...group })), morphCount: Object.keys(geometry.morphAttributes).length };
  }
}
