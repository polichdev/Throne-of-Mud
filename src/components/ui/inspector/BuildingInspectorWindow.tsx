import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, PointerEvent } from 'react';
import type { GameEntity } from '../../../engine/ecs/world';
import { BUILDING_BLUEPRINTS } from '../../../engine/buildings/blueprints';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import { CrossCloseIcon, PeasantsIcon, TownCenterIcon } from '../icons';
import { IlluminatedIcon } from '../icons';
import { BuildingInspectorIllustration } from './BuildingInspectorIllustration';
import { HouseTierIcon } from '../icons';
import { BackyardExtensionIcon } from './BackyardExtensionIcon';
import { BACKYARD_EXTENSIONS_CONFIG } from '../../../constants/housing';
import type { BackyardExtensionType, ResourceInventory } from '../../../types/game';
import { canUpgradeHouse, toggleBuildingDemolition } from './buildingInspectorActions';
import { placeBuildingInspector, subscribeBuildingAnchor } from './buildingInspectorAnchor';
import type { BuildingAnchor } from './buildingInspectorAnchor';
import './buildingInspector.css';

export type BuildingInspectorTab = 'residential' | 'general' | 'operations' | 'people' | 'advanced';

export function BuildingInspectorWindow({ entity, regionName, isForeign, freePeasantsCount, children }: {
  entity: GameEntity; regionName?: string; isForeign: boolean; freePeasantsCount: number;
  children: (tab: BuildingInspectorTab) => ReactNode;
}) {
  const { dict } = useTranslation();
  const blueprint = entity.buildingType ? BUILDING_BLUEPRINTS[entity.buildingType] : undefined;
  const housing = blueprint?.category === 'housing';
  const [tab, setTab] = useState<BuildingInspectorTab>(housing ? 'residential' : 'operations');
  const [pinned, setPinned] = useState(false);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const pinRef = useRef(false);
  const location = useRef({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const anchor = useRef<BuildingAnchor | null>(null);
  const reposition = useRef(() => {});
  const titleId = useId();
  const contentId = useId();
  const close = useGameStore(s => s.setSelectedEntityId);
  const setPinnedBuildingId = useGameStore(s => s.setPinnedBuildingId);
  const resources = useGameStore(s => s.resources);
  const upgradeHouseTier = useGameStore(s => s.upgradeHouseTier);
  const setBackyardExtension = useGameStore(s => s.setBackyardExtension);
  const assign = useGameStore(s => s.assignWorkerToBuilding);
  const remove = useGameStore(s => s.removeWorkerFromBuilding);
  const workers = entity.assignedWorkers ?? [];
  const slots = entity.workerSlots ?? blueprint?.workSlots ?? 0;
  const tabs: { id: BuildingInspectorTab; title: string }[] = [
    ...(housing ? [{ id: 'residential' as const, title: dict.inspector.tabResidential }] : []),
    ...(!housing ? [{ id: 'operations' as const, title: dict.inspector.tabOperations }] : []),
    { id: 'general', title: dict.inspector.tabGeneral },
    { id: 'people', title: dict.inspector.tabPeople },
    ...(!isForeign ? [{ id: 'advanced' as const, title: dict.inspector.tabAdvanced }] : []),
  ];

  useEffect(() => {
    const node = panel.current;
    if (!node) return;
    let width = node.offsetWidth, height = node.offsetHeight;
    const move = () => {
      const point = anchor.current;
      if (!point || point.entityId !== entity.id) {
        node.style.visibility = pinRef.current ? 'visible' : 'hidden';
        return;
      }
      node.style.visibility = 'visible';
      const next = pinRef.current ? {
        x: Math.max(12, Math.min(location.current.x, window.innerWidth - width - 12)),
        y: Math.max(12, Math.min(location.current.y, window.innerHeight - height - 70)),
      } : placeBuildingInspector(point.x, point.y, width, height, window.innerWidth, window.innerHeight);
      if (next.x !== location.current.x || next.y !== location.current.y) {
        location.current = next;
        node.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      }
    };
    reposition.current = move;
    const unsubscribe = subscribeBuildingAnchor(point => { anchor.current = point; move(); });
    const observer = new ResizeObserver(() => { width = node.offsetWidth; height = node.offsetHeight; move(); });
    observer.observe(node);
    window.addEventListener('resize', move);
    return () => { unsubscribe(); observer.disconnect(); window.removeEventListener('resize', move); reposition.current = () => {}; };
  }, [entity.id]);

  const togglePin = () => { pinRef.current = !pinRef.current; setPinned(pinRef.current); setPinnedBuildingId(pinRef.current ? entity.id : null); reposition.current(); };
  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, left: location.current.x, top: location.current.y };
    pinRef.current = true; setPinned(true); setPinnedBuildingId(entity.id);
  };
  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    location.current = { x: drag.current.left + event.clientX - drag.current.x, y: drag.current.top + event.clientY - drag.current.y };
    if (panel.current) panel.current.style.transform = `translate3d(${location.current.x}px, ${location.current.y}px, 0)`;
    reposition.current();
  };

  const canUpgrade = canUpgradeHouse(entity, resources, isForeign);
  const hasHouseUpgrade = (entity.buildingType === 'peasant_house' || entity.buildingType === 'manor') && (entity.houseTier || 1) < 3;
  const hasYard = entity.buildingType === 'peasant_house' || entity.buildingType === 'manor';
  const currentExtension = BACKYARD_EXTENSIONS_CONFIG[(entity.backyardExtension || 'none') as BackyardExtensionType];

  return (
    <aside ref={panel} className="building-inspector-window" role="dialog" aria-modal="false" aria-labelledby={titleId} style={{ visibility: 'hidden' }}>
      <header className="building-inspector-titlebar" onPointerDown={startDrag} onPointerMove={moveDrag}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <TownCenterIcon size={17} />
        <h2 id={titleId}>{entity.buildingType ? dict.buildings.items[entity.buildingType]?.name || entity.name : entity.name}</h2>
        <span className="building-inspector-region" title={regionName}>{regionName}</span>
        {!isForeign && <button type="button" className="building-inspector-demolish" title={entity.isDemolishing ? dict.inspector.cancelDemolish : dict.inspector.demolishBuilding}
          aria-label={entity.isDemolishing ? dict.inspector.cancelDemolish : dict.inspector.demolishBuilding}
          onClick={() => toggleBuildingDemolition(entity)}><IlluminatedIcon kind="demolish" size={16} /></button>}
        <button type="button" aria-label={pinned ? dict.inspector.followBuilding : dict.inspector.pinWindow}
          title={pinned ? dict.inspector.followBuilding : dict.inspector.pinWindow} aria-pressed={pinned} onClick={togglePin}>
          <IlluminatedIcon kind={pinned ? 'unpin' : 'pin'} size={15} />
        </button>
        <button type="button" disabled={pinned} title={pinned ? dict.inspector.unpinFirst : dict.common.close}
          aria-label={dict.inspector.closeBuildingWindow} onClick={() => close(null)}><CrossCloseIcon size={16} /></button>
      </header>
      {entity.buildingType && <div className={`building-inspector-art-wrap ${hasYard && !isForeign ? 'has-extension' : ''} ${hasHouseUpgrade && !isForeign ? 'has-upgrade-control' : ''}`}>
        <BuildingInspectorIllustration type={entity.buildingType} tier={entity.houseTier ?? 1} showSeal={!isForeign} />
        {hasHouseUpgrade && !isForeign && <button type="button"
          className={`building-inspector-seal building-inspector-upgrade-seal ${canUpgrade ? 'is-ready' : ''}`}
          disabled={!canUpgrade}
          title={canUpgrade ? dict.inspector.upgradeHomestead : dict.inspector.meetUpgradeRequirements}
          aria-label={dict.inspector.upgradeHomestead}
          onClick={() => { if (upgradeHouseTier(entity.id)) setExtensionOpen(false); }}>
          <HouseTierIcon size={26} />
        </button>}
        {hasYard && !isForeign && <div className="building-inspector-extension-control">
          <button type="button" className="building-inspector-extension-trigger" aria-expanded={extensionOpen}
            aria-label={dict.inspector.backyardExtensionLabel} onClick={() => setExtensionOpen(!extensionOpen)}>
            <BackyardExtensionIcon kind={currentExtension.type} size={22} /><span>{entity.backyardExtension && entity.backyardExtension !== 'none' ? dict.housing.extensions[currentExtension.type]?.name : dict.inspector.chooseExtension}</span><IlluminatedIcon kind="chevron" size={15} />
          </button>
          {extensionOpen && <div className="building-inspector-extension-menu">
            {(Object.keys(BACKYARD_EXTENSIONS_CONFIG) as BackyardExtensionType[]).map(key => {
              const config = BACKYARD_EXTENSIONS_CONFIG[key];
              const enabled = !isForeign && entity.isCompleted && !entity.pendingHouseTier && !entity.pendingBackyardExtension &&
                (entity.houseTier || 1) >= config.requiredTier && Object.entries(config.cost).every(([res, amount]) => (resources[res as keyof ResourceInventory] || 0) >= (amount || 0));
              const name = dict.housing.extensions[key]?.name || key;
              const cost = Object.entries(config.cost).map(([res, amount]) => `${amount} ${dict.resources[res as keyof ResourceInventory] || res}`).join(', ');
              return <button type="button" key={key} disabled={!enabled || entity.backyardExtension === key}
                className={entity.backyardExtension === key ? 'selected' : ''}
                aria-label={name}
                aria-pressed={entity.backyardExtension === key}
                data-game-tooltip={`${name}. ${dict.housing.extensions[key]?.description || ''} · ${dict.inspector.tierLabel} ${config.requiredTier} · ${dict.buildings.cost}: ${cost || dict.roads.cost}`}
                onClick={() => { if (setBackyardExtension(entity.id, key)) setExtensionOpen(false); }}>
                <BackyardExtensionIcon kind={key} size={42} />
              </button>;
            })}
          </div>}
        </div>}
      </div>}
      <nav className="building-inspector-tabs" role="tablist" aria-label={dict.inspector.buildingInfo}>
        {tabs.map((item, index) => <button key={item.id} type="button" role="tab" id={`${contentId}-${item.id}`} aria-selected={tab === item.id}
          aria-controls={contentId} tabIndex={tab === item.id ? 0 : -1} onClick={() => { setTab(item.id); setExtensionOpen(false); }} onKeyDown={event => {
            const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
            if (next < 0) return;
            event.preventDefault(); setTab(tabs[next].id);
            (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
          }}>{item.title}</button>)}
      </nav>
      <div className="building-inspector-scroll custom-scrollbar" id={contentId} role="tabpanel" aria-labelledby={`${contentId}-${tab}`}>
        {tab === 'operations' && slots > 0 && entity.isCompleted && <div className="building-inspector-workforce">
          <button type="button" className="workforce-adjust" disabled={isForeign || !workers.length} aria-label={dict.inspector.removeWorker}
            onClick={() => remove(entity.id, workers[workers.length - 1])}><IlluminatedIcon kind="minus" size={20} /></button>
          <button type="button" className="workforce-slots" onClick={() => setTab('people')} title={dict.buildings.workers}>
            {Array.from({ length: Math.min(slots, 8) }, (_, i) => <span key={i} className={i < workers.length ? 'occupied' : ''}><PeasantsIcon size={23} /></span>)}
            <small>{workers.length} / {slots}</small>
          </button>
          <button type="button" className="workforce-adjust" disabled={isForeign || workers.length >= slots || freePeasantsCount === 0}
            aria-label={dict.inspector.assignWorker} onClick={() => assign(entity.id)}><IlluminatedIcon kind="plus" size={20} /></button>
        </div>}
        {children(tab)}
      </div>
      <footer className="building-inspector-footer"><span>{entity.name}</span><span>{entity.buildingType === 'peasant_house' ? `${dict.inspector.tierLabel} ${entity.houseTier || 1}` : blueprint?.category ? dict.inspector.settlementCategory : ''}</span></footer>
    </aside>
  );
}
