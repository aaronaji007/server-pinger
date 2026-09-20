import React, { useState } from 'react';
import { X, Globe, Server, AlertCircle } from 'lucide-react';

interface AddMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AddMonitorModal: React.FC<AddMonitorModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'http' | 'tcp'>('http');
  const [target, setTarget] = useState('');
  const [port, setPort] = useState('22');
  const [interval, setInterval] = useState('60');
  const [threshold, setThreshold] = useState('2');
  const [timeoutMs, setTimeoutMs] = useState('8000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !target.trim()) {
      setError('Please provide a monitor name and target.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        target: target.trim(),
        port: type === 'tcp' ? parseInt(port, 10) || 80 : null,
        interval_seconds: parseInt(interval, 10) || 60,
        failure_threshold: parseInt(threshold, 10) || 2,
        timeout_ms: parseInt(timeoutMs, 10) || 8000
      });
      setName('');
      setTarget('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create monitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              {type === 'http' ? <Globe className="w-5 h-5" /> : <Server className="w-5 h-5" />}
            </div>
            <h3 className="font-semibold text-lg text-white">Add New Monitor</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Monitor Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Monitor Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('http')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  type === 'http'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>HTTP / HTTPS Website</span>
              </button>
              <button
                type="button"
                onClick={() => setType('tcp')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  type === 'tcp'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>VPS Server / TCP Port</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Friendly Name</label>
            <input
              type="text"
              required
              placeholder={type === 'http' ? 'e.g. My Website' : 'e.g. Production VPS Server'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Target + Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className={type === 'tcp' ? 'col-span-2' : 'col-span-3'}>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {type === 'http' ? 'URL (HTTP / HTTPS)' : 'Server IP / Hostname'}
              </label>
              <input
                type="text"
                required
                placeholder={type === 'http' ? 'https://example.com' : '198.51.100.24 or vps.domain.com'}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {type === 'tcp' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Port</label>
                <input
                  type="number"
                  required
                  placeholder="22"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Monitoring Interval & Failure Threshold */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Check Frequency</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="15">Every 15 seconds (High precision)</option>
                <option value="30">Every 30 seconds</option>
                <option value="60">Every 1 minute (Recommended)</option>
                <option value="120">Every 2 minutes</option>
                <option value="300">Every 5 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Alert Threshold
              </label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="1">1 failure (Instant alert)</option>
                <option value="2">2 failures (Recommended, prevents false alarms)</option>
                <option value="3">3 failures</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
