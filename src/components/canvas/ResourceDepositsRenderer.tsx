import { useRef, memo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useGameStore } from '../../store/useGameStore';
import type { ResourceDeposit } from '../../types/game';
import { GridMap } from '../../engine/grid/GridMap';
import { BUILDING_TEXTURES } from './buildings/buildingTextures';

const DEPOSIT_MATS = {
  waterRipple: new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.55 }),
  fishSilver: new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.85, roughness: 0.2, flatShading: true }),
  pierWood: new THREE.MeshStandardMaterial({ color: '#452a16', roughness: 0.9, flatShading: true }),
  pierPlank: new THREE.MeshStandardMaterial({ color: '#664323', roughness: 0.85, flatShading: true }),
  rope: new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.9, flatShading: true }),
  fishNet: new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.95, wireframe: true }),

  berryLeaves1: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8, flatShading: true }),
  berryLeaves2: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8, flatShading: true }),
  berryLeaves3: new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.85, flatShading: true }),
  berryStem: new THREE.MeshStandardMaterial({ color: '#3f2e18', roughness: 0.95, flatShading: true }),
  berryBlue: new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.25, metalness: 0.2, flatShading: true }),
  berryGlint: new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.2, metalness: 0.3, flatShading: true }),
  berryDark: new THREE.MeshStandardMaterial({ color: '#090914', roughness: 0.2, metalness: 0.3, flatShading: true }),
  basketWicker: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.9, flatShading: true }),

  stoneLimestone: new THREE.MeshStandardMaterial({ color: '#e7e5e4', roughness: 0.85, flatShading: true }),
  stoneRockFace: new THREE.MeshStandardMaterial({ color: '#a8a29e', roughness: 0.9, flatShading: true }),
  stoneDark: new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.95, flatShading: true }),
  craneWood: new THREE.MeshStandardMaterial({ color: '#452a16', roughness: 0.88, flatShading: true }),
  ironTool: new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.7, roughness: 0.35, flatShading: true }),

  aditBeam: new THREE.MeshStandardMaterial({ color: '#382211', roughness: 0.9, flatShading: true }),
  aditDarkness: new THREE.MeshBasicMaterial({ color: '#020617' }),
  minecartWood: new THREE.MeshStandardMaterial({ color: '#54361e', roughness: 0.85, flatShading: true }),
  minecartIron: new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.8, roughness: 0.3, flatShading: true }),
  ironOreDark: new THREE.MeshStandardMaterial({ color: '#1e232d', metalness: 0.6, roughness: 0.45, flatShading: true }),
  ironRust: new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.7, flatShading: true }),
  mineTrackWood: new THREE.MeshStandardMaterial({ color: '#27170a', roughness: 0.9, flatShading: true }),
  lanternGlow: new THREE.MeshBasicMaterial({ color: '#fbbf24' }),

  quarryRock: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneFoundation,
    color: '#8492a6',
    roughness: 0.82,
  }),
  quarryCliff: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#475569',
    roughness: 0.88,
  }),
  quarrySoil: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.soil,
    color: '#6b4c33',
    roughness: 0.94,
  }),
  quarryHematite: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#991b1b',
    roughness: 0.65,
  }),
  quarryOreDark: new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.92,
    roughness: 0.22,
    flatShading: true,
  }),
  quarryTimberLogs: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberLogs,
    color: '#cca06a',
    roughness: 0.8,
  }),
  quarryTimberPlanks: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanks,
    color: '#deb37f',
    roughness: 0.78,
  }),
  quarryVoidDepth: new THREE.MeshBasicMaterial({
    color: '#02040a',
  }),

  clayTerracotta: new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.92, flatShading: true }),
  clayWet: new THREE.MeshStandardMaterial({ color: '#6c2207', roughness: 0.4, flatShading: true }),
  clayMudWater: new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.2, metalness: 0.1 }),
  clayBrickDrying: new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.95, flatShading: true }),
  scaffoldWood: new THREE.MeshStandardMaterial({ color: '#54361e', roughness: 0.85, flatShading: true }),

  saltWhite: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35, flatShading: true }),
  saltCrystal: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.2, metalness: 0.25, flatShading: true }),
  brineWater: new THREE.MeshBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.65 }),
  boardwalkWood: new THREE.MeshStandardMaterial({ color: '#713f12', roughness: 0.85, flatShading: true }),
  barrelWood: new THREE.MeshStandardMaterial({ color: '#5c3a1d', roughness: 0.9, flatShading: true }),
  sackCloth: new THREE.MeshStandardMaterial({ color: '#d6c7a1', roughness: 0.95, flatShading: true }),

  stagFur: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85, flatShading: true }),
  doeFur: new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.85, flatShading: true }),
  fawnFur: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.8, flatShading: true }),
  deerBelly: new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.9, flatShading: true }),
  deerNose: new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4, flatShading: true }),
  deerHoof: new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.7, flatShading: true }),
  deerAntler: new THREE.MeshStandardMaterial({ color: '#f5efe6', roughness: 0.65, flatShading: true }),
  fawnSpot: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, flatShading: true }),
  mossyLog: new THREE.MeshStandardMaterial({ color: '#3f2e18', roughness: 0.9, flatShading: true }),
  mossGreen: new THREE.MeshStandardMaterial({ color: '#365314', roughness: 0.95, flatShading: true }),
  mushroomCap: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.6, flatShading: true }),
  mushroomStem: new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.8, flatShading: true }),
};

const BERRY_BUSH_CONFIGS = [
  { px: -1.15, pz: -0.75, s: 1.05, mat: DEPOSIT_MATS.berryLeaves1 },
  { px: 1.10, pz: -0.85, s: 1.0, mat: DEPOSIT_MATS.berryLeaves2 },
  { px: -1.15, pz: 0.75, s: 0.95, mat: DEPOSIT_MATS.berryLeaves3 },
  { px: 1.15, pz: 0.70, s: 1.0, mat: DEPOSIT_MATS.berryLeaves1 },
  { px: 0.05, pz: 1.10, s: 0.95, mat: DEPOSIT_MATS.berryLeaves2 },
];

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

const ironQuarryCliffGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const rimPieces = [
    { x: -1.45, z: -1.15, w: 1.25, d: 0.95, h: 0.38, rot: 0.25 },
    { x: 0.0, z: -1.45, w: 1.75, d: 0.85, h: 0.42, rot: -0.05 },
    { x: 1.45, z: -1.15, w: 1.25, d: 0.95, h: 0.36, rot: -0.3 },
    { x: 1.65, z: 0.15, w: 0.95, d: 1.45, h: 0.34, rot: 0.1 },
    { x: 1.35, z: 1.25, w: 1.15, d: 0.95, h: 0.30, rot: 0.35 },
    { x: -0.15, z: 1.45, w: 1.65, d: 0.85, h: 0.28, rot: 0.05 },
    { x: -1.45, z: 1.25, w: 1.15, d: 0.95, h: 0.32, rot: -0.25 },
    { x: -1.65, z: 0.05, w: 0.95, d: 1.45, h: 0.35, rot: -0.1 },
  ];
  for (const p of rimPieces) {
    const b = new THREE.BoxGeometry(p.w, p.h, p.d);
    b.applyMatrix4(new THREE.Matrix4().makeRotationY(p.rot).setPosition(p.x, p.h / 2, p.z));
    geos.push(toStandard(b));
  }
  return mergeGeometries(geos) || geos[0];
})();

const ironQuarryTerraceGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const ledges = [
    { x: -0.85, z: -0.75, w: 1.15, d: 0.75, h: 0.18, rot: 0.15 },
    { x: 0.75, z: -0.75, w: 1.15, d: 0.75, h: 0.16, rot: -0.15 },
    { x: 0.85, z: 0.65, w: 1.05, d: 0.75, h: 0.14, rot: 0.2 },
    { x: -0.75, z: 0.75, w: 1.15, d: 0.75, h: 0.15, rot: -0.2 },
  ];
  for (const l of ledges) {
    const b = new THREE.BoxGeometry(l.w, l.h, l.d);
    b.applyMatrix4(new THREE.Matrix4().makeRotationY(l.rot).setPosition(l.x, l.h / 2, l.z));
    geos.push(toStandard(b));
  }
  return mergeGeometries(geos) || geos[0];
})();

const ironQuarryPitFloorGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const pitBed = new THREE.CylinderGeometry(0.95, 1.25, 0.06, 9).translate(0, 0.03, 0);
  geos.push(toStandard(pitBed));
  return mergeGeometries(geos) || geos[0];
})();

const ironQuarryLogsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const [lx, lz, h] of [
    [-0.95, -0.95, 0.45],
    [0.95, -0.95, 0.42],
    [1.05, 0.75, 0.38],
    [-0.95, 0.85, 0.38],
  ]) {
    const post = new THREE.BoxGeometry(0.10, h, 0.10).translate(lx, h / 2, lz);
    geos.push(toStandard(post));
  }

  const beamN = new THREE.BoxGeometry(2.0, 0.08, 0.10).translate(0, 0.34, -0.95);
  const beamE = new THREE.BoxGeometry(0.10, 0.08, 1.8).translate(1.0, 0.30, -0.1);
  const beamW = new THREE.BoxGeometry(0.10, 0.08, 1.9).translate(-0.95, 0.30, -0.05);
  geos.push(toStandard(beamN), toStandard(beamE), toStandard(beamW));

  const ladderM = new THREE.Matrix4().makeRotationX(-0.48).setPosition(-0.35, 0.18, 0.55);
  for (const rx of [-0.14, 0.14]) {
    const rail = new THREE.BoxGeometry(0.04, 0.65, 0.04).translate(rx, 0, 0);
    rail.applyMatrix4(ladderM);
    geos.push(toStandard(rail));
  }
  for (let r = -2; r <= 2; r++) {
    const rung = new THREE.BoxGeometry(0.28, 0.03, 0.03).translate(0, r * 0.11, 0);
    rung.applyMatrix4(ladderM);
    geos.push(toStandard(rung));
  }

  const pickM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.4, 0.3, -0.5)).setPosition(-0.75, 0.12, 0.45);
  const pHandle = new THREE.CylinderGeometry(0.020, 0.020, 0.65, 5).translate(0, 0.25, 0).applyMatrix4(pickM);
  geos.push(toStandard(pHandle));

  return mergeGeometries(geos) || geos[0];
})();

const ironQuarryHematiteGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const [ox, oz, r, yOff] of [
    [-0.45, -0.45, 0.28, 0.05],
    [0.45, -0.35, 0.26, 0.05],
    [-0.35, 0.35, 0.24, 0.05],
    [0.35, 0.45, 0.26, 0.05],
    [0.0, 0.0, 0.22, 0.04],
    [-1.05, -0.45, 0.22, 0.16],
    [0.95, -0.25, 0.25, 0.15],
    [-0.85, 0.55, 0.20, 0.14],
    [0.85, 0.55, 0.22, 0.14],
  ]) {
    const chunk = new THREE.DodecahedronGeometry(r, 0).translate(ox, yOff + r * 0.65, oz);
    geos.push(toStandard(chunk));
  }

  return mergeGeometries(geos) || geos[0];
})();

const ironQuarryOreDarkGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];

  for (const [ox, oz, r, yOff] of [
    [0.25, -0.15, 0.26, 0.04],
    [-0.20, -0.10, 0.25, 0.04],
    [0.10, 0.25, 0.24, 0.04],
    [-0.65, -0.85, 0.26, 0.16],
    [0.65, -0.85, 0.28, 0.16],
    [-1.25, 0.25, 0.22, 0.30],
    [1.25, 0.25, 0.24, 0.30],
    [0.0, -1.25, 0.25, 0.36],
  ]) {
    const chunk = new THREE.DodecahedronGeometry(r, 0).translate(ox, yOff + r * 0.65, oz);
    geos.push(toStandard(chunk));
  }

  return mergeGeometries(geos) || geos[0];
})();

const wildGameLogGeo = (() => {
  const logM = new THREE.Matrix4().makeRotationY(0.35).setPosition(0.1, 0.14, -0.5);
  const log = new THREE.CylinderGeometry(0.18, 0.22, 2.4, 6).rotateZ(Math.PI / 2).applyMatrix4(logM);
  return toStandard(log);
})();

const wildGameMossGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const logM = new THREE.Matrix4().makeRotationY(0.35).setPosition(0.1, 0.14, -0.5);
  const m1 = new THREE.BoxGeometry(0.45, 0.06, 0.22).translate(0.4, 0.16, 0).applyMatrix4(logM);
  const m2 = new THREE.BoxGeometry(0.38, 0.06, 0.20).translate(-0.5, 0.15, 0.05).applyMatrix4(logM);
  geos.push(toStandard(m1), toStandard(m2));
  return mergeGeometries(geos) || geos[0];
})();

const stagBodyGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(0.44, 0.36, 0.78).translate(0, 0.48, 0);
  const belly = new THREE.BoxGeometry(0.36, 0.10, 0.68).translate(0, 0.34, 0);
  geos.push(toStandard(body), toStandard(belly));

  for (const lx of [-0.16, 0.16]) {
    for (const lz of [-0.28, 0.28]) {
      const leg = new THREE.CylinderGeometry(0.03, 0.024, 0.46, 5).translate(lx, 0.20, lz);
      const hoof = new THREE.BoxGeometry(0.05, 0.04, 0.05).translate(lx, 0.02, lz);
      geos.push(toStandard(leg), toStandard(hoof));
    }
  }
  return mergeGeometries(geos) || geos[0];
})();

const stagHeadGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const neck = new THREE.CylinderGeometry(0.10, 0.15, 0.44, 6).rotateX(-0.45).translate(0, 0.20, 0.08);
  const head = new THREE.BoxGeometry(0.18, 0.18, 0.26).translate(0, 0.38, 0.20);
  const nose = new THREE.BoxGeometry(0.08, 0.06, 0.04).translate(0, 0.34, 0.34);
  geos.push(toStandard(neck), toStandard(head), toStandard(nose));

  for (const side of [-1, 1]) {
    const ear = new THREE.BoxGeometry(0.05, 0.14, 0.03);
    ear.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.2, side * 0.4, side * 0.35)).setPosition(side * 0.11, 0.48, 0.14));
    geos.push(toStandard(ear));

    const antRootM = new THREE.Matrix4().setPosition(side * 0.08, 0.46, 0.14);
    const a1 = new THREE.CylinderGeometry(0.02, 0.028, 0.44, 4);
    a1.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.35, side * 0.2, side * 0.3)).setPosition(side * 0.06, 0.18, -0.04).premultiply(antRootM));
    const a2 = new THREE.CylinderGeometry(0.014, 0.02, 0.20, 4);
    a2.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.85, side * 0.15, 0)).setPosition(side * 0.02, 0.10, 0.08).premultiply(antRootM));
    const a3 = new THREE.CylinderGeometry(0.014, 0.018, 0.22, 4);
    a3.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.2, side * 0.3, side * 0.5)).setPosition(side * 0.12, 0.34, -0.08).premultiply(antRootM));
    geos.push(toStandard(a1), toStandard(a2), toStandard(a3));
  }
  return mergeGeometries(geos) || geos[0];
})();

const doeBodyGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(0.38, 0.3, 0.66).translate(0, 0.42, 0);
  const belly = new THREE.BoxGeometry(0.30, 0.08, 0.58).translate(0, 0.30, 0);
  geos.push(toStandard(body), toStandard(belly));

  for (const lx of [-0.14, 0.14]) {
    for (const lz of [-0.24, 0.24]) {
      const leg = new THREE.CylinderGeometry(0.026, 0.022, 0.4, 5).translate(lx, 0.18, lz);
      const hoof = new THREE.BoxGeometry(0.045, 0.035, 0.045).translate(lx, 0.02, lz);
      geos.push(toStandard(leg), toStandard(hoof));
    }
  }
  return mergeGeometries(geos) || geos[0];
})();

const doeHeadGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const neck = new THREE.CylinderGeometry(0.09, 0.13, 0.34, 6).rotateX(-0.25).translate(0, 0.15, 0.05);
  const head = new THREE.BoxGeometry(0.14, 0.14, 0.20).translate(0, 0.30, 0.15);
  const nose = new THREE.BoxGeometry(0.06, 0.04, 0.03).translate(0, 0.28, 0.26);
  geos.push(toStandard(neck), toStandard(head), toStandard(nose));

  for (const side of [-1, 1]) {
    const ear = new THREE.BoxGeometry(0.04, 0.12, 0.025);
    ear.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.2, side * 0.4, side * 0.35)).setPosition(side * 0.08, 0.38, 0.10));
    geos.push(toStandard(ear));
  }
  return mergeGeometries(geos) || geos[0];
})();

const fawnBodyGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(0.25, 0.2, 0.42).translate(0, 0.26, 0);
  const belly = new THREE.BoxGeometry(0.20, 0.06, 0.36).translate(0, 0.18, 0);
  geos.push(toStandard(body), toStandard(belly));

  for (const sx of [-0.09, 0.09]) {
    for (const sz of [-0.10, 0.0, 0.10]) {
      const spot = new THREE.SphereGeometry(0.02, 4, 4).translate(sx, 0.34, sz);
      geos.push(toStandard(spot));
    }
    for (const lz of [-0.15, 0.15]) {
      const leg = new THREE.CylinderGeometry(0.018, 0.015, 0.24, 4).translate(sx, 0.11, lz);
      geos.push(toStandard(leg));
    }
  }

  const head = new THREE.BoxGeometry(0.11, 0.22, 0.14).rotateX(-0.3).translate(0, 0.36, 0.16);
  const nose = new THREE.BoxGeometry(0.045, 0.03, 0.025).translate(0, 0.34, 0.24);
  geos.push(toStandard(head), toStandard(nose));

  return mergeGeometries(geos) || geos[0];
})();

export function ResourceDepositsRenderer({ grid }: { grid?: GridMap }) {
  const resourceDeposits = useGameStore((state) => state.resourceDeposits);
  const selectedEntityId = useGameStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useGameStore((state) => state.setSelectedEntityId);
  const isStrategicView = useGameStore((state) => state.isStrategicView);

  if (!resourceDeposits || resourceDeposits.length === 0) return null;

  return (
    <group dispose={null} visible={!isStrategicView}>
      {!isStrategicView && resourceDeposits.map((dep) => (
        <DepositNodeMemo
          key={dep.id}
          deposit={dep}
          grid={grid}
          isSelected={selectedEntityId === dep.id}
          onSelect={() => setSelectedEntityId(dep.id)}
        />
      ))}
    </group>
  );
}

const DepositNodeMemo = memo(DepositNode);

function DepositNode({
  deposit,
  grid,
  isSelected,
  onSelect,
}: {
  deposit: ResourceDeposit;
  grid?: GridMap;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const nodeRef = useRef<THREE.Group>(null);
  const fishRef = useRef<THREE.Group>(null);
  const stagHeadRef = useRef<THREE.Group>(null);
  const doe1HeadRef = useRef<THREE.Group>(null);
  const doe2HeadRef = useRef<THREE.Group>(null);
  const [showBadge, setShowBadge] = useState(false);
  const inViewRef = useRef(false);
  const showBadgeRef = useRef(false);
  const frameCount = useRef(0);

  const [x, , z] = deposit.position;
  const gx = Math.floor(x);
  const gz = Math.floor(z);
  const groundH = grid?.getTile(gx, gz)?.height ?? 0.05;
  const y = deposit.type === 'fish' ? 0.05 : Math.max(deposit.position[1] ?? 0.1, groundH + 0.02);

  useFrame(({ camera, clock }) => {
    frameCount.current++;

    if (frameCount.current % 15 === 0 || frameCount.current === 1) {
      const zoom = (window as any).__lastCameraZoom ?? (camera as THREE.OrthographicCamera).zoom ?? 38;
      const camTarget = (window as any).__lastCameraTarget as [number, number] | undefined;
      const targetX = camTarget ? camTarget[0] : camera.position.x;
      const targetZ = camTarget ? camTarget[1] : camera.position.z;
      const distSq = (x - targetX) * (x - targetX) + (z - targetZ) * (z - targetZ);

      const maxDist = Math.max(50, (1800 / zoom) + 16);
      const shouldBeInView = distSq < maxDist * maxDist;
      inViewRef.current = shouldBeInView;
      const shouldShowBadge = isSelected || (shouldBeInView && zoom >= 18 && distSq < 36 * 36);
      if (shouldShowBadge !== showBadgeRef.current) {
        showBadgeRef.current = shouldShowBadge;
        setShowBadge(shouldShowBadge);
      }
      if (nodeRef.current && nodeRef.current.visible !== shouldBeInView) {
        nodeRef.current.visible = shouldBeInView;
      }
    }

    if (!inViewRef.current) return;

    const t = clock.getElapsedTime();

    if (fishRef.current && deposit.type === 'fish') {
      const fishCycle = (t * 2.2 + deposit.position[0]) % (Math.PI * 2);
      if (fishCycle < Math.PI) {
        fishRef.current.position.y = Math.sin(fishCycle) * 0.55;
        fishRef.current.position.x = Math.cos(fishCycle) * 0.5;
        fishRef.current.rotation.z = -Math.cos(fishCycle) * 0.8;
        fishRef.current.visible = true;
      } else {
        fishRef.current.position.y = -0.2;
        fishRef.current.visible = false;
      }
    }

    if (deposit.type === 'wild_game') {
      if (stagHeadRef.current) {
        stagHeadRef.current.rotation.y = Math.sin(t * 0.6) * 0.35;
      }
      if (doe1HeadRef.current) {
        doe1HeadRef.current.rotation.x = -0.6 + Math.sin(t * 1.8) * 0.2;
      }
      if (doe2HeadRef.current) {
        doe2HeadRef.current.rotation.y = Math.cos(t * 0.8 + 1.2) * 0.4;
      }
    }
  });

  const fillPercent = Math.max(0, Math.min(100, Math.round((deposit.currentAmount / deposit.maxAmount) * 100)));

  let badgeY = 1.6;
  if (deposit.type === 'stone') badgeY = 2.4;
  else if (deposit.type === 'iron') badgeY = 2.3;
  else if (deposit.type === 'wild_game') badgeY = 1.8;
  else if (deposit.type === 'berries') badgeY = 1.7;

  return (
    <group
      ref={nodeRef}
      position={[x, y, z]}
      dispose={null}
    >
      <group raycast={() => null}>
        {deposit.type === 'fish' && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={DEPOSIT_MATS.waterRipple}>
            <ringGeometry args={[0.9, 1.4, 24]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0.02, -0.5]} material={DEPOSIT_MATS.waterRipple}>
            <ringGeometry args={[0.45, 0.75, 18]} />
          </mesh>

          <group position={[-0.85, 0.15, 0.1]}>
            {[-0.35, 0.35].map((px, i) =>
              [-0.65, 0.65].map((pz, j) => (
                <mesh key={`${i}-${j}`} position={[px, 0.05, pz]} material={DEPOSIT_MATS.pierWood}>
                  <cylinderGeometry args={[0.05, 0.05, 0.55, 6]} />
                </mesh>
              ))
            )}
            <mesh position={[0, 0.28, 0]} material={DEPOSIT_MATS.pierPlank}>
              <boxGeometry args={[0.95, 0.08, 1.7]} />
            </mesh>
            <mesh position={[0.38, 0.42, 0.75]} material={DEPOSIT_MATS.pierWood}>
              <cylinderGeometry args={[0.045, 0.05, 0.28, 6]} />
            </mesh>
            <mesh position={[-0.38, 0.42, 0.75]} material={DEPOSIT_MATS.pierWood}>
              <cylinderGeometry args={[0.045, 0.05, 0.28, 6]} />
            </mesh>
            <mesh position={[0, 0.33, -0.4]} rotation={[-Math.PI / 2, 0, 0]} material={DEPOSIT_MATS.fishNet}>
              <planeGeometry args={[0.7, 0.35]} />
            </mesh>
          </group>

          <group position={[-0.1, 0.08, 1.0]} rotation={[0, 0.25, 0]}>
            <mesh material={DEPOSIT_MATS.pierWood}>
              <boxGeometry args={[0.6, 0.22, 1.3]} />
            </mesh>
            <mesh position={[0, 0.07, 0]} material={DEPOSIT_MATS.pierPlank}>
              <boxGeometry args={[0.48, 0.16, 1.15]} />
            </mesh>
            <mesh position={[0, 0.12, 0.1]} material={DEPOSIT_MATS.pierWood}>
              <boxGeometry args={[0.48, 0.06, 0.2]} />
            </mesh>
          </group>

          <group ref={fishRef} position={[0.35, 0, -0.2]}>
            <mesh material={DEPOSIT_MATS.fishSilver}>
              <boxGeometry args={[0.34, 0.12, 0.08]} />
            </mesh>
            <mesh position={[-0.2, 0.03, 0]} rotation={[0, 0, 0.3]} material={DEPOSIT_MATS.fishSilver}>
              <boxGeometry args={[0.14, 0.18, 0.03]} />
            </mesh>
          </group>
        </group>
      )}

      {deposit.type === 'berries' && (
        <group>
          {BERRY_BUSH_CONFIGS.map((b, i) => (
            <group key={i} position={[b.px, 0, b.pz]} scale={[b.s, b.s, b.s]}>

              <mesh position={[0, 0.15, 0]} material={DEPOSIT_MATS.berryStem}>
                <cylinderGeometry args={[0.05, 0.08, 0.35, 5]} />
              </mesh>

              <mesh position={[0, 0.45, 0]} material={b.mat}>
                <dodecahedronGeometry args={[0.65, 1]} />
              </mesh>
              <mesh position={[0.2, 0.35, 0.15]} material={b.mat}>
                <dodecahedronGeometry args={[0.48, 1]} />
              </mesh>
              <mesh position={[-0.2, 0.32, -0.12]} material={b.mat}>
                <dodecahedronGeometry args={[0.42, 1]} />
              </mesh>

              <mesh position={[0.38, 0.54, 0.30]} material={DEPOSIT_MATS.berryDark}>
                <sphereGeometry args={[0.15, 6, 5]} />
              </mesh>
              <mesh position={[-0.34, 0.60, -0.28]} material={DEPOSIT_MATS.berryDark}>
                <sphereGeometry args={[0.14, 6, 5]} />
              </mesh>
              <mesh position={[0.06, 0.80, 0.16]} material={DEPOSIT_MATS.berryDark}>
                <sphereGeometry args={[0.14, 6, 5]} />
              </mesh>
              <mesh position={[-0.42, 0.36, 0.18]} material={DEPOSIT_MATS.berryDark}>
                <sphereGeometry args={[0.14, 6, 5]} />
              </mesh>

              <mesh position={[-0.36, 0.46, 0.34]} material={DEPOSIT_MATS.berryBlue}>
                <sphereGeometry args={[0.15, 6, 5]} />
              </mesh>
              <mesh position={[0.44, 0.38, -0.22]} material={DEPOSIT_MATS.berryBlue}>
                <sphereGeometry args={[0.14, 6, 5]} />
              </mesh>
              <mesh position={[-0.10, 0.74, -0.22]} material={DEPOSIT_MATS.berryBlue}>
                <sphereGeometry args={[0.14, 6, 5]} />
              </mesh>

              <mesh position={[0.14, 0.78, -0.14]} material={DEPOSIT_MATS.berryGlint}>
                <sphereGeometry args={[0.14, 6, 5]} />
              </mesh>
              <mesh position={[0.36, 0.28, 0.22]} material={DEPOSIT_MATS.berryGlint}>
                <sphereGeometry args={[0.13, 6, 5]} />
              </mesh>
            </group>
          ))}

          <group position={[-0.25, 0, -0.7]}>
            <mesh position={[0, 0.18, 0]} material={DEPOSIT_MATS.berryStem}>
              <cylinderGeometry args={[0.26, 0.3, 0.36, 6]} />
            </mesh>
            <mesh position={[0, 0.37, 0]} material={DEPOSIT_MATS.mossGreen}>
              <circleGeometry args={[0.24, 6]} />
            </mesh>
          </group>

          <group position={[0.75, 0, 0.2]} rotation={[0, -0.4, 0.1]}>
            <mesh position={[0, 0.15, 0]} material={DEPOSIT_MATS.basketWicker}>
              <cylinderGeometry args={[0.24, 0.18, 0.3, 8]} />
            </mesh>
            <mesh position={[-0.04, 0.27, 0]} material={DEPOSIT_MATS.berryDark}>
              <sphereGeometry args={[0.18, 7, 5]} />
            </mesh>
            <mesh position={[0.06, 0.28, 0.04]} material={DEPOSIT_MATS.berryBlue}>
              <sphereGeometry args={[0.16, 7, 5]} />
            </mesh>
          </group>
        </group>
      )}

      {deposit.type === 'stone' && (
        <group>
          <mesh position={[-0.5, 0.75, -0.55]} rotation={[0.05, 0.2, -0.05]} material={DEPOSIT_MATS.stoneRockFace}>
            <boxGeometry args={[2.8, 1.5, 1.5]} />
          </mesh>
          <mesh position={[0.7, 0.42, -0.35]} rotation={[-0.05, -0.15, 0.05]} material={DEPOSIT_MATS.stoneLimestone}>
            <boxGeometry args={[1.8, 0.85, 1.2]} />
          </mesh>
          <mesh position={[-0.85, 0.25, 0.55]} rotation={[0.1, -0.4, 0.1]} material={DEPOSIT_MATS.stoneDark}>
            <boxGeometry args={[1.2, 0.5, 1.0]} />
          </mesh>

          <group position={[0.55, 0, 0.55]} rotation={[0, -0.35, 0]}>
            <mesh position={[0, 1.2, 0]} material={DEPOSIT_MATS.craneWood}>
              <cylinderGeometry args={[0.08, 0.11, 2.4, 6]} />
            </mesh>
            <mesh position={[-0.55, 1.8, -0.25]} rotation={[0, 0.4, 0.7]} material={DEPOSIT_MATS.craneWood}>
              <boxGeometry args={[0.08, 1.6, 0.08]} />
            </mesh>
            <mesh position={[-1.0, 1.2, -0.45]} material={DEPOSIT_MATS.rope}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 4]} />
            </mesh>
            <mesh position={[-1.0, 0.65, -0.45]} material={DEPOSIT_MATS.stoneLimestone}>
              <boxGeometry args={[0.55, 0.35, 0.4]} />
            </mesh>
          </group>

          <mesh position={[-0.25, 0.14, 0.85]} material={DEPOSIT_MATS.stoneLimestone}>
            <boxGeometry args={[0.65, 0.28, 0.45]} />
          </mesh>
          <mesh position={[-0.32, 0.38, 0.8]} material={DEPOSIT_MATS.stoneLimestone}>
            <boxGeometry args={[0.52, 0.22, 0.38]} />
          </mesh>
          <mesh position={[1.1, 0.12, 0.2]} material={DEPOSIT_MATS.stoneLimestone}>
            <dodecahedronGeometry args={[0.24, 0]} />
          </mesh>
          <mesh position={[0.85, 0.1, 0.85]} material={DEPOSIT_MATS.stoneRockFace}>
            <dodecahedronGeometry args={[0.2, 0]} />
          </mesh>
        </group>
      )}

      {deposit.type === 'iron' && (
        <group>
          <mesh geometry={ironQuarryCliffGeo} material={DEPOSIT_MATS.quarryCliff} receiveShadow />
          <mesh geometry={ironQuarryTerraceGeo} material={DEPOSIT_MATS.quarryRock} receiveShadow />
          <mesh geometry={ironQuarryPitFloorGeo} material={DEPOSIT_MATS.quarryVoidDepth} receiveShadow />
          <mesh geometry={ironQuarryLogsGeo} material={DEPOSIT_MATS.quarryTimberLogs} />
          <mesh geometry={ironQuarryHematiteGeo} material={DEPOSIT_MATS.quarryHematite} />
          <mesh geometry={ironQuarryOreDarkGeo} material={DEPOSIT_MATS.quarryOreDark} />

          <mesh position={[0.95, 0.48, -0.95]} material={DEPOSIT_MATS.lanternGlow}>
            <sphereGeometry args={[0.06, 6, 6]} />
          </mesh>
          <mesh position={[-0.95, 0.45, 0.85]} material={DEPOSIT_MATS.lanternGlow}>
            <sphereGeometry args={[0.06, 6, 6]} />
          </mesh>

          <mesh position={[1.15, 0.28, 0.65]} material={DEPOSIT_MATS.basketWicker}>
            <cylinderGeometry args={[0.22, 0.16, 0.26, 8]} />
          </mesh>
          <mesh position={[-0.75, 0.42 + 0.65, 0.45]} material={DEPOSIT_MATS.ironTool} rotation={[0.4, 0.3, -0.5]}>
            <boxGeometry args={[0.32, 0.08, 0.05]} />
          </mesh>
        </group>
      )}

      {deposit.type === 'clay' && (
        <group>
          <mesh position={[0, 0.14, 0]} material={DEPOSIT_MATS.clayTerracotta}>
            <cylinderGeometry args={[2.2, 2.6, 0.28, 9]} />
          </mesh>
          <mesh position={[0.12, 0.24, -0.12]} material={DEPOSIT_MATS.clayWet}>
            <cylinderGeometry args={[1.3, 1.6, 0.22, 8]} />
          </mesh>
          <mesh position={[0.12, 0.36, -0.12]} rotation={[-Math.PI / 2, 0, 0]} material={DEPOSIT_MATS.clayMudWater}>
            <circleGeometry args={[0.75, 12]} />
          </mesh>

          <group position={[-1.0, 0.2, 0.65]} rotation={[0, 0.35, 0]}>
            {[-0.45, 0.45].map((rx, i) => (
              <mesh key={i} position={[rx, 0.26, 0]} material={DEPOSIT_MATS.scaffoldWood}>
                <cylinderGeometry args={[0.04, 0.04, 0.58, 5]} />
              </mesh>
            ))}
            <mesh position={[0, 0.46, 0]} material={DEPOSIT_MATS.scaffoldWood}>
              <boxGeometry args={[1.05, 0.04, 0.32]} />
            </mesh>
            {[-0.32, 0, 0.32].map((bx, j) => (
              <mesh key={j} position={[bx, 0.54, 0]} material={DEPOSIT_MATS.clayBrickDrying}>
                <boxGeometry args={[0.22, 0.12, 0.18]} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {deposit.type === 'salt' && (
        <group>
          <mesh position={[0, 0.1, 0]} material={DEPOSIT_MATS.saltWhite}>
            <cylinderGeometry args={[1.8, 2.2, 0.2, 9]} />
          </mesh>
          <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]} material={DEPOSIT_MATS.brineWater}>
            <circleGeometry args={[1.0, 14]} />
          </mesh>
          <mesh position={[-0.6, 0.32, 0.45]} rotation={[0.2, 0.3, 0.1]} material={DEPOSIT_MATS.saltCrystal}>
            <boxGeometry args={[0.48, 0.4, 0.42]} />
          </mesh>
          <mesh position={[0.65, 0.28, -0.4]} rotation={[-0.1, 0.5, -0.2]} material={DEPOSIT_MATS.saltWhite}>
            <boxGeometry args={[0.38, 0.32, 0.34]} />
          </mesh>

          <mesh position={[0.25, 0.24, 1.05]} material={DEPOSIT_MATS.boardwalkWood}>
            <boxGeometry args={[1.9, 0.07, 0.48]} />
          </mesh>
          <group position={[-1.05, 0.18, 0.4]}>
            <mesh position={[0, 0.22, 0]} material={DEPOSIT_MATS.barrelWood}>
              <cylinderGeometry args={[0.24, 0.24, 0.44, 8]} />
            </mesh>
            <mesh position={[0, 0.44, 0]} material={DEPOSIT_MATS.saltWhite}>
              <sphereGeometry args={[0.2, 7, 5]} />
            </mesh>
          </group>
        </group>
      )}

      {deposit.type === 'wild_game' && (
        <group>
          <mesh geometry={wildGameLogGeo} material={DEPOSIT_MATS.mossyLog} />
          <mesh geometry={wildGameMossGeo} material={DEPOSIT_MATS.mossGreen} />

          <group position={[0.8, 0, 0.4]} rotation={[0, -0.8, 0]}>
            <mesh geometry={stagBodyGeo} material={DEPOSIT_MATS.stagFur} />
            <group ref={stagHeadRef} position={[0, 0.65, 0.32]}>
              <mesh geometry={stagHeadGeo} material={DEPOSIT_MATS.stagFur} />
            </group>
          </group>

          <group position={[-0.95, 0, 0.35]} rotation={[0, 0.6, 0]}>
            <mesh geometry={doeBodyGeo} material={DEPOSIT_MATS.doeFur} />
            <group ref={doe1HeadRef} position={[0, 0.46, 0.3]}>
              <mesh geometry={doeHeadGeo} material={DEPOSIT_MATS.doeFur} />
            </group>
          </group>

          <group position={[-0.55, 0, -1.05]} rotation={[0, 2.2, 0]}>
            <mesh geometry={doeBodyGeo} material={DEPOSIT_MATS.doeFur} />
            <group ref={doe2HeadRef} position={[0, 0.54, 0.28]}>
              <mesh geometry={doeHeadGeo} material={DEPOSIT_MATS.doeFur} />
            </group>
          </group>

          <group position={[0.25, 0, -1.0]} rotation={[0, -0.4, 0]}>
            <mesh geometry={fawnBodyGeo} material={DEPOSIT_MATS.fawnFur} />
          </group>
        </group>
      )}
    </group>

      <mesh
        position={[0, 0.75, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <cylinderGeometry args={[2.0, 2.0, 1.5, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.9, 32]} />
          <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
        </mesh>
      )}

      {showBadge && (
        <Html
          position={[0, badgeY, 0]}
          center
          zIndexRange={[10, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`group flex flex-col items-center select-none pointer-events-auto cursor-pointer ${
              isSelected ? 'scale-110 -translate-y-1' : 'opacity-95'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg ${
                deposit.isRich
                  ? 'bg-amber-950 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-stone-950 border border-amber-600/70 shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
              }`}
            >
              {deposit.isRich && (
                <span className="text-amber-400 text-xs font-bold -ml-0.5" title="Багате родовище">
                  👑
                </span>
              )}

              <span className="text-sm leading-none drop-shadow">{deposit.icon}</span>

              <div className="flex items-baseline gap-0.5 text-xs font-bold tracking-tight">
                <span className={deposit.currentAmount > 0 ? (deposit.isRich ? 'text-amber-300' : 'text-stone-100') : 'text-red-400'}>
                  {deposit.currentAmount}
                </span>
                <span className="text-[10px] text-stone-400 font-normal">/</span>
                <span className="text-[10px] text-stone-400 font-normal">{deposit.maxAmount}</span>
              </div>
            </div>

            <div className="w-10 h-1 bg-stone-900 rounded-full mt-0.5 overflow-hidden border border-stone-800">
              <div
                className={`h-full ${
                  deposit.isRich ? 'bg-gradient-to-r from-amber-500 to-yellow-300' : 'bg-amber-500'
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>

            {isSelected && (
              <div className="mt-1 px-2 py-0.5 bg-stone-950 border border-amber-500/70 rounded text-[10px] font-medium text-amber-200 shadow-xl whitespace-nowrap">
                {deposit.name}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
