import type { DiplomaticLetter, LordDiplomacyState } from '../../../types/diplomacy';
import type { SupportedLanguage } from '../../../i18n';

const LORD_COPY: Record<string, { name: string; title: string; region: string; description: string }> = {
  'bot-1': {
    name: 'Baron von Berg', title: 'Conquering Lord', region: 'Waldau',
    description: 'A battle hardened ruler of the forest lands. He respects military prowess and strict discipline above all.',
  },
  'bot-2': {
    name: 'Lady Hildegard', title: 'Lady of the Lakes and Forests', region: 'Eichenau',
    description: 'She tends the lakeside fields, trade, and local shrines. She seeks stability and fair agreements.',
  },
  'bot-3': {
    name: 'Duke Wilhelm', title: 'Mountain Jarl', region: 'Zweiau',
    description: 'A stern lord of stone passes and iron mines. He values profit, honored agreements, and strong walls.',
  },
};

type LetterCopy = { subject: string; body: string; replies: Array<{ text: string; responseNote: string }> };

const INTRO_LETTERS: Record<string, LetterCopy> = {
  'letter-berg-intro': {
    subject: 'A warning concerning the borders of Waldau',
    body: 'Word has reached my stronghold that Goldhof has a new ruler. Know this: the forests of Waldau are held by my knights’ steel, not by a chancellor’s parchment. Keep out of my troops’ way and lay no claim to our woods if you value your settlers’ lives.',
    replies: [
      { text: 'True strength lies in wisdom, Baron. We propose peace and mutual respect as neighboring rulers.', responseNote: 'The Baron is surprised by your restraint but acknowledges your dignity (+15 relations).' },
      { text: 'We seek no enemies, but threats will not shake us. The borders are set; let each lord tend his own lands.', responseNote: 'Baron von Berg takes note of your position (no change).' },
      { text: 'Bold words from one who has not seen my army! Cross our border and the forests of Waldau will be your grave!', responseNote: 'Enraged by your defiance, the Baron orders his blades sharpened (-35 relations).' },
    ],
  },
  'letter-hildegard-intro': {
    subject: 'Charter of good neighborly relations and recognized borders',
    body: 'We welcome the new ruler of neighboring Goldhof on behalf of the house of Eichenau. Our lakes and ancient groves have seen many feuds, so we prize peace for our people above all else. We hope for goodwill, mutual respect, and flourishing trade. Will you honor Eichenau’s borders and live in harmony?',
    replies: [
      { text: 'A pleasure to meet you, my Lady. Our intentions are sincere: we seek peace, mutual respect, and thriving trade between our lands.', responseNote: 'Lady Hildegard is pleased by your courtesy and offers lasting peace (+20 relations).' },
      { text: 'We respect our neighbors while our interests do not clash. Time will tell whether we become trusted allies.', responseNote: 'Lady Hildegard accepts your answer with diplomatic reserve (no change).' },
      { text: 'The lands of Eichenau are too rich to belong to you alone. Do not dictate terms unless you wish to face our strength.', responseNote: 'Deeply offended, Lady Hildegard recalls her envoys (-30 relations).' },
    ],
  },
  'letter-wilhelm-intro': {
    subject: 'Mountain passes and the safety of merchant caravans',
    body: 'Greetings from the stone fortresses of Zweiau. Our cliffs and mines yield fine stone and iron, but they are harsh to careless strangers. If your merchants obey our mountain laws and pay their passage tolls, our swords will guard their caravans from bandits.',
    replies: [
      { text: 'We welcome honest trade and reliable neighbors. May the mountains of Zweiau prosper and our caravans enrich both lands.', responseNote: 'Duke Wilhelm welcomes the agreement and promises to aid your merchants (+20 relations).' },
      { text: 'Our merchants will pay a fair toll as long as your guards keep the roads safe.', responseNote: 'Duke Wilhelm agrees to a practical arrangement (no change).' },
      { text: 'The mountain roads belong to the whole kingdom, not to you. We will pay no coin to extortionists!', responseNote: 'Duke Wilhelm orders the mountain passes closed to your people (-25 relations).' },
    ],
  },
};

function generatedLetterCopy(letter: DiplomaticLetter, region: string): LetterCopy | undefined {
  if (letter.id.startsWith('letter-peace-')) return {
    subject: 'Ratification of the peace treaty',
    body: 'Your offer of peace is accepted. Let swords rest in their sheaths and peasants tend the fields between our lands without fear.',
    replies: [{ text: 'May peace bring prosperity to both our peoples.', responseNote: 'The peace has been sealed by both rulers.' }],
  };
  if (letter.id.startsWith('letter-passage-refuse-')) return {
    subject: 'Request for passage denied',
    body: 'We cannot allow foreign armed troops to cross our lands freely while trust between us is lacking. Prove your good intentions first.',
    replies: [{ text: 'We respect your sovereignty, but hope for an understanding in the future.', responseNote: 'Your answer has been sent by messenger.' }],
  };
  if (letter.id.startsWith('letter-war-')) return {
    subject: 'Declaration of war and severance of all treaties',
    body: 'You have broken the peace of the kingdom! From now on, only the clash of steel shall pass between our houses. No soldier or merchant of yours will find mercy on our lands!',
    replies: [{ text: 'Let the battlefield decide whose cause is just. To arms!', responseNote: 'The challenge is accepted. War horns call the troops to battle.' }],
  };
  if (letter.id.startsWith('letter-claim-')) return {
    subject: `Protest against the claim to ${region}`,
    body: `You dare lay a royal claim to ${region}! This is our ancestors’ land, and we will not yield it without a fight. Withdraw your claim or blood will be shed!`,
    replies: [
      { text: 'Our claim rests on ancient royal law. Accept it or prepare to pay tribute.', responseNote: 'The lord is furious; the territorial dispute deepens.' },
      { text: 'We are willing to compensate you with gold and preserve your right to part of the harvest.', responseNote: 'The lord is prepared to consider compensation.' },
    ],
  };
  return undefined;
}

export function localizeDiplomacyLord(lord: LordDiplomacyState, language: SupportedLanguage): LordDiplomacyState {
  if (language === 'uk') return lord;
  const copy = LORD_COPY[lord.lordId];
  if (!copy) return lord;
  return {
    ...lord,
    lordName: copy.name,
    lordTitle: copy.title,
    regionName: copy.region,
    description: copy.description,
    letters: lord.letters.map((letter) => {
      const content = INTRO_LETTERS[letter.id] ?? generatedLetterCopy(letter, copy.region);
      return {
        ...letter,
        senderName: copy.name,
        senderTitle: copy.title,
        senderRegionName: copy.region,
        subject: content?.subject ?? letter.subject,
        body: content?.body ?? letter.body,
        replyOptions: letter.replyOptions.map((reply, index) => ({
          ...reply,
          text: content?.replies[index]?.text ?? reply.text,
          responseNote: content?.replies[index]?.responseNote ?? reply.responseNote,
        })),
      };
    }),
  };
}
