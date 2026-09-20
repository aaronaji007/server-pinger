import React from 'react';
import { 
  Terminal, 
  Smartphone, 
  MessageSquare, 
  Mail, 
  Server, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';

export const GuideTab: React.FC = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <span>PulseGuard Setup & Integration Guide</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Everything you need to configure instant alerts on your phone, deploy to your VPS, and monitor servers 24/7.
        </p>
      </div>

      {/* Guide 1: Android Phone Alerts */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">
              Option 1: Real-Time Push Alerts to Android Phone (via ntfy)
            </h3>
            <p className="text-xs text-slate-400">100% Free & Open-Source • No accounts or signups required</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Instead of building, compiling, and signing an Android APK that requires maintaining Google Play developer accounts, PulseGuard utilizes <strong>ntfy</strong> — the world's most popular open-source push notification system.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold flex items-center justify-center mb-2">1</div>
            <h4 className="text-xs font-semibold text-white">Install the App</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Search for <strong>"ntfy"</strong> on the Google Play Store or F-Droid and install it on your Android phone.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold flex items-center justify-center mb-2">2</div>
            <h4 className="text-xs font-semibold text-white">Subscribe to Topic</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Open the ntfy app, tap <strong>+</strong> and enter your chosen private topic (e.g. <code className="text-indigo-300 font-mono">my-vps-pulse-8942</code>).
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold flex items-center justify-center mb-2">3</div>
            <h4 className="text-xs font-semibold text-white">Priority Alarm</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              PulseGuard sends alerts with <strong>Urgent</strong> priority, making your phone ring out loud even if on silent or in your pocket!
            </p>
          </div>
        </div>
      </div>

      {/* Guide 2: WhatsApp Alerts */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">
              Option 2: WhatsApp Outage Notifications (CallMeBot)
            </h3>
            <p className="text-xs text-slate-400">Get WhatsApp messages delivered directly to your personal chat</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <p>
            <strong>CallMeBot</strong> is a free community gateway that sends WhatsApp messages to your personal phone number with zero complicated Meta business verifications.
          </p>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl font-mono text-xs space-y-1">
            <div className="text-emerald-400">1. Save WhatsApp Contact: +34 644 59 71 83</div>
            <div className="text-slate-300">2. Send message: <span className="text-white bg-slate-800 px-1 py-0.5 rounded">I allow callmebot to send me messages</span></div>
            <div className="text-slate-400">3. Receive your API key and paste it in the PulseGuard Alerts tab.</div>
          </div>
        </div>
      </div>

      {/* Guide 3: Email Alerts */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">
              Option 3: Email Alerts (Gmail / SMTP)
            </h3>
            <p className="text-xs text-slate-400">Works with Gmail App Passwords, Mailgun, Amazon SES, SendGrid, or any SMTP</p>
          </div>
        </div>

        <div className="text-xs text-slate-300 space-y-2">
          <p>
            If you are using Gmail:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
            <li>Go to your Google Account &gt; <strong>Security</strong> &gt; <strong>2-Step Verification</strong>.</li>
            <li>Scroll to the bottom and create an <strong>App Password</strong> (name it "PulseGuard").</li>
            <li>Use Host: <code className="text-sky-300">smtp.gmail.com</code>, Port: <code className="text-sky-300">587</code>, and enter your 16-character App Password.</li>
          </ol>
        </div>
      </div>

      {/* Guide 4: VPS / Production Deployment */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">
              How to Run PulseGuard 24/7 on your VPS Server
            </h3>
            <p className="text-xs text-slate-400">Run as a background systemd service or PM2 daemon</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
            <span>Option A: Run with PM2 (Recommended for Node.js)</span>
            <button
              onClick={() => copyCode('npm install -g pm2\npm run build\npm2 start server/dist/index.js --name pulseguard\npm2 save\npm2 startup', 'pm2')}
              className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              {copied === 'pm2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'pm2' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-indigo-300 overflow-x-auto">
{`# 1. Install PM2 process manager
npm install -g pm2

# 2. Build frontend and backend
npm run build

# 3. Start PulseGuard 24/7 in background
pm2 start server/dist/index.js --name pulseguard

# 4. Ensure it restarts automatically across VPS reboots
pm2 save
pm2 startup`}
          </pre>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
            <span>Option B: Run with Docker</span>
            <button
              onClick={() => copyCode('docker-compose up -d', 'docker')}
              className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              {copied === 'docker' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'docker' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
{`docker-compose up -d --build`}
          </pre>
        </div>
      </div>
    </div>
  );
};
