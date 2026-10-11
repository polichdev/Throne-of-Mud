import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
import { WebGLLights } from 'three/src/renderers/webgl/WebGLLights.js';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL));
      for (const ext of ['', '.ts', '.tsx']) if (fs.existsSync(candidate + ext) && fs.statSync(candidate + ext).isFile()) return { url: pathToFileURL(candidate + ext).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (/\.(ts|tsx)$/.test(url)) return { format: 'module', shortCircuit: true, source: ts.transpileModule(fs.readFileSync(fileURLToPath(url), 'utf8'), {
      fileName: path.basename(url), compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
    }).outputText };
    return next(url, context);
  },
});
const { StablePointLightPool } = await import('../src/components/canvas/performance/StablePointLightPool.ts');
const scene = new THREE.Scene(), root = new THREE.Group(), owner = {}, secondOwner = {};
scene.add(root); root.position.set(3, 2, -4); root.rotation.y = .7;
const first = new THREE.PointLight('#ffd89b', 1.7, 7, 2), second = new THREE.PointLight('#fa9030', .4, 0, 1);
first.position.set(1, 3, 2); second.position.set(-2, .3, -1); root.add(first, second);
const camera = new THREE.PerspectiveCamera(); camera.position.set(9, 20, 5); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
const pool = new StablePointLightPool(); pool.sync(owner, root);
assert.equal(first.layers.mask, 1, 'Inactive manager preserves ordinary rendering');
pool.start(); scene.add(pool.group);
assert.equal(first.layers.mask, 0, 'Original source is not drawn alongside its proxy');
function uniforms(lights) {
  const engine = WebGLLights({ get() { return null; } });
  engine.setup([...lights]); engine.setupView(lights, camera);
  return engine.state;
}
function draw() { scene.updateMatrixWorld(); pool.update(camera); return uniforms(pool.group.children); }
function parity(expected) {
  const actual = draw().point.filter(light => light.color.r || light.color.g || light.color.b);
  const reference = uniforms(expected).point;
  assert.equal(actual.length, reference.length, 'Every active source contributes once');
  for (let i = 0; i < reference.length; i++) {
    assert.ok(actual[i].position.distanceTo(reference[i].position) < 1e-10, 'World and camera-space light positions match Three');
    assert.deepEqual(actual[i].color, reference[i].color, 'Original intensity and color preserved');
    assert.equal(actual[i].distance, reference[i].distance); assert.equal(actual[i].decay, reference[i].decay);
  }
}
parity([first, second]); const capacity = pool.group.children.length;
root.visible = false; assert.equal(draw().point.length, capacity, 'Forest keeps the same NUM_POINT_LIGHTS as city'); parity([]);
root.visible = true; first.intensity = 2.31; first.color.set('#cc5728'); root.position.x += 15; parity([first, second]);
second.visible = false; parity([first]); second.visible = true;
camera.layers.set(3); parity([]);
first.layers.set(3);
pool.remove(owner); first.layers.set(3); pool.sync(owner, root);
parity([first]); assert.ok(pool.group.children.every(light => light.layers.test(camera.layers)), 'Proxy slots follow camera layers');
camera.layers.set(0); parity([second]);
second.castShadow = true; parity([]); assert.equal(second.layers.mask, 1, 'Runtime shadow light remains on ordinary renderer');
second.castShadow = false; parity([second]);
pool.sync(secondOwner, root); pool.remove(owner); assert.equal(second.layers.mask, 0, 'Shared owner retains sources');
pool.remove(secondOwner); assert.equal(first.layers.mask, 8); assert.equal(second.layers.mask, 1); parity([]);
const large = new THREE.Group(); scene.add(large);
for (let i = 0; i < 65; i++) { const light = new THREE.PointLight('#ffe19a', 1 + i / 100, 5); light.position.x = i; large.add(light); }
pool.sync(owner, large); assert.equal(pool.group.children.length, 128, 'Slots grow for all registered lights; no light count cap');
parity(large.children);
large.visible = false; parity([]); assert.equal(pool.group.children.length, 128, 'Region changes never shrink slots');
pool.stop(); assert.ok(large.children.every(light => light.layers.mask === 1), 'Cleanup restores every original layer');
pool.start(); large.visible = true; parity(large.children); pool.stop(); pool.remove(owner);
assert.equal(pool.group.children.length, 0, 'Strict-mode cleanup releases proxy lights');
console.log('Stable point lights: installed Three uniform parity, flicker, movement, hidden regions, custom layers, shadow fallback, multiple owners, 65 sources without truncation, and restart/cleanup passed. No GPU timing claimed.');
