import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../buildingMaterials';
import { isObjectEffectivelyVisible } from '../common/BuildingPrimitives';
import { useGameStore } from '../../../../store/useGameStore';
import type { BackyardExtensionType } from '../../../../types/game';

type Vec = [number, number, number];
const mats = {
  ...SHARED_BUILDING_MATS,
  straw: new THREE.MeshStandardMaterial({ color: '#c6a156', roughness: 1 }),
  carrot: new THREE.MeshStandardMaterial({ color: '#d47729', roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: '#4d8490', roughness: 0.3, metalness: 0.15 }),
  cabbage: new THREE.MeshStandardMaterial({ color: '#769343', roughness: 1 }),
  chickenCream: new THREE.MeshStandardMaterial({ color: '#e9d4ad', roughness: 1 }),
  chickenBrown: new THREE.MeshStandardMaterial({ color: '#9b5c32', roughness: 1 }),
  goatCream: new THREE.MeshStandardMaterial({ color: '#cbbca0', roughness: 1 }),
  goatBrown: new THREE.MeshStandardMaterial({ color: '#92765b', roughness: 1 }),
};
type Mat = keyof typeof mats;
type Part = { geometry: THREE.BufferGeometry; material: THREE.Material };

function builder() {
  const groups = new Map<Mat, THREE.BufferGeometry[]>();
  const add = (mat: Mat, geo: THREE.BufferGeometry, pos: Vec, rotation: Vec = [0, 0, 0]) => {
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)).setPosition(...pos));
    if (!groups.has(mat)) groups.set(mat, []);
    groups.get(mat)!.push(geo.index ? geo.toNonIndexed() : geo);
  };
  const box = (mat: Mat, size: Vec, pos: Vec, rotation?: Vec) => add(mat, new THREE.BoxGeometry(...size), pos, rotation);
  const cylinder = (mat: Mat, top: number, bottom: number, height: number, pos: Vec, rotation?: Vec, open = false) =>
    add(mat, new THREE.CylinderGeometry(top, bottom, height, 12, 1, open), pos, rotation);
  const ball = (mat: Mat, size: Vec, pos: Vec) => add(mat, new THREE.SphereGeometry(1, 8, 6).scale(...size), pos);
  const beam = (mat: Mat, a: Vec, b: Vec, width: number) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    const geo = new THREE.BoxGeometry(width, direction.length(), width);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
    add(mat, geo, start.add(end).multiplyScalar(0.5).toArray() as Vec);
  };
  const ring = (mat: Mat, radius: number, thickness: number, pos: Vec, rotation: Vec = [Math.PI / 2, 0, 0]) =>
    add(mat, new THREE.TorusGeometry(radius, thickness, 4, 12), pos, rotation);
  const finish = (): Part[] => [...groups].map(([mat, geos]) => ({ geometry: mergeGeometries(geos)!, material: mats[mat] }));
  return { add, box, cylinder, ball, beam, ring, finish };
}
type Builder = ReturnType<typeof builder>;

function roof(b: Builder, x: number, z: number, width: number, depth: number, eave: number, rise: number, mat: Mat) {
  const half = depth / 2, angle = Math.atan2(rise, half), length = Math.hypot(half, rise);
  for (const side of [-1, 1]) {
    b.box(mat, [width, 0.045, length], [x, eave + rise / 2, z + side * half / 2], [side * angle, 0, 0]);
    b.beam('timberDark', [x - width / 2, eave, z + side * half], [x - width / 2, eave + rise, z], 0.04);
    b.beam('timberDark', [x + width / 2, eave, z + side * half], [x + width / 2, eave + rise, z], 0.04);
  }
  b.box('timberDark', [width + 0.03, 0.05, 0.07], [x, eave + rise + 0.015, z]);
}

function barrel(b: Builder, x: number, z: number, radius = 0.13, height = 0.33, open = false) {
  b.cylinder('timberPlanks', radius * 0.86, radius, height / 2, [x, height * 0.75, z], undefined, open);
  b.cylinder('timberPlanks', radius, radius * 0.86, height / 2, [x, height * 0.25, z], undefined, open);
  for (const y of [height * 0.12, height * 0.52, height * 0.90]) b.ring('ironHardware', radius * 0.97, 0.012, [x, y, z]);
  if (!open) b.cylinder('timberLight', radius * 0.84, radius * 0.84, 0.022, [x, height + 0.003, z]);
  else b.cylinder('charcoalBlack', radius * 0.77, radius * 0.77, 0.012, [x, height * 0.28, z]);
}

function trough(b: Builder, x: number, z: number, width: number, fill: Mat) {
  b.box('timberDark', [width, 0.025, 0.20], [x, 0.045, z]);
  for (const side of [-1, 1]) {
    b.box('timberMed', [width, 0.12, 0.025], [x, 0.10, z + side * 0.10]);
    b.box('timberMed', [0.025, 0.12, 0.20], [x + side * width / 2, 0.10, z]);
  }
  b.box(fill, [width - 0.04, 0.014, 0.17], [x, 0.10, z]);
}

function bench(b: Builder, x: number, z: number, width = 0.90) {
  b.box('timberLight', [width, 0.06, 0.38], [x, 0.40, z]);
  for (const dx of [-width * 0.38, width * 0.38]) {
    for (const dz of [-0.13, 0.13]) b.box('timberDark', [0.055, 0.38, 0.055], [x + dx, 0.19, z + dz]);
    b.box('timberMed', [0.06, 0.05, 0.32], [x + dx, 0.16, z]);
  }
  b.box('timberDark', [width - 0.15, 0.045, 0.05], [x, 0.15, z]);
}

function canopy(b: Builder, x: number, z: number, width: number) {
  for (const dx of [-width / 2 + 0.08, width / 2 - 0.08]) for (const dz of [-0.27, 0.27]) {
    b.box('timberDark', [0.055, 0.90, 0.055], [x + dx, 0.45, z + dz]);
    b.beam('timberMed', [x + dx, 0.64, z + dz], [x + dx * 0.68, 0.88, z + dz], 0.045);
  }
  b.box('timberDark', [width, 0.06, 0.06], [x, 0.88, z + 0.27]);
  b.box('timberPlanks', [width, 0.045, 0.76], [x, 0.94, z], [-0.16, 0, 0]);
}

function garden() {
  const b = builder();
  for (const x of [-0.91, 0.91]) {
    b.box('richSoil', [1.12, 0.055, 0.91], [x, 0.028, -1.73]);
    for (const side of [-1, 1]) {
      b.box('timberDark', [1.18, 0.065, 0.025], [x, 0.045, -1.73 + side * 0.47]);
      b.box('timberDark', [0.025, 0.065, 0.92], [x + side * 0.575, 0.045, -1.73]);
    }
    for (let row = 0; row < 3; row++) b.box('richSoil', [0.94, 0.025, 0.085], [x, 0.06, -2.02 + row * 0.29]);
  }
  for (let col = 0; col < 4; col++) for (let row = 0; row < 3; row++) {
    const x = -1.32 + col * 0.27, z = -2.02 + row * 0.29;
    b.ball('cabbage', [0.085, 0.07, 0.085], [x, 0.125, z]);
    for (const side of [-1, 1]) {
      b.ball('leafGreen', [0.08, 0.018, 0.07], [x + side * 0.055, 0.09, z]);
      b.ball('leafGreen', [0.07, 0.018, 0.08], [x, 0.09, z + side * 0.05]);
    }
    const cx = 0.50 + col * 0.27;
    b.cylinder('carrot', 0.035, 0.012, 0.055, [cx, 0.08, z]);
    for (const side of [-1, 0, 1]) b.beam('leafGreen', [cx, 0.095, z], [cx + side * 0.045, 0.21 - Math.abs(side) * 0.04, z + side * 0.025], 0.022);
  }
  barrel(b, 1.40, -0.96, 0.12, 0.30, true);
  b.cylinder('water', 0.095, 0.095, 0.012, [1.40, 0.24, -0.96]);
  b.box('timberLight', [0.40, 0.12, 0.23], [-1.25, 0.06, -0.94]);
  for (let i = 0; i < 4; i++) b.ball('carrot', [0.03, 0.028, 0.065], [-1.39 + i * 0.085, 0.14, -0.94]);
  b.beam('timberMed', [-0.65, 0.02, -0.92], [-0.52, 0.57, -0.98], 0.025);
  b.box('ironHardware', [0.085, 0.12, 0.02], [-0.65, 0.07, -0.92]);
  return b.finish();
}

function chickenCoop() {
  const b = builder(), x = -1.03, z = -1.94;
  b.box('timberDark', [0.84, 0.035, 0.56], [x, 0.20, z]);
  for (const dx of [-0.37, 0.37]) for (const dz of [-0.23, 0.23]) b.box('timberDark', [0.055, 0.22, 0.055], [x + dx, 0.11, z + dz]);
  b.box('timberPlanks', [0.84, 0.40, 0.04], [x, 0.41, z - 0.27]);
  for (const dx of [-0.285, 0.285]) b.box('timberPlanks', [0.27, 0.40, 0.04], [x + dx, 0.41, z + 0.27]);
  b.box('timberPlanks', [0.30, 0.10, 0.04], [x, 0.56, z + 0.27]);
  for (const dx of [-0.40, 0.40]) {
    b.box('timberPlanks', [0.04, 0.22, 0.54], [x + dx, 0.32, z]);
    b.box('timberPlanks', [0.04, 0.08, 0.54], [x + dx, 0.57, z]);
    for (const dz of [-0.22, -0.11, 0, 0.11, 0.22]) b.box('timberDark', [0.045, 0.11, 0.022], [x + dx, 0.48, z + dz]);
    const gable = new THREE.Shape();
    gable.moveTo(-0.27, 0); gable.lineTo(0.27, 0); gable.lineTo(0.27, 0.035);
    gable.lineTo(0, 0.165); gable.lineTo(-0.27, 0.035); gable.closePath();
    b.add('timberPlanks', new THREE.ExtrudeGeometry(gable, { depth: 0.025, bevelEnabled: false }),
      [x + dx - 0.0125, 0.61, z], [0, Math.PI / 2, 0]);
  }
  for (const dx of [-0.18, 0.18]) b.box('timberDark', [0.035, 0.34, 0.06], [x + dx, 0.38, z + 0.29]);
  roof(b, x, z, 0.97, 0.68, 0.61, 0.18, 'shingleRoof');
  b.box('straw', [0.67, 0.018, 0.40], [x, 0.225, z]);
  for (const dx of [-0.18, 0, 0.18]) b.ball('clothWhite', [0.025, 0.033, 0.025], [x + dx, 0.26, z + 0.06]);
  b.box('timberLight', [0.18, 0.025, Math.hypot(0.195, 0.53)], [x, 0.1225, -1.395], [Math.atan2(0.195, 0.53), 0, 0]);
  for (let i = 0; i < 5; i++) b.box('timberDark', [0.19, 0.024, 0.035], [x, 0.218 - i * 0.037, -1.61 + i * 0.10]);
  trough(b, 0.69, -2.18, 0.55, 'straw');
  b.cylinder('ironHardware', 0.12, 0.14, 0.06, [1.40, 0.03, -2.08], undefined, true);
  b.cylinder('water', 0.10, 0.10, 0.012, [1.40, 0.042, -2.08]);
  return b.finish();
}

function goatShed() {
  const b = builder(), x = -1.02, z = -1.95;
  b.box('timberPlanks', [1.02, 0.69, 0.045], [x, 0.345, z - 0.27]);
  for (const dx of [-0.49, 0.49]) {
    b.box('timberPlanks', [0.045, 0.69, 0.54], [x + dx, 0.345, z]);
    b.box('timberDark', [0.075, 0.73, 0.075], [x + dx, 0.365, z + 0.27]);
    b.beam('timberMed', [x + dx, 0.42, z + 0.27], [x + dx * 0.58, 0.68, z + 0.27], 0.045);
  }
  b.box('timberDark', [1.07, 0.065, 0.075], [x, 0.70, z + 0.27]);
  roof(b, x, z, 1.17, 0.69, 0.72, 0.18, 'thatchRoof');
  b.box('straw', [0.76, 0.018, 0.32], [x, 0.009, z]);
  b.box('timberDark', [0.55, 0.035, 0.20], [0.60, 0.23, -2.17]);
  for (let i = 0; i < 6; i++) b.beam('timberMed', [0.34 + i * 0.10, 0.20, -2.10], [0.34 + i * 0.10, 0.48, -2.23], 0.026);
  b.box('straw', [0.47, 0.18, 0.13], [0.60, 0.35, -2.20]);
  for (const dx of [-0.27, 0.27]) b.box('timberDark', [0.045, 0.42, 0.045], [0.60 + dx, 0.21, -2.17]);
  trough(b, 1.39, -2.03, 0.27, 'water');
  b.cylinder('ironHardware', 0.08, 0.065, 0.15, [-1.34, 0.075, -1.35], undefined, true);
  b.ring('ironHardware', 0.08, 0.008, [-1.34, 0.14, -1.35]);
  return b.finish();
}

function bowyer() {
  const b = builder();
  canopy(b, -0.94, -1.94, 1.20); bench(b, -0.94, -1.84);
  for (let i = 0; i < 3; i++) b.box('timberMed', [0.50, 0.025, 0.025], [-0.94, 0.45 + i * 0.025, -1.91]);
  b.box('ironHardware', [0.13, 0.025, 0.025], [-0.66, 0.45, -1.73]);
  b.box('timberDark', [0.045, 0.20, 0.065], [-0.62, 0.42, -1.69]);
  for (const x of [0.44, 1.36]) b.box('timberDark', [0.055, 0.78, 0.055], [x, 0.39, -2.16]);
  b.box('timberMed', [0.98, 0.06, 0.05], [0.90, 0.73, -2.16]);
  for (const x of [0.64, 0.90, 1.16]) {
    b.add('timberLight', new THREE.TorusGeometry(0.27, 0.019, 5, 14, Math.PI), [x, 0.41, -2.12], [0, 0, -Math.PI / 2]);
    b.beam('clothWhite', [x, 0.14, -2.12], [x, 0.68, -2.12], 0.007);
  }
  barrel(b, 1.35, -1.13, 0.13, 0.29, true);
  for (let i = 0; i < 6; i++) {
    const x = 1.29 + (i % 3) * 0.055, z = -1.17 + Math.floor(i / 3) * 0.07;
    b.beam('timberLight', [x, 0.10, z], [x, 0.57, z], 0.012);
    b.box('clothWhite', [0.044, 0.065, 0.008], [x, 0.54, z]);
  }
  for (let i = 0; i < 4; i++) b.cylinder('timberLogs', 0.035, 0.035, 0.45, [-1.26 + i * 0.09, 0.04, -1.09], [Math.PI / 2, 0, 0]);
  return b.finish();
}

function shields() {
  const b = builder();
  canopy(b, -0.98, -1.96, 1.16); bench(b, -0.98, -1.86);
  b.box('stoneDark', [0.45, 0.19, 0.38], [0.98, 0.095, -2.05]);
  b.box('charcoalBlack', [0.30, 0.018, 0.25], [0.98, 0.20, -2.05]);
  for (let i = 0; i < 5; i++) b.ball('copperDark', [0.032, 0.020, 0.03], [0.87 + (i % 3) * 0.09, 0.22, -2.12 + Math.floor(i / 3) * 0.11]);
  b.beam('ironHardware', [1.18, 0.20, -1.97], [1.40, 0.18, -1.76], 0.035);
  b.ball('timberDark', [0.17, 0.04, 0.10], [1.42, 0.18, -1.73]);
  b.cylinder('timberLogs', 0.16, 0.18, 0.29, [0.50, 0.145, -1.26]);
  b.box('ironSteel', [0.13, 0.12, 0.11], [0.50, 0.35, -1.26]);
  b.box('ironSteel', [0.32, 0.07, 0.15], [0.50, 0.44, -1.26]);
  b.add('ironSteel', new THREE.ConeGeometry(0.075, 0.19, 4), [0.74, 0.44, -1.26], [0, 0, -Math.PI / 2]);
  b.beam('timberMed', [0.45, 0.49, -1.24], [0.60, 0.55, -1.24], 0.022);
  b.box('ironHardware', [0.075, 0.045, 0.045], [0.60, 0.55, -1.24]);
  for (const x of [-1.24, -0.74]) {
    b.cylinder('timberLight', 0.17, 0.17, 0.035, [x, 0.60, -2.11], [Math.PI / 2, 0, 0]);
    b.ring('ironHardware', 0.17, 0.013, [x, 0.60, -2.087], [0, 0, 0]);
    b.ball('ironSteel', [0.044, 0.044, 0.025], [x, 0.60, -2.075]);
    b.box('redBanner', [0.06, 0.29, 0.012], [x, 0.60, -2.08]);
  }
  barrel(b, 1.37, -1.09, 0.115, 0.25, true);
  b.cylinder('water', 0.085, 0.085, 0.012, [1.37, 0.20, -1.09]);
  return b.finish();
}

function brewery() {
  const b = builder();
  canopy(b, -0.97, -1.95, 1.23);
  b.cylinder('timberPlanks', 0.33, 0.29, 0.56, [-0.97, 0.28, -1.91], undefined, true);
  b.cylinder('copperDark', 0.28, 0.28, 0.025, [-0.97, 0.42, -1.91]);
  for (const y of [0.10, 0.33, 0.51]) b.ring('ironHardware', 0.315, 0.016, [-0.97, y, -1.91]);
  b.beam('timberLight', [-1.10, 0.30, -1.90], [-0.76, 0.72, -1.82], 0.026);
  b.box('timberLight', [0.09, 0.16, 0.022], [-1.10, 0.34, -1.90]);
  b.cylinder('stoneDark', 0.21, 0.23, 0.24, [0.56, 0.12, -2.01]);
  b.ball('copperBrew', [0.23, 0.22, 0.23], [0.56, 0.40, -2.01]);
  b.cylinder('copperBrew', 0.13, 0.21, 0.13, [0.56, 0.59, -2.01]);
  b.cylinder('copperDark', 0.06, 0.06, 0.14, [0.56, 0.72, -2.01]);
  b.beam('copperBrew', [0.56, 0.79, -2.01], [1.12, 0.76, -2.01], 0.045);
  b.beam('copperBrew', [1.12, 0.76, -2.01], [1.12, 0.38, -2.01], 0.045);
  barrel(b, 1.12, -2.01, 0.15, 0.32, true);
  barrel(b, 0.70, -1.05, 0.16, 0.39); barrel(b, 1.14, -1.05, 0.15, 0.36);
  b.cylinder('copperDark', 0.023, 0.023, 0.12, [0.70, 0.13, -0.87], [Math.PI / 2, 0, 0]);
  b.ball('clothWhite', [0.14, 0.18, 0.12], [-1.34, 0.18, -1.08]);
  b.ring('timberDark', 0.045, 0.008, [-1.34, 0.32, -1.08]);
  return b.finish();
}

export const BACKYARD_MODELS: Partial<Record<BackyardExtensionType, Part[]>> = {
  vegetable_garden: garden(), chicken_coop: chickenCoop(), goat_shed: goatShed(),
  artisan_bowyer: bowyer(), artisan_shields: shields(), artisan_brewery: brewery(),
};

function animalBody(kind: 'chicken' | 'goat', index: number) {
  const b = builder();
  if (kind === 'chicken') {
    b.ball(index === 1 ? 'chickenBrown' : 'chickenCream', [0.075, 0.082, 0.11], [0, 0.14, 0]);
    b.ball('chickenCream', [0.042, 0.045, 0.045], [0, 0.23, 0.075]);
    b.box('redBanner', [0.016, 0.032, 0.044], [0, 0.28, 0.075]);
    b.add('carrot', new THREE.ConeGeometry(0.015, 0.035, 4), [0, 0.23, 0.13], [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) {
      b.ball('charcoalBlack', [0.006, 0.006, 0.006], [side * 0.035, 0.24, 0.095]);
      b.ball('chickenBrown', [0.018, 0.055, 0.072], [side * 0.070, 0.15, -0.01]);
    }
    b.box('chickenBrown', [0.075, 0.07, 0.045], [0, 0.19, -0.10], [-0.35, 0, 0]);
  } else {
    b.ball(index === 1 ? 'goatBrown' : 'goatCream', [0.105, 0.12, 0.19], [0, 0.23, 0]);
    b.box('goatCream', [0.09, 0.15, 0.09], [0, 0.31, 0.16], [-0.28, 0, 0]);
    b.ball('goatCream', [0.068, 0.067, 0.095], [0, 0.405, 0.20]);
    b.ball('goatBrown', [0.059, 0.035, 0.046], [0, 0.38, 0.26]);
    for (const side of [-1, 1]) {
      b.box('goatBrown', [0.075, 0.025, 0.038], [side * 0.080, 0.43, 0.19], [0, 0, side * 0.25]);
      b.beam('breadCrust', [side * 0.037, 0.46, 0.17], [side * 0.05, 0.53, 0.12], 0.024);
      b.ball('charcoalBlack', [0.008, 0.008, 0.008], [side * 0.062, 0.42, 0.23]);
    }
    b.box('goatBrown', [0.025, 0.055, 0.028], [0, 0.33, 0.24]);
    b.box('goatCream', [0.035, 0.09, 0.03], [0, 0.30, -0.19], [-0.5, 0, 0]);
  }
  return b.finish();
}
const ANIMAL_BODIES = { chicken: [0, 1, 2].map(i => animalBody('chicken', i)), goat: [0, 1, 2].map(i => animalBody('goat', i)) };

export function getBackyardAnimalPose(index: number, time: number) {
  const phase = time * 0.32 + index * 2.1;
  const activity = time % 16;
  const walking = activity < 11;
  const pathPhase = (Math.floor(time / 16) * 11 + Math.min(activity, 11)) * 0.32 + index * 2.1;
  return {
    x: 0.08 + index * 0.60 + Math.sin(pathPhase) * 0.06,
    z: -1.45 + Math.cos(pathPhase) * 0.20,
    angle: Math.atan2(Math.cos(pathPhase) * 0.06, -Math.sin(pathPhase) * 0.20),
    stride: walking ? Math.sin(phase * 18) * 0.32 : 0,
    bob: walking ? Math.abs(Math.sin(phase * 18)) * 0.012 : 0,
    peck: walking ? 0 : Math.max(0, Math.sin(phase * 9)) * 0.24,
  };
}

function YardAnimal({ kind, index }: { kind: 'chicken' | 'goat'; index: number }) {
  const root = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]), elapsed = useRef(index * 1.7);
  const initial = getBackyardAnimalPose(index, elapsed.current);
  useFrame((_, delta) => {
    if (!root.current || !isObjectEffectivelyVisible(root.current)) return;
    const time = useGameStore.getState().time;
    if (time.isPaused || time.speedMultiplier === 0) return;
    elapsed.current += Math.min(delta, 0.10) * Math.min(time.speedMultiplier, 3);
    const pose = getBackyardAnimalPose(index, elapsed.current);
    root.current.position.set(pose.x, pose.bob, pose.z);
    root.current.rotation.y = pose.angle;
    if (body.current) body.current.rotation.x = pose.peck;
    legs.current.forEach((leg, i) => { if (leg) leg.rotation.x = pose.stride * (i % 2 === 0 ? 1 : -1); });
  });
  const legPositions: Vec[] = kind === 'chicken' ? [[-0.035, 0.08, 0], [0.035, 0.08, 0]] :
    [[-0.07, 0.17, -0.12], [0.07, 0.17, -0.12], [-0.07, 0.17, 0.12], [0.07, 0.17, 0.12]];
  const legLength = kind === 'chicken' ? 0.065 : 0.16;
  return (
    <group ref={root} position={[initial.x, 0, initial.z]} rotation={[0, initial.angle, 0]} scale={[1, 1, 0.70]}>
      <group ref={body}>
        {ANIMAL_BODIES[kind][index].map((part, i) => <mesh key={i} {...part} castShadow receiveShadow />)}
      </group>
      {legPositions.map((pos, i) => (
        <group key={i} position={pos} ref={leg => { legs.current[i] = leg; }}>
          <mesh material={kind === 'chicken' ? mats.carrot : mats.goatBrown} position={[0, -legLength / 2, 0]} castShadow>
            <boxGeometry args={[0.018, legLength, 0.022]} />
          </mesh>
          <mesh material={kind === 'chicken' ? mats.carrot : mats.charcoalBlack} position={[0, -legLength, 0.012]}>
            <boxGeometry args={[0.025, 0.018, 0.043]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function BackyardExtensionModel({ type }: { type: BackyardExtensionType }) {
  return (
    <group>
      {(BACKYARD_MODELS[type] ?? []).map((part, i) => <mesh key={i} {...part} castShadow receiveShadow />)}
      <BackyardAnimals type={type} />
    </group>
  );
}

export function BackyardAnimals({ type }: { type: BackyardExtensionType }) {
  const kind = type === 'chicken_coop' ? 'chicken' : type === 'goat_shed' ? 'goat' : null;
  return <group>{kind && [0, 1, 2].map(index => <YardAnimal key={index} kind={kind} index={index} />)}</group>;
}
