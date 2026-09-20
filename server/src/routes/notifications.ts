import { Router } from 'express';
import { db } from '../database.js';
import { testEmail, EmailConfig } from '../notifiers/email.js';
import { testWhatsApp, WhatsAppConfig } from '../notifiers/whatsapp.js';
import { testNtfyPush, NtfyConfig } from '../notifiers/push.js';
import { testTelegram, TelegramConfig } from '../notifiers/telegram.js';

export const notificationsRouter = Router();

// GET all channel configs
notificationsRouter.get('/', (req, res) => {
  try {
    const channels = db.prepare('SELECT id, enabled, config, updated_at FROM notification_settings').all() as any[];
    const parsed = channels.map((c) => {
      let cfg = {};
      try {
        cfg = JSON.parse(c.config);
      } catch {}
      return {
        id: c.id,
        enabled: Boolean(c.enabled),
        config: cfg,
        updated_at: c.updated_at
      };
    });
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update channel config
notificationsRouter.put('/:id', (req, res) => {
  try {
    const { enabled, config } = req.body;
    const jsonConfig = typeof config === 'string' ? config : JSON.stringify(config || {});
    const enabledVal = enabled ? 1 : 0;

    db.prepare(`
      INSERT INTO notification_settings (id, enabled, config, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        enabled = excluded.enabled,
        config = excluded.config,
        updated_at = CURRENT_TIMESTAMP
    `).run(req.params.id, enabledVal, jsonConfig);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST test notification delivery
notificationsRouter.post('/:id/test', async (req, res) => {
  const channelId = req.params.id;
  const config = req.body.config || {};

  try {
    let result: { success: boolean; error?: string } = { success: false, error: 'Unknown channel' };

    if (channelId === 'email') {
      result = await testEmail(config as EmailConfig);
    } else if (channelId === 'whatsapp') {
      result = await testWhatsApp(config as WhatsAppConfig);
    } else if (channelId === 'ntfy') {
      result = await testNtfyPush(config as NtfyConfig);
    } else if (channelId === 'telegram') {
      result = await testTelegram(config as TelegramConfig);
    }

    if (result.success) {
      res.json({ success: true, message: 'Test notification sent successfully!' });
    } else {
      res.status(400).json({ success: false, error: result.error || 'Failed to deliver test message' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
