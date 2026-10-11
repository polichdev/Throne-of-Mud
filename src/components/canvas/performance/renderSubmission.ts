import type { WebGLRenderer } from 'three';

export function measureRenderSubmission(renderer: WebGLRenderer, render: () => void, now = () => performance.now()) {
  const original = renderer.renderBufferDirect;
  let cpuMs = 0, calls = 0;
  const measured: typeof original = function (...args) {
    const started = now();
    try { original.apply(renderer, args); }
    finally { cpuMs += now() - started; calls++; }
  };
  renderer.renderBufferDirect = measured;
  try { render(); }
  finally { if (renderer.renderBufferDirect === measured) renderer.renderBufferDirect = original; }
  return { cpuMs, calls };
}
