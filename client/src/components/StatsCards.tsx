import React from 'react';
import { Server, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import { SystemStats } from '../types.ts';

interface StatsCardsProps {
  stats: SystemStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
      {/* Total Monitors */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Targets</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Server className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight">{stats.totalMonitors}</span>
          <span className="text-xs text-slate-500">configured</span>
        </div>
      </div>

      {/* Online */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Operational</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.upMonitors}</span>
          <span className="text-xs text-emerald-500/80 font-medium">up & running</span>
        </div>
      </div>

      {/* Offline */}
      <div className={`bg-slate-900/60 border rounded-2xl p-4 shadow-sm backdrop-blur-sm transition-colors ${
        stats.downMonitors > 0 ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Disrupted</span>
          <div className={`p-2 rounded-xl ${
            stats.downMonitors > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}>
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className={`text-2xl font-bold tracking-tight ${stats.downMonitors > 0 ? 'text-rose-400' : 'text-white'}`}>
            {stats.downMonitors}
          </span>
          <span className="text-xs text-slate-500">offline</span>
        </div>
      </div>

      {/* Average Latency */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Avg Response</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-white tracking-tight">{stats.avgLatencyMs || '--'}</span>
          <span className="text-xs text-slate-500">ms</span>
        </div>
      </div>

      {/* Active Incidents */}
      <div className="col-span-2 md:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Open Incidents</span>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight">{stats.activeIncidents}</span>
          <span className="text-xs text-slate-500">active</span>
        </div>
      </div>
    </div>
  );
};
