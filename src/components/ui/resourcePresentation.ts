import type { ResourceInventory } from '../../types/game';
import type { IlluminatedIconKind } from './IlluminatedIcons';

export const RESOURCE_UI: Record<keyof ResourceInventory, { uk: string; en: string; icon: IlluminatedIconKind }> = {
  wood: { uk: 'Деревина', en: 'Timber', icon: 'wood' },
  stone: { uk: 'Камінь', en: 'Stone', icon: 'stone' },
  wheat: { uk: 'Пшениця', en: 'Wheat', icon: 'wheat' },
  flour: { uk: 'Борошно', en: 'Flour', icon: 'flour' },
  bread: { uk: 'Хліб', en: 'Bread', icon: 'bread' },
  ale: { uk: 'Ель', en: 'Ale', icon: 'ale' },
  gold: { uk: 'Золото', en: 'Gold', icon: 'gold' },
  weapons: { uk: 'Зброя', en: 'Weapons', icon: 'weapons' },
  fish: { uk: 'Риба', en: 'Fish', icon: 'fish' },
  berries: { uk: 'Ягоди', en: 'Berries', icon: 'berry' },
  iron: { uk: 'Залізо', en: 'Iron', icon: 'iron' },
  clay: { uk: 'Глина', en: 'Clay', icon: 'clay' },
  salt: { uk: 'Сіль', en: 'Salt', icon: 'salt' },
  meat: { uk: 'М’ясо', en: 'Meat', icon: 'meat' },
  hides: { uk: 'Шкури', en: 'Hides', icon: 'hides' },
  vegetables: { uk: 'Овочі', en: 'Vegetables', icon: 'vegetables' },
  eggs: { uk: 'Яйця', en: 'Eggs', icon: 'eggs' },
  iron_ore: { uk: 'Залізна руда', en: 'Iron ore', icon: 'iron_ore' },
  coal: { uk: 'Вугілля', en: 'Coal', icon: 'coal' },
  cut_stone: { uk: 'Тесаний камінь', en: 'Dressed stone', icon: 'cut_stone' },
  clay_bricks: { uk: 'Цегла', en: 'Bricks', icon: 'brick' },
  planks: { uk: 'Дошки', en: 'Planks', icon: 'planks' },
  clothes: { uk: 'Одяг', en: 'Clothes', icon: 'clothes' },
};
