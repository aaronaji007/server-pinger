import { Router } from 'express';
import { db } from '../database.js';

export const incidentsRouter = Router();

// GET recent incidents across all monitors
incidentsRouter.get('/', (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const incidents = db.prepare(`
      SELECT 
        i.id,
        i.monitor_id,
        i.cause,
        i.started_at,
        i.resolved_at,
        i.duration_seconds,
        m.name as monitor_name,
        m.target as monitor_target,
        m.type as monitor_type
      FROM incidents i
      LEFT JOIN monitors m ON i.monitor_id = m.id
      ORDER BY i.id DESC
      LIMIT ?
    `).all(limit);

    res.json(incidents);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
