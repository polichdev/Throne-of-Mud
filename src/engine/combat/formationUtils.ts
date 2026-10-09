export function getFormationOffsets(count: number, facingAngle = 0): [number, number][] {
  let localOffsets: [number, number][];

  if (count >= 5) {
    localOffsets = [
      [-0.65, 0.0],
      [0.65, 0.0],
      [-0.65, 1.25],
      [0.65, 1.25],
      [0.0, 2.5],
    ];
  } else if (count === 4) {
    localOffsets = [
      [-0.65, 0.0],
      [0.65, 0.0],
      [-0.65, 1.25],
      [0.65, 1.25],
    ];
  } else if (count === 3) {
    localOffsets = [
      [-0.65, 0.0],
      [0.65, 0.0],
      [0.0, 1.25],
    ];
  } else if (count === 2) {
    localOffsets = [
      [-0.65, 0.0],
      [0.65, 0.0],
    ];
  } else {
    localOffsets = [[0.0, 0.0]];
  }

  const active = localOffsets.slice(0, count);

  const fwdX = Math.sin(facingAngle);
  const fwdZ = Math.cos(facingAngle);
  const rightX = Math.cos(facingAngle);
  const rightZ = -Math.sin(facingAngle);

  return active.map(([colX, rowZ]) => [
    rightX * colX - fwdX * rowZ,
    rightZ * colX - fwdZ * rowZ,
  ]);
}

export function isMilitiaDestinationAllowed(
  grid: { width: number; height: number; getTile: (x: number, z: number) => any },
  tileX: number,
  tileZ: number,
  playerRegionBounds?: { minX: number; maxX: number; minZ: number; maxZ: number }
): boolean {
  if (tileX < 1 || tileX >= grid.width - 1 || tileZ < 1 || tileZ >= grid.height - 1) {
    return false;
  }

  const tile = grid.getTile(tileX, tileZ);
  if (!tile) return false;

  if (tile.terrain === 'water') return false;

  if (tile.buildingId) return false;

  if (playerRegionBounds) {
    if (
      tileX < playerRegionBounds.minX ||
      tileX > playerRegionBounds.maxX ||
      tileZ < playerRegionBounds.minZ ||
      tileZ > playerRegionBounds.maxZ
    ) {
      return false;
    }
  }

  return true;
}
