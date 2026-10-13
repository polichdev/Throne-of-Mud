import * as THREE from 'three';

function cacheIndirectUploads(mesh: THREE.BatchedMesh, prepare: () => void) {
  const internal = mesh as THREE.BatchedMesh & { _indirectTexture: THREE.DataTexture; _multiDrawCount: number };
  const texture = internal._indirectTexture;
  const data = texture.image.data as Uint32Array;
  const nativeUpdate = Object.getOwnPropertyDescriptor(THREE.Texture.prototype, 'needsUpdate')!.set!;
  let uploaded: Uint32Array | null = null;
  let deferred = false, requested = false;
  Object.defineProperty(texture, 'needsUpdate', { configurable: true, set(value: boolean) {
    if (deferred) { requested ||= value; return; }
    if (value) uploaded = null;
    nativeUpdate.call(this, value);
  } });
  return () => {
    if (internal._indirectTexture !== texture || texture.image.data !== data) { prepare(); return; }
    requested = false; deferred = true;
    let completed = false;
    try { prepare(); completed = true; }
    finally {
      deferred = false;
      if (requested) {
        let changed = !completed || uploaded === null;
        if (!changed) for (let i = 0; i < internal._multiDrawCount; i++) {
          if (data[i] !== uploaded![i]) { changed = true; break; }
        }
        if (changed) {
          nativeUpdate.call(texture, true);
          if (completed) { uploaded ??= new Uint32Array(data.length); uploaded.set(data); }
          else uploaded = null;
        }
      }
    }
  };
}

export function cacheBatchedDrawList(mesh: THREE.BatchedMesh): void {
  const prepare = mesh.onBeforeRender;
  const setMatrix = mesh.setMatrixAt;
  const setVisible = mesh.setVisibleAt;
  let revision = 0, preparedRevision = -1;
  let lastCamera: THREE.Camera | null = null;
  const view = new THREE.Matrix4(), projection = new THREE.Matrix4(), world = new THREE.Matrix4();
  let lastWireframe = false, lastCulling = false, lastSorting = false;
  let lastCoordinates: THREE.CoordinateSystem | undefined, lastReversed = false;
  let renderArgs: Parameters<typeof mesh.onBeforeRender>;
  const prepareWithUploads = cacheIndirectUploads(mesh, () => prepare.apply(mesh, renderArgs));
  mesh.setMatrixAt = function (id, matrix) {
    revision++;
    return setMatrix.call(this, id, matrix);
  };
  mesh.setVisibleAt = function (id, visible) {
    if (this.getVisibleAt(id) !== visible) revision++;
    return setVisible.call(this, id, visible);
  };
  mesh.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    const wireframe = Boolean('wireframe' in material && material.wireframe);
    const arrayCamera = 'isArrayCamera' in camera && camera.isArrayCamera;
    const cacheable = !arrayCamera && !material.transparent && this.customSort === null;
    if (cacheable && lastCamera === camera && preparedRevision === revision &&
      view.equals(camera.matrixWorldInverse) && projection.equals(camera.projectionMatrix) && world.equals(this.matrixWorld) &&
      lastWireframe === wireframe && lastCulling === this.perObjectFrustumCulled && lastSorting === this.sortObjects &&
      lastCoordinates === camera.coordinateSystem && lastReversed === camera.reversedDepth) return;
    renderArgs = [renderer, scene, camera, geometry, material, group];
    prepareWithUploads();
    preparedRevision = revision; lastCamera = cacheable ? camera : null;
    view.copy(camera.matrixWorldInverse); projection.copy(camera.projectionMatrix); world.copy(this.matrixWorld);
    lastWireframe = wireframe; lastCulling = this.perObjectFrustumCulled; lastSorting = this.sortObjects;
    lastCoordinates = camera.coordinateSystem; lastReversed = camera.reversedDepth;
  };
}
