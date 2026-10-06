import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

interface Props {
  mapWidth?: number;
  mapHeight?: number;
}

export function MapEdgeFog({ mapWidth = 256, mapHeight = 256 }: Props) {
  const isStrategicView = useGameStore((s) => s.isStrategicView);
  const seaTexRef = useRef<THREE.Texture | null>(null);

  const fogTexture = useMemo(() => {
    const SIZE = 2048;
    const canvas = document.createElement('canvas');
    canvas.width  = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    const PLANE_W = mapWidth  * 6;
    const PLANE_H = mapHeight * 6;

    const u0 = (PLANE_W / 2 - mapWidth  / 2) / PLANE_W;
    const u1 = (PLANE_W / 2 + mapWidth  / 2) / PLANE_W;
    const v0 = (PLANE_H / 2 - mapHeight / 2) / PLANE_H;
    const v1 = (PLANE_H / 2 + mapHeight / 2) / PLANE_H;

    const px0 = Math.round(u0 * SIZE);
    const px1 = Math.round(u1 * SIZE);
    const py0 = Math.round(v0 * SIZE);
    const py1 = Math.round(v1 * SIZE);
    const pw  = px1 - px0;
    const ph  = py1 - py0;

    const FADE_NORTH = 32;
    const FADE_OTHER = 24;

    const DARK  = 'rgba(5, 8, 15, 1)';
    const CLEAR = 'rgba(5, 8, 15, 0)';

    ctx.fillStyle = DARK;
    ctx.fillRect(0,    0,           px0,          SIZE);
    ctx.fillRect(px1,  0,           SIZE - px1,   SIZE);
    ctx.fillRect(px0,  0,           pw,           py0);
    ctx.fillRect(px0,  py1,         pw,           SIZE - py1);

    let g = ctx.createLinearGradient(px0, 0, px0 + FADE_OTHER, 0);
    g.addColorStop(0.0, DARK);
    g.addColorStop(1.0, CLEAR);
    ctx.fillStyle = g;
    ctx.fillRect(px0, py0, FADE_OTHER, ph);

    g = ctx.createLinearGradient(px1 - FADE_OTHER, 0, px1, 0);
    g.addColorStop(0.0, CLEAR);
    g.addColorStop(1.0, DARK);
    ctx.fillStyle = g;
    ctx.fillRect(px1 - FADE_OTHER, py0, FADE_OTHER, ph);

    const gNorth = ctx.createLinearGradient(0, py0, 0, py0 + FADE_NORTH);
    gNorth.addColorStop(0.0, DARK);
    gNorth.addColorStop(0.12, DARK);
    gNorth.addColorStop(1.0, CLEAR);
    ctx.fillStyle = gNorth;
    ctx.fillRect(px0, py0, pw, FADE_NORTH);

    g = ctx.createLinearGradient(0, py1 - FADE_OTHER, 0, py1);
    g.addColorStop(0.0, CLEAR);
    g.addColorStop(1.0, DARK);
    ctx.fillStyle = g;
    ctx.fillRect(px0, py1 - FADE_OTHER, pw, FADE_OTHER);

    const maxNW = Math.max(FADE_OTHER, FADE_NORTH);
    let rg = ctx.createRadialGradient(px0, py0, 0, px0, py0, maxNW);
    rg.addColorStop(0.0, DARK);
    rg.addColorStop(0.15, DARK);
    rg.addColorStop(1.0, CLEAR);
    ctx.fillStyle = rg;
    ctx.fillRect(px0, py0, FADE_OTHER, FADE_NORTH);

    const maxNE = Math.max(FADE_OTHER, FADE_NORTH);
    rg = ctx.createRadialGradient(px1, py0, 0, px1, py0, maxNE);
    rg.addColorStop(0.0, DARK);
    rg.addColorStop(0.15, DARK);
    rg.addColorStop(1.0, CLEAR);
    ctx.fillStyle = rg;
    ctx.fillRect(px1 - FADE_OTHER, py0, FADE_OTHER, FADE_NORTH);

    rg = ctx.createRadialGradient(px0, py1, 0, px0, py1, FADE_OTHER);
    rg.addColorStop(0.0, DARK);
    rg.addColorStop(0.15, DARK);
    rg.addColorStop(1.0, CLEAR);
    ctx.fillStyle = rg;
    ctx.fillRect(px0, py1 - FADE_OTHER, FADE_OTHER, FADE_OTHER);

    rg = ctx.createRadialGradient(px1, py1, 0, px1, py1, FADE_OTHER);
    rg.addColorStop(0.0, DARK);
    rg.addColorStop(0.15, DARK);
    rg.addColorStop(1.0, CLEAR);
    ctx.fillStyle = rg;
    ctx.fillRect(px1 - FADE_OTHER, py1 - FADE_OTHER, FADE_OTHER, FADE_OTHER);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [mapWidth, mapHeight]);

  const seaTexture = useMemo(() => {
    const SIZE = 512;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.strokeStyle = 'rgba(16, 28, 50, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 55; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * SIZE, Math.random() * SIZE, 18 + Math.random() * 45, Math.PI * 0.5, Math.PI * 1.7);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(25, 55, 110, 0.09)';
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * SIZE, Math.random() * SIZE, Math.random() * 1.3 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    tex.colorSpace = THREE.SRGBColorSpace;
    seaTexRef.current = tex;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (seaTexRef.current) {
      seaTexRef.current.offset.x += delta * 0.003;
      seaTexRef.current.offset.y += delta * 0.0015;
    }
  });

  const cx      = mapWidth  / 2;
  const cz      = mapHeight / 2;
  const PLANE_W = mapWidth  * 6;
  const PLANE_H = mapHeight * 6;

  const hollowFogGeometry = useMemo(() => {
    const x0 = -120;
    const x1 = 24;
    const x2 = mapWidth - 24;
    const x3 = mapWidth + 120;

    const z0 = -120;
    const z1 = 32;
    const z2 = mapHeight - 24;
    const z3 = mapHeight + 120;

    const quads: [number, number, number, number][] = [
      [x0, x1, z0, z1],
      [x1, x2, z0, z1],
      [x2, x3, z0, z1],
      [x0, x1, z1, z2],
      [x2, x3, z1, z2],
      [x0, x1, z2, z3],
      [x1, x2, z2, z3],
      [x2, x3, z2, z3],
    ];

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let vertIdx = 0;

    for (const [qx0, qx1, qz0, qz1] of quads) {
      const lx0 = qx0 - cx;
      const lx1 = qx1 - cx;
      const lz0 = qz0 - cz;
      const lz1 = qz1 - cz;

      positions.push(
        lx0, -lz1, 0,
        lx1, -lz1, 0,
        lx1, -lz0, 0,
        lx0, -lz0, 0,
      );

      const uA = (qx0 + PLANE_W / 2 - cx) / PLANE_W;
      const uB = (qx1 + PLANE_W / 2 - cx) / PLANE_W;
      const vA = 1.0 - (qz1 + PLANE_H / 2 - cz) / PLANE_H;
      const vB = 1.0 - (qz0 + PLANE_H / 2 - cz) / PLANE_H;

      uvs.push(
        uA, vA,
        uB, vA,
        uB, vB,
        uA, vB,
      );

      indices.push(
        vertIdx, vertIdx + 1, vertIdx + 2,
        vertIdx, vertIdx + 2, vertIdx + 3,
      );
      vertIdx += 4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [mapWidth, mapHeight, cx, cz, PLANE_W, PLANE_H]);

  useEffect(() => {
    return () => {
      fogTexture.dispose();
      hollowFogGeometry.dispose();
    };
  }, [fogTexture, hollowFogGeometry]);

  return (
    <group visible={!isStrategicView}>
      <mesh
        position={[cx, -0.5, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={-10}
      >
        <planeGeometry args={[mapWidth + 240, mapHeight + 240]} />
        <meshBasicMaterial map={seaTexture} color="#03050a" toneMapped={false} />
      </mesh>

      <mesh
        position={[cx, 8.0, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={12}
        geometry={hollowFogGeometry}
      >
        <meshBasicMaterial
          map={fogTexture}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
