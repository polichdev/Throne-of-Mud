import { NEED_EVENTS } from '../../../constants/systems';
import { characterEntities } from '../world';
import { useGameStore } from '../../../store/useGameStore';
import { translations } from '../../../i18n';
import {
  MIN_HUNGER,
  MAX_HUNGER,
  MIN_ENERGY,
  MAX_ENERGY,
  MIN_MOOD,
  MAX_MOOD,
  MIN_ALE,
  MAX_ALE,
  HUNGER_DECAY_RATE,
  WORKING_ENERGY_DECAY_RATE,
  IDLE_ENERGY_DECAY_RATE,
  ALE_DECAY_RATE,
  HUNGER_EAT_THRESHOLD,
  BREAD_HUNGER_RESTORE,
  ALE_DRINK_THRESHOLD,
  ALE_RESTORE_AMOUNT,
  ALE_MOOD_RESTORE,
  ALE_CONSUME_CHANCE,
  SLEEP_ENERGY_RECOVERY_RATE,
  BASE_TARGET_MOOD,
  HUNGER_MOOD_PENALTY,
  ENERGY_MOOD_PENALTY,
  ALE_MOOD_BOOST,
  ALE_BOOST_THRESHOLD,
  ENERGY_LOW_THRESHOLD,
  MOOD_LERP_FACTOR,
  LOW_MOOD_THRESHOLD,
  LOW_MOOD_SPEECH_CHANCE,
  DEFAULT_SPEECH_DURATION_TICKS,
  VARIED_DIET_MIN_FOOD_TYPES,
  VARIED_DIET_MOOD_MODIFIER,
  VARIED_DIET_DURATION_TICKS,
} from '../../../constants/needs';
import { clamp, lerp } from '../../../utils/mathUtils';

export class NeedsSystem {
  public static update(currentTick: number): void {
    const { resources, consumeResource } = useGameStore.getState();

    let breadAvailable = resources.bread || 0;
    let vegetablesAvailable = resources.vegetables || 0;
    let eggsAvailable = resources.eggs || 0;
    let meatAvailable = resources.meat || 0;
    let fishAvailable = resources.fish || 0;
    let berriesAvailable = resources.berries || 0;
    let aleAvailable = resources.ale || 0;

    let distinctFoodCount = 0;
    if (breadAvailable > 0) distinctFoodCount++;
    if (vegetablesAvailable > 0) distinctFoodCount++;
    if (eggsAvailable > 0) distinctFoodCount++;
    if (meatAvailable > 0) distinctFoodCount++;
    if (fishAvailable > 0) distinctFoodCount++;
    if (berriesAvailable > 0) distinctFoodCount++;

    for (const unit of characterEntities) {
      if (!unit.needs || unit.factionId === 'bandit') continue;

      unit.needs.hunger = Math.max(MIN_HUNGER, unit.needs.hunger - HUNGER_DECAY_RATE);

      const isWorking = unit.currentJob && unit.currentJob.type !== 'idle' && unit.currentJob.type !== 'sleep';
      unit.needs.energy = Math.max(
        MIN_ENERGY,
        unit.needs.energy - (isWorking ? WORKING_ENERGY_DECAY_RATE : IDLE_ENERGY_DECAY_RATE)
      );

      unit.needs.ale = Math.max(MIN_ALE, unit.needs.ale - ALE_DECAY_RATE);

      const isPlayerUnit = unit.factionId === 'player' || unit.factionId === undefined;

      if (isPlayerUnit && unit.needs.hunger < HUNGER_EAT_THRESHOLD) {
        const lang = useGameStore.getState().language;
        const dict = translations[lang].inspector;

        if (vegetablesAvailable > 0) {
          vegetablesAvailable--;
          consumeResource('vegetables', 1);
          unit.needs.hunger = Math.min(MAX_HUNGER, unit.needs.hunger + BREAD_HUNGER_RESTORE);
          unit.speechBubble = {
            text: dict.eatVegetablesSpeech,
            expiresAtTick: currentTick + NEED_EVENTS.mealSpeechTicks,
            type: 'mood',
          };
        } else if (eggsAvailable > 0) {
          eggsAvailable--;
          consumeResource('eggs', 1);
          unit.needs.hunger = Math.min(MAX_HUNGER, unit.needs.hunger + BREAD_HUNGER_RESTORE);
          unit.speechBubble = {
            text: dict.eatEggsSpeech,
            expiresAtTick: currentTick + NEED_EVENTS.mealSpeechTicks,
            type: 'mood',
          };
        } else if (breadAvailable > 0) {
          breadAvailable--;
          consumeResource('bread', 1);
          unit.needs.hunger = Math.min(MAX_HUNGER, unit.needs.hunger + BREAD_HUNGER_RESTORE);
          unit.speechBubble = {
            text: dict.eatBreadSpeech,
            expiresAtTick: currentTick + NEED_EVENTS.mealSpeechTicks,
            type: 'mood',
          };
        } else if (meatAvailable > 0) {
          meatAvailable--;
          consumeResource('meat', 1);
          unit.needs.hunger = Math.min(MAX_HUNGER, unit.needs.hunger + BREAD_HUNGER_RESTORE + NEED_EVENTS.meatHungerBonus);
          unit.speechBubble = {
            text: dict.eatMeatSpeech,
            expiresAtTick: currentTick + NEED_EVENTS.mealSpeechTicks,
            type: 'mood',
          };
        } else if (fishAvailable > 0) {
          fishAvailable--;
          consumeResource('fish', 1);
          unit.needs.hunger = Math.min(MAX_HUNGER, unit.needs.hunger + BREAD_HUNGER_RESTORE);
          unit.speechBubble = {
            text: dict.eatFishSpeech,
            expiresAtTick: currentTick + NEED_EVENTS.mealSpeechTicks,
            type: 'mood',
          };
        } else if (berriesAvailable > 0) {
          berriesAvailable--;
          consumeResource('berries', 1);
          unit.needs.hunger = Math.min(MAX_HUNGER, unit.needs.hunger + BREAD_HUNGER_RESTORE - NEED_EVENTS.berriesHungerPenalty);
          unit.speechBubble = {
            text: dict.eatBerriesSpeech,
            expiresAtTick: currentTick + NEED_EVENTS.mealSpeechTicks,
            type: 'mood',
          };
        }

        if (distinctFoodCount >= VARIED_DIET_MIN_FOOD_TYPES) {
          if (!unit.thoughts) unit.thoughts = [];
          if (!unit.thoughts.some((t) => t.id === 'varied_diet')) {
            unit.thoughts.push({
              id: 'varied_diet',
              text: dict.variedDietThought(VARIED_DIET_MOOD_MODIFIER),
              modifier: VARIED_DIET_MOOD_MODIFIER,
              durationTicks: VARIED_DIET_DURATION_TICKS,
            });
          }
        }
      }

      if (isPlayerUnit && unit.needs.ale < ALE_DRINK_THRESHOLD && aleAvailable > 0 && Math.random() < ALE_CONSUME_CHANCE) {
        aleAvailable--;
        consumeResource('ale', 1);
        unit.needs.ale = Math.min(MAX_ALE, unit.needs.ale + ALE_RESTORE_AMOUNT);
        unit.needs.mood = Math.min(MAX_MOOD, unit.needs.mood + ALE_MOOD_RESTORE);
        unit.speechBubble = {
          text: translations[useGameStore.getState().language].inspector.drinkAleSpeech,
          expiresAtTick: currentTick + NEED_EVENTS.aleSpeechTicks,
          type: 'mood',
        };
      }

      if (unit.currentJob?.type === 'sleep') {
        unit.needs.energy = Math.min(MAX_ENERGY, unit.needs.energy + SLEEP_ENERGY_RECOVERY_RATE);
      }

      if (unit.thoughts && unit.thoughts.length > 0) {
        for (const th of unit.thoughts) {
          th.durationTicks -= 1;
        }
        unit.thoughts = unit.thoughts.filter((th) => th.durationTicks > 0);
      }

      let thoughtsModifier = 0;
      if (unit.thoughts) {
        for (const th of unit.thoughts) {
          thoughtsModifier += th.modifier;
        }
      }

      let targetMood = BASE_TARGET_MOOD + thoughtsModifier;
      if (unit.needs.hunger < HUNGER_EAT_THRESHOLD) targetMood -= HUNGER_MOOD_PENALTY;
      if (unit.needs.energy < ENERGY_LOW_THRESHOLD) targetMood -= ENERGY_MOOD_PENALTY;
      if (unit.needs.ale > ALE_BOOST_THRESHOLD) targetMood += ALE_MOOD_BOOST;
      targetMood = clamp(targetMood, MIN_MOOD, MAX_MOOD);
      unit.needs.mood = lerp(unit.needs.mood, targetMood, MOOD_LERP_FACTOR);

      if (unit.needs.mood < LOW_MOOD_THRESHOLD && Math.random() < LOW_MOOD_SPEECH_CHANCE) {
        unit.speechBubble = {
          text: translations[useGameStore.getState().language].inspector.lowMoodSpeech,
          expiresAtTick: currentTick + DEFAULT_SPEECH_DURATION_TICKS,
          type: 'alert',
        };
      }

      if (unit.speechBubble && currentTick >= unit.speechBubble.expiresAtTick) {
        unit.speechBubble = undefined;
      }
    }
  }
}
