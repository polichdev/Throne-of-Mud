import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { ClarionHornIcon } from '../MedievalIcons';

export const AudioSettingsControls: React.FC = React.memo(() => {
  const { dict } = useTranslation();

  const audioSettings = useGameStore((s) => s.audioSettings);
  const setMasterVolume = useGameStore((s) => s.setMasterVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const setAmbientVolume = useGameStore((s) => s.setAmbientVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const setUiVolume = useGameStore((s) => s.setUiVolume);

  return (
    <div className="bg-[#181c26]/70 p-3 rounded-xl border border-stone-800/90 flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <span className="text-xs font-cinzel font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
          <ClarionHornIcon className="w-4 h-4 text-amber-400" />
          {dict.settings.audio}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-stone-300">{dict.settings.masterVolume}</span>
          <span className="font-mono text-amber-300 font-bold">{Math.round(audioSettings.masterVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audioSettings.masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-stone-300">{dict.settings.musicDesc}</span>
          <span className="font-mono text-amber-300 font-bold">{Math.round(audioSettings.musicVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audioSettings.musicVolume}
          onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
          className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-stone-300">{dict.settings.ambientDesc}</span>
          <span className="font-mono text-amber-300 font-bold">{Math.round(audioSettings.ambientVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audioSettings.ambientVolume}
          onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
          className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-stone-300">{dict.settings.sfxDesc}</span>
          <span className="font-mono text-amber-300 font-bold">{Math.round(audioSettings.sfxVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audioSettings.sfxVolume}
          onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
          className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-stone-300">{dict.settings.uiDesc}</span>
          <span className="font-mono text-amber-300 font-bold">{Math.round(audioSettings.uiVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audioSettings.uiVolume}
          onChange={(e) => setUiVolume(parseFloat(e.target.value))}
          className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded cursor-pointer"
        />
      </div>
    </div>
  );
});

AudioSettingsControls.displayName = 'AudioSettingsControls';
