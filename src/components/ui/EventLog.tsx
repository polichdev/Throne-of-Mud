import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useTranslation } from '../../i18n';
import {
  ScrollIcon,
  CrossCloseIcon,
  MedievalAlertIcon,
  MedievalCheckIcon,
  MedievalInfoIcon,
} from './MedievalIcons';

export const EventLog: React.FC = React.memo(() => {
  const { dict } = useTranslation();
  const chronicle = useGameStore((s) => s.chronicle);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className="absolute bottom-4 left-6 sm:bottom-5 sm:left-7 pointer-events-auto z-20">
        <button
          onClick={() => setIsExpanded(true)}
          title={dict.chronicle.title}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-[#2d2116] via-[#1c140d] to-[#0e0b07] border-2 border-[#8a6838] hover:border-amber-400 shadow-[0_8px_25px_rgba(0,0,0,0.9)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group cursor-pointer"
        >
          <ScrollIcon size={26} className="text-amber-300 group-hover:text-amber-100 transition-colors drop-shadow" />

          {chronicle.length > 0 && (
            <span className="absolute -top-1 -right-1 px-2 py-0.5 min-w-[22px] text-[11px] font-mono font-bold leading-none bg-gradient-to-b from-amber-700 to-amber-950 text-amber-200 rounded-full border border-amber-400 shadow-md">
              {chronicle.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-6 sm:bottom-5 sm:left-7 flex flex-col gap-1 pointer-events-auto z-20 max-w-sm w-96 animate-in fade-in zoom-in-95 duration-200 font-cinzel">
      <div className="bg-[#12141a]/95 backdrop-blur-md rounded-2xl border-2 border-[#6a4f28] shadow-[0_16px_40px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#261b11] via-[#18120b] to-[#12141a] border-b border-[#523d1f]">
          <div className="flex items-center gap-2">
            <ScrollIcon size={16} className="text-amber-400" />
            <span className="font-bold text-xs text-amber-200 tracking-wider uppercase">
              {dict.chronicle.title}
            </span>
            <span className="text-[10px] bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded-full border border-amber-700/60 font-mono font-semibold">
              {chronicle.length}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(false)}
            title={dict.common.close}
            className="p-1 rounded-lg text-amber-400/80 hover:text-amber-200 hover:bg-amber-950/40 transition cursor-pointer"
          >
            <CrossCloseIcon size={14} />
          </button>
        </div>

        <div className="p-2.5 flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          {chronicle.length === 0 ? (
            <div className="text-center py-6 text-xs text-stone-500 italic">
              {dict.chronicle.noEvents}
            </div>
          ) : (
            chronicle.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#181c26]/80 p-2.5 rounded-xl border border-stone-800/90 flex items-start gap-2.5 text-xs hover:border-[#6a4f28] transition"
              >
                <div className="mt-0.5 shrink-0">
                  {evt.type === 'danger' && <MedievalAlertIcon size={15} className="text-rose-400" />}
                  {evt.type === 'warning' && <MedievalAlertIcon size={15} className="text-amber-400" />}
                  {evt.type === 'success' && <MedievalCheckIcon size={15} className="text-emerald-400" />}
                  {evt.type === 'info' && <MedievalInfoIcon size={15} className="text-sky-400" />}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-100 truncate">{evt.title}</span>
                    <span className="text-[10px] text-amber-400/80 font-mono shrink-0">
                      {dict.common.day} {evt.gameDay} {String(evt.gameHour).padStart(2, '0')}:00
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-relaxed mt-0.5 font-sans">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

EventLog.displayName = 'EventLog';
