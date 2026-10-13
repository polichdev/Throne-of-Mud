import { Canvas, useFrame, useThree, addEffect, addAfterEffect } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GridMap } from '../../engine/grid/GridMap';
import { GameLoop } from '../../engine/time/GameLoop';
import { TopDownCamera } from './TopDownCamera';
import { BuildingInspectorAnchor } from './BuildingInspectorAnchor';
import { DayNightLighting } from './DayNightLighting';
import { TerrainRenderer } from './TerrainRenderer';
import { FoliageRenderer } from './FoliageRenderer';
import { BuildingsRenderer } from './BuildingsRenderer';
import { UnitsRenderer } from './UnitsRenderer';
import { MilitiaMarchRenderer } from './MilitiaMarchRenderer';
import { BanditsRenderer } from './BanditsRenderer';
import { WoodChipsRenderer } from './WoodChipsRenderer';
import { PlacementPreview } from './PlacementPreview';
import { ResourceDepositsRenderer } from './ResourceDepositsRenderer';
import { StrategicParchmentMapRenderer } from './StrategicParchmentMapRenderer';
import { MapEdgeFog } from './MapEdgeFog';
import { MenuAmbientWalkers } from './MenuAmbientWalkers';
import { WeatherRenderer } from './WeatherRenderer';
import { SpatialAudioListener } from './SpatialAudioListener';
import { AmbientFaunaRenderer } from './fauna/AmbientFaunaRenderer';
import { GpuFrameTimer } from './performance/GpuFrameTimer';
import { getSceneRenderTaskMs, getSceneRenderTaskCount } from './performance/sceneRenderTasks';
import { getScenePointLightPool } from './performance/StablePointLightPool';
import { StablePointLights } from './performance/StablePointLights';
import { measureRenderSubmission } from './performance/renderSubmission';

import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../engine/audio/AudioManager';
import {
  DEFAULT_CAMERA_ZOOM,
  CAMERA_HEIGHT,
  CAMERA_INITIAL_OFFSET,
} from '../../constants/camera';

interface Props {
  grid: GridMap;
}

function GameLoopSync({ grid }: { grid: GridMap }) {
  const loopRef = useRef<GameLoop | null>(null);
  if (!loopRef.current) {
    loopRef.current = new GameLoop(grid);
  }

  useFrame((_, delta) => {
    loopRef.current?.step(delta);
  }, -100);

  return null;
}

function RendererMetrics() {
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
        if (frame % 16 === 0) submission = measureRenderSubmission(gl, () => originalRender.call(gl, scene, camera));
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
      if (now - lastPublish < 200) return;
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
        cpuSubmissionMs: submissionSample && now - submissionSample.timestamp < 2000 ? submissionSample.cpuMs : null,
        cpuPreparationMs: submissionSample && now - submissionSample.timestamp < 2000 ? submissionSample.preparationMs : null,
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

export function GameCanvas({ grid }: Props) {
  const [worldInteractive, setWorldInteractive] = useState(false);
  const playerSpawnPoint = useGameStore((state) => state.playerSpawnPoint);
  const cameraFocusTarget = useGameStore((state) => state.cameraFocusTarget);
  const cameraZoomTarget = useGameStore((state) => state.cameraZoomTarget);
  const isStrategicView = useGameStore((state) => state.isStrategicView);
  const center = useMemo<[number, number]>(() => cameraFocusTarget || playerSpawnPoint || [grid.width / 2, grid.height / 2], [cameraFocusTarget, playerSpawnPoint, grid.width, grid.height]);

  return (
    <div
      className="w-full h-full relative z-0"
      style={{ isolation: 'isolate' }}
      onContextMenu={(e) => {
        if (useGameStore.getState().selectedMilitiaSquadId) {
          e.preventDefault();
          useGameStore.getState().setSelectedMilitiaSquadId(null);
          if (useGameStore.getState().activeMenuTab === 'military') {
            useGameStore.getState().setActiveMenuTab(null);
          }
          useGameStore.getState().setHoveredTile(null);
          audioManager.playUIPanelClose();
        }
      }}
    >
      <Canvas
        shadows
        dpr={1}
        orthographic
        camera={{
          position: [center[0] + CAMERA_INITIAL_OFFSET, CAMERA_HEIGHT, center[1] + CAMERA_INITIAL_OFFSET],
          zoom: cameraZoomTarget ?? DEFAULT_CAMERA_ZOOM,
          near: -500,
          far: 3000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        className={`w-full h-full cursor-crosshair ${worldInteractive || isStrategicView ? 'cursor-world-interactive' : ''}`}
      >
        <color attach="background" args={[isStrategicView ? '#18120c' : '#090d16']} />

        <GameLoopSync grid={grid} />

        <MapEdgeFog mapWidth={grid.width} mapHeight={grid.height} />

        <TopDownCamera
          initialCenter={center}
          mapWidth={grid.width}
          mapHeight={grid.height}
        />

        <DayNightLighting />
        <BuildingInspectorAnchor />

        <TerrainRenderer grid={grid} />
        <group onPointerOver={() => setWorldInteractive(true)} onPointerOut={() => setWorldInteractive(false)}>
          <ResourceDepositsRenderer grid={grid} />
          <BuildingsRenderer />
          <UnitsRenderer grid={grid} />
        </group>
        <FoliageRenderer grid={grid} />
        <WoodChipsRenderer />
        <PlacementPreview grid={grid} />
        <WeatherRenderer />
        <StrategicParchmentMapRenderer grid={grid} />
        <MilitiaMarchRenderer grid={grid} />
        <BanditsRenderer />
        <MenuAmbientWalkers grid={grid} />
        <AmbientFaunaRenderer grid={grid} />
        <StablePointLights />
        <SpatialAudioListener />
        <RendererMetrics />
      </Canvas>
    </div>
  );
}
