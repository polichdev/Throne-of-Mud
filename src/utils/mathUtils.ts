import { MAP_SIZE } from '../constants/world';

export function distance2D(x1: number, z1: number, x2: number, z2: number): number {
  return Math.hypot(x2 - x1, z2 - z1);
}

export function distanceSq2D(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return dx * dx + dz * dz;
}

export function distBetween(
  p1: [number, number] | readonly [number, number],
  p2: [number, number] | readonly [number, number]
): number {
  return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
}

export function distSqBetween(
  p1: [number, number] | readonly [number, number],
  p2: [number, number] | readonly [number, number]
): number {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  return dx * dx + dz * dz;
}

export function pseudoRandom(seed1: number, seed2: number): number {
  const s = Math.sin(seed1 * 12.9898 + seed2 * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function getTileKey(x: number, z: number): string {
  return `${Math.floor(x)},${Math.floor(z)}`;
}

export function getTileIndex(x: number, z: number, width: number = MAP_SIZE): number {
  return Math.floor(x) * width + Math.floor(z);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
