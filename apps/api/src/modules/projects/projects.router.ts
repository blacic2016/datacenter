import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../../db/sqlite.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { generalDataSchema, PERMISSIONS } from '@daedalous/shared';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

// Helper para generar código secuencial de cliente y proyecto
function getOrCreateClient(clientName: string, manager: string, address: string, phone: string, email: string): { id: string; code: string } {
  const existing = db.get<{ id: string; code: string }>(
    'SELECT id, code FROM clients WHERE lower(name) = lower(?)',
    [clientName.trim()]
  );
  if (existing) return existing;

  const count = db.get<{ c: number }>('SELECT count(*) as c FROM clients')!.c;
  const clientCode = `CLI-${String(count + 1).padStart(4, '0')}`;
  const id = crypto.randomUUID();

  db.run(
    'INSERT INTO clients (id, code, name, contact, address, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, clientCode, clientName.trim(), manager.trim(), address.trim(), phone.trim(), email.trim()]
  );

  return { id, code: clientCode };
}

function generateProjectCode(clientCode: string): string {
  const year = new Date().getFullYear();
  const count = db.get<{ c: number }>(
    "SELECT count(*) as c FROM projects WHERE code LIKE ?",
    [`DAE-${clientCode}-${year}-%`]
  )!.c;
  return `DAE-${clientCode}-${year}-${String(count + 1).padStart(4, '0')}`;
}

// 1. Listar proyectos
projectsRouter.get('/', (req, res) => {
  const projects = db.query(
    `SELECT p.id, p.code, p.general_data, p.rated_target, p.status, p.created_at, p.updated_at,
            c.code as client_code, c.name as client_name,
            (SELECT max(version_no) FROM project_versions WHERE project_id = p.id) as current_version
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     WHERE p.deleted_at IS NULL
     ORDER BY p.updated_at DESC`
  ).map((p) => {
    let generalData = {};
    try { generalData = JSON.parse(p.general_data); } catch {}
    return {
      id: p.id,
      code: p.code,
      name: (generalData as any).projectName || p.code,
      clientCode: p.client_code,
      clientName: p.client_name,
      ratedTarget: p.rated_target,
      status: p.status,
      currentVersion: p.current_version || 1,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      generalData,
    };
  });

  res.json({ projects });
});

// 2. Crear nuevo proyecto (Paso 0 inmutable)
projectsRouter.post('/', requirePermission(PERMISSIONS.PROJECT_CREATE), (req, res) => {
  const parseResult = generalDataSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Datos de Paso 0 inválidos', details: parseResult.error.format() });
    return;
  }

  const d = parseResult.data;

  db.transaction(() => {
    const client = getOrCreateClient(d.clientName, d.clientManager, d.address, d.phone, d.email);
    const projectCode = generateProjectCode(client.code);
    const projectId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    // Guardar proyecto con general_data inmutable
    db.run(
      `INSERT INTO projects (id, code, client_id, general_data, rated_target, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [projectId, projectCode, client.id, JSON.stringify(d), d.ratedTarget, req.user!.id]
    );

    // Crear primera versión (v1)
    db.run(
      `INSERT INTO project_versions (id, project_id, version_no, label, note, created_by)
       VALUES (?, ?, 1, 'borrador', 'Creación inicial del proyecto', ?)`,
      [versionId, projectId, req.user!.id]
    );

    // Inicializar paso 0
    db.run(
      `INSERT INTO step_data (id, version_id, step_key, data, status, compliance_score)
       VALUES (?, ?, 'step-00', ?, 'validated', 100)`,
      [crypto.randomUUID(), versionId, JSON.stringify(d)]
    );

    db.run(
      'INSERT INTO audit_log (id, user_id, action, entity, entity_id, diff) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), req.user!.id, 'CREATE_PROJECT', 'project', projectId, JSON.stringify({ code: projectCode })]
    );

    res.status(201).json({
      id: projectId,
      code: projectCode,
      versionId,
      message: 'Proyecto creado exitosamente con Paso 0 inmutable.',
    });
  });
});

// 3. Detalle de proyecto y sus pasos en la versión activa
projectsRouter.get('/:id', (req, res) => {
  const p = db.get(
    `SELECT p.*, c.code as client_code, c.name as client_name
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     WHERE p.id = ? AND p.deleted_at IS NULL`,
    [req.params.id]
  );

  if (!p) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }

  const version = db.get(
    `SELECT * FROM project_versions WHERE project_id = ? ORDER BY version_no DESC LIMIT 1`,
    [p.id]
  );

  const steps = db.query(
    `SELECT step_key, data, status, compliance_score, updated_at
     FROM step_data WHERE version_id = ?`,
    [version ? version.id : '']
  ).reduce((acc: Record<string, any>, row) => {
    try { acc[row.step_key] = { ...row, data: JSON.parse(row.data) }; }
    catch { acc[row.step_key] = row; }
    return acc;
  }, {});

  const versions = db.query(
    `SELECT id, version_no, label, note, created_at FROM project_versions WHERE project_id = ? ORDER BY version_no DESC`,
    [p.id]
  );

  res.json({
    project: {
      ...p,
      generalData: JSON.parse(p.general_data),
      activeVersion: version,
      versions,
      steps,
    },
  });
});

// 4. Copiar proyecto
projectsRouter.post('/:id/copy', requirePermission(PERMISSIONS.PROJECT_COPY), (req, res) => {
  const source = db.get('SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
  if (!source) {
    res.status(404).json({ error: 'Proyecto origen no encontrado' });
    return;
  }

  db.transaction(() => {
    const client = db.get('SELECT code FROM clients WHERE id = ?', [source.client_id])!;
    const newCode = generateProjectCode(client.code);
    const newProjectId = crypto.randomUUID();
    const newVersionId = crypto.randomUUID();

    const genData = JSON.parse(source.general_data);
    genData.projectName = `${genData.projectName} (Copia)`;

    db.run(
      `INSERT INTO projects (id, code, client_id, general_data, rated_target, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [newProjectId, newCode, source.client_id, JSON.stringify(genData), source.rated_target, req.user!.id]
    );

    db.run(
      `INSERT INTO project_versions (id, project_id, version_no, label, note, created_by)
       VALUES (?, ?, 1, 'borrador', ?, ?)`,
      [newVersionId, newProjectId, `Copiado desde ${source.code}`, req.user!.id]
    );

    // Copiar datos de pasos de la última versión
    const lastVersion = db.get(
      'SELECT id FROM project_versions WHERE project_id = ? ORDER BY version_no DESC LIMIT 1',
      [source.id]
    );

    if (lastVersion) {
      const steps = db.query('SELECT step_key, data FROM step_data WHERE version_id = ?', [lastVersion.id]);
      for (const st of steps) {
        db.run(
          `INSERT INTO step_data (id, version_id, step_key, data, status) VALUES (?, ?, ?, ?, 'pending')`,
          [crypto.randomUUID(), newVersionId, st.step_key, st.data]
        );
      }
    }

    res.json({ id: newProjectId, code: newCode, message: 'Proyecto copiado exitosamente' });
  });
});

// 5. Deshabilitar / Habilitar proyecto
projectsRouter.patch('/:id/status', requirePermission(PERMISSIONS.PROJECT_DISABLE), (req, res) => {
  const { status } = req.body;
  if (status !== 'active' && status !== 'disabled') {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }
  db.run("UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, req.params.id]);
  res.json({ message: `Proyecto ${status === 'active' ? 'habilitado' : 'deshabilitado'}` });
});

// 6. Eliminar (soft delete)
projectsRouter.delete('/:id', requirePermission(PERMISSIONS.PROJECT_DELETE), (req, res) => {
  db.run("UPDATE projects SET deleted_at = datetime('now') WHERE id = ?", [req.params.id]);
  res.json({ message: 'Proyecto eliminado lógicamente' });
});
