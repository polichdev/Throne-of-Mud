import type { WebGLRenderer } from 'three';

export function measureRenderSubmission(renderer: WebGLRenderer, render: () => void, now = () => performance.now()) {
  const original = renderer.renderBufferDirect;
  let cpuMs = 0, calls = 0;
  let shadowCalls = 0, shadowCpuMs = 0;
  const kinds = { batched: 0, instanced: 0, other: 0 };
  const measured: typeof original = function (...args) {
    const started = now();
    try { original.apply(renderer, args); }
    finally {
      const elapsed = now() - started;
      cpuMs += elapsed; calls++;
      if (args[1] === null) { shadowCalls++; shadowCpuMs += elapsed; }
      const object = args[4];
      if ('isBatchedMesh' in object && object.isBatchedMesh) kinds.batched++;
      else if ('isInstancedMesh' in object && object.isInstancedMesh) kinds.instanced++;
      else kinds.other++;
    }
  };
  renderer.renderBufferDirect = measured;
  try { render(); }
  finally { if (renderer.renderBufferDirect === measured) renderer.renderBufferDirect = original; }
  return { cpuMs, calls, kinds, shadowCalls, shadowCpuMs };
}
