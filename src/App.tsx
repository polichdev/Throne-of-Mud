import { useEffect, useMemo } from 'react';
import { GridMap } from './engine/grid/GridMap';
import { useGameStore } from './store/useGameStore';
import { GameCanvas } from './components/canvas/GameCanvas';
import { TopHUD } from './components/ui/TopHUD';
import { BottomActionBar } from './components/ui/BottomActionBar';
import { InspectorPanel } from './components/ui/InspectorPanel';
import { EventLog } from './components/ui/EventLog';
import { MainMenu } from './components/ui/MainMenu';
import { LordsBar } from './components/ui/LordsBar';
import { StrategicMapModal } from './components/ui/StrategicMapModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AudioController } from './components/audio/AudioController';
import RoadToolPanel from './components/ui/RoadToolPanel';
import { FpsMonitor } from './components/ui/FpsMonitor';
import { CrownIcon } from './components/ui/MedievalIcons';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';
import { useTownCenterFocus } from './hooks/useTownCenterFocus';
import { MAP_SIZE, DEFAULT_MAP_SEED } from './constants/world';
import { INITIAL_RESOURCES } from './constants/economy';
import { loadGameFromIndexedDB } from './services/storage/saveManager';

export default function App() {
  const gameMode = useGameStore((s) => s.gameMode);
  const isStrategicView = useGameStore((s) => s.isStrategicView);
  const saveNotification = useGameStore((s) => s.saveNotification);
  const setSaveNotification = useGameStore((s) => s.setSaveNotification);
  const isLordsBarOpen = useGameStore((s) => s.isLordsBarOpen);
  const isInitialized = useGameStore((s) => s.isInitialized);
  const initWorld = useGameStore((s) => s.initWorld);

  const grid = useMemo(() => new GridMap(MAP_SIZE, MAP_SIZE, DEFAULT_MAP_SEED), []);

  const { focusTownCenter } = useTownCenterFocus();

  useKeyboardShortcuts({ onFocusTownCenter: focusTownCenter });
  useAutoSave(grid);

  useEffect(() => {
    let isMounted = true;

    async function initGameSession() {
      try {
        const hasActiveSave = localStorage.getItem('throne_of_mud_has_save') === 'true';
        if (hasActiveSave) {
          const loaded = await loadGameFromIndexedDB(grid);
          if (loaded && isMounted) {
            useGameStore.getState().setGameMode('menu');
            return;
          }
        }
      } catch (err) {
        console.warn('Auto-restore failed:', err);
      }

      if (isMounted) {
        initWorld(grid);
        useGameStore.setState({
          resources: { ...INITIAL_RESOURCES },
        });
      }
    }

    initGameSession();

    return () => {
      isMounted = false;
    };
  }, [grid, initWorld]);

  if (!isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#080c10] text-amber-300 font-cinzel">
        <div className="flex flex-col items-center gap-3">
          <CrownIcon size={44} className="text-amber-400 animate-pulse" />
          <p className="text-sm font-semibold tracking-widest uppercase">
            Завантаження королівства Throne of Mud...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <main className={`w-screen h-screen relative overflow-hidden select-none font-cinzel ${isStrategicView ? 'bg-[#18120c]' : 'bg-[#080c10]'}`}>
        <div className="absolute inset-0 z-0 pointer-events-auto overflow-hidden" style={{ isolation: 'isolate' }}>
          <GameCanvas grid={grid} />
        </div>

        <AudioController />

        <div className="relative z-10 w-full h-full pointer-events-none">
          {saveNotification && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-300 cursor-pointer">
              <div
                onClick={() => setSaveNotification(null)}
                className="bg-[#181510]/95 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/80 shadow-[0_8px_30px_rgba(0,0,0,0.9)] text-amber-200 text-xs font-bold tracking-wider flex items-center gap-2 hover:bg-[#252018] transition"
              >
                <span>{saveNotification}</span>
              </div>
            </div>
          )}

          {gameMode === 'menu' ? (
            <MainMenu grid={grid} />
          ) : (
            <>
              <div
                className={`w-full h-full pointer-events-none transition-opacity duration-200 ${
                  isStrategicView ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <TopHUD />
                {isLordsBarOpen && <LordsBar />}
                <RoadToolPanel />
                <InspectorPanel />
                <EventLog />
                <FpsMonitor />
              </div>
              <BottomActionBar grid={grid} />
              <StrategicMapModal grid={grid} />
            </>
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}
