import pg from 'pg';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { db } from './sqlite.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);

export interface SyncReport {
  success: boolean;
  timestamp: string;
  tablesSynced: Record<string, number>;
  totalRecords: number;
  message: string;
}

const TABLES = [
  'permissions',
  'roles',
  'users',
  'user_roles',
  'role_permissions',
  'clients',
  'projects',
  'project_versions',
  'step_data',
  'diagnostics',
  'normative_parameters',
  'checklist_templates',
  'checklist_template_items',
  'audit_log',
];

export async function syncSqliteToPostgres(targetUrl?: string): Promise<SyncReport> {
  const url = targetUrl || process.env.POSTGRES_URL || 'postgres://daedalous:daedalous@localhost:5432/daedalous';
  const timestamp = new Date().toISOString();
  const tablesSynced: Record<string, number> = {};
  let totalRecords = 0;

  console.log(`🔌 Iniciando sincronización SQLite -> PostgreSQL (${url})...`);

  const client = new pg.Client({ connectionString: url });

  try {
    await client.connect();

    // 1. Asegurar esquema en PostgreSQL
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        system INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_code)
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        client_id TEXT NOT NULL REFERENCES clients(id),
        general_data JSONB NOT NULL,
        rated_target INTEGER NOT NULL DEFAULT 2,
        status TEXT NOT NULL DEFAULT 'active',
        deleted_at TIMESTAMPTZ,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS project_versions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        version_no INTEGER NOT NULL,
        parent_version_id TEXT REFERENCES project_versions(id),
        label TEXT NOT NULL DEFAULT 'borrador',
        note TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(project_id, version_no)
      );

      CREATE TABLE IF NOT EXISTS step_data (
        id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
        step_key TEXT NOT NULL,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'pending',
        compliance_score INTEGER,
        reviewer_id TEXT REFERENCES users(id),
        validated_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(version_id, step_key)
      );

      CREATE TABLE IF NOT EXISTS diagnostics (
        id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
        step_key TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        ref TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS normative_parameters (
        key TEXT PRIMARY KEY,
        value REAL NOT NULL,
        unit TEXT,
        rated_level INTEGER,
        source TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checklist_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_default INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checklist_template_items (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
        subsystem TEXT NOT NULL,
        item_code TEXT NOT NULL,
        question TEXT NOT NULL,
        tia_ref TEXT,
        min_rated INTEGER NOT NULL DEFAULT 1,
        order_index INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        diff JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Sincronizar tabla por tabla
    await client.query('BEGIN;');

    for (const table of TABLES) {
      const rows = db.query<Record<string, any>>(`SELECT * FROM ${table}`);
      tablesSynced[table] = rows.length;
      totalRecords += rows.length;

      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]!);
      const colList = cols.map((c) => `"${c}"`).join(', ');

      for (const row of rows) {
        const values: any[] = [];
        const placeholders: string[] = [];

        cols.forEach((col, idx) => {
          placeholders.push(`$${idx + 1}`);
          let val = row[col];
          // Tratar JSON para PostgreSQL
          if ((col === 'general_data' || col === 'data' || col === 'diff') && typeof val === 'string') {
            try {
              val = JSON.parse(val);
            } catch {
              // Dejar tal cual
            }
          }
          values.push(val);
        });

        // Upsert genérico para mantener copia fiel
        const primaryCols = table === 'user_roles' ? ['user_id', 'role_id']
          : table === 'role_permissions' ? ['role_id', 'permission_code']
          : table === 'normative_parameters' ? ['key']
          : ['id'];

        const updateAssignments = cols
          .filter((c) => !primaryCols.includes(c))
          .map((c) => `"${c}" = EXCLUDED."${c}"`)
          .join(', ');

        const conflictClause = updateAssignments.length > 0
          ? `ON CONFLICT (${primaryCols.map((c) => `"${c}"`).join(', ')}) DO UPDATE SET ${updateAssignments}`
          : `ON CONFLICT (${primaryCols.map((c) => `"${c}"`).join(', ')}) DO NOTHING`;

        const insertSql = `
          INSERT INTO ${table} (${colList})
          VALUES (${placeholders.join(', ')})
          ${conflictClause}
        `;

        await client.query(insertSql, values);
      }
    }

    await client.query('COMMIT;');
    await client.end();

    // Guardar estado de sincronización en SQLite
    db.run(
      `INSERT INTO sync_state (id, last_synced_at, target_url, status, records_synced, details)
       VALUES (1, ?, ?, 'success', ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         last_synced_at = excluded.last_synced_at,
         target_url = excluded.target_url,
         status = excluded.status,
         records_synced = excluded.records_synced,
         details = excluded.details;`,
      [timestamp, url, totalRecords, JSON.stringify(tablesSynced)]
    );

    const report: SyncReport = {
      success: true,
      timestamp,
      tablesSynced,
      totalRecords,
      message: `Copia fiel sincronizada exitosamente en PostgreSQL (${totalRecords} registros).`,
    };
    console.log(`✅ ${report.message}`);
    return report;
  } catch (err: any) {
    console.warn(`⚠️ Aviso de sincronización con PostgreSQL: ${err.message}`);
    db.run(
      `INSERT INTO sync_state (id, last_synced_at, target_url, status, records_synced, details)
       VALUES (1, ?, ?, 'failed', ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         last_synced_at = excluded.last_synced_at,
         target_url = excluded.target_url,
         status = excluded.status,
         details = excluded.details;`,
      [timestamp, url, 0, err.message]
    );

    return {
      success: false,
      timestamp,
      tablesSynced,
      totalRecords: 0,
      message: `No se pudo conectar al servidor PostgreSQL (${err.message}). La base de datos SQLite sigue funcionando localmente como fuente de verdad.`,
    };
  }
}

if (process.argv[1] === __filename) {
  syncSqliteToPostgres().then((r) => {
    if (!r.success) {
      console.log('ℹ️ Para sincronizar con Postgres en producción, inicie PostgreSQL o defina POSTGRES_URL.');
    }
  });
}
