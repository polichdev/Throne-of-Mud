import { Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface StaticMeshPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  castShadow: boolean;
  receiveShadow: boolean;
}

export function mergeStaticMeshParts(
  tree: ReactNode,
  expand: (type: unknown, props: any) => ReactNode,
): StaticMeshPart[] {
  const buckets = new Map<string, { part: Omit<StaticMeshPart, 'geometry'>; geometries: THREE.BufferGeometry[] }>();
  const identity = new THREE.Matrix4();

  function visit(node: ReactNode, parent: THREE.Matrix4) {
    if (Array.isArray(node)) { node.forEach(child => visit(child, parent)); return; }
    if (!isValidElement(node)) return;
    const props = node.props as any;
    if (props.visible === false) return;
    if (node.type === Fragment) { visit(props.children, parent); return; }
    if (typeof node.type !== 'string') { visit(expand(node.type, props), parent); return; }
    if (node.type !== 'group' && node.type !== 'mesh') throw new Error(`Unsupported static node: ${node.type}`);

    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(...(props.position ?? [0, 0, 0]) as [number, number, number]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(props.rotation ?? [0, 0, 0]) as [number, number, number])),
      typeof props.scale === 'number' ? new THREE.Vector3().setScalar(props.scale) :
        new THREE.Vector3(...(props.scale ?? [1, 1, 1]) as [number, number, number]),
    );
    const matrix = parent.clone().multiply(local);
    if (node.type === 'group') { visit(props.children, matrix); return; }

    let geometry = props.geometry as THREE.BufferGeometry | undefined;
    let ownsGeometry = false;
    if (!geometry) {
      const children = Array.isArray(props.children) ? props.children : [props.children];
      for (const child of children) {
        if (!isValidElement(child)) continue;
        const args = (child.props as any).args ?? [];
        if (child.type === 'boxGeometry') geometry = new THREE.BoxGeometry(...args);
        else if (child.type === 'torusGeometry') geometry = new THREE.TorusGeometry(...args);
        else if (child.type === 'cylinderGeometry') geometry = new THREE.CylinderGeometry(...args);
        else throw new Error(`Unsupported static geometry: ${String(child.type)}`);
        ownsGeometry = true;
        break;
      }
    }
    if (!geometry || !(props.material instanceof THREE.Material)) throw new Error('Static mesh requires geometry and one material');
    const copy = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    if (ownsGeometry) geometry.dispose();
    copy.applyMatrix4(matrix);
    if (!copy.getAttribute('normal')) copy.computeVertexNormals();
    if (!copy.getAttribute('uv')) copy.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(copy.getAttribute('position').count * 2), 2));
    for (const name of Object.keys(copy.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) throw new Error(`Unsupported static attribute: ${name}`);
    }
    copy.clearGroups();
    const castShadow = Boolean(props.castShadow), receiveShadow = Boolean(props.receiveShadow);
    const key = `${props.material.uuid}:${castShadow}:${receiveShadow}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { part: { material: props.material, castShadow, receiveShadow }, geometries: [] };
      buckets.set(key, bucket);
    }
    bucket.geometries.push(copy);
  }

  visit(tree, identity);
  return [...buckets.values()].map(({ part, geometries }) => {
    const geometry = mergeGeometries(geometries);
    geometries.forEach(source => source.dispose());
    if (!geometry) throw new Error('Unable to merge static prefab');
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return { ...part, geometry };
  });
}
