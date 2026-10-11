import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/components/canvas/performance/cooperativeTask.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
const { startCooperativeTask } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const originalPerformance = globalThis.performance;
const originalWindow = globalThis.window;
let now = 0, id = 0;
const callbacks = new Map();
globalThis.performance = { now: () => now };
globalThis.window = {
  requestIdleCallback(callback, options) { assert.equal(options.timeout, 100); callbacks.set(++id, callback); return id; },
  cancelIdleCallback(handle) { callbacks.delete(handle); },
};
function runNext(deadline = { timeRemaining: () => 50 }) {
  const [handle, callback] = callbacks.entries().next().value;
  callbacks.delete(handle); callback(deadline);
}

try {
  let allowed = false, completed = 0, progressed = 0, closed = 0;
  function* task() {
    try { for (let i = 0; i < 9; i++) { progressed++; now++; yield; } }
    finally { closed++; }
  }
  startCooperativeTask(task(), () => allowed, () => completed++);
  runNext(); assert.equal(progressed, 0, 'Camera motion pauses work');
  allowed = true;
  runNext(); assert.equal(progressed, 2, 'An idle slice uses 2ms instead of the entire idle period');
  allowed = false; runNext(); assert.equal(progressed, 2, 'Motion pauses an already partially drawn map');
  allowed = true;
  runNext({ timeRemaining: () => 0 }); assert.equal(progressed, 3, 'An expired idle deadline still makes bounded progress');
  while (callbacks.size) runNext();
  assert.equal(completed, 1); assert.equal(closed, 1);

  progressed = 0; closed = 0;
  const cancel = startCooperativeTask(task(), () => true, () => completed++);
  runNext(); const queuedCallback = callbacks.values().next().value;
  cancel(); assert.equal(callbacks.size, 0); assert.equal(closed, 1, 'Cancellation closes the drawing generator');
  queuedCallback(); assert.equal(progressed, 2, 'A stale callback cannot resume cancelled work');
  assert.equal(completed, 1, 'A stale map never publishes');

  delete window.requestIdleCallback;
  window.setTimeout = (callback, delay) => { assert.equal(delay, 16); callbacks.set(++id, callback); return id; };
  window.clearTimeout = handle => callbacks.delete(handle);
  progressed = 0; closed = 0;
  const cancelFallback = startCooperativeTask(task(), () => true, () => completed++);
  runNext(undefined); assert.equal(progressed, 2);
  cancelFallback(); assert.equal(callbacks.size, 0); assert.equal(closed, 1);
  console.log('Cooperative drawing: CPU slice budget, motion pause/resume, idle deadlines, cancellation, stale callbacks and timer fallback passed.');
} finally {
  globalThis.performance = originalPerformance;
  globalThis.window = originalWindow;
}
