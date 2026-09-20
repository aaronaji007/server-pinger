import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './database.js';
import { startScheduler } from './services/scheduler.js';
import { monitorsRouter } from './routes/monitors.js';
import { notificationsRouter } from './routes/notifications.js';
import { incidentsRouter } from './routes/incidents.js';
import { statsRouter } from './routes/stats.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDatabase();

// API routes
app.use('/api/monitors', monitorsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/stats', statsRouter);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend static build if available
const possibleDistPaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../client/dist')
];

let clientDist = possibleDistPaths.find(p => fs.existsSync(p));
if (clientDist) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist!, 'index.html'));
  });
}

// Start HTTP server & background ping scheduler
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`  🚀 PulseGuard Server running on port ${PORT}`);
  console.log(`  🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`  📡 API:       http://localhost:${PORT}/api/monitors`);
  console.log(`=============================================`);

  // Start background monitoring scheduler (checks every 5s for due monitors)
  startScheduler(5000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    process.exit(0);
  });
});
