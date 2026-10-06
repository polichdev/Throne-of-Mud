import type { GameEntity } from '../../../engine/ecs/world';
import {
  CrownIcon,
  WeaponsIcon,
  FleurDeLisIcon,
  ScrollIcon,
  BreadIcon,
  HourglassIcon,
  AleIcon,
  HammerIcon,
  WoodIcon,
  StoneIcon,
} from '../MedievalIcons';
import { NeedBar, SkillBadge } from './InspectorCommon';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { addEntityThought } from '../../../engine/ecs/entityHelpers';

interface CharacterInspectorSectionProps {
  entity: GameEntity;
  isNoble: boolean;
  isForeign: boolean;
  isCommandingLevies: boolean;
}

export function CharacterInspectorSection({
  entity,
  isNoble,
  isForeign,
  isCommandingLevies,
}: CharacterInspectorSectionProps) {
  const { dict, language } = useTranslation();
  const callLevyMilitia = useGameStore((s) => s.callLevyMilitia);
  const lordPreach = useGameStore((s) => s.lordPreach);
  const addChronicleEvent = useGameStore((s) => s.addChronicleEvent);
  const triggerAnimation = useGameStore((s) => s.triggerAnimation);

  return (
    <div className="flex flex-col gap-3">
      {isNoble && !isForeign && (
        <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/50 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <CrownIcon size={14} className="text-amber-400" />
            {dict.inspector.lordActions}
          </span>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => callLevyMilitia(entity.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition border cursor-pointer ${
                isCommandingLevies
                  ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-100 border-rose-600'
                  : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-amber-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <WeaponsIcon className="w-3.5 h-3.5 text-rose-400" />
                {isCommandingLevies ? dict.inspector.disbandLevies : dict.inspector.rallyLevies}
              </span>
              <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                {isCommandingLevies ? (language === 'uk' ? 'Активно' : 'Active') : (language === 'uk' ? 'До 3 воїнів' : 'Up to 3')}
              </span>
            </button>

            <button
              onClick={() => lordPreach(entity.id)}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-between transition border border-slate-700 hover:border-amber-700 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FleurDeLisIcon className="w-3.5 h-3.5 text-amber-400" />
                {dict.inspector.preachToPeasants}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">+15 {dict.inspector.morale}</span>
            </button>

            <button
              onClick={() => {
                if (entity.skills) {
                  entity.skills.intellect = Math.min(10, entity.skills.intellect + 1);
                }
                addEntityThought(entity, {
                  id: 'studied',
                  text: language === 'uk' ? 'Вивчив трактат про правління (+10)' : 'Studied governance treatise (+10)',
                  modifier: 10,
                  durationTicks: 1500,
                });
                addChronicleEvent({
                  title: language === 'uk' ? 'Вивчення трактату' : 'Studying Treatises',
                  description: `${entity.name} ${language === 'uk' ? 'заглибився у стародавні рукописи. Інтелект зріс!' : 'delved into ancient manuscripts. Intellect increased!'}`,
                  type: 'info',
                });
              }}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-between transition border border-slate-700 hover:border-amber-700 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ScrollIcon className="w-3.5 h-3.5 text-blue-400" />
                {language === 'uk' ? 'Вивчати рукописи' : 'Study Manuscripts'}
              </span>
              <span className="text-[10px] text-blue-400 font-mono">+1 {language === 'uk' ? 'Інтелект' : 'Intellect'}</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'uk' ? 'Думки та Психоемоційний стан' : 'Thoughts & State of Mind'}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {(entity.thoughts || []).length} {language === 'uk' ? 'думок' : 'thoughts'}
          </span>
        </div>

        <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
          {(entity.thoughts || []).length > 0 ? (
            entity.thoughts?.map((thought, idx) => (
              <div
                key={`${thought.id}-${idx}`}
                className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-900/80 border border-slate-800"
              >
                <span className="text-slate-300 text-[11px] truncate pr-2">
                  {thought.text}
                </span>
                <span
                  className={`font-mono font-bold text-[11px] shrink-0 ${
                    thought.modifier >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {thought.modifier >= 0 ? `+${thought.modifier}` : thought.modifier}
                </span>
              </div>
            ))
          ) : (
            <span className="text-[11px] text-slate-500 italic py-1 text-center">
              {language === 'uk' ? 'Спокійний стан, без виражених думок.' : 'Tranquil state of mind, content.'}
            </span>
          )}
        </div>
      </div>

      {entity.needs && (
        <div className="flex flex-col gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'uk' ? 'Потреби та Стан' : 'Needs & Vitality'}
          </span>
          <NeedBar
            label={dict.inspector.hunger}
            value={entity.needs.hunger}
            icon={BreadIcon}
            color="text-orange-400"
          />
          <NeedBar
            label={dict.inspector.rest}
            value={entity.needs.energy}
            icon={HourglassIcon}
            color="text-amber-400"
          />
          <NeedBar
            label={dict.inspector.morale}
            value={entity.needs.mood}
            icon={FleurDeLisIcon}
            color={entity.needs.mood > 50 ? 'text-emerald-400' : 'text-rose-400'}
          />
          <NeedBar
            label={language === 'uk' ? 'Задоволення елем' : 'Ale Satisfaction'}
            value={entity.needs.ale}
            icon={AleIcon}
            color="text-yellow-400"
          />
        </div>
      )}

      {entity.skills && (
        <div className="flex flex-col gap-1.5 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'uk' ? 'Навички та Майстерність' : 'Skills & Proficiencies'}
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <SkillBadge label={language === 'uk' ? 'Землеробство' : 'Farming'} level={entity.skills.farming} icon={BreadIcon} />
            <SkillBadge label={language === 'uk' ? 'Лісоруб' : 'Woodcutting'} level={entity.skills.woodcutting} icon={WoodIcon} />
            <SkillBadge label={language === 'uk' ? 'Гірництво' : 'Mining'} level={entity.skills.mining} icon={StoneIcon} />
            <SkillBadge label={language === 'uk' ? 'Будівництво' : 'Building'} level={entity.skills.building} icon={HammerIcon} />
            <SkillBadge label={language === 'uk' ? 'Пивоваріння' : 'Brewing'} level={entity.skills.brewing} icon={AleIcon} />
            <SkillBadge label={language === 'uk' ? 'Бій' : 'Combat'} level={entity.skills.combat} icon={WeaponsIcon} />
            <SkillBadge label={language === 'uk' ? 'Інтелект' : 'Intellect'} level={entity.skills.intellect} icon={ScrollIcon} />
            <SkillBadge label={language === 'uk' ? 'Харизма' : 'Charisma'} level={entity.skills.charisma} icon={CrownIcon} />
          </div>
        </div>
      )}

      {!isForeign && (
        <div className="flex flex-col gap-2 bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
            Тестування Анімацій (Norland FX)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => triggerAnimation(entity.id, 'idle', 4000)}
              className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center justify-center gap-1 transition active:scale-95"
            >
              Спокій
            </button>
            <button
              onClick={() => triggerAnimation(entity.id, 'walk', 4000)}
              className="px-2 py-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 rounded-lg text-xs font-medium border border-blue-700/60 flex items-center justify-center gap-1 transition active:scale-95"
            >
              Рух
            </button>
            <button
              onClick={() => triggerAnimation(entity.id, 'attack', 3500)}
              className="px-2 py-1.5 bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 rounded-lg text-xs font-medium border border-rose-700/60 flex items-center justify-center gap-1 transition active:scale-95 shadow-sm"
            >
              Удар
            </button>
            <button
              onClick={() => triggerAnimation(entity.id, 'chop', 4000)}
              className="px-2 py-1.5 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 rounded-lg text-xs font-medium border border-amber-700/60 flex items-center justify-center gap-1 transition active:scale-95"
            >
              Рубати
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
