import React, { useState } from 'react';
import { 
  Globe, 
  Server, 
  RefreshCw, 
  Pause, 
  Play, 
  Trash2, 
  ExternalLink, 
  Lock, 
  AlertTriangle,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Monitor } from '../types.ts';

interface MonitorListProps {
  monitors: Monitor[];
  onCheckNow: (id: number) => Promise<void>;
  onToggleActive: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSelectMonitor: (monitor: Monitor) => void;
  onEdit: (monitor: Monitor) => void;
}

export const MonitorList: React.FC<MonitorListProps> = ({
  monitors,
  onCheckNow,
  onToggleActive,
  onDelete,
  onSelectMonitor,
  onEdit
}) => {
  const [checkingIds, setCheckingIds] = useState<Set<number>>(new Set());

  const handleCheck = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setCheckingIds((prev) => new Set(prev).add(id));
    try {
      await onCheckNow(id);
    } finally {
      setCheckingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string, isActive: number) => {
    if (isActive === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <Pause className="w-3 h-3 mr-1" />
          Paused
        </span>
      );
    }

    switch (status) {
      case 'up':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Operational
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            DOWN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
            Checking...
          </span>
        );
    }
  };

  if (monitors.length === 0) {
    return (
      <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
        <Server className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No monitors configured yet</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Start monitoring your website, web application, or VPS server port right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {monitors.map((m) => {
        const isChecking = checkingIds.has(m.id);
        const beats = m.recentHeartbeats || [];

        return (
          <div
            key={m.id}
            onClick={() => onSelectMonitor(m)}
            className="group relative bg-slate-900/50 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Column: Icon + Name + Target */}
              <div className="flex items-start space-x-3.5 min-w-0">
                <div className={`p-2.5 rounded-xl border mt-0.5 ${
                  m.status === 'up' && m.is_active === 1
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : m.status === 'down' && m.is_active === 1
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {m.type === 'tcp' ? (
                    <Server className="w-5 h-5" />
                  ) : (
                    <Globe className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {m.name}
                    </h4>
                    {getStatusBadge(m.status, m.is_active)}
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {m.type === 'tcp' ? `TCP Port ${m.port || 80}` : 'HTTP'}
                    </span>
                    {m.ssl_expiry_days !== undefined && m.ssl_expiry_days !== null && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded border inline-flex items-center space-x-1 ${
                        m.ssl_expiry_days > 14
                          ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        <span>SSL {m.ssl_expiry_days}d</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center space-x-2 text-xs text-slate-400">
                    <span className="font-mono truncate max-w-xs sm:max-w-md text-slate-300">
                      {m.target}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1 inline" />
                      Every {m.interval_seconds}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Column: Latency & Sparkline */}
              <div className="flex items-center space-x-6">
                {/* 20-tick Sparkline */}
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-end space-x-1 h-7">
                    {beats.length === 0 ? (
                      <div className="text-[11px] text-slate-600 italic">No heartbeat history</div>
                    ) : (
                      beats.map((b, idx) => {
                        const isUp = b.status === 'up';
                        const heightPct = Math.min(100, Math.max(20, Math.round((b.latency_ms / 400) * 100)));
                        return (
                          <div
                            key={idx}
                            title={`${b.status.toUpperCase()} • ${b.latency_ms}ms at ${b.timestamp}`}
                            style={{ height: `${heightPct}%` }}
                            className={`w-1.5 rounded-t transition-all ${
                              isUp
                                ? 'bg-emerald-500/80 hover:bg-emerald-400'
                                : 'bg-rose-500 hover:bg-rose-400'
                            }`}
                          />
                        );
                      })
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">last 20 checks</span>
                </div>

                {/* Response stats */}
                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0 w-full sm:w-auto">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xs text-slate-500">Latency:</span>
                    <span className="text-sm font-semibold text-slate-200 font-mono">
                      {m.last_latency_ms ? `${m.last_latency_ms}ms` : '--'}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="text-xs text-slate-500">24h Uptime:</span>
                    <span className={`text-xs font-semibold ${
                      m.uptime_24h >= 99 ? 'text-emerald-400' : m.uptime_24h >= 95 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {m.uptime_24h}%
                    </span>
                  </div>
                </div>

                {/* Right Column: Actions */}
                <div className="flex items-center space-x-1 pl-2" onClick={(e) => e.stopPropagation()}>
                  {/* Immediate check */}
                  <button
                    onClick={(e) => handleCheck(e, m.id)}
                    disabled={isChecking}
                    title="Ping Now"
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>

                  {/* Pause / Resume */}
                  <button
                    onClick={() => onToggleActive(m.id)}
                    title={m.is_active === 1 ? 'Pause Monitor' : 'Resume Monitor'}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {m.is_active === 1 ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete monitor "${m.name}"?`)) {
                        onDelete(m.id);
                      }
                    }}
                    title="Delete Monitor"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
