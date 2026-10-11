import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { addSceneRenderTask } from './sceneRenderTasks';
import { getScenePointLightPool } from './StablePointLightPool';

export function StablePointLights() {
  const scene = useThree(state => state.scene), camera = useThree(state => state.camera);
  useLayoutEffect(() => {
    const pool = getScenePointLightPool(scene);
    pool.start(); scene.add(pool.group);
    const removeTask = addSceneRenderTask(scene, () => pool.update(camera));
    return () => { removeTask(); scene.remove(pool.group); pool.stop(); };
  }, [scene, camera]);
  return null;
}
