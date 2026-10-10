import { world, characterEntities, buildingEntities, type GameEntity } from '../world';
import { GridMap } from '../../grid/GridMap';
import { AStar } from '../../pathfinding/AStar';
import { getBuildingDoorInfo } from '../../buildings/buildingNavigation';
import { useGameStore } from '../../../store/useGameStore';
import { distance2D } from '../../../utils/mathUtils';
import { TRADE_ITEMS_CONFIG } from '../../trade/tradeConfig';
import { audioManager } from '../../audio/AudioManager';

interface MerchantState {
  entityId: string;
  state: 'traveling_on_highway' | 'approaching_post' | 'trading' | 'returning_to_highway' | 'departing';
  currentTradingPostId?: string;
  highwayBranchPos: [number, number];
  lastVisitedHighwayX: number;
  tradingTicksRemaining: number;
  visitedPostIds: Set<string>;
  tradedPostIds: Set<string>;
  targetPos: [number, number];
  name: string;
  carriedGold: number;
  lastPos: [number, number];
  stalledTicks: number;
}

const MERCHANT_NAMES = [
  'Альбрехт з Аугсбурга',
  'Вальтер з Любека',
  'Брат Готфрід (Купець)',
  'Генріх фон Нюрнберг',
  'Купець Райнгольд',
  'Майстер Бруно',
];

const MERCHANT_ARRIVAL_PHRASES = [
  'Вітання володарю! Привіз добірні товари з далекої факторії.',
  'Чув про процвітання вашого поселення, глянемо на торгові лави!',
  'Мій віз повний краму, відкривайте комори!',
  'Добра дорога була сьогодні! Готовий до вигідних угод.',
];

const MERCHANT_DEPART_PHRASES = [
  'Дякую за щедру торгівлю! Повертаюся на головний тракт.',
  'Коні відпочили, час рушати далі головною дорогою.',
  'Хай повняться ваші скарбниці, я вирушаю далі на схід!',
];

function generateHighwayWaypoints(fromX: number, toX: number): [number, number][] {
  const pts: [number, number][] = [];
  const start = Math.max(2, Math.min(381, Math.round(fromX)));
  const end = Math.max(2, Math.min(381, Math.round(toX)));
  const step = start <= end ? 1 : -1;

  for (let x = start; step > 0 ? x <= end : x >= end; x += step) {
    pts.push([x, Math.round(GridMap.getHighwayZ(x))]);
  }
  return pts;
}

export class TradeSystem {
  private static merchantState: MerchantState | null = null;
  private static scheduledDay: number = -1;
  private static scheduledHour: number = 13;
  private static scheduledMinute: number = 0;
  private static hasSpawnedToday: boolean = false;
  private static lastSpeechTick: number = 0;

  public static reset(): void {
    if (this.merchantState) {
      const ent = world.entities.find((e) => e.id === this.merchantState?.entityId);
      if (ent) world.remove(ent);
    }
    this.merchantState = null;
    this.scheduledDay = -1;
    this.hasSpawnedToday = false;
  }

  public static update(grid: GridMap, currentTick: number): void {
    const { time, setCaravanStatus } = useGameStore.getState();
    const currentDay = time.day;

    if (this.scheduledDay !== currentDay) {
      if (this.merchantState) {
        const oldEnt = world.entities.find((e) => e.id === this.merchantState?.entityId);
        if (oldEnt) world.remove(oldEnt);
        this.merchantState = null;
      }

      this.scheduledDay = currentDay;
      this.hasSpawnedToday = false;
      this.scheduledHour = 13;
      this.scheduledMinute = 0;

      const name = MERCHANT_NAMES[(currentDay - 1) % MERCHANT_NAMES.length];
      setCaravanStatus({
        state: 'waiting',
        merchantName: name,
        nextArrivalHour: 13,
        nextArrivalMinute: 0,
      });
    }

    for (const ent of [...characterEntities]) {
      if (ent.isMerchant || ent.factionId === 'merchant' || ent.id.startsWith('merchant-')) {
        if (!this.merchantState || ent.id !== this.merchantState.entityId) {
          world.remove(ent);
        }
      }
    }

    if (!this.hasSpawnedToday && !this.merchantState) {
      const isTimeReached = time.hour > this.scheduledHour || (time.hour === this.scheduledHour && time.minute >= this.scheduledMinute);
      if (isTimeReached) {
        this.spawnMerchant(grid, currentDay);
      }
    }

    if (!this.merchantState) return;

    const merchant = world.entities.find((e) => e.id === this.merchantState?.entityId);
    if (!merchant || !merchant.position) {
      this.merchantState = null;
      return;
    }

    const mx = merchant.position[0];
    const mz = merchant.position[2];

    const distMovedSinceLast = distance2D(mx, mz, this.merchantState.lastPos[0], this.merchantState.lastPos[1]);
    this.merchantState.lastPos = [mx, mz];

    if (distMovedSinceLast < 0.04 && this.merchantState.state !== 'trading') {
      this.merchantState.stalledTicks++;
      if (this.merchantState.stalledTicks > 18) {
        this.merchantState.stalledTicks = 0;
        const curX = Math.round(mx);
        const curZ = Math.round(mz);
        const target = this.merchantState.targetPos;

        if (this.merchantState.state === 'traveling_on_highway') {
          merchant.path = generateHighwayWaypoints(curX, target[0]);
        } else if (this.merchantState.state === 'returning_to_highway') {
          if (GridMap.isTradeHighwayTile(curX, curZ) || Math.abs(curZ - GridMap.getHighwayZ(curX)) <= 2.0) {
            this.merchantState.state = 'traveling_on_highway';
            this.findNextDestination(grid, merchant);
            return;
          }
          const repath = AStar.findPath(grid, [curX, curZ], [target[0], target[1]], true, undefined, 6000);
          if (repath && repath.length > 0) {
            merchant.path = repath;
          } else {

            merchant.position[0] = target[0] + 0.5;
            merchant.position[2] = target[1] + 0.5;
            merchant.gridPosition = [target[0], target[1]];
            merchant.path = [];
            this.merchantState.state = 'traveling_on_highway';
            this.findNextDestination(grid, merchant);
            return;
          }
        } else if (this.merchantState.state === 'approaching_post') {
          const repath = AStar.findPath(grid, [curX, curZ], [target[0], target[1]], true, undefined, 6000);
          if (repath && repath.length > 0) {
            merchant.path = repath;
          } else {

            const postId = this.merchantState.currentTradingPostId;
            if (postId) {
              this.merchantState.visitedPostIds.add(postId);
              this.merchantState.lastVisitedHighwayX = Math.max(
                this.merchantState.lastVisitedHighwayX,
                this.merchantState.highwayBranchPos[0] + 3
              );
            }
            this.merchantState.currentTradingPostId = undefined;
            this.merchantState.state = 'returning_to_highway';
            this.merchantState.targetPos = [this.merchantState.highwayBranchPos[0], this.merchantState.highwayBranchPos[1]];
            const returnPath = AStar.findPath(grid, [curX, curZ], this.merchantState.targetPos, true, undefined, 6000);
            if (returnPath && returnPath.length > 0) {
              merchant.path = returnPath;
            } else {
              merchant.position[0] = this.merchantState.highwayBranchPos[0] + 0.5;
              merchant.position[2] = this.merchantState.highwayBranchPos[1] + 0.5;
              merchant.gridPosition = [this.merchantState.highwayBranchPos[0], this.merchantState.highwayBranchPos[1]];
              merchant.path = [];
              this.merchantState.state = 'traveling_on_highway';
              this.findNextDestination(grid, merchant);
              return;
            }
          }
        }
      }
    } else {
      this.merchantState.stalledTicks = 0;
    }

    if (mx >= 380 || time.hour >= 21) {
      this.departMerchant(merchant, setCaravanStatus);
      return;
    }

    if (this.merchantState.state === 'traveling_on_highway') {
      const distToTarget = distance2D(mx, mz, this.merchantState.targetPos[0], this.merchantState.targetPos[1]);
      const hasPath = Boolean(merchant.path && merchant.path.length > 0);

      if (distToTarget <= 2.0 || (!hasPath && currentTick % 12 === 0)) {
        if (this.merchantState.currentTradingPostId) {

          const post = world.entities.find((e) => e.id === this.merchantState?.currentTradingPostId);
          if (post && post.gridPosition) {
            const doorInfo = getBuildingDoorInfo(post);
            const destX = doorInfo.doorApproachPos[0];
            const destZ = doorInfo.doorApproachPos[1];

            this.merchantState.targetPos = [destX, destZ];
            this.merchantState.state = 'approaching_post';

            const curX = Math.round(mx);
            const curZ = Math.round(mz);
            const branchPath = AStar.findPath(grid, [curX, curZ], [destX, destZ], true, undefined, 6000);
            if (branchPath && branchPath.length > 0) {
              merchant.path = branchPath;
            } else {

              this.merchantState.visitedPostIds.add(post.id);
              this.merchantState.lastVisitedHighwayX = Math.max(
                this.merchantState.lastVisitedHighwayX,
                this.merchantState.highwayBranchPos[0] + 3
              );
              this.merchantState.currentTradingPostId = undefined;
              this.findNextDestination(grid, merchant);
            }
            return;
          }
        }

        this.findNextDestination(grid, merchant);
      }
    }

    else if (this.merchantState.state === 'approaching_post') {
      const distToPost = distance2D(mx, mz, this.merchantState.targetPos[0], this.merchantState.targetPos[1]);
      const hasPath = Boolean(merchant.path && merchant.path.length > 0);

      if (distToPost <= 2.2 || (!hasPath && distToPost <= 2.8)) {
        const postId = this.merchantState.currentTradingPostId;
        if (postId) {
          this.merchantState.visitedPostIds.add(postId);
          this.merchantState.lastVisitedHighwayX = Math.max(
            this.merchantState.lastVisitedHighwayX,
            this.merchantState.highwayBranchPos[0] + 3
          );
        }

        this.merchantState.state = 'trading';
        this.merchantState.tradingTicksRemaining = 60;
        merchant.path = [];
        if (postId) {
          const postEnt = world.entities.find((e) => e.id === postId);
          if (postEnt && postEnt.position) {
            merchant.currentJob = {
              id: `trade-${postId}`,
              type: 'idle',
              progress: 0,
              totalWork: 0,
              targetAngle: Math.atan2(postEnt.position[0] - mx, postEnt.position[2] - mz),
            };
          }
          this.executeTradeOnce(postId, currentTick);
        }
        setCaravanStatus({ state: 'trading' });
      } else if (!hasPath && currentTick % 15 === 0) {
        const curX = Math.round(mx);
        const curZ = Math.round(mz);
        const repath = AStar.findPath(grid, [curX, curZ], this.merchantState.targetPos, true, undefined, 6000);
        if (repath && repath.length > 0) {
          merchant.path = repath;
        }
      }
    }

    else if (this.merchantState.state === 'trading') {
      this.merchantState.tradingTicksRemaining--;
      if (this.merchantState.tradingTicksRemaining <= 0) {

        merchant.currentJob = { id: `merchant-return`, type: 'idle', progress: 0, totalWork: 0 };
        const branch = this.merchantState.highwayBranchPos;
        this.merchantState.currentTradingPostId = undefined;
        this.merchantState.state = 'returning_to_highway';
        this.merchantState.targetPos = [branch[0], branch[1]];

        const curX = Math.round(mx);
        const curZ = Math.round(mz);
        const returnPath = AStar.findPath(grid, [curX, curZ], [branch[0], branch[1]], true, undefined, 6000);
        if (returnPath && returnPath.length > 0) {
          merchant.path = returnPath;
        } else {

          merchant.position[0] = branch[0] + 0.5;
          merchant.position[2] = branch[1] + 0.5;
          merchant.gridPosition = [branch[0], branch[1]];
          merchant.path = [];
          this.merchantState.state = 'traveling_on_highway';
          this.findNextDestination(grid, merchant);
          return;
        }

        setCaravanStatus({ state: 'approaching' });
        this.sayPhrase(merchant, MERCHANT_DEPART_PHRASES, currentTick);
      }
    }

    else if (this.merchantState.state === 'returning_to_highway') {
      const distToHighway = distance2D(mx, mz, this.merchantState.targetPos[0], this.merchantState.targetPos[1]);
      const isOnHighwayTile = Math.abs(mz - GridMap.getHighwayZ(mx)) <= 2.0 || distToHighway <= 2.0;
      const hasPath = Boolean(merchant.path && merchant.path.length > 0);

      if (isOnHighwayTile && (!hasPath || distToHighway <= 2.0)) {

        this.merchantState.state = 'traveling_on_highway';
        this.findNextDestination(grid, merchant);
      } else if (!hasPath && currentTick % 15 === 0) {
        const curX = Math.round(mx);
        const curZ = Math.round(mz);
        const returnPath = AStar.findPath(grid, [curX, curZ], this.merchantState.targetPos, true, undefined, 6000);
        if (returnPath && returnPath.length > 0) {
          merchant.path = returnPath;
        }
      }
    }
  }

  private static hasActiveTradeAtPost(post: GameEntity): boolean {
    const { tradeRules } = useGameStore.getState();
    if (post.tradeRules) {
      return Object.values(post.tradeRules).some((r) => r.mode === 'import' || r.mode === 'export');
    }

    const hasRules = Object.values(tradeRules).some((r) => r.mode === 'import' || r.mode === 'export');
    return hasRules || Boolean(post.isCompleted && post.buildingType === 'trading_post');
  }

  private static departMerchant(merchant: GameEntity, setCaravanStatus: (status: any) => void): void {
    world.remove(merchant);
    this.merchantState = null;
    setCaravanStatus({ state: 'departing' });
  }

  private static executeTradeOnce(tradingPostId: string, currentTick: number): void {
    if (!this.merchantState) return;
    if (this.merchantState.tradedPostIds.has(tradingPostId)) return;
    this.merchantState.tradedPostIds.add(tradingPostId);
    this.executeTradeAtPost(tradingPostId, currentTick);
  }

  private static spawnMerchant(grid: GridMap, day: number): void {
    this.hasSpawnedToday = true;
    const startX = 2;
    const startZ = Math.round(GridMap.getHighwayZ(startX));
    const startY = grid.getTile(startX, startZ)?.height || 0.1;

    const name = MERCHANT_NAMES[(day - 1) % MERCHANT_NAMES.length];
    const entityId = `merchant-caravan-${day}-${Date.now() % 10000}`;

    const merchantEntity: GameEntity = {
      id: entityId,
      name,
      isCharacter: true,
      characterClass: 'peasant',
      factionId: 'merchant',
      isMerchant: true,
      hasHorseCart: true,
      regionId: undefined,
      position: [startX, startY, startZ],
      gridPosition: [startX, startZ],
      moveSpeed: 1.6,
      avatarColor: '#d97706',
      path: [],
      needs: {
        hunger: 100,
        energy: 100,
        mood: 100,
        ale: 100,
        hygiene: 100,
      },
      inventory: {
        wood: 40,
        stone: 30,
        planks: 30,
        wheat: 40,
        bread: 30,
        iron: 15,
        weapons: 10,
        clothes: 15,
      },
    };

    world.add(merchantEntity);

    this.merchantState = {
      entityId,
      state: 'traveling_on_highway',
      currentTradingPostId: undefined,
      highwayBranchPos: [startX, startZ],
      lastVisitedHighwayX: 2,
      tradingTicksRemaining: 0,
      visitedPostIds: new Set(),
      tradedPostIds: new Set(),
      targetPos: [startX, startZ],
      name,
      carriedGold: 600,
      lastPos: [startX, startZ],
      stalledTicks: 0,
    };

    useGameStore.getState().setCaravanStatus({
      state: 'approaching',
      merchantName: name,
    });

    this.findNextDestination(grid, merchantEntity);
  }

  private static findNextDestination(grid: GridMap, merchant: GameEntity): void {
    if (!this.merchantState) return;

    const curX = merchant.position ? merchant.position[0] : 2;
    const curZ = merchant.position ? merchant.position[2] : Math.round(GridMap.getHighwayZ(curX));

    const isOnHighway = Math.abs(curZ - GridMap.getHighwayZ(curX)) <= 2.2;
    if (!isOnHighway) {
      const returnHighwayX = this.merchantState.highwayBranchPos[0];
      const returnHighwayZ = this.merchantState.highwayBranchPos[1];
      this.merchantState.state = 'returning_to_highway';
      this.merchantState.targetPos = [returnHighwayX, returnHighwayZ];
      const returnPath = AStar.findPath(grid, [Math.round(curX), Math.round(curZ)], [returnHighwayX, returnHighwayZ], true, undefined, 6000);
      merchant.path = returnPath && returnPath.length > 0 ? returnPath : [[returnHighwayX, returnHighwayZ]];
      return;
    }

    const minSearchX = Math.max(curX + 1.5, this.merchantState.lastVisitedHighwayX + 2.0);
    const eligiblePosts: GameEntity[] = [];

    for (const b of buildingEntities) {
      if (
        b.buildingType === 'trading_post' &&
        b.isCompleted &&
        !this.merchantState.visitedPostIds.has(b.id)
      ) {
        const bx = b.gridPosition ? b.gridPosition[0] : (b.position ? b.position[0] : 0);
        if (bx >= minSearchX && this.hasActiveTradeAtPost(b)) {
          eligiblePosts.push(b);
        }
      }
    }

    eligiblePosts.sort((a, b) => {
      const ax = a.gridPosition ? a.gridPosition[0] : (a.position ? a.position[0] : 0);
      const bx = b.gridPosition ? b.gridPosition[0] : (b.position ? b.position[0] : 0);
      return ax - bx;
    });

    const nextPost = eligiblePosts[0] || null;

    if (nextPost) {
      const postX = nextPost.gridPosition ? nextPost.gridPosition[0] : (nextPost.position ? nextPost.position[0] : curX);
      const branchX = Math.max(2, Math.min(381, Math.round(postX)));
      const branchZ = Math.round(GridMap.getHighwayZ(branchX));

      this.merchantState.currentTradingPostId = nextPost.id;
      this.merchantState.highwayBranchPos = [branchX, branchZ];
      this.merchantState.targetPos = [branchX, branchZ];
      this.merchantState.state = 'traveling_on_highway';

      const path = generateHighwayWaypoints(curX, branchX);
      merchant.path = path.length > 0 ? path : [[branchX, branchZ]];
    } else {

      const exitX = 381;
      const exitZ = Math.round(GridMap.getHighwayZ(exitX));

      this.merchantState.currentTradingPostId = undefined;
      this.merchantState.highwayBranchPos = [exitX, exitZ];
      this.merchantState.targetPos = [exitX, exitZ];
      this.merchantState.state = 'traveling_on_highway';

      const path = generateHighwayWaypoints(curX, exitX);
      merchant.path = path.length > 0 ? path : [[exitX, exitZ]];
    }
  }

  private static executeTradeAtPost(tradingPostId: string, currentTick: number): void {
    const tradingPost = world.entities.find((e) => e.id === tradingPostId);
    if (!tradingPost) return;

    const isBotPost = Boolean(tradingPost.factionId && tradingPost.factionId !== 'player');

    if (isBotPost) {
      const botRules = tradingPost.tradeRules || {};
      tradingPost.localInventory = tradingPost.localInventory || {};
      const botInv = tradingPost.localInventory;
      let botGold = 250;

      for (const item of TRADE_ITEMS_CONFIG) {
        const res = item.resource;
        const rule = botRules[res];
        if (!rule || rule.mode === 'none') continue;

        const botStock = botInv[res] || 0;
        const targetStock = rule.targetStock;
        const buyPrice = rule.customPrice ?? item.baseBuyPrice;
        const sellPrice = Math.max(1, (rule.customPrice ? Math.floor(rule.customPrice * 0.6) : item.baseSellPrice));

        if (rule.mode === 'import' && botStock < targetStock) {
          const needed = targetStock - botStock;
          const affordable = Math.floor(botGold / buyPrice);
          const toBuy = Math.min(needed, affordable, 20);
          if (toBuy > 0) {
            botGold -= toBuy * buyPrice;
            botInv[res] = (botInv[res] || 0) + toBuy;
          }
        } else if (rule.mode === 'export' && botStock > targetStock) {
          const excess = botStock - targetStock;
          const toSell = Math.min(excess, 25);
          if (toSell > 0) {
            botInv[res] = Math.max(0, (botInv[res] || 0) - toSell);
            botGold += toSell * sellPrice;
          }
        }
      }

      const merchant = world.entities.find((e) => e.id === this.merchantState?.entityId);
      if (merchant) {
        this.sayPhrase(merchant, MERCHANT_ARRIVAL_PHRASES, currentTick);
      }
      return;
    }

    const { tradeRules, resources, addResource, consumeResource, setCaravanStatus } = useGameStore.getState();

    let totalBought = 0;
    let totalSold = 0;
    let goldSpent = 0;
    let goldEarned = 0;
    const tradeSummaries: string[] = [];

    for (const item of TRADE_ITEMS_CONFIG) {
      const res = item.resource;
      const rule = tradeRules[res];
      if (!rule || rule.mode === 'none') continue;

      const playerStock = resources[res] || 0;
      const targetStock = rule.targetStock;
      const buyPrice = rule.customPrice ?? item.baseBuyPrice;
      const sellPrice = Math.max(1, (rule.customPrice ? Math.floor(rule.customPrice * 0.6) : item.baseSellPrice));

      if (rule.mode === 'import' && playerStock < targetStock) {
        const needed = targetStock - playerStock;
        const affordable = Math.floor((resources.gold || 0) / buyPrice);
        const toBuy = Math.min(needed, affordable, 25);

        if (toBuy > 0) {
          const cost = toBuy * buyPrice;
          if (consumeResource('gold', cost)) {
            addResource(res, toBuy);
            totalBought += toBuy;
            goldSpent += cost;
            tradeSummaries.push(`+${toBuy} ${item.nameUk} (-${cost} зол.)`);
          }
        }
      } else if (rule.mode === 'export' && playerStock > targetStock) {
        const excess = playerStock - targetStock;
        const toSell = Math.min(excess, 30);

        if (toSell > 0) {
          const revenue = toSell * sellPrice;
          if (consumeResource(res, toSell)) {
            addResource('gold', revenue);
            totalSold += toSell;
            goldEarned += revenue;
            tradeSummaries.push(`-${toSell} ${item.nameUk} (+${revenue} зол.)`);
          }
        }
      }
    }

    const merchant = world.entities.find((e) => e.id === this.merchantState?.entityId);
    if (merchant) {
      this.sayPhrase(merchant, MERCHANT_ARRIVAL_PHRASES, currentTick);
    }

    if (totalBought > 0 || totalSold > 0) {
      audioManager.playUIClick();
      const summaryText = tradeSummaries.slice(0, 3).join(', ') + (tradeSummaries.length > 3 ? ` (+ще ${tradeSummaries.length - 3})` : '');

      setCaravanStatus({
        lastTradeSummary: summaryText,
      });
    }
  }

  private static sayPhrase(entity: GameEntity, phrases: string[], currentTick: number): void {
    if (currentTick - this.lastSpeechTick < 40) return;
    this.lastSpeechTick = currentTick;
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    entity.speechBubble = {
      text,
      expiresAtTick: currentTick + 45,
      type: 'work',
    };
  }
}
