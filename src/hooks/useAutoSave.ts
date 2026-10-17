import { useEffect } from 'react';
import { GridMap } from '../engine/grid/GridMap';
import { useGameStore } from '../store/useGameStore';
import { saveGameToIndexedDB } from '../services/storage/saveManager';

import { SAVE_STORAGE } from '../constants/storage';

export function useAutoSave(grid: GridMap) {
  const gameMode = useGameStore((s) => s.gameMode);

  useEffect(() => {
    const handleSaveOnExit = () => {
      if (useGameStore.getState().gameMode === 'playing') {
        saveGameToIndexedDB(grid);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && useGameStore.getState().gameMode === 'playing') {
        saveGameToIndexedDB(grid);
      }
    };

    window.addEventListener('beforeunload', handleSaveOnExit);
    window.addEventListener('pagehide', handleSaveOnExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleSaveOnExit);
      window.removeEventListener('pagehide', handleSaveOnExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [grid]);

  useEffect(() => {
    if (gameMode !== 'playing') return;

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let disposed = false;
    const save = () => {
      idleId = timeoutId = undefined;
      const state = useGameStore.getState();
      if (!disposed && state.gameMode === 'playing' && !state.time.isPaused) {
        void saveGameToIndexedDB(grid);
      }
    };

    const interval = setInterval(() => {
      if (!useGameStore.getState().time.isPaused && idleId === undefined && timeoutId === undefined) {
        if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
          idleId = window.requestIdleCallback(save, { timeout: SAVE_STORAGE.idleTimeoutMs });
        } else {
          timeoutId = window.setTimeout(save, 0);
        }
      }
    }, SAVE_STORAGE.autoSaveIntervalMs);

    return () => {
      disposed = true;
      clearInterval(interval);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [grid, gameMode]);
}
