import { RendererMetrics } from './performance/RendererMetrics';
import { SIMULATION } from '../../constants/simulation';
import { RENDERING } from '../../constants/rendering';
import { CAMERA_CLIPPING } from '../../constants/camera';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useState } from 'react';
import * as THREE from 'three';
import { GridMap } from '../../engine/grid/GridMap';
import { GameLoop } from '../../engine/time/GameLoop';
import { TopDownCamera } from './TopDownCamera';
import { BuildingInspectorAnchor } from './BuildingInspectorAnchor';
import { DayNightLighting } from './DayNightLighting';
import { TerrainRenderer } from './TerrainRenderer';
import { FoliageRenderer } from './FoliageRenderer';
import { BuildingsRenderer } from './BuildingsRenderer';
import { UnitsRenderer } from './units';
import { MilitiaMarchRenderer } from './units';
import { BanditsRenderer } from './units';
import { WoodChipsRenderer } from './WoodChipsRenderer';
import { PlacementPreview } from './PlacementPreview';
import { ResourceDepositsRenderer } from './ResourceDepositsRenderer';
import { StrategicParchmentMapRenderer } from './StrategicParchmentMapRenderer';
import { MapEdgeFog } from './MapEdgeFog';
import { MenuAmbientWalkers } from './units';
import { WeatherRenderer } from './WeatherRenderer';
import { SpatialAudioListener } from './SpatialAudioListener';
import { AmbientFaunaRenderer } from './fauna/AmbientFaunaRenderer';
import { StablePointLights } from './performance/StablePointLights';

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
  const loop = useMemo(() => new GameLoop(grid), [grid]);

  useFrame((_, delta) => {
    loop.step(delta);
  }, SIMULATION.framePriority);

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
        dpr={RENDERING.pixelRatio}
        orthographic
        camera={{
          position: [center[0] + CAMERA_INITIAL_OFFSET, CAMERA_HEIGHT, center[1] + CAMERA_INITIAL_OFFSET],
          zoom: cameraZoomTarget ?? DEFAULT_CAMERA_ZOOM,
          near: CAMERA_CLIPPING.near,
          far: CAMERA_CLIPPING.far,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: RENDERING.exposure,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        className={`w-full h-full cursor-crosshair ${worldInteractive || isStrategicView ? 'cursor-world-interactive' : ''}`}
      >
        <color attach="background" args={[isStrategicView ? RENDERING.strategicBackground : RENDERING.background]} />

        <Suspense fallback={null}>
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
        </Suspense>
      </Canvas>
    </div>
  );
}
