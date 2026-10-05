import { useState, useEffect } from 'react';
import { GridMap } from '../../engine/grid/GridMap';
import { useGameStore } from '../../store/useGameStore';
import {
  getSavedGameMeta,
  loadGameFromIndexedDB,
  saveGameToIndexedDB,
  type SaveMetadata
} from '../../services/storage/saveManager';
import {
  TownCenterIcon,
  StorageIcon,
  CrossCloseIcon,
  ScrollIcon,
  CompassIcon,
  PlayCrestIcon,
  MedievalAlertIcon,
  SettingsIcon,
} from './MedievalIcons';
import { NewGameSetupModal } from './NewGameSetupModal';
import type { WorldSetupConfig } from '../../types/game';
import { audioManager } from '../../engine/audio/AudioManager';
import { useTranslation } from '../../i18n';

import { LanguageSelector } from './settings/LanguageSelector';
import { AudioSettingsControls } from './settings/AudioSettingsControls';

interface MainMenuProps {
  grid: GridMap;
}

export function MainMenu({ grid }: MainMenuProps) {
  const setGameMode = useGameStore((s) => s.setGameMode);
  const resetWorld = useGameStore((s) => s.resetWorld);
  const setSaveNotification = useGameStore((s) => s.setSaveNotification);
  const { t, dict, language } = useTranslation();

  const [saveMeta, setSaveMeta] = useState<SaveMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showConfirmNewGame, setShowConfirmNewGame] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    async function checkSave() {
      setIsLoading(true);
      try {
        const meta = await getSavedGameMeta();
        setSaveMeta(meta);
      } catch (err) {
        console.warn('Error fetching save meta:', err);
      } finally {
        setIsLoading(false);
      }
    }
    checkSave();
  }, []);

  const handleContinue = async () => {
    if (!saveMeta || isProcessing) return;
    audioManager.unlockAudio();
    audioManager.playUIClick();
    setIsProcessing(true);
    try {
      const success = await loadGameFromIndexedDB(grid);
      if (success) {
        audioManager.playUISuccess();
        useGameStore.setState({
          selectedEntityId: null,
          isLordsBarOpen: false,
          activeMenuTab: null,
          activeBuildType: null,
        });

        setSaveNotification(dict.menu.restoredSuccess);
        setGameMode('playing');
      } else {
        audioManager.playUIError();
        alert(dict.menu.loadError);
      }
    } catch (err) {
      console.error(err);
      audioManager.playUIError();
      alert(dict.menu.loadError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewGame = () => {
    audioManager.unlockAudio();
    audioManager.playUIClick();
    if (saveMeta && !showConfirmNewGame) {
      setShowConfirmNewGame(true);
      return;
    }

    setShowConfirmNewGame(false);
    grid.generate(Date.now() % 100000 + Math.random() * 500);
    grid.isFullTerrainDirty = true;
    grid.dirtyTerrainCoords = [];
    useGameStore.getState().incrementTerrainVersion();
    useGameStore.getState().incrementBuildingVersion();
    useGameStore.getState().incrementFoliageVersion(true);
    setShowSetupModal(true);
  };

  const handleSetupConfirm = (config: WorldSetupConfig) => {
    audioManager.unlockAudio();
    audioManager.playUISuccess();
    setIsProcessing(true);
    setShowSetupModal(false);

    resetWorld(grid, config);

    useGameStore.setState({
      selectedEntityId: null,
      isLordsBarOpen: false,
      activeMenuTab: null,
      activeBuildType: null,
    });

    setSaveNotification(language === 'uk' ? 'Засновано нове королівство Throne of Mud!' : 'New Realm founded: Throne of Mud!');
    setGameMode('playing');
    saveGameToIndexedDB(grid);
    setIsProcessing(false);
  };

  const currentSeasonTranslated = saveMeta
    ? (dict.hud.seasons as any)[saveMeta.season] || saveMeta.season
    : '';

  return (
    <div
      onPointerDown={() => audioManager.unlockAudio()}
      className="fixed inset-0 z-50 flex select-none font-cinzel overflow-hidden"
    >
      <div className="relative flex flex-col justify-start pt-14 sm:pt-16 md:pt-20 pl-16 sm:pl-20 md:pl-24 pr-6 w-[480px] sm:w-[530px] md:w-[570px] h-full bg-gradient-to-r from-black/75 via-black/55 via-70% to-transparent pointer-events-auto">

        <div className="mb-10 sm:mb-12">
          <h1 className="text-6xl sm:text-7xl md:text-[5rem] font-black tracking-[0.16em] text-white leading-none uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            THRONE
          </h1>
          <h1 className="text-6xl sm:text-7xl md:text-[5rem] font-black tracking-[0.16em] text-amber-400 leading-none uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] mt-2">
            OF MUD
          </h1>
          <div className="w-16 h-[3px] bg-amber-500/80 mt-5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={handleContinue}
            disabled={isLoading || !saveMeta || isProcessing}
            className={`group text-left py-3 text-xl sm:text-2xl tracking-[0.22em] uppercase font-bold transition-all duration-200 flex flex-col drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] ${
              saveMeta && !isLoading
                ? 'text-stone-300 hover:text-white hover:translate-x-1.5 cursor-pointer'
                : 'text-stone-600 cursor-not-allowed'
            }`}
          >
            <span>{isLoading ? dict.common.loading : dict.menu.continue}</span>
            {saveMeta && !isLoading && (
              <span className="text-xs font-mono font-normal tracking-normal text-stone-400/80 group-hover:text-stone-300 mt-1">
                {saveMeta.settlementName} · {dict.common.day} {saveMeta.day} · {currentSeasonTranslated}
              </span>
            )}
          </button>

          <button
            onClick={handleStartNewGame}
            disabled={isProcessing}
            className="text-left py-3 text-xl sm:text-2xl tracking-[0.22em] uppercase font-bold text-stone-300 hover:text-white hover:translate-x-1.5 transition-all duration-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] cursor-pointer"
          >
            {dict.menu.newGame}
          </button>

          <button
            onClick={() => {
              audioManager.unlockAudio();
              audioManager.playUIClick();
              setShowSettingsModal(true);
            }}
            className="text-left py-3 text-xl sm:text-2xl tracking-[0.22em] uppercase font-bold text-stone-300 hover:text-white hover:translate-x-1.5 transition-all duration-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] cursor-pointer"
          >
            {dict.menu.settings}
          </button>

          <button
            onClick={() => {
              audioManager.unlockAudio();
              audioManager.playUIClick();
              setShowGuideModal(true);
            }}
            className="text-left py-3 text-xl sm:text-2xl tracking-[0.22em] uppercase font-bold text-stone-300 hover:text-white hover:translate-x-1.5 transition-all duration-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] cursor-pointer"
          >
            {dict.menu.controls}
          </button>
        </nav>

      </div>

      {showSettingsModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto font-cinzel">
          <div className="bg-[#141720] border-2 border-[#5a4830] rounded-2xl p-6 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto pointer-events-auto">

            <div className="flex items-center justify-between border-b border-[#3d3222] pb-3">
              <div className="flex items-center gap-2 text-amber-300">
                <SettingsIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-amber-100">
                  {dict.settings.title}
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={dict.common.close}
              >
                <CrossCloseIcon size={16} />
              </button>
            </div>

            <LanguageSelector />
            <AudioSettingsControls />

            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8c6b38] to-[#422d10] text-amber-100 font-cinzel font-bold text-xs uppercase border border-[#d4af37] shadow hover:brightness-110 transition cursor-pointer"
            >
              {dict.common.confirm}
            </button>

          </div>
        </div>
      )}

      {showConfirmNewGame && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-[#181512] border-2 border-amber-600 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-center pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-amber-950 border border-amber-500 mx-auto flex items-center justify-center text-amber-300">
              <MedievalAlertIcon size={24} className="text-amber-400" />
            </div>
            <h3 className="font-bold text-lg text-amber-200 uppercase tracking-wider">
              {dict.menu.confirmNewGameTitle}
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {t('menu.confirmNewGameDesc', {
                settlementName: saveMeta?.settlementName || '',
                day: saveMeta?.day || 1
              })}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setShowConfirmNewGame(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition cursor-pointer"
              >
                {dict.menu.confirmNewGameCancel}
              </button>
              <button
                onClick={() => handleStartNewGame()}
                className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
              >
                {dict.menu.confirmNewGameAccept}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-[#141720] border-2 border-[#5a4830] rounded-2xl p-6 max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto pointer-events-auto">

            <div className="flex items-center justify-between border-b border-[#3d3222] pb-3">
              <div className="flex items-center gap-2 text-amber-300">
                <ScrollIcon size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  {dict.menu.guideTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <CrossCloseIcon size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-slate-300 font-sans leading-relaxed">

              <div className="p-3 rounded-xl bg-[#1c202b] border border-[#2d3345]">
                <div className="font-cinzel font-bold text-amber-200 mb-1 flex items-center gap-1.5">
                  <CompassIcon size={15} className="text-amber-400" />
                  {dict.menu.guideCamera}
                </div>
                <p className="whitespace-pre-line text-slate-300">
                  {dict.menu.guideCameraDesc}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1c202b] border border-[#2d3345]">
                <div className="font-cinzel font-bold text-amber-200 mb-1 flex items-center gap-1.5">
                  <PlayCrestIcon size={14} className="text-amber-400" />
                  {dict.menu.guideRoads}
                </div>
                <p className="whitespace-pre-line text-slate-300">
                  {dict.menu.guideRoadsDesc}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1c202b] border border-[#2d3345]">
                <div className="font-cinzel font-bold text-amber-200 mb-1 flex items-center gap-1.5">
                  <TownCenterIcon size={15} className="text-amber-400" />
                  {dict.menu.guideBuildings}
                </div>
                <p className="whitespace-pre-line text-slate-300">
                  {dict.menu.guideBuildingsDesc}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1c202b] border border-[#2d3345]">
                <div className="font-cinzel font-bold text-amber-200 mb-1 flex items-center gap-1.5">
                  <StorageIcon size={15} className="text-amber-400" />
                  {dict.menu.guideSaves}
                </div>
                <p className="text-slate-300">
                  {dict.menu.guideSavesDesc}
                </p>
              </div>

            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8c6b38] to-[#422d10] text-amber-100 font-cinzel font-bold text-xs uppercase border border-[#d4af37] shadow hover:brightness-110 transition cursor-pointer"
            >
              {dict.common.confirm}
            </button>

          </div>
        </div>
      )}

      <NewGameSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onConfirm={handleSetupConfirm}
        grid={grid}
      />

    </div>
  );
}

