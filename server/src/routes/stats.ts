import { Router } from 'express';
import { db } from '../database.js';

export const statsRouter = Router();

// GET global system health metrics
statsRouter.get('/', (req, res) => {
  try {
    const totalMonitors = (db.prepare('SELECT count(*) as count FROM monitors').get() as any)?.count || 0;
    const upMonitors = (db.prepare("SELECT count(*) as count FROM monitors WHERE status = 'up' AND is_active = 1").get() as any)?.count || 0;
    const downMonitors = (db.prepare("SELECT count(*) as count FROM monitors WHERE status = 'down' AND is_active = 1").get() as any)?.count || 0;
    const pausedMonitors = (db.prepare("SELECT count(*) as count FROM monitors WHERE is_active = 0").get() as any)?.count || 0;
    
    const avgLatency = (db.prepare("SELECT AVG(last_latency_ms) as avg FROM monitors WHERE status = 'up'").get() as any)?.avg || 0;
    const activeIncidents = (db.prepare('SELECT count(*) as count FROM incidents WHERE resolved_at IS NULL').get() as any)?.count || 0;

    res.json({
      totalMonitors,
      upMonitors,
      downMonitors,
      pausedMonitors,
      avgLatencyMs: Math.round(avgLatency),
      activeIncidents
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
