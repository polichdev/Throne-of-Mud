import type { GameEntity } from '../../../engine/ecs/world';
import { StoneIcon, CrownIcon, CompassIcon } from '../MedievalIcons';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';

interface DepositInspectorSectionProps {
  entity: GameEntity;
}

export function DepositInspectorSection({ entity }: DepositInspectorSectionProps) {
  const { language } = useTranslation();
  const setCameraFocusTarget = useGameStore((s) => s.setCameraFocusTarget);

  const cur = entity.resourceAmount ?? 0;
  const max = entity.maxResourceAmount ?? 100;
  const pct = Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
  const isRich = Boolean(entity.isRichDeposit);
  const isRenewable = entity.depositType === 'fish' || entity.depositType === 'berries' || entity.depositType === 'wild_game';

  return (
    <div className="flex flex-col gap-3">
      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
        isRich
          ? 'bg-gradient-to-br from-amber-950/70 via-stone-900/90 to-amber-900/60 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          : 'bg-stone-900/80 border-stone-700/60'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
            <StoneIcon className="w-4 h-4 text-amber-400" />
            <span>{isRich ? (language === 'uk' ? 'Багате родовище' : 'Rich Deposit') : (language === 'uk' ? 'Природне родовище' : 'Resource Deposit')}</span>
          </span>
          {isRich && (
            <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
              <CrownIcon className="w-3 h-3 text-amber-300" />
              <span>{language === 'uk' ? 'Подвійний запас' : 'Double Yield'}</span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">{language === 'uk' ? 'Залишок ресурсу:' : 'Remaining Yield:'}</span>
            <div className="font-mono font-bold flex items-baseline gap-1">
              <span className={`text-sm ${cur > 0 ? (isRich ? 'text-amber-300' : 'text-stone-100') : 'text-red-400'}`}>
                {cur}
              </span>
              <span className="text-stone-500 text-xs">/</span>
              <span className="text-stone-400 text-xs">{max}</span>
            </div>
          </div>

          <div className="w-full h-2 bg-stone-950/90 rounded-full overflow-hidden border border-stone-800">
            <div
              className={`h-full transition-all duration-500 ${
                isRich ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300' : 'bg-amber-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-stone-300/90 pt-1 border-t border-stone-800/80">
          {isRenewable ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <span>{language === 'uk' ? 'Поновлюване: запас відновлюється щовесни' : 'Renewable: replenishes every spring'}</span>
            </span>
          ) : (
            <span className="text-stone-400 flex items-center gap-1">
              <span>{language === 'uk' ? 'Вичерпні глибинні поклади' : 'Exhaustible subterranean deposits'}</span>
            </span>
          )}
        </div>
      </div>

      {entity.depositDescription && (
        <div className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/60 text-xs text-stone-300 leading-relaxed">
          <p className="italic">{entity.depositDescription}</p>
        </div>
      )}

      <div className="bg-[#1a1c22]/90 p-3 rounded-xl border border-amber-900/40 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between text-amber-200/90 font-medium">
          <span>{language === 'uk' ? 'Споруда для видобутку:' : 'Extraction Structure:'}</span>
          <span className="font-bold text-amber-300">{entity.harvestBuildingLabel || (language === 'uk' ? 'Спеціальна копальня' : 'Dedicated Workstation')}</span>
        </div>
        <p className="text-[10px] text-stone-400 leading-normal">
          {language === 'uk'
            ? 'У наступних оновленнях ви зможете звести відповідну споруду поруч або поверх цього родовища для автоматичного збору селянами.'
            : 'Construct the designated structure adjacent to or over this deposit for automated villager harvesting.'}
        </p>
      </div>

      {entity.position && (
        <button
          onClick={() => {
            setCameraFocusTarget([entity.position![0], entity.position![2]]);
          }}
          className="w-full py-2 bg-gradient-to-r from-amber-900/80 via-amber-800/80 to-amber-900/80 hover:from-amber-800 hover:to-amber-700 text-amber-100 font-medium text-xs rounded-xl border border-amber-600/50 shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
        >
          <CompassIcon className="w-3.5 h-3.5 text-amber-300" />
          <span>{language === 'uk' ? 'Центрувати камеру' : 'Focus Camera'}</span>
        </button>
      )}
    </div>
  );
}
