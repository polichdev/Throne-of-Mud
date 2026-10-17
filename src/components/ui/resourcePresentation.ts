import type { ResourceInventory } from '../../types/game';
import type { IlluminatedIconKind } from './icons';
import { translations, type SupportedLanguage } from '../../i18n';

export const RESOURCE_ICONS: Record<keyof ResourceInventory, IlluminatedIconKind> = {
  wood: 'wood',
  stone: 'stone',
  wheat: 'wheat',
  flour: 'flour',
  bread: 'bread',
  ale: 'ale',
  gold: 'gold',
  weapons: 'weapons',
  fish: 'fish',
  berries: 'berry',
  iron: 'iron',
  clay: 'clay',
  salt: 'salt',
  meat: 'meat',
  hides: 'hides',
  vegetables: 'vegetables',
  eggs: 'eggs',
  iron_ore: 'iron_ore',
  coal: 'coal',
  cut_stone: 'cut_stone',
  clay_bricks: 'brick',
  planks: 'planks',
  clothes: 'clothes',
};

export const RESOURCE_UI = new Proxy({} as Record<keyof ResourceInventory, { uk: string; en: string; icon: IlluminatedIconKind }>, {
  get: (_, prop: string) => {
    const key = prop as keyof ResourceInventory;
    return {
      uk: translations.uk.resources[key] || key,
      en: translations.en.resources[key] || key,
      icon: RESOURCE_ICONS[key] || 'materials',
    };
  },
});

export function getResourceName(key: keyof ResourceInventory, lang: SupportedLanguage): string {
  return translations[lang]?.resources[key] || key;
}
