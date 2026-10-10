import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';

interface Patch {
  original: THREE.Object3D['updateMatrixWorld'];
  culled: THREE.Object3D['updateMatrixWorld'];
  owners: number;
}
const patches = new WeakMap<THREE.Object3D, Patch>();

export function cullHiddenGroupMatrices(root: THREE.Object3D): () => void {
  const owned: THREE.Object3D[] = [];
  root.traverse(node => {
    if (!(node instanceof THREE.Group)) return;
    let patch = patches.get(node);
    if (!patch) {
      const original = node.updateMatrixWorld;
      const culled: THREE.Object3D['updateMatrixWorld'] = function (this: THREE.Object3D, force) {
        if (!this.visible) return;
        original.call(this, force);
      };
      patch = { original, culled, owners: 0 };
      patches.set(node, patch);
      node.updateMatrixWorld = culled;
    }
    patch.owners++;
    owned.push(node);
  });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const node of owned) {
      const patch = patches.get(node);
      if (!patch || --patch.owners > 0) continue;
      if (node.updateMatrixWorld === patch.culled) node.updateMatrixWorld = patch.original;
      patches.delete(node);
    }
  };
}

export function useHiddenGroupCulling(rootRef: RefObject<THREE.Group | null>): void {
  useLayoutEffect(() => {
    if (rootRef.current) return cullHiddenGroupMatrices(rootRef.current);
  });
}
