import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useTranslation } from '../../../i18n';
import {
  SpringSeasonIcon,
  SummerSeasonIcon,
  AutumnSeasonIcon,
  WinterSeasonIcon,
  WeatherClearIcon,
  WeatherRainIcon,
  WeatherStormIcon,
  WeatherSnowIcon,
  CompassIcon,
} from '../MedievalIcons';
import { Pause, SlidersHorizontal } from 'lucide-react';

export const TimeControlsWidget: React.FC = React.memo(() => {
  const { dict, language } = useTranslation();

  const isPaused = useGameStore((s) => s.time.isPaused);
  const speedMultiplier = useGameStore((s) => s.time.speedMultiplier);
  const setSpeedMultiplier = useGameStore((s) => s.setSpeedMultiplier);
  const togglePause = useGameStore((s) => s.togglePause);
  const season = useGameStore((s) => s.time.season);
  const month = useGameStore((s) => s.time.month);
  const dayOfMonth = useGameStore((s) => s.time.dayOfMonth);
  const day = useGameStore((s) => s.time.day);
  const hour = useGameStore((s) => s.time.hour);
  const minute = useGameStore((s) => s.time.minute);
  const weather = useGameStore((s) => s.time.weather);
  const nextWeather = useGameStore((s) => s.time.nextWeather);
  const setIsWeatherDebugOpen = useGameStore((s) => s.setIsWeatherDebugOpen);

  const seasonLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    Spring: { label: dict.hud.seasons.Spring, icon: SpringSeasonIcon },
    Summer: { label: dict.hud.seasons.Summer, icon: SummerSeasonIcon },
    Autumn: { label: dict.hud.seasons.Autumn, icon: AutumnSeasonIcon },
    Winter: { label: dict.hud.seasons.Winter, icon: WinterSeasonIcon },
  };

  const weatherIcons: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    clear: { label: dict.hud.weather.clear, icon: WeatherClearIcon, color: 'text-amber-400' },
    rain: { label: dict.hud.weather.rain, icon: WeatherRainIcon, color: 'text-blue-400' },
    storm: { label: dict.hud.weather.storm, icon: WeatherStormIcon, color: 'text-indigo-300' },
    snow: { label: dict.hud.weather.snow, icon: WeatherSnowIcon, color: 'text-cyan-200' },
  };

  const currentSeasonInfo = seasonLabels[season] || { label: season, icon: CompassIcon };
  const CurrentSeasonIcon = currentSeasonInfo.icon;
  const monthLabel = month && dict.hud.months ? dict.hud.months[month] : undefined;
  const currentWeatherInfo = weatherIcons[weather] || { label: weather, icon: WeatherClearIcon, color: 'text-amber-400' };
  const CurrentWeatherIcon = currentWeatherInfo.icon;

  return (
    <div className="realm-time-widget absolute bottom-3 right-3 flex items-center gap-2 pointer-events-auto z-20 select-none">
      <div className="realm-paper-panel flex items-center gap-2 bg-[#121418]/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#52422d]/80 shadow-2xl">
        <button type="button"
          onClick={() => setIsWeatherDebugOpen(true)}
          className="ui-tip-anchor flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 px-1.5 py-0.5 rounded-lg transition"
          data-ui-tip={`${dict.common.season}: ${currentSeasonInfo.label}${monthLabel ? ` • ${dict.common.month}: ${monthLabel}` : ''}`}
          aria-label={`${dict.common.season}: ${currentSeasonInfo.label}`}
        >
          <CurrentSeasonIcon className="w-4 h-4 text-amber-300 drop-shadow" />
          <div className="flex flex-col text-left leading-none">
            <span className="text-xs font-cinzel font-bold text-amber-200">
              {monthLabel || currentSeasonInfo.label}
            </span>
            <span className="text-[9px] text-amber-400/80 font-mono">
              {currentSeasonInfo.label}
            </span>
          </div>
        </button>

        <div className="w-[1px] h-3.5 bg-[#4a3b26]" />

        <button type="button"
          onClick={() => setIsWeatherDebugOpen(true)}
          className="ui-tip-anchor flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 px-1.5 py-0.5 rounded-lg transition"
          data-ui-tip={`${currentWeatherInfo.label}${nextWeather ? ` • ${language === 'uk' ? 'Далі' : 'Next'}: ${weatherIcons[nextWeather]?.label || nextWeather}` : ''}`}
          aria-label={currentWeatherInfo.label}
        >
          <CurrentWeatherIcon className={`w-3.5 h-3.5 ${currentWeatherInfo.color} drop-shadow`} />
          <span className="text-xs font-cinzel font-semibold text-slate-200">
            {currentWeatherInfo.label}
          </span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#4a3b26]" />

        <div className="ui-tip-anchor flex items-center gap-2 px-1 whitespace-nowrap text-[11px] font-cinzel font-semibold text-[#c8b58e]" data-ui-tip={`${dict.common.day} ${dayOfMonth || day}, ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}>
          <span>{dict.common.day} {dayOfMonth || day}</span>
          <span className="text-[#77674c]">·</span>
          <span className="font-mono tabular-nums text-[#d6c6a8]">{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</span>
        </div>

        <button
          onClick={() => setIsWeatherDebugOpen(true)}
          className="ui-tip-anchor p-1 rounded-lg text-amber-400 hover:text-amber-200 hover:bg-amber-950/70 transition border border-transparent hover:border-amber-600/50 ml-0.5 cursor-pointer"
          data-ui-tip={language === 'uk' ? 'Пори року та погода (F2)' : 'Seasons & Weather (F2)'}
          aria-label={language === 'uk' ? 'Пори року та погода' : 'Seasons and Weather'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="realm-paper-panel flex items-center gap-1 bg-[#121418]/95 backdrop-blur-md p-1 rounded-xl border border-[#52422d]/80 shadow-2xl">
        <button
          onClick={togglePause}
          className={`ui-tip-anchor p-1.5 rounded-lg transition cursor-pointer ${
            isPaused
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          data-ui-tip={language === 'uk' ? 'Пауза (Пробіл)' : 'Pause (Space)'}
          aria-label={language === 'uk' ? 'Пауза' : 'Pause'}
          aria-pressed={isPaused}
        >
          <Pause className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setSpeedMultiplier(1)}
          className={`ui-tip-anchor px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            !isPaused && speedMultiplier === 1
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          data-ui-tip={language === 'uk' ? '1× Звичайна швидкість' : '1× Normal Speed'}
          aria-label={language === 'uk' ? 'Звичайна швидкість' : 'Normal speed'}
          aria-pressed={!isPaused && speedMultiplier === 1}
        >
          1x
        </button>

        <button
          onClick={() => setSpeedMultiplier(2)}
          className={`ui-tip-anchor px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            !isPaused && speedMultiplier === 2
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          data-ui-tip={language === 'uk' ? '2× Прискорена' : '2× Fast Speed'}
          aria-label={language === 'uk' ? 'Подвійна швидкість' : 'Double speed'}
          aria-pressed={!isPaused && speedMultiplier === 2}
        >
          2x
        </button>

        <button
          onClick={() => setSpeedMultiplier(5)}
          className={`ui-tip-anchor px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            !isPaused && speedMultiplier === 5
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          data-ui-tip={language === 'uk' ? '5× Максимальна' : '5× Maximum Speed'}
          aria-label={language === 'uk' ? 'П’ятикратна швидкість' : 'Fivefold speed'}
          aria-pressed={!isPaused && speedMultiplier === 5}
        >
          5x
        </button>
      </div>
    </div>
  );
});

TimeControlsWidget.displayName = 'TimeControlsWidget';
