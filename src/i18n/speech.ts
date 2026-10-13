import type { SupportedLanguage } from './types';
import { uk } from './translations/uk';
import { en } from './translations/en';

// World entities and saves retain the source phrase. Translate at render time so
// switching languages also updates speech bubbles that are already on screen.
const buildingNames = new Map<string, string>();
for (const [id, original] of Object.entries(uk.buildings.items)) {
  const translated = en.buildings.items[id];
  if (translated) buildingNames.set(original.name, translated.name);
}

const lines: Record<string, string> = {
  'Ополчення розпущено, повертаюсь до мирного життя': 'The militia is dismissed. Back to civilian life.',
  'Ополчення розпущено.': 'The militia is dismissed.',
  'Немає вільних селян для ополчення!': 'No villagers are available for the militia!',
  'Стаю під стяги мого Лорда!': 'I rally to my lord’s banner!',
  'До зброї, селяни! Захистимо наш трон!': 'To arms, villagers! Defend our throne!',
  'Покора Лорду — благословення Небес!': 'Loyalty to the lord is a blessing!',
  'Слава Господу і нашому королю!': 'Glory to the Lord and our king!',
  'Беру меч та щит за наш трон!': 'I take up sword and shield for our throne!',
  'Беру лук і стаю до строю!': 'I take my bow and join the ranks!',
  'Піки напоготові!': 'Pikes at the ready!',
  'Беру спис, стаю до строю!': 'I take my spear and join the ranks!',
  'Ополчення розпущено, повертаюсь до роботи': 'Militia dismissed. Back to work.',
  'Звільнений з роботи...': 'Dismissed from my job...',
  "Іду до прив'язі взяти мула!": 'Going to the hitching post for a mule!',
  "Іду по мула до прив'язі!": 'Going to the hitching post for a mule!',
  "Іду по мула до прив'язі...": 'Going to the hitching post for a mule...',
  "Беру мула з прив'язі...": 'Taking a mule from the hitching post...',
  "Взяв мула з прив'язі!": 'I have the mule!',
  "Заводжу мула до прив'язі...": 'Leading the mule back to the hitching post...',
  "Повернув мула до прив'язі": 'Returned the mule to the hitching post.',
  'Зачепив колоду до мула! Везу на склад': 'Log secured to the mule. Taking it to the storehouse.',
  'Зачепив колоду до мула! Везу до табору': 'Log secured to the mule. Taking it to camp.',
  'Вирушаю з мулом за іншою колодою...': 'Heading out with the mule for another log...',
  'Доставив колоду на склад мулом! (+5 деревини)': 'Delivered a log to the storehouse by mule! (+5 timber)',
  'Доставив колоду до табору мулом! (+5 деревини)': 'Delivered a log to camp by mule! (+5 timber)',
  'Вирушаю з мулом за наступною колодою...': 'Heading out with the mule for the next log...',
  'Вирушаю з мулом за підготовленою колодою...': 'Taking the mule to collect a prepared log...',
  'Завантажив матеріали на мула! Везу на будівництво': 'Materials loaded on the mule. Taking them to the building site.',
  'Немає достатньо матеріалів у поселенні...': 'The settlement lacks enough materials...',
  'Матеріали для будівництва доставлено мулом!': 'Construction materials delivered by mule!',
  'Де моє зароблене золото?!': 'Where are my wages?!',
  'Вітаю! Шукаю прихистку та роботи.': 'Greetings! I seek a home and work.',
  'Зміна триває...': 'The shift goes on...',
  'Зводжу споруду...': 'Building a structure...',
  'Розбираю споруду...': 'Dismantling a structure...',
  'Будівлю зведено!': 'The building is complete!',
  'Споруду розібрано! Ресурси повернуто.': 'Structure dismantled. Materials recovered.',
  'Свіжі овочі з городу!': 'Fresh vegetables from the garden!',
  'Свіжі сільські яйця!': 'Fresh farm eggs!',
  'Смачний хліб!': 'Delicious bread!',
  'Ситне м’ясо!': 'A hearty serving of meat!',
  'Добра риба!': 'Fine fresh fish!',
  'Солодкі лісові ягоди!': 'Sweet forest berries!',
  'Гарний ель гріє душу!': 'Good ale warms the soul!',
  'Селяни обурені умовами життя!': 'The villagers are upset by their living conditions!',
  'Спіймано свіжу рибу! (+1 риби)': 'Caught a fresh fish! (+1 fish)',
  'Зібрано соковиті ягоди! (+2 ягід)': 'Gathered juicy berries! (+2 berries)',
  'Здобич упольовано! (+2 мʼяса, +1 шкура)': 'Game hunted! (+2 meat, +1 hide)',
  'Висаджено молодий дубок!': 'A young oak has been planted!',
  'Іду розрубувати повалене дерево на колоди': 'Going to cut the fallen tree into logs.',
  'Іду рубати ліс для хатини лісоруба': 'Going to fell trees for the lumberjack hut.',
  'Підрубую стовбур...': 'Chopping through the trunk...',
  'Стовбур тріщить!': 'The trunk is cracking!',
  'Майже впало!': 'Almost down!',
  'Дерево падає! Чекаю приземлення...': 'The tree is falling! Waiting for it to land...',
  'Дерево впало! Розрубую стовбур на колоди': 'The tree is down! Cutting it into logs.',
  'Обрубую гілки та розпилюю стовбур...': 'Trimming branches and sawing the trunk...',
  'Колоду підготовлено! Потрібен мул для вивезення на склад': 'The log is ready! A mule is needed to take it to storage.',
  'Новий день у королівстві!': 'A new day in the kingdom!',
  'Доброго ранку! До праці!': 'Good morning! Time to work!',
  'Нарешті ранок... Всю ніч мерз біля вогню.': 'Morning at last... I was cold by the fire all night.',
  'Час відпочити у покоях...': 'Time to rest in my chambers...',
  'Йду спати у теплий дім...': 'Going to sleep in a warm home...',
  'Ніч біля вогнища... Королівству потрібні хороми.': 'Another night by the fire... The kingdom needs proper housing.',
  'Немає ліжка, грітимуся біля вогнища...': 'No bed tonight. I will warm myself by the fire...',
  "Розім'яти б ноги": 'I should stretch my legs.',
  'Огляну володіння': 'I will look over the lands.',
  'Оглядаю володіння': 'Looking over the lands.',
  'Пройдуся селом': 'Taking a walk through the village.',
  'Перевірю стежки': 'I will check the paths.',
  'Гарна нині погода': 'Fine weather today.',
  'Перевіряю стан земель': 'Checking the condition of the lands.',
  'Село повинно процвітати': 'The village must prosper.',
  'Огляну будівництво та дороги': 'I will inspect the buildings and roads.',
  'Село зростає на очах': 'The village grows before my eyes.',
  'Свіже повітря піде на користь': 'Fresh air will do me good.',
  'Усе йде за планом': 'Everything is going to plan.',
  'Вітаю, жителі моїх земель!': 'Greetings, people of my lands!',
  'Піду гляну, як там справи': 'I will see how things are going.',
  'Час перепочити': 'Time for a rest.',
  'Наше поселення гарнішає': 'Our settlement is looking better.',
  'Іду рубати ліс': 'Going to fell trees.',
  'Іду видобувати камінь': 'Going to mine stone.',
  'Іду на будівництво': 'Going to the building site.',
  'Іду розбирати споруду': 'Going to dismantle a structure.',
  'Час збирати врожай': 'Time to harvest.',
  'Іду на робоче місце': 'Going to my workstation.',
  'Веду мула за матеріалами': 'Taking the mule for materials.',
  'Веду мула по колоду': 'Taking the mule for a log.',
  'Патрулюю володіння': 'Patrolling the lands.',
  'Іду відпочивати': 'Going to rest.',
  'Іду грітися біля вогню': 'Going to warm myself by the fire.',
  'Виконую наказ': 'Carrying out orders.',
  'Тримайте стрій, хлопці!': 'Hold formation, men!',
  'Вирушаємо крізь лісові хащі...': 'Moving through the forest thickets...',
  'Слідуйте за мною, не відставати!': 'Follow me. Keep up!',
  'Обходимо пагорби та дороги...': 'Skirting the hills and roads...',
  'Тихо крізь хащі, нікому не попадатись на очі.': 'Quietly through the thickets. Stay out of sight.',
  'Уперед, загін!': 'Forward, squad!',
  'Стаємо на привал!': 'We make camp here!',
  'Оглянути периметр та дикі стежки.': 'Check the perimeter and the wild paths.',
  'У цих нетрях безпечно, перепочинемо.': 'These woods are safe. We can rest.',
  'Чистіть клинки та перевірте зброю.': 'Clean your blades and check your weapons.',
  'Ні душі навколо, все чисто.': 'No one around. All clear.',
  'Скоро вирушаємо далі...': 'We move on soon...',
  'Вітання володарю! Привіз добірні товари з далекої факторії.': 'Greetings, my lord! I bring fine goods from a distant trading post.',
  'Чув про процвітання вашого поселення, глянемо на торгові лави!': 'I heard your settlement is thriving. Let us see the market stalls!',
  'Мій віз повний краму, відкривайте комори!': 'My wagon is full of goods. Open the storehouses!',
  'Добра дорога була сьогодні! Готовий до вигідних угод.': 'The road was good today! I am ready to trade.',
  'Дякую за щедру торгівлю! Повертаюся на головний тракт.': 'Thank you for the good trade! I return to the main road.',
  'Коні відпочили, час рушати далі головною дорогою.': 'The horses are rested. Time to continue down the main road.',
  'Хай повняться ваші скарбниці, я вирушаю далі на схід!': 'May your treasury grow. I ride east!',
};

const dynamic: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Наглядаю за виробництвом: (.+)$/, m => `Overseeing production: ${buildingName(m[1])}`],
  [/^Став лісорубом у (.+)$/, m => `I became a lumberjack at ${buildingName(m[1])}.`],
  [/^Став до роботи: (.+)$/, m => `Starting work at ${buildingName(m[1])}.`],
  [/^Працюю у (.+)! \((.+)\)$/, m => `Working at ${buildingName(m[1])}!`],
  [/^Зводжу (.+)!$/, m => `Building ${buildingName(m[1])}!`],
  [/^Прибув до (.+)! Шукаю роботу та дім\.$/, m => `I arrived in ${regionName(m[1])}! Looking for work and a home.`],
  [/^Купили додаткового мула \((\d+\/\d+)\) для розбудови!$/, m => `Bought another mule (${m[1]}) for construction!`],
  [/^Веду мула за матеріалами для (.+?)(?:!|\.\.\.)$/, m => `Taking the mule to collect materials for ${buildingName(m[1])}!`],
  [/^Отримав (\d+) золота!$/, m => `Received ${m[1]} gold!`],
  [/^Купив хліб на ринку \(-(.+) золото\)$/, m => `Bought bread at the market (-${m[1]} gold)`],
  [/^Купив ель на ринку \(-(.+) золото\)$/, m => `Bought ale at the market (-${m[1]} gold)`],
  [/^Камінь видобуто! \(\+(\d+) каменю\)$/, m => `Stone mined! (+${m[1]} stone)`],
  [/^Врожай зібрано! \(\+(\d+) пшениці\)$/, m => `Harvest gathered! (+${m[1]} wheat)`],
  [/^Склад риби повний \((\d+\/\d+)\)! Відпочиваю$/, m => `Fish storage is full (${m[1]})! Resting.`],
  [/^Кошики ягід повні \((\d+\/\d+)\)! Відпочиваю$/, m => `Berry baskets are full (${m[1]})! Resting.`],
  [/^Сховище дичини повне \((\d+\/\d+)\)! Відпочиваю$/, m => `Game storage is full (${m[1]})! Resting.`],
  [/^Сховище хатини повне \((\d+\/\d+)\)! Відпочиваю$/, m => `Hut storage is full (${m[1]})! Resting.`],
  [/^Працюю: (.+)$/, m => `Working: ${buildingName(m[1])}`],
  [/^Іду на зміну: (.+)$/, m => `Going to my shift: ${buildingName(m[1])}`],
  [/^Доставив (\d+) од\. на склад! \((\d+\/\d+)\)$/, m => `Delivered ${m[1]} units to storage! (${m[2]})`],
];

function buildingName(name: string): string {
  return buildingNames.get(name) ?? ({ споруда: 'the building', споруду: 'the building', будівництва: 'the building site' } as Record<string, string>)[name] ?? (/[А-Яа-яІіЇїЄєҐґ]/.test(name) ? 'the building' : name);
}

function regionName(name: string): string {
  return ({ Вальдау: 'Waldau', Айхенау: 'Eichenau', Цвайау: 'Zweiau', Ґольдгоф: 'Goldhof' } as Record<string, string>)[name] ?? (/[А-Яа-яІіЇїЄєҐґ]/.test(name) ? 'the region' : name);
}

export function localizeSpeech(text: string, language: SupportedLanguage, type?: 'mood' | 'alert' | 'work'): string {
  if (language === 'uk' || !/[А-Яа-яІіЇїЄєҐґ]/.test(text)) return text;
  const exact = lines[text];
  if (exact) return exact;
  for (const [pattern, format] of dynamic) {
    const match = text.match(pattern);
    if (match) return format(match);
  }
  return type === 'alert' ? 'Something needs attention!' : type === 'mood' ? 'Thinking of home...' : 'Getting on with work...';
}
