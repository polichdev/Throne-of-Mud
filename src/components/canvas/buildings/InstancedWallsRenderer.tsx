import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { GameEntity } from '../../../engine/ecs/world';
import { SHARED_BUILDING_MATS } from './buildingMaterials';
import {
  woodenWallLogsGeometry,
  woodenWallCrossbarGeometry,
  stoneWallMainGeometry,
  stoneWallBattlementsGeometry,
} from './models/civic/WallGateModels';

const _dummy = new THREE.Object3D();

export function InstancedWallsRenderer({
  woodenWalls,
  stoneWalls,
  onSelect,
}: {
  woodenWalls: GameEntity[];
  stoneWalls: GameEntity[];
  onSelect: (id: string) => void;
}) {
  const mats = SHARED_BUILDING_MATS;

  const woodenLogsRef = useRef<THREE.InstancedMesh>(null);
  const woodenCrossRef = useRef<THREE.InstancedMesh>(null);
  const stoneMainRef = useRef<THREE.InstancedMesh>(null);
  const stoneBattRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!woodenLogsRef.current || !woodenCrossRef.current) return;
    const count = woodenWalls.length;
    woodenLogsRef.current.count = count;
    woodenCrossRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const b = woodenWalls[i];
      const pos = b.position || [0, 0, 0];
      const width = b.buildingWidth || 1;
      const height = b.buildingHeight || 1;
      const x = b.position ? b.position[0] : (b.gridPosition ? b.gridPosition[0] + width / 2 : pos[0]);
      const z = b.position ? b.position[2] : (b.gridPosition ? b.gridPosition[1] + height / 2 : pos[2]);
      const y = pos[1] !== undefined ? pos[1] : 0.05;
      const rot = b.rotationAngle || 0;

      _dummy.position.set(x, y, z);
      _dummy.rotation.set(0, rot, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();

      woodenLogsRef.current.setMatrixAt(i, _dummy.matrix);
      woodenCrossRef.current.setMatrixAt(i, _dummy.matrix);
    }

    woodenLogsRef.current.instanceMatrix.needsUpdate = true;
    woodenCrossRef.current.instanceMatrix.needsUpdate = true;
  }, [woodenWalls]);

  useEffect(() => {
    if (!stoneMainRef.current || !stoneBattRef.current) return;
    const count = stoneWalls.length;
    stoneMainRef.current.count = count;
    stoneBattRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const b = stoneWalls[i];
      const pos = b.position || [0, 0, 0];
      const width = b.buildingWidth || 1;
      const height = b.buildingHeight || 1;
      const x = b.position ? b.position[0] : (b.gridPosition ? b.gridPosition[0] + width / 2 : pos[0]);
      const z = b.position ? b.position[2] : (b.gridPosition ? b.gridPosition[1] + height / 2 : pos[2]);
      const y = pos[1] !== undefined ? pos[1] : 0.05;
      const rot = b.rotationAngle || 0;

      _dummy.position.set(x, y, z);
      _dummy.rotation.set(0, rot, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();

      stoneMainRef.current.setMatrixAt(i, _dummy.matrix);
      stoneBattRef.current.setMatrixAt(i, _dummy.matrix);
    }

    stoneMainRef.current.instanceMatrix.needsUpdate = true;
    stoneBattRef.current.instanceMatrix.needsUpdate = true;
  }, [stoneWalls]);

  const maxWoodenCapacity = Math.max(1, woodenWalls.length + 10);
  const maxStoneCapacity = Math.max(1, stoneWalls.length + 10);

  return (
    <group>
      {woodenWalls.length > 0 && (
        <group
          onClick={(e) => {
            e.stopPropagation();
            if (e.instanceId !== undefined && woodenWalls[e.instanceId]) {
              onSelect(woodenWalls[e.instanceId].id);
            }
          }}
        >
          <instancedMesh
            ref={woodenLogsRef}
            args={[woodenWallLogsGeometry, mats.timberLogs, maxWoodenCapacity]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
          <instancedMesh
            ref={woodenCrossRef}
            args={[woodenWallCrossbarGeometry, mats.timberMed, maxWoodenCapacity]}
            frustumCulled={false}
          />
        </group>
      )}

      {stoneWalls.length > 0 && (
        <group
          onClick={(e) => {
            e.stopPropagation();
            if (e.instanceId !== undefined && stoneWalls[e.instanceId]) {
              onSelect(stoneWalls[e.instanceId].id);
            }
          }}
        >
          <instancedMesh
            ref={stoneMainRef}
            args={[stoneWallMainGeometry, mats.stoneMed, maxStoneCapacity]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
          <instancedMesh
            ref={stoneBattRef}
            args={[stoneWallBattlementsGeometry, mats.stoneDark, maxStoneCapacity]}
            frustumCulled={false}
          />
        </group>
      )}
    </group>
  );
}
