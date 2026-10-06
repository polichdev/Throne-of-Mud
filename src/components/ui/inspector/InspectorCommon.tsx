import React from 'react';

export function NeedBar({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex justify-between items-center text-slate-300">
        <span className="flex items-center gap-1.5 font-medium">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          {label}
        </span>
        <span className="font-mono text-slate-400">{Math.round(value)}%</span>
      </div>
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-300 ${
            value > 50 ? 'bg-emerald-500' : value > 25 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function SkillBadge({
  label,
  level,
  icon: Icon,
}: {
  label: string;
  level: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80">
      <span className="flex items-center gap-1 text-slate-400">
        <Icon className="w-3 h-3 text-amber-500/80" />
        {label}
      </span>
      <span className="font-mono font-bold text-amber-400">{level}</span>
    </div>
  );
}
