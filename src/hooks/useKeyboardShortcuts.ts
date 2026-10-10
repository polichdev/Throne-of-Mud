import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { audioManager } from '../engine/audio/AudioManager';
import { STRATEGIC_ZOOM_THRESHOLD, STRATEGIC_VIEW_ZOOM, DEFAULT_CAMERA_ZOOM } from '../constants/camera';

interface UseKeyboardShortcutsOptions {
  onFocusTownCenter: () => void;
}

export function useKeyboardShortcuts({ onFocusTownCenter }: UseKeyboardShortcutsOptions) {
  const gameMode = useGameStore((s) => s.gameMode);
  const togglePause = useGameStore((s) => s.togglePause);
  const setSpeedMultiplier = useGameStore((s) => s.setSpeedMultiplier);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameMode !== 'playing') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.key === '1') {
        setSpeedMultiplier(1);
      } else if (e.key === '2') {
        setSpeedMultiplier(2);
      } else if (e.key === '3') {
        setSpeedMultiplier(5);
      } else if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') {
        onFocusTownCenter();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        const { activeTool, setActiveTool } = useGameStore.getState();
        setActiveTool(activeTool === 'road' ? 'select' : 'road');
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        const { setCameraZoomTarget } = useGameStore.getState();
        const currentZoom = (window as unknown as { __lastCameraZoom?: number }).__lastCameraZoom ?? DEFAULT_CAMERA_ZOOM;
        if (currentZoom > STRATEGIC_ZOOM_THRESHOLD) {
          setCameraZoomTarget(STRATEGIC_VIEW_ZOOM);
        } else {
          setCameraZoomTarget(DEFAULT_CAMERA_ZOOM);
        }
      } else if (e.key === 'v' || e.key === 'V' || e.key === 'м' || e.key === 'М') {
        const { activeMenuTab, setActiveMenuTab, setActiveBuildType, setActiveTool } = useGameStore.getState();
        if (activeMenuTab === 'military') {
          audioManager.playUIPanelClose();
          setActiveMenuTab(null);
        } else {
          audioManager.playUIPanelOpen();
          setActiveBuildType(null);
          setActiveTool('select');
          setActiveMenuTab('military');
        }
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') {
        const { activeMenuTab, setActiveMenuTab, setActiveBuildType, setActiveTool } = useGameStore.getState();
        if (activeMenuTab === 'codex') {
          audioManager.playUIPanelClose();
          setActiveMenuTab(null);
        } else {
          audioManager.playUIPanelOpen();
          setActiveBuildType(null);
          setActiveTool('select');
          setActiveMenuTab('codex');
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        const { isWeatherDebugOpen, setIsWeatherDebugOpen } = useGameStore.getState();
        setIsWeatherDebugOpen(!isWeatherDebugOpen);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const {
          isWeatherDebugOpen,
          setIsWeatherDebugOpen,
          isStrategicMapOpen,
          setIsStrategicMapOpen,
          selectedEntityId,
          setSelectedEntityId,
          activeTool,
          setActiveTool,
          activeMenuTab,
          setActiveMenuTab,
        } = useGameStore.getState();

        if (activeMenuTab === 'settings') {
          setActiveMenuTab(null);
          audioManager.playUIPanelClose();
          return;
        }

        if (isWeatherDebugOpen) {
          setIsWeatherDebugOpen(false);
          audioManager.playUIPanelClose();
          return;
        }

        if (isStrategicMapOpen) {
          setIsStrategicMapOpen(false);
          audioManager.playUIPanelClose();
          return;
        }

        if (activeTool === 'road' || activeTool === 'build') {
          setActiveTool('select');
          if (activeMenuTab === 'buildings') {
            setActiveMenuTab(null);
          }
          audioManager.playUIPanelClose();
          return;
        }

        const selectedMilitiaSquadId = useGameStore.getState().selectedMilitiaSquadId;
        if (selectedMilitiaSquadId) {
          useGameStore.getState().setSelectedMilitiaSquadId(null);
          audioManager.playUIPanelClose();
          return;
        }

        if (selectedEntityId) {
          setSelectedEntityId(null);
          audioManager.playUIPanelClose();
          return;
        }

        if (activeMenuTab === 'buildings' || activeMenuTab === 'trade' || activeMenuTab === 'military' || activeMenuTab === 'codex') {
          setActiveMenuTab(null);
          audioManager.playUIPanelClose();
          return;
        }

        setActiveMenuTab('settings');
        audioManager.playUIPanelOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameMode, togglePause, setSpeedMultiplier, onFocusTownCenter]);
}
