import React, { useEffect, useCallback } from 'react';
import { RoadIcon, EraserIcon, CrossCloseIcon } from './MedievalIcons';
import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../engine/audio/AudioManager';
import { useTranslation } from '../../i18n';

interface RoadToolPanelProps {
  onCancel?: () => void;
}

export const RoadToolPanel: React.FC<RoadToolPanelProps> = React.memo(({ onCancel }) => {
  const { dict, language } = useTranslation();

  const activeTool = useGameStore((s) => s.activeTool);
  const roadEraseMode = useGameStore((s) => s.roadEraseMode);
  const setRoadEraseMode = useGameStore((s) => s.setRoadEraseMode);
  const setActiveTool = useGameStore((s) => s.setActiveTool);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activeTool !== 'road') return;
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        audioManager.playUIClick();
        setRoadEraseMode(!roadEraseMode);
      }
    },
    [activeTool, roadEraseMode, setRoadEraseMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (activeTool !== 'road') return null;

  const handleDrawClick = () => {
    audioManager.playUIClick();
    setRoadEraseMode(false);
  };

  const handleEraseClick = () => {
    audioManager.playUIClick();
    setRoadEraseMode(!roadEraseMode);
  };

  const handleCloseClick = () => {
    audioManager.playUIPanelClose();
    onCancel?.();
    setActiveTool('select');
  };

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-[#121418]/97 backdrop-blur-xl border-2 border-[#5a4830] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 pr-3 border-r border-[#3d3222]">
          <RoadIcon className="w-4 h-4 text-amber-400" />
          <span className="font-cinzel font-bold text-xs text-amber-200 uppercase tracking-wider whitespace-nowrap">
            {dict.roads.panelTitle}
          </span>
        </div>

        <button
          onClick={handleDrawClick}
          title={dict.roads.layRoad}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold transition border cursor-pointer ${
            !roadEraseMode
              ? 'bg-gradient-to-b from-amber-900/90 to-amber-950/90 border-amber-500 text-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
              : 'bg-[#1a1d24] border-[#3a3224] text-slate-400 hover:text-amber-300 hover:border-amber-700'
          }`}
        >
          <RoadIcon className="w-3.5 h-3.5" />
          {dict.roads.modeLay}
        </button>

        <button
          onClick={handleEraseClick}
          title={dict.roads.eraseRoad}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold transition border cursor-pointer ${
            roadEraseMode
              ? 'bg-gradient-to-b from-red-900/90 to-red-950/90 border-red-500 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.45)]'
              : 'bg-[#1a1d24] border-[#3a3224] text-slate-400 hover:text-red-300 hover:border-red-800'
          }`}
        >
          <EraserIcon className="w-3.5 h-3.5" />
          {dict.roads.modeErase}
        </button>

        <div className="w-px h-6 bg-[#3d3222]" />

        <button
          onClick={handleCloseClick}
          title={`${dict.common.close} (ESC)`}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer"
        >
          <CrossCloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full border border-[#2e2618]/80 text-[10px] font-mono text-slate-400">
        <span>
          <kbd className="px-1 py-0.5 rounded bg-[#2a2118] border border-[#4a3c28] text-amber-300 font-bold">LMB</kbd>{' '}
          — {language === 'uk' ? 'початок/кінець відрізка' : 'start/end segment'}
        </span>
        <span className="text-[#3d3222]">│</span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-[#2a2118] border border-[#4a3c28] text-red-300 font-bold">RMB / E</kbd>{' '}
          — {language === 'uk' ? 'стерти тайл' : 'erase tile'}
        </span>
        <span className="text-[#3d3222]">│</span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-[#2a2118] border border-[#4a3c28] text-slate-300 font-bold">ESC</kbd>{' '}
          — {dict.common.cancel}
        </span>
      </div>
    </div>
  );
});

RoadToolPanel.displayName = 'RoadToolPanel';
export default RoadToolPanel;
