import React, { useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { GridMap } from '../../engine/grid/GridMap';
import { BuildingsMenuModal } from './bottom-bar/BuildingsMenuModal';
import { MilitiaBar } from './bottom-bar/MilitiaBar';
import { TimeControlsWidget } from './bottom-bar/TimeControlsWidget';
import { ActionButtonsBar } from './bottom-bar/ActionButtonsBar';
import { SettingsModal } from './settings/SettingsModal';
import { WeatherDebugModal } from './WeatherDebugModal';
import { TradePostModal } from './trade/TradePostModal';
import { DiplomacyModal } from './diplomacy/DiplomacyModal';
import { audioManager } from '../../engine/audio/AudioManager';

interface BottomActionBarProps {
  grid: GridMap;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = React.memo(({ grid }) => {
  const activeTool = useGameStore((s) => s.activeTool);
  const setActiveTool = useGameStore((s) => s.setActiveTool);
  const activeMenuTab = useGameStore((s) => s.activeMenuTab);
  const setActiveMenuTab = useGameStore((s) => s.setActiveMenuTab);
  const setActiveBuildType = useGameStore((s) => s.setActiveBuildType);
  const isWeatherDebugOpen = useGameStore((s) => s.isWeatherDebugOpen);

  const handleToggleTab = useCallback(
    (tabName: 'buildings' | 'military' | 'trade' | 'codex' | 'settings' | 'roads') => {
      if (tabName === 'roads') {
        setActiveTool(activeTool === 'road' ? 'select' : 'road');
        setActiveMenuTab(null);
        return;
      }

      if (activeMenuTab === tabName) {
        audioManager.playUIPanelClose();
        setActiveMenuTab(null);
        if (tabName === 'buildings' || tabName === 'military') {
          setActiveBuildType(null);
          setActiveTool('select');
        }
      } else {
        audioManager.playUIPanelOpen();
        setActiveMenuTab(tabName);
        if (tabName === 'buildings' || tabName === 'military') {
          setActiveBuildType(null);
          setActiveTool('select');
        }
      }
    },
    [activeTool, activeMenuTab, setActiveTool, setActiveMenuTab, setActiveBuildType]
  );

  const handleCloseBuildingsMenu = useCallback(() => {
    audioManager.playUIPanelClose();
    setActiveMenuTab(null);
    setActiveBuildType(null);
    setActiveTool('select');
  }, [setActiveMenuTab, setActiveBuildType, setActiveTool]);

  const handleCloseSettings = useCallback(() => {
    audioManager.playUIPanelClose();
    setActiveMenuTab(null);
  }, [setActiveMenuTab]);

  const handleCloseMilitary = useCallback(() => {
    audioManager.playUIPanelClose();
    setActiveMenuTab(null);
  }, [setActiveMenuTab]);

  const handleCloseTrade = useCallback(() => {
    audioManager.playUIPanelClose();
    setActiveMenuTab(null);
  }, [setActiveMenuTab]);

  const handleCloseDiplomacy = useCallback(() => {
    audioManager.playUIPanelClose();
    setActiveMenuTab(null);
  }, [setActiveMenuTab]);

  const isStrategicView = useGameStore((s) => s.isStrategicView);

  return (
    <>
      {activeMenuTab === 'buildings' && (
        <BuildingsMenuModal onClose={handleCloseBuildingsMenu} />
      )}

      {activeMenuTab === 'settings' && (
        <SettingsModal grid={grid} onClose={handleCloseSettings} />
      )}

      {activeMenuTab === 'trade' && (
        <TradePostModal onClose={handleCloseTrade} />
      )}

      {activeMenuTab === 'military' && (
        <MilitiaBar grid={grid} onClose={handleCloseMilitary} />
      )}

      {activeMenuTab === 'codex' && (
        <DiplomacyModal onClose={handleCloseDiplomacy} />
      )}

      {isWeatherDebugOpen && <WeatherDebugModal />}

      <div
        className={`w-full h-full pointer-events-none transition-opacity duration-200 ${
          isStrategicView ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <ActionButtonsBar onToggleTab={handleToggleTab} />
        <TimeControlsWidget />
      </div>
    </>
  );
});

BottomActionBar.displayName = 'BottomActionBar';
