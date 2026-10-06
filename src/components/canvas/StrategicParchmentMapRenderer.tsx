import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GridMap } from '../../engine/grid/GridMap';
import { useGameStore } from '../../store/useGameStore';
import { INITIAL_RESOURCE_DEPOSITS } from '../../engine/resources/ResourceDeposits';

interface Props {
  grid: GridMap;
}

export function StrategicParchmentMapRenderer({ grid }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const playerRegionId = useGameStore((s) => s.playerRegionId);
  const buildingVersion = useGameStore((s) => s.buildingVersion);
  const terrainVersion = useGameStore((s) => s.terrainVersion);

  const [activeHoverRegion, setActiveHoverRegion] = useState<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drawParchmentToCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const regions = useGameStore.getState().regions;
    const resourceDeposits = useGameStore.getState().resourceDeposits;

    const cw = canvas.width;
    const ch = canvas.height;
    const scale = cw / grid.width;

    const bgGrad = ctx.createRadialGradient(
      cw / 2, ch / 2, 100,
      cw / 2, ch / 2, cw * 0.72
    );
    bgGrad.addColorStop(0, '#f9f2e3');
    bgGrad.addColorStop(0.45, '#efe1c6');
    bgGrad.addColorStop(0.75, '#debfa0');
    bgGrad.addColorStop(0.92, '#c29f74');
    bgGrad.addColorStop(1.0, '#8c6b45');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle = 'rgba(70, 45, 18, 0.032)';
    let seed = 42;
    const prng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 7000; i++) {
      const rx = prng() * cw;
      const ry = prng() * ch;
      ctx.fillRect(rx, ry, prng() * 4 + 1, prng() * 4 + 1);
    }

    ctx.strokeStyle = 'rgba(110, 75, 30, 0.045)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cw * 0.82, ch * 0.22, 160, 0, Math.PI * 2);
    ctx.stroke();

    const regionColors: Record<number, { wash: string; stroke: string; label: string; sub: string; crest: string }> = {
      0: {
        wash: 'rgba(217, 119, 6, 0.06)',
        stroke: '#b45309',
        label: 'GOLDHOF',
        sub: '',
        crest: '👑',
      },
      1: {
        wash: 'rgba(185, 28, 28, 0.06)',
        stroke: '#991b1b',
        label: 'WALDAU',
        sub: '',
        crest: '⚔️',
      },
      2: {
        wash: 'rgba(37, 99, 235, 0.06)',
        stroke: '#1d4ed8',
        label: 'EICHENAU',
        sub: '',
        crest: '🛡️',
      },
      3: {
        wash: 'rgba(22, 101, 52, 0.06)',
        stroke: '#15803d',
        label: 'ZWEIAU',
        sub: '',
        crest: '🦅',
      },
      4: {
        wash: 'rgba(101, 163, 13, 0.06)',
        stroke: '#65a30d',
        label: 'MITTENWALD',
        sub: '',
        crest: '🌲',
      },
      5: {
        wash: 'rgba(234, 88, 12, 0.07)',
        stroke: '#ea580c',
        label: 'KÖNIGSWEG',
        sub: '',
        crest: '⚖️',
      },
    };

    for (const reg of regions) {
      const col = regionColors[reg.id] || regionColors[0];
      const rx = reg.bounds.minX * scale;
      const rz = reg.bounds.minZ * scale;
      const rw = (reg.bounds.maxX - reg.bounds.minX + 1) * scale;
      const rh = (reg.bounds.maxZ - reg.bounds.minZ + 1) * scale;

      ctx.fillStyle = col.wash;
      ctx.fillRect(rx, rz, rw, rh);

      ctx.strokeStyle = col.stroke;
      ctx.lineWidth = 3.0;
      ctx.setLineDash([12, 6]);
      ctx.strokeRect(rx + 4, rz + 4, rw - 8, rh - 8);
      ctx.setLineDash([]);
    }

    for (let x = 0; x < grid.width; x++) {
      for (let z = 0; z < grid.height; z++) {
        const tile = grid.tiles[x]?.[z];
        if (!tile || tile.terrain !== 'water') continue;

        const px = x * scale;
        const pz = z * scale;

        ctx.fillStyle = '#3a5f73';
        ctx.fillRect(px, pz, scale, scale);

        ctx.fillStyle = 'rgba(100, 160, 190, 0.25)';
        ctx.fillRect(px + 1.5, pz + 1.5, scale - 3, scale - 3);
      }
    }

    ctx.lineWidth = 1.5;
    for (let x = 0; x < grid.width; x++) {
      for (let z = 0; z < grid.height; z++) {
        const tile = grid.tiles[x]?.[z];
        if (!tile || tile.terrain !== 'water') continue;

        const px = x * scale;
        const pz = z * scale;

        const nWater = grid.tiles[x]?.[z - 1]?.terrain === 'water';
        const sWater = grid.tiles[x]?.[z + 1]?.terrain === 'water';
        const wWater = grid.tiles[x - 1]?.[z]?.terrain === 'water';
        const eWater = grid.tiles[x + 1]?.[z]?.terrain === 'water';

        ctx.strokeStyle = '#1b333f';

        if (!nWater) {
          ctx.beginPath();
          ctx.moveTo(px, pz);
          ctx.lineTo(px + scale, pz);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(50, 90, 110, 0.45)';
          ctx.beginPath();
          ctx.moveTo(px, pz + 3);
          ctx.lineTo(px + scale, pz + 3);
          ctx.stroke();
          ctx.strokeStyle = '#1b333f';
        }
        if (!sWater) {
          ctx.beginPath();
          ctx.moveTo(px, pz + scale);
          ctx.lineTo(px + scale, pz + scale);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(50, 90, 110, 0.45)';
          ctx.beginPath();
          ctx.moveTo(px, pz + scale - 3);
          ctx.lineTo(px + scale, pz + scale - 3);
          ctx.stroke();
          ctx.strokeStyle = '#1b333f';
        }
        if (!wWater) {
          ctx.beginPath();
          ctx.moveTo(px, pz);
          ctx.lineTo(px, pz + scale);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(50, 90, 110, 0.45)';
          ctx.beginPath();
          ctx.moveTo(px + 3, pz);
          ctx.lineTo(px + 3, pz + scale);
          ctx.stroke();
          ctx.strokeStyle = '#1b333f';
        }
        if (!eWater) {
          ctx.beginPath();
          ctx.moveTo(px + scale, pz);
          ctx.lineTo(px + scale, pz + scale);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(50, 90, 110, 0.45)';
          ctx.beginPath();
          ctx.moveTo(px + scale - 3, pz);
          ctx.lineTo(px + scale - 3, pz + scale);
          ctx.stroke();
          ctx.strokeStyle = '#1b333f';
        }

        if (nWater && sWater && wWater && eWater && (x * 7 + z * 13) % 19 === 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(px + scale * 0.35, pz + scale * 0.5, scale * 0.3, Math.PI * 0.8, Math.PI * 1.8);
          ctx.stroke();
          ctx.lineWidth = 1.5;
        }
      }
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const highwayWidth = scale * 1.6;
    const localRoadWidth = scale * 1.30;

    const ewHighwayPoints: [number, number][] = [];
    for (let x = 0; x <= grid.width; x += 0.5) {
      ewHighwayPoints.push([x * scale, GridMap.getHighwayZ(x) * scale]);
    }

    const j1Z = GridMap.getHighwayZ(128);
    const n1HighwayPoints: [number, number][] = [];
    for (let z = 0; z <= j1Z; z += 0.5) {
      n1HighwayPoints.push([GridMap.getNorthHighway1X(z) * scale, z * scale]);
    }

    const j3Z = GridMap.getHighwayZ(256);
    const n2HighwayPoints: [number, number][] = [];
    for (let z = 0; z <= j3Z; z += 0.5) {
      n2HighwayPoints.push([GridMap.getNorthHighway2X(z) * scale, z * scale]);
    }

    const j2Z = GridMap.getHighwayZ(192);
    const sHighwayPoints: [number, number][] = [];
    for (let z = j2Z; z <= grid.height; z += 0.5) {
      sHighwayPoints.push([GridMap.getSouthHighwayX(z) * scale, z * scale]);
    }

    const drawHighwayPath = (points: [number, number][]) => {
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i][0], points[i][1]);
        else ctx.lineTo(points[i][0], points[i][1]);
      }
    };

    const drawAllHighwayBranches = () => {
      drawHighwayPath(ewHighwayPoints);
      ctx.stroke();
      drawHighwayPath(n1HighwayPoints);
      ctx.stroke();
      drawHighwayPath(n2HighwayPoints);
      ctx.stroke();
      drawHighwayPath(sHighwayPoints);
      ctx.stroke();
    };

    const plazas: [number, number, number][] = [
      [128.0 * scale, j1Z * scale, 2.3 * scale],
      [192.0 * scale, j2Z * scale, 2.5 * scale],
      [256.0 * scale, j3Z * scale, 2.3 * scale],
    ];

    const drawAllPlazaDiscs = (extra: number = 0) => {
      for (const [px, pz, pr] of plazas) {
        ctx.beginPath();
        ctx.arc(px, pz, pr + extra, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const isHighwayCore = (tx: number, tz: number) => {
      return GridMap.isTradeHighwayTile(tx, tz);
    };

    const playerTiles = new Set<string>();
    const playerTileList: [number, number][] = [];
    const highwayConnMap = new Map<string, [number, number]>();

    for (let x = 0; x < grid.width; x++) {
      for (let z = 0; z < grid.height; z++) {

        if (isHighwayCore(x, z)) continue;

        const tile = grid.tiles[x]?.[z];
        if (tile && tile.terrain === 'road') {
          const k = `${x},${z}`;
          playerTiles.add(k);
          playerTileList.push([x, z]);

          let touchesHighway = GridMap.getDistanceToHighway(x + 0.5, z + 0.5) <= 1.25;
          if (!touchesHighway) {
            for (const [ox, oz] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
              if (GridMap.isTradeHighwayTile(x + ox, z + oz)) {
                touchesHighway = true;
                break;
              }
            }
          }

          if (touchesHighway) {
            const [cTx, cTz] = GridMap.getClosestHighwayTile(x + 0.5, z + 0.5);
            highwayConnMap.set(k, [cTx * scale, cTz * scale]);
          }
        }
      }
    }

    const adj = new Map<string, string[]>();
    for (const [x, z] of playerTileList) {
      const k = `${x},${z}`;
      const nbrs: string[] = [];

      const orthos = [
        [x + 1, z],
        [x - 1, z],
        [x, z + 1],
        [x, z - 1],
      ];
      for (const [ox, oz] of orthos) {
        const ok = `${ox},${oz}`;
        if (playerTiles.has(ok)) {
          nbrs.push(ok);
        }
      }

      const diags = [
        [x + 1, z + 1, x + 1, z, x, z + 1],
        [x + 1, z - 1, x + 1, z, x, z - 1],
        [x - 1, z + 1, x - 1, z, x, z + 1],
        [x - 1, z - 1, x - 1, z, x, z - 1],
      ];
      for (const [dx, dz, s1x, s1z, s2x, s2z] of diags) {
        const dk = `${dx},${dz}`;
        if (playerTiles.has(dk)) {
          const s1k = `${s1x},${s1z}`;
          const s2k = `${s2x},${s2z}`;
          if (!playerTiles.has(s1k) && !playerTiles.has(s2k)) {
            nbrs.push(dk);
          }
        }
      }

      adj.set(k, nbrs);
    }

    const visitedEdges = new Set<string>();
    const edgeKey = (a: string, b: string) => (a < b ? `${a}--${b}` : `${b}--${a}`);
    const rawPaths: [number, number][][] = [];
    const isolatedPoints: [number, number][] = [];

    for (const [x, z] of playerTileList) {
      const k = `${x},${z}`;
      const nbrs = adj.get(k) || [];
      if (nbrs.length === 0) {
        isolatedPoints.push([(x + 0.5) * scale, (z + 0.5) * scale]);
        continue;
      }

      const isJunction = nbrs.length !== 2 || highwayConnMap.has(k);
      if (!isJunction) continue;

      for (const nextKey of nbrs) {
        const eKey = edgeKey(k, nextKey);
        if (visitedEdges.has(eKey)) continue;
        visitedEdges.add(eKey);

        const path: [number, number][] = [];
        if (highwayConnMap.has(k)) {
          path.push(highwayConnMap.get(k)!);
        }
        path.push([(x + 0.5) * scale, (z + 0.5) * scale]);

        let currKey = nextKey;
        let prevKey = k;

        while (true) {
          const [cx, cz] = currKey.split(',').map(Number);
          path.push([(cx + 0.5) * scale, (cz + 0.5) * scale]);

          const currNbrs = adj.get(currKey) || [];
          const isCurrJunction = currNbrs.length !== 2 || highwayConnMap.has(currKey);

          if (isCurrJunction) {
            if (highwayConnMap.has(currKey)) {
              path.push(highwayConnMap.get(currKey)!);
            }
            break;
          }

          const nextStep = currNbrs.find((n) => n !== prevKey);
          if (!nextStep) break;

          const nextEKey = edgeKey(currKey, nextStep);
          visitedEdges.add(nextEKey);
          prevKey = currKey;
          currKey = nextStep;
        }

        if (path.length >= 2) {
          rawPaths.push(path);
        }
      }
    }

    for (const [x, z] of playerTileList) {
      const k = `${x},${z}`;
      const nbrs = adj.get(k) || [];
      for (const nextKey of nbrs) {
        const eKey = edgeKey(k, nextKey);
        if (visitedEdges.has(eKey)) continue;
        visitedEdges.add(eKey);

        const path: [number, number][] = [[(x + 0.5) * scale, (z + 0.5) * scale]];
        let currKey = nextKey;
        let prevKey = k;

        while (currKey !== k) {
          const [cx, cz] = currKey.split(',').map(Number);
          path.push([(cx + 0.5) * scale, (cz + 0.5) * scale]);

          const currNbrs = adj.get(currKey) || [];
          const nextStep = currNbrs.find((n) => n !== prevKey);
          if (!nextStep) break;

          const nextEKey = edgeKey(currKey, nextStep);
          visitedEdges.add(nextEKey);
          prevKey = currKey;
          currKey = nextStep;
        }
        if (path.length >= 2) {
          rawPaths.push(path);
        }
      }
    }

    const smoothPolyline = (pts: [number, number][]): [number, number][] => {
      if (pts.length <= 2) return pts;
      let curr = pts;
      for (let pass = 0; pass < 2; pass++) {
        const next: [number, number][] = [curr[0]];
        for (let i = 1; i < curr.length - 1; i++) {
          const p0 = curr[i - 1];
          const p1 = curr[i];
          const p2 = curr[i + 1];
          next.push([
            0.25 * p0[0] + 0.5 * p1[0] + 0.25 * p2[0],
            0.25 * p0[1] + 0.5 * p1[1] + 0.25 * p2[1],
          ]);
        }
        next.push(curr[curr.length - 1]);
        curr = next;
      }
      return curr;
    };

    const smoothedPlayerPaths = rawPaths.map(smoothPolyline);

    const drawPlayerPathStrokes = () => {
      for (const pts of smoothedPlayerPaths) {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
          else ctx.lineTo(pts[i][0], pts[i][1]);
        }
        ctx.stroke();
      }
    };

    ctx.strokeStyle = '#2b170a';
    ctx.fillStyle = '#2b170a';

    ctx.lineWidth = highwayWidth + 2.0;
    drawAllHighwayBranches();
    drawAllPlazaDiscs(1.0);

    ctx.lineWidth = localRoadWidth + 2.0;
    drawPlayerPathStrokes();

    for (const pt of isolatedPoints) {
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], (localRoadWidth + 2.0) / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#5a361b';
    ctx.fillStyle = '#5a361b';

    ctx.lineWidth = highwayWidth;
    drawAllHighwayBranches();
    drawAllPlazaDiscs(0);

    ctx.lineWidth = localRoadWidth;
    drawPlayerPathStrokes();

    for (const pt of isolatedPoints) {
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], localRoadWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#784d28';
    ctx.fillStyle = '#784d28';

    ctx.lineWidth = highwayWidth * 0.50;
    drawAllHighwayBranches();

    ctx.lineWidth = localRoadWidth * 0.44;
    drawPlayerPathStrokes();

    const drawContinuousWagonRuts = (points: [number, number][], rutOffset: number) => {
      if (points.length < 2) return;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const nextP = points[Math.min(points.length - 1, i + 1)];
        const prevP = points[Math.max(0, i - 1)];
        const dx = nextP[0] - prevP[0];
        const dz = nextP[1] - prevP[1];
        const len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;
        const rx = p[0] + nx * rutOffset;
        const rz = p[1] + nz * rutOffset;
        if (i === 0) ctx.moveTo(rx, rz);
        else ctx.lineTo(rx, rz);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const nextP = points[Math.min(points.length - 1, i + 1)];
        const prevP = points[Math.max(0, i - 1)];
        const dx = nextP[0] - prevP[0];
        const dz = nextP[1] - prevP[1];
        const len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;
        const rx = p[0] - nx * rutOffset;
        const rz = p[1] - nz * rutOffset;
        if (i === 0) ctx.moveTo(rx, rz);
        else ctx.lineTo(rx, rz);
      }
      ctx.stroke();
    };

    ctx.strokeStyle = 'rgba(43, 23, 10, 0.45)';
    ctx.lineWidth = 1.0;
    drawContinuousWagonRuts(ewHighwayPoints, highwayWidth * 0.28);
    drawContinuousWagonRuts(n1HighwayPoints, highwayWidth * 0.28);
    drawContinuousWagonRuts(n2HighwayPoints, highwayWidth * 0.28);
    drawContinuousWagonRuts(sHighwayPoints, highwayWidth * 0.28);

    ctx.strokeStyle = 'rgba(43, 23, 10, 0.38)';
    ctx.lineWidth = 0.85;
    for (const pts of smoothedPlayerPaths) {
      if (pts.length >= 2) {
        drawContinuousWagonRuts(pts, localRoadWidth * 0.25);
      }
    }

    for (const [px, pz, pr] of plazas) {
      ctx.beginPath();
      ctx.arc(px, pz, pr * 0.88, 0, Math.PI * 2);
      ctx.fillStyle = '#684523';
      ctx.fill();

      ctx.strokeStyle = 'rgba(43, 23, 10, 0.5)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(px, pz, pr * 0.65, 0, Math.PI * 2);
      ctx.arc(px, pz, pr * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      for (let a = 0; a < 8; a++) {
        const angle = (a * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(angle) * (pr * 0.2), pz + Math.sin(angle) * (pr * 0.2));
        ctx.lineTo(px + Math.cos(angle) * (pr * 0.85), pz + Math.sin(angle) * (pr * 0.85));
        ctx.stroke();
      }

      ctx.fillStyle = '#e7e5e4';
      ctx.strokeStyle = '#2b170a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, pz, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(43, 23, 10, 0.35)';
    const allHighwayPts = [...ewHighwayPoints, ...n1HighwayPoints, ...n2HighwayPoints, ...sHighwayPoints];
    for (let i = 0; i < allHighwayPts.length; i += 8) {
      const p = allHighwayPts[i];
      const offset = Math.sin(i * 1.7) * (highwayWidth * 0.35);
      ctx.beginPath();
      ctx.arc(p[0] + offset, p[1], 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const pts of smoothedPlayerPaths) {
      for (let i = 2; i < pts.length - 1; i += 5) {
        const p = pts[i];
        const ox = Math.sin(i * 3.7) * (localRoadWidth * 0.22);
        const oz = Math.cos(i * 2.3) * (localRoadWidth * 0.22);
        ctx.beginPath();
        ctx.arc(p[0] + ox, p[1] + oz, 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    for (let x = 1; x < grid.width - 1; x++) {
      for (let z = 1; z < grid.height - 1; z++) {
        const tile = grid.tiles[x]?.[z];
        if (!tile || (tile.terrain !== 'stone' && tile.foliageType !== 'rock')) continue;

        if (x % 3 === 0 && z % 3 === 0) {
          const px = x * scale;
          const pz = z * scale;
          const peakH = scale * 2.8;
          const peakW = scale * 2.2;

          ctx.fillStyle = '#decbb4';
          ctx.beginPath();
          ctx.moveTo(px, pz - peakH);
          ctx.lineTo(px - peakW * 0.5, pz + scale * 0.6);
          ctx.lineTo(px, pz + scale * 0.6);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#7a644f';
          ctx.beginPath();
          ctx.moveTo(px, pz - peakH);
          ctx.lineTo(px + peakW * 0.5, pz + scale * 0.6);
          ctx.lineTo(px, pz + scale * 0.6);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#382819';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, pz - peakH);
          ctx.lineTo(px - peakW * 0.5, pz + scale * 0.6);
          ctx.lineTo(px + peakW * 0.5, pz + scale * 0.6);
          ctx.closePath();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(px, pz - peakH);
          ctx.lineTo(px, pz + scale * 0.6);
          ctx.stroke();

          ctx.strokeStyle = '#261b11';
          ctx.lineWidth = 0.8;
          for (let h = 0.2; h < 0.9; h += 0.25) {
            ctx.beginPath();
            ctx.moveTo(px, pz - peakH * (1 - h));
            ctx.lineTo(px + peakW * 0.4 * h, pz - peakH * (1 - h) + scale * 0.4);
            ctx.stroke();
          }
        }
      }
    }

    for (let x = 0; x < grid.width; x += 2) {
      for (let z = 0; z < grid.height; z += 2) {
        const tile = grid.tiles[x]?.[z];
        if (!tile || tile.foliageType !== 'tree') continue;

        const px = x * scale;
        const pz = z * scale;
        const hash = ((Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1 + 1) % 1;

        if (hash > 0.40) {
          ctx.fillStyle = 'rgba(25, 40, 15, 0.25)';
          ctx.beginPath();
          ctx.ellipse(px + scale * 0.3, pz + scale * 0.6, scale * 0.85, scale * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#54381e';
          ctx.fillRect(px - scale * 0.12, pz + scale * 0.1, scale * 0.24, scale * 0.55);

          ctx.fillStyle = '#2b4d24';
          ctx.beginPath();
          ctx.arc(px, pz, scale * 0.95, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#4c783c';
          ctx.beginPath();
          ctx.arc(px - scale * 0.2, pz - scale * 0.2, scale * 0.72, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#183313';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(px, pz, scale * 0.95, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#422a16';
          ctx.fillRect(px - scale * 0.1, pz + scale * 0.3, scale * 0.2, scale * 0.45);
          ctx.fillStyle = '#1c3d26';
          ctx.strokeStyle = '#0c2113';
          ctx.lineWidth = 1.0;

          ctx.beginPath();
          ctx.moveTo(px, pz - scale * 1.35);
          ctx.lineTo(px - scale * 0.75, pz + scale * 0.45);
          ctx.lineTo(px + scale * 0.75, pz + scale * 0.45);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(90, 160, 110, 0.35)';
          ctx.beginPath();
          ctx.moveTo(px, pz - scale * 1.35);
          ctx.lineTo(px - scale * 0.75, pz + scale * 0.45);
          ctx.lineTo(px + scale * 0.45, pz + scale * 0.45);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    const townArt: Record<number, { type: 'castle' | 'timber' | 'mill' | 'citadel'; title: string }> = {
      0: { type: 'castle', title: 'Ґольдгоф' },
      1: { type: 'timber', title: 'Вальдау' },
      2: { type: 'mill', title: 'Айхенау' },
      3: { type: 'citadel', title: 'Цвайау' },
      4: { type: 'timber', title: 'Міттенвальд' },
      5: { type: 'citadel', title: 'Королівський Тракт' },
    };

    for (const reg of regions) {
      if (reg.owner === 'unclaimed') continue;
      const camp = reg.campPosition || reg.center;
      const tx = camp[0] * scale;
      const tz = camp[1] * scale;
      const isPlayer = reg.id === playerRegionId;
      const art = townArt[reg.id] || { type: 'castle', title: reg.name };

      ctx.fillStyle = 'rgba(30, 20, 10, 0.4)';
      ctx.beginPath();
      ctx.ellipse(tx, tz + scale * 1.5, scale * 3.5, scale * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1.5;

      if (art.type === 'castle') {
        ctx.fillStyle = '#d6c8b0';
        ctx.strokeStyle = '#2b1b0e';
        ctx.fillRect(tx - scale * 1.4, tz - scale * 2.2, scale * 2.8, scale * 3.2);
        ctx.strokeRect(tx - scale * 1.4, tz - scale * 2.2, scale * 2.8, scale * 3.2);
        ctx.fillRect(tx - scale * 2.2, tz - scale * 1.6, scale * 1.1, scale * 2.6);
        ctx.strokeRect(tx - scale * 2.2, tz - scale * 1.6, scale * 1.1, scale * 2.6);
        ctx.fillRect(tx + scale * 1.1, tz - scale * 1.6, scale * 1.1, scale * 2.6);
        ctx.strokeRect(tx + scale * 1.1, tz - scale * 1.6, scale * 1.1, scale * 2.6);
        ctx.fillStyle = '#9e3223';
        ctx.beginPath();
        ctx.moveTo(tx, tz - scale * 3.8);
        ctx.lineTo(tx - scale * 1.6, tz - scale * 2.2);
        ctx.lineTo(tx + scale * 1.6, tz - scale * 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(tx, tz - scale * 3.8);
        ctx.lineTo(tx + scale * 1.6, tz - scale * 4.3);
        ctx.lineTo(tx, tz - scale * 4.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1c120a';
        ctx.beginPath();
        ctx.arc(tx, tz + scale * 0.7, scale * 0.6, Math.PI, 0);
        ctx.lineTo(tx + scale * 0.6, tz + scale * 1.0);
        ctx.lineTo(tx - scale * 0.6, tz + scale * 1.0);
        ctx.closePath();
        ctx.fill();
      } else if (art.type === 'timber') {
        ctx.fillStyle = '#6b4f30';
        ctx.strokeStyle = '#2b1b0e';
        ctx.fillRect(tx - scale * 1.1, tz - scale * 2.6, scale * 2.2, scale * 3.5);
        ctx.strokeRect(tx - scale * 1.1, tz - scale * 2.6, scale * 2.2, scale * 3.5);
        ctx.beginPath();
        ctx.moveTo(tx - scale * 1.1, tz - scale * 2.6);
        ctx.lineTo(tx + scale * 1.1, tz);
        ctx.moveTo(tx + scale * 1.1, tz - scale * 2.6);
        ctx.lineTo(tx - scale * 1.1, tz);
        ctx.stroke();
        ctx.fillStyle = '#3e2d1d';
        ctx.beginPath();
        ctx.moveTo(tx, tz - scale * 3.9);
        ctx.lineTo(tx - scale * 1.6, tz - scale * 2.6);
        ctx.lineTo(tx + scale * 1.6, tz - scale * 2.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(tx, tz - scale * 3.9);
        ctx.lineTo(tx + scale * 1.5, tz - scale * 4.3);
        ctx.lineTo(tx, tz - scale * 4.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (art.type === 'mill') {
        ctx.fillStyle = '#cfbe9f';
        ctx.strokeStyle = '#2b1b0e';
        ctx.fillRect(tx - scale * 1.6, tz - scale * 1.5, scale * 2.4, scale * 2.4);
        ctx.strokeRect(tx - scale * 1.6, tz - scale * 1.5, scale * 2.4, scale * 2.4);
        ctx.fillStyle = '#8a6a3b';
        ctx.beginPath();
        ctx.moveTo(tx - scale * 0.4, tz - scale * 3.1);
        ctx.lineTo(tx - scale * 2.0, tz - scale * 1.5);
        ctx.lineTo(tx + scale * 1.1, tz - scale * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#382210';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(tx + scale * 1.4, tz + scale * 0.2, scale * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.beginPath();
          ctx.moveTo(tx + scale * 1.4, tz + scale * 0.2);
          ctx.lineTo(tx + scale * 1.4 + Math.cos(a) * scale * 0.9, tz + scale * 0.2 + Math.sin(a) * scale * 0.9);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#8a7966';
        ctx.strokeStyle = '#2b1b0e';
        ctx.beginPath();
        ctx.moveTo(tx - scale * 2.2, tz + scale * 1.2);
        ctx.lineTo(tx - scale * 1.5, tz - scale * 0.6);
        ctx.lineTo(tx + scale * 1.5, tz - scale * 0.6);
        ctx.lineTo(tx + scale * 2.2, tz + scale * 1.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#c5b8a5';
        ctx.fillRect(tx - scale * 1.1, tz - scale * 2.6, scale * 2.2, scale * 2.0);
        ctx.strokeRect(tx - scale * 1.1, tz - scale * 2.6, scale * 2.2, scale * 2.0);
        ctx.fillRect(tx - scale * 1.3, tz - scale * 3.2, scale * 2.6, scale * 0.6);
        ctx.strokeRect(tx - scale * 1.3, tz - scale * 3.2, scale * 2.6, scale * 0.6);
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(tx, tz - scale * 3.6, scale * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const bw = scale * 14.0;
      const bh = scale * 2.8;
      const by = tz + scale * 2.6;

      ctx.fillStyle = isPlayer ? '#78350f' : '#27221e';
      ctx.strokeStyle = isPlayer ? '#f59e0b' : '#6b5847';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.roundRect(tx - bw / 2, by - bh / 2, bw, bh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isPlayer ? '#fef08a' : '#f5f5f4';
      ctx.font = 'bold 13px "Cinzel", Georgia, serif';
      ctx.fillText(
        isPlayer ? `★ ${reg.name} (ВАШЕ) ★` : `🏰 ${reg.name}`,
        tx,
        by
      );
    }

    for (const reg of regions) {
      const col = regionColors[reg.id] || regionColors[0];
      const centerX = (((reg.bounds.minX + reg.bounds.maxX) / 2) * scale);
      const centerY = (((reg.bounds.minZ + reg.bounds.maxZ) / 2) * scale);

      const cwBox = scale * 26.0;
      const chBox = scale * 4.8;

      ctx.fillStyle = 'rgba(25, 15, 5, 0.45)';
      ctx.beginPath();
      ctx.roundRect(centerX - cwBox / 2 + 4, centerY - chBox / 2 + 4, cwBox, chBox, 8);
      ctx.fill();

      const cartGrad = ctx.createLinearGradient(centerX - cwBox / 2, centerY, centerX + cwBox / 2, centerY);
      cartGrad.addColorStop(0, '#ebd8b6');
      cartGrad.addColorStop(0.2, '#fcf7ec');
      cartGrad.addColorStop(0.8, '#fcf7ec');
      cartGrad.addColorStop(1, '#ebd8b6');
      ctx.fillStyle = cartGrad;
      ctx.strokeStyle = '#4a331c';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.roundRect(centerX - cwBox / 2, centerY - chBox / 2, cwBox, chBox, 6);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#a17849';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(centerX - cwBox / 2 + 3, centerY - chBox / 2 + 3, cwBox - 6, chBox - 6);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#22150a';
      ctx.font = 'bold 18px "Cinzel", Georgia, serif';
      ctx.fillText(col.label, centerX, centerY);
    }

    const deposits = (resourceDeposits && resourceDeposits.length > 0)
      ? resourceDeposits
      : INITIAL_RESOURCE_DEPOSITS;

    for (const dep of deposits) {
      const [gx, gz] = dep.gridPosition;
      const dx = gx * scale;
      const dz = gz * scale;

      ctx.fillStyle = 'rgba(20, 12, 5, 0.45)';
      ctx.beginPath();
      ctx.arc(dx + 2, dz + 2, scale * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dx, dz, scale * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = dep.isRich ? '#331a06' : '#1c1a17';
      ctx.fill();
      ctx.strokeStyle = dep.isRich ? '#f59e0b' : '#a8a29e';
      ctx.lineWidth = dep.isRich ? 3.0 : 2.0;
      ctx.stroke();

      ctx.strokeStyle = dep.isRich ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(dx, dz, scale * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      if (dep.isRich) {
        ctx.font = '15px sans-serif';
        ctx.fillText('👑', dx, dz - scale * 2.0);
      }

      ctx.font = '16px sans-serif';
      ctx.fillText(dep.icon, dx, dz - 0.5);
    }

    const compX = scale * 9.0;
    const compY = scale * 9.0;
    const compR = scale * 6.5;

    ctx.strokeStyle = '#4a3219';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(compX, compY, compR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(compX, compY, compR - 4, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const nextAngle = ((i + 1) * Math.PI) / 8;
      const isMajor = i % 2 === 0;
      const starLen = isMajor ? compR * 0.92 : compR * 0.60;

      ctx.fillStyle = isMajor ? '#332010' : '#d4af37';
      ctx.beginPath();
      ctx.moveTo(compX, compY);
      ctx.lineTo(compX + Math.cos(angle) * starLen, compY + Math.sin(angle) * starLen);
      ctx.lineTo(compX + Math.cos(nextAngle) * (compR * 0.3), compY + Math.sin(nextAngle) * (compR * 0.3));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.font = 'bold 15px serif';
    ctx.fillStyle = '#261507';
    ctx.fillText('ПН', compX, compY - compR - 8);
    ctx.fillText('ПД', compX, compY + compR + 10);
    ctx.fillText('ЗХ', compX - compR - 10, compY + 2);
    ctx.fillText('СХ', compX + compR + 10, compY + 2);

    ctx.strokeStyle = '#382210';
    ctx.lineWidth = 3.0;
    ctx.strokeRect(6, 6, cw - 12, ch - 12);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, cw - 32, ch - 32);

    const tickLen = 32;
    for (let p = 16; p < cw - 32; p += tickLen * 2) {
      ctx.fillStyle = '#2b190c';
      ctx.fillRect(p, 6, tickLen, 10);
      ctx.fillRect(p, ch - 16, tickLen, 10);
    }
    for (let p = 16; p < ch - 32; p += tickLen * 2) {
      ctx.fillStyle = '#2b190c';
      ctx.fillRect(6, p, 10, tickLen);
      ctx.fillRect(cw - 16, p, 10, tickLen);
    }

    const cornerOffsets = [
      [22, 22],
      [cw - 22, 22],
      [22, ch - 22],
      [cw - 22, ch - 22],
    ];
    ctx.fillStyle = '#b45309';
    for (const [cx, cy] of cornerOffsets) {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [grid, playerRegionId]);

  const { mapTexture, canvas } = useMemo(() => {
    const cvs = document.createElement('canvas');
    cvs.width = 2048;
    cvs.height = 2048;
    drawParchmentToCanvas(cvs);

    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    return { mapTexture: tex, canvas: cvs };
  }, [drawParchmentToCanvas]);

  const textureRef = useRef<THREE.CanvasTexture>(mapTexture);
  const canvasRef = useRef<HTMLCanvasElement>(canvas);
  useEffect(() => {
    textureRef.current = mapTexture;
    canvasRef.current = canvas;
  }, [mapTexture, canvas]);

  useEffect(() => {
    return () => {
      mapTexture.dispose();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [mapTexture]);

  const isDirtyRef = useRef(true);

  useEffect(() => {
    isDirtyRef.current = true;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const zoom = (window as any).__lastCameraZoom ?? 38;
      if (zoom < 22 || useGameStore.getState().isStrategicView) {
        if (canvasRef.current && textureRef.current) {
          drawParchmentToCanvas(canvasRef.current);
          textureRef.current.needsUpdate = true;
          isDirtyRef.current = false;
        }
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [buildingVersion, terrainVersion, drawParchmentToCanvas]);

  useFrame(({ camera }) => {
    const orthoCam = camera as THREE.OrthographicCamera;
    const zoom = orthoCam.zoom || 38;

    if (zoom < 22 && isDirtyRef.current) {
      if (canvasRef.current && textureRef.current) {
        drawParchmentToCanvas(canvasRef.current);
        textureRef.current.needsUpdate = true;
        isDirtyRef.current = false;
      }
    }

    const t = THREE.MathUtils.clamp((18.5 - zoom) / (18.5 - 16.5), 0, 1);

    if (matRef.current) {
      matRef.current.opacity = t;
      matRef.current.depthWrite = t > 0.95;
    }

    if (meshRef.current) {
      meshRef.current.visible = t > 0.005;
    }
  });

  const handlePointerMove = (e: any) => {
    if (!e.point) return;
    const gx = e.point.x;
    const gz = e.point.z;

    const currentRegions = useGameStore.getState().regions;
    const reg = currentRegions.find(
      (r) =>
        gx >= r.bounds.minX &&
        gx <= r.bounds.maxX &&
        gz >= r.bounds.minZ &&
        gz <= r.bounds.maxZ
    );

    if (reg && reg.id !== activeHoverRegion) {
      setActiveHoverRegion(reg.id);
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[grid.width / 2, 6.2, grid.height / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[grid.width + 10, grid.height + 10]} />
        <meshBasicMaterial
          ref={matRef}
          map={mapTexture}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
