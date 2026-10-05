import * as THREE from 'three';
import {
  createTunicCanvas,
  createTrousersCanvas,
  createFaceCanvas,
  createLeatherCanvas,
  createShieldCanvas,
  makeTextureFromCanvas,
} from './unitTextures';

export interface UnitAppearance {
  gender: 'male' | 'female';
  skinMat: THREE.MeshStandardMaterial;
  faceMat: THREE.MeshStandardMaterial;
  tunicMat: THREE.MeshStandardMaterial;
  trousersMat: THREE.MeshStandardMaterial;
  bootsMat: THREE.MeshStandardMaterial;
  hairMat: THREE.MeshStandardMaterial;
  hairColor: string;
  hairStyle: number;
  headwearType: 'none' | 'straw_hat' | 'hood' | 'cap' | 'headscarf' | 'wimple' | 'bun' | 'braids' | 'helmet';
  hatMat?: THREE.MeshStandardMaterial;
  apronType: 'none' | 'leather_apron' | 'linen_apron' | 'vest';
  apronMat?: THREE.MeshStandardMaterial;
  shieldMat?: THREE.MeshStandardMaterial;
}

const unitAppearanceCache = new Map<string, UnitAppearance>();

const faceMatCache = new Map<string, THREE.MeshStandardMaterial>();
const skinMatCache = new Map<string, THREE.MeshStandardMaterial>();
const tunicMatCache = new Map<string, THREE.MeshStandardMaterial>();
const trousersMatCache = new Map<string, THREE.MeshStandardMaterial>();
const bootsMatCache = new Map<string, THREE.MeshStandardMaterial>();
const hairMatCache = new Map<string, THREE.MeshStandardMaterial>();
const hatMatCache = new Map<string, THREE.MeshStandardMaterial>();
const apronMatCache = new Map<string, THREE.MeshStandardMaterial>();
const shieldMatCache = new Map<string, THREE.MeshStandardMaterial>();

const MALE_TUNIC_PALETTES = [
  { base: '#b87c47', pattern: 'weave' as const },
  { base: '#52825e', pattern: 'plain' as const },
  { base: '#4d6f96', pattern: 'weave' as const },
  { base: '#be5c4a', pattern: 'stripes' as const },
  { base: '#dba94f', pattern: 'weave' as const },
  { base: '#7c705e', pattern: 'check' as const },
  { base: '#936c53', pattern: 'plain' as const },
  { base: '#5f7c7d', pattern: 'weave' as const },
  { base: '#c98b58', pattern: 'weave' as const },
  { base: '#687d5e', pattern: 'plain' as const },
];

const FEMALE_TUNIC_PALETTES = [
  { base: '#c85a5a', pattern: 'weave' as const },
  { base: '#458567', pattern: 'plain' as const },
  { base: '#5c7fa8', pattern: 'weave' as const },
  { base: '#e5ad3b', pattern: 'stripes' as const },
  { base: '#9e5a39', pattern: 'plain' as const },
  { base: '#647c8d', pattern: 'weave' as const },
  { base: '#bd728e', pattern: 'weave' as const },
  { base: '#876e55', pattern: 'check' as const },
];

const TROUSERS_PALETTES = ['#4b5766', '#594a3e', '#3f4952', '#635345', '#3b4754', '#595752'];

const HAIR_PALETTES = [
  '#241b16',
  '#4a2810',
  '#783c16',
  '#b85b14',
  '#d68f29',
  '#e2b34a',
  '#403b36',
  '#7a7772',
  '#171412',
];

const SKIN_PALETTES = [
  { tone: '#ffd9be', eyes: '#4b382a' },
  { tone: '#f7cdad', eyes: '#2c4356' },
  { tone: '#ebb48a', eyes: '#3d5236' },
  { tone: '#fedbc4', eyes: '#5c3a21' },
  { tone: '#f4c49f', eyes: '#2d3748' },
  { tone: '#e5ad82', eyes: '#4a3b32' },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const BANDIT_TUNIC_PALETTES = ['#292524', '#3f3f46', '#44403c', '#334155', '#3b2219', '#374151', '#262626'];

export function getUnitAppearance(unitId: string, characterClass = 'peasant'): UnitAppearance {
  const cacheKey = `${unitId}_${characterClass}`;
  const existing = unitAppearanceCache.get(cacheKey);
  if (existing) return existing;

  const seed = hashString(unitId);
  const isLord = characterClass === 'lord' || characterClass === 'king';
  const isLady = characterClass === 'lady';
  const isKnight = characterClass === 'warrior';
  const isBandit = characterClass === 'bandit' || unitId.startsWith('bandit-');

  let gender: 'male' | 'female' = seed % 2 === 0 ? 'male' : 'female';
  if (isLady) gender = 'female';
  if (isLord || isKnight || isBandit) gender = 'male';

  const skinEntry = SKIN_PALETTES[(seed + 1) % SKIN_PALETTES.length];
  const hairColor = HAIR_PALETTES[(seed + 3) % HAIR_PALETTES.length];

  let beardType: 'none' | 'stubble' | 'mustache' | 'full_beard' | 'braid_beard' = 'none';
  if (isBandit) {
    const bChoices: ('stubble' | 'full_beard' | 'braid_beard')[] = ['stubble', 'full_beard', 'braid_beard'];
    beardType = bChoices[seed % bChoices.length];
  } else if (gender === 'male' && !isLord) {
    const bChoices: ('none' | 'stubble' | 'mustache' | 'full_beard' | 'braid_beard')[] = [
      'none',
      'stubble',
      'mustache',
      'full_beard',
      'braid_beard',
      'stubble',
      'none',
    ];
    beardType = bChoices[(seed >> 2) % bChoices.length];
  } else if (isLord) {
    beardType = 'mustache';
  }

  const faceExpr = isLord || isBandit ? 'determined' : seed % 3 === 0 ? 'smile' : 'calm';
  const faceKey = `${skinEntry.tone}_${skinEntry.eyes}_${hairColor}_${beardType}_${faceExpr}`;
  let faceMat = faceMatCache.get(faceKey);
  if (!faceMat) {
    const faceCanvas = createFaceCanvas(
      skinEntry.tone,
      skinEntry.eyes,
      hairColor,
      beardType,
      faceExpr
    );
    const faceTex = makeTextureFromCanvas(faceCanvas, 1, 1);
    faceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.82,
      transparent: false,
    });
    faceMatCache.set(faceKey, faceMat);
  }

  let skinMat = skinMatCache.get(skinEntry.tone);
  if (!skinMat) {
    skinMat = new THREE.MeshStandardMaterial({
      color: skinEntry.tone,
      roughness: 0.85,
    });
    skinMatCache.set(skinEntry.tone, skinMat);
  }

  let tunicColor = '#b87c47';
  let tunicPattern: 'plain' | 'weave' | 'stripes' | 'check' | 'embroidery' = 'weave';

  if (isLord) {
    tunicColor = '#b91c1c';
    tunicPattern = 'embroidery';
  } else if (isLady) {
    tunicColor = '#047857';
    tunicPattern = 'embroidery';
  } else if (isKnight) {
    tunicColor = '#475569';
    tunicPattern = 'plain';
  } else if (isBandit) {
    tunicColor = BANDIT_TUNIC_PALETTES[seed % BANDIT_TUNIC_PALETTES.length];
    tunicPattern = seed % 2 === 0 ? 'plain' : 'weave';
  } else if (gender === 'female') {
    const entry = FEMALE_TUNIC_PALETTES[(seed >> 1) % FEMALE_TUNIC_PALETTES.length];
    tunicColor = entry.base;
    tunicPattern = entry.pattern;
  } else {
    const entry = MALE_TUNIC_PALETTES[(seed >> 1) % MALE_TUNIC_PALETTES.length];
    tunicColor = entry.base;
    tunicPattern = entry.pattern;
  }

  const tunicKey = `${tunicColor}_${tunicPattern}`;
  let tunicMat = tunicMatCache.get(tunicKey);
  if (!tunicMat) {
    const tunicCanvas = createTunicCanvas(tunicColor, tunicPattern, '#fbbf24');
    const tunicTex = makeTextureFromCanvas(tunicCanvas, 2, 2);
    tunicMat = new THREE.MeshStandardMaterial({
      map: tunicTex,
      color: tunicColor,
      roughness: 0.8,
    });
    tunicMatCache.set(tunicKey, tunicMat);
  }

  const trousersColor = TROUSERS_PALETTES[(seed + 4) % TROUSERS_PALETTES.length];
  let trousersMat = trousersMatCache.get(trousersColor);
  if (!trousersMat) {
    const trousersCanvas = createTrousersCanvas(trousersColor);
    const trousersTex = makeTextureFromCanvas(trousersCanvas, 1, 2);
    trousersMat = new THREE.MeshStandardMaterial({
      map: trousersTex,
      color: trousersColor,
      roughness: 0.85,
    });
    trousersMatCache.set(trousersColor, trousersMat);
  }

  let bootsMat = bootsMatCache.get('default');
  if (!bootsMat) {
    const leatherCanvas = createLeatherCanvas('#442916');
    const leatherTex = makeTextureFromCanvas(leatherCanvas, 1, 1);
    bootsMat = new THREE.MeshStandardMaterial({
      map: leatherTex,
      color: '#3d2514',
      roughness: 0.82,
    });
    bootsMatCache.set('default', bootsMat);
  }

  let hairMat = hairMatCache.get(hairColor);
  if (!hairMat) {
    hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.88,
    });
    hairMatCache.set(hairColor, hairMat);
  }

  let hairStyle = (seed >> 3) % 6;
  let headwearType: 'none' | 'straw_hat' | 'hood' | 'cap' | 'headscarf' | 'wimple' | 'bun' | 'braids' | 'helmet' = 'none';

  if (isBandit) {
    const hwRoll = seed % 4;
    if (hwRoll === 0 || hwRoll === 1) {
      headwearType = 'helmet';
    } else if (hwRoll === 2) {
      headwearType = 'hood';
    } else {
      headwearType = 'cap';
    }
  } else if (gender === 'male' && !isLord && !isKnight) {
    const hwRoll = (seed >> 2) % 6;
    if (hwRoll === 0) {
      headwearType = 'straw_hat';
    } else if (hwRoll === 1) {
      headwearType = 'hood';
    } else if (hwRoll === 2) {
      headwearType = 'cap';
    }
  } else if (gender === 'female' && !isLady) {
    const hwRoll = (seed >> 2) % 4;
    if (hwRoll === 0) {
      headwearType = 'headscarf';
    } else if (hwRoll === 1) {
      headwearType = 'wimple';
    } else if (hwRoll === 2) {
      headwearType = 'bun';
    } else {
      headwearType = 'braids';
    }
  }

  let hatMat: THREE.MeshStandardMaterial | undefined = undefined;
  if (headwearType !== 'none' && headwearType !== 'bun' && headwearType !== 'braids') {
    const hatKey = `${headwearType}_${headwearType === 'hood' ? tunicColor : ''}_${isBandit ? 'bandit' : 'normal'}`;
    hatMat = hatMatCache.get(hatKey);
    if (!hatMat) {
      if (headwearType === 'helmet') {
        hatMat = new THREE.MeshStandardMaterial({ color: isBandit ? '#334155' : '#475569', roughness: 0.45, metalness: 0.65, flatShading: true });
      } else if (headwearType === 'straw_hat') {
        hatMat = new THREE.MeshStandardMaterial({ color: '#fed46a', roughness: 0.85 });
      } else if (headwearType === 'hood') {
        hatMat = new THREE.MeshStandardMaterial({ color: isBandit ? '#1c1917' : tunicColor, roughness: 0.8 });
      } else if (headwearType === 'cap') {
        hatMat = new THREE.MeshStandardMaterial({ color: isBandit ? '#292524' : '#634b3d', roughness: 0.8 });
      } else if (headwearType === 'headscarf') {
        hatMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.8 });
      } else if (headwearType === 'wimple') {
        hatMat = new THREE.MeshStandardMaterial({ color: '#fafaf9', roughness: 0.8 });
      }
      if (hatMat) hatMatCache.set(hatKey, hatMat);
    }
  }

  let apronType: 'none' | 'leather_apron' | 'linen_apron' | 'vest' = 'none';
  if (isBandit) {
    apronType = seed % 2 === 0 ? 'vest' : 'leather_apron';
  } else if (!isLord && !isLady && !isKnight) {
    const apRoll = (seed >> 4) % 5;
    if (apRoll === 0) {
      apronType = 'leather_apron';
    } else if (apRoll === 1) {
      apronType = 'linen_apron';
    } else if (apRoll === 2) {
      apronType = 'vest';
    }
  }

  let apronMat: THREE.MeshStandardMaterial | undefined = undefined;
  if (apronType !== 'none') {
    const apronKey = `${apronType}_${isBandit ? 'bandit' : 'normal'}`;
    apronMat = apronMatCache.get(apronKey);
    if (!apronMat) {
      if (apronType === 'leather_apron') {
        apronMat = new THREE.MeshStandardMaterial({ color: isBandit ? '#292524' : '#664227', roughness: 0.85 });
      } else if (apronType === 'linen_apron') {
        apronMat = new THREE.MeshStandardMaterial({ color: '#faf5ea', roughness: 0.85 });
      } else if (apronType === 'vest') {
        apronMat = new THREE.MeshStandardMaterial({ color: isBandit ? '#1c1917' : '#4f321e', roughness: 0.85 });
      }
      if (apronMat) apronMatCache.set(apronKey, apronMat);
    }
  }

  let shieldMat: THREE.MeshStandardMaterial | undefined = undefined;
  if (isKnight || isBandit) {
    const emblem = isBandit ? 'skull' : (['cross', 'lion', 'chevron', 'tree'] as const)[seed % 4];
    const shieldBg = isBandit ? '#1c1917' : '#1e40af';
    const shieldKey = `${shieldBg}_${emblem}`;
    shieldMat = shieldMatCache.get(shieldKey);
    if (!shieldMat) {
      const shieldCanvas = createShieldCanvas(shieldBg, emblem);
      const shieldTex = makeTextureFromCanvas(shieldCanvas, 1, 1);
      shieldMat = new THREE.MeshStandardMaterial({
        map: shieldTex,
        roughness: 0.65,
      });
      shieldMatCache.set(shieldKey, shieldMat);
    }
  }

  const app: UnitAppearance = {
    gender,
    skinMat,
    faceMat,
    tunicMat,
    trousersMat,
    bootsMat,
    hairMat,
    hairColor,
    hairStyle,
    headwearType,
    hatMat,
    apronType,
    apronMat,
    shieldMat,
  };

  unitAppearanceCache.set(cacheKey, app);
  return app;
}

