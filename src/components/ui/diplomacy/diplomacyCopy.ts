import type { LordDiplomacyState } from '../../../types/diplomacy';
import { translations, type SupportedLanguage } from '../../../i18n/translations';

export function localizeDiplomacyLord(lord: LordDiplomacyState, language: SupportedLanguage): LordDiplomacyState {
  const dict = (translations[language] || translations.uk).diplomacy;
  const lData = dict.initialLords[lord.lordId];
  if (!lData) return lord;

  return {
    ...lord,
    lordName: lData.lordName,
    lordTitle: lData.lordTitle,
    regionName: lData.regionName,
    personality: lData.personality,
    description: lData.description,
    letters: lord.letters.map((letter) => {
      if (
        letter.id === 'letter-berg-intro' ||
        letter.id === 'letter-hild-intro' ||
        letter.id === 'letter-wilh-intro' ||
        letter.id === 'letter-hildegard-intro' ||
        letter.id === 'letter-wilhelm-intro'
      ) {
        return {
          ...letter,
          senderName: lData.lordName,
          senderTitle: lData.letterSenderTitle || lData.lordTitle,
          senderRegionName: lData.regionName,
          subject: lData.letterSubject,
          body: lData.letterBody,
          replyOptions: letter.replyOptions.map((reply) => {
            const replyCopy = lData.replies[reply.tone as 'friendly' | 'neutral' | 'hostile'];
            return {
              ...reply,
              text: replyCopy?.text ?? reply.text,
              responseNote: replyCopy?.note ?? reply.responseNote,
            };
          }),
        };
      }

      if (letter.id.startsWith('letter-peace-')) {
        return {
          ...letter,
          subject: dict.peaceLetter.subject,
          body: dict.peaceLetter.body,
          replyOptions: letter.replyOptions.map((reply) => ({
            ...reply,
            text: dict.peaceLetter.replyText,
            responseNote: dict.peaceLetter.responseNote,
          })),
        };
      }

      if (letter.id.startsWith('letter-passage-refuse-')) {
        return {
          ...letter,
          subject: dict.passageRefusalLetter.subject,
          body: dict.passageRefusalLetter.body,
          replyOptions: letter.replyOptions.map((reply) => ({
            ...reply,
            text: dict.passageRefusalLetter.replyText,
            responseNote: dict.passageRefusalLetter.responseNote,
          })),
        };
      }

      if (letter.id.startsWith('letter-war-')) {
        return {
          ...letter,
          subject: dict.warLetter.subject,
          body: dict.warLetter.body,
          replyOptions: letter.replyOptions.map((reply) => ({
            ...reply,
            text: dict.warLetter.replyText,
            responseNote: dict.warLetter.responseNote,
          })),
        };
      }

      if (letter.id.startsWith('letter-claim-')) {
        return {
          ...letter,
          subject: dict.claimProtestLetter.subject(lData.regionName),
          body: dict.claimProtestLetter.body(lData.regionName),
          replyOptions: letter.replyOptions.map((reply, idx) => ({
            ...reply,
            text: idx === 0 ? dict.claimProtestLetter.replyAssert : dict.claimProtestLetter.replyCompensate,
            responseNote: idx === 0 ? dict.claimProtestLetter.responseAssert : dict.claimProtestLetter.responseCompensate,
          })),
        };
      }

      return letter;
    }),
  };
}
