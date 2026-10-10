import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameEntity } from '../../../engine/ecs/world';
import type { HouseTier, BackyardExtensionType } from '../../../types/game';
import { useGameStore } from '../../../store/useGameStore';
import { BUILDING_BLUEPRINTS } from '../../../engine/buildings/blueprints';
import type { StaticMeshPart } from './staticMeshParts';
import { getPeasantHouseExteriorParts, getPeasantHouseExteriorMaterial, getPeasantBackyardParts, PeasantHouseEffects } from './models/PeasantHouseModel';

const CHUNK_SIZE = 32;
const COLLIDER_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const COLLIDER_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });
const NO_RAYCAST = () => {};

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

export interface HouseBatch {
  key: string;
  kind: 'house' | 'yard';
  tier: HouseTier;
  backyard: BackyardExtensionType;
  buildings: GameEntity[];
  parts: StaticMeshPart[];
}

export function makeHouseBatches(buildings: GameEntity[]): HouseBatch[] {
  const batches = new Map<string, HouseBatch>();
  function add(building: GameEntity, kind: 'house' | 'yard') {
    const tier = building.houseTier || 1, backyard = building.backyardExtension || 'none';
    const matrix = getHouseWorldMatrix(building);
    const x = matrix.elements[12], z = matrix.elements[14];
    const key = `${Math.floor(x / CHUNK_SIZE)}:${Math.floor(z / CHUNK_SIZE)}:${kind}:${kind === 'house' ? tier : backyard}`;
    let batch = batches.get(key);
    if (!batch) {
      batch = { key, kind, tier, backyard, buildings: [], parts: kind === 'house' ? getPeasantHouseExteriorParts(tier, 'none') : getPeasantBackyardParts(backyard) };
      batches.set(key, batch);
    }
    batch.buildings.push(building);
  }
  for (const building of buildings) {
    add(building, 'house');
    if (building.backyardExtension && building.backyardExtension !== 'none') add(building, 'yard');
  }
  return [...batches.values()];
}

function InstancePart({ part, matrices, isNight }: { part: StaticMeshPart; matrices: THREE.Matrix4[]; isNight: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.count = matrices.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [matrices]);
  return <instancedMesh key={matrices.length} ref={ref} args={[part.geometry, part.material, matrices.length]}
    material={getPeasantHouseExteriorMaterial(part.material, isNight)}
    castShadow={part.castShadow} receiveShadow={part.receiveShadow} matrixAutoUpdate={false} raycast={NO_RAYCAST} />;
}

function HouseBatchMeshes({ batch, isNight, onSelect }: { batch: HouseBatch; isNight: boolean; onSelect: (id: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const matrices = useMemo(() => batch.buildings.map(getHouseWorldMatrix), [batch]);
  useFrame(() => {
    if (!ref.current) return;
    const target = (window as any).__lastCameraTarget;
    if (!target) return;
    const zoom = (window as any).__lastCameraZoom || 38;
    const distance = Math.max(38, Math.min(50, 1200 / zoom + 12));
    ref.current.visible = matrices.some(matrix => (matrix.elements[12] - target[0]) ** 2 + (matrix.elements[14] - target[1]) ** 2 < distance ** 2);
  });
  return <group ref={ref}>
    {batch.parts.map((part, i) => <InstancePart key={i} part={part} matrices={matrices} isNight={isNight} />)}
    {batch.kind === 'house' && <HouseColliders buildings={batch.buildings} onSelect={onSelect} />}
  </group>;
}

function HouseColliders({ buildings, onSelect }: { buildings: GameEntity[]; onSelect: (id: string) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const bp = BUILDING_BLUEPRINTS.peasant_house;
    const local = new THREE.Matrix4().compose(new THREE.Vector3(0, Math.max(1, bp.height * 0.35), 0),
      new THREE.Quaternion(), new THREE.Vector3(bp.width * 0.98, Math.max(2.4, bp.height * 0.8), bp.height * 0.98));
    buildings.forEach((b, i) => mesh.setMatrixAt(i, getHouseWorldMatrix(b).multiply(local)));
    mesh.count = buildings.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [buildings]);
  function select(event: ThreeEvent<MouseEvent>) {
    if (event.button !== 0 || event.instanceId === undefined) return;
    const building = buildings[event.instanceId];
    if (!building) return;
    event.stopPropagation();
    onSelect(building.id);
  }
  if (!buildings.length) return null;
  return <instancedMesh key={buildings.length} ref={ref} args={[COLLIDER_GEOMETRY, COLLIDER_MATERIAL, buildings.length]}
    matrixAutoUpdate={false} onPointerDown={select} onClick={select} />;
}

function HouseEffects({ building }: { building: GameEntity }) {
  const ref = useRef<THREE.Group>(null);
  const matrix = getHouseWorldMatrix(building);
  useFrame(() => {
    if (!ref.current) return;
    const target = (window as any).__lastCameraTarget;
    if (!target) return;
    const zoom = (window as any).__lastCameraZoom || 38;
    const distance = Math.max(38, Math.min(50, 1200 / zoom + 12));
    ref.current.visible = (matrix.elements[12] - target[0]) ** 2 + (matrix.elements[14] - target[1]) ** 2 < distance ** 2;
  });
  return <group ref={ref} matrix={matrix} matrixAutoUpdate={false}>
    <PeasantHouseEffects buildingId={building.id} tier={building.houseTier || 1} backyard={building.backyardExtension || 'none'} />
  </group>;
}

export function InstancedHousesRenderer({ buildings, onSelect }: { buildings: GameEntity[]; onSelect: (id: string) => void }) {
  const batches = useMemo(() => makeHouseBatches(buildings), [buildings]);
  const isNight = useGameStore(state => (state.time?.hour ?? 12) >= 20 || (state.time?.hour ?? 12) < 6);
  return <group>
    {batches.map(batch => <HouseBatchMeshes key={batch.key} batch={batch} isNight={isNight} onSelect={onSelect} />)}
    {buildings.map(building => <HouseEffects key={building.id} building={building} />)}
  </group>;
}
