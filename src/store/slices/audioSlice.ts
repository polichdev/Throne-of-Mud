import type { StateCreator } from 'zustand';
import { audioManager } from '../../engine/audio/AudioManager';
import type { SupportedLanguage } from '../../i18n/types';
import { getStoredLanguage, saveStoredLanguage } from '../../i18n/storage';
import type { GameState, AudioSlice } from '../types';

export type { AudioSlice };

export const createAudioSlice: StateCreator<GameState, [], [], AudioSlice> = (set) => ({
  audioSettings: audioManager.getSettings(),
  setMasterVolume: (val: number) => {
    audioManager.setMasterVolume(val);
    set((state) => ({ audioSettings: { ...state.audioSettings, masterVolume: val } }));
  },
  setMusicVolume: (val: number) => {
    audioManager.setMusicVolume(val);
    set((state) => ({ audioSettings: { ...state.audioSettings, musicVolume: val } }));
  },
  setAmbientVolume: (val: number) => {
    audioManager.setAmbientVolume(val);
    set((state) => ({ audioSettings: { ...state.audioSettings, ambientVolume: val } }));
  },
  setSfxVolume: (val: number) => {
    audioManager.setSfxVolume(val);
    set((state) => ({ audioSettings: { ...state.audioSettings, sfxVolume: val } }));
  },
  setUiVolume: (val: number) => {
    audioManager.setUiVolume(val);
    set((state) => ({ audioSettings: { ...state.audioSettings, uiVolume: val } }));
  },
  toggleMute: () => {
    const isMuted = audioManager.toggleMute();
    set((state) => ({ audioSettings: { ...state.audioSettings, isMuted } }));
  },
  setMuted: (isMuted: boolean) => {
    audioManager.setMuted(isMuted);
    set((state) => ({ audioSettings: { ...state.audioSettings, isMuted } }));
  },

  language: getStoredLanguage(),
  setLanguage: (lang: SupportedLanguage) => {
    saveStoredLanguage(lang);
    set({ language: lang });
  },
});
