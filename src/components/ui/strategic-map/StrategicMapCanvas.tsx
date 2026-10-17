import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GridMap } from '../../../engine/grid/GridMap';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { characterEntities } from '../../../engine/ecs/world';
import { DEFAULT_REGIONS } from '../../../constants/world';
import { getHeraldryGlyph } from '../../../constants/playerIdentity';
import type { SpawnPointData } from '../../../types/game';

interface StrategicMapCanvasProps {
  grid: GridMap;
  mode: 'setup' | 'ingame';
  selectedRegionId?: number;
  onSelectRegion?: (regionId: number) => void;
  selectedSpawnPointId?: string;
  selectedHeraldry?: { shieldColor: string; emblemId: string };
  onSelectSpawnPoint?: (spawnPointId: string, regionId: number) => void;
  onClose?: () => void;
  width?: number;
  height?: number;
}

export function StrategicMapCanvas({
  grid,
  mode,
  selectedRegionId: propSelectedRegionId,
  onSelectRegion,
  selectedSpawnPointId: propSelectedSpawnPointId,
  selectedHeraldry,
  onSelectSpawnPoint,
  onClose,
  width: initialWidth,
  height: initialHeight,
}: StrategicMapCanvasProps) {
  const { dict } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const storeRegions = useGameStore((s) => s.regions);
  const regions = mode === 'setup' ? DEFAULT_REGIONS : storeRegions;
  const playerRegionId = useGameStore((s) => s.playerRegionId);
  const setCameraFocusTarget = useGameStore((s) => s.setCameraFocusTarget);
  const cameraFocusTarget = useGameStore((s) => s.cameraFocusTarget);
  const buildingVersion = useGameStore((s) => s.buildingVersion);
  const foliageVersion = useGameStore((s) => s.foliageVersion);
  const terrainVersion = useGameStore((s) => s.terrainVersion);

  const activeRegionId = mode === 'setup' ? (propSelectedRegionId ?? 0) : playerRegionId;

  const [hoveredSpawnPoint, setHoveredSpawnPoint] = useState<SpawnPointData | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const topographyCanvas = useMemo(() => {
    const offscreen = document.createElement('canvas');
    const gw = grid.width;
    const gh = grid.height;
    const scale = 3;
    offscreen.width = gw * scale;
    offscreen.height = gh * scale;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return offscreen;

    const bgGrad = ctx.createRadialGradient(
      offscreen.width / 2, offscreen.height / 2, 40,
      offscreen.width / 2, offscreen.height / 2, offscreen.width * 0.75
    );
    bgGrad.addColorStop(0, '#e8e5d8');
    bgGrad.addColorStop(0.7, '#d9d9cb');
    bgGrad.addColorStop(1, '#c6c6b7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    const regionWashes = ['#c7ad80', '#8ea497', '#91a9a8', '#b2a49a', '#9cab83', '#c5a376'];
    for (const region of DEFAULT_REGIONS) {
      ctx.fillStyle = `${regionWashes[region.id]}28`;
      ctx.fillRect(region.bounds.minX * scale, region.bounds.minZ * scale,
        (region.bounds.maxX - region.bounds.minX + 1) * scale,
        (region.bounds.maxZ - region.bounds.minZ + 1) * scale);
    }

    ctx.fillStyle = 'rgba(120, 80, 40, 0.03)';
    for (let i = 0; i < 2000; i++) {
      const rx = ((i * 1297 + 271) % 2003) / 2003 * offscreen.width;
      const ry = ((i * 7919 + 113) % 2011) / 2011 * offscreen.height;
      ctx.fillRect(rx, ry, 2, 2);
    }

    for (let x = 0; x < gw; x++) {
      for (let z = 0; z < gh; z++) {
        const tile = grid.tiles[x]?.[z];
        if (!tile) continue;

        const px = x * scale;
        const pz = z * scale;

        if (tile.terrain === 'water') {
          ctx.fillStyle = '#557e90';
          ctx.fillRect(px, pz, scale, scale);
        } else if (tile.terrain === 'road') {
          ctx.fillStyle = '#b69c75';
          ctx.fillRect(px, pz, scale, scale);
        } else if (tile.terrain === 'stone' || tile.foliageType === 'rock') {
          ctx.fillStyle = '#a69888';
          ctx.fillRect(px, pz, scale, scale);
        } else if (tile.foliageType === 'tree') {
          ctx.fillStyle = '#ced0bd';
          ctx.fillRect(px, pz, scale, scale);
        }
      }
    }

    ctx.strokeStyle = '#385d6d';
    ctx.lineWidth = 1.2;
    for (let x = 1; x < gw - 1; x += 2) {
      for (let z = 1; z < gh - 1; z += 2) {
        const tile = grid.tiles[x]?.[z];
        if (tile && tile.terrain === 'water') {
          const isBorder =
            grid.tiles[x - 1]?.[z]?.terrain !== 'water' ||
            grid.tiles[x + 1]?.[z]?.terrain !== 'water' ||
            grid.tiles[x]?.[z - 1]?.terrain !== 'water' ||
            grid.tiles[x]?.[z + 1]?.terrain !== 'water';
          if (isBorder) {
            ctx.beginPath();
            ctx.arc(x * scale, z * scale, scale * 1.15, 0, Math.PI * 2);
            ctx.stroke();
          } else if ((x + z) % 7 === 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.arc(x * scale, z * scale, scale * 0.7, 0, Math.PI);
            ctx.stroke();
            ctx.strokeStyle = '#385d6d';
          }
        }
      }
    }

    for (let x = 0; x < gw; x += 2) {
      for (let z = 0; z < gh; z += 2) {
        const tile = grid.tiles[x]?.[z];
        if (tile && tile.foliageType === 'tree') {
          const px = x * scale;
          const pz = z * scale;

          const randTree = ((Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1 + 1) % 1;

          let isPine = false;
          let treeColor = '#456a35';
          let strokeColor = '#253e1c';

          if (randTree > 0.48) {
            isPine = false;
            treeColor = '#3c6237';
            strokeColor = '#25442a';
          } else if (randTree > 0.12) {
            isPine = true;
            treeColor = '#31533c';
            strokeColor = '#1c3929';
          } else {
            isPine = false;
            treeColor = '#8e7047';
            strokeColor = '#60452f';
          }

          ctx.fillStyle = treeColor;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 0.8;

          if (isPine) {
            ctx.beginPath();
            ctx.moveTo(px, pz - scale * 1.55);
            ctx.lineTo(px - scale * 0.92, pz + scale * 0.8);
            ctx.lineTo(px + scale * 0.92, pz + scale * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(px, pz, scale * 1.0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }

    ctx.strokeStyle = '#6e5f51';
    ctx.fillStyle = '#9e8c79';
    ctx.lineWidth = 1;
    for (let x = 135; x < gw - 8; x += 6) {
      for (let z = 135; z < gh - 8; z += 6) {
        const tile = grid.tiles[x]?.[z];
        if (tile && (tile.terrain === 'stone' || tile.foliageType === 'rock')) {
          const px = x * scale;
          const pz = z * scale;
          ctx.beginPath();
          ctx.moveTo(px, pz - scale * 2);
          ctx.lineTo(px - scale * 1.6, pz + scale * 1.2);
          ctx.lineTo(px + scale * 1.6, pz + scale * 1.2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    return offscreen;
  }, [grid, buildingVersion, foliageVersion, terrainVersion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const cw = canvas.width;
      const ch = canvas.height;
      if (cw === 0 || ch === 0) return;

      ctx.clearRect(0, 0, cw, ch);

      ctx.drawImage(topographyCanvas, 0, 0, cw, ch);

      const toScreenX = (gx: number) => (gx / grid.width) * cw;
      const toScreenY = (gz: number) => (gz / grid.height) * ch;

      for (const reg of regions) {
        const isSelected = mode === 'setup' && reg.id === activeRegionId;
        const isHovered = reg.id === hoveredRegionId;

        const rx = toScreenX(reg.bounds.minX);
        const rz = toScreenY(reg.bounds.minZ);
        const rw = toScreenX(reg.bounds.maxX - reg.bounds.minX + 1);
        const rh = toScreenY(reg.bounds.maxZ - reg.bounds.minZ + 1);

        if (mode === 'setup') {
          ctx.save();
          ctx.setLineDash([7, 5]);
          ctx.strokeStyle = isSelected ? 'rgba(93, 72, 40, 0.9)' : 'rgba(99, 95, 80, 0.66)';
          ctx.lineWidth = isSelected ? 2.3 : 1.4;
          ctx.strokeRect(rx + 1, rz + 1, rw - 2, rh - 2);
          ctx.restore();
        } else if (isHovered) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(rx, rz, rw, rh);
        }
      }

      const roadPaths: Array<Array<[number, number]>> = [];
      const eastWest: Array<[number, number]> = [];
      for (let gx = 0; gx <= grid.width; gx += 4) {
        const gz = GridMap.getHighwayZ(gx);
        eastWest.push([toScreenX(gx), toScreenY(gz)]);
      }
      roadPaths.push(eastWest);

      const j1Z = GridMap.getHighwayZ(128);
      const northWest: Array<[number, number]> = [];
      for (let gz = 0; gz <= j1Z; gz += 3) {
        const gx = GridMap.getNorthHighway1X(gz);
        northWest.push([toScreenX(gx), toScreenY(gz)]);
      }
      northWest.push([toScreenX(128), toScreenY(j1Z)]);
      roadPaths.push(northWest);

      const j3Z = GridMap.getHighwayZ(256);
      const northEast: Array<[number, number]> = [];
      for (let gz = 0; gz <= j3Z; gz += 3) {
        const gx = GridMap.getNorthHighway2X(gz);
        northEast.push([toScreenX(gx), toScreenY(gz)]);
      }
      northEast.push([toScreenX(256), toScreenY(j3Z)]);
      roadPaths.push(northEast);

      const j2Z = GridMap.getHighwayZ(192);
      const south: Array<[number, number]> = [[toScreenX(192), toScreenY(j2Z)]];
      for (let gz = Math.ceil(j2Z); gz <= grid.height; gz += 3) {
        const gx = GridMap.getSouthHighwayX(gz);
        south.push([toScreenX(gx), toScreenY(gz)]);
      }
      roadPaths.push(south);

      for (const points of roadPaths) {
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (const [lineWidth, strokeStyle, dash] of [
          [8, '#59442e', []],
          [5, '#a77e51', []],
          [1.2, '#dac092', [4, 7]],
        ] as const) {
          ctx.beginPath();
          points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = strokeStyle;
          ctx.setLineDash([...dash]);
          ctx.stroke();
        }
        ctx.restore();
      }

      const plazas = [
        [128, j1Z],
        [192, j2Z],
        [256, j3Z],
      ];
      ctx.save();
      for (const [px, pz] of plazas) {
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(toScreenX(px), toScreenY(pz), 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      const regionTitles = [
        { id: 0, title: 'GOLDHOF', x: toScreenX(64), y: toScreenY(92), color: '#78350f' },
        { id: 4, title: 'MITTENWALD', x: toScreenX(192), y: toScreenY(92), color: '#3f6212' },
        { id: 1, title: 'WALDAU', x: toScreenX(320), y: toScreenY(92), color: '#7f1d1d' },
        { id: 5, title: 'KÖNIGSWEG', x: toScreenX(192), y: toScreenY(208), color: '#9a3412' },
        { id: 2, title: 'EICHENAU', x: toScreenX(96), y: toScreenY(308), color: '#1e3a8a' },
        { id: 3, title: 'ZWEIAU', x: toScreenX(288), y: toScreenY(308), color: '#14532d' },
      ];

      for (const rt of regionTitles) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const bannerW = 108;
        const bannerH = 22;
        const bx = rt.x - bannerW / 2;
        const by = rt.y - bannerH / 2;

        ctx.shadowColor = 'rgba(20, 10, 5, 0.4)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1.5;

        const cardGrad = ctx.createLinearGradient(bx, by, bx, by + bannerH);
        cardGrad.addColorStop(0, '#fef9ec');
        cardGrad.addColorStop(1, '#f5e4c0');
        ctx.fillStyle = cardGrad;
        ctx.beginPath();
        ctx.roundRect(bx, by, bannerW, bannerH, 5);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(180, 83, 9, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(bx + 2, by + 2, bannerW - 4, bannerH - 4);

        ctx.font = 'bold 11px "Cinzel", "Cinzel Decorative", Georgia, serif';
        ctx.fillStyle = rt.color;
        ctx.fillText(rt.title, rt.x, rt.y);

        ctx.restore();
      }

      ctx.save();
      ctx.font = 'italic 8.5px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#1e3a5f';
      ctx.textAlign = 'center';
      ctx.fillText(dict.strategicMap.lakeGolden, toScreenX(72), toScreenY(70) - 9);
      ctx.fillText(dict.strategicMap.lakeOak, toScreenX(60), toScreenY(195) - 9);
      ctx.fillText(dict.strategicMap.lakeForest, toScreenX(320), toScreenY(72) - 9);
      ctx.restore();

      if (mode === 'setup') {
        regions.flatMap((region) => (region.spawnPoints || GridMap.getPresetSpawnPoints(region.id)).map((sp) => ({ sp, regionId: region.id }))).forEach(({ sp, regionId }) => {
          const sx = toScreenX(sp.position[0]);
          const sz = toScreenY(sp.position[1]);
          const isSelected = propSelectedSpawnPointId === sp.id;
          const isHovered = hoveredSpawnPoint?.id === sp.id;
          if (isSelected) return;

          ctx.save();
          ctx.beginPath();
          ctx.arc(sx, sz, isHovered ? 11 : 9, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? '#e6d4a2' : 'rgba(218, 214, 194, 0.5)';
          ctx.fill();
          ctx.strokeStyle = '#857d69';
          ctx.lineWidth = 1.7;
          ctx.stroke();
          if (regionId === activeRegionId) {
            ctx.beginPath();
            ctx.arc(sx, sz, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#79633f';
            ctx.fill();
          }
          ctx.restore();
        });

        const selectedPoint = regions.flatMap((region) => region.spawnPoints || GridMap.getPresetSpawnPoints(region.id))
          .find((point) => point.id === propSelectedSpawnPointId);
        if (selectedPoint) {
          const sx = toScreenX(selectedPoint.position[0]);
          const sy = toScreenY(selectedPoint.position[1]);
          ctx.save();
          ctx.translate(sx, sy);
          ctx.shadowColor = '#241b11';
          ctx.shadowBlur = 9;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fillStyle = '#211f1b';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#c8ac73';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-12, -14);
          ctx.lineTo(12, -14);
          ctx.lineTo(12, 5);
          ctx.quadraticCurveTo(11, 13, 0, 18);
          ctx.quadraticCurveTo(-11, 13, -12, 5);
          ctx.closePath();
          ctx.fillStyle = selectedHeraldry?.shieldColor || '#723b31';
          ctx.fill();
          ctx.strokeStyle = '#e8d4a5';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.font = 'bold 19px Georgia, serif';
          ctx.fillStyle = '#f6e9c5';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(getHeraldryGlyph(selectedHeraldry?.emblemId || 'crown'), 0, 0);
          ctx.restore();
        }
      }

      if (mode === 'ingame') {
        for (const reg of regions) {
          if (reg.owner === 'unclaimed') continue;
          const camp = reg.campPosition || reg.center;
          const cx = toScreenX(camp[0]);
          const cz = toScreenY(camp[1]);
          const isPlayer = reg.id === playerRegionId;

          ctx.save();
          const badgeW = 105;
          const badgeH = 26;
          const bx = cx - badgeW / 2;
          const by = cz - badgeH / 2 - 14;

          ctx.fillStyle = isPlayer ? 'rgba(30, 20, 10, 0.92)' : 'rgba(25, 12, 12, 0.92)';
          ctx.strokeStyle = reg.heraldryColor || '#f59e0b';
          ctx.lineWidth = isPlayer ? 2 : 1.5;
          ctx.beginPath();
          ctx.roundRect(bx, by, badgeW, badgeH, 5);
          ctx.fill();
          ctx.stroke();

          ctx.font = 'bold 10px "Cinzel", Georgia, serif';
          ctx.textAlign = 'left';
          ctx.fillStyle = isPlayer ? '#fef08a' : '#fecaca';
          const regName = dict.regions.items[reg.id]?.name || reg.name;
          ctx.fillText(`${reg.heraldryIcon} ${regName}`, bx + 6, by + 12);

          ctx.font = '9px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`👥 ${reg.population} ${dict.strategicMap.residentsShort} • ${reg.owner === 'player' ? dict.strategicMap.yours : dict.strategicMap.botLord}`, bx + 6, by + 22);

          ctx.beginPath();
          ctx.arc(cx, cz, 6, 0, Math.PI * 2);
          ctx.fillStyle = reg.heraldryColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        }

        for (const u of characterEntities) {
          if (!u.position) continue;
          const ux = toScreenX(u.position[0]);
          const uz = toScreenY(u.position[2]);

          ctx.save();
          ctx.beginPath();
          ctx.arc(ux, uz, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = u.factionId === 'player' ? '#38bdf8' : (u.avatarColor || '#ef4444');
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
        }

        if (cameraFocusTarget) {
          const camX = toScreenX(cameraFocusTarget[0]);
          const camZ = toScreenY(cameraFocusTarget[1]);
          const viewSize = 28;

          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(camX - viewSize / 2, camZ - viewSize / 2, viewSize, viewSize);
          ctx.beginPath();
          ctx.arc(camX, camZ, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.save();
      const vignette = ctx.createRadialGradient(
        cw / 2, ch / 2, cw * 0.45,
        cw / 2, ch / 2, cw * 0.72
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.85, 'rgba(40, 25, 10, 0.28)');
      vignette.addColorStop(1, 'rgba(20, 10, 5, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, cw, ch);

      ctx.strokeStyle = '#543b1e';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, cw - 6, ch - 6);
      ctx.strokeStyle = '#855e32';
      ctx.lineWidth = 2;
      ctx.strokeRect(7, 7, cw - 14, ch - 14);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    grid,
    topographyCanvas,
    regions,
    mode,
    activeRegionId,
    hoveredRegionId,
    hoveredSpawnPoint,
    propSelectedSpawnPointId,
    selectedHeraldry,
    playerRegionId,
    cameraFocusTarget,
  ]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * grid.width;
    const clickZ = ((e.clientY - rect.top) / rect.height) * grid.height;

    const quadrantId = GridMap.getRegionIdForCoord(clickX, clickZ);

    if (mode === 'setup') {
      for (const region of regions) {
        for (const sp of region.spawnPoints || GridMap.getPresetSpawnPoints(region.id)) {
          if (Math.hypot(sp.position[0] - clickX, sp.position[1] - clickZ) <= 8) {
            onSelectSpawnPoint?.(sp.id, region.id);
            return;
          }
        }
      }

      if (onSelectRegion && quadrantId !== activeRegionId) {
        onSelectRegion(quadrantId);
      }
    } else {
      setCameraFocusTarget([clickX, clickZ]);
      if (onClose) {
        onClose();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseGx = ((e.clientX - rect.left) / rect.width) * grid.width;
    const mouseGz = ((e.clientY - rect.top) / rect.height) * grid.height;

    setMousePos({
      x: Math.max(8, Math.min(canvas.offsetLeft + e.clientX - rect.left + 16, (containerRef.current?.clientWidth || 640) - 220)),
      y: Math.max(8, Math.min(canvas.offsetTop + e.clientY - rect.top + 16, (containerRef.current?.clientHeight || 640) - 100)),
    });

    const qId = GridMap.getRegionIdForCoord(mouseGx, mouseGz);
    setHoveredRegionId(qId);

    if (mode === 'setup') {
      let foundSp: SpawnPointData | null = null;
      for (const region of regions) {
        for (const sp of region.spawnPoints || GridMap.getPresetSpawnPoints(region.id)) {
          if (Math.hypot(sp.position[0] - mouseGx, sp.position[1] - mouseGz) <= 8) {
            foundSp = sp;
            break;
          }
        }
        if (foundSp) break;
      }
      setHoveredSpawnPoint(foundSp);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRegionId(null);
    setHoveredSpawnPoint(null);
    setMousePos(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={initialWidth || 640}
        height={initialHeight || 640}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`object-contain shadow-[0_12px_40px_rgba(0,0,0,0.85)] cursor-pointer ${mode === 'setup' ? 'realm-setup-map-canvas' : 'w-full h-full max-w-[660px] max-h-[660px] rounded-xl'}`}
      />

      {hoveredSpawnPoint && mousePos && (
        <div
          className="absolute z-30 pointer-events-none p-2.5 rounded-xl bg-[#1c150e]/95 border border-amber-500/80 shadow-[0_8px_25px_rgba(0,0,0,0.9)] max-w-xs text-amber-100 text-xs font-cinzel animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        >
          <div className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
            <span>⛺</span>
            <span>{hoveredSpawnPoint.name}</span>
          </div>
          <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
            {hoveredSpawnPoint.description}
          </p>
          <div className="mt-1.5 text-[10px] text-amber-400/60 font-mono">
            {dict.strategicMap.coordinates}: [{hoveredSpawnPoint.position[0]}, {hoveredSpawnPoint.position[1]}]
          </div>
        </div>
      )}

      {mode === 'ingame' && <div className="absolute top-3 right-3 pointer-events-none opacity-80 flex flex-col items-end gap-1">
        <div className="bg-[#1e150d]/90 border border-amber-700/60 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-cinzel font-bold shadow">
          🧭 {dict.strategicMap.compassNorth}
        </div>
        <div className="bg-[#1e150d]/80 border border-amber-900/50 px-2 py-0.5 rounded text-[9px] text-amber-400/70 font-mono">
          {grid.width} × {grid.height} {dict.strategicMap.tiles}
        </div>
      </div>}
    </div>
  );
}
