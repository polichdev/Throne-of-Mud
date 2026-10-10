interface TimerExtension {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
}

export class GpuFrameTimer {
  private readonly gl: WebGL2RenderingContext;
  private readonly extension: TimerExtension | null;
  private pending: { query: WebGLQuery; frame: number }[] = [];
  private active: { query: WebGLQuery; frame: number } | null = null;
  private lastSampleAt = -Infinity;
  private lastMs: number | null = null;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl as WebGL2RenderingContext;
    this.extension = typeof this.gl.createQuery === 'function'
      ? gl.getExtension('EXT_disjoint_timer_query_webgl2') as TimerExtension | null : null;
  }

  get supported() { return Boolean(this.extension); }

  poll(frame: number, now: number): number | null {
    const ext = this.extension;
    if (!ext) return null;
    if (this.gl.isContextLost() || (this.pending.length && this.gl.getParameter(ext.GPU_DISJOINT_EXT))) {
      this.clearPending();
      this.lastMs = null;
      return null;
    }
    while (this.pending.length) {
      const item = this.pending[0];
      if (this.gl.getQueryParameter(item.query, this.gl.QUERY_RESULT_AVAILABLE)) {
        const nanos = this.gl.getQueryParameter(item.query, this.gl.QUERY_RESULT) as number;
        this.gl.deleteQuery(item.query);
        this.pending.shift();
        if (Number.isFinite(nanos) && nanos > 0) { this.lastMs = nanos / 1e6; this.lastSampleAt = now; }
      } else if (frame - item.frame > 120) {
        this.gl.deleteQuery(item.query);
        this.pending.shift();
      } else break;
    }
    return now - this.lastSampleAt < 2000 ? this.lastMs : null;
  }

  begin(frame: number): void {
    const ext = this.extension;
    if (!ext || frame % 8 !== 0 || this.active || this.pending.length >= 4 || this.gl.isContextLost()) return;
    if (this.gl.getQuery(ext.TIME_ELAPSED_EXT, this.gl.CURRENT_QUERY)) return;
    const query = this.gl.createQuery();
    if (!query) return;
    this.gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    this.active = { query, frame };
  }

  end(): void {
    if (!this.active || !this.extension) return;
    this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
    this.pending.push(this.active);
    this.active = null;
  }

  private clearPending() {
    this.pending.forEach(item => this.gl.deleteQuery(item.query));
    this.pending = [];
  }

  dispose(): void {
    if (this.active) { this.end(); }
    this.clearPending();
    this.lastMs = null;
  }
}
