import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';

export const FpsMonitor: React.FC = React.memo(() => {
  const selectedEntityId = useGameStore((s) => s.selectedEntityId);
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
    gpuMs: null as number | null,
    gpuSupported: false,
    geometries: 0,
    textures: 0,
    programs: 0,
    heapMb: 0,
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
      gpuMs: null,
      gpuSupported: false,
      geometries: 0,
      textures: 0,
      programs: 0,
      heapMb: 0,
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
          const renderMetrics = (window as any).__renderMetrics as { calls?: number; triangles?: number; geometries?: number; textures?: number; programs?: number; cpuFrameMs?: number; cpuRenderMs?: number; gpuMs?: number | null; gpuSupported?: boolean } | undefined;
          const simulationMs = Number(((window as any).__simulationMs || 0).toFixed(1));
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
            gpuMs: renderMetrics?.gpuMs ?? null,
            gpuSupported: renderMetrics?.gpuSupported ?? false,
            geometries: renderMetrics?.geometries || 0,
            textures: renderMetrics?.textures || 0,
            programs: renderMetrics?.programs || 0,
            heapMb,
          });

          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const width = canvas.width;
              const height = canvas.height;
              ctx.clearRect(0, 0, width, height);

              const line16 = height - (16.6 / 50) * height;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.setLineDash([2, 2]);
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(0, line16);
              ctx.lineTo(width, line16);
              ctx.stroke();
              ctx.setLineDash([]);

              const hist = historyRef.current;
              const barWidth = width / 44;
              for (let i = 0; i < hist.length; i++) {
                const ft = hist[i];
                const barHeight = Math.max(2, Math.min(height, (ft / 50) * height));
                const x = i * barWidth;
                const y = height - barHeight;

                if (ft <= 18) {
                  ctx.fillStyle = '#22c55e';
                } else if (ft <= 33.3) {
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
    stats.fps >= 55
      ? 'text-emerald-400'
      : stats.fps >= 30
      ? 'text-amber-400'
      : 'text-rose-500';

  const frameTimeColor =
    stats.frameTime <= 18.0
      ? 'text-emerald-400'
      : stats.frameTime <= 33.3
      ? 'text-amber-400'
      : 'text-rose-500';

  const statusBg =
    stats.fps >= 55
      ? 'bg-emerald-500'
      : stats.fps >= 30
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const positionStyle: React.CSSProperties = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px`, right: 'auto' }
    : {};

  const positionClass = pos
    ? ''
    : selectedEntityId
    ? 'right-92 top-20'
    : 'right-4 top-20';

  if (isCollapsed) {
    return (
      <div
        style={positionStyle}
        className={`fixed z-40 pointer-events-auto transition-all duration-200 ${positionClass}`}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121418]/95 backdrop-blur-md border border-[#5a4830] hover:border-amber-400 shadow-[0_8px_25px_rgba(0,0,0,0.85)] cursor-pointer group active:scale-95 transition"
          title="Розгорнути монітор FPS"
        >
          <div className={`w-2 h-2 rounded-full ${statusBg} animate-pulse`} />
          <span className={`font-mono font-bold text-xs ${fpsColor}`}>
            {stats.fps} FPS
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
              FPS & Час кадру
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={resetStats}
              title="Скинути статистику (Min/Max)"
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
              title="Згорнути"
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
                FPS
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
                Час кадру
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
                Мін FPS
              </span>
              <span className="font-mono text-xs font-bold text-stone-200 mt-0.5">
                {stats.minFps}
              </span>
            </div>

            <div className="flex flex-col border-x border-stone-800/60">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">
                Сер FPS
              </span>
              <span className="font-mono text-xs font-bold text-amber-200/90 mt-0.5">
                {stats.avgFps}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">
                Пік ms
              </span>
              <span className="font-mono text-xs font-bold text-rose-300 mt-0.5">
                {stats.maxFrameTime}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-black/30 border border-stone-800/60 rounded-xl px-2 py-1.5 text-center">
            <div className="flex flex-col">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">Draw</span>
              <span className="font-mono text-xs font-bold text-stone-200 mt-0.5">{stats.drawCalls}</span>
            </div>
            <div className="flex flex-col border-x border-stone-800/60">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">Трикутники</span>
              <span className="font-mono text-xs font-bold text-amber-200/90 mt-0.5">{stats.triangles ? `${Math.round(stats.triangles / 1000)}k` : '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold">Симуляція</span>
              <span className="font-mono text-xs font-bold text-stone-200 mt-0.5">{stats.simulationMs} ms</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-black/30 border border-stone-800/60 rounded-xl px-2 py-1.5 text-center">
            <div title="Час оновлень React Three Fiber і відправлення кадру на CPU; не включає всю роботу інтерфейсу браузера.">
              <span className="text-[8px] text-stone-400 uppercase">CPU кадр</span>
              <div className="font-mono text-xs font-bold text-stone-200 mt-0.5">{stats.cpuFrameMs === null ? '—' : `${stats.cpuFrameMs.toFixed(1)} ms`}</div>
            </div>
            <div className="border-x border-stone-800/60" title="Час gl.render на CPU: обхід сцени, підготовка та відправлення команд малювання.">
              <span className="text-[8px] text-stone-400 uppercase">CPU рендер</span>
              <div className="font-mono text-xs font-bold text-stone-200 mt-0.5">{stats.cpuRenderMs === null ? '—' : `${stats.cpuRenderMs.toFixed(1)} ms`}</div>
            </div>
            <div title={stats.gpuSupported ? 'Асинхронний вимір часу рендеру на GPU; включає оновлення тіней. CPU та GPU можуть працювати паралельно.' : 'Браузер не надав розширення для вимірювання GPU. Прочерк не означає нульове навантаження.'}>
              <span className="text-[8px] text-stone-400 uppercase">GPU</span>
              <div className="font-mono text-xs font-bold text-amber-200 mt-0.5">{stats.gpuMs === null ? '—' : `${stats.gpuMs.toFixed(1)} ms`}</div>
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

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[8px] text-stone-400 font-mono px-0.5">
              <span>Графік frame time</span>
              <span>Ціль: 16.6ms</span>
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
