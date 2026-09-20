import React, { useState } from 'react';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Send, 
  Check, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { NotificationChannel } from '../types.ts';

interface NotificationSettingsProps {
  channels: NotificationChannel[];
  onSaveChannel: (id: string, enabled: boolean, config: any) => Promise<void>;
  onTestChannel: (id: string, config: any) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  channels,
  onSaveChannel,
  onTestChannel
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email' | 'ntfy' | 'telegram'>('whatsapp');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Local state for each channel
  const emailCh = channels.find((c) => c.id === 'email') || { id: 'email', enabled: false, config: {} };
  const waCh = channels.find((c) => c.id === 'whatsapp') || { id: 'whatsapp', enabled: false, config: {} };
  const ntfyCh = channels.find((c) => c.id === 'ntfy') || { id: 'ntfy', enabled: false, config: {} };
  const tgCh = channels.find((c) => c.id === 'telegram') || { id: 'telegram', enabled: false, config: {} };

  const [emailConfig, setEmailConfig] = useState<any>(emailCh.config || {});
  const [emailEnabled, setEmailEnabled] = useState<boolean>(Boolean(emailCh.enabled));

  const [waConfig, setWaConfig] = useState<any>(waCh.config || { provider: 'callmebot' });
  const [waEnabled, setWaEnabled] = useState<boolean>(Boolean(waCh.enabled));

  const [ntfyConfig, setNtfyConfig] = useState<any>(ntfyCh.config || { serverUrl: 'https://ntfy.sh', topic: 'pulseguard-alerts' });
  const [ntfyEnabled, setNtfyEnabled] = useState<boolean>(Boolean(ntfyCh.enabled));

  const [tgConfig, setTgConfig] = useState<any>(tgCh.config || {});
  const [tgEnabled, setTgEnabled] = useState<boolean>(Boolean(tgCh.enabled));

  const handleSave = async (id: string) => {
    setSaving(true);
    setTestResult(null);
    try {
      if (id === 'email') await onSaveChannel('email', emailEnabled, emailConfig);
      if (id === 'whatsapp') await onSaveChannel('whatsapp', waEnabled, waConfig);
      if (id === 'ntfy') await onSaveChannel('ntfy', ntfyEnabled, ntfyConfig);
      if (id === 'telegram') await onSaveChannel('telegram', tgEnabled, tgConfig);
      setTestResult({ success: true, message: 'Settings saved successfully!' });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTesting(true);
    setTestResult(null);
    let cfg = {};
    if (id === 'email') cfg = emailConfig;
    if (id === 'whatsapp') cfg = waConfig;
    if (id === 'ntfy') cfg = ntfyConfig;
    if (id === 'telegram') cfg = tgConfig;

    try {
      const res = await onTestChannel(id, cfg);
      if (res.success) {
        setTestResult({ success: true, message: res.message || 'Test alert sent successfully!' });
      } else {
        setTestResult({ success: false, message: res.error || 'Failed to send test alert' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error executing test alert' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overview header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <span>Multi-Channel Alert Configuration</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure real-time alerts so you or your team get warned the very moment a website or VPS server goes down.
        </p>

        {/* Tab selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
          <button
            onClick={() => { setSelectedChannel('whatsapp'); setTestResult(null); }}
            className={`flex items-center space-x-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${
              selectedChannel === 'whatsapp'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="font-semibold text-xs">WhatsApp</div>
              <div className="text-[10px] text-slate-500">{waEnabled ? 'Active' : 'Disabled'}</div>
            </div>
          </button>

          <button
            onClick={() => { setSelectedChannel('ntfy'); setTestResult(null); }}
            className={`flex items-center space-x-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${
              selectedChannel === 'ntfy'
                ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <div className="text-left">
              <div className="font-semibold text-xs">Android Push (ntfy)</div>
              <div className="text-[10px] text-slate-500">{ntfyEnabled ? 'Active' : 'Disabled'}</div>
            </div>
          </button>

          <button
            onClick={() => { setSelectedChannel('email'); setTestResult(null); }}
            className={`flex items-center space-x-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${
              selectedChannel === 'email'
                ? 'bg-sky-500/10 border-sky-500/50 text-sky-400 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <div className="text-left">
              <div className="font-semibold text-xs">Email (SMTP)</div>
              <div className="text-[10px] text-slate-500">{emailEnabled ? 'Active' : 'Disabled'}</div>
            </div>
          </button>

          <button
            onClick={() => { setSelectedChannel('telegram'); setTestResult(null); }}
            className={`flex items-center space-x-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${
              selectedChannel === 'telegram'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="font-semibold text-xs">Telegram Bot</div>
              <div className="text-[10px] text-slate-500">{tgEnabled ? 'Active' : 'Disabled'}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Test feedback banner */}
      {testResult && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-sm animate-in fade-in duration-150 ${
          testResult.success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {testResult.success ? <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* CHANNEL 1: WHATSAPP */}
      {selectedChannel === 'whatsapp' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-base text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <span>WhatsApp Alerts Setup</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Get WhatsApp message notifications instantly when your server goes down or recovers.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={waEnabled}
                onChange={(e) => setWaEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Quick instructions box */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Fastest Setup: Free CallMeBot WhatsApp API (Takes 30 seconds)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Add phone number <strong className="text-white">+34 644 59 71 83</strong> to your phone's WhatsApp contacts as "CallMeBot".</li>
              <li>Send this exact WhatsApp message to it: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">I allow callmebot to send me messages</code></li>
              <li>CallMeBot will instantly reply with your personal <strong className="text-white">API Key</strong>.</li>
              <li>Paste your phone number (including country code) and API Key below and tap <strong>Test WhatsApp</strong>!</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Provider</label>
              <select
                value={waConfig.provider || 'callmebot'}
                onChange={(e) => setWaConfig({ ...waConfig, provider: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="callmebot">CallMeBot (Free personal WhatsApp)</option>
                <option value="twilio">Twilio WhatsApp API (Business)</option>
                <option value="webhook">Custom WhatsApp Gateway / Webhook</option>
              </select>
            </div>

            {waConfig.provider === 'callmebot' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-400">
                    Recipient WhatsApp Numbers & API Keys
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const recs = waConfig.recipients ? [...waConfig.recipients] : [];
                      recs.push({ phone: '', apiKey: '' });
                      setWaConfig({ ...waConfig, recipients: recs });
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    + Add Another Number
                  </button>
                </div>

                {(waConfig.recipients || [
                  { phone: '919004572253', apiKey: '' },
                  { phone: '61466588037', apiKey: '' }
                ]).map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Recipient #{idx + 1}</span>
                      {(waConfig.recipients?.length > 1) && (
                        <button
                          type="button"
                          onClick={() => {
                            const recs = waConfig.recipients.filter((_: any, i: number) => i !== idx);
                            setWaConfig({ ...waConfig, recipients: recs });
                          }}
                          className="text-rose-400 hover:text-rose-300 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 919004572253"
                        value={rec.phone || ''}
                        onChange={(e) => {
                          const recs = [...(waConfig.recipients || [
                            { phone: '919004572253', apiKey: '' },
                            { phone: '61466588037', apiKey: '' }
                          ])];
                          recs[idx] = { ...recs[idx], phone: e.target.value };
                          setWaConfig({ ...waConfig, recipients: recs });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="password"
                        placeholder="CallMeBot API Key"
                        value={rec.apiKey || ''}
                        onChange={(e) => {
                          const recs = [...(waConfig.recipients || [
                            { phone: '919004572253', apiKey: '' },
                            { phone: '61466588037', apiKey: '' }
                          ])];
                          recs[idx] = { ...recs[idx], apiKey: e.target.value };
                          setWaConfig({ ...waConfig, recipients: recs });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {waConfig.provider === 'twilio' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Twilio Account SID</label>
                  <input
                    type="text"
                    value={waConfig.twilioSid || ''}
                    onChange={(e) => setWaConfig({ ...waConfig, twilioSid: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={waConfig.twilioAuthToken || ''}
                    onChange={(e) => setWaConfig({ ...waConfig, twilioAuthToken: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Twilio WhatsApp Number (From)</label>
                  <input
                    type="text"
                    placeholder="+14155238886"
                    value={waConfig.twilioFromNumber || ''}
                    onChange={(e) => setWaConfig({ ...waConfig, twilioFromNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Your WhatsApp Number (To)</label>
                  <input
                    type="text"
                    placeholder="+919876543210"
                    value={waConfig.phoneNumber || ''}
                    onChange={(e) => setWaConfig({ ...waConfig, phoneNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                  />
                </div>
              </div>
            )}

            {waConfig.provider === 'webhook' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Custom Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://my-whatsapp-gateway.com/send-message"
                  value={waConfig.webhookUrl || ''}
                  onChange={(e) => setWaConfig({ ...waConfig, webhookUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleTest('whatsapp')}
              disabled={testing}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testing ? 'Sending Test...' : 'Send Test WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('whatsapp')}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save WhatsApp Settings'}
            </button>
          </div>
        </div>
      )}

      {/* CHANNEL 2: ANDROID PUSH (NTFY) */}
      {selectedChannel === 'ntfy' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-base text-white flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span>Android Phone Push Notifications (via ntfy)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive instant priority alarm push alerts right on your Android phone without needing to build an APK.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ntfyEnabled}
                onChange={(e) => setNtfyEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-indigo-400 flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>How Android Push Alerting Works (100% Free & Open-Source)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>
                Download the <strong className="text-white">ntfy</strong> app from Google Play Store or F-Droid on your Android phone.
              </li>
              <li>
                Open the app, click the <strong className="text-white">+</strong> button to <em>Subscribe to topic</em>.
              </li>
              <li>
                Type in your private topic name: <code className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono font-bold">{ntfyConfig.topic || 'pulseguard-alerts'}</code>
              </li>
              <li>
                Tap <strong>Subscribe</strong>. That's it! When a server is down, your phone will ring and vibrate with an urgent priority alert.
              </li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Your Unique Topic Name (Make it secret/unique to you)
              </label>
              <input
                type="text"
                placeholder="e.g. pulseguard-alerts-xyz99"
                value={ntfyConfig.topic || ''}
                onChange={(e) => setNtfyConfig({ ...ntfyConfig, topic: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Server URL (Optional, defaults to public ntfy.sh)</label>
              <input
                type="text"
                placeholder="https://ntfy.sh"
                value={ntfyConfig.serverUrl || 'https://ntfy.sh'}
                onChange={(e) => setNtfyConfig({ ...ntfyConfig, serverUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleTest('ntfy')}
              disabled={testing}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testing ? 'Sending Test...' : 'Send Test Android Push'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('ntfy')}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Push Settings'}
            </button>
          </div>
        </div>
      )}

      {/* CHANNEL 3: EMAIL (SMTP) */}
      {selectedChannel === 'email' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-base text-white flex items-center space-x-2">
                <Mail className="w-5 h-5 text-sky-400" />
                <span>Email (SMTP) Alert Setup</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Send beautiful HTML outage and recovery reports to one or multiple email inboxes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">SMTP Host</label>
              <input
                type="text"
                placeholder="smtp.gmail.com or smtp.mailgun.org"
                value={emailConfig.smtpHost || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">SMTP Port</label>
              <input
                type="number"
                placeholder="587 (or 465)"
                value={emailConfig.smtpPort || 587}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value, 10) || 587 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">SMTP Username / Email</label>
              <input
                type="text"
                placeholder="your-email@gmail.com"
                value={emailConfig.smtpUser || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">SMTP Password / App Password</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={emailConfig.smtpPass || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Recipient Email(s) (comma separated for multiple people)
              </label>
              <input
                type="text"
                placeholder="devops@mycompany.com, alerts@personal.com"
                value={emailConfig.recipientEmails || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, recipientEmails: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleTest('email')}
              disabled={testing}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testing ? 'Sending Test...' : 'Send Test Email'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('email')}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>
        </div>
      )}

      {/* CHANNEL 4: TELEGRAM */}
      {selectedChannel === 'telegram' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-base text-white flex items-center space-x-2">
                <Send className="w-5 h-5 text-amber-400" />
                <span>Telegram Bot Alert Setup</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Send instant alerts directly to your personal Telegram or group chat.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={tgEnabled}
                onChange={(e) => setTgEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Telegram Bot Token (from @BotFather)</label>
              <input
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={tgConfig.botToken || ''}
                onChange={(e) => setTgConfig({ ...tgConfig, botToken: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Chat ID (from @userinfobot or channel ID)</label>
              <input
                type="text"
                placeholder="e.g. 987654321"
                value={tgConfig.chatId || ''}
                onChange={(e) => setTgConfig({ ...tgConfig, chatId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleTest('telegram')}
              disabled={testing}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testing ? 'Sending Test...' : 'Send Test Telegram'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('telegram')}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Telegram Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
