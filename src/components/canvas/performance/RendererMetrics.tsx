import { useThree, addEffect, addAfterEffect } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { RENDERING } from '../../../constants/rendering';
import { GpuFrameTimer } from './GpuFrameTimer';
import { getSceneRenderTaskMs, getSceneRenderTaskCount } from './sceneRenderTasks';
import { getScenePointLightPool } from './StablePointLightPool';
import { measureRenderSubmission } from './renderSubmission';

export function RendererMetrics() {
  const { gl, scene: trackedScene, get } = useThree();
  useEffect(() => {
    const timer = new GpuFrameTimer(gl.getContext());
    const originalRender = gl.render;
    let frame = 0, frameStarted = 0, cpuRenderMs = 0, lastPublish = 0;
    let rendered = false;
    let measuring = false, cpuMatrixMs = 0, cpuBatchMs = 0;
    let submissionSample: { cpuMs: number; preparationMs: number; calls: number; timestamp: number } | null = null;
    const originalMatrices = trackedScene.updateMatrixWorld;
    const measuredMatrices: typeof originalMatrices = function (this: THREE.Scene, force) {
      if (!measuring) return originalMatrices.call(this, force);
      const started = performance.now();
      try { originalMatrices.call(this, force); }
      finally { cpuMatrixMs += performance.now() - started; }
    };
    trackedScene.updateMatrixWorld = measuredMatrices;
    let gpuMs: number | null = null;
    let cpuFramePeakMs = 0, cpuRenderPeakMs = 0, simulationPeakMs = 0, shadowRefreshes = 0;
    const before = addEffect(() => { frameStarted = performance.now(); cpuRenderMs = 0; cpuMatrixMs = 0; cpuBatchMs = 0; rendered = false; });
    const measuredRender: typeof gl.render = function (scene, camera) {
      const started = performance.now();
      gpuMs = timer.poll(++frame, started);
      timer.begin(frame);
      if (gl.shadowMap.enabled && (gl.shadowMap.needsUpdate || gl.shadowMap.autoUpdate)) shadowRefreshes++;
      measuring = true;
      const matrixBefore = cpuMatrixMs;
      let submission: { cpuMs: number; calls: number } | null = null;
      try {
        if (frame % RENDERING.submissionSampleFrames === 0) submission = measureRenderSubmission(gl, () => originalRender.call(gl, scene, camera));
        else originalRender.call(gl, scene, camera);
      } finally {
        measuring = false; timer.end();
        const ended = performance.now(), renderMs = ended - started;
        const batchMs = getSceneRenderTaskMs(scene instanceof THREE.Scene ? scene : trackedScene);
        cpuRenderMs += renderMs; cpuBatchMs += batchMs; rendered = true;
        if (submission) submissionSample = { ...submission, timestamp: ended,
          preparationMs: Math.max(0, renderMs - (cpuMatrixMs - matrixBefore) - batchMs - submission.cpuMs) };
      }
    };
    gl.render = measuredRender;
    const after = addAfterEffect(() => {
      const now = performance.now();
      if (!rendered || !frameStarted) return;
      cpuFramePeakMs = Math.max(cpuFramePeakMs, now - frameStarted);
      cpuRenderPeakMs = Math.max(cpuRenderPeakMs, cpuRenderMs);
      simulationPeakMs = Math.max(simulationPeakMs, (window as any).__simulationMs || 0);
      if (now - lastPublish < RENDERING.metricsPublishMs) return;
      lastPublish = now;
      let sceneObjects = 0;
      trackedScene.traverse(() => { sceneObjects++; });
      const lights = getScenePointLightPool(trackedScene).diagnostics;
      (window as any).__renderMetrics = {
        frameSubscribers: get().internal.subscribers.length,
        renderTasks: getSceneRenderTaskCount(trackedScene),
        sceneObjects,
        activePointLights: lights.active,
        pointLightSlots: lights.slots,
        registeredPointLights: lights.registered,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        programs: gl.info.programs?.length ?? 0,
        cpuFrameMs: now - frameStarted,
        cpuRenderMs,
        cpuMatrixMs,
        cpuBatchMs,
        cpuRenderOtherMs: Math.max(0, cpuRenderMs - cpuMatrixMs - cpuBatchMs),
        cpuSubmissionMs: submissionSample && now - submissionSample.timestamp < RENDERING.submissionSampleMaxAgeMs ? submissionSample.cpuMs : null,
        cpuPreparationMs: submissionSample && now - submissionSample.timestamp < RENDERING.submissionSampleMaxAgeMs ? submissionSample.preparationMs : null,
        sampledDrawCalls: submissionSample?.calls ?? 0,
        cpuFramePeakMs,
        cpuRenderPeakMs,
        simulationPeakMs,
        shadowRefreshes,
        gpuMs,
        gpuSupported: timer.supported,
      };
      cpuFramePeakMs = 0; cpuRenderPeakMs = 0; simulationPeakMs = 0; shadowRefreshes = 0;
    });
    return () => {
      before(); after();
      if (gl.render === measuredRender) gl.render = originalRender;
      if (trackedScene.updateMatrixWorld === measuredMatrices) trackedScene.updateMatrixWorld = originalMatrices;
      timer.dispose();
      delete (window as any).__renderMetrics;
    };
  }, [gl, trackedScene, get]);

  return null;
}

