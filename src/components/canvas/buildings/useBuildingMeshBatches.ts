import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { BuildingMeshBatches } from './BuildingMeshBatches';
import { addSceneRenderTask } from '../performance/sceneRenderTasks';
import { syncScenePointLights, removeScenePointLights } from '../performance/StablePointLightPool';

export function useBuildingMeshBatches(rootRef: RefObject<Group | null>) {
  const scene = useThree(state => state.scene);
  const gl = useThree(state => state.gl);
  const batches = useMemo(() => new BuildingMeshBatches(), []);
  const dirty = useRef(true);
  const supported = useMemo(() => gl.extensions?.has('WEBGL_multi_draw') ?? false, [gl]);
  const invalidate = useCallback(() => { dirty.current = true; }, []);

  useLayoutEffect(() => {
    if (supported) scene.add(batches.group);
    const removeTask = addSceneRenderTask(scene, () => {
      if (dirty.current && !rootRef.current) {
        batches.dispose(); removeScenePointLights(scene, batches); dirty.current = false;
      }
      if (dirty.current && rootRef.current) {
        rootRef.current.updateWorldMatrix(true, true);
        if (supported) batches.sync(rootRef.current);
        syncScenePointLights(scene, batches, rootRef.current);
        dirty.current = false;
      }
      if (supported) batches.update();
    });
    return () => { removeTask(); removeScenePointLights(scene, batches); scene.remove(batches.group); batches.dispose(); };
  }, [scene, batches, supported, rootRef]);
  useLayoutEffect(invalidate);
  return invalidate;
}
