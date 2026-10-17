export type TerrainTextureType = 'grass' | 'mud' | 'stone' | 'water';

export const TERRAIN_TEXTURES: Record<TerrainTextureType, { path: string; repeat: number }> = {
  grass: { path: 'assets/terrain/grass.png', repeat: 16 },
  mud: { path: 'assets/terrain/mud.png', repeat: 16 },
  stone: { path: 'assets/terrain/stone.png', repeat: 20 },
  water: { path: 'assets/terrain/water.png', repeat: 12 },
};

export const TEXTURE_ANISOTROPY = 8;

export function resolveAssetPath(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
