import * as THREE from 'three';
import { BUILDING_TEXTURES } from './buildingTextures';

export const SHARED_BUILDING_MATS = {
  timberDark: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanks,
    color: '#cca06a',
    roughness: 0.78,
  }),
  timberMed: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanks,
    color: '#deaf7e',
    roughness: 0.75,
  }),
  timberLight: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanks,
    color: '#f5d5aa',
    roughness: 0.72,
  }),
  timberPlanks: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanksFine,
    color: '#ebb782',
    roughness: 0.78,
  }),
  timberLogs: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberLogs,
    color: '#e5af77',
    roughness: 0.8,
  }),
  plaster: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanks,
    color: '#deb37f',
    roughness: 0.82,
  }),
  wattleDaub: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanks,
    color: '#dfb17e',
    roughness: 0.82,
  }),
  stoneDark: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneFoundation,
    color: '#d4dde8',
    roughness: 0.82,
  }),
  stoneMed: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#e2e8f0',
    roughness: 0.8,
  }),
  stoneLight: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#f1f5f9',
    roughness: 0.78,
  }),
  thatchRoof: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.thatch,
    color: '#ffdf7c',
    roughness: 0.86,
  }),
  thatchDark: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.thatch,
    color: '#ebaf44',
    roughness: 0.88,
  }),
  thatchRidge: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.thatchSteep,
    color: '#d49833',
    roughness: 0.9,
  }),
  rugPattern: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.rug,
    roughness: 0.85,
  }),
  shingleRoof: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#c25534',
    roughness: 0.82,
  }),
  copperBrew: new THREE.MeshStandardMaterial({
    color: '#c26229',
    roughness: 0.35,
    metalness: 0.75,
  }),
  copperDark: new THREE.MeshStandardMaterial({
    color: '#7c3a1e',
    roughness: 0.45,
    metalness: 0.7,
  }),
  royalBlueRoof: new THREE.MeshStandardMaterial({
    color: '#25449c',
    roughness: 0.82,
  }),
  awningGreen: new THREE.MeshStandardMaterial({
    color: '#16a34a',
    roughness: 0.7,
  }),
  awningWhite: new THREE.MeshStandardMaterial({
    color: '#fdfefe',
    roughness: 0.7,
  }),
  awningRed: new THREE.MeshStandardMaterial({
    color: '#b91c1c',
    roughness: 0.7,
  }),
  goldWheat: new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    roughness: 0.8,
  }),
  richSoil: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.soil,
    color: '#8b6647',
    roughness: 0.92,
  }),
  soilFurrow: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.soil,
    color: '#6e4c30',
    roughness: 0.92,
  }),
  fireOrange: new THREE.MeshBasicMaterial({ color: '#f59e0b' }),
  fireYellow: new THREE.MeshBasicMaterial({ color: '#fef08a' }),
  fireCore: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  emberGlow: new THREE.MeshBasicMaterial({ color: '#d97706' }),
  charredWood: new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.95 }),
  ashBed: new THREE.MeshStandardMaterial({ color: '#262626', roughness: 0.98 }),
  smokeWhite: new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    transparent: true,
    opacity: 0.45,
    roughness: 0.95,
    depthWrite: false,
  }),
  gothicSlateRoof: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#384659',
    roughness: 0.84,
  }),
  gothicSlateRidge: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#222f3e',
    roughness: 0.88,
  }),
  gothicTrim: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#f8fafc',
    roughness: 0.72,
  }),
  velvetRed: new THREE.MeshStandardMaterial({
    color: '#991b1b',
    roughness: 0.75,
  }),
  scaffolding: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanks,
    color: '#d6a36c',
    roughness: 0.82,
  }),
  blueprintGhost: new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.35,
    roughness: 0.5,
  }),
  redBanner: new THREE.MeshStandardMaterial({
    color: '#dc2626',
    roughness: 0.8,
  }),
  goldTrim: new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    roughness: 0.35,
    metalness: 0.4,
  }),
  tentFabric: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.tentFabric,
    color: '#f5dec2',
    roughness: 0.85,
    side: THREE.DoubleSide,
  }),
  tentBedroll: new THREE.MeshStandardMaterial({
    color: '#8b5cf6',
    roughness: 0.85,
  }),
  sawBlade: new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.3,
    metalness: 0.7,
  }),
  axeBlade: new THREE.MeshStandardMaterial({
    color: '#64748b',
    roughness: 0.35,
    metalness: 0.6,
  }),
  ironHardware: new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.4,
    metalness: 0.7,
  }),
  woodShavings: new THREE.MeshStandardMaterial({
    color: '#facc15',
    roughness: 0.95,
  }),
  bedLinenRed: new THREE.MeshStandardMaterial({
    color: '#dc2626',
    roughness: 0.82,
  }),
  bedLinenBlue: new THREE.MeshStandardMaterial({
    color: '#2563eb',
    roughness: 0.82,
  }),
  bedLinenGreen: new THREE.MeshStandardMaterial({
    color: '#16a34a',
    roughness: 0.82,
  }),
  bedStraw: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.thatch,
    color: '#fed866',
    roughness: 0.86,
  }),
  pillowWhite: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.8,
  }),
  floorPlanks: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanks,
    color: '#e0a870',
    roughness: 0.78,
  }),
  candleGlow: new THREE.MeshBasicMaterial({ color: '#fde047' }),
  candleUnlit: new THREE.MeshStandardMaterial({
    color: '#e2d8c3',
    roughness: 0.9,
  }),
  windowLit: new THREE.MeshBasicMaterial({ color: '#fef08a' }),
  windowUnlit: new THREE.MeshStandardMaterial({
    color: '#465f75',
    roughness: 0.3,
    metalness: 0.2,
  }),
  fireplaceCold: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.stoneMasonry,
    color: '#574c42',
    roughness: 0.92,
  }),
  bootsLeather: new THREE.MeshStandardMaterial({
    color: '#5c3a23',
    roughness: 0.85,
  }),
  barrelWood: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.timberPlanksFine,
    color: '#d69e66',
    roughness: 0.78,
  }),
  breadCrust: new THREE.MeshStandardMaterial({
    color: '#c98242',
    roughness: 0.85,
  }),
  flourSack: new THREE.MeshStandardMaterial({
    map: BUILDING_TEXTURES.tentFabric,
    color: '#faf5e6',
    roughness: 0.92,
  }),
  shieldWood: new THREE.MeshStandardMaterial({
    color: '#dc2626',
    roughness: 0.8,
  }),
  flowerRed: new THREE.MeshStandardMaterial({
    color: '#f43f5e',
    roughness: 0.7,
  }),
  flowerYellow: new THREE.MeshBasicMaterial({
    color: '#fde047',
  }),
  leafGreen: new THREE.MeshStandardMaterial({
    color: '#22c55e',
    roughness: 0.8,
  }),
  ceramicPot: new THREE.MeshStandardMaterial({
    color: '#c25e10',
    roughness: 0.75,
  }),
  clothWhite: new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.85,
  }),
  ironSteel: new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.35,
    metalness: 0.65,
  }),
  fishSilver: new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.25,
    metalness: 0.5,
  }),
  meatRed: new THREE.MeshStandardMaterial({
    color: '#991b1b',
    roughness: 0.6,
  }),
  hideTan: new THREE.MeshStandardMaterial({
    color: '#a16207',
    roughness: 0.88,
  }),
  ironOre: new THREE.MeshStandardMaterial({
    color: '#573322',
    roughness: 0.85,
    metalness: 0.3,
  }),
  stoneRaw: new THREE.MeshStandardMaterial({
    color: '#64748b',
    roughness: 0.95,
  }),
  clayOrange: new THREE.MeshStandardMaterial({
    color: '#b45309',
    roughness: 0.9,
  }),
  saltWhite: new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.4,
    metalness: 0.1,
  }),
  charcoalBlack: new THREE.MeshStandardMaterial({
    color: '#1c1917',
    roughness: 0.95,
  }),
  brickRed: new THREE.MeshStandardMaterial({
    color: '#9a3412',
    roughness: 0.85,
  }),
  clothDyed: new THREE.MeshStandardMaterial({
    color: '#3b82f6',
    roughness: 0.8,
  }),
  clothRoyalBlue: new THREE.MeshStandardMaterial({
    color: '#1d4ed8',
    roughness: 0.78,
  }),
  clothGold: new THREE.MeshStandardMaterial({
    color: '#d97706',
    roughness: 0.78,
  }),
  clothEmerald: new THREE.MeshStandardMaterial({
    color: '#047857',
    roughness: 0.78,
  }),
  clothCrimson: new THREE.MeshStandardMaterial({
    color: '#b91c1c',
    roughness: 0.78,
  }),
  rawWool: new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    roughness: 0.95,
  }),
  moltenIron: new THREE.MeshBasicMaterial({
    color: '#ff7700',
  }),
  moltenSlag: new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.7,
    metalness: 0.4,
  }),
  copperBronze: new THREE.MeshStandardMaterial({
    color: '#b45309',
    roughness: 0.35,
    metalness: 0.75,
  }),
  berriesBlue: new THREE.MeshStandardMaterial({
    color: '#3b82f6',
    roughness: 0.6,
  }),
  berriesRed: new THREE.MeshStandardMaterial({
    color: '#e11d48',
    roughness: 0.6,
  }),
  berriesPurple: new THREE.MeshStandardMaterial({
    color: '#9333ea',
    roughness: 0.6,
  }),
  mossGreen: new THREE.MeshStandardMaterial({
    color: '#4d7c0f',
    roughness: 0.92,
  }),
  driedHerbs: new THREE.MeshStandardMaterial({
    color: '#65a30d',
    roughness: 0.88,
  }),
  antlerBone: new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    roughness: 0.65,
  }),
  furPelt: new THREE.MeshStandardMaterial({
    color: '#78350f',
    roughness: 0.92,
  }),
  clayPottery: new THREE.MeshStandardMaterial({
    color: '#c2410c',
    roughness: 0.8,
  }),
  ironIngot: new THREE.MeshStandardMaterial({
    color: '#64748b',
    roughness: 0.35,
    metalness: 0.85,
  }),
};
