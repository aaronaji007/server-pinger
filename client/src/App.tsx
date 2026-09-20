import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { StatsCards } from './components/StatsCards.tsx';
import { MonitorList } from './components/MonitorList.tsx';
import { AddMonitorModal } from './components/AddMonitorModal.tsx';
import { MonitorDetailModal } from './components/MonitorDetailModal.tsx';
import { NotificationSettings } from './components/NotificationSettings.tsx';
import { IncidentsList } from './components/IncidentsList.tsx';
import { GuideTab } from './components/GuideTab.tsx';
import { Monitor, SystemStats, Incident, NotificationChannel } from './types.ts';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitors' | 'incidents' | 'notifications' | 'guide'>('monitors');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalMonitors: 0,
    upMonitors: 0,
    downMonitors: 0,
    pausedMonitors: 0,
    avgLatencyMs: 0,
    activeIncidents: 0
  });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data
  const fetchData = async () => {
    try {
      const [monRes, statsRes, incRes, chanRes] = await Promise.all([
        fetch('/api/monitors'),
        fetch('/api/stats'),
        fetch('/api/incidents'),
        fetch('/api/notifications')
      ]);

      if (monRes.ok) setMonitors(await monRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (incRes.ok) setIncidents(await incRes.json());
      if (chanRes.ok) setChannels(await chanRes.json());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 8 seconds for real-time monitoring
    const timer = setInterval(fetchData, 8000);
    return () => clearInterval(timer);
  }, []);

  // Monitor operations
  const handleAddMonitor = async (data: any) => {
    const res = await fetch('/api/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add monitor');
    }
    await fetchData();
  };

  const handleCheckNow = async (id: number) => {
    await fetch(`/api/monitors/${id}/check`, { method: 'POST' });
    await fetchData();
  };

  const handleToggleActive = async (id: number) => {
    await fetch(`/api/monitors/${id}/toggle`, { method: 'POST' });
    await fetchData();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/monitors/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  // Notification operations
  const handleSaveChannel = async (id: string, enabled: boolean, config: any) => {
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, config })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save settings');
    }
    await fetchData();
  };

  const handleTestChannel = async (id: string, config: any) => {
    const res = await fetch(`/api/notifications/${id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });
    return res.json();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddClick={() => setIsAddModalOpen(true)}
        downCount={stats.downMonitors}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'monitors' && (
          <div>
            <StatsCards stats={stats} />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Monitored Endpoints</h3>
                <p className="text-xs text-slate-400">Websites, APIs, and VPS server ports</p>
              </div>
            </div>
            <MonitorList
              monitors={monitors}
              onCheckNow={handleCheckNow}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              onSelectMonitor={(m) => setSelectedMonitor(m)}
              onEdit={() => {}}
            />
          </div>
        )}

        {activeTab === 'incidents' && (
          <IncidentsList incidents={incidents} />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettings
            channels={channels}
            onSaveChannel={handleSaveChannel}
            onTestChannel={handleTestChannel}
          />
        )}

        {activeTab === 'guide' && (
          <GuideTab />
        )}
      </main>

      {/* Add Monitor Modal */}
      <AddMonitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMonitor}
      />

      {/* Monitor Details Modal */}
      <MonitorDetailModal
        monitor={selectedMonitor}
        onClose={() => setSelectedMonitor(null)}
        onCheckNow={handleCheckNow}
      />
    </div>
  );
};
