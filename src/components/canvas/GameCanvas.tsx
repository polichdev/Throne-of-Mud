import { Canvas, useFrame, useThree, addEffect, addAfterEffect } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GridMap } from '../../engine/grid/GridMap';
import { GameLoop } from '../../engine/time/GameLoop';
import { TopDownCamera } from './TopDownCamera';
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
  const { gl } = useThree();
  useEffect(() => {
    const timer = new GpuFrameTimer(gl.getContext());
    const originalRender = gl.render;
    let frame = 0, frameStarted = 0, cpuRenderMs = 0, lastPublish = 0;
    let rendered = false;
    let gpuMs: number | null = null;
    const before = addEffect(() => { frameStarted = performance.now(); cpuRenderMs = 0; rendered = false; });
    const measuredRender: typeof gl.render = function (scene, camera) {
      const started = performance.now();
      gpuMs = timer.poll(++frame, started);
      timer.begin(frame);
      try { originalRender.call(gl, scene, camera); }
      finally { timer.end(); cpuRenderMs += performance.now() - started; rendered = true; }
    };
    gl.render = measuredRender;
    const after = addAfterEffect(() => {
      const now = performance.now();
      if (!rendered || !frameStarted || now - lastPublish < 200) return;
      lastPublish = now;
      (window as any).__renderMetrics = {
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        programs: gl.info.programs?.length ?? 0,
        cpuFrameMs: now - frameStarted,
        cpuRenderMs,
        gpuMs,
        gpuSupported: timer.supported,
      };
    });
    return () => {
      before(); after();
      if (gl.render === measuredRender) gl.render = originalRender;
      timer.dispose();
      delete (window as any).__renderMetrics;
    };
  }, [gl]);

  return null;
}

export function GameCanvas({ grid }: Props) {
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
        className="w-full h-full cursor-crosshair"
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

        <TerrainRenderer grid={grid} />
        <ResourceDepositsRenderer grid={grid} />
        <BuildingsRenderer />
        <FoliageRenderer grid={grid} />
        <UnitsRenderer grid={grid} />
        <WoodChipsRenderer />
        <PlacementPreview grid={grid} />
        <WeatherRenderer />
        <StrategicParchmentMapRenderer grid={grid} />
        <MilitiaMarchRenderer grid={grid} />
        <BanditsRenderer />
        <MenuAmbientWalkers grid={grid} />
        <AmbientFaunaRenderer grid={grid} />
        <SpatialAudioListener />
        <RendererMetrics />
      </Canvas>
    </div>
  );
}
