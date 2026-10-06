import { create } from 'zustand';
import { createTimeSlice } from './slices/timeSlice';
import { createAudioSlice } from './slices/audioSlice';
import { createUISlice } from './slices/uiSlice';
import { createSettlementSlice } from './slices/settlementSlice';
import type { GameState } from './types';

export type { GameState } from './types';
export * from './types';

export { DEFAULT_REGIONS, PRESET_BOT_LORDS } from '../constants/world';

export const useGameStore = create<GameState>((...args) => ({
  ...createTimeSlice(...args),
  ...createAudioSlice(...args),
  ...createUISlice(...args),
  ...createSettlementSlice(...args),
}));
