import { db } from '../database.js';
import { sendEmail, EmailConfig } from '../notifiers/email.js';
import { sendWhatsApp, WhatsAppConfig } from '../notifiers/whatsapp.js';
import { sendNtfyPush, NtfyConfig } from '../notifiers/push.js';
import { sendTelegram, TelegramConfig } from '../notifiers/telegram.js';

export interface MonitorRecord {
  id: number;
  name: string;
  type: string;
  target: string;
  port?: number;
  status: string;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (mins < 60) return `${mins}m ${remSec}s`;
  const hours = Math.floor(mins / 60);
  const remMin = mins % 60;
  return `${hours}h ${remMin}m ${remSec}s`;
}

export async function dispatchAlerts(
  event: 'DOWN' | 'UP',
  monitor: MonitorRecord,
  details: {
    reason?: string;
    durationSeconds?: number;
    time?: string;
  }
) {
  const timeStr = details.time || new Date().toLocaleString();
  const targetDesc = monitor.type === 'tcp' ? `${monitor.target}:${monitor.port || 80} (TCP)` : monitor.target;
  const isDown = event === 'DOWN';

  // Load enabled notification channels
  const activeChannels = db.prepare('SELECT id, config FROM notification_settings WHERE enabled = 1').all() as { id: string; config: string }[];

  const results: Record<string, any> = {};

  for (const ch of activeChannels) {
    let cfg: any = {};
    try {
      cfg = JSON.parse(ch.config);
    } catch {
      continue;
    }

    if (ch.id === 'email') {
      const subject = isDown
        ? `🔴 CRITICAL: ${monitor.name} is DOWN`
        : `🟢 RESOLVED: ${monitor.name} is back UP`;
      results.email = await sendEmail(cfg as EmailConfig, subject, {
        title: isDown ? `Service Outage Detected` : `Service Restored to Normal`,
        monitorName: monitor.name,
        target: targetDesc,
        status: isDown ? 'DOWN' : 'UP',
        time: timeStr,
        reason: details.reason,
        duration: details.durationSeconds ? formatDuration(details.durationSeconds) : undefined
      });
    } else if (ch.id === 'whatsapp') {
      let waMsg = '';
      if (isDown) {
        waMsg = `🔴 *CRITICAL ALERT: SERVICE DOWN*\n\n*Monitor:* ${monitor.name}\n*Target:* ${targetDesc}\n*Time:* ${timeStr}\n*Reason:* ${details.reason || 'No response'}\n\nImmediate attention required.`;
      } else {
        const dur = details.durationSeconds ? formatDuration(details.durationSeconds) : 'N/A';
        waMsg = `🟢 *RESOLVED: SERVICE BACK ONLINE*\n\n*Monitor:* ${monitor.name}\n*Target:* ${targetDesc}\n*Downtime Duration:* ${dur}\n*Time:* ${timeStr}\n\nService is operating normally again.`;
      }
      results.whatsapp = await sendWhatsApp(cfg as WhatsAppConfig, waMsg);
    } else if (ch.id === 'ntfy') {
      const pushTitle = isDown ? `🔴 ${monitor.name} is DOWN!` : `🟢 ${monitor.name} is UP`;
      const pushMsg = isDown
        ? `${targetDesc} is unreachable.\nReason: ${details.reason || 'Timeout'}`
        : `${targetDesc} recovered after ${details.durationSeconds ? formatDuration(details.durationSeconds) : 'outage'}.`;
      results.ntfy = await sendNtfyPush(cfg as NtfyConfig, {
        title: pushTitle,
        message: pushMsg,
        priority: isDown ? 'urgent' : 'default',
        tags: isDown ? ['rotating_light', 'warning', 'skull'] : ['white_check_mark', 'tada']
      });
    } else if (ch.id === 'telegram') {
      let tgMsg = '';
      if (isDown) {
        tgMsg = `🚨 *PULSEGUARD: MONITOR DOWN*\n\n*Service:* ${monitor.name}\n*Target:* \`${targetDesc}\`\n*Reason:* ${details.reason || 'Unresponsive'}\n*Time:* ${timeStr}`;
      } else {
        const dur = details.durationSeconds ? formatDuration(details.durationSeconds) : 'N/A';
        tgMsg = `✅ *PULSEGUARD: SERVICE RESTORED*\n\n*Service:* ${monitor.name}\n*Target:* \`${targetDesc}\`\n*Total Downtime:* ${dur}\n*Time:* ${timeStr}`;
      }
      results.telegram = await sendTelegram(cfg as TelegramConfig, tgMsg);
    }
  }

  return results;
}
