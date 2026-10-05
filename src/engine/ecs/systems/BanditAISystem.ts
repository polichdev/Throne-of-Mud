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

const ONE_DAY_TICKS = 8640;

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
        if (distToTarget <= 4.0) {
          this.squad.state = 'camping';
          this.squad.campTicksRemaining = Math.floor(ONE_DAY_TICKS * (1.0 + Math.random() * 1.0));
          leader.path = [];
          this.broadcastSpeech(this.squad, CAMP_PHRASES, currentTick, 35);
        } else {
          this.selectNewDestination(grid, regions, leader);
        }
      }

      this.updateMarchingFormation(grid, leader, lx, lz, currentTick);

      if (currentTick - this.squad.lastBubbleTick > 350 && Math.random() < 0.3) {
        this.broadcastSpeech(this.squad, MARCH_PHRASES, currentTick, 28);
      }
    } else if (this.squad.state === 'camping') {
      this.squad.campTicksRemaining--;

      this.updateCampingPerimeter(lx, lz);

      if (currentTick - this.squad.lastBubbleTick > 500 && Math.random() < 0.25) {
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
      if (c.factionId === 'bandit') {
        existingBandits.push(c);
      }
    }

    if (existingBandits.length >= 6) {
      const leader = existingBandits.find((b) => b.id.includes('leader')) || existingBandits[0];
      const members = existingBandits.filter((b) => b.id !== leader.id).map((b) => b.id);
      this.squad = {
        leaderId: leader.id,
        memberIds: members,
        state: 'camping',
        targetPos: [leader.gridPosition?.[0] || 20, leader.gridPosition?.[1] || 20],
        campTicksRemaining: Math.floor(ONE_DAY_TICKS * (0.5 + Math.random() * 1.0)),
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
      moveSpeed: 1.25,
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
      state: 'camping',
      targetPos: [sx, sz],
      campTicksRemaining: Math.floor(ONE_DAY_TICKS * (1.0 + Math.random() * 1.0)),
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

    const candidateDestinations: [number, number][] = [];

    for (const r of regions) {
      const minX = r.bounds.minX + 5;
      const maxX = r.bounds.maxX - 5;
      const minZ = r.bounds.minZ + 5;
      const maxZ = r.bounds.maxZ - 5;

      candidateDestinations.push([minX + 4, minZ + 4]);
      candidateDestinations.push([maxX - 4, minZ + 4]);
      candidateDestinations.push([minX + 4, maxZ - 4]);
      candidateDestinations.push([maxX - 4, maxZ - 4]);
      candidateDestinations.push([Math.floor((minX + maxX) / 2), minZ + 3]);
      candidateDestinations.push([Math.floor((minX + maxX) / 2), maxZ - 3]);
    }

    const validDestinations = candidateDestinations.filter(([x, z]) => {
      const t = grid.getTile(x, z);
      return t && t.terrain !== 'water' && distance2D(lx, lz, x, z) > 30;
    });

    if (validDestinations.length === 0) return;

    const chosen = validDestinations[Math.floor(Math.random() * validDestinations.length)];
    this.squad.targetPos = chosen;

    const startPos: [number, number] = [Math.floor(lx), Math.floor(lz)];
    const path = AStar.findPath(grid, startPos, chosen, true);
    if (path && path.length > 0) {
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

      if (distToSpot > 6.0) {
        if (!member.path || member.path.length === 0 || currentTick % 25 === 0) {
          const p = AStar.findPath(
            grid,
            [Math.floor(mx), Math.floor(mz)],
            [Math.floor(targetX), Math.floor(targetZ)],
            true
          );
          if (p && p.length > 0) {
            member.path = p;
          }
        }
        member.moveSpeed = 1.45;
      } else if (distToSpot > 1.2) {
        member.path = [[Math.floor(targetX), Math.floor(targetZ)]];
        member.moveSpeed = distToSpot > 3.0 ? 1.40 : 1.30;
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
