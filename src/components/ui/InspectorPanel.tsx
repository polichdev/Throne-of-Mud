import { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { world, characterEntities } from '../../engine/ecs/world';
import {
  CrossCloseIcon,
  CrownIcon,
  PeasantsIcon,
  TownCenterIcon,
  ShieldIcon,
  StoneIcon,
  WeaponsIcon,
} from './MedievalIcons';
import { useTranslation } from '../../i18n';
import { BuildingInspectorSection } from './inspector/BuildingInspectorSection';
import { CharacterInspectorSection } from './inspector/CharacterInspectorSection';
import { DepositInspectorSection } from './inspector/DepositInspectorSection';

export function InspectorPanel() {
  const { dict, language } = useTranslation();
  const selectedEntityId = useGameStore((s) => s.selectedEntityId);
  const setSelectedEntityId = useGameStore((s) => s.setSelectedEntityId);
  const playerRegionId = useGameStore((s) => s.playerRegionId);
  const regions = useGameStore((s) => s.regions);

  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return world.entities.find((e) => e.id === selectedEntityId) || null;
  }, [selectedEntityId]);

  const lords = useMemo(() => {
    return Array.from(characterEntities).filter(
      (c) =>
        (c.factionId === 'player' || (c.regionId === playerRegionId && c.factionId !== 'bot')) &&
        (c.characterClass === 'king' ||
          c.characterClass === 'lady' ||
          c.characterClass === 'warrior' ||
          c.characterClass === 'lord')
    );
  }, [playerRegionId]);

  const freePeasantsCount = useMemo(() => {
    return Array.from(characterEntities).filter(
      (c) =>
        (c.factionId === 'player' || (c.regionId === playerRegionId && c.factionId !== 'bot')) &&
        c.characterClass === 'peasant' &&
        !c.workBuildingId &&
        !c.isLevy
    ).length;
  }, [playerRegionId]);

  if (!selectedEntity) {
    return null;
  }

  const isCharacter = Boolean(selectedEntity.isCharacter);
  const isBuilding = Boolean(selectedEntity.isBuilding);
  const isResourceDeposit = Boolean(selectedEntity.isResourceDeposit);
  const isNoble =
    selectedEntity.characterClass === 'king' ||
    selectedEntity.characterClass === 'lady' ||
    selectedEntity.characterClass === 'warrior' ||
    selectedEntity.characterClass === 'lord';

  const isBandit = selectedEntity.factionId === 'bandit' || selectedEntity.characterClass === 'bandit';
  const isForeign = !isBandit && Boolean(
    (selectedEntity.factionId && selectedEntity.factionId !== 'player') ||
    (selectedEntity.regionId !== undefined && selectedEntity.regionId !== playerRegionId)
  );

  const ownerRegion = selectedEntity.regionId !== undefined
    ? regions.find((r) => r.id === selectedEntity.regionId)
    : null;

  const employerBuilding = isCharacter && selectedEntity.workBuildingId
    ? world.entities.find((b) => b.id === selectedEntity.workBuildingId)
    : null;

  const isCommandingLevies = isNoble && Array.from(characterEntities).some(
    (c) => c.isLevy && c.commandingLordId === selectedEntity.id
  );

  return (
    <aside className="absolute top-18 right-3 w-88 max-h-[calc(100vh-5.5rem)] overflow-y-auto bg-[#121418]/98 backdrop-blur-xl p-4 rounded-2xl border-2 border-[#5a4830] shadow-[0_15px_40px_rgba(0,0,0,0.95)] flex flex-col gap-3 pointer-events-auto z-30 animate-in fade-in slide-in-from-right-4 duration-200 custom-scrollbar select-none">
      <div className="flex justify-between items-start border-b border-[#5a4830]/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-md ${
              isNoble
                ? 'bg-amber-950/80 border-amber-600/70 text-amber-300'
                : isBandit
                ? 'bg-rose-950/80 border-rose-700/60 text-rose-300'
                : isBuilding
                ? 'bg-stone-900 border-stone-700 text-stone-200'
                : isResourceDeposit
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                : 'bg-blue-950/80 border-blue-700/60 text-blue-300'
            }`}
          >
            {isNoble ? (
              <CrownIcon className="w-5 h-5" />
            ) : isBandit ? (
              <WeaponsIcon className="w-5 h-5 text-rose-400" />
            ) : isBuilding ? (
              <TownCenterIcon className="w-5 h-5 text-amber-400" />
            ) : isResourceDeposit ? (
              <StoneIcon className="w-5 h-5 text-emerald-400" />
            ) : (
              <PeasantsIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-amber-200 text-base leading-tight">
              {selectedEntity.name || (language === 'uk' ? "Об'єкт" : 'Entity')}
            </h3>
            <span className="text-[11px] text-stone-400 uppercase tracking-wider font-mono font-medium">
              {isNoble
                ? dict.inspector.lordTitle
                : isBandit
                ? (language === 'uk' ? 'Мандрівні розбійники' : 'Roaming Bandits')
                : isBuilding
                ? selectedEntity.buildingType
                  ? dict.buildings.items[selectedEntity.buildingType]?.name || selectedEntity.buildingType
                  : dict.inspector.selectedBuilding
                : isResourceDeposit
                ? selectedEntity.harvestBuildingLabel || (language === 'uk' ? 'Родовище' : 'Deposit')
                : employerBuilding
                ? `${language === 'uk' ? 'Працює:' : 'Employed:'} ${employerBuilding.name}`
                : dict.inspector.unemployed}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedEntityId(null)}
          className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition cursor-pointer"
        >
          <CrossCloseIcon size={16} />
        </button>
      </div>

      {isBandit && (
        <div className="bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl text-xs flex flex-col gap-1">
          <span className="font-bold text-rose-200 flex items-center gap-1.5">
            <WeaponsIcon className="w-3.5 h-3.5 text-rose-400" />
            {language === 'uk' ? 'Загін лісових розбійників' : 'Bandit Outlaw Warband'}
          </span>
          <span className="text-slate-300 text-[11px] leading-relaxed">
            {language === 'uk'
              ? 'Мандрівна ватага озброєних грабіжників. Блукають хащами та дикими стежками, вишукуючи приховані місця для табору.'
              : 'A wandering band of armed outlaws roaming across forests and borders.'}
          </span>
        </div>
      )}

      {isForeign && (
        <div className="bg-amber-950/30 border border-amber-700/50 p-2.5 rounded-xl text-xs flex flex-col gap-1">
          <span className="font-bold text-amber-200 flex items-center gap-1">
            <ShieldIcon className="w-3.5 h-3.5 text-amber-400" />
            {language === 'uk' ? 'Підданий сусіднього лорда' : 'Subject of neighboring fief'}
          </span>
          <span className="text-slate-400 text-[11px]">
            {language === 'uk'
              ? `Належить до земель ${ownerRegion?.lordName || 'чужого лорда'} (${ownerRegion?.name || 'сусідній регіон'}).`
              : `Sworn to ${ownerRegion?.lordName || 'neighboring lord'} (${ownerRegion?.name || 'neighboring fief'}).`}
          </span>
        </div>
      )}

      {isCharacter && (
        <CharacterInspectorSection
          entity={selectedEntity}
          isNoble={isNoble}
          isForeign={isForeign}
          isCommandingLevies={isCommandingLevies}
        />
      )}

      {isBuilding && (
        <BuildingInspectorSection
          entity={selectedEntity}
          isForeign={isForeign}
          ownerRegionName={ownerRegion?.name}
          ownerLordName={ownerRegion?.lordName}
          freePeasantsCount={freePeasantsCount}
          lords={lords}
        />
      )}

      {isResourceDeposit && (
        <DepositInspectorSection entity={selectedEntity} />
      )}
    </aside>
  );
}
