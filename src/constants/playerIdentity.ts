import type { PlayerIdentity } from '../types/game';

export const DEFAULT_PLAYER_IDENTITY: PlayerIdentity = {
  rulerName: 'Болеслав',
  kingdomName: 'Кенігсвеґ',
  portraitId: 0,
  shieldColor: '#723b31',
  emblemId: 'crown',
};

export const SHIELD_COLORS = ['#723b31', '#294453', '#526037', '#755d31', '#51416a', '#343d42'];

export const HERALDRY_EMBLEMS = [
  { id: 'crown', glyph: '♛', nameUk: 'Корона', nameEn: 'Crown' },
  { id: 'cross', glyph: '✠', nameUk: 'Хрест', nameEn: 'Cross' },
  { id: 'swords', glyph: '⚔', nameUk: 'Мечі', nameEn: 'Swords' },
  { id: 'tree', glyph: '♣', nameUk: 'Дерево', nameEn: 'Tree' },
  { id: 'sun', glyph: '☼', nameUk: 'Сонце', nameEn: 'Sun' },
  { id: 'castle', glyph: '♜', nameUk: 'Фортеця', nameEn: 'Castle' },
] as const;

export function getHeraldryGlyph(emblemId: string): string {
  return HERALDRY_EMBLEMS.find((emblem) => emblem.id === emblemId)?.glyph ?? '♛';
}
