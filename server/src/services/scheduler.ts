import { db } from '../database.js';
import { checkHttp, checkTcp, CheckResult } from './checker.js';
import { dispatchAlerts } from './notifier.js';

let schedulerInterval: NodeJS.Timeout | null = null;
const runningChecks = new Set<number>();

export async function pingMonitor(monitorId: number): Promise<CheckResult | null> {
  const monitor: any = db.prepare('SELECT * FROM monitors WHERE id = ?').get(monitorId);
  if (!monitor) return null;

  let result: CheckResult;
  if (monitor.type === 'tcp') {
    result = await checkTcp(monitor.target, monitor.port || 80, monitor.timeout_ms);
  } else {
    result = await checkHttp(monitor.target, monitor.timeout_ms);
  }

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Record heartbeat
  db.prepare(`
    INSERT INTO heartbeats (monitor_id, status, latency_ms, status_code, error_message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    monitor.id,
    result.isUp ? 'up' : 'down',
    result.latencyMs,
    result.statusCode || null,
    result.errorMessage || null,
    nowStr
  );

  // Keep heartbeats clean (keep last 2000 per monitor to avoid unlimited growth)
  db.prepare(`
    DELETE FROM heartbeats WHERE monitor_id = ? AND id NOT IN (
      SELECT id FROM heartbeats WHERE monitor_id = ? ORDER BY id DESC LIMIT 2000
    )
  `).run(monitor.id, monitor.id);

  // Compute stats: 24h uptime percentage & average latency
  const stats: any = db.prepare(`
    SELECT 
      COUNT(*) as total_checks,
      SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_checks,
      AVG(latency_ms) as avg_latency
    FROM heartbeats 
    WHERE monitor_id = ? AND datetime(timestamp) >= datetime('now', '-24 hours')
  `).get(monitor.id);

  const totalChecks = stats.total_checks || 1;
  const upChecks = stats.up_checks || (result.isUp ? 1 : 0);
  const uptime24h = Math.round((upChecks / totalChecks) * 1000) / 10;
  const avgLatency = Math.round((stats.avg_latency || result.latencyMs) * 10) / 10;

  // Handle status transitions and consecutive failure thresholds
  let newStatus = monitor.status;
  let newConsecutiveFailures = monitor.consecutive_failures || 0;
  let statusChanged = false;

  if (result.isUp) {
    newConsecutiveFailures = 0;
    if (monitor.status !== 'up') {
      newStatus = 'up';
      statusChanged = true;

      // Resolve existing open incident
      const openIncident: any = db.prepare(`
        SELECT id, started_at FROM incidents 
        WHERE monitor_id = ? AND resolved_at IS NULL 
        ORDER BY id DESC LIMIT 1
      `).get(monitor.id);

      let durationSec = 0;
      if (openIncident) {
        const startedTime = new Date(openIncident.started_at).getTime();
        durationSec = Math.max(1, Math.round((Date.now() - startedTime) / 1000));
        db.prepare(`
          UPDATE incidents 
          SET resolved_at = ?, duration_seconds = ? 
          WHERE id = ?
        `).run(nowStr, durationSec, openIncident.id);
      }

      // Dispatch UP / Recovery alert if previous state was confirmed down
      if (monitor.status === 'down') {
        dispatchAlerts('UP', monitor, {
          durationSeconds: durationSec,
          time: nowStr
        }).catch((err) => console.error('Error dispatching UP alert:', err));
      }
    }
  } else {
    newConsecutiveFailures += 1;
    if (newConsecutiveFailures >= (monitor.failure_threshold || 2)) {
      if (monitor.status !== 'down') {
        newStatus = 'down';
        statusChanged = true;

        // Record new incident
        db.prepare(`
          INSERT INTO incidents (monitor_id, cause, started_at)
          VALUES (?, ?, ?)
        `).run(monitor.id, result.errorMessage || 'Connection failed', nowStr);

        // Dispatch DOWN alert
        dispatchAlerts('DOWN', monitor, {
          reason: result.errorMessage || 'Target unreachable or timed out',
          time: nowStr
        }).catch((err) => console.error('Error dispatching DOWN alert:', err));
      }
    }
  }

  // Update monitor row
  db.prepare(`
    UPDATE monitors SET
      status = ?,
      last_checked_at = ?,
      last_status_change_at = CASE WHEN ? THEN ? ELSE last_status_change_at END,
      consecutive_failures = ?,
      last_latency_ms = ?,
      avg_latency_ms = ?,
      uptime_24h = ?,
      ssl_expiry_days = COALESCE(?, ssl_expiry_days)
    WHERE id = ?
  `).run(
    newStatus,
    nowStr,
    statusChanged ? 1 : 0,
    nowStr,
    newConsecutiveFailures,
    result.latencyMs,
    avgLatency,
    uptime24h,
    result.sslDaysRemaining ?? null,
    monitor.id
  );

  return result;
}

async function checkDueMonitors() {
  const dueMonitors: any[] = db.prepare(`
    SELECT id, name, type, target, port, interval_seconds, timeout_ms 
    FROM monitors 
    WHERE is_active = 1 
      AND (
        last_checked_at IS NULL 
        OR (strftime('%s', 'now') - strftime('%s', last_checked_at)) >= interval_seconds
      )
  `).all();

  for (const mon of dueMonitors) {
    if (runningChecks.has(mon.id)) continue;
    runningChecks.add(mon.id);

    pingMonitor(mon.id)
      .catch((err) => console.error(`Error pinging monitor ${mon.id}:`, err))
      .finally(() => runningChecks.delete(mon.id));
  }
}

export function startScheduler(pollIntervalMs: number = 5000) {
  if (schedulerInterval) return;
  console.log('[PulseGuard Scheduler] Started background health-check loop.');
  // Run an immediate check on startup
  checkDueMonitors();
  schedulerInterval = setInterval(checkDueMonitors, pollIntervalMs);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[PulseGuard Scheduler] Stopped.');
  }
}
