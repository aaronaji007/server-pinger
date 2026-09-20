import React, { useEffect, useState } from 'react';
import { X, Globe, Server, Activity, ShieldCheck, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Monitor } from '../types.ts';

interface MonitorDetailModalProps {
  monitor: Monitor | null;
  onClose: () => void;
  onCheckNow: (id: number) => Promise<void>;
}

export const MonitorDetailModal: React.FC<MonitorDetailModalProps> = ({
  monitor,
  onClose,
  onCheckNow
}) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!monitor) return;
    setLoading(true);
    fetch(`/api/monitors/${monitor.id}`)
      .then((res) => res.json())
      .then((data) => setDetails(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [monitor]);

  if (!monitor) return null;

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      await onCheckNow(monitor.id);
      const res = await fetch(`/api/monitors/${monitor.id}`);
      const data = await res.json();
      setDetails(data);
    } finally {
      setChecking(false);
    }
  };

  const heartbeats = details?.heartbeats || monitor.recentHeartbeats || [];
  const incidents = details?.incidents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              monitor.status === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {monitor.type === 'tcp' ? <Server className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">{monitor.name}</h3>
              <p className="text-xs font-mono text-slate-400">{monitor.target}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{checking ? 'Pinging...' : 'Ping Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400">Current Status</span>
              <div className="mt-1 flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${monitor.status === 'up' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
                <span className="font-bold text-base uppercase text-white">{monitor.status}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400">Latest Latency</span>
              <div className="mt-1 font-bold text-base text-slate-200 font-mono">
                {monitor.last_latency_ms ? `${monitor.last_latency_ms} ms` : '--'}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400">24-Hour Uptime</span>
              <div className="mt-1 font-bold text-base text-emerald-400">
                {monitor.uptime_24h}%
              </div>
            </div>
          </div>

          {/* Latency History Chart (Custom SVG visualizer) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Response Time History (Heartbeats)</span>
              </span>
              <span className="text-[11px] text-slate-500">Last {heartbeats.length} records</span>
            </div>

            {heartbeats.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No heartbeat data collected yet.</div>
            ) : (
              <div>
                <div className="flex items-end space-x-1 h-32 pt-4 px-2 border-b border-slate-800">
                  {heartbeats.map((b: any, idx: number) => {
                    const isUp = b.status === 'up';
                    const maxLatency = 500;
                    const heightPct = Math.min(100, Math.max(12, Math.round((b.latency_ms / maxLatency) * 100)));

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end"
                      >
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t transition-all ${
                            isUp
                              ? 'bg-indigo-500/70 group-hover:bg-indigo-400'
                              : 'bg-rose-500 group-hover:bg-rose-400'
                          }`}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                          <div className="bg-slate-950 border border-slate-700 text-white text-[10px] rounded px-2 py-1 shadow-lg whitespace-nowrap font-mono">
                            {b.status.toUpperCase()} • {b.latency_ms}ms
                            <br />
                            <span className="text-slate-400 text-[9px]">{b.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
                  <span>Earliest recorded</span>
                  <span>Latest check</span>
                </div>
              </div>
            )}
          </div>

          {/* Incident History for this monitor */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Downtime Incidents
            </h4>
            {incidents.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 text-xs text-slate-400 text-center">
                No incidents reported. Service is completely healthy.
              </div>
            ) : (
              <div className="space-y-2">
                {incidents.map((inc: any) => (
                  <div
                    key={inc.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-rose-400">{inc.cause}</div>
                      <div className="text-slate-500 font-mono text-[10px] mt-0.5">Started: {inc.started_at}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-300">
                        {inc.duration_seconds ? `${inc.duration_seconds}s downtime` : 'Ongoing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
