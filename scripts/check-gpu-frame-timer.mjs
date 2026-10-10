import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/components/canvas/performance/GpuFrameTimer.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText;
const { GpuFrameTimer } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const ext = { TIME_ELAPSED_EXT: 11, GPU_DISJOINT_EXT: 12 };
function mockContext(supported = true) {
  let active = null, disjoint = false, lost = false;
  const queries = [], deleted = [];
  return {
    QUERY_RESULT_AVAILABLE: 1, QUERY_RESULT: 2, CURRENT_QUERY: 3,
    getExtension: () => supported ? ext : null,
    isContextLost: () => lost,
    getParameter: () => disjoint,
    getQuery: () => active,
    createQuery() { const query = { available: false, nanos: 2_500_000 }; queries.push(query); return query; },
    beginQuery(_, query) { assert.equal(active, null, 'Never nest GPU timers'); active = query; },
    endQuery() { assert.ok(active); active = null; },
    getQueryParameter(query, key) {
      if (key === this.QUERY_RESULT_AVAILABLE) return query.available;
      assert.ok(query.available, 'Never read an unavailable GPU result');
      return query.nanos;
    },
    deleteQuery: query => deleted.push(query),
    queries, deleted,
    disjoint: value => { disjoint = value; }, lost: value => { lost = value; },
  };
}
const unsupported = new GpuFrameTimer(mockContext(false));
assert.equal(unsupported.supported, false);
unsupported.begin(8); unsupported.end(); assert.equal(unsupported.poll(9, 100), null); unsupported.dispose();
const webgl1 = new GpuFrameTimer({ getExtension() { throw new Error('WebGL1 must not attempt a WebGL2 query'); } });
assert.equal(webgl1.supported, false);

const gl = mockContext(), timer = new GpuFrameTimer(gl);
timer.begin(1); timer.end(); assert.equal(gl.queries.length, 0, 'GPU sampling is limited to one frame in eight');
timer.begin(8); timer.end();
assert.equal(timer.poll(9, 100), null, 'Unavailable result stays pending');
gl.queries[0].available = true;
assert.equal(timer.poll(10, 106), 2.5, 'Nanoseconds convert to milliseconds');
assert.equal(gl.deleted.length, 1);
assert.equal(timer.poll(11, 2107), null, 'Stale GPU measurements expire');

timer.begin(16); timer.end(); gl.queries[1].available = true; gl.disjoint(true);
assert.equal(timer.poll(17, 2200), null, 'Disjoint GPU timing is discarded');
assert.equal(gl.deleted.length, 2);
gl.disjoint(false);
for (let frame = 24; frame <= 64; frame += 8) { timer.begin(frame); timer.end(); }
assert.equal(gl.queries.length, 6, 'No more than four unresolved queries are queued');
timer.poll(200, 2300);
assert.equal(gl.deleted.length, 6, 'Timed-out queries are cleaned up');
timer.begin(208); timer.end(); gl.lost(true);
assert.equal(timer.poll(209, 2400), null, 'Context loss invalidates timing');
assert.equal(gl.deleted.length, 7);
gl.lost(false); timer.begin(216); timer.dispose();
assert.equal(gl.deleted.length, 8, 'Unmount cleans up active and pending queries');

console.log('GPU timing: unsupported WebGL, asynchronous reads, sampling cadence, expiry, disjoint state, bounded queue, context loss and disposal passed.');
