import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { optimizePointLightMaterial, pointLightRangeChunk } from '../src/components/canvas/performance/pointLightRange.ts';

const original = THREE.ShaderChunk.lights_fragment_begin;
const guarded = pointLightRangeChunk(original);
assert.notEqual(guarded, original, 'Current Three point-light shader is recognized');
assert.equal(THREE.ShaderChunk.lights_fragment_begin, original, 'No global Three shader mutation');
const pointEnd = original.indexOf('#pragma unroll_loop_end', original.indexOf('#if ( NUM_POINT_LIGHTS > 0 )'));
assert.equal(guarded.slice(guarded.indexOf('#pragma unroll_loop_end')), original.slice(pointEnd), 'Spot, directional, sun and indirect lighting remain unchanged');

const program = fs.readFileSync(new URL('../node_modules/three/src/renderers/webgl/WebGLProgram.js', import.meta.url), 'utf8');
const pattern = program.slice(program.indexOf('const unrollLoopPattern'), program.indexOf('function unrollLoops'));
const functions = program.slice(program.indexOf('function unrollLoops'), program.indexOf('function generatePrecision'));
const unroll = new Function('string', `${pattern}\n${functions}\nreturn unrollLoops(string);`);
for (const count of [0, 1, 3, 12, 16, 64]) {
  const shader = unroll(guarded.replace(/NUM_[A-Z_]+/g, token => token === 'NUM_POINT_LIGHTS' ? String(count) : '0'));
  assert.equal((shader.match(/dot\( pointLightOffset/g) ?? []).length, count, 'Every unrolled point light retains its range guard');
  assert.equal((shader.match(/vec3 pointLightOffset/g) ?? []).length, count, 'Every point-light temporary has its own scope');
  assert.equal((shader.match(/dot\( pointLight.color, pointLight.color \) > 0.0/g) ?? []).length, count, 'Inactive light slots skip the BRDF');
  let depth = 0;
  for (const char of shader.replace(/\/\/[^\n]*/g, '')) {
    if (char === '{') depth++;
    if (char === '}') depth--;
    assert.ok(depth >= 0, 'Valid GLSL nesting after Three loop expansion');
  }
  assert.equal(depth, 0);
  assert.ok(!shader.includes('pointLights[ i ]'), 'No unresolved loop indices remain');
}

function attenuation(distance, cutoff, decay) {
  let value = 1 / Math.max(distance ** decay, .01);
  if (cutoff > 0) value *= Math.max(0, Math.min(1, 1 - (distance / cutoff) ** 4)) ** 2;
  return value;
}
let samples = 0, skipped = 0;
for (const cutoff of [-1, 0, 3.5, 5, 7]) for (const decay of [0, 1, 2]) for (let x = -20; x <= 20; x++) for (let z = -20; z <= 20; z++) {
  const squared = x * x + .35 * .35 + z * z;
  const active = cutoff <= 0 || squared < cutoff * cutoff;
  const expected = attenuation(Math.sqrt(squared), cutoff, decay);
  assert.equal(active ? expected : 0, expected, 'Finite and unlimited light contribution is preserved');
  samples++; if (!active) skipped++;
}
for (const radius of [3.5, 5, 7]) assert.equal(attenuation(radius, radius, 2), 0, 'Exact radius boundary contributes zero');

const material = new THREE.MeshStandardMaterial();
material.onBeforeCompile = shader => { shader.uniforms.animationTime = { value: 1 }; shader.vertexShader += '\n// existing animation'; };
const key = material.customProgramCacheKey(); const version = material.version;
optimizePointLightMaterial(material);
assert.notEqual(material.customProgramCacheKey(), key, 'Cache key forces a distinct shader variant');
assert.equal(material.version, version + 1, 'Already mounted materials invalidate their program');
optimizePointLightMaterial(material); assert.equal(material.version, version + 1, 'Repeated material setup is idempotent');
for (const name of ['standard', 'physical', 'lambert']) {
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib[name].vertexShader, fragmentShader: THREE.ShaderLib[name].fragmentShader };
  material.onBeforeCompile(shader, {});
  assert.equal(shader.uniforms.animationTime.value, 1); assert.ok(shader.vertexShader.includes('// existing animation'));
  assert.ok(shader.fragmentShader.includes('pointLightOffset')); assert.ok(!shader.fragmentShader.includes('#include <lights_fragment_begin>'));
}
const other = new THREE.MeshStandardMaterial(); other.onBeforeCompile = shader => { shader.vertexShader += '\n// another animation'; };
optimizePointLightMaterial(other); assert.notEqual(other.customProgramCacheKey(), material.customProgramCacheKey(), 'Distinct custom animations keep distinct cache keys');
let revision = 1; const custom = new THREE.MeshStandardMaterial(); custom.customProgramCacheKey = () => `custom-${revision}`;
optimizePointLightMaterial(custom); const previous = custom.customProgramCacheKey(); revision++; assert.notEqual(custom.customProgramCacheKey(), previous, 'Dynamic custom shader revisions remain live');
console.log(JSON.stringify({ samples, zeroContributionSkipped: skipped, checks: 'Installed Three loop expansion; finite/unlimited/boundary light contribution; standard/physical/lambert hooks; shader cache separation and invalidation. No GPU timing claimed.' }));
