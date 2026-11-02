import assert from 'node:assert/strict';

let canvases = 0;
const gradient = { addColorStop() {} };
const context = new Proxy({}, {
  get(target, key) {
    if (key in target) return target[key];
    return key === 'createLinearGradient' || key === 'createRadialGradient' ? () => gradient : () => {};
  },
});
globalThis.document = { createElement(tag) {
  assert.equal(tag, 'canvas');
  canvases++;
  return { width: 0, height: 0, getContext: () => context };
} };

const { BUILDING_TEXTURES: textures } = await import('../src/components/canvas/buildings/buildingTextures.ts');
for (const [first, second, repeat] of [
  ['thatch', 'thatchSteep', [2, 1]],
  ['timberPlanks', 'timberPlanksFine', [4, 1]],
  ['stoneMasonry', 'stoneFoundation', [4, 1]],
]) {
  assert.notStrictEqual(textures[first], textures[second]);
  assert.strictEqual(textures[first].source, textures[second].source, `${second} reuses image and GPU source`);
  assert.deepEqual(textures[first].repeat.toArray(), [2, 2]);
  assert.deepEqual(textures[second].repeat.toArray(), repeat);
}
assert.equal(canvases, 8, 'Repeated building patterns are drawn once');
console.log('Building texture variants share their source and retain independent tiling.');
