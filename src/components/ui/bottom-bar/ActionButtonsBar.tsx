import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { audioManager } from '../../../engine/audio/AudioManager';
import { useTownCenterFocus } from '../../../hooks/useTownCenterFocus';
import {
  RoadIcon,
  HammerIcon,
  WeaponsIcon,
  GoldIcon,
  ScrollIcon,
  SettingsIcon,
} from '../MedievalIcons';

interface ActionButtonsBarProps {
  onToggleTab: (tabName: 'buildings' | 'military' | 'trade' | 'codex' | 'settings' | 'roads') => void;
}

export const ActionButtonsBar: React.FC<ActionButtonsBarProps> = React.memo(({ onToggleTab }) => {
  const { dict, language } = useTranslation();
  const { focusTownCenter } = useTownCenterFocus();

  const activeTool = useGameStore((s) => s.activeTool);
  const activeMenuTab = useGameStore((s) => s.activeMenuTab);

  return (
    <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-auto z-40 select-none">
      {!activeMenuTab && (
        <div className="flex items-center gap-2">
          <div
            onClick={focusTownCenter}
            className="px-3 py-0.5 rounded-full bg-[#121418]/90 border border-[#52422d]/70 text-[10px] font-cinzel font-bold text-amber-200 tracking-wider shadow-lg flex items-center cursor-pointer hover:border-amber-400 transition"
          >
            <span>{dict.common.townCenter}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-[#14161b]/98 via-[#1c1f28]/98 to-[#14161b]/98 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-[#5a4830] shadow-[0_10px_35px_rgba(0,0,0,0.95)] flex items-center gap-2.5">
        <button
          onClick={() => {
            audioManager.playUIClick();
            onToggleTab('roads');
          }}
          className={`w-11 h-11 manor-square-btn flex items-center justify-center transition cursor-pointer ${
            activeTool === 'road' ? 'active ring-2 ring-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]' : ''
          }`}
          title={language === 'uk' ? 'Прокладання доріг (R)' : 'Pave Roads (R)'}
        >
          <RoadIcon className="w-5 h-5 text-amber-200 drop-shadow" />
        </button>

        <button
          onClick={() => onToggleTab('buildings')}
          className={`w-11 h-11 manor-square-btn flex items-center justify-center transition cursor-pointer ${
            activeMenuTab === 'buildings' || activeTool === 'build' ? 'active ring-2 ring-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]' : ''
          }`}
          title={language === 'uk' ? 'Будівництво споруд (B / H)' : 'Construction Menu (B / H)'}
        >
          <HammerIcon className="w-5 h-5 text-amber-200 drop-shadow" />
        </button>

        <button
          onClick={() => onToggleTab('military')}
          className={`w-11 h-11 manor-square-btn flex items-center justify-center transition cursor-pointer ${
            activeMenuTab === 'military' ? 'active ring-2 ring-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]' : ''
          }`}
          title={language === 'uk' ? 'Військо та скликання ополчення (V / M)' : 'Military & Peasant Levies (V / M)'}
        >
          <WeaponsIcon className="w-5 h-5 text-amber-200 drop-shadow" />
        </button>

        <button
          onClick={() => onToggleTab('trade')}
          className={`w-11 h-11 manor-square-btn flex items-center justify-center transition cursor-pointer ${
            activeMenuTab === 'trade' ? 'active ring-2 ring-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]' : ''
          }`}
          title={language === 'uk' ? 'Економіка, зарплати та ринок (E)' : 'Economy, Wages & Market (E)'}
        >
          <GoldIcon className="w-5 h-5 text-amber-200 drop-shadow" />
        </button>

        <button
          onClick={() => onToggleTab('codex')}
          className={`w-11 h-11 manor-square-btn flex items-center justify-center transition cursor-pointer ${
            activeMenuTab === 'codex' ? 'active ring-2 ring-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]' : ''
          }`}
          title={language === 'uk' ? 'Літопис та довідник королівства (?)' : 'Kingdom Codex & Chronicle (?)'}
        >
          <ScrollIcon className="w-5 h-5 text-amber-200 drop-shadow" />
        </button>

        <button
          onClick={() => onToggleTab('settings')}
          className={`w-11 h-11 manor-square-btn flex items-center justify-center transition cursor-pointer ${
            activeMenuTab === 'settings' ? 'active ring-2 ring-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]' : ''
          }`}
          title={dict.settings.title}
        >
          <SettingsIcon className="w-5 h-5 text-amber-200 drop-shadow" />
        </button>
      </div>
    </footer>
  );
});

ActionButtonsBar.displayName = 'ActionButtonsBar';
