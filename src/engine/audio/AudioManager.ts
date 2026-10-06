import * as THREE from 'three';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  uiVolume: number;
  isMuted: boolean;
}

export interface AreaMetrics {
  villageDensity: number;
  forestDensity: number;
  waterProximity: number;
  campfireProximity: number;
  zoom: number;
  camX: number;
  camZ: number;
}

if (typeof window !== 'undefined') {
  const win = window as any;
  if (win.__throneAudioContext) {
    try { win.__throneAudioContext.close(); } catch (_) {}
    win.__throneAudioContext = null;
  }
}

const AUDIO_SETTINGS_STORAGE_KEY = 'throne_of_mud_audio_settings';

function loadSavedAudioSettings(): AudioSettings {
  const defaultSettings: AudioSettings = {
    masterVolume: 0.7,
    musicVolume: 0.6,
    ambientVolume: 0.65,
    sfxVolume: 0.8,
    uiVolume: 0.6,
    isMuted: false,
  };
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        masterVolume: typeof parsed.masterVolume === 'number' ? parsed.masterVolume : defaultSettings.masterVolume,
        musicVolume: typeof parsed.musicVolume === 'number' ? parsed.musicVolume : defaultSettings.musicVolume,
        ambientVolume: typeof parsed.ambientVolume === 'number' ? parsed.ambientVolume : defaultSettings.ambientVolume,
        sfxVolume: typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : defaultSettings.sfxVolume,
        uiVolume: typeof parsed.uiVolume === 'number' ? parsed.uiVolume : defaultSettings.uiVolume,
        isMuted: Boolean(parsed.isMuted),
      };
    }
  } catch (e) {
    console.warn('Failed to read saved audio settings:', e);
  }
  return defaultSettings;
}

function saveAudioSettings(settings: AudioSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save audio settings:', e);
  }
}

class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;
  private threeListener: THREE.AudioListener | null = null;

  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private forestGain: GainNode | null = null;
  private villageAreaGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private uiGain: GainNode | null = null;
  private villageProximityGain: GainNode | null = null;

  private reverbInput: GainNode | null = null;
  private reverbOutput: GainNode | null = null;

  private bufferCache = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>();

  private musicMode: 'menu' | 'game' | 'off' = 'menu';
  private musicAudio: HTMLAudioElement | null = null;
  private musicSourceNode: MediaElementAudioSourceNode | null = null;
  private inGameTrackIdx = 0;
  private isMusicPlaying = false;

  private currentCamX = 52;
  private currentCamZ = 52;
  private currentZoom = 38;
  private zoomFactor = 0;
  private villageDensity = 0;
  private forestDensity = 0.5;
  private waterProximity = 0;

  private faunaTimer: number | null = null;
  private villageMurmurTimer: number | null = null;
  private campfireNode: AudioBufferSourceNode | null = null;
  private campfireGain: GainNode | null = null;
  private lastFootstepTime = 0;
  private footstepIndex = 0;
  private lastVocalTime = 0;

  private currentSeason = 'Spring';
  private currentWeather = 'clear';
  private isNightTime = false;
  private rainNode: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private settings: AudioSettings = loadSavedAudioSettings();
  private isUnlocked = false;

  private constructor() {
    this.setupUnlockListeners();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public unlockAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.isUnlocked = true;
    this.startMusic();
  }

  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.unlockAudio();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
  }

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    if (typeof window !== 'undefined') {
      (window as any).__throneAudioContext = this.ctx;
    }

    const now = this.ctx.currentTime;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.settings.isMuted ? 0 : this.settings.masterVolume, now);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.settings.musicVolume, now);
    this.musicGain.connect(this.masterGain);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.settings.ambientVolume, now);
    this.ambientGain.connect(this.masterGain);

    this.forestGain = this.ctx.createGain();
    this.forestGain.gain.setValueAtTime(0.7, now);
    this.forestGain.connect(this.ambientGain);

    this.villageAreaGain = this.ctx.createGain();
    this.villageAreaGain.gain.setValueAtTime(0.3, now);
    this.villageAreaGain.connect(this.ambientGain);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0, now);
    this.waterGain.connect(this.ambientGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, now);
    this.sfxGain.connect(this.masterGain);

    this.villageProximityGain = this.ctx.createGain();
    this.villageProximityGain.gain.setValueAtTime(0, now);
    this.villageProximityGain.connect(this.sfxGain);

    this.uiGain = this.ctx.createGain();
    this.uiGain.gain.setValueAtTime(this.settings.uiVolume, now);
    this.uiGain.connect(this.masterGain);

    window.setTimeout(() => {
      this.createNoiseBuffer();
      window.setTimeout(() => {
        this.createReverbBus();
        this.createRainNodes();
      }, 50);
    }, 50);

    window.setTimeout(() => this.preloadAudioAssets(), 300);

    this.startAmbienceSchedulers();
  }

  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        if (!this.ctx) return null;
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.bufferCache.set(url, audioBuffer);
        return audioBuffer;
      } catch (err) {
        console.warn('Failed to load audio asset:', url, err);
        return null;
      } finally {
        this.loadingPromises.delete(url);
      }
    })();

    this.loadingPromises.set(url, promise);
    return promise;
  }

  private preloadAudioAssets() {
    const assets = [
      '/audio/sfx/step_0.ogg',
      '/audio/sfx/step_1.ogg',
      '/audio/sfx/step_2.ogg',
      '/audio/sfx/step_3.ogg',
      '/audio/sfx/step_4.ogg',
      '/audio/sfx/step_5.ogg',
      '/audio/sfx/step_6.ogg',
      '/audio/sfx/step_7.ogg',
      '/audio/sfx/building_place.ogg',
      '/audio/sfx/woodchop.ogg',
      '/audio/sfx/tree_fall.ogg',
      '/audio/sfx/mining.ogg',
      '/audio/voices/hello.ogg',
      '/audio/voices/good_day.ogg',
      '/audio/voices/good_morning.ogg',
      '/audio/voices/morning.ogg',
      '/audio/voices/welcome.ogg',
      '/audio/voices/yes.ogg',
      '/audio/voices/right.ogg',
      '/audio/voices/work.ogg',
      '/audio/voices/good.ogg',
      '/audio/ambience/birds1.ogg',
      '/audio/ambience/birds2.ogg',
      '/audio/ambience/birds3.ogg',
      '/audio/ambience/morning.ogg',
      '/audio/ambience/night.ogg',
      '/audio/ambience/campfire.ogg',
    ];

    let idx = 0;
    const loadNext = () => {
      if (idx >= assets.length) return;
      const url = assets[idx++];
      this.loadBuffer(url).finally(() => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => loadNext(), { timeout: 1000 });
        } else {
          window.setTimeout(loadNext, 120);
        }
      });
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => loadNext(), { timeout: 1000 });
    } else {
      window.setTimeout(loadNext, 500);
    }
  }

  private cleanupOnEnd(
    source: AudioScheduledSourceNode,
    nodes: (AudioNode | null | undefined)[],
    fallbackSec = 0.5
  ): void {
    let cleaned = false;
    const doCleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try { source.disconnect(); } catch (_) {}
      for (const n of nodes) {
        if (n) {
          try { n.disconnect(); } catch (_) {}
        }
      }
    };
    source.onended = doCleanup;
    window.setTimeout(doCleanup, Math.max(100, fallbackSec * 1000));
  }

  private playBufferNode(
    buffer: AudioBuffer,
    destGain: GainNode,
    options?: {
      volume?: number;
      playbackRate?: number;
      cutoff?: number;
      delay?: number;
      loop?: boolean;
    }
  ): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    const now = this.ctx.currentTime + (options?.delay ?? 0);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = options?.playbackRate ?? 1.0;
    if (options?.loop) source.loop = true;

    const gain = this.ctx.createGain();
    const vol = options?.volume ?? 1.0;
    gain.gain.setValueAtTime(vol, now);

    let filter: BiquadFilterNode | null = null;
    if (options?.cutoff && options.cutoff < 7900) {
      filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(options.cutoff, now);
      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }

    gain.connect(destGain);
    source.start(now);

    if (!options?.loop) {
      const duration = buffer.duration / (options?.playbackRate || 1.0) + (options?.delay || 0);
      this.cleanupOnEnd(source, [filter, gain], duration + 0.2);
    }

    return source;
  }

  public setCameraListener(listener: THREE.AudioListener) {
    this.threeListener = listener;
  }

  public getCameraListener(): THREE.AudioListener | null {
    return this.threeListener;
  }

  public createPositionalAudio(refDistance = 12, maxDistance = 50): THREE.PositionalAudio | null {
    if (!this.threeListener) return null;
    const sound = new THREE.PositionalAudio(this.threeListener);
    sound.setRefDistance(refDistance);
    sound.setMaxDistance(maxDistance);
    sound.setRolloffFactor(1.4);
    sound.setDistanceModel('exponential');
    return sound;
  }

  public getSpatialAtten(worldX?: number, worldZ?: number): { volume: number; cutoff: number } {
    if (worldX === undefined || worldZ === undefined) {
      return { volume: Math.max(0.15, this.zoomFactor), cutoff: 8000 };
    }
    const dx = worldX - this.currentCamX;
    const dz = worldZ - this.currentCamZ;
    const dist = Math.hypot(dx, dz);

    const maxAudibleDist = 48.0;
    if (dist > maxAudibleDist) {
      return { volume: 0, cutoff: 200 };
    }

    const distFactor = Math.max(0, 1.0 - dist / maxAudibleDist);
    const zoomInfluence = this.zoomFactor;
    const volume = Math.min(1.0, distFactor * distFactor * (0.05 + 0.95 * zoomInfluence));
    const cutoff = Math.max(300, Math.min(8000, 8000 * distFactor));

    return { volume, cutoff };
  }

  public setMusicMode(mode: 'menu' | 'game' | 'off') {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    if (this.isUnlocked) {
      this.startMusic();
    }
  }

  public getMusicMode(): 'menu' | 'game' | 'off' {
    return this.musicMode;
  }

  private initMusicAudioElement() {
    if (this.musicAudio) return;
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    audio.addEventListener('ended', () => {
      if (this.musicMode === 'game') {
        this.inGameTrackIdx = (this.inGameTrackIdx + 1) % 2;
        window.setTimeout(() => {
          if (this.musicMode === 'game') {
            const nextTrack = this.inGameTrackIdx === 0
              ? '/audio/music/game_peaceful.ogg'
              : '/audio/music/game_nature.ogg';
            this.playMusicTrack(nextTrack, false);
          }
        }, 12000);
      }
    });

    this.musicAudio = audio;

    if (this.ctx && this.musicGain) {
      try {
        this.musicSourceNode = this.ctx.createMediaElementSource(audio);
        this.musicSourceNode.connect(this.musicGain);
      } catch (err) {
        console.warn('MediaElementSource error (falling back to direct element volume):', err);
      }
    }
  }

  private startMusic() {
    this.initMusicAudioElement();
    if (!this.musicAudio) return;

    if (this.musicMode === 'off') {
      this.musicAudio.pause();
      this.isMusicPlaying = false;
      return;
    }

    if (this.musicMode === 'menu') {
      this.playMusicTrack('/audio/music/menu.ogg', true);
    } else if (this.musicMode === 'game') {
      const track = this.inGameTrackIdx === 0
        ? '/audio/music/game_peaceful.ogg'
        : '/audio/music/game_nature.ogg';
      this.playMusicTrack(track, false);
    }
  }

  private playMusicTrack(url: string, loop: boolean) {
    if (!this.musicAudio) return;
    this.musicAudio.loop = loop;
    if (this.musicAudio.src !== window.location.origin + url && !this.musicAudio.src.endsWith(url)) {
      this.musicAudio.src = url;
    }
    if (!this.musicSourceNode) {
      this.musicAudio.volume = this.settings.isMuted ? 0 : this.settings.masterVolume * this.settings.musicVolume;
    }
    this.musicAudio.play().then(() => {
      this.isMusicPlaying = true;
    }).catch((err) => {
      console.warn('Music play deferred until interaction:', err.message);
    });
  }

  public updateAreaAmbience(metrics: AreaMetrics) {
    this.currentCamX = metrics.camX;
    this.currentCamZ = metrics.camZ;
    this.currentZoom = metrics.zoom;
    this.villageDensity = Math.max(0, Math.min(1, metrics.villageDensity));
    this.forestDensity = Math.max(0, Math.min(1, metrics.forestDensity));
    this.waterProximity = Math.max(0, Math.min(1, metrics.waterProximity));

    if (metrics.zoom <= 28) {
      this.zoomFactor = 0.0;
    } else if (metrics.zoom >= 55) {
      this.zoomFactor = 1.0;
    } else {
      this.zoomFactor = (metrics.zoom - 28) / 27;
    }

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const rampTime = 0.35;

    if (this.villageAreaGain) {
      const targetVillage = (!this.settings.isMuted)
        ? (this.villageDensity * (0.4 + 0.6 * this.zoomFactor)) * this.settings.ambientVolume
        : 0;
      this.villageAreaGain.gain.cancelScheduledValues(now);
      this.villageAreaGain.gain.linearRampToValueAtTime(targetVillage, now + rampTime);
    }

    if (this.forestGain) {
      const targetForest = (!this.settings.isMuted)
        ? (Math.max(0.25, this.forestDensity * (1.0 - this.villageDensity * 0.7))) * this.settings.ambientVolume
        : 0;
      this.forestGain.gain.cancelScheduledValues(now);
      this.forestGain.gain.linearRampToValueAtTime(targetForest, now + rampTime);
    }

    if (this.waterGain) {
      const targetWater = (!this.settings.isMuted)
        ? (this.waterProximity * 0.6) * this.settings.ambientVolume
        : 0;
      this.waterGain.gain.cancelScheduledValues(now);
      this.waterGain.gain.linearRampToValueAtTime(targetWater, now + rampTime);
    }

    if (this.villageProximityGain) {
      const targetProx = (!this.settings.isMuted)
        ? (this.zoomFactor * this.settings.sfxVolume)
        : 0;
      this.villageProximityGain.gain.cancelScheduledValues(now);
      this.villageProximityGain.gain.linearRampToValueAtTime(targetProx, now + 0.15);
    }

    if (this.campfireGain) {
      const campfireVol = (!this.settings.isMuted && metrics.campfireProximity > 0.001)
        ? metrics.campfireProximity * 0.15 * this.settings.ambientVolume
        : 0.0;
      this.campfireGain.gain.cancelScheduledValues(now);
      this.campfireGain.gain.linearRampToValueAtTime(campfireVol, now + rampTime);
    }
  }

  private startAmbienceSchedulers() {
    const birdLoop = () => {
      if (this.ctx && this.isUnlocked && !this.settings.isMuted && this.settings.ambientVolume > 0.001) {
        if (!this.isNightTime && this.currentWeather !== 'storm' && this.forestDensity > 0.15) {
          this.playRealBird();
        }
      }
      const nextDelay = 10000 + Math.random() * 18000;
      this.faunaTimer = window.setTimeout(birdLoop, nextDelay);
    };
    this.faunaTimer = window.setTimeout(birdLoop, 15000);

    this.loadBuffer('/audio/ambience/campfire.ogg').then((buf) => {
      if (!buf || !this.ctx || !this.villageProximityGain) return;
      this.campfireGain = this.ctx.createGain();
      this.campfireGain.gain.value = 0;
      this.campfireGain.connect(this.villageProximityGain);

      this.campfireNode = this.ctx.createBufferSource();
      this.campfireNode.buffer = buf;
      this.campfireNode.loop = true;
      this.campfireNode.connect(this.campfireGain);
      this.campfireNode.start();
    });
  }

  private playRealBird() {
    if (!this.ctx || !this.forestGain || this.settings.isMuted) return;
    const birdFiles = [
      '/audio/ambience/birds1.ogg',
      '/audio/ambience/birds2.ogg',
      '/audio/ambience/birds3.ogg',
      '/audio/ambience/morning.ogg',
    ];
    const file = birdFiles[Math.floor(Math.random() * birdFiles.length)];
    const buf = this.bufferCache.get(file);

    if (buf) {
      const pitchVar = 0.94 + Math.random() * 0.12;
      const vol = (0.28 + Math.random() * 0.15) * this.settings.ambientVolume;
      this.playBufferNode(buf, this.forestGain, {
        volume: vol,
        playbackRate: pitchVar,
      });
    } else {
      this.loadBuffer(file);
    }
  }

  public playWoodChop(worldX?: number, worldZ?: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;

    const { volume, cutoff } = this.getSpatialAtten(worldX, worldZ);
    if (volume <= 0.005) return;

    const pitchVar = 0.88 + Math.random() * 0.24;
    const volVar = 0.85 + Math.random() * 0.30;
    const microDelay = Math.random() * 0.02;

    const buf = this.bufferCache.get('/audio/sfx/woodchop.ogg');
    if (buf) {
      this.playBufferNode(buf, this.sfxGain, {
        volume: 0.95 * volume * volVar,
        playbackRate: pitchVar,
        cutoff,
        delay: microDelay,
      });
    } else {
      this.loadBuffer('/audio/sfx/woodchop.ogg');
    }
  }

  public playBuildingPlace(worldX?: number, worldZ?: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;

    const { volume, cutoff } = this.getSpatialAtten(worldX, worldZ);
    if (volume <= 0.005) return;

    const pitchVar = 0.90 + Math.random() * 0.20;
    const buf = this.bufferCache.get('/audio/sfx/building_place.ogg');
    if (buf) {
      this.playBufferNode(buf, this.sfxGain, {
        volume: 0.85 * volume,
        playbackRate: pitchVar,
        cutoff,
      });
    } else {
      this.loadBuffer('/audio/sfx/building_place.ogg');
    }
  }

  public playTreeFall(worldX?: number, worldZ?: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;

    const { volume, cutoff } = this.getSpatialAtten(worldX, worldZ);
    if (volume <= 0.005) return;

    const pitchVar = 0.90 + Math.random() * 0.20;
    const buf = this.bufferCache.get('/audio/sfx/tree_fall.ogg');
    if (buf) {
      this.playBufferNode(buf, this.sfxGain, {
        volume: 0.90 * volume,
        playbackRate: pitchVar,
        cutoff,
        delay: 0.2,
      });
    } else {
      this.loadBuffer('/audio/sfx/tree_fall.ogg');
    }
  }

  public playStoneMine(worldX?: number, worldZ?: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;

    const { volume, cutoff } = this.getSpatialAtten(worldX, worldZ);
    if (volume <= 0.005) return;

    const pitchVar = 0.88 + Math.random() * 0.24;
    const buf = this.bufferCache.get('/audio/sfx/mining.ogg');
    if (buf) {
      this.playBufferNode(buf, this.sfxGain, {
        volume: 0.80 * volume,
        playbackRate: pitchVar,
        cutoff,
      });
    } else {
      this.loadBuffer('/audio/sfx/mining.ogg');
    }
  }

  public playRoadDraw() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const buf = this.bufferCache.get('/audio/sfx/building_place.ogg');
    if (buf) {
      this.playBufferNode(buf, this.sfxGain, { volume: 0.35, playbackRate: 1.4 });
    }
  }

  public playDemolish() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    const buf = this.bufferCache.get('/audio/sfx/tree_fall.ogg');
    if (buf) {
      this.playBufferNode(buf, this.sfxGain, { volume: 0.65, playbackRate: 1.2 });
    }
  }

  public playRoadErase() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.settings.isMuted || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 320;
    filter.Q.value = 1.4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28 * this.settings.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.18);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
    src.stop(now + 0.18);
  }

  public playPeasantFootstep(worldX?: number, worldZ?: number) {
    this.initContext();
    if (!this.ctx || !this.villageProximityGain || this.settings.isMuted) return;

    const now = performance.now();
    if (now - this.lastFootstepTime < 160) return;
    this.lastFootstepTime = now;

    const { volume, cutoff } = this.getSpatialAtten(worldX, worldZ);
    if (volume <= 0.02 || this.zoomFactor <= 0.12) return;

    const stepIdx = this.footstepIndex % 8;
    this.footstepIndex++;
    const file = `/audio/sfx/step_${stepIdx}.ogg`;
    const buf = this.bufferCache.get(file);

    const pitchVar = 0.88 + Math.random() * 0.24;
    const vol = (0.035 + Math.random() * 0.030) * volume * this.settings.sfxVolume;

    if (buf) {
      this.playBufferNode(buf, this.villageProximityGain, {
        volume: vol,
        playbackRate: pitchVar,
        cutoff: Math.min(cutoff, 900),
      });
    } else {
      this.loadBuffer(file);
    }
  }

  public playPeasantVocal(worldX?: number, worldZ?: number, type: 'greet' | 'work' | 'mood' | 'alert' = 'greet') {
    this.initContext();
    if (!this.ctx || !this.villageProximityGain || this.settings.isMuted) return;

    const now = performance.now();
    if (now - this.lastVocalTime < 1200) return;
    this.lastVocalTime = now;

    const { volume } = this.getSpatialAtten(worldX, worldZ);
    if (volume <= 0.015 || this.zoomFactor <= 0.10) return;

    const audioNow = this.ctx.currentTime;
    const vol = (0.55 + Math.random() * 0.25) * volume * this.settings.sfxVolume;
    const basePitch = type === 'alert' ? 260 : (180 + Math.random() * 80);

    const phrases: Array<{ freqs: number[]; dur: number }> = type === 'work'
      ? [
        { freqs: [basePitch, basePitch * 1.05, basePitch * 0.92], dur: 0.28 },
        { freqs: [basePitch * 1.1, basePitch * 0.95], dur: 0.22 },
      ]
      : type === 'alert'
      ? [{ freqs: [basePitch * 1.2, basePitch * 0.85, basePitch * 1.1], dur: 0.35 }]
      : [
        { freqs: [basePitch, basePitch * 1.08, basePitch * 0.88, basePitch * 0.95], dur: 0.38 },
        { freqs: [basePitch * 1.05, basePitch * 0.9, basePitch * 1.02], dur: 0.30 },
        { freqs: [basePitch * 0.95, basePitch * 1.12, basePitch * 0.85], dur: 0.34 },
      ];

    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const totalDur = phrase.dur;
    const segDur = totalDur / phrase.freqs.length;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(phrase.freqs[0], audioNow);
    phrase.freqs.forEach((f, i) => {
      osc1.frequency.linearRampToValueAtTime(f, audioNow + segDur * (i + 1));
    });

    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 480 + Math.random() * 120; f1.Q.value = 3.5;
    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass'; f2.frequency.value = 1400 + Math.random() * 300; f2.Q.value = 4.5;

    const envGain = this.ctx.createGain();
    envGain.gain.setValueAtTime(0, audioNow);
    envGain.gain.linearRampToValueAtTime(vol, audioNow + 0.025);
    envGain.gain.setValueAtTime(vol, audioNow + totalDur - 0.06);
    envGain.gain.linearRampToValueAtTime(0, audioNow + totalDur);

    const f1Gain = this.ctx.createGain(); f1Gain.gain.value = 0.7;
    const f2Gain = this.ctx.createGain(); f2Gain.gain.value = 0.45;
    osc1.connect(f1); f1.connect(f1Gain); f1Gain.connect(envGain);
    osc1.connect(f2); f2.connect(f2Gain); f2Gain.connect(envGain);

    if (this.noiseBuffer) {
      const breathSrc = this.ctx.createBufferSource();
      breathSrc.buffer = this.noiseBuffer;
      const breathGain = this.ctx.createGain();
      breathGain.gain.setValueAtTime(0.06 * vol, audioNow);
      breathGain.gain.linearRampToValueAtTime(0, audioNow + totalDur);
      breathSrc.connect(breathGain);
      breathGain.connect(envGain);
      breathSrc.start(audioNow);
      breathSrc.stop(audioNow + totalDur);
    }

    if (this.villageProximityGain) envGain.connect(this.villageProximityGain);
    osc1.start(audioNow);
    osc1.stop(audioNow + totalDur);

    this.cleanupOnEnd(osc1, [f1, f2, f1Gain, f2Gain, envGain], totalDur + 0.1);
  }

  public playUIClick() {
    this.initContext();
    if (!this.ctx || !this.uiGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.038);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.048);

    this.cleanupOnEnd(osc, [filter, gain], 0.08);
  }

  public playUIHover() {
    this.initContext();
    if (!this.ctx || !this.uiGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 390;

    gain.gain.setValueAtTime(0.022, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.022);

    this.cleanupOnEnd(osc, [gain], 0.05);
  }

  public playUIError() {
    this.initContext();
    if (!this.ctx || !this.uiGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.11);

    filter.type = 'lowpass';
    filter.frequency.value = 240;

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.14);

    this.cleanupOnEnd(osc, [filter, gain], 0.18);
  }

  public playUIPanelOpen() {
    this.initContext();
    if (!this.ctx || !this.uiGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.10);

    this.cleanupOnEnd(osc, [gain], 0.14);
  }

  public playUIPanelClose() {
    this.initContext();
    if (!this.ctx || !this.uiGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(290, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.07);

    gain.gain.setValueAtTime(0.10, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.09);

    this.cleanupOnEnd(osc, [gain], 0.14);
  }

  public playUISuccess() {
    this.initContext();
    if (!this.ctx || !this.uiGain || this.settings.isMuted) return;
    const buf = this.bufferCache.get('/audio/ui/success.ogg');
    if (buf) {
      this.playBufferNode(buf, this.uiGain, { volume: 0.38 });
    } else {
      this.loadBuffer('/audio/ui/success.ogg');
    }
  }

  public playBuildingThud2D() {
    this.initContext();
    if (!this.ctx || !this.uiGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.15);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.18);

    this.cleanupOnEnd(osc, [gain], 0.22);
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const length = sr * 4;
    const buf = this.ctx.createBuffer(2, length, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.06;
        b6 = w * 0.115926;
      }
    }
    this.noiseBuffer = buf;
  }

  private createReverbBus() {
    if (!this.ctx || !this.ambientGain) return;
    const ctx = this.ctx;
    this.reverbInput = ctx.createGain();
    this.reverbInput.gain.value = 0.25;

    this.reverbOutput = ctx.createGain();
    this.reverbOutput.gain.value = 0.40;
    this.reverbOutput.connect(this.ambientGain);

    const combDelays = [0.0297, 0.0371, 0.0411, 0.0437];
    const feedbacks = [0.82, 0.80, 0.78, 0.76];
    const combSum = ctx.createGain();
    combSum.gain.value = 0.25;

    for (let i = 0; i < combDelays.length; i++) {
      const delay = ctx.createDelay(0.1);
      delay.delayTime.value = combDelays[i];
      const feedback = ctx.createGain();
      feedback.gain.value = feedbacks[i];
      const damp = ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.value = 2800;

      this.reverbInput.connect(delay);
      delay.connect(damp);
      damp.connect(feedback);
      feedback.connect(delay);
      damp.connect(combSum);
    }

    const ap1 = ctx.createDelay(0.02);
    ap1.delayTime.value = 0.005;
    const ap2 = ctx.createDelay(0.01);
    ap2.delayTime.value = 0.0017;

    combSum.connect(ap1);
    ap1.connect(ap2);
    ap2.connect(this.reverbOutput);
  }

  private createRainNodes() {
    if (!this.ctx || !this.noiseBuffer || !this.ambientGain) return;
    const ctx = this.ctx;

    this.rainNode = ctx.createBufferSource();
    this.rainNode.buffer = this.noiseBuffer;
    this.rainNode.loop = true;

    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.value = 1300;

    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;

    this.rainNode.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ambientGain);
    this.rainNode.start();
  }

  public updateAmbientState(season: string, weather: string, isNight: boolean, rainIntensity: number = 0, stormIntensity: number = 0) {
    this.currentSeason = season;
    this.currentWeather = weather;
    this.isNightTime = isNight;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const rampTime = 1.5;

    if (this.rainGain && this.rainFilter) {
      let rainTarget = 0.0;
      let rainFreq = 1200;
      if (!this.settings.isMuted && this.settings.ambientVolume > 0.001) {
        const effectiveRain = Math.max(rainIntensity, weather === 'rain' ? 0.7 : weather === 'storm' ? 1.0 : 0.0);
        const effectiveStorm = Math.max(stormIntensity, weather === 'storm' ? 1.0 : 0.0);

        if (effectiveRain > 0.01) {
          rainTarget = (0.03 + effectiveRain * 0.05 + effectiveStorm * 0.05) * this.settings.ambientVolume;
          rainFreq = 1200 + effectiveRain * 300 + effectiveStorm * 400;
          if (effectiveStorm > 0.45 && Math.random() > 0.75) this.playThunder();
        }
      }
      this.rainGain.gain.cancelScheduledValues(now);
      this.rainGain.gain.linearRampToValueAtTime(rainTarget, now + rampTime);
      this.rainFilter.frequency.linearRampToValueAtTime(rainFreq, now + rampTime);
    }
  }

  public playThunder() {
    if (!this.ctx || !this.ambientGain || this.settings.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 2.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.linearRampToValueAtTime(60, now + 2.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28 * this.settings.ambientVolume, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 3.1);

    this.cleanupOnEnd(osc, [filter, gain], 3.3);
  }

  public setMasterVolume(val: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, val));
    saveAudioSettings(this.settings);
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const target = this.settings.isMuted ? 0 : this.settings.masterVolume;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(target, now);
    }
    if (this.musicAudio && !this.musicSourceNode) {
      this.musicAudio.volume = this.settings.isMuted ? 0 : this.settings.masterVolume * this.settings.musicVolume;
    }
  }

  public setMusicVolume(val: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, val));
    saveAudioSettings(this.settings);
    if (this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.settings.musicVolume, now);
    }
    if (this.musicAudio && !this.musicSourceNode) {
      this.musicAudio.volume = this.settings.isMuted ? 0 : this.settings.masterVolume * this.settings.musicVolume;
    }
  }

  public setAmbientVolume(val: number) {
    this.settings.ambientVolume = Math.max(0, Math.min(1, val));
    saveAudioSettings(this.settings);
    if (this.ctx && this.ambientGain) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(this.settings.ambientVolume, now);
    }
  }

  public setSfxVolume(val: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, val));
    saveAudioSettings(this.settings);
    if (this.ctx && this.sfxGain) {
      const now = this.ctx.currentTime;
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, now);
    }
  }

  public setUiVolume(val: number) {
    this.settings.uiVolume = Math.max(0, Math.min(1, val));
    saveAudioSettings(this.settings);
    if (this.ctx && this.uiGain) {
      const now = this.ctx.currentTime;
      this.uiGain.gain.cancelScheduledValues(now);
      this.uiGain.gain.setValueAtTime(this.settings.uiVolume, now);
    }
  }

  public setMuted(muted: boolean) {
    this.settings.isMuted = muted;
    saveAudioSettings(this.settings);
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const target = muted ? 0 : this.settings.masterVolume;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(target, now);
    }
    if (this.musicAudio && !this.musicSourceNode) {
      this.musicAudio.volume = muted ? 0 : this.settings.masterVolume * this.settings.musicVolume;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.settings.isMuted);
    return this.settings.isMuted;
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public getCurrentZoom(): number {
    return this.currentZoom;
  }

  public getCurrentSeason(): string {
    return this.currentSeason;
  }

  public destroy() {
    if (this.faunaTimer) window.clearTimeout(this.faunaTimer);
    if (this.villageMurmurTimer) window.clearTimeout(this.villageMurmurTimer);
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio = null;
    }

    if (this.ctx) {
      try { this.ctx.close(); } catch (_) {}
      this.ctx = null;
    }
    this.threeListener = null;
    this.isUnlocked = false;
    AudioManager.instance = null;
  }
}

export const audioManager = AudioManager.getInstance();

if (typeof window !== 'undefined') {
  (window as any).__throneAudioManager = audioManager;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    audioManager.destroy();
  });
}
