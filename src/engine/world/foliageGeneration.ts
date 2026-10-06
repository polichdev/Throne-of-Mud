export type TreeType = 'pine' | 'oak' | 'autumn';

export interface TreeProceduralData {
  treeType: TreeType;
  sc: number;
  rotY: number;
  jitterX: number;
  jitterZ: number;
}

import { pseudoRandom } from '../../utils/mathUtils';

export { pseudoRandom };

export function getTreeProceduralData(x: number, z: number): TreeProceduralData {
  const randTree = pseudoRandom(x + 19, z + 83);

  const treeType: TreeType =
    randTree > 0.44 ? 'oak' : randTree > 0.08 ? 'pine' : 'autumn';

  const baseScale = treeType === 'pine' ? 1.08 : treeType === 'oak' ? 1.02 : 0.96;
  const sc = baseScale + (pseudoRandom(x + 5, z + 11) - 0.5) * 0.28;
  const rotY = pseudoRandom(x + 17, z + 53) * Math.PI * 2;
  const jitterX = (pseudoRandom(x, z) - 0.5) * 0.38;
  const jitterZ = (pseudoRandom(z, x + 37) - 0.5) * 0.38;

  return { treeType, sc, rotY, jitterX, jitterZ };
}
