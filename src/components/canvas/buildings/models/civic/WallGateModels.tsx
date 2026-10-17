import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

export const woodenWallLogsGeometry = (() => {
  const g1 = new THREE.CylinderGeometry(0.07, 0.11, 1.1, 5); g1.translate(-0.32, 0.55, 0);
  const g2 = new THREE.CylinderGeometry(0.07, 0.11, 1.1, 5); g2.translate(0, 0.55, 0);
  const g3 = new THREE.CylinderGeometry(0.07, 0.11, 1.1, 5); g3.translate(0.32, 0.55, 0);
  return mergeGeometries([toStandard(g1), toStandard(g2), toStandard(g3)]) || g1;
})();

export const woodenWallCrossbarGeometry = (() => {
  const g = new THREE.CylinderGeometry(0.05, 0.05, 0.95, 4);
  g.rotateZ(Math.PI / 2);
  g.translate(0, 0.45, 0);
  return toStandard(g);
})();

export const stoneWallMainGeometry = (() => {
  const g = new THREE.BoxGeometry(0.96, 0.9, 0.45);
  g.translate(0, 0.45, 0);
  return toStandard(g);
})();

export const stoneWallBattlementsGeometry = (() => {
  const g1 = new THREE.BoxGeometry(0.26, 0.22, 0.45); g1.translate(-0.32, 1.0, 0);
  const g2 = new THREE.BoxGeometry(0.26, 0.22, 0.45); g2.translate(0.32, 1.0, 0);
  return mergeGeometries([toStandard(g1), toStandard(g2)]) || g1;
})();

export const woodenGatePostsGeometry = (() => {
  const g1 = new THREE.CylinderGeometry(0.11, 0.13, 1.3, 6); g1.translate(-0.4, 0.65, 0);
  const g2 = new THREE.CylinderGeometry(0.11, 0.13, 1.3, 6); g2.translate(0.4, 0.65, 0);
  return mergeGeometries([toStandard(g1), toStandard(g2)]) || g1;
})();

export function WoodenWallModel() {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group>
      <mesh geometry={woodenWallLogsGeometry} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={woodenWallCrossbarGeometry} material={mats.timberMed} />
    </group>
  );
}

export function WoodenGateModel() {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group>
      <mesh geometry={woodenGatePostsGeometry} material={mats.timberDark} castShadow receiveShadow />
      <mesh material={mats.timberMed} position={[0, 1.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.0, 4]} />
      </mesh>
      <mesh material={mats.timberPlanks} position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.68, 0.88, 0.06]} />
      </mesh>
    </group>
  );
}

export function StoneWallModel() {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group>
      <mesh geometry={stoneWallMainGeometry} material={mats.stoneMed} castShadow receiveShadow />
      <mesh geometry={stoneWallBattlementsGeometry} material={mats.stoneDark} />
    </group>
  );
}
