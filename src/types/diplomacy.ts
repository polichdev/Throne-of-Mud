export type DiplomaticStatus = 'peace' | 'war' | 'passage' | 'alliance';

export interface DiplomaticReplyOption {
  id: string;
  text: string;
  tone: 'friendly' | 'neutral' | 'hostile';
  opinionChange: number;
  outcomeStatus?: DiplomaticStatus;
  responseNote: string;
}

export interface DiplomaticLetter {
  id: string;
  senderId: string;
  senderName: string;
  senderTitle: string;
  senderRegionName: string;
  senderHeraldryColor: string;
  senderHeraldryIcon: string;
  subject: string;
  body: string;
  receivedDay: number;
  isRead: boolean;
  replyOptions: DiplomaticReplyOption[];
  selectedReplyId?: string;
  repliedAtDay?: number;
}

export interface LordDiplomacyState {
  lordId: string;
  lordName: string;
  lordTitle: string;
  regionId: number;
  regionName: string;
  color: string;
  heraldryIcon: string;
  personality: string;
  description: string;
  status: DiplomaticStatus;
  opinion: number;
  hasRightOfPassage: boolean;
  claimedByPlayer: boolean;
  claimCost: number;
  militaryStrength: number;
  wealth: number;
  population: number;
  letters: DiplomaticLetter[];
}

export interface DiplomacySlice {
  lordDiplomacy: Record<string, LordDiplomacyState>;
  selectedDiplomacyLordId: string | null;
  setSelectedDiplomacyLordId: (lordId: string | null) => void;
  sendDiplomaticReply: (lordId: string, letterId: string, replyId: string) => void;
  offerPeace: (lordId: string) => boolean;
  toggleRightOfPassage: (lordId: string) => boolean;
  declareWar: (lordId: string) => void;
  claimRegion: (lordId: string) => boolean;
  markLetterRead: (lordId: string, letterId: string) => void;
  getUnreadLettersCount: () => number;
}
