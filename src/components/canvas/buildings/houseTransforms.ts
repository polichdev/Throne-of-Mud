import * as THREE from 'three';
import type { GameEntity } from '../../../engine/ecs/world';

export function getHouseWorldMatrix(building: GameEntity): THREE.Matrix4 {
  const width = building.buildingWidth || 1, height = building.buildingHeight || 1;
  return new THREE.Matrix4().compose(
    new THREE.Vector3(
      building.position?.[0] ?? (building.gridPosition?.[0] ?? 0) + width / 2,
      building.position?.[1] ?? 0,
      building.position?.[2] ?? (building.gridPosition?.[1] ?? 0) + height / 2,
    ),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), building.rotationAngle || 0),
    new THREE.Vector3(1, 1, 1),
  );
}
