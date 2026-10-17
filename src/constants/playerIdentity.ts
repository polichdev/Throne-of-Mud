import type { PlayerIdentity } from '../types/game';

export const DEFAULT_PLAYER_RULER_NAME = 'Boleslav';
export const DEFAULT_PLAYER_KINGDOM_NAME = 'Koenigsveg';
export const DEFAULT_PORTRAIT_ID = 0;
export const DEFAULT_SHIELD_COLOR = '#723b31';
export const DEFAULT_EMBLEM_ID = 'crown';

export const DEFAULT_PLAYER_IDENTITY: PlayerIdentity = {
  rulerName: DEFAULT_PLAYER_RULER_NAME,
  kingdomName: DEFAULT_PLAYER_KINGDOM_NAME,
  portraitId: DEFAULT_PORTRAIT_ID,
  shieldColor: DEFAULT_SHIELD_COLOR,
  emblemId: DEFAULT_EMBLEM_ID,
};

export const SHIELD_COLORS = ['#723b31', '#294453', '#526037', '#755d31', '#51416a', '#343d42'];

export const HERALDRY_EMBLEMS = [
  { id: 'crown', glyph: '♛' },
  { id: 'cross', glyph: '✠' },
  { id: 'swords', glyph: '⚔' },
  { id: 'tree', glyph: '♣' },
  { id: 'sun', glyph: '☼' },
  { id: 'castle', glyph: '♜' },
] as const;

export function getHeraldryGlyph(emblemId: string): string {
  return HERALDRY_EMBLEMS.find((emblem) => emblem.id === emblemId)?.glyph ?? '♛';
}
