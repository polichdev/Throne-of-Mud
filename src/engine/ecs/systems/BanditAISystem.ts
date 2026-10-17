import { BANDITS } from '../../../constants/bandits';
import { world, characterEntities, type GameEntity } from '../world';
import { GridMap } from '../../grid/GridMap';
import { AStar } from '../../pathfinding/AStar';
import { useGameStore } from '../../../store/useGameStore';
import { distance2D } from '../../../utils/mathUtils';
import type { RegionData } from '../../../types/game';
import { translations } from '../../../i18n';

interface BanditSquadState {
  leaderId: string;
  memberIds: string[];
  state: 'marching' | 'camping';
  targetPos: [number, number];
  campTicksRemaining: number;
  lastTargetRegionIndex: number;
  lastBubbleTick: number;
}

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

      if (distToTarget <= BANDITS.arrivalDistance || (!hasPath && currentTick % BANDITS.repathIntervalTicks === 0)) {
        if (distToTarget <= BANDITS.campArrivalDistance) {
          this.squad.state = 'camping';
          this.squad.campTicksRemaining = Math.floor(BANDITS.campMinTicks + Math.random() * BANDITS.campTickVariation);
          leader.path = [];
          this.broadcastSpeech(this.squad, this.getCampPhrases(), currentTick, BANDITS.arrivalSpeechTicks);
        } else {
          this.selectNewDestination(grid, regions, leader);
        }
      }

      this.updateMarchingFormation(grid, leader, lx, lz, currentTick);

      if (currentTick - this.squad.lastBubbleTick > BANDITS.marchSpeechCooldownTicks && Math.random() < BANDITS.marchSpeechChance) {
        this.broadcastSpeech(this.squad, this.getMarchPhrases(), currentTick, BANDITS.ambientSpeechTicks);
      }
    } else if (this.squad.state === 'camping') {
      this.squad.campTicksRemaining--;

      this.updateCampingPerimeter(lx, lz);

      if (currentTick - this.squad.lastBubbleTick > BANDITS.campSpeechCooldownTicks && Math.random() < BANDITS.campSpeechChance) {
        this.broadcastSpeech(this.squad, this.getCampPhrases(), currentTick, BANDITS.ambientSpeechTicks);
      }

      if (this.squad.campTicksRemaining <= 0) {
        this.squad.state = 'marching';
        this.selectNewDestination(grid, regions, leader);
        this.broadcastSpeech(this.squad, this.getMarchPhrases(), currentTick, BANDITS.departureSpeechTicks);
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

    if (existingBandits.length >= BANDITS.minRestoredSquadSize) {
      const leader = existingBandits.find((b) => b.id.includes('leader')) || existingBandits[0];
      const members = existingBandits.filter((b) => b.id !== leader.id).map((b) => b.id);
      this.squad = {
        leaderId: leader.id,
        memberIds: members,
        state: 'marching',
        targetPos: [leader.gridPosition?.[0] || BANDITS.fallbackTargetCoord, leader.gridPosition?.[1] || BANDITS.fallbackTargetCoord],
        campTicksRemaining: BANDITS.initialCampTicks,
        lastTargetRegionIndex: 0,
        lastBubbleTick: 0,
      };
      return;
    }

    const remoteSpawn = this.findRemoteWildernessSpot(grid, regions, playerRegionId);
    const sx = remoteSpawn[0];
    const sz = remoteSpawn[1];

    const lang = useGameStore.getState().language;
    const dict = translations[lang].military;
    const leaderId = `bandit-leader-${Date.now()}`;
    world.add({
      id: leaderId,
      name: dict.banditLeaderName,
      title: dict.banditLeaderTitle,
      characterClass: 'bandit',
      avatarColor: '#b91c1c',
      isCharacter: true,
      factionId: 'bandit',
      gridPosition: [sx, sz],
      position: [sx + 0.5, 0.3, sz + 0.5],
      moveSpeed: BANDITS.formationNormalSpeed,
      gold: BANDITS.leaderGold,
      skills: { ...BANDITS.leaderSkills },
      needs: { ...BANDITS.leaderNeeds },
      currentJob: { id: `wander-${leaderId}`, type: 'wander', progress: 0, totalWork: 0 },
    });

    const memberIds: string[] = [];
    const count = BANDITS.memberCount;
    const names = this.getBanditNames();
    for (let i = 0; i < count; i++) {
      const memId = `bandit-member-${i + 1}-${Date.now()}`;
      const off = FORMATION_OFFSETS[i] || [0, 0];
      const mx = Math.max(2, Math.min(grid.width - 3, sx + Math.round(off[0])));
      const mz = Math.max(2, Math.min(grid.height - 3, sz + Math.round(off[1])));

      world.add({
        id: memId,
        name: names[i % names.length],
        title: dict.banditTitle,
        characterClass: 'bandit',
        avatarColor: '#334155',
        isCharacter: true,
        factionId: 'bandit',
        gridPosition: [mx, mz],
        position: [mx + 0.5, 0.3, mz + 0.5],
        moveSpeed: BANDITS.memberMoveSpeed,
        gold: BANDITS.memberStartGold + (i * BANDITS.memberGoldPerIndex),
        skills: { ...BANDITS.memberSkills },
        needs: { ...BANDITS.memberNeeds },
        currentJob: { id: `wander-${memId}`, type: 'wander', progress: 0, totalWork: 0 },
      });
      memberIds.push(memId);
    }

    this.squad = {
      leaderId,
      memberIds,
      state: 'marching',
      targetPos: [sx, sz],
      campTicksRemaining: BANDITS.initialCampTicks,
      lastTargetRegionIndex: 0,
      lastBubbleTick: 0,
    };
  }

  private static findRemoteWildernessSpot(grid: GridMap, regions: RegionData[], playerRegionId: number): [number, number] {
    const candidates: [number, number][] = [
      [BANDITS.wildernessMinMargin, BANDITS.wildernessMinMargin],
      [BANDITS.wildernessMinMargin, grid.height - BANDITS.wildernessMaxMargin],
      [grid.width - BANDITS.wildernessMaxMargin, BANDITS.wildernessMinMargin],
      [grid.width - BANDITS.wildernessMaxMargin, grid.height - BANDITS.wildernessMaxMargin],
      [Math.floor(grid.width / 2), BANDITS.wildernessMinMargin],
      [Math.floor(grid.width / 2), grid.height - BANDITS.wildernessMaxMargin],
      [BANDITS.wildernessMinMargin, Math.floor(grid.height / 2)],
      [grid.width - BANDITS.wildernessMaxMargin, Math.floor(grid.height / 2)],
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

    const minX = Math.max(BANDITS.destinationMargin, targetRegion.bounds.minX + BANDITS.destinationMargin);
    const maxX = Math.min(grid.width - BANDITS.destinationMaxMargin, targetRegion.bounds.maxX - BANDITS.destinationMargin);
    const minZ = Math.max(BANDITS.destinationMargin, targetRegion.bounds.minZ + BANDITS.destinationMargin);
    const maxZ = Math.min(grid.height - BANDITS.destinationMaxMargin, targetRegion.bounds.maxZ - BANDITS.destinationMargin);

    const candidates: [number, number][] = [
      [targetRegion.center[0], targetRegion.center[1]],
      [minX + BANDITS.destinationCornerInset, minZ + BANDITS.destinationCornerInset],
      [maxX - BANDITS.destinationCornerInset, minZ + BANDITS.destinationCornerInset],
      [minX + BANDITS.destinationCornerInset, maxZ - BANDITS.destinationCornerInset],
      [maxX - BANDITS.destinationCornerInset, maxZ - BANDITS.destinationCornerInset],
      [Math.floor((minX + maxX) / 2), Math.floor((minZ + maxZ) / 2)],
    ];

    const validSpots: [number, number][] = candidates.filter(([x, z]) => grid.isWalkable(x, z));
    const chosenTarget: [number, number] = validSpots.length > 0 ? validSpots[Math.floor(Math.random() * validSpots.length)] : [targetRegion.center[0], targetRegion.center[1]];

    const totalDist = Math.hypot(chosenTarget[0] - lx, chosenTarget[1] - lz);

    let finalTarget: [number, number] = chosenTarget;
    if (totalDist > BANDITS.longMarchDistance) {
      const stepDist = BANDITS.marchStepDistance + Math.random() * BANDITS.marchStepVariation;
      const dirX = (chosenTarget[0] - lx) / totalDist;
      const dirZ = (chosenTarget[1] - lz) / totalDist;
      let stepX = Math.max(BANDITS.marchMinMargin, Math.min(grid.width - BANDITS.marchMaxMargin, Math.round(lx + dirX * stepDist)));
      let stepZ = Math.max(BANDITS.marchMinMargin, Math.min(grid.height - BANDITS.marchMaxMargin, Math.round(lz + dirZ * stepDist)));

      if (!grid.isWalkable(stepX, stepZ)) {
        for (let r = 1; r <= BANDITS.blockedTargetSearchRadius; r++) {
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
    let path = AStar.findPath(grid, startPos, finalTarget, true, undefined, BANDITS.pathIterationBudget);

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
      if (Math.hypot(dx, dz) > BANDITS.facingEpsilon) {
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

      if (distToSpot > BANDITS.formationRepathDistance) {
        if ((!member.path || member.path.length === 0) && i === currentTick % Math.max(1, this.squad.memberIds.length)) {
          const searchBounds = {
            minX: Math.max(0, Math.min(Math.floor(mx), Math.floor(targetX)) - BANDITS.formationSearchMargin),
            maxX: Math.min(grid.width - 1, Math.max(Math.floor(mx), Math.floor(targetX)) + BANDITS.formationSearchMargin),
            minZ: Math.max(0, Math.min(Math.floor(mz), Math.floor(targetZ)) - BANDITS.formationSearchMargin),
            maxZ: Math.min(grid.height - 1, Math.max(Math.floor(mz), Math.floor(targetZ)) + BANDITS.formationSearchMargin),
          };
          const p = AStar.findPath(
            grid,
            [Math.floor(mx), Math.floor(mz)],
            [Math.floor(targetX), Math.floor(targetZ)],
            true,
            searchBounds,
            BANDITS.formationPathBudget
          );
          if (p && p.length > 0) {
            member.path = p;
          } else {
            member.path = [[Math.floor(targetX), Math.floor(targetZ)]];
          }
        }
        member.moveSpeed = BANDITS.catchupSpeed;
      } else if (distToSpot > 1.0) {
        member.path = [[Math.floor(targetX), Math.floor(targetZ)]];
        member.moveSpeed = distToSpot > BANDITS.formationFastDistance ? BANDITS.formationFastSpeed : BANDITS.formationNormalSpeed;
      } else {
        member.path = [];
        member.moveSpeed = BANDITS.formationIdleSpeed;
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
      const campX = lx + Math.sin(a) * BANDITS.campRadius;
      const campZ = lz + Math.cos(a) * BANDITS.campRadius;

      const mx = member.position[0];
      const mz = member.position[2];
      const dist = distance2D(mx, mz, campX, campZ);

      if (dist > BANDITS.campSpotTolerance) {
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

    const speakerId = Math.random() < BANDITS.leaderSpeechChance ? squad.leaderId : squad.memberIds[Math.floor(Math.random() * squad.memberIds.length)];
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

  private static getBanditNames(): string[] {
    const lang = useGameStore.getState().language;
    return translations[lang].military.banditNames;
  }

  private static getMarchPhrases(): string[] {
    const lang = useGameStore.getState().language;
    return translations[lang].military.banditMarchPhrases;
  }

  private static getCampPhrases(): string[] {
    const lang = useGameStore.getState().language;
    return translations[lang].military.banditCampPhrases;
  }
}
