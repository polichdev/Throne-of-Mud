import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatedMeshBatches } from './AnimatedMeshBatches';
import { BuildingMeshBatches } from '../buildings/BuildingMeshBatches';
import { addSceneRenderTask } from '../performance/sceneRenderTasks';

export function useAnimatedMeshBatches(rootRef: RefObject<THREE.Group | null>) {
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);
  const gl = useThree(state => state.gl);
  const multiDraw = useMemo(() => gl.extensions?.has('WEBGL_multi_draw') ?? false, [gl]);
  const batches = useMemo(() => multiDraw ? new BuildingMeshBatches() : new AnimatedMeshBatches(), [multiDraw]);
  const dirty = useRef(true);
  const invalidate = useCallback(() => { dirty.current = true; }, []);

  useLayoutEffect(() => {
    scene.add(batches.group);
    const removeTask = addSceneRenderTask(scene, () => {
      if (dirty.current && rootRef.current) {
        rootRef.current.updateWorldMatrix(true, true);
        batches.sync(rootRef.current);
        dirty.current = false;
      }
      if (batches instanceof AnimatedMeshBatches) batches.update(camera);
      else batches.update();
    });
    return () => {
      removeTask();
      scene.remove(batches.group);
      batches.dispose();
    };
  }, [scene, camera, batches, rootRef]);

  useLayoutEffect(() => {
    dirty.current = true;
  });
  return invalidate;
}
