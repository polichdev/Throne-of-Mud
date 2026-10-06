import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GridMap } from '../../engine/grid/GridMap';
import { useGameStore } from '../../store/useGameStore';
import { characterEntities } from '../../engine/ecs/world';
import { DEFAULT_REGIONS } from '../../constants/world';
import type { SpawnPointData } from '../../types/game';

interface StrategicMapCanvasProps {
  grid: GridMap;
  mode: 'setup' | 'ingame';
  selectedRegionId?: number;
  onSelectRegion?: (regionId: number) => void;
  selectedSpawnPointId?: string;
  onSelectSpawnPoint?: (spawnPointId: string) => void;
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
  onSelectSpawnPoint,
  onClose,
  width: initialWidth,
  height: initialHeight,
}: StrategicMapCanvasProps) {
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
    bgGrad.addColorStop(0, '#ebdcc1');
    bgGrad.addColorStop(0.7, '#dfcca9');
    bgGrad.addColorStop(1, '#c8b28b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    ctx.fillStyle = 'rgba(120, 80, 40, 0.03)';
    for (let i = 0; i < 2000; i++) {
      const rx = Math.random() * offscreen.width;
      const ry = Math.random() * offscreen.height;
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
          ctx.fillStyle = '#543319';
          ctx.fillRect(px, pz, scale, scale);
        } else if (tile.terrain === 'stone' || tile.foliageType === 'rock') {
          ctx.fillStyle = '#a69888';
          ctx.fillRect(px, pz, scale, scale);
        } else if (tile.foliageType === 'tree') {
          ctx.fillStyle = '#c7bc99';
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
            treeColor = '#456a35';
            strokeColor = '#253e1c';
          } else if (randTree > 0.12) {
            isPine = true;
            treeColor = '#1f4429';
            strokeColor = '#0e2516';
          } else {
            isPine = false;
            treeColor = '#c2701e';
            strokeColor = '#713c0b';
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

        if (isSelected) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.fillRect(rx, rz, rw, rh);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.strokeRect(rx + 2, rz + 2, rw - 4, rh - 4);
        } else if (isHovered) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(rx, rz, rw, rh);
        }
      }

      ctx.save();
      ctx.setLineDash([7, 5]);
      ctx.strokeStyle = 'rgba(124, 45, 18, 0.75)';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      for (let gx = 0; gx <= grid.width; gx += 4) {
        const gz = GridMap.getHighwayZ(gx);
        const sx = toScreenX(gx);
        const sy = toScreenY(gz);
        if (gx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      const j1Z = GridMap.getHighwayZ(128);
      ctx.beginPath();
      for (let gz = 0; gz <= j1Z; gz += 3) {
        const gx = GridMap.getNorthHighway1X(gz);
        const sx = toScreenX(gx);
        const sy = toScreenY(gz);
        if (gz === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.lineTo(toScreenX(128), toScreenY(j1Z));
      ctx.stroke();

      const j3Z = GridMap.getHighwayZ(256);
      ctx.beginPath();
      for (let gz = 0; gz <= j3Z; gz += 3) {
        const gx = GridMap.getNorthHighway2X(gz);
        const sx = toScreenX(gx);
        const sy = toScreenY(gz);
        if (gz === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.lineTo(toScreenX(256), toScreenY(j3Z));
      ctx.stroke();

      const j2Z = GridMap.getHighwayZ(192);
      ctx.beginPath();
      ctx.moveTo(toScreenX(192), toScreenY(j2Z));
      for (let gz = Math.ceil(j2Z); gz <= grid.height; gz += 3) {
        const gx = GridMap.getSouthHighwayX(gz);
        const sx = toScreenX(gx);
        const sy = toScreenY(gz);
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();

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
      ctx.fillText('~ оз. Золоте ~', toScreenX(72), toScreenY(70) - 9);
      ctx.fillText('~ оз. Дубове ~', toScreenX(60), toScreenY(195) - 9);
      ctx.fillText('~ оз. Лісове ~', toScreenX(320), toScreenY(72) - 9);
      ctx.restore();

      if (mode === 'setup') {
        const currentReg = regions.find((r) => r.id === activeRegionId);
        const spawnPoints = currentReg?.spawnPoints || GridMap.getPresetSpawnPoints(activeRegionId);

        spawnPoints.forEach((sp, idx) => {
          const sx = toScreenX(sp.position[0]);
          const sz = toScreenY(sp.position[1]);
          const isSelected = (propSelectedSpawnPointId === sp.id) || (!propSelectedSpawnPointId && idx === 0);
          const isHovered = hoveredSpawnPoint?.id === sp.id;

          ctx.save();

          if (isSelected) {
            const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
            ctx.beginPath();
            ctx.arc(sx, sz, 18 + pulse * 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 158, 11, ${0.25 + pulse * 0.2})`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.ellipse(sx, sz + 6, 9, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(sx, sz, isSelected ? 12 : isHovered ? 11 : 9.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#f59e0b' : isHovered ? '#fbbf24' : '#d97706';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#ffffff' : '#78350f';
          ctx.lineWidth = isSelected ? 2.5 : 1.8;
          ctx.stroke();

          ctx.font = isSelected ? '12px sans-serif' : '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(isSelected ? '👑' : '⛺', sx, sz);

          const tagText = `${idx + 1}. ${sp.name}`;
          ctx.font = 'bold 10px "Cinzel", Georgia, serif';
          const textMetrics = ctx.measureText(tagText);
          const tagW = textMetrics.width + 12;
          const tagH = 18;

          ctx.fillStyle = isSelected ? 'rgba(26, 20, 13, 0.95)' : 'rgba(38, 28, 18, 0.85)';
          ctx.strokeStyle = isSelected ? '#f59e0b' : '#a16207';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(sx - tagW / 2, sz + 12, tagW, tagH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isSelected ? '#fef08a' : '#fde68a';
          ctx.fillText(tagText, sx, sz + 21);

          ctx.restore();
        });
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
          ctx.fillText(`${reg.heraldryIcon} ${reg.ukrName}`, bx + 6, by + 12);

          ctx.font = '9px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`👥 ${reg.population} жит. • ${reg.owner === 'player' ? 'Ваше' : 'Бот'}`, bx + 6, by + 22);

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
      const currentReg = regions.find((r) => r.id === activeRegionId);
      const spawnPoints = currentReg?.spawnPoints || GridMap.getPresetSpawnPoints(activeRegionId);

      let clickedSp: SpawnPointData | null = null;
      for (const sp of spawnPoints) {
        const dist = Math.hypot(sp.position[0] - clickX, sp.position[1] - clickZ);
        if (dist <= 12) {
          clickedSp = sp;
          break;
        }
      }

      if (clickedSp && onSelectSpawnPoint) {
        onSelectSpawnPoint(clickedSp.id);
        return;
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

    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const qId = GridMap.getRegionIdForCoord(mouseGx, mouseGz);
    setHoveredRegionId(qId);

    if (mode === 'setup') {
      const currentReg = regions.find((r) => r.id === activeRegionId);
      const spawnPoints = currentReg?.spawnPoints || GridMap.getPresetSpawnPoints(activeRegionId);

      let foundSp: SpawnPointData | null = null;
      for (const sp of spawnPoints) {
        const dist = Math.hypot(sp.position[0] - mouseGx, sp.position[1] - mouseGz);
        if (dist <= 10) {
          foundSp = sp;
          break;
        }
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
        className="w-full h-full max-w-[660px] max-h-[660px] object-contain rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] cursor-pointer"
      />

      {hoveredSpawnPoint && mousePos && (
        <div
          className="absolute z-30 pointer-events-none p-2.5 rounded-xl bg-[#1c150e]/95 border border-amber-500/80 shadow-[0_8px_25px_rgba(0,0,0,0.9)] max-w-xs text-amber-100 text-xs font-cinzel animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.min(mousePos.x + 16, (initialWidth || 640) - 220)}px`,
            top: `${Math.min(mousePos.y + 16, (initialHeight || 640) - 100)}px`,
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
            Координати: [{hoveredSpawnPoint.position[0]}, {hoveredSpawnPoint.position[1]}]
          </div>
        </div>
      )}

      <div className="absolute top-3 right-3 pointer-events-none opacity-80 flex flex-col items-end gap-1">
        <div className="bg-[#1e150d]/90 border border-amber-700/60 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-cinzel font-bold shadow">
          🧭 ПІВНІЧ
        </div>
        <div className="bg-[#1e150d]/80 border border-amber-900/50 px-2 py-0.5 rounded text-[9px] text-amber-400/70 font-mono">
          {grid.width} × {grid.height} клітинок
        </div>
      </div>
    </div>
  );
}
