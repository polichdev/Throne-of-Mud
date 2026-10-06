import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { BuildingType } from '../../../types/game';
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
  TradingPostModel,
} from './models';

interface BuildingPlacementGhostProps {
  type: BuildingType;
  allowed: boolean;
  width: number;
  height: number;
}

export const BuildingPlacementGhost: React.FC<BuildingPlacementGhostProps> = React.memo(({
  type,
  allowed,
  width,
  height,
}) => {
  const dummyFarm = useMemo(() => ({
    id: 'ghost-farm',
    buildingType: 'wheat_farm' as BuildingType,
    buildingWidth: width,
    buildingHeight: height,
    productionProgress: 100,
  }), [width, height]);

  function renderModel() {
    switch (type) {
      case 'tent':
        return <TentModel />;
      case 'lumberjack_hut':
        return <LumberjackHutModel isLightOn={false} />;
      case 'campfire':
        return <CampfireModel />;
      case 'peasant_house':
        return <PeasantHouseModel isLightOn={false} />;
      case 'market':
        return <MarketModel />;
      case 'manor':
        return <ManorModel isLightOn={false} />;
      case 'stockpile':
        return <StockpileModel />;
      case 'wheat_farm':
        return <WheatFarmModel building={dummyFarm as any} />;
      case 'windmill':
        return <WindmillModel />;
      case 'bakery':
        return <BakeryModel isLightOn={false} />;
      case 'brewery':
        return <BreweryModel isLightOn={false} />;
      case 'barracks':
        return <BarracksModel isLightOn={false} />;
      case 'wooden_wall':
        return <WoodenWallModel />;
      case 'wooden_gate':
        return <WoodenGateModel />;
      case 'stone_wall':
        return <StoneWallModel />;
      case 'fishermans_hut':
        return <FishermansHutModel isLightOn={false} />;
      case 'foragers_hut':
        return <ForagersHutModel isLightOn={false} />;
      case 'hunters_hut':
        return <HuntersHutModel isLightOn={false} />;
      case 'iron_mine':
        return <IronMineModel isLightOn={false} />;
      case 'stone_quarry':
        return <StoneQuarryModel isLightOn={false} />;
      case 'clay_pit':
        return <ClayPitModel isLightOn={false} />;
      case 'salt_works':
        return <SaltWorksModel isLightOn={false} />;
      case 'charcoal_kiln':
        return <CharcoalKilnModel isLightOn={false} />;
      case 'iron_smelter':
        return <IronSmelterModel isLightOn={false} />;
      case 'stonecutter':
        return <StonecutterModel isLightOn={false} />;
      case 'brickworks':
        return <BrickworksModel isLightOn={false} />;
      case 'sawmill':
        return <SawmillModel isLightOn={false} />;
      case 'weavers_workshop':
        return <WeaversWorkshopModel isLightOn={false} />;
      case 'foresters_hut':
        return <ForestersHutModel isLightOn={false} />;
      case 'wooden_church':
        return <WoodenChurchModel isLightOn={false} />;
      case 'tavern':
        return <TavernModel isLightOn={false} />;
      case 'trading_post':
        return <TradingPostModel isLightOn={false} />;
      default:
        return <PeasantHouseModel isLightOn={false} />;
    }
  }

  const color = allowed ? '#22c55e' : '#ef4444';

  const { planeGeo, edgesGeo } = useMemo(() => {
    const p = new THREE.PlaneGeometry(width * 0.98, height * 0.98);
    const e = new THREE.EdgesGeometry(p);
    return { planeGeo: p, edgesGeo: e };
  }, [width, height]);

  return (
    <group>
      <group>
        {renderModel()}
      </group>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={planeGeo}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={edgesGeo}>
        <lineBasicMaterial color={allowed ? '#4ade80' : '#f87171'} linewidth={2} />
      </lineSegments>

      <group position={[0, 0.04, height * 0.5 + 0.35]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.28, 16]} />
          <meshBasicMaterial color={allowed ? '#fbbf24' : '#f87171'} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.04, 0.08, 0.22, 6]} />
          <meshStandardMaterial color={allowed ? '#d97706' : '#dc2626'} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
});

BuildingPlacementGhost.displayName = 'BuildingPlacementGhost';
