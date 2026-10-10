import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { audioManager } from '../../../engine/audio/AudioManager';
import {
  DiplomacyDeskIcon,
  CrownIcon,
} from '../MedievalIcons';
import {
  PeacePactIcon,
  MilitaryPassageIcon,
  WarSwordsIcon,
  ClaimBannerIcon,
  WaxSealStampIcon,
  CloseCrossIcon,
} from './DiplomacyIcons';
import {
  BaronBergAvatar,
  LadyHildegardAvatar,
  DukeWilhelmAvatar,
} from './LordIllustratedAvatars';
import type { DiplomaticStatus } from '../../../types/diplomacy';

interface DiplomacyModalProps {
  onClose: () => void;
}

export const DiplomacyModal: React.FC<DiplomacyModalProps> = React.memo(({ onClose }) => {
  const { language } = useTranslation();
  const isUkr = language === 'uk';

  const lordDiplomacy = useGameStore((s) => s.lordDiplomacy);
  const selectedDiplomacyLordId = useGameStore((s) => s.selectedDiplomacyLordId);
  const setSelectedDiplomacyLordId = useGameStore((s) => s.setSelectedDiplomacyLordId);
  const sendDiplomaticReply = useGameStore((s) => s.sendDiplomaticReply);
  const offerPeace = useGameStore((s) => s.offerPeace);
  const toggleRightOfPassage = useGameStore((s) => s.toggleRightOfPassage);
  const declareWar = useGameStore((s) => s.declareWar);
  const claimRegion = useGameStore((s) => s.claimRegion);
  const influence = useGameStore((s) => s.influence);

  const [confirmWar, setConfirmWar] = useState(false);

  const realBotLords = useMemo(() => {
    return ['bot-1', 'bot-2', 'bot-3']
      .map((id) => lordDiplomacy[id])
      .filter(Boolean);
  }, [lordDiplomacy]);

  const activeLord = useMemo(() => {
    if (selectedDiplomacyLordId && lordDiplomacy[selectedDiplomacyLordId]) {
      return lordDiplomacy[selectedDiplomacyLordId];
    }
    return realBotLords[0] || null;
  }, [selectedDiplomacyLordId, lordDiplomacy, realBotLords]);

  const handleSelectLord = (id: string) => {
    audioManager.playUIClick();
    setSelectedDiplomacyLordId(id);
    setConfirmWar(false);
  };

  const handleReply = (letterId: string, replyId: string) => {
    if (!activeLord) return;
    sendDiplomaticReply(activeLord.lordId, letterId, replyId);
  };

  const renderLordAvatar = (lordId: string, size = 48) => {
    if (lordId === 'bot-1') return <BaronBergAvatar size={size} />;
    if (lordId === 'bot-2') return <LadyHildegardAvatar size={size} />;
    return <DukeWilhelmAvatar size={size} />;
  };

  const getStatusBadge = (status: DiplomaticStatus, hasPassage: boolean) => {
    if (status === 'war') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold bg-rose-950 border border-rose-600 text-rose-300">
          {isUkr ? 'ВІЙНА' : 'WAR'}
        </span>
      );
    }
    if (status === 'alliance') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold bg-amber-950 border border-amber-500 text-amber-300">
          {isUkr ? 'СОЮЗ' : 'ALLIANCE'}
        </span>
      );
    }
    if (hasPassage) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold bg-sky-950 border border-sky-600 text-sky-300">
          {isUkr ? 'ПРОХІД' : 'PASSAGE'}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold bg-emerald-950 border border-emerald-600 text-emerald-300">
        {isUkr ? 'МИР' : 'PEACE'}
      </span>
    );
  };

  const getOpinionInfo = (opinion: number) => {
    if (opinion >= 50) return { text: isUkr ? 'Прихильні' : 'Friendly', color: 'text-emerald-400' };
    if (opinion >= 10) return { text: isUkr ? 'Доброзичливі' : 'Favorable', color: 'text-emerald-300' };
    if (opinion >= -20) return { text: isUkr ? 'Нейтральні' : 'Neutral', color: 'text-stone-300' };
    if (opinion >= -50) return { text: isUkr ? 'Напружені' : 'Strained', color: 'text-amber-400' };
    return { text: isUkr ? 'Ворожі' : 'Hostile', color: 'text-rose-500' };
  };

  const currentLetter = activeLord?.letters[0] || null;
  const selectedReply = currentLetter?.replyOptions.find(
    (o) => o.id === currentLetter.selectedReplyId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/45 pointer-events-auto select-none font-sans">
      <div className="relative w-[960px] max-w-[96vw] h-[640px] max-h-[92vh] bg-[#14161f] rounded-2xl border-2 border-[#5a4830] shadow-[0_15px_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-stone-200">
        
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#3d3222] bg-[#11131a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-600/70 flex items-center justify-center shadow">
              <DiplomacyDeskIcon className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-cinzel font-bold text-amber-100 tracking-wider">
                {isUkr ? 'ДИПЛОМАТІЯ ТА КОРОЛІВСЬКІ ГРАМОТИ' : 'DIPLOMACY & ROYAL LETTERS'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 border border-amber-900/60 text-xs font-cinzel font-bold text-amber-300">
              <CrownIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>{influence}</span>
              <span className="text-[10px] text-stone-400 font-sans font-normal ml-0.5">{isUkr ? 'Впливу' : 'Influence'}</span>
            </div>

            <button
              onClick={() => {
                audioManager.playUIPanelClose();
                onClose();
              }}
              className="w-7 h-7 rounded-lg bg-stone-900 border border-stone-700 hover:border-amber-400 text-stone-400 hover:text-amber-200 flex items-center justify-center transition cursor-pointer"
            >
              <CloseCrossIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          <div className="w-[280px] shrink-0 border-r border-[#382f23] bg-[#0e1017] flex flex-col p-3 gap-2">
            <span className="text-[10px] font-cinzel font-bold text-amber-300/80 px-1 tracking-wider uppercase">
              {isUkr ? 'Правителі на карті' : 'Lords on Map'}
            </span>

            <div className="flex flex-col gap-2">
              {realBotLords.map((lord) => {
                const isSelected = activeLord?.lordId === lord.lordId;
                const unread = lord.letters.some((l) => !l.isRead);
                const op = getOpinionInfo(lord.opinion);

                return (
                  <button
                    key={lord.lordId}
                    onClick={() => handleSelectLord(lord.lordId)}
                    className={`w-full text-left p-2 rounded-xl border transition-all flex items-center gap-3 cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#201d18] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-[#151722] border-[#2e261d] hover:border-amber-700/80 hover:bg-[#1a1c28]'
                    }`}
                  >
                    <div className="shrink-0 rounded-lg overflow-hidden border border-amber-500/40 shadow">
                      {renderLordAvatar(lord.lordId, 44)}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-cinzel font-bold text-stone-100 truncate">
                          {lord.lordName}
                        </span>
                        {unread && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        )}
                      </div>

                      <span className="text-[10px] text-amber-300/80 truncate">
                        {lord.regionName}
                      </span>

                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className={`font-semibold ${op.color}`}>
                          {op.text}
                        </span>
                        {getStatusBadge(lord.status, lord.hasRightOfPassage)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto bg-[#13151e] p-5 gap-4">
            {activeLord ? (
              <>
                <div className="flex items-center justify-between bg-[#191b26] p-3.5 rounded-xl border border-[#3d3222] shadow">
                  <div className="flex items-center gap-3.5">
                    <div className="shrink-0 rounded-xl overflow-hidden border-2 border-amber-400 shadow-md">
                      {renderLordAvatar(activeLord.lordId, 56)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-cinzel font-bold text-amber-100">
                          {activeLord.lordName}
                        </h3>
                        <span className="text-[10px] font-cinzel font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300">
                          {activeLord.regionName}
                        </span>
                        {getStatusBadge(activeLord.status, activeLord.hasRightOfPassage)}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {activeLord.lordTitle} • {isUkr ? 'Відносини:' : 'Attitude:'}{' '}
                        <span className={`font-bold ${getOpinionInfo(activeLord.opinion).color}`}>
                          {activeLord.opinion > 0 ? `+${activeLord.opinion}` : activeLord.opinion} ({getOpinionInfo(activeLord.opinion).text})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => offerPeace(activeLord.lordId)}
                    className="py-2.5 px-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-[#181a24] hover:bg-[#1f2332] border-emerald-700/60 hover:border-emerald-400 shadow group"
                  >
                    <PeacePactIcon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-cinzel font-bold text-emerald-200">
                      {activeLord.status === 'war' ? (isUkr ? 'Укласти мир' : 'Propose Peace') : (isUkr ? 'Мирний пакт' : 'Peace Treaty')}
                    </span>
                  </button>

                  <button
                    onClick={() => toggleRightOfPassage(activeLord.lordId)}
                    className={`py-2.5 px-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow group ${
                      activeLord.hasRightOfPassage
                        ? 'bg-sky-950/80 border-sky-500 hover:bg-sky-900 text-sky-200'
                        : 'bg-[#181a24] hover:bg-[#1f2332] border-[#44382a] hover:border-sky-400 text-stone-300'
                    }`}
                  >
                    <MilitaryPassageIcon className="w-5 h-5 text-sky-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-cinzel font-bold">
                      {activeLord.hasRightOfPassage ? (isUkr ? 'Прохід надано' : 'Passage Granted') : (isUkr ? 'Право проходу' : 'Request Passage')}
                    </span>
                  </button>

                  {confirmWar ? (
                    <div className="flex flex-col gap-1 w-full col-span-1">
                      <button
                        onClick={() => {
                          declareWar(activeLord.lordId);
                          setConfirmWar(false);
                        }}
                        className="py-1 px-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-cinzel font-bold text-[11px] transition cursor-pointer text-center"
                      >
                        {isUkr ? 'Підтвердити' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmWar(false)}
                        className="py-1 px-2 rounded-lg bg-stone-800 text-stone-300 font-cinzel text-[10px] transition cursor-pointer text-center"
                      >
                        {isUkr ? 'Скасувати' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={activeLord.status === 'war'}
                      onClick={() => setConfirmWar(true)}
                      className={`py-2.5 px-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow group ${
                        activeLord.status === 'war'
                          ? 'bg-rose-950/40 border-rose-900 text-rose-500 cursor-not-allowed opacity-60'
                          : 'bg-[#181a24] hover:bg-rose-950/50 border-rose-800/60 hover:border-rose-500 text-rose-300'
                      }`}
                    >
                      <WarSwordsIcon className="w-5 h-5 text-rose-400 group-hover:scale-110 transition" />
                      <span className="text-xs font-cinzel font-bold">
                        {activeLord.status === 'war' ? (isUkr ? 'Стан війни' : 'At War') : (isUkr ? 'Оголосити війну' : 'Declare War')}
                      </span>
                    </button>
                  )}

                  <button
                    disabled={activeLord.claimedByPlayer || influence < activeLord.claimCost}
                    onClick={() => claimRegion(activeLord.lordId)}
                    className={`py-2.5 px-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow group ${
                      activeLord.claimedByPlayer
                        ? 'bg-amber-950/40 border-amber-600 text-amber-300 cursor-default'
                        : influence >= activeLord.claimCost
                        ? 'bg-amber-600/80 hover:bg-amber-500 border-amber-400 text-stone-950 shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                        : 'bg-[#181a24] border-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <ClaimBannerIcon className={`w-5 h-5 transition ${activeLord.claimedByPlayer || influence >= activeLord.claimCost ? 'text-stone-950 group-hover:scale-110' : 'text-stone-500'}`} />
                    <span className="text-xs font-cinzel font-bold">
                      {activeLord.claimedByPlayer
                        ? (isUkr ? 'Землю приєднано' : 'Claimed')
                        : (isUkr ? 'Захопити (1000)' : 'Claim (1000)')}
                    </span>
                  </button>
                </div>

                {currentLetter && (
                  <div className="bg-[#f5eedc] text-[#2c2219] rounded-xl p-5 border-2 border-[#8c734b] shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex flex-col gap-3 font-serif">
                    <div className="flex items-center justify-between border-b border-[#a89066] pb-2">
                      <div className="flex items-center gap-2">
                        <WaxSealStampIcon className="w-5 h-5 text-[#8c2222]" />
                        <h4 className="text-sm font-cinzel font-bold text-[#3d2b17]">
                          {currentLetter.subject}
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#6b5336] font-sans">
                        {isUkr ? `День ${currentLetter.receivedDay}` : `Day ${currentLetter.receivedDay}`}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-[#2f2214] italic pl-2 border-l-2 border-[#8c734b]/60">
                      «{currentLetter.body}»
                    </p>

                    <div className="flex justify-end text-[11px] font-cinzel font-bold text-[#5c4021]">
                      — {currentLetter.senderName}
                    </div>

                    {!currentLetter.selectedReplyId ? (
                      <div className="mt-1 pt-3 border-t-2 border-dashed border-[#a89066] flex flex-col gap-2 font-sans">
                        <span className="text-[10px] font-cinzel font-bold text-[#6b5030] uppercase tracking-wider">
                          {isUkr ? 'Ваша відповідь:' : 'Your Royal Reply:'}
                        </span>

                        <div className="flex flex-col gap-2">
                          {currentLetter.replyOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => handleReply(currentLetter.id, opt.id)}
                              className="text-left p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1 bg-[#ede0c0] hover:bg-[#e2ce9f] border-[#9c8257] hover:border-amber-800 shadow-sm"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-[#3b2713] font-cinzel">
                                  {opt.tone === 'friendly' ? (isUkr ? 'Ввічливо' : 'Friendly') : opt.tone === 'hostile' ? (isUkr ? 'Вороже' : 'Hostile') : (isUkr ? 'Нейтрально' : 'Neutral')}
                                </span>
                                <span className={`font-mono font-bold text-[10px] px-1.5 py-0.2 rounded ${
                                  opt.opinionChange > 0 ? 'text-emerald-800 bg-emerald-900/20' : opt.opinionChange < 0 ? 'text-rose-800 bg-rose-900/20' : 'text-stone-700 bg-stone-500/20'
                                }`}>
                                  {opt.opinionChange > 0 ? `+${opt.opinionChange}` : opt.opinionChange}
                                </span>
                              </div>
                              <p className="text-xs text-[#22180e] italic font-serif">
                                «{opt.text}»
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 pt-2 border-t border-[#a89066] bg-[#e6d6b8] p-3 rounded-lg border border-[#9c8257] flex flex-col gap-1 font-sans">
                        <div className="flex items-center gap-1.5 text-[10px] font-cinzel font-bold text-amber-900">
                          <WaxSealStampIcon className="w-3.5 h-3.5 text-amber-800" />
                          <span>{isUkr ? 'Надіслана королівська відповідь:' : 'Dispatched Reply:'}</span>
                        </div>
                        <p className="text-xs text-[#2b1c0e] italic font-serif">
                          «{selectedReply?.text}»
                        </p>
                        <span className="text-[10px] text-emerald-800 font-semibold pt-1 border-t border-[#bfa982]">
                          ✓ {selectedReply?.responseNote}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
});

DiplomacyModal.displayName = 'DiplomacyModal';
