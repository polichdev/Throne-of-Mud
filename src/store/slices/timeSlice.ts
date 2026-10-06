import type { StateCreator } from 'zustand';
import type { SeasonType, MonthName, WeatherType } from '../../types/game';
import { world } from '../../engine/ecs/world';
import {
  TICKS_PER_MINUTE,
  MINUTES_PER_HOUR,
  HOURS_PER_DAY,
  MINUTES_PER_DAY,
  DAY_START_HOUR,
  SEASON_BASE_DAYS,
  MONTH_BASE_DAYS,
  DAYS_PER_SEASON,
  DAYS_PER_MONTH,
  getDateInfo,
  timeToTicks,
  getTargetSnowAccumulation,
} from '../../constants/time';
import type { GameState, TimeSlice } from '../types';

export type { TimeSlice };

const initialDateInfo = getDateInfo(1);

export const createTimeSlice: StateCreator<GameState, [], [], TimeSlice> = (set) => ({
  time: {
    tick: 0,
    day: 1,
    dayOfMonth: initialDateInfo.dayOfMonth,
    month: initialDateInfo.month,
    monthIndex: initialDateInfo.monthIndex,
    monthInSeason: initialDateInfo.monthInSeason,
    year: initialDateInfo.year,
    hour: DAY_START_HOUR,
    minute: 0,
    season: initialDateInfo.season,
    weather: 'clear',
    targetWeather: 'clear',
    nextWeather: 'clear',
    isWeatherLocked: false,
    rainIntensity: 0,
    stormIntensity: 0,
    snowIntensity: 0,
    snowAccumulation: getTargetSnowAccumulation('Spring', 1, 7, 0),
    lightningFlash: 0,
    speedMultiplier: 1,
    isPaused: false,
  },

  isWeatherDebugOpen: false,
  setIsWeatherDebugOpen: (open) => set({ isWeatherDebugOpen: open }),

  setSpeedMultiplier: (speed) => {
    set((state) => ({
      time: {
        ...state.time,
        speedMultiplier: speed,
        isPaused: speed === 0,
      },
    }));
  },

  togglePause: () => {
    set((state) => ({
      time: {
        ...state.time,
        isPaused: !state.time.isPaused,
      },
    }));
  },

  setSeason: (newSeason: SeasonType) => {
    set((state) => {
      const baseDay = SEASON_BASE_DAYS[newSeason];
      const currentDayInSeason = ((state.time.day - 1) % DAYS_PER_SEASON);
      const newDay = baseDay + currentDayInSeason;
      const newTick = timeToTicks(newDay, state.time.hour, state.time.minute);
      const dateInfo = getDateInfo(newDay);
      const newSnowAcc = getTargetSnowAccumulation(newSeason, dateInfo.dayInSeason, state.time.hour, state.time.minute);

      let newTargetWeather = state.time.targetWeather || state.time.weather;
      let newNextWeather = state.time.nextWeather || 'clear';

      if (newSeason === 'Winter') {
        if (newTargetWeather === 'rain' || newTargetWeather === 'storm') {
          newTargetWeather = 'snow';
        }
        if (newNextWeather === 'rain' || newNextWeather === 'storm') {
          newNextWeather = 'snow';
        }
      } else {
        if (newTargetWeather === 'snow') {
          newTargetWeather = 'clear';
        }
        if (newNextWeather === 'snow') {
          newNextWeather = 'clear';
        }
      }

      let nextDeposits = state.resourceDeposits;
      if (newSeason === 'Spring' && nextDeposits) {
        nextDeposits = nextDeposits.map((dep) => {
          if (dep.seasonalRenewal) {
            const entity = world.entities.find((e) => e.id === dep.id);
            if (entity) entity.resourceAmount = dep.maxAmount;
            return { ...dep, currentAmount: dep.maxAmount };
          }
          return dep;
        });
      }

      return {
        time: {
          ...state.time,
          tick: newTick,
          day: newDay,
          dayOfMonth: dateInfo.dayOfMonth,
          month: dateInfo.month,
          monthIndex: dateInfo.monthIndex,
          monthInSeason: dateInfo.monthInSeason,
          year: dateInfo.year,
          season: newSeason,
          weather: newTargetWeather,
          targetWeather: newTargetWeather,
          nextWeather: newNextWeather,
          rainIntensity: newSeason === 'Winter' ? 0 : state.time.rainIntensity,
          stormIntensity: newSeason === 'Winter' ? 0 : state.time.stormIntensity,
          snowIntensity: newSeason !== 'Winter' ? 0 : state.time.snowIntensity,
          snowAccumulation: newSnowAcc,
        },
        resourceDeposits: nextDeposits,
        foliageVersion: state.foliageVersion + 1,
      };
    });
  },

  setMonth: (newMonth: MonthName) => {
    set((state) => {
      const baseDay = MONTH_BASE_DAYS[newMonth];
      const currentDayInMonth = ((state.time.day - 1) % DAYS_PER_MONTH);
      const newDay = baseDay + currentDayInMonth;
      const newTick = timeToTicks(newDay, state.time.hour, state.time.minute);
      const dateInfo = getDateInfo(newDay);

      let newTargetWeather = state.time.targetWeather || state.time.weather;
      let newNextWeather = state.time.nextWeather || 'clear';

      if (dateInfo.season === 'Winter') {
        if (newTargetWeather === 'rain' || newTargetWeather === 'storm') {
          newTargetWeather = 'snow';
        }
        if (newNextWeather === 'rain' || newNextWeather === 'storm') {
          newNextWeather = 'snow';
        }
      } else {
        if (newTargetWeather === 'snow') {
          newTargetWeather = 'clear';
        }
        if (newNextWeather === 'snow') {
          newNextWeather = 'clear';
        }
      }

      const newSnowAcc = getTargetSnowAccumulation(dateInfo.season, dateInfo.dayInSeason, state.time.hour, state.time.minute);

      return {
        time: {
          ...state.time,
          tick: newTick,
          day: newDay,
          dayOfMonth: dateInfo.dayOfMonth,
          month: dateInfo.month,
          monthIndex: dateInfo.monthIndex,
          monthInSeason: dateInfo.monthInSeason,
          year: dateInfo.year,
          season: dateInfo.season,
          weather: newTargetWeather,
          targetWeather: newTargetWeather,
          nextWeather: newNextWeather,
          rainIntensity: dateInfo.season === 'Winter' ? 0 : state.time.rainIntensity,
          stormIntensity: dateInfo.season === 'Winter' ? 0 : state.time.stormIntensity,
          snowIntensity: dateInfo.season !== 'Winter' ? 0 : state.time.snowIntensity,
          snowAccumulation: newSnowAcc,
        },
        foliageVersion: state.foliageVersion + 1,
      };
    });
  },

  setWeather: (newWeather: WeatherType, locked: boolean = true) => {
    set((state) => {
      let validWeather = newWeather;
      if (state.time.season === 'Winter') {
        if (validWeather === 'rain' || validWeather === 'storm') {
          validWeather = 'snow';
        }
      } else {
        if (validWeather === 'snow') {
          validWeather = 'clear';
        }
      }
      return {
        time: {
          ...state.time,
          targetWeather: validWeather,
          nextWeather: validWeather,
          weather: validWeather,
          isWeatherLocked: locked,
          rainIntensity: validWeather === 'rain' ? 1.0 : validWeather === 'storm' ? 0.85 : 0,
          stormIntensity: validWeather === 'storm' ? 1.0 : 0,
          snowIntensity: validWeather === 'snow' ? 1.0 : 0,
          lightningFlash: validWeather === 'storm' ? 1.0 : 0,
        },
      };
    });
  },

  setWeatherLocked: (locked: boolean) => {
    set((state) => ({
      time: {
        ...state.time,
        isWeatherLocked: locked,
      },
    }));
  },

  triggerLightning: () => {
    set((state) => ({
      time: {
        ...state.time,
        lightningFlash: state.time.season === 'Winter' ? 0 : 1.0,
      },
    }));
  },

  setSnowAccumulation: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    set((state) => ({
      time: {
        ...state.time,
        snowAccumulation: clamped,
      },
    }));
  },

  setTimeOfDay: (targetHour: number) => {
    set((state) => {
      const h = Math.max(0, Math.min(HOURS_PER_DAY - 1, targetHour));
      const newTick = timeToTicks(state.time.day, h, 0);
      return {
        time: {
          ...state.time,
          tick: newTick,
          hour: h,
          minute: 0,
        },
      };
    });
  },

  advanceTick: () => {
    set((state) => {
      const nextTick = state.time.tick + 1;
      const totalMinutes = Math.floor(nextTick / TICKS_PER_MINUTE);
      const hour = (DAY_START_HOUR + Math.floor(totalMinutes / MINUTES_PER_HOUR)) % HOURS_PER_DAY;
      const minute = totalMinutes % MINUTES_PER_HOUR;
      const day = 1 + Math.floor((DAY_START_HOUR * MINUTES_PER_HOUR + totalMinutes) / MINUTES_PER_DAY);

      const dateInfo = day !== state.time.day ? getDateInfo(day) : {
        season: state.time.season,
        month: state.time.month,
        monthIndex: state.time.monthIndex,
        monthInSeason: state.time.monthInSeason,
        dayOfMonth: state.time.dayOfMonth,
        year: state.time.year,
        dayInSeason: ((day - 1) % DAYS_PER_SEASON),
      };
      const { season, month, monthIndex, monthInSeason, dayOfMonth, year, dayInSeason } = dateInfo as ReturnType<typeof getDateInfo>;

      let nextDeposits = state.resourceDeposits;
      if (season === 'Spring' && state.time.season !== 'Spring' && nextDeposits) {
        nextDeposits = nextDeposits.map((dep) => {
          if (dep.seasonalRenewal) {
            const entity = world.entities.find((e) => e.id === dep.id);
            if (entity) {
              entity.resourceAmount = dep.maxAmount;
            }
            return { ...dep, currentAmount: dep.maxAmount };
          }
          return dep;
        });
      }

      let targetWeather = state.time.targetWeather || state.time.weather || 'clear';
      let nextWeather = state.time.nextWeather || 'clear';

      if (season === 'Winter') {
        if (targetWeather === 'rain' || targetWeather === 'storm') {
          targetWeather = 'snow';
        }
        if (nextWeather === 'rain' || nextWeather === 'storm') {
          nextWeather = 'snow';
        }
      } else {
        if (targetWeather === 'snow') {
          targetWeather = 'clear';
        }
        if (nextWeather === 'snow') {
          nextWeather = 'clear';
        }
      }

      if (!state.time.isWeatherLocked) {
        if (nextTick % 1080 === 0) {
          targetWeather = nextWeather;
          const rand = Math.random();
          if (season === 'Winter') {
            nextWeather = rand < 0.65 ? 'snow' : 'clear';
          } else if (season === 'Summer') {
            nextWeather = rand < 0.70 ? 'clear' : rand < 0.88 ? 'rain' : 'storm';
          } else if (season === 'Autumn') {
            nextWeather = rand < 0.40 ? 'clear' : rand < 0.82 ? 'rain' : 'storm';
          } else {
            nextWeather = rand < 0.60 ? 'clear' : rand < 0.88 ? 'rain' : 'storm';
          }
        }
      }

      const targetRain = season === 'Winter' ? 0.0 : (targetWeather === 'rain' ? 1.0 : targetWeather === 'storm' ? 0.85 : 0.0);
      const targetStorm = season === 'Winter' ? 0.0 : (targetWeather === 'storm' ? 1.0 : 0.0);
      const targetSnow = season === 'Winter' ? (targetWeather === 'snow' ? 1.0 : 0.0) : 0.0;

      let curRain = season === 'Winter' ? 0 : (state.time.rainIntensity ?? (state.time.weather === 'rain' ? 1 : 0));
      let curStorm = season === 'Winter' ? 0 : (state.time.stormIntensity ?? (state.time.weather === 'storm' ? 1 : 0));
      let curSnow = season !== 'Winter' ? 0 : (state.time.snowIntensity ?? (state.time.weather === 'snow' ? 1 : 0));

      if (curRain < targetRain) {
        curRain = Math.min(targetRain, curRain + 0.0035);
      } else if (curRain > targetRain) {
        curRain = Math.max(targetRain, curRain - 0.0025);
      }

      if (curStorm < targetStorm) {
        curStorm = Math.min(targetStorm, curStorm + 0.0030);
      } else if (curStorm > targetStorm) {
        curStorm = Math.max(targetStorm, curStorm - 0.0025);
      }

      if (curSnow < targetSnow) {
        curSnow = Math.min(targetSnow, curSnow + 0.0035);
      } else if (curSnow > targetSnow) {
        curSnow = Math.max(targetSnow, curSnow - 0.0025);
      }

      let currentWeather: WeatherType = 'clear';
      if (season === 'Winter') {
        currentWeather = curSnow > 0.08 ? 'snow' : 'clear';
      } else {
        if (curRain > 0.08) {
          currentWeather = curStorm > 0.40 ? 'storm' : 'rain';
        } else {
          currentWeather = 'clear';
        }
      }

      let flash = state.time.lightningFlash || 0;
      if (season === 'Winter') {
        flash = 0;
      } else if (curStorm > 0.45) {
        if (Math.random() < 0.008 * curStorm) {
          flash = 1.0;
        } else if (flash > 0) {
          flash = Math.max(0, flash - 0.08);
        }
      } else if (flash > 0) {
        flash = Math.max(0, flash - 0.08);
      }

      const targetSnowAcc = getTargetSnowAccumulation(season, dayInSeason, hour, minute);
      let curSnowAcc = state.time.snowAccumulation ?? 0;
      if (curSnowAcc < targetSnowAcc) {
        const snowRate = curSnow > 0.1 ? 0.0005 : 0.0002;
        curSnowAcc = Math.min(targetSnowAcc, curSnowAcc + snowRate);
      } else if (curSnowAcc > targetSnowAcc) {
        const meltRate = curRain > 0.1 ? 0.0006 : 0.00025;
        curSnowAcc = Math.max(targetSnowAcc, curSnowAcc - meltRate);
      }

      state.time.tick = nextTick;
      state.time.rainIntensity = curRain;
      state.time.stormIntensity = curStorm;
      state.time.snowIntensity = curSnow;
      state.time.snowAccumulation = curSnowAcc;
      state.time.lightningFlash = flash;
      state.time.targetWeather = targetWeather;
      state.time.nextWeather = nextWeather;

      const shouldTriggerUI =
        state.isWeatherDebugOpen ||
        minute !== state.time.minute ||
        currentWeather !== state.time.weather ||
        season !== state.time.season ||
        day !== state.time.day ||
        nextDeposits !== state.resourceDeposits;

      if (!shouldTriggerUI) {
        state.time.weather = currentWeather;
        return state;
      }

      return {
        time: {
          ...state.time,
          tick: nextTick,
          day,
          dayOfMonth,
          month,
          monthIndex,
          monthInSeason,
          year,
          hour,
          minute,
          season,
          weather: currentWeather,
          targetWeather,
          nextWeather,
          rainIntensity: curRain,
          stormIntensity: curStorm,
          snowIntensity: curSnow,
          snowAccumulation: curSnowAcc,
          lightningFlash: flash,
        },
        resourceDeposits: nextDeposits,
      };
    });
  },
});
