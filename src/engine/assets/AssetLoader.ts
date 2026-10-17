import * as THREE from 'three';
import { TERRAIN_TEXTURES, TEXTURE_ANISOTROPY, resolveAssetPath, type TerrainTextureType } from '../../constants/assets';

type TextureEntry = {
  texture: THREE.Texture;
  status: 'pending' | 'ready' | 'error';
  promise: Promise<void>;
  error?: Error;
};

export class AssetLoader {
  private static instance: AssetLoader;
  private textureLoader = new THREE.TextureLoader();
  private cache = new Map<string, TextureEntry>();

  public static getInstance(): AssetLoader {
    return AssetLoader.instance ??= new AssetLoader();
  }

  private entry(path: string): TextureEntry {
    const url = resolveAssetPath(path);
    const cached = this.cache.get(url);
    if (cached) return cached;
    let settle!: () => void;
    const promise = new Promise<void>((resolve) => { settle = resolve; });
    const entry = { status: 'pending', promise } as TextureEntry;
    entry.texture = this.textureLoader.load(url, () => {
      entry.status = 'ready';
      settle();
    }, undefined, () => {
      entry.status = 'error';
      entry.error = new Error('Failed to load texture: ' + url);
      settle();
    });
    entry.texture.minFilter = THREE.LinearMipmapLinearFilter;
    entry.texture.magFilter = THREE.LinearFilter;
    entry.texture.generateMipmaps = true;
    entry.texture.anisotropy = TEXTURE_ANISOTROPY;
    this.cache.set(url, entry);
    return entry;
  }

  public readTerrainTextures(): Record<TerrainTextureType, THREE.Texture> {
    const types = Object.keys(TERRAIN_TEXTURES) as TerrainTextureType[];
    const entries = types.map(type => this.entry(TERRAIN_TEXTURES[type].path));
    const failed = entries.find(entry => entry.status === 'error');
    if (failed) throw failed.error;
    const pending = entries.filter(entry => entry.status === 'pending');
    if (pending.length) throw Promise.all(pending.map(entry => entry.promise));
    return Object.fromEntries(types.map((type, index) => {
      const texture = entries[index].texture;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.setScalar(TERRAIN_TEXTURES[type].repeat);
      return [type, texture];
    })) as Record<TerrainTextureType, THREE.Texture>;
  }

  public dispose(): void {
    for (const entry of this.cache.values()) entry.texture.dispose();
    this.cache.clear();
  }

  public retryFailed(): void {
    for (const [url, entry] of this.cache) {
      if (entry.status !== 'error') continue;
      entry.texture.dispose();
      this.cache.delete(url);
    }
  }
}

export const assetLoader = AssetLoader.getInstance();
if (import.meta.hot) import.meta.hot.dispose(() => assetLoader.dispose());
