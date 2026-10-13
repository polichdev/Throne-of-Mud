import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL));
      for (const ext of ['', '.ts', '/index.ts']) {
        if (fs.existsSync(candidate + ext) && fs.statSync(candidate + ext).isFile()) {
          return { url: pathToFileURL(candidate + ext).href, shortCircuit: true };
        }
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(fs.readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
      }).outputText,
    };
    return next(url, context);
  },
});

const { createTimeSlice } = await import('../src/store/slices/timeSlice.ts');
const { timeToTicks, ticksToTime, TICKS_PER_MINUTE } = await import('../src/constants/time.ts');
let state;
const set = update => { state = { ...state, ...(typeof update === 'function' ? update(state) : update) }; };
const reset = () => { state = { resourceDeposits: [], ...createTimeSlice(set, () => state, {}) }; };
const advance = n => { for (let i = 0; i < n; i++) state.advanceTick(); };

reset();
// Older state has no offset. Its calendar progression remains unchanged.
delete state.time.calendarTickOffset;
advance(6);
assert.equal(state.time.minute, 1);
state.time.tick = timeToTicks(9, 18, 0);
Object.assign(state.time, ticksToTime(state.time.tick));
const eveningTick = state.time.tick;
// Representative timers held on units and in private AI/path-search caches.
const deadlines = [3, 4, 15, 30, 40, 120].map(delay => eveningTick + delay);
const lastAIAction = eveningTick - 10;
for (const hour of [7, 12, 18, 0, 7]) {
  state.setTimeOfDay(hour);
  assert.equal(state.time.tick, eveningTick, 'Manual jumps must preserve every simulation timer');
  assert.equal(state.time.hour, hour);
  assert.equal(state.time.minute, 0);
  assert.equal(state.time.day, 9);
  assert.equal(state.time.tick - lastAIAction, 10);
}
advance(120);
assert.ok(deadlines.every(deadline => state.time.tick >= deadline), 'All regional cooldowns expire within their original remaining delay');
assert.equal(state.time.hour, 7);
assert.equal(state.time.minute, 20);

const tickBeforeCalendarChange = state.time.tick;
state.setSeason('Winter');
state.setSeason('Spring');
state.setMonth('June');
assert.equal(state.time.tick, tickBeforeCalendarChange);
const changedDay = state.time.day;
advance(6);
assert.equal(state.time.day, changedDay);
assert.equal(state.time.hour, 7);
assert.equal(state.time.minute, 21);

reset();
state.time.isPaused = true;
state.time.speedMultiplier = 5;
state.setTimeOfDay(0);
assert.equal(state.time.isPaused, true);
assert.equal(state.time.speedMultiplier, 5);
advance(TICKS_PER_MINUTE);
assert.equal(state.time.day, 1);
assert.equal(state.time.hour, 0, 'Day-one midnight must not snap back to 07:00');
assert.equal(state.time.minute, 1);
state.setTimeOfDay(23);
advance(60 * TICKS_PER_MINUTE);
assert.equal(state.time.day, 2);
assert.equal(state.time.hour, 0);
assert.equal(state.time.minute, 0);
const beforeInvalid = { ...state.time };
state.setTimeOfDay(NaN);
assert.deepEqual(state.time, beforeInvalid);
// The offset survives ordinary JSON state persistence.
state.time = JSON.parse(JSON.stringify(state.time));
advance(6);
assert.equal(state.time.minute, 1);
console.log('Manual time regression checks passed: rewinds, forward jumps, AI deadlines, calendar changes, midnight, pause/speed and serialized state.');
