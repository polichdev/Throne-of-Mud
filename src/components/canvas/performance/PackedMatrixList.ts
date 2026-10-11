import type { Matrix4 } from 'three';

export class PackedMatrixList {
  private data = new Float32Array(0);
  private count = 0;

  get length() { return this.count; }
  get byteLength() { return this.data.byteLength; }
  clear() { this.count = 0; }

  push(matrix: Matrix4) {
    if (this.count * 16 === this.data.length) {
      const next = new Float32Array(Math.max(16, this.data.length * 2));
      next.set(this.data); this.data = next;
    }
    this.data.set(matrix.elements, this.count++ * 16);
  }

  copyTo(target: Float32Array, offset: number, limit: number) {
    const count = Math.min(this.count, limit, Math.floor(target.length / 16) - offset);
    if (count <= 0) return 0;
    target.set(this.data.subarray(0, count * 16), offset * 16);
    return count;
  }
}
