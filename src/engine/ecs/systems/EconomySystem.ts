import { characterEntities, buildingEntities, type GameEntity, type Thought } from '../world';
import { useGameStore } from '../../../store/useGameStore';
import type { ResourceInventory } from '../../../types/game';
import {
  DEFAULT_WAGE,
  WAGE_PAYOUT_HOUR,
  MARKET_SHOPPING_START_HOUR,
  MARKET_SHOPPING_END_HOUR,
  MARKET_SHOPPING_TICK_INTERVAL,
  PAID_WAGE_MOOD_BOOST,
  PAID_WAGE_DURATION_TICKS,
  UNPAID_WAGE_MOOD_PENALTY,
  UNPAID_WAGE_DURATION_TICKS,
  UNPAID_WAGE_MOOD_DROP,
  MARKET_ITEM_PRICE_GOLD,
  MARKET_PURCHASE_MOOD_BOOST,
  MARKET_PURCHASE_MOOD_DURATION_TICKS,
  MARKET_HUNGER_THRESHOLD,
  MARKET_ALE_THRESHOLD,
} from '../../../constants/economy';
import {
  MAX_HUNGER,
  MAX_ALE,
  MAX_MOOD,
  MIN_MOOD,
  BREAD_HUNGER_RESTORE,
  ALE_RESTORE_AMOUNT,
  ALE_MOOD_RESTORE,
  DEFAULT_SPEECH_DURATION_TICKS,
} from '../../../constants/needs';

export class EconomySystem {
  private static lastWageDayPaid = -1;

  public static update(currentTick: number): void {
    const { time, resources, consumeResource, addResource } = useGameStore.getState();

    if (time.hour === WAGE_PAYOUT_HOUR && this.lastWageDayPaid !== time.day) {
      this.lastWageDayPaid = time.day;
      this.payDailyWages(currentTick, resources, consumeResource);
    }

    if (time.hour >= MARKET_SHOPPING_START_HOUR && time.hour <= MARKET_SHOPPING_END_HOUR && currentTick % MARKET_SHOPPING_TICK_INTERVAL === 0) {
      this.processMarketShopping(currentTick, resources, consumeResource, addResource);
    }
  }

  private static payDailyWages(
    currentTick: number,
    resources: ResourceInventory,
    consumeResource: (type: any, amount: number) => boolean
  ): void {
    const { playerRegionId } = useGameStore.getState();
    const charMap = new Map<string, GameEntity>();
    for (const c of characterEntities) {
      charMap.set(c.id, c);
    }

    const workerPayList: { worker: GameEntity; wage: number }[] = [];
    for (const building of buildingEntities) {
      if (!building.isCompleted || !building.assignedWorkers || building.assignedWorkers.length === 0) {
        continue;
      }
      if (building.factionId && building.factionId !== 'player') continue;
      if (building.regionId !== undefined && building.regionId !== playerRegionId) continue;

      const wage = building.wage !== undefined ? building.wage : DEFAULT_WAGE;
      for (const workerId of building.assignedWorkers) {
        const worker = charMap.get(workerId);
        if (worker) {
          workerPayList.push({ worker, wage });
        }
      }
    }

    let totalWagesPaid = 0;
    let unpaidWorkersCount = 0;
    let currentGold = resources.gold || 0;

    for (const item of workerPayList) {
      if (currentGold >= item.wage) {
        currentGold -= item.wage;
        totalWagesPaid += item.wage;
        item.worker.gold = (item.worker.gold || 0) + item.wage;

        if (!item.worker.thoughts) item.worker.thoughts = [];
        item.worker.thoughts = item.worker.thoughts.filter((t: Thought) => t.id !== 'paid' && t.id !== 'unpaid');
        item.worker.thoughts.push({
          id: 'paid',
          text: `Отримав зарплату (+${item.wage} золота)`,
          modifier: PAID_WAGE_MOOD_BOOST,
          durationTicks: PAID_WAGE_DURATION_TICKS,
        });

        item.worker.speechBubble = {
          text: `Отримав ${item.wage} золота!`,
          expiresAtTick: currentTick + 25,
          type: 'work',
        };
      } else {
        unpaidWorkersCount++;
        if (!item.worker.thoughts) item.worker.thoughts = [];
        item.worker.thoughts = item.worker.thoughts.filter((t: Thought) => t.id !== 'paid' && t.id !== 'unpaid');
        item.worker.thoughts.push({
          id: 'unpaid',
          text: `Затримка зарплати! (${UNPAID_WAGE_MOOD_PENALTY})`,
          modifier: UNPAID_WAGE_MOOD_PENALTY,
          durationTicks: UNPAID_WAGE_DURATION_TICKS,
        });

        if (item.worker.needs) {
          item.worker.needs.mood = Math.max(MIN_MOOD, item.worker.needs.mood - UNPAID_WAGE_MOOD_DROP);
        }

        item.worker.speechBubble = {
          text: 'Де моє зароблене золото?!',
          expiresAtTick: currentTick + DEFAULT_SPEECH_DURATION_TICKS,
          type: 'alert',
        };
      }
    }

    if (totalWagesPaid > 0) {
      consumeResource('gold', totalWagesPaid);
    }
  }

  private static processMarketShopping(
    currentTick: number,
    resources: ResourceInventory,
    consumeResource: (type: any, amount: number) => boolean,
    addResource: (type: any, amount: number) => void
  ): void {
    const { playerRegionId } = useGameStore.getState();
    let breadToConsume = 0;
    let aleToConsume = 0;
    let goldToAdd = 0;

    const availableBread = resources.bread || 0;
    const availableAle = resources.ale || 0;

    for (const worker of characterEntities) {
      if (worker.characterClass === 'king' || worker.characterClass === 'lady') {
        continue;
      }
      if (worker.factionId && worker.factionId !== 'player') continue;
      if (worker.regionId !== undefined && worker.regionId !== playerRegionId) continue;
      if (!worker.gold || worker.gold <= 0 || !worker.needs) continue;

      if (
        worker.needs.hunger < MARKET_HUNGER_THRESHOLD &&
        (availableBread - breadToConsume) > 0 &&
        worker.gold >= MARKET_ITEM_PRICE_GOLD
      ) {
        breadToConsume++;
        goldToAdd += MARKET_ITEM_PRICE_GOLD;
        worker.gold -= MARKET_ITEM_PRICE_GOLD;
        worker.needs.hunger = Math.min(MAX_HUNGER, worker.needs.hunger + BREAD_HUNGER_RESTORE);

        if (!worker.thoughts) worker.thoughts = [];
        worker.thoughts = worker.thoughts.filter((t) => t.id !== 'bought_bread');
        worker.thoughts.push({
          id: 'bought_bread',
          text: `Купив смачний хліб на ринку (+${MARKET_PURCHASE_MOOD_BOOST})`,
          modifier: MARKET_PURCHASE_MOOD_BOOST,
          durationTicks: MARKET_PURCHASE_MOOD_DURATION_TICKS,
        });

        worker.speechBubble = {
          text: `Купив хліб на ринку (-${MARKET_ITEM_PRICE_GOLD} золото)`,
          expiresAtTick: currentTick + 25,
          type: 'mood',
        };
        continue;
      }

      if (
        worker.needs.ale < MARKET_ALE_THRESHOLD &&
        (availableAle - aleToConsume) > 0 &&
        worker.gold >= MARKET_ITEM_PRICE_GOLD
      ) {
        aleToConsume++;
        goldToAdd += MARKET_ITEM_PRICE_GOLD;
        worker.gold -= MARKET_ITEM_PRICE_GOLD;
        worker.needs.ale = Math.min(MAX_ALE, worker.needs.ale + ALE_RESTORE_AMOUNT);
        worker.needs.mood = Math.min(MAX_MOOD, worker.needs.mood + ALE_MOOD_RESTORE);

        if (!worker.thoughts) worker.thoughts = [];
        worker.thoughts = worker.thoughts.filter((t) => t.id !== 'bought_ale');
        worker.thoughts.push({
          id: 'bought_ale',
          text: `Випив холодного елю на ринку (+${MARKET_PURCHASE_MOOD_BOOST})`,
          modifier: MARKET_PURCHASE_MOOD_BOOST,
          durationTicks: MARKET_PURCHASE_MOOD_DURATION_TICKS,
        });

        worker.speechBubble = {
          text: `Купив ель на ринку (-${MARKET_ITEM_PRICE_GOLD} золото)`,
          expiresAtTick: currentTick + 25,
          type: 'mood',
        };
      }
    }

    if (breadToConsume > 0) {
      consumeResource('bread', breadToConsume);
    }
    if (aleToConsume > 0) {
      consumeResource('ale', aleToConsume);
    }
    if (goldToAdd > 0) {
      addResource('gold', goldToAdd);
    }
  }
}
