import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { SeasonType, WeatherType, MonthName } from '../../types/game';
import {
  CrossCloseIcon,
  SpringSeasonIcon,
  SummerSeasonIcon,
  AutumnSeasonIcon,
  WinterSeasonIcon,
  WeatherClearIcon,
  WeatherRainIcon,
  WeatherStormIcon,
  WeatherSnowIcon,
  CompassIcon,
  HourglassIcon,
  FleurDeLisIcon,
} from './MedievalIcons';
import {
  Lock,
  Unlock,
  Zap,
  Sunrise,
  Sunset,
  Moon
} from 'lucide-react';
import { useTranslation } from '../../i18n';

const SEASON_MONTHS: Record<SeasonType, MonthName[]> = {
  Spring: ['March', 'April', 'May'],
  Summer: ['June', 'July', 'August'],
  Autumn: ['September', 'October', 'November'],
  Winter: ['December', 'January', 'February'],
};

export function WeatherDebugModal() {
  const { dict } = useTranslation();

  const isWeatherDebugOpen = useGameStore((s) => s.isWeatherDebugOpen);
  const setIsWeatherDebugOpen = useGameStore((s) => s.setIsWeatherDebugOpen);
  const season = useGameStore((s) => s.time.season);
  const month = useGameStore((s) => s.time.month);
  const weather = useGameStore((s) => s.time.weather);
  const targetWeather = useGameStore((s) => s.time.targetWeather || s.time.weather);
  const nextWeather = useGameStore((s) => s.time.nextWeather);
  const isWeatherLocked = useGameStore((s) => s.time.isWeatherLocked ?? false);
  const snowAccumulation = useGameStore((s) => s.time.snowAccumulation ?? 0);
  const hour = useGameStore((s) => s.time.hour);

  const setSeason = useGameStore((s) => s.setSeason);
  const setMonth = useGameStore((s) => s.setMonth);
  const setWeather = useGameStore((s) => s.setWeather);
  const setWeatherLocked = useGameStore((s) => s.setWeatherLocked);
  const triggerLightning = useGameStore((s) => s.triggerLightning);
  const setSnowAccumulation = useGameStore((s) => s.setSnowAccumulation);
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay);

  if (!isWeatherDebugOpen) return null;

  const seasonsList: { id: SeasonType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'Spring', label: dict.hud.seasons.Spring, icon: SpringSeasonIcon },
    { id: 'Summer', label: dict.hud.seasons.Summer, icon: SummerSeasonIcon },
    { id: 'Autumn', label: dict.hud.seasons.Autumn, icon: AutumnSeasonIcon },
    { id: 'Winter', label: dict.hud.seasons.Winter, icon: WinterSeasonIcon },
  ];

  const weatherList: { id: WeatherType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: 'clear', label: dict.hud.weather.clear, icon: WeatherClearIcon, color: 'text-amber-400' },
    { id: 'rain', label: dict.hud.weather.rain, icon: WeatherRainIcon, color: 'text-blue-400' },
    { id: 'storm', label: dict.hud.weather.storm, icon: WeatherStormIcon, color: 'text-indigo-300' },
    { id: 'snow', label: dict.hud.weather.snow, icon: WeatherSnowIcon, color: 'text-cyan-200' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150 pointer-events-auto">
      <div className="relative w-full max-w-lg bg-[#121418]/98 border-2 border-[#5a4830] rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.95)] text-slate-200 font-cinzel overflow-hidden pointer-events-auto">

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3d3222] bg-gradient-to-r from-amber-950/40 via-transparent to-amber-950/20">
          <div className="flex items-center gap-2">
            <CompassIcon className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-amber-200 tracking-wider uppercase">
                {dict.climate.title}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-normal">
                {dict.climate.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWeatherDebugOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
            title={dict.common.close}
          >
            <CrossCloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto font-sans">

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wider uppercase flex items-center gap-1.5">
                <CompassIcon className="w-3.5 h-3.5 text-amber-400" />
                {dict.climate.seasonsSection}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {dict.common.season}: <strong className="text-amber-200">{(dict.hud.seasons as any)[season] || season}</strong>
                {month && dict.hud.months && (
                  <span className="text-amber-300 ml-1.5">
                    • {dict.hud.months[month] || month}
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {seasonsList.map((s) => {
                const Icon = s.icon;
                const isActiveSeason = season === s.id;
                const months = SEASON_MONTHS[s.id];
                return (
                  <div
                    key={s.id}
                    className={`flex flex-col p-2.5 rounded-xl border transition ${
                      isActiveSeason
                        ? 'bg-amber-600/20 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                        : 'bg-[#181a20] border-[#3d3222]'
                    }`}
                  >
                    <button
                      onClick={() => setSeason(s.id)}
                      className="flex flex-col items-center justify-center p-1.5 mb-2 rounded-lg hover:bg-amber-950/30 transition text-center cursor-pointer group"
                    >
                      <Icon className="w-5 h-5 mb-1 text-amber-300 group-hover:scale-110 transition-transform drop-shadow" />
                      <span className={`font-cinzel text-xs font-bold ${isActiveSeason ? 'text-amber-200' : 'text-slate-300'}`}>
                        {s.label}
                      </span>
                    </button>

                    <div className="flex flex-col gap-1 border-t border-[#3d3222]/80 pt-1.5">
                      {months.map((m) => {
                        const isCurrentMonth = month === m;
                        const label = dict.hud.months ? dict.hud.months[m] || m : m;
                        return (
                          <button
                            key={m}
                            onClick={() => setMonth(m)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-cinzel text-center transition cursor-pointer ${
                              isCurrentMonth
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                : 'bg-[#121418] hover:bg-amber-950/40 text-slate-400 hover:text-amber-200 border border-[#2d251a]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wider uppercase flex items-center gap-1.5">
                <WeatherClearIcon className="w-3.5 h-3.5 text-amber-400" />
                {dict.climate.weatherSection}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {dict.hud.weather[weather as keyof typeof dict.hud.weather] || weather}
                {targetWeather !== weather && (
                  <span className="text-amber-400/90 ml-1">
                    → {dict.hud.weather[targetWeather as keyof typeof dict.hud.weather] || targetWeather}
                  </span>
                )}
                {nextWeather && (
                  <span className="text-slate-400 ml-1">
                    ({dict.hud.weather[nextWeather as keyof typeof dict.hud.weather] || nextWeather})
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weatherList.map((w) => {
                const Icon = w.icon;
                const isActive = targetWeather === w.id;
                const isAllowed = season === 'Winter'
                  ? (w.id === 'clear' || w.id === 'snow')
                  : (w.id !== 'snow');
                return (
                  <button
                    key={w.id}
                    disabled={!isAllowed}
                    onClick={() => setWeather(w.id, isWeatherLocked)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition group text-center ${
                      !isAllowed
                        ? 'opacity-30 cursor-not-allowed bg-[#181a20]/40 border-slate-800 text-slate-500'
                        : isActive
                        ? 'bg-amber-600/30 border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400 cursor-pointer'
                        : 'bg-[#181a20] border-[#3d3222] text-slate-300 hover:border-amber-600/60 hover:bg-[#20222a] cursor-pointer'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-1.5 ${w.color} group-hover:scale-110 transition-transform drop-shadow`} />
                    <span className="font-cinzel text-xs font-bold">{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#181a20] border border-[#3d3222]">
            <div className="flex items-center gap-2.5">
              {isWeatherLocked ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <Unlock className="w-4 h-4 text-emerald-400" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {isWeatherLocked ? dict.climate.lockWeather : dict.climate.unlockWeather}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {dict.climate.autoWeatherDesc}
                </div>
              </div>
            </div>

            <button
              onClick={() => setWeatherLocked(!isWeatherLocked)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                isWeatherLocked
                  ? 'bg-amber-700/40 text-amber-200 border-amber-600 hover:bg-amber-700/60'
                  : 'bg-emerald-800/40 text-emerald-200 border-emerald-600 hover:bg-emerald-800/60'
              }`}
            >
              {isWeatherLocked ? dict.climate.unlockWeather : dict.climate.lockWeather}
            </button>
          </div>

          <div className="space-y-3 p-3 rounded-xl bg-[#181a20] border border-[#3d3222]">
            <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wider uppercase flex items-center gap-1.5">
              <FleurDeLisIcon className="w-3.5 h-3.5 text-amber-400" />
              {dict.climate.effectsSection}
            </span>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                {dict.climate.lightningFlash}
              </span>
              <button
                disabled={season === 'Winter'}
                onClick={triggerLightning}
                className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 transition shadow ${
                  season === 'Winter'
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 cursor-pointer'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {dict.climate.triggerFlash}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <WinterSeasonIcon className="w-4 h-4 text-cyan-300" />
                  {dict.climate.snowCoverage}
                </span>
                <span className="font-mono text-cyan-200 font-bold">
                  {Math.round(snowAccumulation * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={snowAccumulation}
                onChange={(e) => setSnowAccumulation(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wider uppercase flex items-center gap-1.5">
                <HourglassIcon className="w-3.5 h-3.5 text-amber-400" />
                {dict.climate.timeOfDay} ({hour}:00)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setTimeOfDay(7)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#181a20] border border-[#3d3222] hover:border-amber-500 text-xs font-mono text-slate-200 hover:text-amber-200 transition cursor-pointer"
              >
                <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                {dict.climate.morning}
              </button>
              <button
                onClick={() => setTimeOfDay(12)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#181a20] border border-[#3d3222] hover:border-amber-500 text-xs font-mono text-slate-200 hover:text-amber-200 transition cursor-pointer"
              >
                <WeatherClearIcon className="w-3.5 h-3.5 text-yellow-400" />
                {dict.climate.noon}
              </button>
              <button
                onClick={() => setTimeOfDay(18)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#181a20] border border-[#3d3222] hover:border-amber-500 text-xs font-mono text-slate-200 hover:text-amber-200 transition cursor-pointer"
              >
                <Sunset className="w-3.5 h-3.5 text-orange-400" />
                {dict.climate.evening}
              </button>
              <button
                onClick={() => setTimeOfDay(0)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#181a20] border border-[#3d3222] hover:border-amber-500 text-xs font-mono text-slate-200 hover:text-amber-200 transition cursor-pointer"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                {dict.climate.night}
              </button>
            </div>
          </div>

        </div>

        <div className="px-5 py-3 bg-[#0d0e12] border-t border-[#3d3222] text-center text-[11px] text-slate-400 font-mono">
          {dict.climate.tip}
        </div>
      </div>
    </div>
  );
}
