import { useMemo } from 'react';
import * as THREE from 'three';
import { GridMap } from '../../engine/grid/GridMap';
import { useGameStore } from '../../store/useGameStore';
import { BUILDING_BLUEPRINTS } from '../../engine/buildings/blueprints';
import { getSnappedPlacementCoords } from '../../engine/grid/buildingSnap';
import { validateBuildingPlacement } from '../../engine/buildings/buildingValidation';

interface Props {
  grid: GridMap;
}

export function PlacementPreview({ grid }: Props) {
  const isStrategicView = useGameStore((s) => s.isStrategicView);
  const activeTool = useGameStore((s) => s.activeTool);
  const activeBuildType = useGameStore((s) => s.activeBuildType);
  const hoveredTile = useGameStore((s) => s.activeTool === 'build' ? s.hoveredTile : null);

  const blueprint = activeBuildType ? BUILDING_BLUEPRINTS[activeBuildType] : null;

  const playerRegionId = useGameStore((s) => s.playerRegionId);
  const resourceDeposits = useGameStore((s) => s.resourceDeposits);

  const targetCoords = useMemo(() => {
    if (isStrategicView || !hoveredTile || activeTool !== 'build' || !blueprint || !activeBuildType) return null;
    return getSnappedPlacementCoords(hoveredTile[0], hoveredTile[1], blueprint.width, blueprint.height, activeBuildType, grid, resourceDeposits);
  }, [hoveredTile, activeTool, blueprint, activeBuildType, grid, resourceDeposits]);

  const isValid = useMemo(() => {
    if (!targetCoords || !blueprint || !activeBuildType) return false;
    const pRegion = useGameStore.getState().regions.find((r) => r.id === (playerRegionId ?? 0));
    if (pRegion) {
      if (!GridMap.isBuildingInRegion(pRegion.id, targetCoords[0], targetCoords[1], blueprint.width, blueprint.height, 3.5)) {
        return false;
      }
    }
    return validateBuildingPlacement(
      activeBuildType,
      targetCoords[0],
      targetCoords[1],
      blueprint.width,
      blueprint.height,
      grid,
      resourceDeposits,
      pRegion?.id
    ).allowed;
  }, [targetCoords, blueprint, activeBuildType, grid, playerRegionId, resourceDeposits]);

  const geometries = useMemo(() => {
    if (!blueprint) return null;
    const plane = new THREE.PlaneGeometry(blueprint.width * 0.98, blueprint.height * 0.98);
    const box = new THREE.BoxGeometry(blueprint.width * 0.9, 1.0, blueprint.height * 0.9);
    const cone = new THREE.ConeGeometry(Math.max(blueprint.width, blueprint.height) * 0.65, 0.6, 4);
    return { plane, box, cone };
  }, [blueprint]);

  const materials = useMemo(() => ({
    validPlane: new THREE.MeshBasicMaterial({ color: '#22c55e', transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    invalidPlane: new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    validBox: new THREE.MeshStandardMaterial({ color: '#22c55e', transparent: true, opacity: 0.3, roughness: 0.4 }),
    invalidBox: new THREE.MeshStandardMaterial({ color: '#ef4444', transparent: true, opacity: 0.3, roughness: 0.4 }),
    validCone: new THREE.MeshStandardMaterial({ color: '#22c55e', transparent: true, opacity: 0.35, roughness: 0.4 }),
    invalidCone: new THREE.MeshStandardMaterial({ color: '#ef4444', transparent: true, opacity: 0.35, roughness: 0.4 }),
  }), []);

  if (activeTool !== 'build' || !activeBuildType || !targetCoords || !blueprint || !geometries) {
    return null;
  }

  const posX = targetCoords[0] + blueprint.width / 2;
  const posZ = targetCoords[1] + blueprint.height / 2;

  const planeMat = isValid ? materials.validPlane : materials.invalidPlane;
  const boxMat = isValid ? materials.validBox : materials.invalidBox;
  const coneMat = isValid ? materials.validCone : materials.invalidCone;

  return (
    <group position={[posX, 0, posZ]}>
      <mesh
        geometry={geometries.plane}
        material={planeMat}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      />

      <mesh
        geometry={geometries.box}
        material={boxMat}
        position={[0, 0.5, 0]}
        raycast={() => null}
      />

      <mesh
        geometry={geometries.cone}
        material={coneMat}
        position={[0, 1.3, 0]}
        rotation={[0, Math.PI / 4, 0]}
        raycast={() => null}
      />
    </group>
  );
}
