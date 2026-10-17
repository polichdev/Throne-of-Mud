import { DEFAULT_CAMERA_ZOOM } from '../../../../../constants/camera';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../../buildingMaterials';
import { isObjectEffectivelyVisible, MedievalDoor } from '../../common/BuildingPrimitives';

function toStandard(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    const count = g.attributes.position.count;
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
  }
  const cleaned = new THREE.BufferGeometry();
  cleaned.setAttribute('position', g.attributes.position);
  cleaned.setAttribute('normal', g.attributes.normal);
  cleaned.setAttribute('uv', g.attributes.uv);
  return cleaned;
}

export const windmillStoneGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const base = new THREE.CylinderGeometry(1.15, 1.35, 0.7, 8); base.translate(0, 0.35, 0); geos.push(toStandard(base));
  const step = new THREE.BoxGeometry(0.88, 0.08, 0.55); step.translate(0, 0.04, -0.74); geos.push(toStandard(step));
  return mergeGeometries(geos) || geos[0];
})();

export const windmillLogsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const shaft = new THREE.CylinderGeometry(0.9, 1.15, 1.8, 8); shaft.translate(0, 1.45, 0); geos.push(toStandard(shaft));

  const porchM = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(0, 0, -0.92);
  const wLeft = new THREE.BoxGeometry(0.08, 0.9, 0.55); wLeft.applyMatrix4(new THREE.Matrix4().setPosition(-0.4, 0.45, 0.18).premultiply(porchM)); geos.push(toStandard(wLeft));
  const wRight = new THREE.BoxGeometry(0.08, 0.9, 0.55); wRight.applyMatrix4(new THREE.Matrix4().setPosition(0.4, 0.45, 0.18).premultiply(porchM)); geos.push(toStandard(wRight));
  const wTop = new THREE.BoxGeometry(0.88, 0.08, 0.55); wTop.applyMatrix4(new THREE.Matrix4().setPosition(0, 0.92, 0.18).premultiply(porchM)); geos.push(toStandard(wTop));

  return mergeGeometries(geos) || geos[0];
})();

export const windmillRoofThatchGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const cone = new THREE.ConeGeometry(1.25, 1.1, 8); cone.translate(0, 2.75, 0); geos.push(toStandard(cone));
  const cap = new THREE.ConeGeometry(0.3, 0.3, 8).translate(0, 3.25, 0); geos.push(toStandard(cap));

  const porchM = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(0, 0, -0.92);
  const pRoof = new THREE.BoxGeometry(0.94, 0.06, 0.62);
  pRoof.applyMatrix4(new THREE.Matrix4().makeRotationX(0.2).setPosition(0, 1.02, 0.18).premultiply(porchM));
  geos.push(toStandard(pRoof));

  return mergeGeometries(geos) || geos[0];
})();

export const windmillTimberDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const wf = new THREE.BoxGeometry(0.48, 0.48, 0.12).translate(0, 1.5, 0.95);
  geos.push(toStandard(wf));
  const b = new THREE.CylinderGeometry(0.18, 0.16, 0.44, 8).translate(-0.8, 0.22, -1.0);
  geos.push(toStandard(b));
  return mergeGeometries(geos) || geos[0];
})();

export const windmillGlassGeo = (() => {
  const g = new THREE.BoxGeometry(0.4, 0.4, 0.04).translate(0, 1.5, 0.96);
  return toStandard(g);
})();

export const windmillFlourSackGeo = (() => {
  const s = new THREE.SphereGeometry(0.18, 7, 7).translate(-1.1, 0.14, -0.8);
  return toStandard(s);
})();

export const windmillSailsWoodGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const hub = new THREE.CylinderGeometry(0.14, 0.14, 0.18, 8);
  hub.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  geos.push(toStandard(hub));

  for (let bi = 0; bi < 4; bi++) {
    const spar = new THREE.BoxGeometry(0.08, 1.85, 0.05);
    spar.applyMatrix4(new THREE.Matrix4().makeRotationZ((bi * Math.PI) / 2).setPosition(0, 0, 0));
    spar.applyMatrix4(new THREE.Matrix4().setPosition(
      -Math.sin((bi * Math.PI) / 2) * 0.9,
      Math.cos((bi * Math.PI) / 2) * 0.9,
      0
    ));
    geos.push(toStandard(spar));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const windmillSailsClothGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (let bi = 0; bi < 4; bi++) {
    const cloth = new THREE.BoxGeometry(0.34, 1.45, 0.04);
    const m = new THREE.Matrix4()
      .makeRotationZ((bi * Math.PI) / 2)
      .setPosition(0, 0, 0);
    const pos = new THREE.Vector3(0.18, 0.9, 0.02).applyEuler(new THREE.Euler(0, 0, (bi * Math.PI) / 2));
    cloth.applyMatrix4(m);
    cloth.translate(pos.x, pos.y, pos.z);
    geos.push(toStandard(cloth));
  }
  return mergeGeometries(geos) || geos[0];
})();

export function WindmillModel({
  isLightOn = false,
  isWorking = true,
}: {
  isLightOn?: boolean;
  isWorking?: boolean;
}) {
  const mats = SHARED_BUILDING_MATS;
  const rootGroupRef = useRef<THREE.Group>(null);
  const windmillSailsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!rootGroupRef.current || !isObjectEffectivelyVisible(rootGroupRef.current)) return;
    if (!windmillSailsRef.current || !isWorking) return;
    const currentZoom = (window as any).__lastCameraZoom ?? DEFAULT_CAMERA_ZOOM;
    if (currentZoom <= 18.5) return;
    windmillSailsRef.current.rotation.z += delta * 0.8;
  });

  return (
    <group ref={rootGroupRef}>
      <mesh geometry={windmillStoneGeo} material={mats.stoneMed} receiveShadow />
      <mesh geometry={windmillLogsGeo} material={mats.timberLogs} castShadow receiveShadow />
      <mesh geometry={windmillRoofThatchGeo} material={mats.thatchRoof} castShadow receiveShadow />
      <mesh geometry={windmillTimberDarkGeo} material={mats.timberDark} />
      <mesh geometry={windmillGlassGeo} material={isLightOn ? mats.windowLit : mats.windowUnlit} />
      <mesh geometry={windmillFlourSackGeo} material={mats.flourSack} />

      <group position={[0, 0, -0.92]} rotation={[0, Math.PI, 0]}>
        <MedievalDoor position={[0, 0.08, 0.45]} width={0.62} height={0.88} hasCanopy={false} />
      </group>

      <group ref={windmillSailsRef} position={[0, 2.15, 1.24]}>
        <mesh geometry={windmillSailsWoodGeo} material={mats.timberDark} receiveShadow />
        <mesh geometry={windmillSailsClothGeo} material={mats.awningWhite} castShadow receiveShadow />
      </group>
    </group>
  );
}
