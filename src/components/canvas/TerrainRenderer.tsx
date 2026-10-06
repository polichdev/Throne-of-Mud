import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GridMap } from '../../engine/grid/GridMap';
import { useGameStore } from '../../store/useGameStore';
import { BUILDING_BLUEPRINTS } from '../../engine/buildings/blueprints';
import { world, buildingEntities } from '../../engine/ecs/world';
import { AssetLoader } from '../../engine/assets/AssetLoader';
import { audioManager } from '../../engine/audio/AudioManager';
import { RoadPlacementPreview, type RoadSnapTarget } from './RoadPlacementPreview';
import { getSmartRoadPath, isRoadPathValid } from '../../engine/grid/roadGeneration';
import { getBuildingDoorInfo } from '../../engine/buildings/buildingNavigation';
import {
  getRotatedBuildingFootprint,
  validateRotatedBuildingPlacement,
} from '../../engine/buildings/buildingValidation';
import { BuildingPlacementGhost } from './buildings/BuildingPlacementGhost';

const COVERED_TILE_GEO = new THREE.PlaneGeometry(0.96, 0.96);
const SNAP_RING_GEO = new THREE.RingGeometry(0.42, 0.49, 24);
const SNAP_CIRCLE_GEO = new THREE.CircleGeometry(0.42, 24);
const SNAP_CYLINDER_GEO = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8);
const SNAP_SPHERE_GEO = new THREE.SphereGeometry(0.08, 12, 12);
const SNAP_TARGET_RING_GEO = new THREE.RingGeometry(0.44, 0.52, 24);
const CURSOR_PLANE_GEO = new THREE.PlaneGeometry(1.0, 1.0);

interface Props {
  grid: GridMap;
}

export interface BuildingSnapNode {
  id: string;
  x: number;
  z: number;
  buildingId: string;
  buildingName: string;
}

export function TerrainRenderer({ grid }: Props) {
  const activeTool = useGameStore((s) => s.activeTool);
  const activeBuildType = useGameStore((s) => s.activeBuildType);
  const buildingVersion = useGameStore((s) => s.buildingVersion);
  const terrainVersion = useGameStore((s) => s.terrainVersion);
  const hoveredTile = useGameStore((s) => (s.activeTool === 'build' || s.activeTool === 'road') ? s.hoveredTile : null);
  const isStrategicView = useGameStore((s) => s.isStrategicView);

  const season = useGameStore((s) => s.time.season);
  const resourceDeposits = useGameStore((s) => s.resourceDeposits);

  const roadEraseMode = useGameStore((s) => s.roadEraseMode);
  const setRoadEraseMode = useGameStore((s) => s.setRoadEraseMode);
  const buildRotation = useGameStore((s) => s.buildRotation);
  const gameMode = useGameStore((s) => s.gameMode);

  const [roadStartPoint, setRoadStartPoint] = useState<[number, number] | null>(null);
  const [roadPreviewPath, setRoadPreviewPath] = useState<[number, number][]>([]);
  const [currentSnapTarget, setCurrentSnapTarget] = useState<RoadSnapTarget | null>(null);
  const lastErasedTileRef = useRef<string | null>(null);
  const prevErasedPosRef = useRef<[number, number] | null>(null);

  const gridTexture = useMemo(() => {
    const w = grid.width;
    const h = grid.height;
    const data = new Uint8Array(w * h * 4);

    for (let z = 0; z < h; z++) {
      for (let x = 0; x < w; x++) {
        const tile = grid.tiles[x][z];
        const t = tile?.terrain || 'grass';
        const isSoil = (t === 'fertile_soil' || t === 'mud') ? 255 : 0;
        const isWater = (t === 'water') ? 255 : 0;
        const isStone = (t === 'stone') ? 255 : 0;
        const isRoad = (t === 'road') ? 255 : 0;

        const idx = (z * w + x) * 4;
        data[idx] = isSoil;
        data[idx + 1] = isWater;
        data[idx + 2] = isStone;
        data[idx + 3] = isRoad;
      }
    }

    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    grid.isFullTerrainDirty = false;
    return tex;
  }, [grid]);

  const grassTexture = useMemo(() => {
    const tex = AssetLoader.getInstance().load('/assets/terrain/grass.png');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  const mudTexture = useMemo(() => {
    const tex = AssetLoader.getInstance().load('/assets/terrain/mud.png');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  const stoneTexture = useMemo(() => {
    const tex = AssetLoader.getInstance().load('/assets/terrain/stone.png');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  const waterTexture = useMemo(() => {
    const tex = AssetLoader.getInstance().load('/assets/terrain/water.png');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 12);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  const customShaderRef = useRef<{ uniforms: Record<string, THREE.IUniform> } | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const keyHoldDurationRef = useRef<{ [key: string]: number }>({});

  useFrame((state, delta) => {
    if (grid.isFullTerrainDirty && gridTexture.image?.data) {
      grid.syncToDataTexture(gridTexture);
      setRoadStartPoint(null);
      setRoadPreviewPath([]);
      setCurrentSnapTarget(null);
    }

    if (customShaderRef.current) {
      customShaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const { rainIntensity = 0, stormIntensity = 0, snowAccumulation = 0 } = useGameStore.getState().time;

      const targetWetness = Math.min(1.0, rainIntensity * 0.85 + stormIntensity * 0.15);
      const curWetness = (customShaderRef.current.uniforms.uWetness?.value as number) || 0;
      const wetnessRate = targetWetness > curWetness ? 0.04 : 0.012;
      customShaderRef.current.uniforms.uWetness.value = THREE.MathUtils.lerp(curWetness, targetWetness, wetnessRate);

      const targetAutumn = season === 'Autumn' ? 1.0 : 0.0;
      const curAutumn = (customShaderRef.current.uniforms.uAutumnAmount?.value as number) || 0;
      customShaderRef.current.uniforms.uAutumnAmount.value = THREE.MathUtils.lerp(curAutumn, targetAutumn, 0.04);

      const targetSnow = snowAccumulation;
      const curSnow = (customShaderRef.current.uniforms.uSnowAmount?.value as number) || 0;
      customShaderRef.current.uniforms.uSnowAmount.value = THREE.MathUtils.lerp(curSnow, targetSnow, 0.05);
    }

    const isBuild = activeTool === 'build' || Boolean(activeBuildType);
    if (isBuild) {
      const qDown = Boolean(keysRef.current['keyq']);
      const eDown = Boolean(keysRef.current['keye'] || keysRef.current['keyr']);
      if (qDown) {
        keyHoldDurationRef.current['keyq'] = (keyHoldDurationRef.current['keyq'] || 0) + delta;
        if (keyHoldDurationRef.current['keyq'] > 0.20) {
          useGameStore.getState().setBuildRotation((prev) => {
            const next = prev - 2.2 * delta;
            return ((next % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          });
        }
      }
      if (eDown) {
        keyHoldDurationRef.current['keye'] = (keyHoldDurationRef.current['keye'] || 0) + delta;
        if (keyHoldDurationRef.current['keye'] > 0.20) {
          useGameStore.getState().setBuildRotation((prev) => {
            const next = prev + 2.2 * delta;
            return ((next % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          });
        }
      }
    }
  });

  useEffect(() => {
    if (customShaderRef.current) {
      customShaderRef.current.uniforms.uGridTex.value = gridTexture;
      customShaderRef.current.uniforms.uMudTex.value = mudTexture;
      customShaderRef.current.uniforms.uStoneTex.value = stoneTexture;
      customShaderRef.current.uniforms.uWaterTex.value = waterTexture;
    }
  }, [gridTexture, mudTexture, stoneTexture, waterTexture]);

  const terrainMaterial = useMemo(() => {
    const mat = new THREE.MeshLambertMaterial({
      map: grassTexture,
    });

    mat.onBeforeCompile = (shader) => {
      customShaderRef.current = shader;
      shader.uniforms.uGridTex = { value: gridTexture };
      shader.uniforms.uMudTex = { value: mudTexture };
      shader.uniforms.uStoneTex = { value: stoneTexture };
      shader.uniforms.uWaterTex = { value: waterTexture };
      shader.uniforms.uGridWidth = { value: grid.width };
      shader.uniforms.uGridHeight = { value: grid.height };
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uSnowAmount = { value: 0 };
      shader.uniforms.uAutumnAmount = { value: 0 };
      shader.uniforms.uWetness = { value: 0 };

      shader.vertexShader = `
        varying vec2 vWorldUv;
        ${shader.vertexShader}
      `.replace(
        '#include <uv_vertex>',
        `
        #include <uv_vertex>
        vWorldUv = uv;
        `
      );

      shader.fragmentShader = `
        uniform sampler2D uGridTex;
        uniform sampler2D uMudTex;
        uniform sampler2D uStoneTex;
        uniform sampler2D uWaterTex;
        uniform float uGridWidth;
        uniform float uGridHeight;
        uniform float uTime;
        uniform float uSnowAmount;
        uniform float uAutumnAmount;
        uniform float uWetness;
        varying vec2 vWorldUv;
        ${shader.fragmentShader}
      `.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        vec2 gridUv = vec2(vWorldUv.x, 1.0 - vWorldUv.y);
        vec2 worldUV = gridUv * vec2(uGridWidth, uGridHeight);
        vec2 mudUv = worldUV * 0.35;
        vec2 stoneUv = worldUV * 0.70;

        vec4 mudCol = texture2D(uMudTex, mudUv);
        vec4 stoneCol = texture2D(uStoneTex, stoneUv);
        vec4 splat = texture2D(uGridTex, gridUv);

        float soilWeight = splat.r;
        float isWater = splat.g;
        float stoneWeight = splat.b;
        float roadWeight = splat.a;

        diffuseColor.rgb = mix(diffuseColor.rgb, mudCol.rgb, smoothstep(0.12, 0.65, soilWeight));
        diffuseColor.rgb = mix(diffuseColor.rgb, stoneCol.rgb, smoothstep(0.25, 0.75, stoneWeight));

        if (roadWeight > 0.03) {
          float roadBlend = smoothstep(0.04, 0.36, roadWeight);

          vec3 earthLoam = vec3(0.40, 0.27, 0.15);
          vec3 compactedSoil = mudCol.rgb * 0.85;
          vec3 dirtRoadBase = mix(earthLoam, compactedSoil, 0.62);
          dirtRoadBase = mix(dirtRoadBase, stoneCol.rgb * 0.78, 0.16);

          float groundNoise = sin(worldUV.x * 4.2) * cos(worldUV.y * 4.2) * 0.5 + 0.5;
          vec3 dirtRoad = mix(dirtRoadBase, dirtRoadBase * 0.84, clamp(groundNoise * 0.26 + 0.08, 0.0, 0.25));

          diffuseColor.rgb = mix(diffuseColor.rgb, dirtRoad, roadBlend);
        }

        if (uAutumnAmount > 0.01) {
          vec3 autumnGrass = diffuseColor.rgb * vec3(1.18, 0.94, 0.58);
          diffuseColor.rgb = mix(diffuseColor.rgb, autumnGrass, uAutumnAmount * 0.75 * (1.0 - isWater));
        }

        if (uWetness > 0.01) {
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.80, uWetness * 0.35 * (1.0 - isWater));
        }

        if (uWetness > 0.05) {

          vec2 splashGrid = worldUV * 1.0;
          vec2 cellId = floor(splashGrid);
          vec2 cellFract = fract(splashGrid);

          vec2 randHash = fract(sin(vec2(
            dot(cellId, vec2(127.1, 311.7)),
            dot(cellId, vec2(269.5, 183.3))
          )) * 43758.5453);

          float cyclePeriod = 0.7 + randHash.x * 0.8;
          float localTime = mod(uTime * 1.4 + randHash.y * 13.7, cyclePeriod);
          float splashDuration = 0.20;

          if (localTime < splashDuration) {
            float progress = localTime / splashDuration;

            vec2 dropCenter = vec2(0.22, 0.22) + randHash * 0.56;
            vec2 delta = cellFract - dropCenter;
            float dist = length(delta);

            float ringRadius = progress * 0.09;
            float ringWidth = 0.016 * (1.0 - progress * 0.4);
            float ring = smoothstep(ringWidth, 0.0, abs(dist - ringRadius));

            float angle = atan(delta.y, delta.x) + randHash.x * 6.28;
            float fleckRay = pow(max(0.0, cos(angle * 4.0)), 6.0);
            float fleckDist = progress * 0.07;
            float flecks = smoothstep(0.02, 0.0, abs(dist - fleckDist)) * fleckRay * (1.0 - progress);

            float centerBead = smoothstep(0.025 * (1.0 - progress), 0.0, dist) * smoothstep(0.35, 0.0, progress);

            float splash = (ring * 0.80 + flecks * 0.90 + centerBead * 1.1) * (1.0 - progress);

            vec3 waterGlisten = vec3(0.85, 0.93, 1.0);
            diffuseColor.rgb = mix(diffuseColor.rgb, waterGlisten, clamp(splash * uWetness * 0.85, 0.0, 0.80));
          }
        }

        if (uSnowAmount > 0.01) {
          vec3 snowColor = vec3(0.92, 0.95, 0.99);
          float snowMask = 1.0 - isWater;
          float roadSlush = roadWeight > 0.02 ? 0.45 : 1.0;
          diffuseColor.rgb = mix(diffuseColor.rgb, snowColor, uSnowAmount * 0.90 * snowMask * roadSlush);
          if (isWater > 0.02 && uSnowAmount > 0.3) {
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.82, 0.90, 0.98), (uSnowAmount - 0.3) * 0.65);
          }
        }

        if (isWater > 0.02) {

          vec2 waterUv1 = worldUV * 0.36 + vec2(uTime * 0.045, uTime * 0.025);
          vec2 waterUv2 = worldUV * 0.40 + vec2(
            -uTime * 0.035 + sin(uTime * 0.7 + worldUV.y * 1.5) * 0.025,
            uTime * 0.040 + cos(uTime * 0.6 + worldUV.x * 1.5) * 0.025
          );

          vec4 waterCol1 = texture2D(uWaterTex, waterUv1);
          vec4 waterCol2 = texture2D(uWaterTex, waterUv2);

          vec3 livingWater = mix(waterCol1.rgb, waterCol2.rgb, 0.45);

          float crest = (waterCol1.r + waterCol2.g) * 0.5;
          livingWater = mix(livingWater, vec3(0.92, 0.98, 1.0), smoothstep(0.70, 0.95, crest) * 0.35);

          diffuseColor.rgb = mix(diffuseColor.rgb, livingWater, smoothstep(0.10, 0.55, isWater));
        }
        `
      );
    };

    return mat;
  }, [grassTexture, mudTexture, stoneTexture, waterTexture, gridTexture, grid.width, grid.height]);

  const terrainGeometry = useMemo(() => {
    const w = grid.width;
    const h = grid.height;
    const segsX = 128;
    const segsZ = 128;
    const geo = new THREE.PlaneGeometry(w, h, segsX, segsZ);

    const lake1X = 72;
    const lake1Z = 70;
    const lake1Radius = 3.8;

    const lake2X = 60;
    const lake2Z = 195;
    const lake2Radius = 4.2;

    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      const wx = lx + w / 2;
      const wz = h / 2 - ly;

      const dx1 = (wx - lake1X) * 0.90 + (wz - lake1Z) * 0.35;
      const dz1 = -(wx - lake1X) * 0.35 + (wz - lake1Z) * 0.90;
      const distLake1 = Math.hypot(dx1, dz1);

      const dx2 = wx - lake2X;
      const dz2 = (wz - lake2Z) - Math.sin((wx - lake2X) * 0.40) * 1.1;
      const distLake2 = Math.hypot(dx2, dz2);

      const isHighway = GridMap.isTradeHighwayTile(Math.round(wx), Math.round(wz));

      let elevation = 0.05;

      if (distLake1 < lake1Radius) {
        const t = distLake1 / lake1Radius;
        elevation = -0.10 + t * t * 0.04;
      } else if (distLake1 < lake1Radius + 1.6) {
        const t = (distLake1 - lake1Radius) / 1.6;
        const smoothT = t * t * (3.0 - 2.0 * t);
        elevation = -0.06 + smoothT * 0.11;
      } else if (distLake2 < lake2Radius) {
        const t = distLake2 / lake2Radius;
        elevation = -0.10 + t * t * 0.04;
      } else if (distLake2 < lake2Radius + 1.8) {
        const t = (distLake2 - lake2Radius) / 1.8;
        const smoothT = t * t * (3.0 - 2.0 * t);
        elevation = -0.06 + smoothT * 0.11;
      } else if (isHighway) {
        elevation = 0.05;
      } else {
        elevation = 0.05;
      }

      pos.setZ(i, elevation);
    }

    geo.computeVertexNormals();
    return geo;
  }, [grid.width, grid.height]);

  const dioramaBaseGeometry = useMemo(() => {
    return new THREE.BoxGeometry(grid.width, 1.4, grid.height);
  }, [grid.width, grid.height]);

  const dioramaBaseMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#1c1917',
    });
  }, []);

  useEffect(() => {
    return () => {
      gridTexture.dispose();
      terrainMaterial.dispose();
      terrainGeometry.dispose();
      dioramaBaseGeometry.dispose();
      dioramaBaseMaterial.dispose();
    };
  }, [gridTexture, terrainMaterial, terrainGeometry, dioramaBaseGeometry, dioramaBaseMaterial]);

  const buildGridLines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const w = grid.width;
    const h = grid.height;

    for (let x = 0; x <= w; x++) {
      points.push(new THREE.Vector3(x, 0.005, 0));
      points.push(new THREE.Vector3(x, 0.005, h));
    }
    for (let z = 0; z <= h; z++) {
      points.push(new THREE.Vector3(0, 0.005, z));
      points.push(new THREE.Vector3(w, 0.005, z));
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [grid.width, grid.height]);

  const isPointerDownRef = useRef(false);
  const pointerButtonRef = useRef(0);

  const updateTileInTexture = (x: number, z: number) => {
    const tile = grid.getTile(x, z);
    if (!tile) return;
    const w = grid.width;
    const idx = (z * w + x) * 4;
    const data = gridTexture.image?.data;
    if (!data) return;
    const t = tile.terrain;
    data[idx] = (t === 'fertile_soil' || t === 'mud') ? 255 : 0;
    data[idx + 1] = (t === 'water') ? 255 : 0;
    data[idx + 2] = (t === 'stone') ? 255 : 0;
    data[idx + 3] = (t === 'road') ? 255 : 0;
    gridTexture.needsUpdate = true;
  };

  useEffect(() => {
    if (!gridTexture.image?.data) return;

    if (grid.isFullTerrainDirty) {
      grid.syncToDataTexture(gridTexture);
      setRoadStartPoint(null);
      setRoadPreviewPath([]);
      setCurrentSnapTarget(null);
      return;
    }

    if (grid.dirtyTerrainCoords && grid.dirtyTerrainCoords.length > 0) {
      const data = gridTexture.image.data;
      const w = grid.width;
      const coords = grid.dirtyTerrainCoords;
      for (let i = 0; i < coords.length; i += 2) {
        const x = coords[i];
        const z = coords[i + 1];
        const tile = grid.tiles[x]?.[z];
        const isRoad = tile?.terrain === 'road' ? 255 : 0;
        const idx = (z * w + x) * 4 + 3;
        data[idx] = isRoad;
      }
      grid.dirtyTerrainCoords.length = 0;
      gridTexture.needsUpdate = true;
      return;
    }
  }, [terrainVersion, grid, gridTexture]);

  useEffect(() => {
    if (!gridTexture.image?.data) return;
    grid.syncToDataTexture(gridTexture);
    setRoadStartPoint(null);
    setRoadPreviewPath([]);
    setCurrentSnapTarget(null);
  }, [gameMode, grid, gridTexture]);

  const allBuildingSnapNodes = useMemo(() => {
    if (activeTool !== 'road') return [];
    const nodes: BuildingSnapNode[] = [];
    const seen = new Set<string>();

    for (const b of buildingEntities) {
      if (!b.gridPosition) continue;
      const [gx, gz] = b.gridPosition;
      const type = b.buildingType;
      const candidates: [number, number][] = [];

      try {
        const doorInfo = getBuildingDoorInfo(b);
        if (doorInfo && doorInfo.doorApproachPos) {
          candidates.push(doorInfo.doorApproachPos);
        }
      } catch (err) {
      }

      if (type === 'campfire') {
        candidates.push([gx, gz - 1], [gx, gz + 1], [gx - 1, gz], [gx + 1, gz]);
      } else {
        const w = b.buildingWidth || 1;
        const h = b.buildingHeight || 1;
        const midX = gx + Math.floor(w / 2);
        candidates.push([midX, gz + h]);
        if (w >= 3 || h >= 3) {
          candidates.push([midX, gz - 1]);
        }
      }

      for (const [cx, cz] of candidates) {
        if (cx >= 0 && cx < grid.width && cz >= 0 && cz < grid.height) {
          const key = `${cx},${cz}`;
          if (!seen.has(key) && (grid.isWalkable(cx, cz) || grid.getTile(cx, cz)?.terrain === 'road')) {
            seen.add(key);
            nodes.push({
              id: `snap-b-${b.id}-${cx}-${cz}`,
              x: cx,
              z: cz,
              buildingId: b.id,
              buildingName: b.name || 'Будівля',
            });
          }
        }
      }
    }
    return nodes;
  }, [activeTool, buildingEntities, buildingVersion, grid]);

  const SNAP_VIS_RADIUS = 8;
  const visibleBuildingSnapNodes = useMemo(() => {
    if (!hoveredTile) return allBuildingSnapNodes.slice(0, 0);
    const [hx, hz] = hoveredTile;
    return allBuildingSnapNodes.filter(
      (n) => Math.abs(n.x - hx) <= SNAP_VIS_RADIUS && Math.abs(n.z - hz) <= SNAP_VIS_RADIUS
    );
  }, [allBuildingSnapNodes, hoveredTile]);

  const buildPreviewData = useMemo(() => {
    if (activeTool !== 'build' || !activeBuildType || !hoveredTile) return null;
    const blueprint = BUILDING_BLUEPRINTS[activeBuildType];
    if (!blueprint) return null;

    const baseW = blueprint.width;
    const baseH = blueprint.height;
    const cx = hoveredTile[0] + baseW / 2;
    const cz = hoveredTile[1] + baseH / 2;

    const footprint = getRotatedBuildingFootprint(cx, cz, baseW, baseH, buildRotation);

    const { playerRegionId = 0, regions } = useGameStore.getState();
    const pRegion = regions.find((r) => r.id === (playerRegionId ?? 0));

    const validation = validateRotatedBuildingPlacement(
      activeBuildType,
      footprint,
      grid,
      resourceDeposits,
      pRegion?.bounds,
      pRegion?.id
    );

    const allowed = validation.allowed;
    const baseTileH = grid.getTile(hoveredTile[0], hoveredTile[1])?.height || 0.05;

    return {
      cx,
      cz,
      baseH: baseTileH,
      blueprint,
      footprint,
      allowed,
      reason: validation.reason,
    };
  }, [activeTool, activeBuildType, hoveredTile, buildRotation, grid, resourceDeposits, buildingVersion]);

  useEffect(() => {
    if (activeTool !== 'road') {
      setRoadStartPoint(null);
      setRoadPreviewPath([]);
      setCurrentSnapTarget(null);
    }
  }, [activeTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      keysRef.current[code] = true;

      if (e.key === 'Escape') {
        if (activeTool === 'road') {
          setRoadStartPoint(null);
          setRoadPreviewPath([]);
          setCurrentSnapTarget(null);
        } else if (activeTool === 'build') {
          useGameStore.getState().setActiveTool('select');
        }
      }

      const isBuildMode = activeTool === 'build' || Boolean(activeBuildType);
      if (isBuildMode) {
        if (code === 'keyq' || e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') {
          e.preventDefault();
          audioManager.playUIClick();
          useGameStore.getState().rotateBuilding('ccw', Math.PI / 12);
          return;
        }
        if (
          code === 'keye' || e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У' ||
          code === 'keyr' || e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К'
        ) {
          e.preventDefault();
          audioManager.playUIClick();
          useGameStore.getState().rotateBuilding('cw', Math.PI / 12);
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      keysRef.current[code] = false;
      keyHoldDurationRef.current[code] = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool, activeBuildType]);

  const isRoadPlacementAllowed = (x: number, z: number): boolean => {
    const { playerRegionId, regions } = useGameStore.getState();
    const pRegion = regions.find((r) => r.id === (playerRegionId ?? 0));
    if (!pRegion?.bounds) return true;
    if (GridMap.canRegionConnectToHighwayAt(pRegion.id, x, z)) return true;

    const tile = grid.getTile(x, z);
    if (tile?.terrain === 'road') return true;

    if (GridMap.getDistanceToHighway(x, z) <= 4.0) return true;

    return false;
  };

  const getEffectiveTile = (
    rawX: number,
    rawZ: number,
    isShiftKey: boolean = false
  ): { coords: [number, number]; snapTarget: RoadSnapTarget | null } => {
    if (activeTool !== 'road' || roadEraseMode || isShiftKey) {
      return { coords: [rawX, rawZ], snapTarget: null };
    }

    interface Candidate {
      x: number;
      z: number;
      dist: number;
      type: 'road' | 'highway' | 'building';
      label: string;
    }
    const candidates: Candidate[] = [];

    for (const node of visibleBuildingSnapNodes) {
      const d = Math.hypot(node.x - rawX, node.z - rawZ);
      if (d <= 2.1) {
        candidates.push({
          x: node.x,
          z: node.z,
          dist: d,
          type: 'building',
          label: node.buildingName,
        });
      }
    }

    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const tx = rawX + dx;
        const tz = rawZ + dz;
        if (tx < 0 || tx >= grid.width || tz < 0 || tz >= grid.height) continue;
        const t = grid.getTile(tx, tz);
        if (t?.terrain === 'road') {
          if (roadStartPoint && tx === roadStartPoint[0] && tz === roadStartPoint[1]) {
            if (Math.hypot(rawX - tx, rawZ - tz) > 0.8) continue;
          }
          const d = Math.hypot(tx - rawX, tz - rawZ);
          if (d <= 1.85) {
            const isHighway = GridMap.isTradeHighwayTile(tx, tz);
            candidates.push({
              x: tx,
              z: tz,
              dist: d,
              type: isHighway ? 'highway' : 'road',
              label: isHighway ? 'Королівський тракт' : 'Дорога',
            });
          }
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.dist - b.dist);
      const best = candidates[0];
      return {
        coords: [best.x, best.z],
        snapTarget: {
          x: best.x,
          z: best.z,
          type: best.type,
          label: best.label,
        },
      };
    }

    return { coords: [rawX, rawZ], snapTarget: null };
  };

  const eraseRoadAtTile = (x: number, z: number): boolean => {
    let erased = false;
    if (grid.removeRoad(x, z)) {
      updateTileInTexture(x, z);
      erased = true;
    }
    if (!erased) {
      const neighbors = [
        [x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]
      ];
      for (const [nx, nz] of neighbors) {
        if (nx >= 0 && nx < grid.width && nz >= 0 && nz < grid.height) {
          if (grid.getTile(nx, nz)?.terrain === 'road') {
            if (grid.removeRoad(nx, nz)) {
              updateTileInTexture(nx, nz);
              erased = true;
              break;
            }
          }
        }
      }
    }

    if (erased) {
      audioManager.playRoadErase();
      useGameStore.getState().incrementBuildingVersion();
      useGameStore.getState().incrementFoliageVersion(true);
    }
    return erased;
  };

  const eraseRoadAlongStroke = (x0: number, z0: number, x1: number, z1: number) => {
    const dx = Math.abs(x1 - x0);
    const dz = Math.abs(z1 - z0);
    const sx = x0 < x1 ? 1 : -1;
    const sz = z0 < z1 ? 1 : -1;
    let err = dx - dz;
    let cx = x0;
    let cz = z0;
    let anyErased = false;

    while (true) {
      if (grid.removeRoad(cx, cz)) {
        updateTileInTexture(cx, cz);
        anyErased = true;
      }
      if (cx === x1 && cz === z1) break;
      const e2 = 2 * err;
      if (e2 > -dz) {
        err -= dz;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cz += sz;
      }
    }

    if (anyErased) {
      audioManager.playRoadErase();
      useGameStore.getState().incrementBuildingVersion();
      useGameStore.getState().incrementFoliageVersion(true);
    }
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      isPointerDownRef.current = false;
      lastErasedTileRef.current = null;
      prevErasedPosRef.current = null;
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.point) return;
    const rawX = Math.floor(e.point.x);
    const rawZ = Math.floor(e.point.z);

    if (rawX >= 0 && rawX < grid.width && rawZ >= 0 && rawZ < grid.height) {
      const isRoadOrBuild = activeTool === 'road' || activeTool === 'build';
      let gx = rawX;
      let gz = rawZ;

      if (isRoadOrBuild) {
        const { coords, snapTarget } = getEffectiveTile(rawX, rawZ, e.shiftKey);
        gx = coords[0];
        gz = coords[1];
        setCurrentSnapTarget(snapTarget);

        const curHover = useGameStore.getState().hoveredTile;
        if (!curHover || curHover[0] !== gx || curHover[1] !== gz) {
          useGameStore.getState().setHoveredTile([gx, gz]);
        }
      }

      if (
        activeTool === 'road' &&
        roadEraseMode &&
        isPointerDownRef.current &&
        pointerButtonRef.current === 0
      ) {
        if (prevErasedPosRef.current) {
          const [px, pz] = prevErasedPosRef.current;
          if (px !== rawX || pz !== rawZ) {
            eraseRoadAlongStroke(px, pz, rawX, rawZ);
            prevErasedPosRef.current = [rawX, rawZ];
          }
        } else {
          prevErasedPosRef.current = [rawX, rawZ];
          eraseRoadAtTile(rawX, rawZ);
        }
      }

      if (activeTool === 'road' && !roadEraseMode && roadStartPoint) {
        if (gx === roadStartPoint[0] && gz === roadStartPoint[1]) {
          setRoadPreviewPath([[gx, gz]]);
        } else {
          const linePath = getSmartRoadPath(
            grid,
            roadStartPoint[0],
            roadStartPoint[1],
            gx,
            gz,
            isRoadPlacementAllowed,
            resourceDeposits
          );
          setRoadPreviewPath(linePath);
        }
      }
    } else {
      if (useGameStore.getState().hoveredTile !== null) {
        useGameStore.getState().setHoveredTile(null);
      }
      if (activeTool === 'road' && roadStartPoint) {
        setRoadPreviewPath([]);
      }
      setCurrentSnapTarget(null);
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.point) return;

    isPointerDownRef.current = true;
    pointerButtonRef.current = e.button;

    const rawX = Math.floor(e.point.x);
    const rawZ = Math.floor(e.point.z);
    const { coords, snapTarget } = getEffectiveTile(rawX, rawZ, e.shiftKey);
    const [gx, gz] = coords;
    const tile = grid.getTile(gx, gz);
    if (!tile) return;

    const { addChronicleEvent, addPendingJob, resources, playerRegionId = 0, regions } = useGameStore.getState();

    if (activeTool === 'road') {
      if (!isRoadPlacementAllowed(gx, gz)) {
        addChronicleEvent({
          title: 'Чужі володіння!',
          description: 'Ви не маєте права прокладати дороги в глибині чужих володінь без дозволу сусіднього лорда.',
          type: 'warning',
        });
        return;
      }
    } else if (activeTool === 'build' || activeTool === 'chop') {
      const pRegion = regions.find((r) => r.id === (playerRegionId ?? 0));
      if (pRegion?.bounds) {
        const b = pRegion.bounds;
        if (gx < b.minX || gx > b.maxX || gz < b.minZ || gz > b.maxZ) {
          addChronicleEvent({
            title: 'Чужі володіння!',
            description: 'Ви не маєте права будувати чи рубати ліс на чужій території без дозволу сусіднього лорда.',
            type: 'warning',
          });
          return;
        }
      }
    }

    if (activeTool === 'road') {
      if (roadEraseMode) {
        if (e.button === 0) {
          prevErasedPosRef.current = [rawX, rawZ];
          eraseRoadAtTile(rawX, rawZ);
        } else if (e.button === 2) {
          audioManager.playUIClick();
          setRoadEraseMode(false);
        }
        return;
      }

      if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
        if (roadStartPoint !== null) {
          audioManager.playUIClick();
          setRoadStartPoint(null);
          setRoadPreviewPath([]);
          addChronicleEvent({
            title: 'Прокладання скасовано',
            description: 'Поточну лінію дороги скасовано.',
            type: 'info',
          });
        } else {
          eraseRoadAtTile(rawX, rawZ);
        }
        return;
      }

      if (e.button === 0) {
        if (roadStartPoint === null) {
          const startTile = grid.getTile(gx, gz);
          if (startTile && startTile.terrain !== 'water' && !startTile.buildingId) {
            audioManager.playRoadDraw();
            setRoadStartPoint([gx, gz]);
            setRoadPreviewPath([[gx, gz]]);
            const snapMsg = snapTarget ? ` (прив'язка: ${snapTarget.label})` : '';
            addChronicleEvent({
              title: 'Початок дороги обрано',
              description: `Тягніть лінію та клацніть ЛКМ, щоб прокласти шлях.${snapMsg} ПКМ або Esc — скасувати.`,
              type: 'info',
            });
          }
        } else {
          if (roadPreviewPath.length > 0) {
            if (!isRoadPathValid(grid, roadPreviewPath, resourceDeposits)) {
              audioManager.playUIError();
              addChronicleEvent({
                title: 'Неможливо прокласти дорогу!',
                description: 'Шлях перетинає воду, споруду або поклади ресурсів.',
                type: 'warning',
              });
              return;
            }

            let pavedCount = 0;
            for (const [px, pz] of roadPreviewPath) {
              if (grid.paveRoad(px, pz, resourceDeposits)) {
                updateTileInTexture(px, pz);
                pavedCount++;
              }
            }

            if (pavedCount > 0 || roadPreviewPath.length > 0) {
              audioManager.playRoadDraw();
              useGameStore.getState().incrementBuildingVersion();
              useGameStore.getState().incrementFoliageVersion(true);
              const connectMsg = snapTarget
                ? ` Приєднано до: ${snapTarget.label}.`
                : '';
              addChronicleEvent({
                title: 'Прокладено дорогу',
                description: `Збудовано ґрунтовий шлях (${roadPreviewPath.length} м).${connectMsg} Селяни отримали бонус +50% до швидкості руху!`,
                type: 'info',
              });
            }

            setRoadStartPoint(null);
            setRoadPreviewPath([]);
            setCurrentSnapTarget(null);
          }
        }
        return;
      }
      return;
    }

    if (activeTool === 'build' && e.button === 2) {
      audioManager.playUIPanelClose();
      useGameStore.getState().setActiveTool('select');
      return;
    }

    if (e.button !== 0) return;

    if (activeTool === 'build' && activeBuildType) {
      const blueprint = BUILDING_BLUEPRINTS[activeBuildType];
      if (!blueprint) return;

      const { resourceDeposits, buildRotation = 0, playerRegionId = 0, regions } = useGameStore.getState();
      const baseW = blueprint.width;
      const baseH = blueprint.height;
      const cx = gx + baseW / 2;
      const cz = gz + baseH / 2;

      const footprint = getRotatedBuildingFootprint(cx, cz, baseW, baseH, buildRotation);
      const pRegion = regions.find((r) => r.id === (playerRegionId ?? 0));

      const validation = validateRotatedBuildingPlacement(
        activeBuildType,
        footprint,
        grid,
        resourceDeposits,
        pRegion?.bounds,
        pRegion?.id
      );

      if (!validation.allowed) {
        audioManager.playUIError();
        addChronicleEvent({
          title: 'Неможливо збудувати!',
          description: validation.reason || 'Місце зайняте водою, іншою будівлею або перешкодами.',
          type: 'warning',
        });
        return;
      }

      let canAfford = true;
      for (const [res, cost] of Object.entries(blueprint.cost)) {
        if ((resources[res as keyof typeof resources] || 0) < (cost || 0)) {
          canAfford = false;
          break;
        }
      }

      if (!canAfford) {
        audioManager.playUIError();
        addChronicleEvent({
          title: 'Бракує ресурсів!',
          description: `Недостатньо матеріалів для зведення ${blueprint.name}.`,
          type: 'danger',
        });
        return;
      }

      audioManager.playBuildingPlace(Math.floor(cx), Math.floor(cz));

      const buildingId = `building-${activeBuildType}-${Date.now()}`;
      const buildingH = grid.occupyTilesForBuilding(footprint.coveredTiles, buildingId);

      world.add({
        id: buildingId,
        name: blueprint.name,
        isBuilding: true,
        buildingType: activeBuildType,
        buildingHealth: blueprint.health,
        maxBuildingHealth: blueprint.health,
        buildingWidth: footprint.boundingBoxWidth,
        buildingHeight: footprint.boundingBoxHeight,
        rotationAngle: buildRotation,
        isCompleted: false,
        constructionProgress: 0,
        requiredMaterials: { ...blueprint.cost },
        deliveredMaterials: {},
        mulesCount: activeBuildType === 'hitching_post' ? 1 : undefined,
        maxMules: activeBuildType === 'hitching_post' ? 3 : undefined,
        gridPosition: [footprint.minGridX, footprint.minGridZ],
        position: [cx, buildingH, cz],
        localInventory: { wood: 0 },
        factionId: 'player',
        regionId: playerRegionId ?? 0,
      });

      useGameStore.getState().incrementBuildingVersion();
      useGameStore.getState().incrementFoliageVersion();

      addPendingJob({
        id: `job-build-${buildingId}`,
        type: 'build_structure',
        targetPosition: [footprint.minGridX, footprint.minGridZ],
        targetBuildingId: buildingId,
        progress: 0,
        totalWork: 30 + footprint.coveredTiles.length * 8,
      });

      addChronicleEvent({
        title: 'Закладено фундамент',
        description: `Розпочато будівництво: ${blueprint.name}. Робітники вирушають на майданчик.`,
        type: 'info',
      });
      return;
    }

    if (activeTool === 'chop' && (tile.foliageType === 'tree' || tile.foliageType === 'fallen_tree')) {
      audioManager.playUIClick();
      const isFallen = tile.foliageType === 'fallen_tree';
      addPendingJob({
        id: `job-chop-${gx}-${gz}`,
        type: isFallen ? 'chop_fallen_log' : 'chop_tree',
        targetPosition: [gx, gz],
        progress: 0,
        totalWork: isFallen ? 45 : 55,
      });
      addChronicleEvent({
        title: isFallen ? 'Наказ: Розпил поваленого дерева' : 'Наказ: Лісоповал',
        description: isFallen
          ? `Призначено розпил поваленого стовбура на (${gx}, ${gz}).`
          : `Призначено вирубку дерева на координатах (${gx}, ${gz}).`,
        type: 'info',
      });
      return;
    }

    if (activeTool === 'mine' && tile.foliageType === 'rock') {
      audioManager.playUIClick();
      addPendingJob({
        id: `job-mine-${gx}-${gz}`,
        type: 'mine_rock',
        targetPosition: [gx, gz],
        progress: 0,
        totalWork: 35,
      });
      addChronicleEvent({
        title: 'Наказ: Видобуток каменю',
        description: `Призначено розкопку валуна на координатах (${gx}, ${gz}).`,
        type: 'info',
      });
      return;
    }

    if (tile.buildingId) {
      audioManager.playUIPanelOpen();
      useGameStore.getState().setSelectedEntityId(tile.buildingId);
    } else {
      if (useGameStore.getState().selectedEntityId) {
        audioManager.playUIPanelClose();
      }
      useGameStore.getState().setSelectedEntityId(null);
    }
  };

  return (
    <group visible={!isStrategicView}>
      <mesh
        geometry={dioramaBaseGeometry}
        material={dioramaBaseMaterial}
        position={[grid.width / 2, -0.95, grid.height / 2]}
        receiveShadow
        raycast={() => null}
      />

      <mesh
        geometry={terrainGeometry}
        material={terrainMaterial}
        position={[grid.width / 2, 0, grid.height / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        raycast={() => null}
      />

      <mesh
        position={[grid.width / 2, 0, grid.height / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => {
          if (activeTool === 'road') {
            e.nativeEvent?.preventDefault?.();
          }
        }}
      >
        <planeGeometry args={[grid.width, grid.height]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {(activeTool === 'build' || activeTool === 'road') && (
        <lineSegments geometry={buildGridLines} raycast={() => null}>
          <lineBasicMaterial
            color={activeTool === 'road' ? (roadEraseMode ? '#ef4444' : '#fbbf24') : '#ffffff'}
            transparent
            opacity={activeTool === 'road' ? 0.20 : 0.16}
          />
        </lineSegments>
      )}

      <HoveredTileCursor roadEraseMode={roadEraseMode} currentSnapTarget={currentSnapTarget} />

      {buildPreviewData && (
        <group>
          {buildPreviewData.footprint.coveredTiles.map(([tx, tz]) => {
            const tileH = grid.getTile(tx, tz)?.height || 0.05;
            return (
              <mesh
                key={`cov-${tx}-${tz}`}
                position={[tx + 0.5, tileH + 0.015, tz + 0.5]}
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={COVERED_TILE_GEO}
              >
                <meshBasicMaterial
                  color={buildPreviewData.allowed ? '#22c55e' : '#ef4444'}
                  transparent
                  opacity={0.32}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}

          <group
            position={[buildPreviewData.cx, buildPreviewData.baseH, buildPreviewData.cz]}
            rotation={[0, buildRotation, 0]}
          >
            <BuildingPlacementGhost
              type={activeBuildType!}
              allowed={buildPreviewData.allowed}
              width={buildPreviewData.blueprint.width}
              height={buildPreviewData.blueprint.height}
            />

            <Html
              position={[0, Math.max(1.8, buildPreviewData.blueprint.height * 0.6 + 1.2), 0]}
              center
              zIndexRange={[25, 0]}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div
                className={`px-3 py-1 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-2 whitespace-nowrap text-xs font-cinzel font-bold transition-all duration-150 ${
                  buildPreviewData.allowed
                    ? 'bg-[#121418]/95 border-emerald-500/80 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-[#181212]/95 border-red-500/80 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                }`}
              >
                <span>{buildPreviewData.blueprint.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/70 text-amber-200 font-sans">
                  [Q / E] {Math.round((((buildRotation * 180) / Math.PI) % 360 + 360) % 360)}°
                </span>
              </div>
            </Html>
          </group>
        </group>
      )}

      {!isStrategicView && activeTool === 'road' && roadEraseMode && hoveredTile && (
        <Html
          position={[hoveredTile[0] + 0.5, 0.55, hoveredTile[1] + 0.5]}
          center
          zIndexRange={[15, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="bg-stone-950/95 text-red-300 text-[10px] px-2.5 py-1 rounded-md border border-red-500/70 whitespace-nowrap shadow-xl backdrop-blur-md flex items-center gap-1.5 animate-pulse">
            <span>🧹</span>
            <span className="font-semibold text-white">Режим знесення:</span>
            <span>ЛКМ — стерти шлях</span>
            <span className="text-stone-400">[ПКМ: вийти]</span>
          </div>
        </Html>
      )}

      {!isStrategicView && activeTool === 'road' && !roadEraseMode && visibleBuildingSnapNodes.map((node) => {
        const isStart = roadStartPoint && roadStartPoint[0] === node.x && roadStartPoint[1] === node.z;
        const isHovered = hoveredTile && hoveredTile[0] === node.x && hoveredTile[1] === node.z;
        const isTarget = currentSnapTarget && currentSnapTarget.x === node.x && currentSnapTarget.z === node.z;
        const color = isStart ? '#22c55e' : isTarget ? '#38bdf8' : isHovered ? '#67e8f9' : '#0284c7';
        const scale = isStart ? 1.25 : isTarget ? 1.22 : isHovered ? 1.15 : 1.0;

        return (
          <group key={node.id} position={[node.x + 0.5, 0.04, node.z + 0.5]} scale={[scale, scale, scale]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={SNAP_RING_GEO}>
              <meshBasicMaterial color={color} transparent opacity={isStart || isTarget ? 0.95 : 0.75} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} geometry={SNAP_CIRCLE_GEO}>
              <meshBasicMaterial color={color} transparent opacity={isStart || isTarget ? 0.7 : 0.35} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.12, 0]} geometry={SNAP_CYLINDER_GEO}>
              <meshLambertMaterial color={isStart ? '#15803d' : '#0369a1'} />
            </mesh>
            <mesh position={[0, 0.24, 0]} geometry={SNAP_SPHERE_GEO}>
              <meshBasicMaterial color={color} />
            </mesh>
            {(isHovered || isTarget) && (
              <Html position={[0, 0.48, 0]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                <div className="bg-slate-950/95 text-cyan-200 text-[10px] px-2.5 py-0.5 rounded border border-cyan-500/70 whitespace-nowrap shadow-xl backdrop-blur-md flex items-center gap-1">
                  <span>🚪</span>
                  <span>{node.buildingName} (Вхід)</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {!isStrategicView && activeTool === 'road' && !roadEraseMode && currentSnapTarget && currentSnapTarget.type !== 'building' && (
        <group position={[currentSnapTarget.x + 0.5, (grid.getTile(currentSnapTarget.x, currentSnapTarget.z)?.height || 0.05) + 0.028, currentSnapTarget.z + 0.5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={SNAP_TARGET_RING_GEO}>
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.95} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} geometry={SNAP_CIRCLE_GEO}>
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 0.48, 0]} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div className="bg-stone-950/95 text-amber-300 text-[10px] px-2.5 py-0.5 rounded border border-amber-500/70 whitespace-nowrap shadow-xl backdrop-blur-md flex items-center gap-1 animate-bounce">
              <span>🔗</span>
              <span>{currentSnapTarget.label}</span>
            </div>
          </Html>
        </group>
      )}

      {!isStrategicView && activeTool === 'road' && (
        <RoadPlacementPreview
          grid={grid}
          startPoint={roadStartPoint}
          path={roadPreviewPath}
          hoveredTile={hoveredTile}
          snapTarget={currentSnapTarget}
        />
      )}
    </group>
  );
}

function HoveredTileCursor({ roadEraseMode, currentSnapTarget }: { roadEraseMode: boolean; currentSnapTarget: any }) {
  const activeTool = useGameStore((s) => s.activeTool);
  const hoveredTile = useGameStore((s) => s.activeTool === 'road' ? s.hoveredTile : null);
  if (!hoveredTile || activeTool !== 'road') return null;

  return (
    <mesh
      position={[hoveredTile[0] + 0.5, 0.008, hoveredTile[1] + 0.5]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => null}
      geometry={CURSOR_PLANE_GEO}
    >
      <meshBasicMaterial
        color={
          activeTool === 'road' && roadEraseMode
            ? '#ef4444'
            : activeTool === 'road'
            ? (currentSnapTarget ? '#38bdf8' : '#f59e0b')
            : '#fbbf24'
        }
        transparent
        opacity={activeTool === 'road' && roadEraseMode ? 0.65 : activeTool === 'road' ? 0.40 : 0.22}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
