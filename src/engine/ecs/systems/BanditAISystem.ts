import { world, characterEntities, type GameEntity } from '../world';
import { GridMap } from '../../grid/GridMap';
import { AStar } from '../../pathfinding/AStar';
import { useGameStore } from '../../../store/useGameStore';
import { distance2D } from '../../../utils/mathUtils';
import type { RegionData } from '../../../types/game';

interface BanditSquadState {
  leaderId: string;
  memberIds: string[];
  state: 'marching' | 'camping';
  targetPos: [number, number];
  campTicksRemaining: number;
  lastTargetRegionIndex: number;
  lastBubbleTick: number;
}

const BANDIT_NAMES = [
  'Розбійник-рубака',
  'Лісовий шибайголова',
  'Бандит-стрілець',
  'Розбійник-списник',
  'Степовий грабіжник',
  'Розбійник-сокирник',
  'Бандит-розвідник',
  'Розбійник-нальотчик',
];

const MARCH_PHRASES = [
  'Тримайте стрій, хлопці!',
  'Вирушаємо крізь лісові хащі...',
  'Слідуйте за мною, не відставати!',
  'Обходимо пагорби та дороги...',
  'Тихо крізь хащі, нікому не попадатись на очі.',
  'Уперед, загін!',
];

const CAMP_PHRASES = [
  'Стаємо на привал!',
  'Оглянути периметр та дикі стежки.',
  'У цих нетрях безпечно, перепочинемо.',
  'Чистіть клинки та перевірте зброю.',
  'Ні душі навколо, все чисто.',
  'Скоро вирушаємо далі...',
];

const FORMATION_OFFSETS: [number, number][] = [
  [-1.0, -1.3],
  [1.0, -1.3],
  [-1.3, -2.6],
  [1.3, -2.6],
  [-1.0, -3.9],
  [1.0, -3.9],
  [-1.3, -5.2],
  [1.3, -5.2],
];

export class BanditAISystem {
  private static squad: BanditSquadState | null = null;

  public static reset(): void {
    this.squad = null;
  }

  public static update(grid: GridMap, currentTick: number): void {
    const { regions, playerRegionId } = useGameStore.getState();
    if (!regions || regions.length === 0) return;

    this.ensureSquadSpawned(grid, regions, playerRegionId ?? 0);
    if (!this.squad) return;

    const leader = this.getEntityById(this.squad.leaderId);
    if (!leader || !leader.position) return;

    const lx = leader.position[0];
    const lz = leader.position[2];

    if (this.squad.state === 'marching') {
      const distToTarget = distance2D(lx, lz, this.squad.targetPos[0], this.squad.targetPos[1]);
      const hasPath = Boolean(leader.path && leader.path.length > 0);

      if (distToTarget <= 3.5 || (!hasPath && currentTick % 30 === 0)) {
        if (distToTarget <= 4.5) {
          this.squad.state = 'camping';
          this.squad.campTicksRemaining = Math.floor(70 + Math.random() * 50);
          leader.path = [];
          this.broadcastSpeech(this.squad, CAMP_PHRASES, currentTick, 35);
        } else {
          this.selectNewDestination(grid, regions, leader);
        }
      }

      this.updateMarchingFormation(grid, leader, lx, lz, currentTick);

      if (currentTick - this.squad.lastBubbleTick > 250 && Math.random() < 0.35) {
        this.broadcastSpeech(this.squad, MARCH_PHRASES, currentTick, 28);
      }
    } else if (this.squad.state === 'camping') {
      this.squad.campTicksRemaining--;

      this.updateCampingPerimeter(lx, lz);

      if (currentTick - this.squad.lastBubbleTick > 280 && Math.random() < 0.3) {
        this.broadcastSpeech(this.squad, CAMP_PHRASES, currentTick, 28);
      }

      if (this.squad.campTicksRemaining <= 0) {
        this.squad.state = 'marching';
        this.selectNewDestination(grid, regions, leader);
        this.broadcastSpeech(this.squad, MARCH_PHRASES, currentTick, 30);
      }
    }
  }

  private static ensureSquadSpawned(grid: GridMap, regions: RegionData[], playerRegionId: number): void {
    if (this.squad) {
      const leader = this.getEntityById(this.squad.leaderId);
      if (leader) return;
    }

    const existingBandits: GameEntity[] = [];
    for (const c of characterEntities) {
      if (c.factionId === 'bandit' || c.characterClass === 'bandit') {
        c.regionId = undefined;
        existingBandits.push(c);
      }
    }

    if (existingBandits.length >= 6) {
      const leader = existingBandits.find((b) => b.id.includes('leader')) || existingBandits[0];
      const members = existingBandits.filter((b) => b.id !== leader.id).map((b) => b.id);
      this.squad = {
        leaderId: leader.id,
        memberIds: members,
        state: 'marching',
        targetPos: [leader.gridPosition?.[0] || 20, leader.gridPosition?.[1] || 20],
        campTicksRemaining: 25,
        lastTargetRegionIndex: 0,
        lastBubbleTick: 0,
      };
      return;
    }

    const remoteSpawn = this.findRemoteWildernessSpot(grid, regions, playerRegionId);
    const sx = remoteSpawn[0];
    const sz = remoteSpawn[1];

    const leaderId = `bandit-leader-${Date.now()}`;
    world.add({
      id: leaderId,
      name: 'Ватажок Олекса',
      title: 'Ватажок розбійників',
      characterClass: 'bandit',
      avatarColor: '#b91c1c',
      isCharacter: true,
      factionId: 'bandit',
      gridPosition: [sx, sz],
      position: [sx + 0.5, 0.3, sz + 0.5],
      moveSpeed: 1.30,
      gold: 50,
      skills: { farming: 1, woodcutting: 4, mining: 2, building: 2, cooking: 2, brewing: 4, combat: 9, intellect: 7, charisma: 8 },
      needs: { hunger: 90, energy: 95, mood: 80, ale: 70, hygiene: 60 },
      currentJob: { id: `wander-${leaderId}`, type: 'wander', progress: 0, totalWork: 0 },
    });

    const memberIds: string[] = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      const memId = `bandit-member-${i + 1}-${Date.now()}`;
      const off = FORMATION_OFFSETS[i] || [0, 0];
      const mx = Math.max(2, Math.min(grid.width - 3, sx + Math.round(off[0])));
      const mz = Math.max(2, Math.min(grid.height - 3, sz + Math.round(off[1])));

      world.add({
        id: memId,
        name: BANDIT_NAMES[i % BANDIT_NAMES.length],
        title: 'Розбійник',
        characterClass: 'bandit',
        avatarColor: '#334155',
        isCharacter: true,
        factionId: 'bandit',
        gridPosition: [mx, mz],
        position: [mx + 0.5, 0.3, mz + 0.5],
        moveSpeed: 1.35,
        gold: 5 + (i * 2),
        skills: { farming: 1, woodcutting: 3, mining: 1, building: 1, cooking: 2, brewing: 2, combat: 7, intellect: 4, charisma: 3 },
        needs: { hunger: 85, energy: 90, mood: 75, ale: 60, hygiene: 55 },
        currentJob: { id: `wander-${memId}`, type: 'wander', progress: 0, totalWork: 0 },
      });
      memberIds.push(memId);
    }

    this.squad = {
      leaderId,
      memberIds,
      state: 'marching',
      targetPos: [sx, sz],
      campTicksRemaining: 25,
      lastTargetRegionIndex: 0,
      lastBubbleTick: 0,
    };
  }

  private static findRemoteWildernessSpot(grid: GridMap, regions: RegionData[], playerRegionId: number): [number, number] {
    const candidates: [number, number][] = [
      [16, 16],
      [16, grid.height - 18],
      [grid.width - 18, 16],
      [grid.width - 18, grid.height - 18],
      [Math.floor(grid.width / 2), 16],
      [Math.floor(grid.width / 2), grid.height - 18],
      [16, Math.floor(grid.height / 2)],
      [grid.width - 18, Math.floor(grid.height / 2)],
    ];

    const pRegion = regions.find((r) => r.id === playerRegionId) || regions[0];
    const pcx = pRegion.center[0];
    const pcz = pRegion.center[1];

    let bestSpot = candidates[0];
    let maxDist = 0;

    for (const spot of candidates) {
      const tile = grid.getTile(spot[0], spot[1]);
      if (tile && tile.terrain !== 'water') {
        const d = distance2D(spot[0], spot[1], pcx, pcz);
        if (d > maxDist) {
          maxDist = d;
          bestSpot = spot;
        }
      }
    }

    return bestSpot;
  }

  private static selectNewDestination(grid: GridMap, regions: RegionData[], leader: GameEntity): void {
    if (!this.squad || !leader.position) return;

    const lx = leader.position[0];
    const lz = leader.position[2];

    const currentRegionId = this.squad.lastTargetRegionIndex ?? 0;
    const regionIds = [0, 4, 1, 3, 2, 5];
    const curIdx = regionIds.indexOf(currentRegionId);
    const nextIdx = (curIdx + 1 + Math.floor(Math.random() * 2)) % regionIds.length;
    const targetRegionId = regionIds[nextIdx];
    this.squad.lastTargetRegionIndex = targetRegionId;

    const targetRegion = regions.find((r) => r.id === targetRegionId) || regions[targetRegionId % regions.length];

    const minX = Math.max(8, targetRegion.bounds.minX + 8);
    const maxX = Math.min(grid.width - 9, targetRegion.bounds.maxX - 8);
    const minZ = Math.max(8, targetRegion.bounds.minZ + 8);
    const maxZ = Math.min(grid.height - 9, targetRegion.bounds.maxZ - 8);

    const candidates: [number, number][] = [
      [targetRegion.center[0], targetRegion.center[1]],
      [minX + 4, minZ + 4],
      [maxX - 4, minZ + 4],
      [minX + 4, maxZ - 4],
      [maxX - 4, maxZ - 4],
      [Math.floor((minX + maxX) / 2), Math.floor((minZ + maxZ) / 2)],
    ];

    const validSpots: [number, number][] = candidates.filter(([x, z]) => grid.isWalkable(x, z));
    const chosenTarget: [number, number] = validSpots.length > 0 ? validSpots[Math.floor(Math.random() * validSpots.length)] : [targetRegion.center[0], targetRegion.center[1]];

    const totalDist = Math.hypot(chosenTarget[0] - lx, chosenTarget[1] - lz);

    let finalTarget: [number, number] = chosenTarget;
    if (totalDist > 75) {
      const stepDist = 55 + Math.random() * 15;
      const dirX = (chosenTarget[0] - lx) / totalDist;
      const dirZ = (chosenTarget[1] - lz) / totalDist;
      let stepX = Math.max(5, Math.min(grid.width - 6, Math.round(lx + dirX * stepDist)));
      let stepZ = Math.max(5, Math.min(grid.height - 6, Math.round(lz + dirZ * stepDist)));

      if (!grid.isWalkable(stepX, stepZ)) {
        for (let r = 1; r <= 4; r++) {
          let found = false;
          for (let dx = -r; dx <= r; dx++) {
            for (let dz = -r; dz <= r; dz++) {
              const nx = stepX + dx;
              const nz = stepZ + dz;
              if (nx >= 2 && nx < grid.width - 2 && nz >= 2 && nz < grid.height - 2 && grid.isWalkable(nx, nz)) {
                stepX = nx;
                stepZ = nz;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
      }
      finalTarget = [stepX, stepZ];
    }

    this.squad.targetPos = finalTarget;

    const startPos: [number, number] = [Math.floor(lx), Math.floor(lz)];
    let path = AStar.findPath(grid, startPos, finalTarget, true, undefined, 5000);

    if (!path || path.length === 0) {
      const neighbors = grid.getNeighbors(startPos[0], startPos[1]).filter((n) => grid.isWalkable(n.x, n.z));
      if (neighbors.length > 0) {
        path = [[neighbors[0].x, neighbors[0].z]];
      }
    }

    if (path && path.length > 0) {
      if (path.length > 1 && path[0][0] === startPos[0] && path[0][1] === startPos[1]) {
        path.shift();
      }
      leader.path = path;
    }
  }

  private static updateMarchingFormation(
    grid: GridMap,
    leader: GameEntity,
    lx: number,
    lz: number,
    currentTick: number
  ): void {
    if (!this.squad) return;

    let dirAngle = 0;
    if (leader.path && leader.path.length > 0) {
      const nextWp = leader.path[0];
      const dx = nextWp[0] + 0.5 - lx;
      const dz = nextWp[1] + 0.5 - lz;
      if (Math.hypot(dx, dz) > 0.05) {
        dirAngle = Math.atan2(dx, dz);
      }
    }

    const cosA = Math.cos(dirAngle);
    const sinA = Math.sin(dirAngle);

    for (let i = 0; i < this.squad.memberIds.length; i++) {
      const memId = this.squad.memberIds[i];
      const member = this.getEntityById(memId);
      if (!member || !member.position) continue;

      const [offX, offZ] = FORMATION_OFFSETS[i] || [0, -1.5];
      const rotX = offX * cosA + offZ * sinA;
      const rotZ = -offX * sinA + offZ * cosA;

      const targetX = lx + rotX;
      const targetZ = lz + rotZ;

      const mx = member.position[0];
      const mz = member.position[2];
      const distToSpot = distance2D(mx, mz, targetX, targetZ);

      if (distToSpot > 10.0) {
        if ((!member.path || member.path.length === 0) && i === currentTick % Math.max(1, this.squad.memberIds.length)) {
          const searchBounds = {
            minX: Math.max(0, Math.min(Math.floor(mx), Math.floor(targetX)) - 10),
            maxX: Math.min(grid.width - 1, Math.max(Math.floor(mx), Math.floor(targetX)) + 10),
            minZ: Math.max(0, Math.min(Math.floor(mz), Math.floor(targetZ)) - 10),
            maxZ: Math.min(grid.height - 1, Math.max(Math.floor(mz), Math.floor(targetZ)) + 10),
          };
          const p = AStar.findPath(
            grid,
            [Math.floor(mx), Math.floor(mz)],
            [Math.floor(targetX), Math.floor(targetZ)],
            true,
            searchBounds,
            2000
          );
          if (p && p.length > 0) {
            member.path = p;
          } else {
            member.path = [[Math.floor(targetX), Math.floor(targetZ)]];
          }
        }
        member.moveSpeed = 1.45;
      } else if (distToSpot > 1.0) {
        member.path = [[Math.floor(targetX), Math.floor(targetZ)]];
        member.moveSpeed = distToSpot > 3.5 ? 1.40 : 1.30;
      } else {
        member.path = [];
        member.moveSpeed = 1.25;
      }
    }
  }

  private static updateCampingPerimeter(lx: number, lz: number): void {
    if (!this.squad) return;

    const angleStep = (Math.PI * 2) / Math.max(1, this.squad.memberIds.length);
    for (let i = 0; i < this.squad.memberIds.length; i++) {
      const memId = this.squad.memberIds[i];
      const member = this.getEntityById(memId);
      if (!member || !member.position) continue;

      const a = i * angleStep;
      const campX = lx + Math.sin(a) * 2.5;
      const campZ = lz + Math.cos(a) * 2.5;

      const mx = member.position[0];
      const mz = member.position[2];
      const dist = distance2D(mx, mz, campX, campZ);

      if (dist > 1.2) {
        member.path = [[Math.floor(campX), Math.floor(campZ)]];
      } else {
        member.path = [];
        if (member.currentJob?.type !== 'idle') {
          member.currentJob = { id: `camp-${memId}`, type: 'idle', progress: 0, totalWork: 0 };
        }
      }
    }
  }

  private static broadcastSpeech(
    squad: BanditSquadState,
    phrases: string[],
    currentTick: number,
    durationTicks: number
  ): void {
    squad.lastBubbleTick = currentTick;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    const speakerId = Math.random() < 0.6 ? squad.leaderId : squad.memberIds[Math.floor(Math.random() * squad.memberIds.length)];
    const speaker = this.getEntityById(speakerId);
    if (speaker) {
      speaker.speechBubble = {
        text: phrase,
        expiresAtTick: currentTick + durationTicks,
        type: 'alert',
      };
    }
  }

  private static getEntityById(id: string): GameEntity | undefined {
    for (const c of characterEntities) {
      if (c.id === id) return c;
    }
    return undefined;
  }
}
