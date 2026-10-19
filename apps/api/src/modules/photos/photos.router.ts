import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../../db/sqlite.js';
import { requireAuth } from '../../middleware/auth.js';

export const photosRouter = Router();

photosRouter.use(requireAuth);

// 1. Obtener fotos de un proyecto (opcionalmente filtradas por área)
photosRouter.get('/projects/:projectId/photos', (req, res) => {
  const { projectId } = req.params;
  const { area } = req.query;

  let query = 'SELECT * FROM project_photos WHERE project_id = ?';
  const params: any[] = [projectId];

  if (area && typeof area === 'string' && area !== 'all') {
    query += ' AND area = ?';
    params.push(area);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.query(query, params).map((r) => {
    let autoTags = {};
    try { autoTags = JSON.parse(r.auto_tags); } catch {}
    return {
      id: r.id,
      projectId: r.project_id,
      area: r.area,
      filename: r.filename,
      url: r.url,
      tag: r.tag,
      autoTags,
      observation: r.observation || '',
      createdAt: r.created_at,
    };
  });

  res.json({ photos: rows });
});

// 2. Registrar nueva foto en un área con tags automáticos
photosRouter.post('/projects/:projectId/photos', (req, res) => {
  const { projectId } = req.params;
  const { area, filename, url, tag, observation } = req.body ?? {};

  if (!area || !url) {
    res.status(400).json({ error: 'Área e imagen requeridas' });
    return;
  }

  // Obtener código de proyecto y cliente para el tag automático
  const proj = db.get(
    `SELECT p.code as project_code, c.name as client_name
     FROM projects p JOIN clients c ON c.id = p.client_id
     WHERE p.id = ?`,
    [projectId]
  );

  const now = new Date();
  const uploadDate = now.toISOString().split('T')[0];

  const autoTags = {
    projectCode: proj?.project_code || 'PROYECTO',
    clientName: proj?.client_name || 'CLIENTE',
    uploadDate,
  };

  const id = crypto.randomUUID();

  db.run(
    `INSERT INTO project_photos (id, project_id, area, filename, url, tag, auto_tags, observation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      projectId,
      area,
      filename || `foto-${Date.now()}.jpg`,
      url,
      tag || 'Sin etiqueta',
      JSON.stringify(autoTags),
      observation || '',
    ]
  );

  res.status(201).json({
    id,
    message: 'Fotografía registrada exitosamente',
    autoTags,
  });
});

// 3. Actualizar etiqueta u observación
photosRouter.patch('/photos/:id', (req, res) => {
  const { tag, observation } = req.body ?? {};
  db.run(
    `UPDATE project_photos SET
       tag = COALESCE(?, tag),
       observation = COALESCE(?, observation)
     WHERE id = ?`,
    [tag, observation, req.params.id]
  );
  res.json({ message: 'Fotografía actualizada' });
});

// 4. Eliminar fotografía
photosRouter.delete('/photos/:id', (req, res) => {
  db.run('DELETE FROM project_photos WHERE id = ?', [req.params.id]);
  res.json({ message: 'Fotografía eliminada' });
});
