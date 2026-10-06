import React from 'react';
import { useTranslation } from '../../../i18n';
import { audioManager } from '../../../engine/audio/AudioManager';

export const LanguageSelector: React.FC = React.memo(() => {
  const { dict, language, setLanguage } = useTranslation();

  return (
    <div className="bg-[#181c26]/70 p-3 rounded-xl border border-stone-800/90 flex flex-col gap-2 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-xs font-cinzel font-bold text-amber-200 uppercase tracking-wider">
          {dict.settings.language}
        </span>
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-stone-700/60">
          <button
            onClick={() => {
              audioManager.playUIClick();
              setLanguage('uk');
            }}
            className={`px-3 py-1 rounded text-xs font-bold tracking-wider transition cursor-pointer ${
              language === 'uk'
                ? 'bg-amber-600 text-black font-black shadow'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            УКР
          </button>
          <button
            onClick={() => {
              audioManager.playUIClick();
              setLanguage('en');
            }}
            className={`px-3 py-1 rounded text-xs font-bold tracking-wider transition cursor-pointer ${
              language === 'en'
                ? 'bg-amber-600 text-black font-black shadow'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            ENG
          </button>
        </div>
      </div>
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';
