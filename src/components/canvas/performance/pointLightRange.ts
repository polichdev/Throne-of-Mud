import * as THREE from 'three';

const optimized = new WeakSet<THREE.Material>();
const cacheVersion = 'point-light-range-v2-restored';

export function pointLightRangeChunk(chunk: string) {
  const start = chunk.indexOf('#if ( NUM_POINT_LIGHTS > 0 )');
  const end = chunk.indexOf('#pragma unroll_loop_end', start);
  if (start < 0 || end < 0) return chunk;
  const original = chunk.slice(start, end);
  const info = 'getPointLightInfo( pointLight, geometryPosition, directLight );';
  const direct = 'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );';
  if (!original.includes(info) || !original.includes(direct)) return chunk;
  const guarded = original.replace(info, `{
      vec3 pointLightOffset = pointLight.position - geometryPosition;
      if ( dot( pointLight.color, pointLight.color ) > 0.0 && ( pointLight.distance <= 0.0 || dot( pointLightOffset, pointLightOffset ) < pointLight.distance * pointLight.distance ) ) {
        ${info}`)
    .replace(direct, `${direct}
      }
    }`);
  return chunk.slice(0, start) + guarded + chunk.slice(end);
}

export function optimizePointLightMaterial<T extends THREE.Material>(material: T): T {
  if (optimized.has(material)) return material;
  optimized.add(material);
  const compile = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey;
  const defaultKey = compile.toString();
  material.onBeforeCompile = function (shader, renderer) {
    compile.call(this, shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', pointLightRangeChunk(THREE.ShaderChunk.lights_fragment_begin));
  };
  material.customProgramCacheKey = function () {
    return `${cacheKey === THREE.Material.prototype.customProgramCacheKey ? defaultKey : cacheKey.call(this)}:${cacheVersion}`;
  };
  material.needsUpdate = true;
  return material;
}
