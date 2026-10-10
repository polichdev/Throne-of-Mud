import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import type {
  DiplomacySlice,
  LordDiplomacyState,
  DiplomaticLetter,
} from '../../types/diplomacy';
import { audioManager } from '../../engine/audio/AudioManager';

const INITIAL_BOT_LORDS_DIPLOMACY: Record<string, LordDiplomacyState> = {
  'bot-1': {
    lordId: 'bot-1',
    lordName: 'Барон фон Берг',
    lordTitle: 'Лорд-завойовник',
    regionId: 1,
    regionName: 'Вальдау',
    color: '#dc2626',
    heraldryIcon: '',
    personality: 'Агресивний та пихатий воїн',
    description: 'Загартований у битвах правитель лісового краю. Визнає лише військову звитягу та сталеву дисципліну.',
    status: 'peace',
    opinion: 0,
    hasRightOfPassage: false,
    claimedByPlayer: false,
    claimCost: 1000,
    militaryStrength: 8,
    wealth: 40,
    population: 3,
    letters: [
      {
        id: 'letter-berg-intro',
        senderId: 'bot-1',
        senderName: 'Барон фон Берг',
        senderTitle: 'Лорд-завойовник Вальдау',
        senderRegionName: 'Вальдау',
        senderHeraldryColor: '#dc2626',
        senderHeraldryIcon: '',
        subject: 'Попередження про непорушність кордонів Вальдау',
        body: 'До моєї твердині дійшла звістка, що в Ґольдгофі з’явився новий господар. Знайте: пущі Вальдау тримаються на сталі моїх лицарів, а не на папірцях канцлерів. Не плутайтеся під ногами моїх загонів і не зазіхайте на наші лісові багатства, якщо вам дороге життя ваших поселенців.',
        receivedDay: 1,
        isRead: false,
        replyOptions: [
          {
            id: 'rep-berg-friendly',
            text: 'Справжня сила полягає в мудрості, бароне. Ми пропонуємо тримати мир і поважати один одного як рівні володарі сусідніх земель.',
            tone: 'friendly',
            opinionChange: 15,
            responseNote: 'Барон здивований вашою розважливістю, проте визнає вашу гідність (+15 до відносин).',
          },
          {
            id: 'rep-berg-neutral',
            text: 'Ми не шукаємо ворогів, але й не здригнемося перед погрозами. Межі визначено, нехай кожен дбає про свій край.',
            tone: 'neutral',
            opinionChange: 0,
            responseNote: 'Барон фон Берг зафіксував вашу позицію без зайвих емоцій (без змін).',
          },
          {
            id: 'rep-berg-hostile',
            text: 'Зухвалі слова для того, хто ще не бачив мого війська! Спробуйте перетнути наш кордон — і ліси Вальдау стануть вашою могилою!',
            tone: 'hostile',
            opinionChange: -35,
            responseNote: 'Барон розлючений вашою зухвалістю і наказує точити клинки (-35 до відносин).',
          },
        ],
      },
    ],
  },
  'bot-2': {
    lordId: 'bot-2',
    lordName: 'Леді Хільдеґард',
    lordTitle: 'Володарка лісів та озер',
    regionId: 2,
    regionName: 'Айхенау',
    color: '#2563eb',
    heraldryIcon: '',
    personality: 'Мудра, дипломатична та шляхетна',
    description: 'Опікується розквітом озерних нив, торгівлею та захистом місцевих святинь. Прагне до стабільності та чесних угод.',
    status: 'peace',
    opinion: 20,
    hasRightOfPassage: false,
    claimedByPlayer: false,
    claimCost: 1000,
    militaryStrength: 6,
    wealth: 60,
    population: 3,
    letters: [
      {
        id: 'letter-hildegard-intro',
        senderId: 'bot-2',
        senderName: 'Леді Хільдеґард',
        senderTitle: 'Володарка лісів та озер',
        senderRegionName: 'Айхенау',
        senderHeraldryColor: '#2563eb',
        senderHeraldryIcon: '',
        subject: 'Грамота про добросусідство та визнання кордонів',
        body: 'Вітаємо нового володаря сусідніх земель Ґольдгофу від імені дому Айхенау. Наші озерні заплави та прадавні діброви бачили чимало чвар, тому ми понад усе цінуємо спокій для нашого люду. Сподіваємося на добрі наміри, взаємну повагу та процвітання торгівлі. Чи готові ви шанувати кордони Айхенау та жити у злагоді?',
        receivedDay: 1,
        isRead: false,
        replyOptions: [
          {
            id: 'rep-hild-friendly',
            text: 'Приємно познайомитися, шановна Леді. Наші наміри чисті — ми прагнемо миру, взаємної поваги та квітучої торгівлі між нашими краями.',
            tone: 'friendly',
            opinionChange: 20,
            responseNote: 'Леді Хільдеґард щиро втішена вашою шляхетністю та пропонує тривалий мир (+20 до відносин).',
          },
          {
            id: 'rep-hild-neutral',
            text: 'Ми шануємо сусідів доти, доки наші інтереси не перетинаються. Час покаже, чи станемо ми надійними союзниками.',
            tone: 'neutral',
            opinionChange: 0,
            responseNote: 'Леді Хільдеґард прийняла відповідь із дипломатичною стриманістю (без змін).',
          },
          {
            id: 'rep-hild-hostile',
            text: 'Землі Айхенау занадто багаті, щоб належати лише вам. Не диктуйте нам умови, якщо не бажаєте зіткнутися з нашою силою.',
            tone: 'hostile',
            opinionChange: -30,
            responseNote: 'Леді Хільдеґард глибоко ображена і відкликає своїх послів (-30 до відносин).',
          },
        ],
      },
    ],
  },
  'bot-3': {
    lordId: 'bot-3',
    lordName: 'Герцог Вільгельм',
    lordTitle: 'Гірський ярл',
    regionId: 3,
    regionName: 'Цвайау',
    color: '#16a34a',
    heraldryIcon: '',
    personality: 'Прагматичний господар гірських кряжів',
    description: 'Суворий володар кам’яних перевалів та залізних рудень. Цінує вигоду, дотримання домовленостей та міцні стіни.',
    status: 'peace',
    opinion: 10,
    hasRightOfPassage: false,
    claimedByPlayer: false,
    claimCost: 1000,
    militaryStrength: 7,
    wealth: 50,
    population: 3,
    letters: [
      {
        id: 'letter-wilhelm-intro',
        senderId: 'bot-3',
        senderName: 'Герцог Вільгельм',
        senderTitle: 'Гірський ярл Цвайау',
        senderRegionName: 'Цвайау',
        senderHeraldryColor: '#16a34a',
        senderHeraldryIcon: '',
        subject: 'Про гірські перевали та безпеку купецьких валок',
        body: 'Вітаю з кам’яних твердинь Цвайау. Наші скелі та надра багаті на міцний камінь і залізо, але суворі до необачних чужинців. Якщо ваші купці шануватимуть наші гірські закони та вчасно сплачуватимуть мито за прохід через ущелини — наші мечі боронитимуть ваші валки від грабіжників.',
        receivedDay: 1,
        isRead: false,
        replyOptions: [
          {
            id: 'rep-wilhelm-friendly',
            text: 'Ми завжди вітаємо чесну торгівлю та надійних сусідів. Хай гори Цвайау квітнуть, а наші каравани збагачують обидва краї.',
            tone: 'friendly',
            opinionChange: 20,
            responseNote: 'Герцог Вільгельм задоволений угодою і обіцяє сприяння вашим купцям (+20 до відносин).',
          },
          {
            id: 'rep-wilhelm-neutral',
            text: 'Купці сплачуватимуть справедливе мито, доки ваші вартові забезпечують порядок на шляхах.',
            tone: 'neutral',
            opinionChange: 0,
            responseNote: 'Герцог Вільгельм погодився на діловий статус відносин (без змін).',
          },
          {
            id: 'rep-wilhelm-hostile',
            text: 'Гірські шляхи належать усьому королівству, а не вам. Ми не збираємося платити жодного шеляга здирникам!',
            tone: 'hostile',
            opinionChange: -25,
            responseNote: 'Герцог Вільгельм наказує перекрити гірські перевали для ваших людей (-25 до відносин).',
          },
        ],
      },
    ],
  },
};

export const createDiplomacySlice: StateCreator<
  GameState,
  [],
  [],
  DiplomacySlice
> = (set, get) => ({
  lordDiplomacy: INITIAL_BOT_LORDS_DIPLOMACY,
  selectedDiplomacyLordId: 'bot-2',

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

    const newOpinion = Math.max(-100, Math.min(100, lord.opinion + option.opinionChange));
    const newStatus = option.outcomeStatus ?? (newOpinion <= -60 ? 'war' : lord.status);

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

    state.addChronicleEvent({
      type: option.tone === 'hostile' ? 'danger' : 'social',
      title: `Лист до: ${lord.lordName}`,
      description: `Надіслано королівську відповідь: "${option.text.slice(0, 75)}..."`,
    });
  },

  offerPeace: (lordId) => {
    const state = get();
    const lord = state.lordDiplomacy[lordId];
    if (!lord) return false;

    if (lord.status === 'peace' && lord.opinion >= 50) {
      set({
        lordDiplomacy: {
          ...state.lordDiplomacy,
          [lordId]: {
            ...lord,
            status: 'alliance',
            opinion: Math.min(100, lord.opinion + 15),
          },
        },
      });
      state.addChronicleEvent({
        type: 'success',
        title: `Союз із: ${lord.lordName}`,
        description: `Укладено непорушний оборонний союз та договір про дружбу.`,
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
      subject: 'Ратифікація мирного договору',
      body: `Вашу пропозицію про мир прийнято. Нехай мечі спочивають у піхвах, а селяни без остраху обробляють межі наших володінь.`,
      receivedDay: state.time.day,
      isRead: false,
      replyOptions: [
        {
          id: `rep-peace-ack-${Date.now()}`,
          text: 'Хай мир принесе процвітання обом нашим народам.',
          tone: 'friendly',
          opinionChange: 15,
          responseNote: 'Мир скріплено сургучними печатками обох володарів.',
        },
      ],
    };

    set({
      lordDiplomacy: {
        ...state.lordDiplomacy,
        [lordId]: {
          ...lord,
          status: 'peace',
          opinion: Math.max(0, Math.min(100, lord.opinion + 25)),
          letters: [followUpLetter, ...lord.letters],
        },
      },
    });

    state.addChronicleEvent({
      type: 'success',
      title: `Лист від: ${lord.lordName} — Мирний договір`,
      description: `Отримано ратифікацію миру. Між нашими володіннями встановлено злагоду.`,
    });

    audioManager.playUIClick();
    return true;
  },

  toggleRightOfPassage: (lordId) => {
    const state = get();
    const lord = state.lordDiplomacy[lordId];
    if (!lord) return false;

    const nextValue = !lord.hasRightOfPassage;

    if (nextValue && lord.opinion < -10) {
      const refusalLetter: DiplomaticLetter = {
        id: `letter-passage-refuse-${Date.now()}`,
        senderId: lord.lordId,
        senderName: lord.lordName,
        senderTitle: lord.lordTitle,
        senderRegionName: lord.regionName,
        senderHeraldryColor: lord.color,
        senderHeraldryIcon: '',
        subject: 'Відмова у наданні права проходу',
        body: `Ми не дозволимо чужим озброєним загонам безперешкодно ступати на наші землі, доки між нами немає цілковитої довіри. Спершу доведіть свої добрі наміри.`,
        receivedDay: state.time.day,
        isRead: false,
        replyOptions: [
          {
            id: `rep-passage-ref-ack-${Date.now()}`,
            text: 'Ми поважаємо ваше суверенне право, але сподіваємося на порозуміння в майбутньому.',
            tone: 'neutral',
            opinionChange: 5,
            responseNote: 'Відповідь надіслано гонцем.',
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

      state.addChronicleEvent({
        type: 'social',
        title: `Лист від: ${lord.lordName}`,
        description: `Отримано послання: "${refusalLetter.subject}".`,
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
          opinion: nextValue ? Math.min(100, lord.opinion + 10) : lord.opinion,
        },
      },
    });

    state.addChronicleEvent({
      type: nextValue ? 'success' : 'info',
      title: nextValue ? `Право проходу: ${lord.lordName}` : `Відкликано прохід: ${lord.lordName}`,
      description: nextValue
        ? `Отримано дозвіл на безперешкодний прохід військ територією ${lord.regionName}.`
        : `Право проходу територією ${lord.regionName} анульовано.`,
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
      subject: 'Оголошення стану війни та розрив усіх угод',
      body: `Ви порушили мирний устрій королівства! Віднині між нашими родами лунатиме лише дзвін сталі. Жоден ваш воїн чи купець не знайде пощади на наших землях!`,
      receivedDay: state.time.day,
      isRead: false,
      replyOptions: [
        {
          id: `rep-war-challenge-${Date.now()}`,
          text: 'Хай поле бою розсудить, чия справа справедлива. До зброї!',
          tone: 'hostile',
          opinionChange: -20,
          responseNote: 'Виклик прийнято. Сурми скликають ратників до бою.',
        },
      ],
    };

    set({
      lordDiplomacy: {
        ...state.lordDiplomacy,
        [lordId]: {
          ...lord,
          status: 'war',
          opinion: -100,
          hasRightOfPassage: false,
          letters: [warLetter, ...lord.letters],
        },
      },
    });

    state.addChronicleEvent({
      type: 'danger',
      title: `Лист від: ${lord.lordName} — Оголошення війни`,
      description: `Отримано вороже послання: "${warLetter.subject}". Між нашими володіннями розпочато війну!`,
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
      subject: `Протест проти територіальної претензії на ${lord.regionName}`,
      body: `Ви наважилися висунути коронну претензію на володіння регіоном ${lord.regionName}! Це земля наших предків, і ми не віддамо її без боротьби. Якщо ви не відкличете свої зазіхання, це призведе до кровопролиття!`,
      receivedDay: state.time.day,
      isRead: false,
      replyOptions: [
        {
          id: `rep-claim-firm-${Date.now()}`,
          text: 'Наша претензія спирається на давнє коронне право. Змиріться або готуйтеся платити данину.',
          tone: 'hostile',
          opinionChange: -30,
          responseNote: 'Лорд лютує, територіальну суперечку загострено.',
        },
        {
          id: `rep-claim-negotiate-${Date.now()}`,
          text: 'Ми готові компенсувати ваші втрати золотом та зберегти ваше право на частину врожаю.',
          tone: 'neutral',
          opinionChange: 10,
          responseNote: 'Лорд готовий розглянути умови компенсації.',
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
          opinion: Math.max(-100, lord.opinion - 40),
          letters: [claimDisputeLetter, ...lord.letters],
        },
      },
    });

    state.updateRegionStats(lord.regionId, {
      owner: 'player',
    });

    state.addChronicleEvent({
      type: 'warning',
      title: `Лист від: ${lord.lordName} — Претензія на землі`,
      description: `Отримано протест проти претензії на ${lord.regionName}. Землі офіційно оголошено коронними.`,
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
