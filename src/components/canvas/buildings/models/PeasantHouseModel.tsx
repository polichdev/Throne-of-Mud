import type { RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHARED_BUILDING_MATS } from '../buildingMaterials';
import { ChimneySmoke, IndoorFireplaceFire } from '../common/BuildingPrimitives';
import type { HouseTier, BackyardExtensionType } from '../../../../types/game';
import { PEASANT_GROUND_BEDS } from '../../../../constants/housing';
import { BackyardExtensionModel } from './BackyardExtensionModel';
import { BACKYARD_MODELS, BackyardAnimals } from './BackyardExtensionModel';
import { mergeStaticMeshParts } from '../staticMeshParts';
import type { StaticMeshPart } from '../staticMeshParts';

const cottageGlass = new THREE.MeshStandardMaterial({ color: '#101820', roughness: 0.8 });

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

function makeHouseRoof(halfLength: number, wallTop: number, halfSpan: number, ridgeY: number, gableX: number) {
  const eaveY = wallTop - 0.10;
  const rise = ridgeY - eaveY;
  const angle = Math.atan2(rise, halfSpan);
  const slopeLength = Math.hypot(rise, halfSpan);
  const roof: THREE.BufferGeometry[] = [];
  const trim: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const matrix = new THREE.Matrix4().makeRotationX(side * angle)
      .setPosition(0, (ridgeY + eaveY) / 2, 0.10 + side * halfSpan / 2);
    roof.push(toStandard(new THREE.BoxGeometry(halfLength * 2, 0.10, slopeLength).applyMatrix4(matrix)));
    for (const x of [-halfLength + 0.035, halfLength - 0.035]) {
      trim.push(toStandard(new THREE.BoxGeometry(0.07, 0.11, slopeLength)
        .applyMatrix4(matrix.clone().setPosition(x, (ridgeY + eaveY) / 2, 0.10 + side * halfSpan / 2))));
    }
  }
  trim.push(toStandard(new THREE.BoxGeometry(halfLength * 2 + 0.04, 0.08, 0.13).translate(0, ridgeY + 0.025, 0.10)));

  const gables: THREE.BufferGeometry[] = [];
  const wallHalfSpan = 0.64;
  const shoulderY = ridgeY - rise * wallHalfSpan / halfSpan - 0.055;
  const shape = new THREE.Shape();
  shape.moveTo(-wallHalfSpan, wallTop - 0.06);
  shape.lineTo(wallHalfSpan, wallTop - 0.06);
  shape.lineTo(wallHalfSpan, shoulderY);
  shape.lineTo(0, ridgeY - 0.055);
  shape.lineTo(-wallHalfSpan, shoulderY);
  shape.closePath();
  for (const x of [-gableX - 0.05, gableX - 0.05]) {
    const gable = new THREE.ExtrudeGeometry(shape, { depth: 0.10, bevelEnabled: false });
    gable.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(x, 0, 0.10));
    gables.push(toStandard(gable));
  }
  return { roof: mergeGeometries(roof)!, trim: mergeGeometries(trim)!, gables: mergeGeometries(gables)! };
}

export const t1StoneFoundationGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(3.64, 0.12, 1.34).translate(0, 0.06, 0.10)));
  geos.push(toStandard(new THREE.BoxGeometry(0.84, 0.08, 0.24).translate(0, 0.04, 0.84)));
  geos.push(toStandard(new THREE.BoxGeometry(0.74, 0.08, 0.20).translate(0.95, 0.04, -0.62)));
  return mergeGeometries(geos) || geos[0];
})();

export const t1FloorGeo = (() => {
  return toStandard(new THREE.BoxGeometry(3.48, 0.03, 1.20).translate(0, 0.125, 0.10));
})();

export const t1WallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(1.36, 1.12, 0.10).translate(-1.02, 0.68, 0.72)));
  geos.push(toStandard(new THREE.BoxGeometry(1.36, 1.12, 0.10).translate(1.02, 0.68, 0.72)));
  geos.push(toStandard(new THREE.BoxGeometry(0.68, 0.18, 0.10).translate(0, 1.15, 0.72)));

  geos.push(toStandard(new THREE.BoxGeometry(2.30, 1.12, 0.10).translate(-0.55, 0.68, -0.52)));
  geos.push(toStandard(new THREE.BoxGeometry(0.40, 1.12, 0.10).translate(1.50, 0.68, -0.52)));
  geos.push(toStandard(new THREE.BoxGeometry(0.70, 0.18, 0.10).translate(0.95, 1.15, -0.52)));

  geos.push(toStandard(new THREE.BoxGeometry(0.10, 1.12, 1.14).translate(-1.70, 0.68, 0.10)));
  geos.push(toStandard(new THREE.BoxGeometry(0.10, 1.12, 1.14).translate(1.70, 0.68, 0.10)));

  return mergeGeometries(geos) || geos[0];
})();

export const t1BeamsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const bx of [-1.70, 1.70]) {
    for (const bz of [-0.52, 0.72]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.14, 1.16, 0.14).translate(bx, 0.70, bz)));
    }
  }
  for (const bx of [0.55, 1.35]) {
    geos.push(toStandard(new THREE.BoxGeometry(0.08, 1.12, 0.12).translate(bx, 0.68, -0.52)));
  }
  geos.push(toStandard(new THREE.BoxGeometry(3.54, 0.10, 0.12).translate(0, 1.24, 0.72)));
  geos.push(toStandard(new THREE.BoxGeometry(3.54, 0.10, 0.12).translate(0, 1.24, -0.52)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 0.10, 1.34).translate(-1.70, 1.24, 0.10)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 0.10, 1.34).translate(1.70, 1.24, 0.10)));

  return mergeGeometries(geos) || geos[0];
})();

export const t1PropsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const addShutters = (x: number, y: number, z: number, rotY: number, w: number, h: number) => {
    const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(x, y, z);
    const sL = new THREE.BoxGeometry(w * 0.46, h * 0.95, 0.025);
    sL.applyMatrix4(new THREE.Matrix4().makeRotationY(-0.7).setPosition(-w / 2 - 0.09, 0, 0.06));
    const sR = new THREE.BoxGeometry(w * 0.46, h * 0.95, 0.025);
    sR.applyMatrix4(new THREE.Matrix4().makeRotationY(0.7).setPosition(w / 2 + 0.09, 0, 0.06));
    geos.push(toStandard(sL).applyMatrix4(m), toStandard(sR).applyMatrix4(m));
  };
  addShutters(-1.02, 0.68, 0.73, 0, 0.44, 0.44);
  addShutters(1.02, 0.68, 0.73, 0, 0.44, 0.44);
  addShutters(-1.71, 0.68, 0.10, -Math.PI / 2, 0.44, 0.44);
  addShutters(1.71, 0.68, 0.10, Math.PI / 2, 0.44, 0.44);

  const door1 = new THREE.BoxGeometry(0.66, 0.98, 0.04).translate(0, 0.61, 0.80);
  const door2 = new THREE.BoxGeometry(0.66, 0.98, 0.04).translate(0.95, 0.61, -0.60);
  geos.push(toStandard(door1), toStandard(door2));

  return mergeGeometries(geos) || geos[0];
})();

export const t1GlassGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.42, 0.42, 0.02).translate(-1.02, 0.68, 0.79)));
  geos.push(toStandard(new THREE.BoxGeometry(0.42, 0.42, 0.02).translate(1.02, 0.68, 0.79)));
  geos.push(toStandard(new THREE.BoxGeometry(0.02, 0.42, 0.42).translate(-1.77, 0.68, 0.10)));
  geos.push(toStandard(new THREE.BoxGeometry(0.02, 0.42, 0.42).translate(1.77, 0.68, 0.10)));
  return mergeGeometries(geos) || geos[0];
})();

const tier1Roof = makeHouseRoof(1.96, 1.24, 0.82, 1.79, 1.70);
export const t1RoofGeo = tier1Roof.roof;
export const t1RoofGablesGeo = tier1Roof.gables;
export const t1RoofTrimGeo = tier1Roof.trim;

function makeChimney(width: number, ridgeY: number, doubleFlue = false) {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(width, 1.00, width).translate(-0.15, ridgeY - 0.02, -0.25)));
  geos.push(toStandard(new THREE.BoxGeometry(width + 0.10, 0.10, width + 0.10).translate(-0.15, ridgeY + 0.51, -0.25)));
  for (const dx of doubleFlue ? [-0.13, 0.13] : [0]) {
    geos.push(toStandard(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12).translate(-0.15 + dx, ridgeY + 0.65, -0.25)));
  }
  return mergeGeometries(geos)!;
}

export const t1ChimneyGeo = makeChimney(0.48, 1.79, false);

export const t1InteriorHearthGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(0.82, 0.10, 0.40).translate(-0.15, 0.19, -0.34)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.62, 0.23).translate(-0.48, 0.55, -0.38)));
  geos.push(toStandard(new THREE.BoxGeometry(0.14, 0.62, 0.23).translate(0.18, 0.55, -0.38)));
  geos.push(toStandard(new THREE.BoxGeometry(0.80, 0.14, 0.25).translate(-0.15, 0.89, -0.38)));
  geos.push(toStandard(new THREE.BoxGeometry(0.44, 0.25, 0.16).translate(-0.15, 1.08, -0.43)));
  return mergeGeometries(geos) || geos[0];
})();

export const t1InteriorFurnitureGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const addBed = (x: number, z: number, rotY: number) => {
    const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(x, 0.12, z);
    const frame = new THREE.BoxGeometry(0.65, 0.12, 0.76).translate(0, 0.08, 0);
    const headboard = new THREE.BoxGeometry(0.67, 0.42, 0.06).translate(0, 0.21, -0.35);
    const footboard = new THREE.BoxGeometry(0.67, 0.28, 0.06).translate(0, 0.14, 0.35);
    const bedGeo = mergeGeometries([toStandard(frame), toStandard(headboard), toStandard(footboard)]) || frame;
    geos.push(toStandard(bedGeo).applyMatrix4(m));
  };
  PEASANT_GROUND_BEDS.forEach(({ x, z }) => addBed(x, z, 0));

  const tTop = new THREE.BoxGeometry(0.76, 0.05, 0.42).translate(0, 0.40, 0.30);
  const tLeg1 = new THREE.BoxGeometry(0.07, 0.30, 0.07).translate(-0.30, 0.24, 0.15);
  const tLeg2 = new THREE.BoxGeometry(0.07, 0.30, 0.07).translate(0.30, 0.24, 0.15);
  const tLeg3 = new THREE.BoxGeometry(0.07, 0.30, 0.07).translate(-0.30, 0.24, 0.45);
  const tLeg4 = new THREE.BoxGeometry(0.07, 0.30, 0.07).translate(0.30, 0.24, 0.45);
  const b1 = new THREE.BoxGeometry(0.16, 0.20, 0.40).translate(-0.52, 0.22, 0.30);
  const b2 = new THREE.BoxGeometry(0.19, 0.20, 0.40).translate(0.55, 0.22, 0.30);
  geos.push(toStandard(tTop), toStandard(tLeg1), toStandard(tLeg2), toStandard(tLeg3), toStandard(tLeg4), toStandard(b1), toStandard(b2));

  return mergeGeometries(geos) || geos[0];
})();

export const t1InteriorLinensGeo = (() => {
  return mergeGeometries(PEASANT_GROUND_BEDS.map(({ x, z }) =>
    toStandard(new THREE.BoxGeometry(0.57, 0.055, 0.51).translate(x, 0.365, z + 0.08))))!;
})();

export const t1InteriorPillowsGeo = (() => {
  return mergeGeometries(PEASANT_GROUND_BEDS.map(({ x, z }) =>
    toStandard(new THREE.BoxGeometry(0.43, 0.08, 0.16).translate(x, 0.40, z - 0.235))))!;
})();

export const t2UpperFloorPlanksGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(2.96, 0.06, 1.16).translate(0.20, 1.25, 0.10)));
  geos.push(toStandard(new THREE.BoxGeometry(0.40, 0.06, 0.31).translate(-1.48, 1.25, 0.525)));
  geos.push(toStandard(new THREE.BoxGeometry(0.40, 0.06, 0.11).translate(-1.48, 1.25, -0.425)));
  return mergeGeometries(geos) || geos[0];
})();

export const t2UpperWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(1.36, 0.96, 0.10).translate(-1.02, 1.76, 0.72)));
  geos.push(toStandard(new THREE.BoxGeometry(1.36, 0.96, 0.10).translate(1.02, 1.76, 0.72)));
  geos.push(toStandard(new THREE.BoxGeometry(0.68, 0.96, 0.10).translate(0, 1.76, 0.72)));

  geos.push(toStandard(new THREE.BoxGeometry(3.40, 0.96, 0.10).translate(0, 1.76, -0.52)));

  geos.push(toStandard(new THREE.BoxGeometry(0.10, 0.96, 1.14).translate(-1.70, 1.76, 0.10)));
  geos.push(toStandard(new THREE.BoxGeometry(0.10, 0.96, 1.14).translate(1.70, 1.76, 0.10)));

  return mergeGeometries(geos) || geos[0];
})();

export const t2UpperBeamsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const bx of [-1.70, 0, 1.70]) {
    for (const bz of [-0.52, 0.72]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.14, 1.02, 0.14).translate(bx, 1.76, bz)));
    }
  }
  geos.push(toStandard(new THREE.BoxGeometry(3.54, 0.10, 0.12).translate(0, 2.26, 0.72)));
  geos.push(toStandard(new THREE.BoxGeometry(3.54, 0.10, 0.12).translate(0, 2.26, -0.52)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 0.10, 1.34).translate(-1.70, 2.26, 0.10)));
  geos.push(toStandard(new THREE.BoxGeometry(0.12, 0.10, 1.34).translate(1.70, 2.26, 0.10)));

  return mergeGeometries(geos) || geos[0];
})();

export const t2LadderGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const railL = new THREE.BoxGeometry(0.07, 1.36, 0.07);
  railL.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.43).setPosition(-1.59, 0.76, -0.05));
  const railR = new THREE.BoxGeometry(0.07, 1.36, 0.07);
  railR.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.43).setPosition(-1.33, 0.76, -0.05));
  geos.push(toStandard(railL), toStandard(railR));

  for (let i = 0; i < 6; i++) {
    const rung = new THREE.BoxGeometry(0.30, 0.045, 0.09);
    rung.applyMatrix4(new THREE.Matrix4().setPosition(-1.46, 0.24 + i * 0.21, 0.19 - i * 0.095));
    geos.push(toStandard(rung));
  }
  return mergeGeometries(geos) || geos[0];
})();

const makeUpperBedsGeo = (bedXs: number[]) => {
  const geos: THREE.BufferGeometry[] = [];
  const addBed = (x: number, z: number, rotY: number) => {
    const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(x, 1.28, z);
    const frame = new THREE.BoxGeometry(0.62, 0.10, 0.74).translate(0, 0.05, 0);
    const headboard = new THREE.BoxGeometry(0.64, 0.38, 0.05).translate(0, 0.19, -0.345);
    const footboard = new THREE.BoxGeometry(0.64, 0.22, 0.05).translate(0, 0.11, 0.345);
    const bedGeo = mergeGeometries([toStandard(frame), toStandard(headboard), toStandard(footboard)]) || frame;
    geos.push(toStandard(bedGeo).applyMatrix4(m));
  };
  bedXs.forEach((x) => addBed(x, -0.09, 0));

  return mergeGeometries(geos) || geos[0];
};
export const t2UpperBedsGeo = makeUpperBedsGeo([0.95]);
export const t3UpperBedsGeo = makeUpperBedsGeo([-0.20, 1.05]);

const makeUpperLinensGeo = (bedXs: number[]) => {
  const geos: THREE.BufferGeometry[] = [];
  for (const bx of bedXs) {
    const m = new THREE.BoxGeometry(0.54, 0.055, 0.50).translate(bx, 1.485, -0.01);
    geos.push(toStandard(m));
  }
  return mergeGeometries(geos) || geos[0];
};
export const t2UpperLinensGeo = makeUpperLinensGeo([0.95]);
export const t3UpperLinensGeo = makeUpperLinensGeo([-0.20, 1.05]);

const tier2Roof = makeHouseRoof(2.00, 2.26, 0.84, 2.82, 1.73);
export const t2RoofGeo = tier2Roof.roof;
export const t2RoofGablesGeo = tier2Roof.gables;
const tier3Roof = makeHouseRoof(2.06, 2.26, 0.86, 2.86, 1.73);
export const t3RoofGablesGeo = tier3Roof.gables;

export const t2ChimneyGeo = makeChimney(0.5, 2.82, false);

export const t3StoneWallsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(3.90, 1.25, 1.48).translate(0, 0.68, 0.10)));
  for (const bx of [-1.90, 1.90]) {
    for (const bz of [-0.60, 0.80]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.35, 1.30, 0.35).translate(bx, 0.70, bz)));
    }
  }
  return mergeGeometries(geos) || geos[0];
})();

export const t3UpperPlasterGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(4.00, 1.10, 1.58).translate(0, 1.85, 0.10)));
  return mergeGeometries(geos) || geos[0];
})();

export const t3RoofGeo = tier3Roof.roof;

export const t3ChimneyGeo = makeChimney(0.58, 2.86, true);

export const t2UpperWindowsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const x of [-1.02, 1.02]) {
    geos.push(toStandard(new THREE.BoxGeometry(0.42, 0.42, 0.035).translate(x, 1.77, 0.81)));
  }
  return mergeGeometries(geos) || geos[0];
})();

export const t3FacadeTrimGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  geos.push(toStandard(new THREE.BoxGeometry(3.44, 0.07, 0.06).translate(0, 1.26, 0.74)));
  return mergeGeometries(geos) || geos[0];
})();

export const t3TimberJoineryGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const y of [1.26, 2.24]) {
    geos.push(toStandard(new THREE.BoxGeometry(3.44, 0.07, 0.06).translate(0, y, -0.54)));
    for (const x of [-1.72, 1.72]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.06, 0.07, 1.28).translate(x, y, 0.10)));
    }
  }
  geos.push(toStandard(new THREE.BoxGeometry(3.44, 0.07, 0.06).translate(0, 2.24, 0.74)));
  for (const x of [-1.72, 0, 1.72]) {
    for (const z of [-0.54, 0.74]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.09, 2.14, 0.07).translate(x, 1.19, z)));
    }
  }
  return mergeGeometries(geos) || geos[0];
})();

export const t3FacadeWindowsGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  for (const x of [-1.05, 1.05]) {
    for (const y of [0.75, 1.87]) {
      geos.push(toStandard(new THREE.BoxGeometry(0.55, 0.52, 0.04).translate(x, y, 0.81)));
    }
  }
  return mergeGeometries(geos) || geos[0];
})();

export const burgageBackyardFenceGeo = (() => {
  const geos: THREE.BufferGeometry[] = [];
  const postGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.65, 6);
  const railGeoX = new THREE.BoxGeometry(1.65, 0.05, 0.03);
  const railGeoZ = new THREE.BoxGeometry(0.03, 0.05, 0.84);

  for (const px of [-1.75, -0.90, -0.20, 0.20, 0.90, 1.75]) {
    geos.push(toStandard(postGeo.clone()).applyMatrix4(new THREE.Matrix4().setPosition(px, 0.325, -2.35)));
  }
  for (const pz of [-1.93, -1.09, -0.67]) {
    geos.push(toStandard(postGeo.clone()).applyMatrix4(new THREE.Matrix4().setPosition(-1.75, 0.325, pz)));
    geos.push(toStandard(postGeo.clone()).applyMatrix4(new THREE.Matrix4().setPosition(1.75, 0.325, pz)));
  }

  for (const y of [0.24, 0.44]) {
    geos.push(toStandard(railGeoX.clone()).applyMatrix4(new THREE.Matrix4().setPosition(-0.95, y, -2.35)));
    geos.push(toStandard(railGeoX.clone()).applyMatrix4(new THREE.Matrix4().setPosition(0.95, y, -2.35)));
    for (const z of [-1.93, -1.09]) {
      geos.push(toStandard(railGeoZ.clone()).applyMatrix4(new THREE.Matrix4().setPosition(-1.75, y, z)));
      geos.push(toStandard(railGeoZ.clone()).applyMatrix4(new THREE.Matrix4().setPosition(1.75, y, z)));
    }
  }

  const gatePlanks = [0.24, 0.44].map((y) => new THREE.BoxGeometry(0.36, 0.05, 0.03).translate(0, y, -2.35));
  const gateDiag = new THREE.BoxGeometry(0.04, 0.44, 0.025);
  gateDiag.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.65).setPosition(0, 0.34, -2.35));
  geos.push(...gatePlanks.map(toStandard), toStandard(gateDiag));

  return mergeGeometries(geos) || geos[0];
})();

function ChimneyFlue({ x = -0.15, y }: { x?: number; y: number }) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group position={[x, y, -0.25]}>
      <mesh material={mats.charcoalBlack} position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.025, 12]} />
      </mesh>
      <mesh material={mats.stoneDark} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} castShadow>
        <torusGeometry args={[0.124, 0.025, 5, 12]} />
      </mesh>
    </group>
  );
}

function CottageWindow({ isLightOn }: { isLightOn: boolean }) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group>
      <mesh material={isLightOn ? mats.windowLit : cottageGlass} position={[0, 0, 0.025]}>
        <boxGeometry args={[0.44, 0.44, 0.018]} />
      </mesh>
      {[-0.235, 0.235].map((x) => (
        <mesh key={x} material={mats.timberMed} position={[x, 0, 0.028]} castShadow>
          <boxGeometry args={[0.045, 0.49, 0.045]} />
        </mesh>
      ))}
      {[-0.235, 0.235].map((y) => (
        <mesh key={y} material={mats.timberMed} position={[0, y, 0.028]} castShadow>
          <boxGeometry args={[0.51, 0.045, 0.045]} />
        </mesh>
      ))}
      <mesh material={mats.timberLight} position={[0, 0, 0.032]}>
        <boxGeometry args={[0.028, 0.44, 0.026]} />
      </mesh>
      <mesh material={mats.timberLight} position={[0, 0, 0.032]}>
        <boxGeometry args={[0.44, 0.028, 0.026]} />
      </mesh>
      {[-0.35, 0.35].map((x) => (
        <group key={x} position={[x, 0, 0.025]}>
          <mesh material={mats.timberMed} castShadow>
            <boxGeometry args={[0.17, 0.46, 0.035]} />
          </mesh>
          {[-0.16, 0.16].map((y) => (
            <mesh key={y} material={mats.timberLight} position={[0, y, 0.022]}>
              <boxGeometry args={[0.15, 0.025, 0.012]} />
            </mesh>
          ))}
          <mesh material={mats.timberDark} position={[0, 0, 0.021]}>
            <boxGeometry args={[0.009, 0.43, 0.009]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HouseFacadeDetails({ tier, upperVisible, isLightOn }: { tier: HouseTier; upperVisible: boolean; isLightOn: boolean }) {
  const mats = SHARED_BUILDING_MATS;
  const face = 0.76;
  const doorFrame = mats.timberDark;
  const rows = upperVisible && tier >= 2 ? [0.68, 1.76] : [0.68];

  return (
    <group>
      <group position={[0.95, 0, -0.52]} rotation={[0, Math.PI, 0]}>
        <mesh material={mats.timberDark} position={[0, 0.60, 0]} castShadow>
          <boxGeometry args={[0.72, 0.96, 0.10]} />
        </mesh>
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} material={doorFrame} position={[x, 0.62, 0.012]} castShadow>
            <boxGeometry args={[0.07, 1.04, 0.13]} />
          </mesh>
        ))}
        <mesh material={doorFrame} position={[0, 1.10, 0.012]} castShadow>
          <boxGeometry args={[0.77, 0.07, 0.13]} />
        </mesh>
        <mesh material={doorFrame} position={[0, 0.12, 0]} receiveShadow>
          <boxGeometry args={[0.72, 0.04, 0.12]} />
        </mesh>
        <mesh material={mats.ironHardware} position={[0.21, 0.61, 0.055]}>
          <torusGeometry args={[0.035, 0.01, 5, 10]} />
        </mesh>
      </group>
      <group position={[0, 0, face]}>
        <mesh material={mats.timberDark} position={[0, 0.62, 0.01]} castShadow>
          <boxGeometry args={[0.69, 1.05, 0.07]} />
        </mesh>
        {[-0.24, -0.12, 0, 0.12, 0.24].map((x) => (
          <mesh key={x} material={mats.timberMed} position={[x, 0.62, 0.052]}>
            <boxGeometry args={[0.012, 0.94, 0.012]} />
          </mesh>
        ))}
        {[0.34, 0.91].map((y) => (
          <mesh key={y} material={mats.timberLight} position={[0, y, 0.053]}>
            <boxGeometry args={[0.58, 0.035, 0.015]} />
          </mesh>
        ))}
        {[-0.39, 0.39].map((x) => (
          <mesh key={x} material={doorFrame} position={[x, 0.62, 0.02]} castShadow>
            <boxGeometry args={[0.055, 1.16, 0.06]} />
          </mesh>
        ))}
        <mesh material={doorFrame} position={[0, 1.23, 0.02]} castShadow>
          <boxGeometry args={[0.83, 0.07, 0.06]} />
        </mesh>
        <mesh material={mats.stoneMed} position={[0, 0.06, 0.15]} receiveShadow>
          <boxGeometry args={[0.86, 0.10, 0.34]} />
        </mesh>
        <mesh material={mats.goldTrim} position={[0.22, 0.58, 0.074]}>
          <torusGeometry args={[0.042, 0.012, 5, 10]} />
        </mesh>
      </group>
      {rows.flatMap((y) => [-1.02, 1.02].map((x) => (
        <group key={`${x}-${y}`} position={[x, y, face]}>
          <CottageWindow isLightOn={isLightOn} />
        </group>
      )))}
    </group>
  );
}

function HouseSideWindowDetails({ tier, upperVisible, isLightOn }: { tier: HouseTier; upperVisible: boolean; isLightOn: boolean }) {
  const rows = upperVisible && tier >= 2 ? [0.68, 1.76] : [0.68];
  return (
    <group>
      {[-1, 1].flatMap((side) => rows.map((y) => (
        <group key={`${side}-${y}`} position={[side * 1.75, y, 0.10]} rotation={[0, side * Math.PI / 2, 0]} scale={[0.92, 1, 1]}>
          <CottageWindow isLightOn={isLightOn} />
        </group>
      )))}
    </group>
  );
}

const facadeCache = new Map<boolean, StaticMeshPart[]>();

function expandHouseStaticPart(type: unknown, props: any) {
  if (type === CottageWindow) return CottageWindow(props);
  if (type === HouseFacadeDetails) return HouseFacadeDetails(props);
  if (type === HouseSideWindowDetails) return HouseSideWindowDetails(props);
  if (type === HouseFacade) return HouseFacade(props);
  if (type === ChimneyFlue) return ChimneyFlue(props);
  if (type === ChimneySmoke) return null;
  if (type === BackyardExtensionModel) return (BACKYARD_MODELS[props.type as BackyardExtensionType] ?? [])
    .map((part, i) => <mesh key={i} {...part} castShadow receiveShadow />);
  throw new Error('Animated or unsupported component in house exterior');
}

function HouseFacade({ tier, upperVisible, isLightOn }: { tier: HouseTier; upperVisible: boolean; isLightOn: boolean }) {
  const upper = tier >= 2 && upperVisible;
  let parts = facadeCache.get(upper);
  if (!parts) {
    parts = mergeStaticMeshParts(<>
      <HouseFacadeDetails tier={upper ? 2 : 1} upperVisible={upper} isLightOn={false} />
      <HouseSideWindowDetails tier={upper ? 2 : 1} upperVisible={upper} isLightOn={false} />
    </>, expandHouseStaticPart);
    facadeCache.set(upper, parts);
  }
  return <group>{parts.map((part, i) => <mesh key={i} {...part} dispose={null}
    material={isLightOn && part.material === cottageGlass ? SHARED_BUILDING_MATS.windowLit : part.material} />)}</group>;
}

function UpperRoomDetails({ tier }: { tier: HouseTier }) {
  const mats = SHARED_BUILDING_MATS;
  const bedXs = tier === 3 ? [-0.20, 1.05] : [0.95];
  const tableX = tier === 3 ? 0.425 : -0.38;
  const tableZ = tier === 3 ? 0.10 : 0.20;
  const rugZ = tier === 3 ? 0.10 : 0.34;
  return (
    <group>
      {bedXs.map((x) => (
        <group key={x}>
          <mesh material={mats.pillowWhite} position={[x, 1.415, -0.09]} receiveShadow>
            <boxGeometry args={[0.56, 0.08, 0.65]} />
          </mesh>
          <mesh material={mats.pillowWhite} position={[x, 1.51, -0.325]}>
            <boxGeometry args={[0.42, 0.08, 0.16]} />
          </mesh>
        </group>
      ))}
      <mesh material={tier === 3 ? mats.velvetRed : mats.rugPattern} position={[tableX, 1.32, rugZ]} receiveShadow>
        <boxGeometry args={[0.48, 0.015, 0.54]} />
      </mesh>
      <mesh material={mats.timberLight} position={[tableX, 1.57, tableZ]} receiveShadow>
        <boxGeometry args={[0.52, 0.06, 0.36]} />
      </mesh>
      {[-0.20, 0.20].flatMap((dx) => [-0.11, 0.11].map((dz) => (
        <mesh key={`${dx}-${dz}`} material={mats.timberDark} position={[tableX + dx, 1.43, tableZ + dz]}>
          <boxGeometry args={[0.06, 0.24, 0.06]} />
        </mesh>
      )))}
      <mesh material={mats.candleUnlit} position={[tableX, 1.67, tableZ]}>
        <cylinderGeometry args={[0.018, 0.023, 0.13, 6]} />
      </mesh>
      <mesh material={mats.timberLight} position={[tableX, 1.91, -0.49]} castShadow>
        <boxGeometry args={[0.52, 0.055, 0.14]} />
      </mesh>
      {[-0.22, 0.22].map((dx) => (
        <mesh key={dx} material={mats.timberDark} position={[tableX + dx, 1.79, -0.49]}>
          <boxGeometry args={[0.05, 0.25, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

function GroundRoomDetails({ isLightOn }: { isLightOn: boolean }) {
  const mats = SHARED_BUILDING_MATS;
  return (
    <group>
      {PEASANT_GROUND_BEDS.map(({ x, z }) => (
        <mesh key={x} material={mats.pillowWhite} position={[x, 0.305, z]} receiveShadow>
          <boxGeometry args={[0.59, 0.08, 0.67]} />
        </mesh>
      ))}
      <mesh material={mats.charcoalBlack} position={[-0.15, 0.54, -0.475]}>
        <boxGeometry args={[0.52, 0.60, 0.025]} />
      </mesh>
      <mesh material={mats.stoneDark} position={[-0.15, 0.99, -0.36]} castShadow>
        <boxGeometry args={[0.88, 0.06, 0.29]} />
      </mesh>
      <mesh material={mats.ironHardware} position={[-0.15, 0.30, -0.23]}>
        <boxGeometry args={[0.48, 0.035, 0.035]} />
      </mesh>
      <mesh material={mats.timberDark} position={[-0.15, 0.265, -0.33]}>
        <boxGeometry args={[0.32, 0.055, 0.12]} />
      </mesh>
      <mesh material={mats.breadCrust} position={[-0.13, 0.47, 0.30]}>
        <boxGeometry args={[0.18, 0.08, 0.13]} />
      </mesh>
      <mesh material={isLightOn ? mats.candleGlow : mats.candleUnlit} position={[0.18, 0.49, 0.30]}>
        <cylinderGeometry args={[0.018, 0.022, 0.13, 6]} />
      </mesh>
    </group>
  );
}

export function PeasantHouseModel({
  buildingId,
  isLightOn = false,
  roofRef,
  interiorRef,
  tier = 1,
  backyard = 'none',
  selected = false,
  floorView = 1,
}: {
  buildingId?: string;
  isLightOn?: boolean;
  roofRef?: RefObject<THREE.Group | null>;
  interiorRef?: RefObject<THREE.Group | null>;
  tier?: HouseTier;
  backyard?: BackyardExtensionType;
  selected?: boolean;
  floorView?: 1 | 2;
}) {
  const mats = SHARED_BUILDING_MATS;

  return (
    <group>
      <group position={[0, 0, 0.65]} scale={[1.15, 1, 1.25]}>
      {tier === 1 && (
        <>
          <mesh geometry={t1StoneFoundationGeo} material={mats.stoneMed} receiveShadow />
          <mesh geometry={t1FloorGeo} material={mats.floorPlanks} receiveShadow />
          <mesh geometry={t1WallsGeo} material={mats.timberPlanks} castShadow receiveShadow />
          <mesh geometry={t1BeamsGeo} material={mats.timberDark} />

          <group ref={roofRef}>
            <mesh geometry={t1RoofGeo} material={mats.thatchRoof} castShadow receiveShadow />
            <mesh geometry={t1RoofGablesGeo} material={mats.timberPlanks} castShadow receiveShadow />
            <mesh geometry={t1RoofTrimGeo} material={mats.thatchDark} />
            <mesh geometry={t1ChimneyGeo} material={mats.stoneMed} receiveShadow />
            <ChimneyFlue y={2.53} />
            <ChimneySmoke position={[-0.15, 2.63, -0.25]} residentialBuildingId={buildingId ?? null} />
          </group>

          <group ref={interiorRef} visible={false}>
            <mesh geometry={t1InteriorHearthGeo} material={mats.stoneMed} receiveShadow />
            <IndoorFireplaceFire position={[-0.15, 0.17, -0.37]} scale={0.75} isLit={isLightOn} />
            <mesh geometry={t1InteriorFurnitureGeo} material={mats.timberDark} receiveShadow />
            <mesh geometry={t1InteriorLinensGeo} material={mats.bedLinenRed} receiveShadow />
            <mesh geometry={t1InteriorPillowsGeo} material={mats.pillowWhite} />
            <GroundRoomDetails isLightOn={isLightOn} />
            <mesh material={mats.rugPattern} position={[0, 0.14, -0.05]} receiveShadow>
              <boxGeometry args={[0.96, 0.01, 0.66]} />
            </mesh>
          </group>
        </>
      )}

      {tier === 2 && (
        <>
          <mesh geometry={t1StoneFoundationGeo} material={mats.stoneDark} receiveShadow />
          <mesh geometry={t1FloorGeo} material={mats.floorPlanks} receiveShadow />
          <mesh geometry={t1WallsGeo} material={mats.wattleDaub} castShadow receiveShadow />
          <mesh geometry={t1BeamsGeo} material={mats.timberDark} />

          <group visible={!selected || floorView === 2}>
            <mesh geometry={t2UpperFloorPlanksGeo} material={mats.floorPlanks} receiveShadow />
            <mesh geometry={t2UpperWallsGeo} material={mats.plaster} castShadow receiveShadow />
            <mesh geometry={t2UpperBeamsGeo} material={mats.timberDark} />
            <group visible={selected && floorView === 2}>
              <mesh geometry={t2UpperBedsGeo} material={mats.timberDark} receiveShadow />
              <mesh geometry={t2UpperLinensGeo} material={mats.bedLinenBlue} receiveShadow />
              <UpperRoomDetails tier={tier} />
            </group>
          </group>
          <mesh geometry={t2LadderGeo} material={mats.timberDark} />

          <group ref={roofRef}>
            <mesh geometry={t2RoofGeo} material={mats.thatchRoof} castShadow receiveShadow />
            <mesh geometry={t2RoofGablesGeo} material={mats.timberPlanks} castShadow receiveShadow />
            <mesh geometry={tier2Roof.trim} material={mats.thatchDark} />
            <mesh geometry={t2ChimneyGeo} material={mats.stoneMed} receiveShadow />
            <ChimneyFlue y={3.56} />
            <ChimneySmoke position={[-0.15, 3.66, -0.25]} residentialBuildingId={buildingId ?? null} />
          </group>

          <group ref={interiorRef} visible={false}>
            <mesh geometry={t1InteriorHearthGeo} material={mats.stoneMed} receiveShadow />
            <IndoorFireplaceFire position={[-0.15, 0.17, -0.37]} scale={0.85} isLit={isLightOn} />
            <mesh geometry={t1InteriorFurnitureGeo} material={mats.timberDark} receiveShadow />
            <mesh geometry={t1InteriorLinensGeo} material={mats.bedLinenRed} receiveShadow />
            <mesh geometry={t1InteriorPillowsGeo} material={mats.pillowWhite} />
            <GroundRoomDetails isLightOn={isLightOn} />

            <mesh material={mats.rugPattern} position={[0, 0.14, -0.05]} receiveShadow>
              <boxGeometry args={[0.96, 0.01, 0.66]} />
            </mesh>
          </group>
        </>
      )}

      {tier === 3 && (
        <>
          <mesh geometry={t1StoneFoundationGeo} material={mats.stoneDark} receiveShadow />
          <mesh geometry={t1FloorGeo} material={mats.floorPlanks} receiveShadow />
          <mesh geometry={t1WallsGeo} material={mats.timberPlanks} castShadow receiveShadow />
          <group visible={!selected || floorView === 2}>
            <mesh geometry={t3FacadeTrimGeo} material={mats.stoneDark} castShadow receiveShadow />
            <mesh geometry={t3TimberJoineryGeo} material={mats.timberDark} castShadow receiveShadow />
          </group>
          <group visible={!selected || floorView === 2}>
            <mesh geometry={t2UpperFloorPlanksGeo} material={mats.floorPlanks} receiveShadow />
            <mesh geometry={t2UpperWallsGeo} material={mats.timberPlanks} castShadow receiveShadow />
            <group visible={selected && floorView === 2}>
              <mesh geometry={t3UpperBedsGeo} material={mats.timberDark} receiveShadow />
              <mesh geometry={t3UpperLinensGeo} material={mats.bedLinenBlue} receiveShadow />
              <UpperRoomDetails tier={tier} />
            </group>
          </group>
          <mesh geometry={t2LadderGeo} material={mats.timberDark} />

          <group ref={roofRef}>
            <mesh geometry={t3RoofGeo} material={mats.gothicSlateRoof} castShadow receiveShadow />
            <mesh geometry={t3RoofGablesGeo} material={mats.timberPlanks} castShadow receiveShadow />
            <mesh geometry={tier3Roof.trim} material={mats.gothicSlateRidge} />
            <mesh geometry={t3ChimneyGeo} material={mats.stoneMed} receiveShadow />
            <ChimneyFlue x={-0.28} y={3.60} />
            <ChimneyFlue x={-0.02} y={3.60} />
            <ChimneySmoke position={[-0.28, 3.70, -0.25]} residentialBuildingId={buildingId ?? null} />
          </group>

          <group ref={interiorRef} visible={false}>
            <mesh geometry={t1InteriorHearthGeo} material={mats.stoneMed} receiveShadow />
            <IndoorFireplaceFire position={[-0.15, 0.17, -0.37]} scale={0.95} isLit={isLightOn} />
            <mesh geometry={t1InteriorFurnitureGeo} material={mats.timberDark} receiveShadow />
            <mesh geometry={t1InteriorLinensGeo} material={mats.bedLinenRed} receiveShadow />
            <mesh geometry={t1InteriorPillowsGeo} material={mats.pillowWhite} />
            <GroundRoomDetails isLightOn={isLightOn} />

            <mesh material={mats.velvetRed} position={[0, 0.14, -0.05]} receiveShadow>
              <boxGeometry args={[0.96, 0.01, 0.66]} />
            </mesh>
          </group>
        </>
      )}
      <HouseFacade tier={tier} upperVisible={!selected || floorView === 2} isLightOn={isLightOn} />
      </group>

      <group position={[0, 0, 0.91]} scale={[1.15, 1, 1.65]}>
        <mesh geometry={burgageBackyardFenceGeo} material={mats.timberDark} castShadow receiveShadow />

        <BackyardExtensionModel type={backyard} />

      </group>
    </group>
  );
}

export {
  t1RoofGeo as peasantHouseRoofGeometry,
  t1RoofTrimGeo as peasantHouseRoofTrimGeometry,
  t1RoofGeo as peasantThatchRoofGeometry,
  t1RoofTrimGeo as peasantThatchDarkGeometry,
};

const exteriorCache = new Map<string, StaticMeshPart[]>();

export function getPeasantHouseExteriorParts(tier: HouseTier, backyard: BackyardExtensionType): StaticMeshPart[] {
  const key = `${tier}:${backyard}`;
  let parts = exteriorCache.get(key);
  if (!parts) {
    parts = mergeStaticMeshParts(PeasantHouseModel({ tier, backyard }), expandHouseStaticPart);
    exteriorCache.set(key, parts);
  }
  return parts;
}

export function getPeasantHouseExteriorMaterial(material: THREE.Material, isNight: boolean) {
  return isNight && material === cottageGlass ? SHARED_BUILDING_MATS.windowLit : material;
}

const backyardPartsCache = new Map<BackyardExtensionType, StaticMeshPart[]>();
export function getPeasantBackyardParts(backyard: BackyardExtensionType): StaticMeshPart[] {
  let parts = backyardPartsCache.get(backyard);
  if (!parts) {
    parts = mergeStaticMeshParts(<group position={[0, 0, 0.91]} scale={[1.15, 1, 1.65]}>
      {(BACKYARD_MODELS[backyard] ?? []).map((part, i) => <mesh key={i} {...part} castShadow receiveShadow />)}
    </group>, expandHouseStaticPart);
    backyardPartsCache.set(backyard, parts);
  }
  return parts;
}

export function PeasantHouseEffects({ buildingId, tier, backyard }: { buildingId?: string; tier: HouseTier; backyard: BackyardExtensionType }) {
  return <group>
    <group position={[0, 0, 0.65]} scale={[1.15, 1, 1.25]}>
      <ChimneySmoke position={tier === 1 ? [-0.15, 2.63, -0.25] : tier === 2 ? [-0.15, 3.66, -0.25] : [-0.28, 3.70, -0.25]} residentialBuildingId={buildingId ?? null} />
    </group>
    <group position={[0, 0, 0.91]} scale={[1.15, 1, 1.65]}><BackyardAnimals type={backyard} /></group>
  </group>;
}
