import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { GridMap } from '../../../engine/grid/GridMap';
import { saveGameToIndexedDB } from '../../../services/storage/saveManager';
import { SettingsIcon, CrossCloseIcon } from '../MedievalIcons';
import { LanguageSelector } from './LanguageSelector';
import { AudioSettingsControls } from './AudioSettingsControls';
import { audioManager } from '../../../engine/audio/AudioManager';
import { useTranslation } from '../../../i18n';

interface SettingsModalProps {
  grid: GridMap;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = React.memo(({ grid, onClose }) => {
  const { dict } = useTranslation();
  const setGameMode = useGameStore((s) => s.setGameMode);
  const setSaveNotification = useGameStore((s) => s.setSaveNotification);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveGame = async () => {
    setIsSaving(true);
    try {
      const success = await saveGameToIndexedDB(grid);
      if (success) {
        setSaveNotification(dict.common.savedSuccess);
      } else {
        alert(dict.common.saveError);
      }
    } catch (err) {
      console.error(err);
      alert(dict.common.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReturnToMainMenu = async () => {
    onClose();
    useGameStore.getState().setSelectedEntityId(null);
    await saveGameToIndexedDB(grid);
    setSaveNotification(dict.menu.savedBeforeExit);
    setGameMode('menu');
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#121418]/98 backdrop-blur-xl p-5 rounded-2xl border-2 border-[#5a4830] shadow-[0_12px_40px_rgba(0,0,0,0.95)] flex flex-col gap-4 w-[430px] max-w-[95vw] pointer-events-auto z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 font-cinzel max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-[#3d3222] pb-2.5">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-amber-100 uppercase tracking-wider">
            {dict.settings.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title={dict.common.close}
        >
          <CrossCloseIcon className="w-4 h-4" />
        </button>
      </div>

      <LanguageSelector />
      <AudioSettingsControls />

      <div className="flex flex-col gap-2 pt-1 font-cinzel">
        <button
          onClick={() => {
            audioManager.playUIClick();
            handleSaveGame();
          }}
          disabled={isSaving}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2c2012] via-[#453118] to-[#2c2012] hover:from-[#3a2c1a] hover:to-[#3a2c1a] border border-[#d4af37] text-amber-100 font-bold text-xs uppercase tracking-wider flex items-center justify-center shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <span>{isSaving ? dict.common.saving : dict.common.saveProgress}</span>
        </button>

        <button
          onClick={handleReturnToMainMenu}
          className="w-full py-2.5 px-4 rounded-xl bg-[#1b1e27] hover:bg-[#252a36] border border-[#3c4254] text-slate-200 hover:text-amber-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center transition cursor-pointer"
        >
          <span>{dict.common.saveAndExit}</span>
        </button>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';
