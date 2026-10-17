import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useTranslation } from '../../i18n';
import { useSettlementMetrics } from '../../hooks/useSettlementMetrics';
import { useTownCenterFocus } from '../../hooks/useTownCenterFocus';
import { HeraldicShield, RulerPortrait } from './PlayerHeraldry';
import type { ResourceInventory } from '../../types/game';
import { RESOURCE_UI, getResourceName } from './resourcePresentation';
import { IlluminatedIcon, type IlluminatedIconKind } from './icons';
import { ResourceGroupIcon, type ResourceGroupKind } from './icons';
import type { TranslationDictionary } from '../../i18n';
import {
  GoldIcon, InfluenceIcon,
} from './icons';

type DetailRow = { label: string; value: string | number; icon?: IlluminatedIconKind };
type DetailSection = { title: string; rows: DetailRow[] };

interface ResourceGroupDef {
  icon: ResourceGroupKind;
  titleKey: keyof TranslationDictionary['hud']['resourceGroups'];
  sections: {
    titleKey: keyof TranslationDictionary['hud']['resourceGroups'];
    keys: (keyof ResourceInventory)[];
  }[];
}

const RESOURCE_GROUPS_CONFIG: ResourceGroupDef[] = [
  {
    icon: 'construction',
    titleKey: 'construction',
    sections: [
      { titleKey: 'woodworks', keys: ['wood', 'planks'] },
      { titleKey: 'stoneworks', keys: ['stone', 'cut_stone'] },
      { titleKey: 'clayAndBricks', keys: ['clay', 'clay_bricks'] },
    ],
  },
  {
    icon: 'food',
    titleKey: 'food',
    sections: [
      { titleKey: 'prepared', keys: ['bread', 'ale'] },
      { titleKey: 'animal', keys: ['meat', 'fish', 'eggs'] },
      { titleKey: 'foraged', keys: ['berries', 'vegetables', 'salt'] },
    ],
  },
  {
    icon: 'farm',
    titleKey: 'farm',
    sections: [
      { titleKey: 'grain', keys: ['wheat'] },
      { titleKey: 'milling', keys: ['flour'] },
    ],
  },
  {
    icon: 'materials',
    titleKey: 'materials',
    sections: [
      { titleKey: 'oreAndFuel', keys: ['iron_ore', 'coal', 'iron'] },
      { titleKey: 'hides', keys: ['hides'] },
    ],
  },
  {
    icon: 'goods',
    titleKey: 'goods',
    sections: [
      { titleKey: 'clothing', keys: ['clothes'] },
      { titleKey: 'equipment', keys: ['weapons'] },
    ],
  },
];

function HudMetric({ icon, value, title, rows, sections, note, alignRight, onClick }: {
  icon: React.ReactNode;
  value: string | number;
  title: string;
  rows: DetailRow[];
  sections?: DetailSection[];
  note?: string;
  alignRight?: boolean;
  onClick?: () => void;
}) {
  return <div className={`hud-metric ${alignRight ? 'hud-metric-right' : ''} ${onClick ? 'hud-metric-clickable' : ''}`}
    onClick={onClick} tabIndex={0} role={onClick ? 'button' : undefined}
    onKeyDown={onClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } } : undefined}
    aria-label={`${title}: ${value}`}>
    <span className="hud-metric-icon">{icon}</span>
    <strong>{value}</strong>
    <div className="hud-detail" role="tooltip">
      <h3>{title}</h3>
      {sections ? sections.map((section) => <div className="hud-detail-section" key={section.title}>
        <h4>{section.title}</h4>
        {section.rows.map((row) => <div className="hud-detail-row" key={row.label}><span>{row.icon && <IlluminatedIcon kind={row.icon} size={20} />}{row.label}</span><b>{row.value}</b></div>)}
      </div>) : rows.map((row) => <div className="hud-detail-row" key={row.label}><span>{row.icon && <IlluminatedIcon kind={row.icon} size={17} />}{row.label}</span><b>{row.value}</b></div>)}
      {note && <p>{note}</p>}
    </div>
  </div>;
}

export const TopHUD: React.FC = React.memo(() => {
  const { dict, language } = useTranslation();
  const { focusTownCenter } = useTownCenterFocus();
  const resources = useGameStore((s) => s.resources);
  const influence = useGameStore((s) => s.influence);
  const settlementName = useGameStore((s) => s.settlementName);
  const setSettlementName = useGameStore((s) => s.setSettlementName);
  const playerIdentity = useGameStore((s) => s.playerIdentity);
  const toggleLordsBar = useGameStore((s) => s.toggleLordsBar);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settlementName);
  const {
    allCharacters, employedPeasants, freePeasants, approvalRating,
    housingStats, storageUsage, muleStats,
  } = useSettlementMetrics();

  const handleSaveName = useCallback(() => {
    setSettlementName(tempName.trim() || 'GOLDHOF');
    setIsEditingName(false);
  }, [tempName, setSettlementName]);
  const resourceRows = (keys: (keyof ResourceInventory)[]) =>
    keys.map((key) => ({ label: getResourceName(key, language), value: resources[key] || 0, icon: RESOURCE_UI[key].icon }));
  const resourceMetric = (group: typeof RESOURCE_GROUPS_CONFIG[number]) => {
    const keys = group.sections.flatMap((section) => section.keys);
    const total = keys.reduce((sum, key) => sum + (resources[key] || 0), 0);
    return <HudMetric key={group.icon} icon={<ResourceGroupIcon kind={group.icon} />} value={total.toLocaleString()}
      title={dict.hud.resourceGroups[group.titleKey]} rows={[]}
      sections={group.sections.map((section) => ({ title: dict.hud.resourceGroups[section.titleKey], rows: resourceRows(section.keys) }))} alignRight />;
  };

  return (
    <header className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none z-30 select-none px-5 font-cinzel">
      <div className="manor-spear-outer realm-resource-ribbon pointer-events-auto min-w-0">
        <div className="manor-spear-inner backdrop-blur-xl flex items-center text-slate-200">
          <div className="hud-metric-group">
            <HudMetric icon={<IlluminatedIcon kind="peasants" />} value={`${freePeasants.length}/${allCharacters.length}`}
              title={dict.hud.workers}
              rows={[{ label: dict.hud.unassigned, value: freePeasants.length }, { label: dict.hud.assigned, value: employedPeasants.length }, { label: dict.hud.totalPopulation, value: allCharacters.length }]}
              note={dict.hud.workersNote} onClick={toggleLordsBar} />
            <HudMetric icon={<IlluminatedIcon kind="town" />} value={`${housingStats.occupied}/${housingStats.capacity}`}
              title={dict.hud.housing}
              rows={[{ label: dict.hud.residents, value: housingStats.occupied }, { label: dict.hud.places, value: housingStats.capacity }, { label: dict.hud.freePlaces, value: Math.max(0, housingStats.capacity - housingStats.occupied) }]}
              onClick={toggleLordsBar} />
            <HudMetric icon={<IlluminatedIcon kind="approval" />} value={`${approvalRating}%`}
              title={dict.hud.approval}
              rows={[{ label: dict.hud.averageMood, value: `${approvalRating}%` }]}
              note={dict.hud.approvalNote} />
            <HudMetric icon={<IlluminatedIcon kind="ox" />} value={`${muleStats.available}/${muleStats.total}`}
              title={dict.hud.mules}
              rows={[{ label: dict.hud.available, value: muleStats.available }, { label: dict.hud.working, value: muleStats.inUse }, { label: dict.hud.total, value: muleStats.total }]} />
            <HudMetric icon={<IlluminatedIcon kind="storage" />} value={`${storageUsage.current}/${storageUsage.max}`}
              title={dict.hud.storageCapacity}
              rows={[{ label: dict.hud.used, value: storageUsage.current }, { label: dict.hud.capacity, value: storageUsage.max }]} />
          </div>

          <div className="manor-settlement-slot flex items-stretch justify-center shrink-0 mx-1 self-stretch">
            <div onClick={focusTownCenter} className="manor-center-plaque px-4 flex items-center justify-center cursor-pointer transition group" title={dict.hud.focusTownCenter}>
              {isEditingName ? <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSaveName} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                autoFocus className="bg-transparent border-b border-amber-400 text-amber-200 font-cinzel font-bold text-xs tracking-widest uppercase text-center outline-none w-32" />
                : <span onDoubleClick={() => setIsEditingName(true)} className="font-cinzel font-bold text-xs tracking-[0.14em] text-amber-100 uppercase">{settlementName}</span>}
            </div>
          </div>

          <div className="hud-metric-group">
            {RESOURCE_GROUPS_CONFIG.map(resourceMetric)}
          </div>
        </div>
      </div>
      <div className="realm-player-widget pointer-events-auto absolute right-6 top-0" title={`${playerIdentity.rulerName} · ${playerIdentity.kingdomName}`}>
        <div className="realm-player-avatar relative shrink-0">
          <div className="realm-player-portrait overflow-hidden rounded-full"><RulerPortrait portraitId={playerIdentity.portraitId} size={104} /></div>
          <div className="realm-avatar-shield absolute -right-2 -bottom-2 z-10">
            <HeraldicShield color={playerIdentity.shieldColor} emblemId={playerIdentity.emblemId} size={42} />
          </div>
        </div>
        <div className="realm-player-card-details grid grid-cols-2 gap-x-3 gap-y-1 pl-5 min-w-0 text-[11px] text-[#cbbb99]">
          <span className="flex items-center gap-1" title={`${dict.hud.influence}: ${influence}`}><InfluenceIcon className="w-3.5 h-3.5" />{influence.toLocaleString(language === 'uk' ? 'uk-UA' : 'en-US')}</span>
          <span className="flex items-center gap-1" title={`${dict.hud.coins}: ${resources.gold}`}><GoldIcon className="w-3.5 h-3.5" />{resources.gold.toLocaleString(language === 'uk' ? 'uk-UA' : 'en-US')}</span>
        </div>
      </div>
    </header>
  );
});

TopHUD.displayName = 'TopHUD';
