import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';

export function useStaticUnitMeshMatrices(root: RefObject<THREE.Group | null>): void {
  useLayoutEffect(() => {
    const meshes: { mesh: THREE.Mesh; autoUpdate: boolean }[] = [];
    root.current?.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      meshes.push({ mesh: node, autoUpdate: node.matrixAutoUpdate });
      node.updateMatrix();
      node.matrixAutoUpdate = false;
    });
    return () => {
      for (const { mesh, autoUpdate } of meshes) mesh.matrixAutoUpdate = autoUpdate;
    };
  });
}
