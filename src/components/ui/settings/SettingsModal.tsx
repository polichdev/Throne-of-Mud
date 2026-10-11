import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { GridMap } from '../../../engine/grid/GridMap';
import { saveGameToIndexedDB } from '../../../services/storage/saveManager';
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
  const settlementName = useGameStore((s) => s.settlementName);

  const [page, setPage] = useState<'menu' | 'settings'>('menu');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (page !== 'settings' && !isSaving) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (isSaving) return;
      audioManager.playUIPanelClose();
      setPage('menu');
    };
    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [page, isSaving]);

  const handleSaveGame = async (exitAfterSave: boolean) => {
    if (isSaving) return;
    audioManager.playUIClick();
    setFeedback('');
    setIsSaving(true);
    try {
      const success = await saveGameToIndexedDB(grid);
      if (!success) {
        setFeedback(dict.common.saveError);
        return;
      }

      if (exitAfterSave) {
        useGameStore.getState().setSelectedEntityId(null);
        setGameMode('menu');
        onClose();
        setSaveNotification(dict.menu.savedBeforeExit);
      } else {
        setFeedback(dict.common.savedSuccess);
      }
    } catch (error) {
      console.error(error);
      setFeedback(dict.common.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="realm-pause-screen absolute inset-0 z-[100] pointer-events-auto overflow-y-auto font-cinzel" role="dialog" aria-modal="true" aria-label={page === 'menu' ? dict.settings.pauseTitle : dict.settings.title}>
      <div className="relative z-10 flex min-h-full items-center justify-center px-5 py-10 sm:px-10">
        <div className={`realm-pause-panel w-full ${page === 'settings' ? 'max-w-[600px]' : 'max-w-[490px]'}`}>
          <div className="realm-pause-masthead text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.42em] text-[#a48d63]">{dict.menu.title}</div>
            <div className="realm-pause-rule my-5" aria-hidden="true"><span>◆</span></div>
            <h2 className="text-[clamp(2rem,4vw,3.15rem)] font-bold uppercase tracking-[0.18em] text-[#e4d6b8] leading-tight">
              {page === 'menu' ? dict.settings.pauseTitle : dict.settings.title}
            </h2>
            <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-[#9e8a67]">{settlementName}</p>
          </div>

          {page === 'menu' ? (
            <nav className="mt-9 flex flex-col gap-2" aria-label={dict.settings.pauseTitle}>
              <button type="button" onClick={onClose} disabled={isSaving} className="realm-pause-choice">
                <span>{dict.menu.continue}</span>
              </button>
              <button type="button" onClick={() => void handleSaveGame(false)} disabled={isSaving} className="realm-pause-choice">
                <span>{isSaving ? dict.common.saving : dict.common.save}</span>
              </button>
              <button type="button" onClick={() => { audioManager.playUIClick(); setPage('settings'); }} disabled={isSaving} className="realm-pause-choice">
                <span>{dict.menu.settings}</span>
              </button>
              <div className="realm-pause-rule my-3" aria-hidden="true"><span>✦</span></div>
              <button type="button" onClick={() => void handleSaveGame(true)} disabled={isSaving} className="realm-pause-choice realm-pause-exit">
                <span>{dict.common.saveAndExit}</span>
              </button>
            </nav>
          ) : (
            <div className="mt-7">
              <div className="realm-pause-settings max-h-[min(56vh,550px)] overflow-y-auto pr-1 flex flex-col gap-3">
                <LanguageSelector />
                <AudioSettingsControls />
              </div>
              <button type="button" onClick={() => { audioManager.playUIPanelClose(); setPage('menu'); }} className="realm-pause-choice mt-5 w-full">
                <span>{dict.common.back}</span>
              </button>
            </div>
          )}

          {feedback && (
            <p role="status" className="mt-5 text-center text-xs tracking-wide text-[#d2b88a]">{feedback}</p>
          )}
          <p className="mt-7 text-center text-[10px] uppercase tracking-[0.19em] text-[#86765a]">Esc · {page === 'menu' ? dict.menu.continue : dict.common.back}</p>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';
