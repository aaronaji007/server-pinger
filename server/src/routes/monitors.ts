import { Router } from 'express';
import { db } from '../database.js';
import { pingMonitor } from '../services/scheduler.js';

export const monitorsRouter = Router();

// GET all monitors with recent 20 heartbeats for sparkline
monitorsRouter.get('/', (req, res) => {
  try {
    const monitors: any[] = db.prepare(`
      SELECT * FROM monitors ORDER BY id DESC
    `).all();

    const getHeartbeats = db.prepare(`
      SELECT latency_ms, status, timestamp 
      FROM heartbeats 
      WHERE monitor_id = ? 
      ORDER BY id DESC LIMIT 20
    `);

    const enriched = monitors.map((m) => {
      const beats = getHeartbeats.all(m.id) as any[];
      return {
        ...m,
        recentHeartbeats: beats.reverse()
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single monitor with full details and history
monitorsRouter.get('/:id', (req, res) => {
  try {
    const monitor: any = db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const heartbeats = db.prepare(`
      SELECT id, status, latency_ms, status_code, error_message, timestamp 
      FROM heartbeats 
      WHERE monitor_id = ? 
      ORDER BY id DESC LIMIT 100
    `).all(monitor.id);

    const incidents = db.prepare(`
      SELECT * FROM incidents 
      WHERE monitor_id = ? 
      ORDER BY id DESC LIMIT 50
    `).all(monitor.id);

    res.json({
      ...monitor,
      heartbeats: heartbeats.reverse(),
      incidents
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new monitor
monitorsRouter.post('/', async (req, res) => {
  try {
    const { name, type, target, port, interval_seconds, timeout_ms, failure_threshold } = req.body;

    if (!name || !target) {
      return res.status(400).json({ error: 'Name and target are required' });
    }

    const mType = type === 'tcp' ? 'tcp' : 'http';
    const interval = Math.max(10, Number(interval_seconds) || 60);
    const timeout = Math.max(1000, Number(timeout_ms) || 8000);
    const threshold = Math.max(1, Number(failure_threshold) || 2);
    const mPort = mType === 'tcp' ? (Number(port) || 80) : null;

    const stmt = db.prepare(`
      INSERT INTO monitors (name, type, target, port, interval_seconds, timeout_ms, failure_threshold, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(name.trim(), mType, target.trim(), mPort, interval, timeout, threshold);
    const newId = Number(result.lastInsertRowid);

    // Trigger immediate ping in background so UI gets instant result
    pingMonitor(newId).catch(console.error);

    const created = db.prepare('SELECT * FROM monitors WHERE id = ?').get(newId);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update monitor
monitorsRouter.put('/:id', (req, res) => {
  try {
    const { name, type, target, port, interval_seconds, timeout_ms, failure_threshold } = req.body;
    const mType = type === 'tcp' ? 'tcp' : 'http';
    const mPort = mType === 'tcp' ? (Number(port) || 80) : null;

    db.prepare(`
      UPDATE monitors SET
        name = ?,
        type = ?,
        target = ?,
        port = ?,
        interval_seconds = ?,
        timeout_ms = ?,
        failure_threshold = ?
      WHERE id = ?
    `).run(
      name,
      mType,
      target,
      mPort,
      Number(interval_seconds) || 60,
      Number(timeout_ms) || 8000,
      Number(failure_threshold) || 2,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE monitor
monitorsRouter.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM monitors WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST toggle active / pause
monitorsRouter.post('/:id/toggle', (req, res) => {
  try {
    const mon: any = db.prepare('SELECT is_active FROM monitors WHERE id = ?').get(req.params.id);
    if (!mon) return res.status(404).json({ error: 'Not found' });

    const newActive = mon.is_active === 1 ? 0 : 1;
    const newStatus = newActive === 0 ? 'paused' : 'pending';

    db.prepare('UPDATE monitors SET is_active = ?, status = ? WHERE id = ?').run(newActive, newStatus, req.params.id);

    if (newActive === 1) {
      pingMonitor(Number(req.params.id)).catch(console.error);
    }

    res.json({ success: true, is_active: newActive, status: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST trigger immediate ping
monitorsRouter.post('/:id/check', async (req, res) => {
  try {
    const result = await pingMonitor(Number(req.params.id));
    if (!result) return res.status(404).json({ error: 'Monitor not found' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
