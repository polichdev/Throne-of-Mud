import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { buildingEntities } from '../../engine/ecs/world';

import { MAP_SIZE } from '../../constants/world';
import {
  MIN_CAMERA_ZOOM,
  MAX_CAMERA_ZOOM,
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_BOUNDS_MARGIN,
  DEFAULT_CAMERA_ZOOM,
} from '../../constants/camera';

interface Props {
  initialCenter: [number, number];
  mapWidth?: number;
  mapHeight?: number;
}

export function TopDownCamera({ initialCenter, mapWidth = MAP_SIZE, mapHeight = MAP_SIZE }: Props) {
  const { camera, gl } = useThree();

  const MIN_ZOOM = MIN_CAMERA_ZOOM;
  const MAX_ZOOM = MAX_CAMERA_ZOOM;
  const D = CAMERA_DISTANCE;
  const H = CAMERA_HEIGHT;

  const stateAtMount = useGameStore.getState();
  const isMenuMode = stateAtMount.gameMode === 'menu';
  const initFocus = stateAtMount.cameraFocusTarget;

  const initZoom = isMenuMode ? DEFAULT_CAMERA_ZOOM : (stateAtMount.cameraZoomTarget ?? DEFAULT_CAMERA_ZOOM);
  const initAngle = stateAtMount.cameraAngleTarget ?? (Math.PI / 4);
  const startX = isMenuMode ? (mapWidth / 2) : (initFocus ? initFocus[0] : initialCenter[0]);
  const startZ = isMenuMode ? (mapHeight / 2) : (initFocus ? initFocus[1] : initialCenter[1]);

  const targetPos = useRef(new THREE.Vector3(startX, 0, startZ));
  const currentPos = useRef(new THREE.Vector3(startX, 0, startZ));
  const targetAngle = useRef(initAngle);
  const currentAngle = useRef(initAngle);
  const targetZoom = useRef(initZoom);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const dragPointerId = useRef<number | null>(null);
  const lastMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const last3DPos = useRef<[number, number]>([startX, startZ]);
  const isStrategicRef = useRef(initZoom <= 16);
  const prevGameModeRef = useRef(stateAtMount.gameMode);

  const clampTarget = () => {
    const margin = CAMERA_BOUNDS_MARGIN;
    targetPos.current.x = Math.max(margin, Math.min(mapWidth - margin, targetPos.current.x));
    targetPos.current.z = Math.max(margin, Math.min(mapHeight - margin, targetPos.current.z));
  };

  useEffect(() => {
    if (isMenuMode && useGameStore.getState().isStrategicView) {
      useGameStore.getState().setIsStrategicView(false);
    }

    camera.up.set(0, 1, 0);
    camera.position.set(startX + D * Math.sin(targetAngle.current), H, startZ + D * Math.cos(targetAngle.current));
    camera.lookAt(startX, 0, startZ);

    const orthoCam = camera as THREE.OrthographicCamera;
    if (orthoCam.isOrthographicCamera) {
      orthoCam.near = -500;
      orthoCam.far = 3000;
      orthoCam.zoom = targetZoom.current;
      orthoCam.updateProjectionMatrix();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code.toLowerCase()] = false;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        dragPointerId.current = e.pointerId;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        gl.domElement.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (dragPointerId.current === e.pointerId) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        lastMouse.current = { x: e.clientX, y: e.clientY };

        if (Math.abs(dx) > 90 || Math.abs(dy) > 90) return;
        const currentZoom = targetZoom.current;

        const scale = 1.0 / currentZoom;
        const panRight = -dx * scale;
        const panFwd = dy * scale / 0.707;

        const curA = currentAngle.current;
        const fwdX = -Math.sin(curA);
        const fwdZ = -Math.cos(curA);
        const rightX = Math.cos(curA);
        const rightZ = -Math.sin(curA);

        targetPos.current.x += rightX * panRight + fwdX * panFwd;
        targetPos.current.z += rightZ * panRight + fwdZ * panFwd;
        clampTarget();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragPointerId.current === e.pointerId) {
        if (gl.domElement.hasPointerCapture(e.pointerId)) gl.domElement.releasePointerCapture(e.pointerId);
        dragPointerId.current = null;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextZoom = targetZoom.current * factor;
      targetZoom.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    };

    const domElement = gl.domElement;
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    domElement.addEventListener('contextmenu', preventContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointercancel', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      domElement.removeEventListener('contextmenu', preventContextMenu);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointercancel', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
    };
  }, [initialCenter[0], initialCenter[1], camera, gl, isMenuMode, mapWidth, mapHeight]);

  useFrame((_, delta) => {
    const currentGameMode = useGameStore.getState().gameMode;

    if (prevGameModeRef.current === 'menu' && currentGameMode === 'playing') {
      const state = useGameStore.getState();
      const pReg = state.regions[state.playerRegionId];
      let campX = state.playerSpawnPoint?.[0] ?? pReg?.campPosition?.[0] ?? 52;
      let campZ = state.playerSpawnPoint?.[1] ?? pReg?.campPosition?.[1] ?? 52;

      const campCenterBuilding = Array.from(buildingEntities).find(
        (b) => (b.buildingType === 'campfire' || b.buildingType === 'manor' || b.buildingType === 'tent') &&
               (b.factionId === 'player' || b.regionId === state.playerRegionId)
      );
      if (campCenterBuilding?.position) {
        campX = campCenterBuilding.position[0];
        campZ = campCenterBuilding.position[2];
      } else if (campCenterBuilding?.gridPosition) {
        campX = campCenterBuilding.gridPosition[0];
        campZ = campCenterBuilding.gridPosition[1];
      }

      const targetX = state.cameraFocusTarget?.[0] ?? campX;
      const targetZ = state.cameraFocusTarget?.[1] ?? campZ;
      const desiredAngle = state.cameraAngleTarget ?? Math.PI / 4;
      const desiredZoom = state.cameraZoomTarget ?? 38.0;

      targetPos.current.set(targetX, 0, targetZ);
      currentPos.current.set(targetX, 0, targetZ);
      targetAngle.current = desiredAngle;
      currentAngle.current = desiredAngle;
      targetZoom.current = desiredZoom;
      last3DPos.current = [targetX, targetZ];
      (window as any).__lastCameraTarget = [targetX, targetZ];

      const orthoCam = camera as THREE.OrthographicCamera;
      if (orthoCam.isOrthographicCamera) {
        orthoCam.zoom = desiredZoom;
        orthoCam.updateProjectionMatrix();
      }

      camera.position.set(
        targetX + D * Math.sin(desiredAngle),
        H,
        targetZ + D * Math.cos(desiredAngle)
      );
      camera.lookAt(targetX, 0, targetZ);

      state.setCameraFocusTarget(null);
      state.setCameraZoomTarget(null);
      state.setCameraAngleTarget(null);
    }
    prevGameModeRef.current = currentGameMode;

    if (currentGameMode === 'menu') {
      targetPos.current.x = mapWidth / 2;
      targetPos.current.z = mapHeight / 2;
      targetZoom.current = 38;
      targetAngle.current += 0.007 * delta;
      if (useGameStore.getState().isStrategicView) {
        useGameStore.getState().setIsStrategicView(false);
      }
    }

    const focusTarget = useGameStore.getState().cameraFocusTarget;
    if (focusTarget) {
      targetPos.current.x = focusTarget[0];
      targetPos.current.z = focusTarget[1];
      if ((window as any).__snapCameraNextFrame) {
        currentPos.current.x = focusTarget[0];
        currentPos.current.z = focusTarget[1];
        (window as any).__snapCameraNextFrame = false;
      }
      clampTarget();
      useGameStore.getState().setCameraFocusTarget(null);
    }

    const zoomTarget = useGameStore.getState().cameraZoomTarget;
    if (zoomTarget !== null) {
      targetZoom.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomTarget));
      useGameStore.getState().setCameraZoomTarget(null);
    }

    const angleTarget = useGameStore.getState().cameraAngleTarget;
    if (angleTarget !== null) {
      targetAngle.current = angleTarget;
      currentAngle.current = angleTarget;
      useGameStore.getState().setCameraAngleTarget(null);
    }

    const isBuildMode = useGameStore.getState().activeTool === 'build' || Boolean(useGameStore.getState().activeBuildType);
    const rotSpeed = 2.4 * delta;
    if (!isBuildMode) {
      if (keysPressed.current['keyq']) {
        targetAngle.current -= rotSpeed;
      }
      if (keysPressed.current['keye']) {
        targetAngle.current += rotSpeed;
      }
    }

    let diffAngle = targetAngle.current - currentAngle.current;
    while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
    while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
    const angleLerpRate = Math.min(1.0, delta * 12.0);
    currentAngle.current += diffAngle * angleLerpRate;

    const curAngle = currentAngle.current;
    const fwdX = -Math.sin(curAngle);
    const fwdZ = -Math.cos(curAngle);
    const rightX = Math.cos(curAngle);
    const rightZ = -Math.sin(curAngle);

    const speed = (38.0 / targetZoom.current) * 14.0 * delta;
    let moveFwd = 0;
    let moveRight = 0;

    if (keysPressed.current['keyw'] || keysPressed.current['arrowup'])    moveFwd   += 1;
    if (keysPressed.current['keys'] || keysPressed.current['arrowdown'])  moveFwd   -= 1;
    if (keysPressed.current['keya'] || keysPressed.current['arrowleft'])  moveRight -= 1;
    if (keysPressed.current['keyd'] || keysPressed.current['arrowright']) moveRight += 1;

    if (moveFwd !== 0 || moveRight !== 0) {
      const len = Math.hypot(moveFwd, moveRight);
      const normFwd = (moveFwd / len) * speed;
      const normRight = (moveRight / len) * speed;

      targetPos.current.x += fwdX * normFwd + rightX * normRight;
      targetPos.current.z += fwdZ * normFwd + rightZ * normRight;
      clampTarget();
    }

    const posLerpRate = Math.min(1.0, delta * 14.0);
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, targetPos.current.x, posLerpRate);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, targetPos.current.z, posLerpRate);

    const curX = currentPos.current.x;
    const curZ = currentPos.current.z;

    camera.position.set(curX + D * Math.sin(curAngle), H, curZ + D * Math.cos(curAngle));
    camera.lookAt(curX, 0, curZ);

    const orthoCam = camera as THREE.OrthographicCamera;
    if (orthoCam.isOrthographicCamera) {
      const zoomDiff = targetZoom.current - orthoCam.zoom;
      if (Math.abs(zoomDiff) > 0.002) {
        const zoomLerpRate = Math.min(1.0, delta * 18.0);
        let newZoom = orthoCam.zoom + zoomDiff * zoomLerpRate;
        if (Math.abs(targetZoom.current - newZoom) < 0.02) {
          newZoom = targetZoom.current;
        }
        orthoCam.zoom = newZoom;
        orthoCam.updateProjectionMatrix();
      }
      (window as any).__lastCameraZoom = orthoCam.zoom;

      (window as any).__lastCameraTarget = [curX, curZ];
      (window as any).__lastCameraAngle = curAngle;

      const currentStrat = isStrategicRef.current;
      const isStrat = currentStrat ? orthoCam.zoom < 18.0 : orthoCam.zoom <= 17.0;
      if (isStrat !== currentStrat) {
        isStrategicRef.current = isStrat;
        useGameStore.getState().setIsStrategicView(isStrat);
      }
    }
  });

  return null;
}
