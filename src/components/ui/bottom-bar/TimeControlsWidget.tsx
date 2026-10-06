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
    <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-auto z-20 select-none">
      <div className="flex items-center gap-2 bg-[#121418]/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#52422d]/80 shadow-2xl">
        <div
          onClick={() => setIsWeatherDebugOpen(true)}
          className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 px-1.5 py-0.5 rounded-lg transition"
          title={`${dict.common.season}: ${currentSeasonInfo.label}${monthLabel ? ` • ${dict.common.month}: ${monthLabel}` : ''}`}
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
        </div>

        <div className="w-[1px] h-3.5 bg-[#4a3b26]" />

        <div
          onClick={() => setIsWeatherDebugOpen(true)}
          className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 px-1.5 py-0.5 rounded-lg transition"
          title={`${currentWeatherInfo.label}${nextWeather ? ` • ${language === 'uk' ? 'Далі' : 'Next'}: ${weatherIcons[nextWeather]?.label || nextWeather}` : ''}`}
        >
          <CurrentWeatherIcon className={`w-3.5 h-3.5 ${currentWeatherInfo.color} drop-shadow`} />
          <span className="text-xs font-cinzel font-semibold text-slate-200">
            {currentWeatherInfo.label}
          </span>
        </div>

        <button
          onClick={() => setIsWeatherDebugOpen(true)}
          className="p-1 rounded-lg text-amber-400 hover:text-amber-200 hover:bg-amber-950/70 transition border border-transparent hover:border-amber-600/50 ml-0.5 cursor-pointer"
          title={language === 'uk' ? 'Дебаг-меню: Пори року та Погода (F2)' : 'Debug Menu: Seasons & Weather (F2)'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 bg-[#121418]/95 backdrop-blur-md p-1 rounded-xl border border-[#52422d]/80 shadow-2xl">
        <button
          onClick={togglePause}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isPaused
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={language === 'uk' ? 'Пауза (Пробіл)' : 'Pause (Space)'}
        >
          <Pause className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setSpeedMultiplier(1)}
          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            !isPaused && speedMultiplier === 1
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={language === 'uk' ? '1x Звичайна швидкість' : '1x Normal Speed'}
        >
          1x
        </button>

        <button
          onClick={() => setSpeedMultiplier(2)}
          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            !isPaused && speedMultiplier === 2
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={language === 'uk' ? '2x Прискорена' : '2x Fast Speed'}
        >
          2x
        </button>

        <button
          onClick={() => setSpeedMultiplier(5)}
          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            !isPaused && speedMultiplier === 5
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={language === 'uk' ? '5x Максимальна' : '5x Maximum Speed'}
        >
          5x
        </button>
      </div>
    </div>
  );
});

TimeControlsWidget.displayName = 'TimeControlsWidget';
