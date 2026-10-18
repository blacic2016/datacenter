import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../../db/sqlite.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { defaultEngine } from '@daedalous/calc-engine';
import { downstreamOf, PERMISSIONS } from '@daedalous/shared';

export const stepsRouter = Router();

stepsRouter.use(requireAuth);

// 1. Evaluación reactiva en caliente para el Pop-up en vivo
stepsRouter.post('/eval', (req, res) => {
  const { projectData, customParams } = req.body ?? {};
  const output = defaultEngine.run(projectData || {}, customParams || {});
  res.json(output);
});

// 2. Guardar datos de un paso específico en una versión de proyecto
stepsRouter.put('/:versionId/:stepKey', requirePermission(PERMISSIONS.STEP_EDIT), (req, res) => {
  const { versionId, stepKey } = req.params;
  const { data, note } = req.body ?? {};

  // Paso 0 no se puede modificar si el proyecto ya fue creado
  if (stepKey === 'step-00') {
    const existing = db.get('SELECT id FROM step_data WHERE version_id = ? AND step_key = "step-00"', [versionId]);
    if (existing) {
      res.status(403).json({ error: 'Los datos primarios del Paso 0 son inmutables por diseño.' });
      return;
    }
  }

  db.transaction(() => {
    // 1. Guardar o actualizar datos del paso
    const existingStep = db.get<{ id: string }>('SELECT id FROM step_data WHERE version_id = ? AND step_key = ?', [versionId, stepKey]);
    const stepId = existingStep ? existingStep.id : crypto.randomUUID();

    if (existingStep) {
      db.run(
        `UPDATE step_data SET data = ?, status = 'in_progress', updated_at = datetime('now') WHERE id = ?`,
        [JSON.stringify(data || {}), stepId]
      );
    } else {
      db.run(
        `INSERT INTO step_data (id, version_id, step_key, data, status) VALUES (?, ?, ?, ?, 'in_progress')`,
        [stepId, versionId, stepKey, JSON.stringify(data || {})]
      );
    }

    // 2. Marcar dependientes aguas abajo como 'needs_review'
    const downstream = downstreamOf(stepKey);
    for (const dsKey of downstream) {
      db.run(
        `UPDATE step_data SET status = 'needs_review', updated_at = datetime('now')
         WHERE version_id = ? AND step_key = ? AND status != 'pending'`,
        [versionId, dsKey]
      );
    }

    // 3. Recopilar todos los pasos de la versión para el cálculo completo
    const allSteps = db.query<{ step_key: string; data: string }>(
      'SELECT step_key, data FROM step_data WHERE version_id = ?',
      [versionId]
    ).reduce((acc: Record<string, any>, row) => {
      try { acc[row.step_key] = JSON.parse(row.data); } catch {}
      return acc;
    }, {});

    const engineOut = defaultEngine.run(allSteps);

    // 4. Actualizar diagnósticos en base de datos para esta versión
    db.run('DELETE FROM diagnostics WHERE version_id = ?', [versionId]);
    for (const d of engineOut.diagnostics) {
      db.run(
        `INSERT INTO diagnostics (id, version_id, step_key, rule_id, severity, message, ref)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), versionId, d.stepKey, d.ruleId, d.severity, d.message, d.ref]
      );
    }

    // 5. Actualizar compliance score para cada paso
    for (const [sKey, score] of Object.entries(engineOut.compliance)) {
      if (score !== null) {
        db.run(
          `UPDATE step_data SET compliance_score = ? WHERE version_id = ? AND step_key = ?`,
          [score, versionId, sKey]
        );
      }
    }

    // 6. Actualizar fecha de proyecto
    db.run(
      `UPDATE projects SET updated_at = datetime('now')
       WHERE id = (SELECT project_id FROM project_versions WHERE id = ?)`,
      [versionId]
    );

    res.json({
      message: 'Paso guardado exitosamente',
      stepKey,
      complianceScore: engineOut.compliance[stepKey] ?? 100,
      downstreamMarked: downstream,
      diagnostics: engineOut.diagnostics.filter((d) => d.stepKey === stepKey),
      fullEngineOutput: engineOut,
    });
  });
});

// 3. Validar paso
stepsRouter.post('/:versionId/:stepKey/validate', requirePermission(PERMISSIONS.STEP_VALIDATE), (req, res) => {
  const { versionId, stepKey } = req.params;

  // Verificar si hay errores bloqueantes para este paso
  const blocking = db.query(
    `SELECT * FROM diagnostics WHERE version_id = ? AND step_key = ? AND severity IN ('error', 'blocking')`,
    [versionId, stepKey]
  );

  if (blocking.length > 0) {
    res.status(400).json({
      error: 'No se puede validar el paso: contiene errores o bloqueos normativos no resueltos.',
      diagnostics: blocking,
    });
    return;
  }

  db.run(
    `UPDATE step_data SET status = 'validated', reviewer_id = ?, validated_at = datetime('now')
     WHERE version_id = ? AND step_key = ?`,
    [req.user!.id, versionId, stepKey]
  );

  res.json({ message: 'Paso validado exitosamente.' });
});
