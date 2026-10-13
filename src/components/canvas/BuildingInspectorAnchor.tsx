import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { world } from '../../engine/ecs/world';
import { publishBuildingAnchor } from '../ui/inspector/buildingInspectorAnchor';

export function BuildingInspectorAnchor() {
  const selectedId = useGameStore(s => s.selectedEntityId);
  const { gl, size } = useThree();
  const selected = useMemo(() => world.entities.find(entity => entity.id === selectedId && entity.isBuilding), [selectedId]);
  const point = useMemo(() => new THREE.Vector3(), []);
  const bounds = useRef({ left: 0, top: 0 });
  useEffect(() => {
    const update = () => { bounds.current = gl.domElement.getBoundingClientRect(); };
    update(); window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [gl]);
  useEffect(() => () => publishBuildingAnchor(null), [selectedId]);
  useFrame(({ camera }) => {
    if (!selected?.position || useGameStore.getState().isStrategicView) { publishBuildingAnchor(null); return; }
    camera.updateMatrixWorld();
    point.set(selected.position[0], selected.position[1] + 1.5, selected.position[2]).project(camera);
    publishBuildingAnchor({ entityId: selected.id, x: bounds.current.left + (point.x + 1) * size.width / 2,
      y: bounds.current.top + (1 - point.y) * size.height / 2, onScreen: Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && Math.abs(point.z) <= 1 });
  });
  return null;
}
