import type { BufferAttribute } from 'three';

export interface BucketBounds {
  minBx: number;
  maxBx: number;
  minBz: number;
  maxBz: number;
}

export function isBucketInBounds(bx: number, bz: number, bounds: BucketBounds): boolean {
  return bx >= bounds.minBx && bx <= bounds.maxBx && bz >= bounds.minBz && bz <= bounds.maxBz;
}

export function markInstancePrefixForUpload(attribute: BufferAttribute, count: number): void {
  attribute.clearUpdateRanges();
  if (count <= 0) return;
  attribute.addUpdateRange(0, Math.min(attribute.array.length, count * attribute.itemSize));
  attribute.needsUpdate = true;
}
