import { useRef, memo, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildingEntities } from '../../engine/ecs/world';
import type { GameEntity } from '../../engine/ecs/world';
import { BUILDING_BLUEPRINTS } from '../../engine/buildings/blueprints';
import { useGameStore } from '../../store/useGameStore';
import {
  TentModel,
  LumberjackHutModel,
  CampfireModel,
  PeasantHouseModel,
  MarketModel,
  ManorModel,
  StockpileModel,
  WheatFarmModel,
  WindmillModel,
  BakeryModel,
  BreweryModel,
  BarracksModel,
  WoodenWallModel,
  WoodenGateModel,
  StoneWallModel,
  ConstructionScaffold,
  DemolitionHUD,
  FishermansHutModel,
  ForagersHutModel,
  HuntersHutModel,
  IronMineModel,
  StoneQuarryModel,
  ClayPitModel,
  SaltWorksModel,
  CharcoalKilnModel,
  IronSmelterModel,
  StonecutterModel,
  BrickworksModel,
  SawmillModel,
  WeaversWorkshopModel,
  ForestersHutModel,
  WoodenChurchModel,
  TavernModel,
  HitchingPostModel,
} from './buildings/models';
import { InstancedWallsRenderer } from './buildings/InstancedWallsRenderer';

const UNIT_BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
const SELECT_RING_GEO = new THREE.RingGeometry(0.52, 0.6, 32);
const SELECT_RING_MAT = new THREE.MeshBasicMaterial({ color: '#fbbf24', transparent: true, opacity: 0.8, side: THREE.DoubleSide });
const INVISIBLE_MAT = new THREE.MeshBasicMaterial({ visible: false });

interface BuildingFrameState {
  groupRef: React.RefObject<THREE.Group | null>;
  centerX: number;
  centerZ: number;
}
const _buildingFrameStates = new Map<string, BuildingFrameState>();

export function BuildingsRenderer() {
  const selectedEntityId = useGameStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useGameStore((state) => state.setSelectedEntityId);
  const buildingVersion = useGameStore((state) => state.buildingVersion);
  const isStrategicView = useGameStore((state) => state.isStrategicView);

  const { completedWoodenWalls, completedStoneWalls, standardBuildings } = useMemo(() => {
    const wooden: GameEntity[] = [];
    const stone: GameEntity[] = [];
    const standard: GameEntity[] = [];

    for (const b of buildingEntities) {
      const isSelected = selectedEntityId === b.id;
      const isCompleted = Boolean(b.isCompleted || (b.constructionProgress || 0) >= 100);
      const isDemolishing = Boolean(b.isDemolishing);

      if (b.buildingType === 'wooden_wall' && isCompleted && !isSelected && !isDemolishing) {
        wooden.push(b);
      } else if (b.buildingType === 'stone_wall' && isCompleted && !isSelected && !isDemolishing) {
        stone.push(b);
      } else {
        standard.push(b);
      }
    }
    return {
      completedWoodenWalls: wooden,
      completedStoneWalls: stone,
      standardBuildings: standard,
    };
  }, [buildingVersion, selectedEntityId]);

  const statesArrayRef = useRef<BuildingFrameState[]>([]);
  const lastStatesSize = useRef(0);

  useFrame(() => {
    const camTarget = (window as any).__lastCameraTarget;
    const zoom = (window as any).__lastCameraZoom || 38;
    const maxDist = Math.max(38, Math.min(50, (1200 / zoom) + 12));
    const maxDistSq = maxDist * maxDist;

    if (_buildingFrameStates.size !== lastStatesSize.current) {
      statesArrayRef.current = Array.from(_buildingFrameStates.values());
      lastStatesSize.current = _buildingFrameStates.size;
    }
    const states = statesArrayRef.current;
    if (states.length === 0) return;

    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      if (!s?.groupRef.current) continue;

      if (camTarget) {
        const distSq = (s.centerX - camTarget[0]) ** 2 + (s.centerZ - camTarget[1]) ** 2;
        const isVisible = distSq < maxDistSq;
        if (s.groupRef.current.visible !== isVisible) {
          s.groupRef.current.visible = isVisible;
        }
      }
    }
  });

  return (
    <group visible={!isStrategicView}>
      <InstancedWallsRenderer
        woodenWalls={completedWoodenWalls}
        stoneWalls={completedStoneWalls}
        onSelect={setSelectedEntityId}
      />
      {standardBuildings.map((building) => (
        <Building3DMemo
          key={building.id}
          building={building}
          isSelected={selectedEntityId === building.id}
          onSelect={setSelectedEntityId}
        />
      ))}
    </group>
  );
}

function Building3D({
  building,
  isSelected,
  onSelect,
}: {
  building: GameEntity;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const pos = building.position || [0, 0, 0];
  const width = building.buildingWidth || 1;
  const height = building.buildingHeight || 1;
  const [completed, setCompleted] = useState(() => Boolean(building.isCompleted || (building.constructionProgress || 0) >= 100));
  const progress = building.constructionProgress || 0;
  const type = building.buildingType || 'peasant_house';

  const groupRef = useRef<THREE.Group>(null);
  const roofRef = useRef<THREE.Group>(null);
  const interiorRef = useRef<THREE.Group>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const isNight = useGameStore((state) => {
    const h = state.time?.hour ?? 12;
    return h >= 20 || h < 6;
  });
  const isLightOn = isNight && completed;
  const isWorking = !isNight && completed;

  const [centerX, centerZ] = useMemo(() => {
    const bx = building.gridPosition ? building.gridPosition[0] : pos[0] - width / 2;
    const bz = building.gridPosition ? building.gridPosition[1] : pos[2] - height / 2;
    const bWidth = building.buildingWidth || width || 2;
    const bHeight = building.buildingHeight || height || 2;
    return [bx + bWidth / 2, bz + bHeight / 2];
  }, [building.gridPosition, pos, width, height, building.buildingWidth, building.buildingHeight]);

  const frameStateRef = useRef<BuildingFrameState | null>(null);
  if (!frameStateRef.current) {
    frameStateRef.current = {
      groupRef,
      centerX,
      centerZ,
    };
    _buildingFrameStates.set(building.id, frameStateRef.current);
  }
  frameStateRef.current.centerX = centerX;
  frameStateRef.current.centerZ = centerZ;

  useEffect(() => {
    _buildingFrameStates.set(building.id, frameStateRef.current!);
    return () => {
      _buildingFrameStates.delete(building.id);
    };
  }, [building.id]);

  useEffect(() => {
    if (roofRef.current) roofRef.current.visible = !isSelected;
    if (interiorRef.current) interiorRef.current.visible = isSelected;
  }, [isSelected]);

  useEffect(() => {
    if (completed && groupRef.current) {
      groupRef.current.matrixAutoUpdate = false;
      groupRef.current.updateMatrix();
    }
  }, [completed]);

  useFrame(() => {
    if (completed && !building.isDemolishing && !isSelected) return;

    if (!completed && (building.isCompleted || (building.constructionProgress || 0) >= 100)) {
      setCompleted(true);
      return;
    }

    if (building.isDemolishing && progressTextRef.current && progressBarRef.current) {
      const curProg = Math.round(building.demolitionProgress || 0);
      progressTextRef.current.innerText = `💣 ${curProg}%`;
      progressBarRef.current.style.width = `${Math.max(4, curProg)}%`;
    } else if (!completed && progressTextRef.current && progressBarRef.current) {
      const curProg = Math.round(building.constructionProgress || 0);
      progressTextRef.current.innerText = `🔨 ${curProg}%`;
      progressBarRef.current.style.width = `${Math.max(4, curProg)}%`;
    }
  });

  const posY = pos[1] !== undefined ? pos[1] : 0.05;

  function renderBuildingModel() {
    switch (type) {
      case 'tent':
        return <TentModel isLightOn={isLightOn} roofRef={roofRef} />;
      case 'lumberjack_hut':
        return <LumberjackHutModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'campfire':
        return <CampfireModel />;
      case 'hitching_post':
        return <HitchingPostModel isLightOn={isLightOn} building={building} roofRef={roofRef} />;
      case 'peasant_house':
        return <PeasantHouseModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'market':
        return <MarketModel roofRef={roofRef} />;
      case 'manor':
        return <ManorModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'stockpile':
        return <StockpileModel isLightOn={isLightOn} roofRef={roofRef} />;
      case 'wheat_farm':
        return <WheatFarmModel building={building} />;
      case 'windmill':
        return <WindmillModel isWorking={isWorking} />;
      case 'bakery':
        return <BakeryModel isLightOn={isLightOn} isWorking={isWorking} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'brewery':
        return <BreweryModel isLightOn={isLightOn} isWorking={isWorking} roofRef={roofRef} />;
      case 'barracks':
        return <BarracksModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'wooden_wall':
        return <WoodenWallModel />;
      case 'wooden_gate':
        return <WoodenGateModel />;
      case 'stone_wall':
        return <StoneWallModel />;
      case 'fishermans_hut':
        return <FishermansHutModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'foragers_hut':
        return <ForagersHutModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'hunters_hut':
        return <HuntersHutModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'iron_mine':
        return <IronMineModel isLightOn={isLightOn} isWorking={isWorking} roofRef={roofRef} />;
      case 'stone_quarry':
        return <StoneQuarryModel isLightOn={isLightOn} roofRef={roofRef} />;
      case 'clay_pit':
        return <ClayPitModel isLightOn={isLightOn} roofRef={roofRef} />;
      case 'salt_works':
        return <SaltWorksModel isLightOn={isLightOn} isWorking={isWorking} roofRef={roofRef} />;
      case 'charcoal_kiln':
        return <CharcoalKilnModel isLightOn={isLightOn} isWorking={isWorking} roofRef={roofRef} />;
      case 'iron_smelter':
        return <IronSmelterModel isLightOn={isLightOn} isWorking={isWorking} roofRef={roofRef} />;
      case 'stonecutter':
        return <StonecutterModel isLightOn={isLightOn} roofRef={roofRef} />;
      case 'brickworks':
        return <BrickworksModel isLightOn={isLightOn} isWorking={isWorking} roofRef={roofRef} />;
      case 'sawmill':
        return <SawmillModel isLightOn={isLightOn} roofRef={roofRef} />;
      case 'weavers_workshop':
        return <WeaversWorkshopModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'foresters_hut':
        return <ForestersHutModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'wooden_church':
        return <WoodenChurchModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
      case 'tavern':
        return <TavernModel isLightOn={isLightOn} isWorking={isWorking} roofRef={roofRef} interiorRef={interiorRef} />;
      default:
        return <PeasantHouseModel isLightOn={isLightOn} roofRef={roofRef} interiorRef={interiorRef} />;
    }
  }

  const bp = type ? (BUILDING_BLUEPRINTS as any)[type] : null;
  const baseW = bp?.width || width;
  const baseH = bp?.height || height;
  const rotationAngle = building.rotationAngle || 0;

  return (
    <group
      ref={groupRef}
      position={[
        building.position ? building.position[0] : (building.gridPosition ? building.gridPosition[0] + width / 2 : pos[0]),
        posY,
        building.position ? building.position[2] : (building.gridPosition ? building.gridPosition[1] + height / 2 : pos[2]),
      ]}
      rotation={[0, rotationAngle, 0]}
    >
      <group raycast={() => null}>
        {completed ? (
          renderBuildingModel()
        ) : (
          <ConstructionScaffold
            type={type}
            width={baseW}
            height={baseH}
            progress={progress}
            progressTextRef={progressTextRef}
            progressBarRef={progressBarRef}
          />
        )}
      </group>

        <mesh
          position={[0, Math.max(1.0, baseH * 0.35), 0]}
          geometry={UNIT_BOX_GEO}
          material={INVISIBLE_MAT}
          scale={[baseW * 0.98, Math.max(2.4, baseH * 0.8), baseH * 0.98]}
          onPointerDown={(e) => {
            if (e.button === 0) {
              e.stopPropagation();
              onSelect(building.id);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(building.id);
          }}
        />

        {completed && building.isDemolishing && (
          <DemolitionHUD
            demolitionProgress={building.demolitionProgress || 0}
            progressTextRef={progressTextRef}
            progressBarRef={progressBarRef}
          />
        )}

        {isSelected && (
          <mesh
            position={[0, 0.008, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            geometry={SELECT_RING_GEO}
            material={SELECT_RING_MAT}
            scale={[Math.min(width, height), Math.min(width, height), 1]}
          />
        )}
    </group>
  );
}

const Building3DMemo = memo(Building3D, (prev, next) => {
  return (
    prev.building.id === next.building.id &&
    prev.isSelected === next.isSelected &&
    prev.building.buildingType === next.building.buildingType &&
    prev.building.rotationAngle === next.building.rotationAngle &&
    prev.building.buildingWidth === next.building.buildingWidth &&
    prev.building.buildingHeight === next.building.buildingHeight &&
    prev.building.isCompleted === next.building.isCompleted &&
    prev.building.constructionProgress === next.building.constructionProgress &&
    prev.building.isDemolishing === next.building.isDemolishing &&
    prev.building.mulesCount === next.building.mulesCount
  );
});
