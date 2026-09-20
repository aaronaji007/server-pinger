import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Server, Globe } from 'lucide-react';
import { Incident } from '../types.ts';

interface IncidentsListProps {
  incidents: Incident[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'Ongoing Outage';
  if (seconds < 60) return `${seconds} seconds`;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (mins < 60) return `${mins}m ${remSec}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m ${remSec}s`;
}

export const IncidentsList: React.FC<IncidentsListProps> = ({ incidents }) => {
  if (incidents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 px-4 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
        <CheckCircle className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No recorded downtime incidents</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          All your monitored websites and VPS servers have been 100% stable without interruptions.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Outage & Incident History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log of all disruptions, root causes, and total downtime durations.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {incidents.map((inc) => {
          const isOngoing = !inc.resolved_at;

          return (
            <div
              key={inc.id}
              className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                isOngoing
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-900/10 animate-pulse'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className={`p-2.5 rounded-xl border mt-0.5 ${
                    isOngoing
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {inc.monitor_type === 'tcp' ? <Server className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-white text-base">
                        {inc.monitor_name || `Monitor #${inc.monitor_id}`}
                      </h4>
                      {isOngoing ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                          ONGOING OUTAGE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          RESOLVED
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-slate-400 mt-1">
                      {inc.monitor_target}
                    </p>

                    <div className="mt-2 text-xs text-rose-400 font-medium">
                      Error: <span className="font-mono">{inc.cause}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                  <div className="text-xs text-slate-500 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>Downtime:</span>
                    <strong className={`ml-1 font-semibold ${isOngoing ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                      {formatDuration(inc.duration_seconds)}
                    </strong>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Started: {inc.started_at}
                  </div>
                  {inc.resolved_at && (
                    <div className="text-[11px] text-emerald-500/80 font-mono">
                      Resolved: {inc.resolved_at}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
