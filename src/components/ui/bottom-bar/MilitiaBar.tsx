import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { GridMap } from '../../../engine/grid/GridMap';
import { audioManager } from '../../../engine/audio/AudioManager';
import { characterEntities, world } from '../../../engine/ecs/world';
import type { MilitiaUnitType } from '../../../types/game';
import { SpearmanIllustration, SwordsmanIllustration, ArcherIllustration, PikemanIllustration, AddSquadCardIllustration } from './MilitiaCardIllustrations';
import { WeaponsIcon, PeasantsIcon, ClarionHornIcon, CompassIcon, CrossCloseIcon, MedievalInfoIcon } from '../MedievalIcons';

interface MilitiaBarProps {
  grid: GridMap;
  onClose: () => void;
}

const unitTypes = [
  { type: 'spearmen', uk: 'Списники', en: 'Spearmen', Portrait: SpearmanIllustration, needsWeapons: false },
  { type: 'swordsmen', uk: 'Мечники', en: 'Swordsmen', Portrait: SwordsmanIllustration, needsWeapons: true },
  { type: 'archers', uk: 'Лучники', en: 'Archers', Portrait: ArcherIllustration, needsWeapons: true },
  { type: 'pikemen', uk: 'Пікінери', en: 'Pikemen', Portrait: PikemanIllustration, needsWeapons: true },
] as const;

const DisbandSquadIcon: React.FC = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="11" cy="10" r="3.2" fill="#d9c4a0" />
    <circle cx="21" cy="10" r="3.2" fill="#d9c4a0" />
    <path d="M6 23v-5a5 5 0 0 1 5-5h1l2 4M26 23v-5a5 5 0 0 0-5-5h-1l-2 4" fill="none" stroke="#d9c4a0" strokeWidth="2.5" strokeLinecap="round" />
    <path d="m12 25-6 3m0 0 1-5m-1 5 5-1m9-2 6 3m0 0-1-5m1 5-5-1" fill="none" stroke="#e58b69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MilitiaBar: React.FC<MilitiaBarProps> = React.memo(({ grid, onClose }) => {
  const { language } = useTranslation();
  const isUkr = language === 'uk';
  const militiaSquads = useGameStore((s) => s.militiaSquads);
  const selectedMilitiaSquadId = useGameStore((s) => s.selectedMilitiaSquadId);
  const setSelectedMilitiaSquadId = useGameStore((s) => s.setSelectedMilitiaSquadId);
  const createMilitiaSquad = useGameStore((s) => s.createMilitiaSquad);
  const disbandMilitiaSquad = useGameStore((s) => s.disbandMilitiaSquad);
  const rallyMilitiaSquad = useGameStore((s) => s.rallyMilitiaSquad);
  const syncMilitiaSquadsFromWorld = useGameStore((s) => s.syncMilitiaSquadsFromWorld);
  const setCameraFocusTarget = useGameStore((s) => s.setCameraFocusTarget);
  const weaponsCount = useGameStore((s) => s.resources.weapons || 0);
  const [showFormPanel, setShowFormPanel] = useState(() => militiaSquads.length === 0);

  React.useEffect(() => { syncMilitiaSquadsFromWorld(); }, [syncMilitiaSquadsFromWorld]);

  let idlePeasantsCount = 0;
  let workingPeasantsCount = 0;
  for (const c of characterEntities) {
    if (c.isCharacter && c.characterClass === 'peasant' && (!c.factionId || c.factionId === 'player') && !c.isLevy) {
      if (!c.workBuildingId) idlePeasantsCount++;
      else workingPeasantsCount++;
    }
  }
  const totalAvailableCount = idlePeasantsCount + workingPeasantsCount;
  const selectedSquad = useMemo(() => militiaSquads.find((sq) => sq.id === selectedMilitiaSquadId) || null, [militiaSquads, selectedMilitiaSquadId]);

  const handleCreateSquad = useCallback((type: MilitiaUnitType) => {
    const squad = createMilitiaSquad(type, grid);
    if (squad) {
      setShowFormPanel(false);
      setSelectedMilitiaSquadId(squad.id);
    }
  }, [createMilitiaSquad, grid, setSelectedMilitiaSquadId]);

  const handleFocusSelected = useCallback(() => {
    if (!selectedSquad) return;
    let sumX = 0;
    let sumZ = 0;
    let count = 0;
    for (const memId of selectedSquad.memberIds) {
      const e = world.entities.find((ent) => ent.id === memId);
      if (e?.position) {
        sumX += e.position[0];
        sumZ += e.position[2];
        count++;
      }
    }
    setCameraFocusTarget(count > 0 ? [sumX / count, sumZ / count] : selectedSquad.rallyPoint);
    audioManager.playUIClick();
  }, [selectedSquad, setCameraFocusTarget]);

  return (
    <div className="realm-militia-menu absolute bottom-[72px] left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none">
      {showFormPanel && (
        <div className="realm-militia-muster realm-paper-panel realm-militia-panel">
          <div className="realm-militia-muster-heading">
            <ClarionHornIcon className="w-5 h-5" />
            <span>{isUkr ? 'Скликати ополчення' : 'Form Militia'}</span>
            <button onClick={() => setShowFormPanel(false)} title={isUkr ? 'Згорнути' : 'Collapse'}><CrossCloseIcon className="w-4 h-4" /></button>
          </div>
          <div className="realm-militia-muster-content">
            <div className="realm-militia-unit-row">
              {unitTypes.map(({ type, uk, en, Portrait, needsWeapons }) => {
                const available = totalAvailableCount > 0 && (!needsWeapons || weaponsCount > 0);
                const count = Math.min(5, totalAvailableCount, needsWeapons ? weaponsCount : 5);
                const reason = totalAvailableCount === 0
                  ? (isUkr ? 'Немає вільних селян' : 'No peasants available')
                  : needsWeapons && weaponsCount === 0
                    ? (isUkr ? 'Потрібна зброя' : 'Weapons needed')
                    : (isUkr ? `Скликати загін (${count} чол.)` : `Form squad (${count} men)`);
                return (
                  <button key={type} data-unit={type} className="realm-militia-unit-card" disabled={!available}
                    onClick={() => handleCreateSquad(type)} title={`${isUkr ? uk : en} · ${reason}`}>
                    <span className="realm-militia-unit-portrait"><Portrait /></span>
                    <span className="realm-militia-unit-name">{isUkr ? uk : en}</span>
                    <span className="realm-militia-unit-cost">
                      {needsWeapons ? <WeaponsIcon className="w-4 h-4" /> : <PeasantsIcon className="w-4 h-4" />}
                      {needsWeapons ? `${Math.min(5, totalAvailableCount)} / ${weaponsCount}` : (isUkr ? 'без зброї' : 'no weapons')}
                    </span>
                    <span className="realm-militia-unit-action">{available ? '+' : '!'}</span>
                  </button>
                );
              })}
            </div>
            <div className="realm-militia-resources">
              <div className="realm-militia-resource"><PeasantsIcon className="w-5 h-5" /><span>{isUkr ? 'Селяни' : 'Peasants'}</span><strong>{totalAvailableCount}</strong></div>
              <div className="realm-militia-resource"><WeaponsIcon className="w-5 h-5" /><span>{isUkr ? 'Зброя' : 'Weapons'}</span><strong>{weaponsCount}</strong></div>
              <div className="realm-militia-resource realm-militia-resource-sub"><span>{isUkr ? 'Вільні' : 'Idle'}</span><strong>{idlePeasantsCount}</strong></div>
              <div className="realm-militia-resource realm-militia-resource-sub"><span>{isUkr ? 'Працюють' : 'Working'}</span><strong>{workingPeasantsCount}</strong></div>
              <p><MedievalInfoIcon className="w-4 h-4" />{isUkr ? 'Натисніть на картку, щоб скликати загін.' : 'Select a card to form a squad.'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="realm-militia-squad-shelf realm-paper-panel">
        <div className="realm-militia-squad-row">
          {militiaSquads.map((squad, index) => {
            const isSelected = selectedMilitiaSquadId === squad.id;
            const unit = unitTypes.find((entry) => entry.type === squad.type) ?? unitTypes[0];
            return (
              <button key={squad.id} onClick={() => {
                audioManager.playUIClick();
                setSelectedMilitiaSquadId(isSelected ? null : squad.id);
              }} data-unit={squad.type} className={`realm-militia-squad-card ${isSelected ? 'is-selected' : ''}`} title={squad.name}>
                <unit.Portrait />
                <span className="realm-militia-squad-number">{index + 1}</span>
                <span className="realm-militia-squad-count">{squad.memberIds.length}/{squad.maxMembers}</span>
              </button>
            );
          })}
          {militiaSquads.length === 0 && <span className="realm-militia-empty-slot" aria-hidden="true" />}
          <button onClick={() => {
            audioManager.playUIClick();
            setShowFormPanel(!showFormPanel);
          }} className={`realm-militia-add-card ${showFormPanel ? 'is-selected' : ''}`}
            title={isUkr ? 'Скликати новий загін ополчення' : 'Form new militia squad'}>
            <AddSquadCardIllustration />
          </button>
        </div>
        {selectedSquad && (
          <div className="realm-militia-squad-actions">
            <button className="realm-militia-action-rally" onClick={() => rallyMilitiaSquad(selectedSquad.id, grid)} title={isUkr ? 'До строю: зібрати загін' : 'Rally squad'} aria-label={isUkr ? 'Зібрати загін' : 'Rally squad'}><ClarionHornIcon className="w-5 h-5" /></button>
            <button className="realm-militia-action-focus" onClick={handleFocusSelected} title={isUkr ? 'Показати загін на карті' : 'Center camera on squad'} aria-label={isUkr ? 'Показати загін на карті' : 'Focus on squad'}><CompassIcon className="w-5 h-5" /></button>
            <button className="realm-militia-action-disband" onClick={() => disbandMilitiaSquad(selectedSquad.id)} title={isUkr ? 'Розпустити загін і повернути селян до роботи' : 'Disband squad and return peasants to work'} aria-label={isUkr ? 'Розпустити загін' : 'Disband squad'}><DisbandSquadIcon /></button>
          </div>
        )}
        <button className="realm-militia-close" onClick={onClose} title={isUkr ? 'Закрити панель ополчення' : 'Close militia panel'} aria-label={isUkr ? 'Закрити панель ополчення' : 'Close militia panel'}><CrossCloseIcon className="w-4 h-4" /></button>
      </div>
    </div>
  );
});

MilitiaBar.displayName = 'MilitiaBar';
