import * as THREE from 'three';

export function createUnitHeadGeometry(): THREE.BoxGeometry {
  const geometry = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const source = geometry.index!;
  const indices: number[] = [];
  for (const face of [0, 1, 2, 3, 5, 4]) {
    const group = geometry.groups[face];
    for (let i = group.start; i < group.start + group.count; i++) indices.push(source.getX(i));
  }
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(0, 30, 0);
  geometry.addGroup(30, 6, 1);
  return geometry;
}
