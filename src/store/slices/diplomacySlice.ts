import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import type {
  DiplomacySlice,
  LordDiplomacyState,
  DiplomaticLetter,
} from '../../types/diplomacy';
import { audioManager } from '../../engine/audio/AudioManager';
import { DIPLOMACY_CONFIG } from '../../constants/diplomacy';
import { translations } from '../../i18n/translations';

const MALE_PORTRAITS = [0, 2, 5, 7, 8];
const FEMALE_PORTRAITS = [1, 3, 4, 6, 9];
const pickPortrait = (pool: number[]) => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];

function freshBotDiplomacy(language?: string): Record<string, LordDiplomacyState> {
  const lang = language === 'en' ? 'en' : 'uk';
  const dict = translations[lang].diplomacy;
  const male = [...MALE_PORTRAITS];
  const female = [...FEMALE_PORTRAITS];

  const configs: Array<{
    id: string;
    regionId: number;
    color: string;
    heraldryIcon: string;
    militaryStrength: number;
    wealth: number;
    population: number;
    letterId: string;
    replies: Array<{ id: string; tone: 'friendly' | 'neutral' | 'hostile'; change: number }>;
  }> = [
    {
      id: 'bot-1',
      regionId: 1,
      color: '#dc2626',
      heraldryIcon: '',
      militaryStrength: 8,
      wealth: 40,
      population: 3,
      letterId: 'letter-berg-intro',
      replies: [
        { id: 'rep-berg-friendly', tone: 'friendly', change: 15 },
        { id: 'rep-berg-neutral', tone: 'neutral', change: 0 },
        { id: 'rep-berg-hostile', tone: 'hostile', change: -35 },
      ],
    },
    {
      id: 'bot-2',
      regionId: 2,
      color: '#2563eb',
      heraldryIcon: '',
      militaryStrength: 6,
      wealth: 60,
      population: 3,
      letterId: 'letter-hild-intro',
      replies: [
        { id: 'rep-hild-friendly', tone: 'friendly', change: 20 },
        { id: 'rep-hild-neutral', tone: 'neutral', change: 0 },
        { id: 'rep-hild-hostile', tone: 'hostile', change: -30 },
      ],
    },
    {
      id: 'bot-3',
      regionId: 3,
      color: '#16a34a',
      heraldryIcon: '',
      militaryStrength: 10,
      wealth: 50,
      population: 3,
      letterId: 'letter-wilh-intro',
      replies: [
        { id: 'rep-wilh-friendly', tone: 'friendly', change: 20 },
        { id: 'rep-wilh-neutral', tone: 'neutral', change: 0 },
        { id: 'rep-wilh-hostile', tone: 'hostile', change: -25 },
      ],
    },
  ];

  return Object.fromEntries(
    configs.map((c) => {
      const lData = dict.initialLords[c.id];
      const lord: LordDiplomacyState = {
        lordId: c.id,
        lordName: lData?.lordName || c.id,
        lordTitle: lData?.lordTitle || '',
        regionId: c.regionId,
        regionName: lData?.regionName || '',
        color: c.color,
        heraldryIcon: c.heraldryIcon,
        personality: lData?.personality || '',
        description: lData?.description || '',
        status: 'peace',
        opinion: 0,
        hasRightOfPassage: false,
        claimedByPlayer: false,
        claimCost: DIPLOMACY_CONFIG.defaultClaimCost,
        militaryStrength: c.militaryStrength,
        wealth: c.wealth,
        population: c.population,
        portraitId: pickPortrait(c.id === 'bot-2' ? female : male),
        letters: [
          {
            id: c.letterId,
            senderId: c.id,
            senderName: lData?.lordName || c.id,
            senderTitle: lData?.letterSenderTitle || lData?.lordTitle || '',
            senderRegionName: lData?.regionName || '',
            senderHeraldryColor: c.color,
            senderHeraldryIcon: c.heraldryIcon,
            subject: lData?.letterSubject || '',
            body: lData?.letterBody || '',
            receivedDay: 1,
            isRead: false,
            replyOptions: c.replies.map((r) => ({
              id: r.id,
              text: lData?.replies[r.tone]?.text || '',
              tone: r.tone,
              opinionChange: r.change,
              responseNote: lData?.replies[r.tone]?.note || '',
            })),
          },
        ],
      };
      return [c.id, lord];
    })
  );
}

export const createDiplomacySlice: StateCreator<
  GameState,
  [],
  [],
  DiplomacySlice
> = (set, get) => ({
  lordDiplomacy: freshBotDiplomacy(),
  selectedDiplomacyLordId: 'bot-2',

  resetDiplomacy: () => set({ lordDiplomacy: freshBotDiplomacy(get().language), selectedDiplomacyLordId: 'bot-2' }),

  setSelectedDiplomacyLordId: (lordId) => {
    set({ selectedDiplomacyLordId: lordId });
  },

  sendDiplomaticReply: (lordId, letterId, replyId) => {
    const state = get();
    const lord = state.lordDiplomacy[lordId];
    if (!lord) return;

    const letter = lord.letters.find((l) => l.id === letterId);
    if (!letter || letter.selectedReplyId) return;

    const option = letter.replyOptions.find((o) => o.id === replyId);
    if (!option) return;

    const newOpinion = Math.max(
      DIPLOMACY_CONFIG.minOpinion,
      Math.min(DIPLOMACY_CONFIG.maxOpinion, lord.opinion + option.opinionChange)
    );
    const newStatus = option.outcomeStatus ?? (newOpinion <= DIPLOMACY_CONFIG.warThresholdOpinion ? 'war' : lord.status);

    const updatedLetters = lord.letters.map((l) => {
      if (l.id === letterId) {
        return {
          ...l,
          isRead: true,
          selectedReplyId: replyId,
          repliedAtDay: state.time.day,
        };
      }
      return l;
    });

    set({
      lordDiplomacy: {
        ...state.lordDiplomacy,
        [lordId]: {
          ...lord,
          opinion: newOpinion,
          status: newStatus,
          letters: updatedLetters,
        },
      },
    });

    audioManager.playUIClick();

    const lang = state.language || 'uk';
    const dict = translations[lang].chronicle;

    state.addChronicleEvent({
      type: option.tone === 'hostile' ? 'danger' : 'social',
      title: dict.diplomacyLetterSentTitle(lord.lordName),
      description: dict.diplomacyLetterSentDesc(option.text.slice(0, 75)),
    });
  },

  offerPeace: (lordId) => {
    const state = get();
    const lord = state.lordDiplomacy[lordId];
    if (!lord) return false;

    if (lord.status === 'peace' && lord.opinion >= DIPLOMACY_CONFIG.allianceMinOpinion) {
      set({
        lordDiplomacy: {
          ...state.lordDiplomacy,
          [lordId]: {
            ...lord,
            status: 'alliance',
            opinion: Math.min(DIPLOMACY_CONFIG.maxOpinion, lord.opinion + DIPLOMACY_CONFIG.allianceOpinionBonus),
          },
        },
      });
      const peaceLang = state.language || 'uk';
      const peaceDict = translations[peaceLang].chronicle;
      state.addChronicleEvent({
        type: 'success',
        title: peaceDict.diplomacyAllianceTitle(lord.lordName),
        description: peaceDict.diplomacyAllianceDesc,
      });
      audioManager.playUIClick();
      return true;
    }

    const followUpLetter: DiplomaticLetter = {
      id: `letter-peace-${Date.now()}`,
      senderId: lord.lordId,
      senderName: lord.lordName,
      senderTitle: lord.lordTitle,
      senderRegionName: lord.regionName,
      senderHeraldryColor: lord.color,
      senderHeraldryIcon: '',
      subject: translations[state.language || 'uk'].diplomacy.peaceLetter.subject,
      body: translations[state.language || 'uk'].diplomacy.peaceLetter.body,
      receivedDay: state.time.day,
      isRead: false,
      replyOptions: [
        {
          id: `rep-peace-ack-${Date.now()}`,
          text: translations[state.language || 'uk'].diplomacy.peaceLetter.replyText,
          tone: 'friendly',
          opinionChange: 15,
          responseNote: translations[state.language || 'uk'].diplomacy.peaceLetter.responseNote,
        },
      ],
    };

    set({
      lordDiplomacy: {
        ...state.lordDiplomacy,
        [lordId]: {
          ...lord,
          status: 'peace',
          opinion: Math.max(0, Math.min(DIPLOMACY_CONFIG.maxOpinion, lord.opinion + DIPLOMACY_CONFIG.peaceOpinionBonus)),
          letters: [followUpLetter, ...lord.letters],
        },
      },
    });

    const peaceLang = state.language || 'uk';
    const peaceDict = translations[peaceLang].chronicle;

    state.addChronicleEvent({
      type: 'success',
      title: peaceDict.diplomacyPeaceTitle(lord.lordName),
      description: peaceDict.diplomacyPeaceDesc,
    });

    audioManager.playUIClick();
    return true;
  },

  toggleRightOfPassage: (lordId) => {
    const state = get();
    const lord = state.lordDiplomacy[lordId];
    if (!lord) return false;

    const nextValue = !lord.hasRightOfPassage;

    if (nextValue && lord.opinion < DIPLOMACY_CONFIG.rightOfPassageRefusalThreshold) {
      const refusalLetter: DiplomaticLetter = {
        id: `letter-passage-refuse-${Date.now()}`,
        senderId: lord.lordId,
        senderName: lord.lordName,
        senderTitle: lord.lordTitle,
        senderRegionName: lord.regionName,
        senderHeraldryColor: lord.color,
        senderHeraldryIcon: '',
        subject: translations[state.language || 'uk'].diplomacy.passageRefusalLetter.subject,
        body: translations[state.language || 'uk'].diplomacy.passageRefusalLetter.body,
        receivedDay: state.time.day,
        isRead: false,
        replyOptions: [
          {
            id: `rep-passage-ref-ack-${Date.now()}`,
            text: translations[state.language || 'uk'].diplomacy.passageRefusalLetter.replyText,
            tone: 'neutral',
            opinionChange: 5,
            responseNote: translations[state.language || 'uk'].diplomacy.passageRefusalLetter.responseNote,
          },
        ],
      };

      set({
        lordDiplomacy: {
          ...state.lordDiplomacy,
          [lordId]: {
            ...lord,
            letters: [refusalLetter, ...lord.letters],
          },
        },
      });

      const passageLang = state.language || 'uk';
      const passageDict = translations[passageLang].chronicle;

      state.addChronicleEvent({
        type: 'social',
        title: passageDict.diplomacyPassageRefusedTitle(lord.lordName),
        description: passageDict.diplomacyPassageRefusedDesc(refusalLetter.subject),
      });

      audioManager.playUIPanelClose();
      return false;
    }

    set({
      lordDiplomacy: {
        ...state.lordDiplomacy,
        [lordId]: {
          ...lord,
          hasRightOfPassage: nextValue,
          opinion: nextValue ? Math.min(DIPLOMACY_CONFIG.maxOpinion, lord.opinion + DIPLOMACY_CONFIG.rightOfPassageOpinionBonus) : lord.opinion,
        },
      },
    });

    const passageLang = state.language || 'uk';
    const passageDict = translations[passageLang].chronicle;

    state.addChronicleEvent({
      type: nextValue ? 'success' : 'info',
      title: nextValue ? passageDict.diplomacyPassageGrantedTitle(lord.lordName) : passageDict.diplomacyPassageRevokedTitle(lord.lordName),
      description: nextValue
        ? passageDict.diplomacyPassageGrantedDesc(lord.regionName)
        : passageDict.diplomacyPassageRevokedDesc(lord.regionName),
    });

    audioManager.playUIClick();
    return true;
  },

  declareWar: (lordId) => {
    const state = get();
    const lord = state.lordDiplomacy[lordId];
    if (!lord) return;

    const warLetter: DiplomaticLetter = {
      id: `letter-war-${Date.now()}`,
      senderId: lord.lordId,
      senderName: lord.lordName,
      senderTitle: lord.lordTitle,
      senderRegionName: lord.regionName,
      senderHeraldryColor: lord.color,
      senderHeraldryIcon: '',
      subject: translations[state.language || 'uk'].diplomacy.warLetter.subject,
      body: translations[state.language || 'uk'].diplomacy.warLetter.body,
      receivedDay: state.time.day,
      isRead: false,
      replyOptions: [
        {
          id: `rep-war-challenge-${Date.now()}`,
          text: translations[state.language || 'uk'].diplomacy.warLetter.replyText,
          tone: 'hostile',
          opinionChange: -20,
          responseNote: translations[state.language || 'uk'].diplomacy.warLetter.responseNote,
        },
      ],
    };

    set({
      lordDiplomacy: {
        ...state.lordDiplomacy,
        [lordId]: {
          ...lord,
          status: 'war',
          opinion: DIPLOMACY_CONFIG.warDeclarationOpinion,
          hasRightOfPassage: false,
          letters: [warLetter, ...lord.letters],
        },
      },
    });

    const warLang = state.language || 'uk';
    const warDict = translations[warLang].chronicle;

    state.addChronicleEvent({
      type: 'danger',
      title: warDict.diplomacyWarTitle(lord.lordName),
      description: warDict.diplomacyWarDesc(warLetter.subject),
    });

    audioManager.playUIClick();
  },

  claimRegion: (lordId) => {
    const state = get();
    const lord = state.lordDiplomacy[lordId];
    if (!lord || lord.claimedByPlayer) return false;

    if (state.influence < lord.claimCost) {
      audioManager.playUIPanelClose();
      return false;
    }

    const newInfluence = state.influence - lord.claimCost;

    const claimDisputeLetter: DiplomaticLetter = {
      id: `letter-claim-${Date.now()}`,
      senderId: lord.lordId,
      senderName: lord.lordName,
      senderTitle: lord.lordTitle,
      senderRegionName: lord.regionName,
      senderHeraldryColor: lord.color,
      senderHeraldryIcon: '',
      subject: translations[state.language || 'uk'].diplomacy.claimProtestLetter.subject(lord.regionName),
      body: translations[state.language || 'uk'].diplomacy.claimProtestLetter.body(lord.regionName),
      receivedDay: state.time.day,
      isRead: false,
      replyOptions: [
        {
          id: `rep-claim-firm-${Date.now()}`,
          text: translations[state.language || 'uk'].diplomacy.claimProtestLetter.replyAssert,
          tone: 'hostile',
          opinionChange: -30,
          responseNote: translations[state.language || 'uk'].diplomacy.claimProtestLetter.responseAssert,
        },
        {
          id: `rep-claim-negotiate-${Date.now()}`,
          text: translations[state.language || 'uk'].diplomacy.claimProtestLetter.replyCompensate,
          tone: 'neutral',
          opinionChange: 10,
          responseNote: translations[state.language || 'uk'].diplomacy.claimProtestLetter.responseCompensate,
        },
      ],
    };

    set({
      influence: newInfluence,
      lordDiplomacy: {
        ...state.lordDiplomacy,
        [lordId]: {
          ...lord,
          claimedByPlayer: true,
          opinion: Math.max(DIPLOMACY_CONFIG.minOpinion, lord.opinion - DIPLOMACY_CONFIG.claimRegionOpinionPenalty),
          letters: [claimDisputeLetter, ...lord.letters],
        },
      },
    });

    state.updateRegionStats(lord.regionId, {
      owner: 'player',
    });

    const claimLang = state.language || 'uk';
    const claimDict = translations[claimLang].chronicle;

    state.addChronicleEvent({
      type: 'warning',
      title: claimDict.diplomacyClaimTitle(lord.lordName),
      description: claimDict.diplomacyClaimDesc(lord.regionName),
    });

    audioManager.playUIClick();
    return true;
  },

  markLetterRead: (lordId, letterId) => {
    const state = get();
    const lord = state.lordDiplomacy[lordId];
    if (!lord) return;

    const updatedLetters = lord.letters.map((l) => {
      if (l.id === letterId) {
        return { ...l, isRead: true };
      }
      return l;
    });

    set({
      lordDiplomacy: {
        ...state.lordDiplomacy,
        [lordId]: {
          ...lord,
          letters: updatedLetters,
        },
      },
    });
  },

  getUnreadLettersCount: () => {
    const { lordDiplomacy } = get();
    let count = 0;
    for (const key of Object.keys(lordDiplomacy)) {
      for (const letter of lordDiplomacy[key].letters) {
        if (!letter.isRead) count++;
      }
    }
    return count;
  },
});
