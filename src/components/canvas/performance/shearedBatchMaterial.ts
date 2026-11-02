import * as THREE from 'three';

const materials = new WeakMap<THREE.Material, THREE.Material>();
const normalChunk = THREE.ShaderChunk.defaultnormal_vertex;
const nativeNormal = 'transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );\n\ttransformedNormal = bm * transformedNormal;';
const correctedNormal = normalChunk.replace(nativeNormal, `
    mat3 normalCofactor = mat3( cross( bm[ 1 ], bm[ 2 ] ), cross( bm[ 2 ], bm[ 0 ] ), cross( bm[ 0 ], bm[ 1 ] ) );
    transformedNormal = normalCofactor * transformedNormal;`);

export function getShearedBatchMaterial(material: THREE.Material): THREE.Material | null {
  if (normalChunk === correctedNormal || !(material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial)) return null;
  const existing = materials.get(material);
  if (existing) return existing;
  const originalCompile = material.onBeforeCompile;
  const originalKey = material.customProgramCacheKey();
  const result = material.clone();
  result.onBeforeCompile = function (shader, renderer) {
    originalCompile.call(this, shader, renderer);
    shader.vertexShader = shader.vertexShader.replace('#include <defaultnormal_vertex>', correctedNormal);
  };
  result.customProgramCacheKey = () => `${originalKey}:sheared-batch-normal-v2`;
  materials.set(material, result);
  return result;
}
