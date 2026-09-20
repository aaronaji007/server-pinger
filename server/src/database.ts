import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pulseguard.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for high performance SQLite
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'http', -- 'http' or 'tcp'
      target TEXT NOT NULL,               -- e.g. https://google.com or 1.2.3.4
      port INTEGER,                       -- for tcp (e.g. 22, 80, 443, 3306)
      interval_seconds INTEGER DEFAULT 60,
      timeout_ms INTEGER DEFAULT 8000,
      status TEXT DEFAULT 'pending',      -- 'up', 'down', 'degraded', 'paused', 'pending'
      last_checked_at TEXT,
      last_status_change_at TEXT,
      consecutive_failures INTEGER DEFAULT 0,
      failure_threshold INTEGER DEFAULT 2,
      last_latency_ms REAL DEFAULT 0,
      avg_latency_ms REAL DEFAULT 0,
      uptime_24h REAL DEFAULT 100.0,
      ssl_expiry_days INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS heartbeats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id INTEGER NOT NULL,
      status TEXT NOT NULL,              -- 'up' or 'down'
      latency_ms REAL NOT NULL,
      status_code INTEGER,
      error_message TEXT,
      timestamp TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_heartbeats_monitor_time 
      ON heartbeats (monitor_id, timestamp DESC);

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id INTEGER NOT NULL,
      cause TEXT NOT NULL,
      started_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      resolved_at TEXT,
      duration_seconds INTEGER,
      FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notification_settings (
      id TEXT PRIMARY KEY,               -- 'email', 'whatsapp', 'ntfy', 'telegram', 'webhook'
      enabled INTEGER DEFAULT 0,
      config TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Populate default notification settings channels if empty
  const channels = ['email', 'whatsapp', 'ntfy', 'telegram', 'webhook'];
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO notification_settings (id, enabled, config)
    VALUES (?, 0, ?)
  `);

  for (const ch of channels) {
    let defaultConfig = '{}';
    if (ch === 'email') {
      defaultConfig = JSON.stringify({
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpPass: '',
        fromEmail: '',
        recipientEmails: ''
      });
    } else if (ch === 'whatsapp') {
      defaultConfig = JSON.stringify({
        provider: 'callmebot', // 'callmebot' (free & instant) or 'twilio' or 'webhook'
        phoneNumber: '',
        apiKey: '',
        twilioSid: '',
        twilioAuthToken: '',
        twilioFromNumber: ''
      });
    } else if (ch === 'ntfy') {
      defaultConfig = JSON.stringify({
        serverUrl: 'https://ntfy.sh',
        topic: 'pulseguard-' + Math.random().toString(36).substring(2, 9),
        priority: 'urgent'
      });
    } else if (ch === 'telegram') {
      defaultConfig = JSON.stringify({
        botToken: '',
        chatId: ''
      });
    } else if (ch === 'webhook') {
      defaultConfig = JSON.stringify({
        url: '',
        method: 'POST'
      });
    }
    insertStmt.run(ch, defaultConfig);
  }

  // Insert sample starter monitors if empty
  const count = db.prepare('SELECT count(*) as count FROM monitors').get() as { count: number };
  if (count.count === 0) {
    const insertMonitor = db.prepare(`
      INSERT INTO monitors (name, type, target, interval_seconds, timeout_ms, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    insertMonitor.run('Cloudflare DNS (HTTP)', 'http', 'https://1.1.1.1', 60, 5000);
    insertMonitor.run('Google DNS (HTTP)', 'http', 'https://dns.google', 60, 5000);
  }
}
