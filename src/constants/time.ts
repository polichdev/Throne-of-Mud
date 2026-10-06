import type { SeasonType, MonthName } from '../types/game';

export const TICKS_PER_MINUTE = 6;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR;
export const DAY_START_HOUR = 7;
export const DAY_START_MINUTE_OFFSET = DAY_START_HOUR * MINUTES_PER_HOUR;

export const MONTHS_PER_SEASON = 3;
export const DAYS_PER_MONTH = 10;
export const DAYS_PER_SEASON = MONTHS_PER_SEASON * DAYS_PER_MONTH;
export const SEASONS_PER_YEAR = 4;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS_PER_YEAR;

export const SEASONS: SeasonType[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

export const MONTHS: MonthName[] = [
  'March', 'April', 'May',
  'June', 'July', 'August',
  'September', 'October', 'November',
  'December', 'January', 'February',
];

export const SEASON_MONTHS: Record<SeasonType, MonthName[]> = {
  Spring: ['March', 'April', 'May'],
  Summer: ['June', 'July', 'August'],
  Autumn: ['September', 'October', 'November'],
  Winter: ['December', 'January', 'February'],
};

export const MONTH_TO_SEASON: Record<MonthName, SeasonType> = {
  March: 'Spring', April: 'Spring', May: 'Spring',
  June: 'Summer', July: 'Summer', August: 'Summer',
  September: 'Autumn', October: 'Autumn', November: 'Autumn',
  December: 'Winter', January: 'Winter', February: 'Winter',
};

export const SEASON_BASE_DAYS: Record<SeasonType, number> = {
  Spring: 1,
  Summer: 1 + DAYS_PER_SEASON * 1,
  Autumn: 1 + DAYS_PER_SEASON * 2,
  Winter: 1 + DAYS_PER_SEASON * 3,
};

export const MONTH_BASE_DAYS: Record<MonthName, number> = {
  March: 1 + DAYS_PER_MONTH * 0,
  April: 1 + DAYS_PER_MONTH * 1,
  May: 1 + DAYS_PER_MONTH * 2,
  June: 1 + DAYS_PER_MONTH * 3,
  July: 1 + DAYS_PER_MONTH * 4,
  August: 1 + DAYS_PER_MONTH * 5,
  September: 1 + DAYS_PER_MONTH * 6,
  October: 1 + DAYS_PER_MONTH * 7,
  November: 1 + DAYS_PER_MONTH * 8,
  December: 1 + DAYS_PER_MONTH * 9,
  January: 1 + DAYS_PER_MONTH * 10,
  February: 1 + DAYS_PER_MONTH * 11,
};

export function getDateInfo(day: number) {
  const dayIndex = Math.max(0, day - 1);
  const year = Math.floor(dayIndex / DAYS_PER_YEAR) + 1;
  const dayOfYear = dayIndex % DAYS_PER_YEAR;
  const monthIndex = Math.floor(dayOfYear / DAYS_PER_MONTH) % MONTHS_PER_YEAR;
  const month = MONTHS[monthIndex];
  const season = MONTH_TO_SEASON[month];
  const dayOfMonth = (dayOfYear % DAYS_PER_MONTH) + 1;
  const monthInSeason = (monthIndex % MONTHS_PER_SEASON) + 1;
  const dayInSeason = (dayOfYear % DAYS_PER_SEASON) + 1;

  return {
    year,
    season,
    month,
    monthIndex,
    dayOfMonth,
    monthInSeason,
    dayInSeason,
    totalDay: day,
  };
}

export function timeToTicks(day: number, hour: number, minute: number): number {
  const totalMinutes = (day - 1) * MINUTES_PER_DAY + (hour * MINUTES_PER_HOUR + minute) - DAY_START_MINUTE_OFFSET;
  return Math.max(0, totalMinutes * TICKS_PER_MINUTE);
}

export function ticksToTime(tick: number) {
  const totalMinutes = Math.floor(tick / TICKS_PER_MINUTE) + DAY_START_MINUTE_OFFSET;
  const day = Math.floor(totalMinutes / MINUTES_PER_DAY) + 1;
  const minuteOfDay = totalMinutes % MINUTES_PER_DAY;
  const hour = Math.floor(minuteOfDay / MINUTES_PER_HOUR);
  const minute = minuteOfDay % MINUTES_PER_HOUR;
  const dateInfo = getDateInfo(day);
  return { day, hour, minute, ...dateInfo };
}

export function getTargetSnowAccumulation(
  season: SeasonType,
  dayInSeason: number,
  hour: number = 12,
  minute: number = 0
): number {
  const fractionalDay = dayInSeason + (hour * 60 + minute) / (24 * 60);

  if (season === 'Winter') {
    if (fractionalDay <= 15) {
      return Math.min(1.0, Math.max(0.0, fractionalDay / 15));
    } else if (fractionalDay <= 20) {
      return 1.0;
    } else {
      const meltProgress = (fractionalDay - 20) / 10;
      return Math.max(0.35, Math.min(1.0, 1.0 - meltProgress * 0.65));
    }
  } else if (season === 'Spring') {
    if (fractionalDay < 5.0) {
      const meltRatio = (5.0 - fractionalDay) / 4.0;
      return Math.max(0.0, Math.min(0.30, 0.30 * meltRatio));
    } else {
      return 0.0;
    }
  } else {
    return 0.0;
  }
}
