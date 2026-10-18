import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../../db/sqlite.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '@daedalous/shared';

export const templatesRouter = Router();

templatesRouter.use(requireAuth);

// 1. Obtener la plantilla activa con sus ítems
templatesRouter.get('/datacenter', (_req, res) => {
  const template = db.get('SELECT * FROM checklist_templates WHERE is_default = 1');
  if (!template) {
    res.status(404).json({ error: 'Plantilla no encontrada' });
    return;
  }

  const items = db.query(
    'SELECT * FROM checklist_template_items WHERE template_id = ? ORDER BY order_index ASC',
    [template.id]
  );

  const params = db.query('SELECT * FROM normative_parameters ORDER BY key ASC');

  res.json({ template, items, normativeParameters: params });
});

// 2. Agregar ítem al checklist de la plantilla
templatesRouter.post('/datacenter/items', requirePermission(PERMISSIONS.TEMPLATE_MANAGE), (req, res) => {
  const { subsystem, itemCode, question, tiaRef, minRated } = req.body ?? {};
  if (!subsystem || !itemCode || !question) {
    res.status(400).json({ error: 'Subsistema, código y pregunta requeridos' });
    return;
  }

  const template = db.get<{ id: string }>('SELECT id FROM checklist_templates WHERE is_default = 1');
  if (!template) {
    res.status(404).json({ error: 'Plantilla por defecto no encontrada' });
    return;
  }

  const id = crypto.randomUUID();
  const maxOrder = db.get<{ m: number }>(
    'SELECT max(order_index) as m FROM checklist_template_items WHERE template_id = ?',
    [template.id]
  )!.m || 0;

  db.run(
    `INSERT INTO checklist_template_items (id, template_id, subsystem, item_code, question, tia_ref, min_rated, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, template.id, subsystem, itemCode, question, tiaRef || '', minRated || 1, maxOrder + 1]
  );

  res.status(201).json({ id, message: 'Ítem agregado a la Plantilla Datacenter' });
});

// 3. Eliminar ítem del checklist
templatesRouter.delete('/datacenter/items/:id', requirePermission(PERMISSIONS.TEMPLATE_MANAGE), (req, res) => {
  db.run('DELETE FROM checklist_template_items WHERE id = ?', [req.params.id]);
  res.json({ message: 'Ítem eliminado' });
});
