import * as THREE from 'three';

export const GROUND_SHADOW_RENDER_ORDER = -1;
export const groundShadowMaterial = new THREE.MeshBasicMaterial({
  color: '#0f172a', transparent: true, opacity: 0.35,
});

export function isGroundShadow(mesh: THREE.Mesh, material: THREE.Material): boolean {
  return material === groundShadowMaterial && mesh.renderOrder === GROUND_SHADOW_RENDER_ORDER && !mesh.castShadow;
}
