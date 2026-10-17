import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useTranslation } from '../../i18n';
import { world } from '../../engine/ecs/world';

const TARGET_FRAME_MS = 1000 / 165;
const GOOD_FRAME_MS = TARGET_FRAME_MS * 1.05;
const WARN_FRAME_MS = TARGET_FRAME_MS * 2.1;

export const FpsMonitor: React.FC = React.memo(() => {
  const { dict } = useTranslation();
  const m = dict.fpsMonitor;
  const selectedEntityId = useGameStore((s) => s.selectedEntityId);
  const hasSideInspector = selectedEntityId && !world.entities.find(entity => entity.id === selectedEntityId)?.isBuilding;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const [stats, setStats] = useState({
    fps: 60,
    frameTime: 16.6,
    minFps: 60,
    avgFps: 60,
    maxFrameTime: 16.6,
    drawCalls: 0,
    triangles: 0,
    simulationMs: 0,
    cpuFrameMs: null as number | null,
    cpuRenderMs: null as number | null,
    cpuMatrixMs: null as number | null,
    cpuBatchMs: null as number | null,
    cpuRenderOtherMs: null as number | null,
    cpuSubmissionMs: null as number | null,
    cpuPreparationMs: null as number | null,
    sampledDrawCalls: 0,
    cpuFramePeakMs: null as number | null,
    cpuRenderPeakMs: null as number | null,
    simulationPeakMs: null as number | null,
    shadowRefreshes: 0,
    gpuMs: null as number | null,
    gpuSupported: false,
    geometries: 0,
    textures: 0,
    programs: 0,
    heapMb: 0,
    frameSubscribers: 0,
    renderTasks: 0,
    sceneObjects: 0,
    activePointLights: 0,
    pointLightSlots: 0,
    registeredPointLights: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>([]);
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const lastUpdateRef = useRef<number>(performance.now());
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const resetStats = useCallback(() => {
    frameTimesRef.current = [];
    historyRef.current = [];
    setStats({
      fps: 60,
      frameTime: 16.6,
      minFps: 60,
      avgFps: 60,
      maxFrameTime: 16.6,
      drawCalls: 0,
      triangles: 0,
      simulationMs: 0,
      cpuFrameMs: null,
      cpuRenderMs: null,
      cpuMatrixMs: null,
      cpuBatchMs: null,
      cpuRenderOtherMs: null,
      cpuSubmissionMs: null,
      cpuPreparationMs: null,
      sampledDrawCalls: 0,
      cpuFramePeakMs: null,
      cpuRenderPeakMs: null,
      simulationPeakMs: null,
      shadowRefreshes: 0,
      gpuMs: null,
      gpuSupported: false,
      geometries: 0,
      textures: 0,
      programs: 0,
      heapMb: 0,
      frameSubscribers: 0,
      renderTasks: 0,
      sceneObjects: 0,
      activePointLights: 0,
      pointLightSlots: 0,
      registeredPointLights: 0,
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: rect.left,
      originY: rect.top,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 260, dragRef.current.originX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, dragRef.current.originY + dy));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (delta > 0 && delta < 1000) {
        frameTimesRef.current.push(delta);
        if (frameTimesRef.current.length > 90) {
          frameTimesRef.current.shift();
        }

        historyRef.current.push(delta);
        if (historyRef.current.length > 44) {
          historyRef.current.shift();
        }
      }

      if (now - lastUpdateRef.current >= 200) {
        lastUpdateRef.current = now;
        const frames = frameTimesRef.current;
        if (frames.length > 0) {
          const avgFt = frames.reduce((a, b) => a + b, 0) / frames.length;
          const maxFt = Math.max(...frames);
          const currentFt = frames[frames.length - 1];
          const fps = Math.round(1000 / (currentFt || 16.6));
          const avgFps = Math.round(1000 / (avgFt || 16.6));
          const minFps = Math.round(1000 / (maxFt || 16.6));
          const renderMetrics = (window as any).__renderMetrics as { calls?: number; triangles?: number; geometries?: number; textures?: number; programs?: number; cpuFrameMs?: number; cpuRenderMs?: number; cpuMatrixMs?: number; cpuBatchMs?: number; cpuRenderOtherMs?: number; cpuSubmissionMs?: number | null; cpuPreparationMs?: number | null; sampledDrawCalls?: number; cpuFramePeakMs?: number; cpuRenderPeakMs?: number; simulationPeakMs?: number; shadowRefreshes?: number; gpuMs?: number | null; gpuSupported?: boolean } | undefined;
          const simulationMs = Number(((window as any).__simulationMs || 0).toFixed(1));
          const lifecycle = (window as any).__renderMetrics as { frameSubscribers?: number; renderTasks?: number; sceneObjects?: number; activePointLights?: number; pointLightSlots?: number; registeredPointLights?: number } | undefined;
          const memory = (performance as any).memory;
          const heapMb = memory?.usedJSHeapSize ? Math.round(memory.usedJSHeapSize / (1024 * 1024)) : 0;

          setStats({
            fps,
            frameTime: Number(currentFt.toFixed(1)),
            minFps,
            avgFps,
            maxFrameTime: Number(maxFt.toFixed(1)),
            drawCalls: renderMetrics?.calls || 0,
            triangles: renderMetrics?.triangles || 0,
            simulationMs,
            cpuFrameMs: renderMetrics?.cpuFrameMs ?? null,
            cpuRenderMs: renderMetrics?.cpuRenderMs ?? null,
            cpuMatrixMs: renderMetrics?.cpuMatrixMs ?? null,
            cpuBatchMs: renderMetrics?.cpuBatchMs ?? null,
            cpuRenderOtherMs: renderMetrics?.cpuRenderOtherMs ?? null,
            cpuSubmissionMs: renderMetrics?.cpuSubmissionMs ?? null,
            cpuPreparationMs: renderMetrics?.cpuPreparationMs ?? null,
            sampledDrawCalls: renderMetrics?.sampledDrawCalls ?? 0,
            cpuFramePeakMs: renderMetrics?.cpuFramePeakMs ?? null,
            cpuRenderPeakMs: renderMetrics?.cpuRenderPeakMs ?? null,
            simulationPeakMs: renderMetrics?.simulationPeakMs ?? null,
            shadowRefreshes: renderMetrics?.shadowRefreshes ?? 0,
            gpuMs: renderMetrics?.gpuMs ?? null,
            gpuSupported: renderMetrics?.gpuSupported ?? false,
            geometries: renderMetrics?.geometries || 0,
            textures: renderMetrics?.textures || 0,
            programs: renderMetrics?.programs || 0,
            heapMb,
            frameSubscribers: lifecycle?.frameSubscribers ?? 0,
            renderTasks: lifecycle?.renderTasks ?? 0,
            sceneObjects: lifecycle?.sceneObjects ?? 0,
            activePointLights: lifecycle?.activePointLights ?? 0,
            pointLightSlots: lifecycle?.pointLightSlots ?? 0,
            registeredPointLights: lifecycle?.registeredPointLights ?? 0,
          });

          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const width = canvas.width;
              const height = canvas.height;
              ctx.clearRect(0, 0, width, height);

              const targetLine = height - (TARGET_FRAME_MS / 50) * height;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.setLineDash([2, 2]);
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(0, targetLine);
              ctx.lineTo(width, targetLine);
              ctx.stroke();
              ctx.setLineDash([]);

              const hist = historyRef.current;
              const barWidth = width / 44;
              for (let i = 0; i < hist.length; i++) {
                const ft = hist[i];
                const barHeight = Math.max(2, Math.min(height, (ft / 50) * height));
                const x = i * barWidth;
                const y = height - barHeight;

                if (ft <= GOOD_FRAME_MS) {
                  ctx.fillStyle = '#22c55e';
                } else if (ft <= WARN_FRAME_MS) {
                  ctx.fillStyle = '#eab308';
                } else {
                  ctx.fillStyle = '#ef4444';
                }

                ctx.fillRect(x + 0.5, y, Math.max(barWidth - 1, 1), barHeight);
              }
            }
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const fpsColor =
    stats.frameTime <= GOOD_FRAME_MS
      ? 'text-emerald-400'
      : stats.frameTime <= WARN_FRAME_MS
      ? 'text-amber-400'
      : 'text-rose-500';

  const frameTimeColor =
    stats.frameTime <= GOOD_FRAME_MS
      ? 'text-emerald-400'
      : stats.frameTime <= WARN_FRAME_MS
      ? 'text-amber-400'
      : 'text-rose-500';

  const statusBg =
    stats.frameTime <= GOOD_FRAME_MS
      ? 'bg-emerald-500'
      : stats.frameTime <= WARN_FRAME_MS
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const positionStyle: React.CSSProperties = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px`, right: 'auto' }
    : {};

  const positionClass = pos
    ? ''
    : hasSideInspector
    ? 'right-92 top-48'
    : 'right-4 top-48';

  if (isCollapsed) {
    return (
      <div
        style={positionStyle}
        className={`fixed z-40 pointer-events-auto transition-all duration-200 ${positionClass}`}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121418]/95 backdrop-blur-md border border-[#5a4830] hover:border-amber-400 shadow-[0_8px_25px_rgba(0,0,0,0.85)] cursor-pointer group active:scale-95 transition"
          title={m.expandTitle}
        >
          <div className={`w-2 h-2 rounded-full ${statusBg} animate-pulse`} />
          <span className={`font-mono font-bold text-xs ${fpsColor}`}>
            {stats.fps} {m.fpsLabel}
          </span>
          <span className="text-stone-500 text-[10px] font-mono">|</span>
          <span className={`font-mono text-xs ${frameTimeColor}`}>
            {stats.frameTime} ms
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={positionStyle}
      className={`fixed z-40 pointer-events-auto w-64 select-none font-cinzel transition-all duration-200 ${positionClass}`}
    >
      <div className="bg-[#121418]/96 backdrop-blur-xl rounded-2xl border-2 border-[#5a4830] shadow-[0_12px_35px_rgba(0,0,0,0.92)] overflow-hidden flex flex-col">
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#241a10] via-[#16120b] to-[#121418] border-b border-[#4a3b26] cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusBg} animate-pulse`} />
            <span className="text-[11px] font-bold tracking-wider text-amber-200 uppercase">
              {m.headerTitle}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={resetStats}
              title={m.resetStatsTitle}
              className="p-1 rounded text-stone-400 hover:text-amber-300 hover:bg-white/5 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>

            <button
              onClick={() => setIsCollapsed(true)}
              title={m.collapseTitle}
              className="p-1 rounded text-stone-400 hover:text-amber-300 hover:bg-white/5 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-3 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-black/40 border border-stone-800/80 rounded-xl px-2.5 py-1.5">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-semibold">
                {m.fpsLabel}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-2xl font-mono font-black tracking-tight ${fpsColor}`}>
                  {stats.fps}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">fps</span>
              </div>
            </div>

            <div className="flex flex-col bg-black/40 border border-stone-800/80 rounded-xl px-2.5 py-1.5">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-semibold">
                {m.frameTimeLabel}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-2xl font-mono font-black tracking-tight ${frameTimeColor}`}>
                  {stats.frameTime}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">ms</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-black/30 border border-stone-800/60 rounded-xl px-2 py-1.5 text-center">
            <div className="flex flex-col">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">
                {m.minFps}
              </span>
              <span className="font-mono text-xs font-bold text-stone-200 mt-0.5">
                {stats.minFps}
              </span>
            </div>

            <div className="flex flex-col border-x border-stone-800/60">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">
                {m.avgFps}
              </span>
              <span className="font-mono text-xs font-bold text-amber-200/90 mt-0.5">
                {stats.avgFps}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">
                {m.peakMs}
              </span>
              <span className="font-mono text-xs font-bold text-rose-300 mt-0.5">
                {stats.maxFrameTime}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-black/30 border border-stone-800/60 rounded-xl px-2 py-1.5 text-center">
            <div className="flex flex-col">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">{m.drawCalls}</span>
              <span className="font-mono text-xs font-bold text-stone-200 mt-0.5">{stats.drawCalls}</span>
            </div>
            <div className="flex flex-col border-x border-stone-800/60">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">{m.triangles}</span>
              <span className="font-mono text-xs font-bold text-amber-200/90 mt-0.5">{stats.triangles ? `${Math.round(stats.triangles / 1000)}k` : '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">{m.simulation}</span>
              <span className="font-mono text-xs font-bold text-stone-200 mt-0.5">{stats.simulationMs} ms</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-black/30 border border-stone-800/60 rounded-xl px-2 py-1.5 text-center">
            <div title={m.cpuFrameTip}>
              <span className="text-[8px] text-stone-400 uppercase">{m.cpuFrame}</span>
              <div className="font-mono text-xs font-bold text-stone-200 mt-0.5">{stats.cpuFrameMs === null ? '—' : `${stats.cpuFrameMs.toFixed(1)} ms`}</div>
            </div>
            <div className="border-x border-stone-800/60" title={m.cpuRenderTip}>
              <span className="text-[8px] text-stone-400 uppercase">{m.cpuRender}</span>
              <div className="font-mono text-xs font-bold text-stone-200 mt-0.5">{stats.cpuRenderMs === null ? '—' : `${stats.cpuRenderMs.toFixed(1)} ms`}</div>
            </div>
            <div title={stats.gpuSupported ? m.gpuTipSupported : m.gpuTipUnsupported}>
              <span className="text-[8px] text-stone-400 uppercase">{m.gpu}</span>
              <div className="font-mono text-xs font-bold text-amber-200 mt-0.5">{stats.gpuMs === null ? '—' : `${stats.gpuMs.toFixed(1)} ms`}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-black/20 border border-stone-800/40 rounded-lg px-1.5 py-1 text-center font-mono">
            <div title={m.matricesTip}>
              <div className="text-[8px] text-stone-400">{m.matrices}</div>
              <div className="text-[10px] text-stone-200">{stats.cpuMatrixMs === null ? '—' : `${stats.cpuMatrixMs.toFixed(1)} ms`}</div>
            </div>
            <div title={m.batchesTip}>
              <div className="text-[8px] text-stone-400">{m.batches}</div>
              <div className="text-[10px] text-stone-200">{stats.cpuBatchMs === null ? '—' : `${stats.cpuBatchMs.toFixed(1)} ms`}</div>
            </div>
            <div title={m.otherTip}>
              <div className="text-[8px] text-stone-400">{m.other}</div>
              <div className="text-[10px] text-stone-200">{stats.cpuRenderOtherMs === null ? '—' : `${stats.cpuRenderOtherMs.toFixed(1)} ms`}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-black/20 border border-stone-800/40 rounded-lg px-1.5 py-1 text-center font-mono">
            <div title={m.cpuSubmissionTip(stats.sampledDrawCalls)}>
              <div className="text-[8px] text-stone-400">{m.cpuSubmission}</div>
              <div className="text-[10px] text-stone-200">{stats.cpuSubmissionMs === null ? '—' : `${stats.cpuSubmissionMs.toFixed(1)} ms`}</div>
            </div>
            <div title={m.cpuPreparationTip}>
              <div className="text-[8px] text-stone-400">{m.cpuPreparation}</div>
              <div className="text-[10px] text-stone-200">{stats.cpuPreparationMs === null ? '—' : `${stats.cpuPreparationMs.toFixed(1)} ms`}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-black/20 border border-stone-800/40 rounded-lg px-1.5 py-1 text-center font-mono">
            <div title={m.cpuPeakTip(stats.cpuRenderPeakMs?.toFixed(1) ?? '—')}>
              <div className="text-[8px] text-stone-400">{m.cpuPeak}</div>
              <div className="text-[10px] text-stone-200">{stats.cpuFramePeakMs === null ? '—' : `${stats.cpuFramePeakMs.toFixed(1)} ms`}</div>
            </div>
            <div title={m.simPeakTip}>
              <div className="text-[8px] text-stone-400">{m.simPeak}</div>
              <div className="text-[10px] text-stone-200">{stats.simulationPeakMs === null ? '—' : `${stats.simulationPeakMs.toFixed(1)} ms`}</div>
            </div>
            <div title={m.shadowRefreshesTip}>
              <div className="text-[8px] text-stone-400">{m.shadowRefreshes}</div>
              <div className="text-[10px] text-stone-200">{stats.shadowRefreshes}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-0.5 bg-black/20 border border-stone-800/40 rounded-lg px-1.5 py-1 text-center text-[9px] font-mono">
            <div title="Geometries">
              <span className="text-stone-500">Geo:</span> <span className="text-stone-300 font-bold">{stats.geometries}</span>
            </div>
            <div title="Textures">
              <span className="text-stone-500">Tex:</span> <span className="text-stone-300 font-bold">{stats.textures}</span>
            </div>
            <div title="Compiled Shaders">
              <span className="text-stone-500">Prog:</span> <span className="text-stone-300 font-bold">{stats.programs}</span>
            </div>
            <div title="JS Heap">
              <span className="text-stone-500">Heap:</span> <span className="text-stone-300 font-bold">{stats.heapMb ? `${stats.heapMb}M` : '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-mono text-stone-300">
            <div title={m.frameSubscribersTip}>{m.frameTasks}: {stats.frameSubscribers}/{stats.renderTasks}</div>
            <div title={m.sceneObjectsTip}>{m.sceneObjects}: {stats.sceneObjects}</div>
            <div title={m.lightsTip(stats.registeredPointLights)}>{m.lights}: {stats.activePointLights}/{stats.pointLightSlots}</div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[8px] text-stone-400 font-mono px-0.5">
              <span>{m.frameTimeChart}</span>
              <span>{m.targetLabel}</span>
            </div>
            <div className="w-full h-9 bg-black/60 rounded-lg border border-stone-800/90 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={232}
                height={36}
                className="w-full h-full block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FpsMonitor.displayName = 'FpsMonitor';
