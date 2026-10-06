import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../engine/audio/AudioManager';

export function AudioController() {
  const gameMode = useGameStore((s) => s.gameMode);
  const season = useGameStore((s) => s.time?.season || 'Spring');
  const weather = useGameStore((s) => s.time?.weather || 'clear');
  const rainIntensity = useGameStore((s) => s.time?.rainIntensity ?? 0);
  const stormIntensity = useGameStore((s) => s.time?.stormIntensity ?? 0);
  const hour = useGameStore((s) => s.time?.hour ?? 12);
  const isNight = hour >= 21 || hour < 5;

  const activeTreeHits = useGameStore((s) => s.activeTreeHits);
  const fallingTrees = useGameStore((s) => s.fallingTrees);
  const audioSettings = useGameStore((s) => s.audioSettings);

  const lastHitTimeRef = useRef(0);
  const seenFallingTreesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    audioManager.setMuted(audioSettings.isMuted);
    audioManager.setMasterVolume(audioSettings.masterVolume);
    audioManager.setMusicVolume(audioSettings.musicVolume);
    audioManager.setAmbientVolume(audioSettings.ambientVolume);
    audioManager.setSfxVolume(audioSettings.sfxVolume);
    audioManager.setUiVolume(audioSettings.uiVolume);
  }, [audioSettings]);

  useEffect(() => {
    audioManager.setMusicMode(gameMode === 'menu' ? 'menu' : 'game');
  }, [gameMode]);

  useEffect(() => {
    audioManager.updateAmbientState(season, weather, isNight, rainIntensity, stormIntensity);
  }, [season, weather, isNight, Math.round(rainIntensity * 10), Math.round(stormIntensity * 10)]);

  useEffect(() => {
    if (!activeTreeHits || activeTreeHits.length === 0) return;
    let maxHitTime = lastHitTimeRef.current;
    let hasNewHit = false;
    let hitX: number | undefined;
    let hitZ: number | undefined;

    for (let i = 0; i < activeTreeHits.length; i++) {
      const hit = activeTreeHits[i];
      if (hit && hit.hitTime > lastHitTimeRef.current) {
        hasNewHit = true;
        if (hit.hitTime > maxHitTime) {
          maxHitTime = hit.hitTime;
          hitX = hit.x;
          hitZ = hit.z;
        }
      }
    }

    if (hasNewHit) {
      lastHitTimeRef.current = maxHitTime;
      audioManager.playWoodChop(hitX, hitZ);
    }
  }, [activeTreeHits]);

  useEffect(() => {
    if (!fallingTrees || fallingTrees.length === 0) return;

    for (const tree of fallingTrees) {
      if (!seenFallingTreesRef.current.has(tree.id)) {
        seenFallingTreesRef.current.add(tree.id);
        audioManager.playTreeFall(tree.x, tree.z);
      }
    }

    if (seenFallingTreesRef.current.size > 50) {
      const activeIds = new Set(fallingTrees.map((t) => t.id));
      for (const id of seenFallingTreesRef.current) {
        if (!activeIds.has(id)) {
          seenFallingTreesRef.current.delete(id);
        }
      }
    }
  }, [fallingTrees]);

  return null;
}
