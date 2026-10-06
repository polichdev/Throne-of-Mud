import * as THREE from 'three';

export class AssetLoader {
  private static instance: AssetLoader;
  private textureLoader = new THREE.TextureLoader();
  private cache = new Map<string, THREE.Texture>();

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  public load(path: string): THREE.Texture {
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    const texture = this.textureLoader.load(path);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 8;

    this.cache.set(path, texture);
    return texture;
  }

  public getTerrainTexture(type: 'grass' | 'mud' | 'stone' | 'water'): THREE.Texture {
    const tex = this.load(`/assets/terrain/${type}.png`);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
}

export const assetLoader = AssetLoader.getInstance();
