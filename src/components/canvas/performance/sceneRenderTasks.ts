import type { Scene } from 'three';

const registries = new WeakMap<Scene, { original: Scene['onBeforeRender']; wrapper: Scene['onBeforeRender']; tasks: Set<() => void>; durationMs: number }>();

export function getSceneRenderTaskMs(scene: Scene): number { return registries.get(scene)?.durationMs ?? 0; }
export function getSceneRenderTaskCount(scene: Scene): number { return registries.get(scene)?.tasks.size ?? 0; }

export function addSceneRenderTask(scene: Scene, task: () => void) {
  let registry = registries.get(scene);
  if (!registry) {
    const original = scene.onBeforeRender;
    const tasks = new Set<() => void>();
    const wrapper: Scene['onBeforeRender'] = function (this: Scene, ...args) {
      original.apply(this, args);
      const started = performance.now();
      try { for (const update of tasks) update(); }
      finally { registry!.durationMs = performance.now() - started; }
    };
    registry = { original, wrapper, tasks, durationMs: 0 };
    registries.set(scene, registry);
    scene.onBeforeRender = wrapper;
  }
  const active = registry;
  active.tasks.add(task);
  return () => {
    active.tasks.delete(task);
    if (active.tasks.size) return;
    if (scene.onBeforeRender === active.wrapper) scene.onBeforeRender = active.original;
    registries.delete(scene);
  };
}
