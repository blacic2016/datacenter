import { Router } from 'express';
import { db } from '../../db/sqlite.js';
import { syncSqliteToPostgres } from '../../db/sync-postgres.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '@daedalous/shared';

export const syncRouter = Router();

syncRouter.use(requireAuth);

// 1. Obtener estado de sincronización
syncRouter.get('/status', (_req, res) => {
  const state = db.get('SELECT * FROM sync_state WHERE id = 1');
  res.json({
    syncState: state || {
      status: 'pending',
      last_synced_at: null,
      records_synced: 0,
      details: 'Aún no se ha ejecutado ninguna sincronización con PostgreSQL.',
    },
    localDb: 'sqlite3 (node:sqlite WAL activo)',
  });
});

// 2. Ejecutar sincronización manual hacia PostgreSQL
syncRouter.post('/trigger', requirePermission(PERMISSIONS.SYNC_RUN), async (req, res) => {
  const { targetUrl } = req.body ?? {};
  try {
    const report = await syncSqliteToPostgres(targetUrl);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Error durante la sincronización', message: err.message });
  }
});
