import * as THREE from 'three';

export function cacheBatchedDrawList(mesh: THREE.BatchedMesh): void {
  const prepare = mesh.onBeforeRender;
  const setMatrix = mesh.setMatrixAt;
  const setVisible = mesh.setVisibleAt;
  let revision = 0, preparedRevision = -1;
  let lastCamera: THREE.Camera | null = null;
  const view = new THREE.Matrix4(), projection = new THREE.Matrix4(), world = new THREE.Matrix4();
  let lastWireframe = false, lastCulling = false, lastSorting = false;
  let lastCoordinates: THREE.CoordinateSystem | undefined, lastReversed = false;
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
    prepare.call(this, renderer, scene, camera, geometry, material, group);
    preparedRevision = revision; lastCamera = cacheable ? camera : null;
    view.copy(camera.matrixWorldInverse); projection.copy(camera.projectionMatrix); world.copy(this.matrixWorld);
    lastWireframe = wireframe; lastCulling = this.perObjectFrustumCulled; lastSorting = this.sortObjects;
    lastCoordinates = camera.coordinateSystem; lastReversed = camera.reversedDepth;
  };
}
