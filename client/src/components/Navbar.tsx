import React from 'react';
import { Activity, Bell, ShieldCheck, AlertTriangle, Plus, Terminal } from 'lucide-react';

interface NavbarProps {
  activeTab: 'monitors' | 'incidents' | 'notifications' | 'guide';
  setActiveTab: (tab: 'monitors' | 'incidents' | 'notifications' | 'guide') => void;
  onAddClick: () => void;
  downCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onAddClick,
  downCount
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PulseGuard
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Server & Uptime Sentinel</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('monitors')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'monitors'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'incidents'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>Incidents</span>
            {downCount > 0 && (
              <span className="px-1.5 py-0.2 text-xs font-bold rounded-full bg-rose-500 text-white">
                {downCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'notifications'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts & Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'guide'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Setup Guide</span>
          </button>
        </nav>

        {/* Actions & Status Pill */}
        <div className="flex items-center space-x-3">
          {downCount === 0 ? (
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All Systems Operational</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{downCount} Service{downCount > 1 ? 's' : ''} DOWN</span>
            </div>
          )}

          <button
            onClick={onAddClick}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Monitor</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab row */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-950 px-2 py-1 overflow-x-auto space-x-1">
        <button
          onClick={() => setActiveTab('monitors')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'monitors' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'incidents' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          Incidents {downCount > 0 && `(${downCount})`}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'notifications' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          Alerts
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'guide' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          Setup Guide
        </button>
      </div>
    </header>
  );
};
