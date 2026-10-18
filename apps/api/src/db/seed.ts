import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from './sqlite.js';
import { runMigrations } from './migrate.js';
import { DEFAULT_ROLES, PERMISSIONS, PERMISSION_DESCRIPTIONS } from '@daedalous/shared';
import { DEFAULT_PARAMS } from '@daedalous/calc-engine';

const __filename = fileURLToPath(import.meta.url);

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combined: string): boolean {
  const [salt, originalHash] = combined.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

export function runSeeds(): void {
  console.log('🌱 Sembrando datos iniciales en SQLite...');
  runMigrations();

  db.transaction(() => {
    // 1. Permisos
    for (const [code, desc] of Object.entries(PERMISSION_DESCRIPTIONS)) {
      db.run(
        `INSERT INTO permissions (id, code, description) VALUES (?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET description = excluded.description;`,
        [crypto.randomUUID(), code, desc]
      );
    }

    // 2. Roles y permisos de rol
    for (const r of DEFAULT_ROLES) {
      const existing = db.get<{ id: string }>('SELECT id FROM roles WHERE name = ?', [r.name]);
      const roleId = existing ? existing.id : crypto.randomUUID();
      if (!existing) {
        db.run('INSERT INTO roles (id, name, description, system) VALUES (?, ?, ?, 1)', [
          roleId,
          r.name,
          r.description,
        ]);
      }
      for (const perm of r.permissions) {
        db.run(
          `INSERT OR IGNORE INTO role_permissions (role_id, permission_code) VALUES (?, ?)`,
          [roleId, perm]
        );
      }
    }

    // 3. Usuario Administrador por defecto
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@daedalous.local';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin123*';
    const adminUser = db.get<{ id: string }>('SELECT id FROM users WHERE email = ?', [adminEmail]);

    if (!adminUser) {
      const adminId = crypto.randomUUID();
      const pwdHash = hashPassword(adminPass);
      db.run(
        `INSERT INTO users (id, email, password_hash, full_name, active) VALUES (?, ?, ?, ?, 1)`,
        [adminId, adminEmail, pwdHash, 'Administrador del Sistema']
      );

      const adminRole = db.get<{ id: string }>('SELECT id FROM roles WHERE name = ?', ['Administrador']);
      if (adminRole) {
        db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [adminId, adminRole.id]);
      }
      console.log(`👤 Usuario Admin creado: ${adminEmail} (clave: ${adminPass})`);
    }

    // 4. Parámetros normativos
    for (const [key, value] of Object.entries(DEFAULT_PARAMS)) {
      if (typeof value === 'number') {
        db.run(
          `INSERT INTO normative_parameters (key, value, unit, source) VALUES (?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
          [key, value, '', 'ANSI/TIA-942-C / ASHRAE TC 9.9']
        );
      }
    }

    // 5. Plantilla Datacenter TIA-942
    const defaultTpl = db.get<{ id: string }>('SELECT id FROM checklist_templates WHERE is_default = 1');
    if (!defaultTpl) {
      const tplId = crypto.randomUUID();
      db.run(
        'INSERT INTO checklist_templates (id, name, description, is_default) VALUES (?, ?, ?, 1)',
        [tplId, 'Plantilla Datacenter TIA-942-C Estándar', 'Checklist maestro de levantamiento y verificación por subsistema']
      );

      const items = [
        { sub: 'Arquitectura', code: 'ARQ-01', q: '¿La sala de cómputo cuenta con piso técnico elevado de altura mínima recomendada (30 cm si h > 3 m)?', ref: 'TIA-942-C §Arquitectura', rated: 1 },
        { sub: 'Arquitectura', code: 'ARQ-02', q: '¿Paredes y cielo falso cuentan con pintura antiestática y sellado contra polvo?', ref: 'TIA-942-C §Arquitectura', rated: 1 },
        { sub: 'Arquitectura', code: 'ARQ-03', q: '¿Las puertas de acceso cumplen el gálibo mínimo (1.00 m ancho x 2.13 m alto)?', ref: 'TIA-942-C §Accesos', rated: 2 },
        { sub: 'Eléctrico', code: 'ELE-01', q: '¿Se dispone de alimentación redundante independiente A/B para cada rack?', ref: 'TIA-942-C §Eléctrico', rated: 3 },
        { sub: 'Eléctrico', code: 'ELE-02', q: '¿El sistema UPS cuenta con topología Online Doble Conversión y bypass de mantenimiento?', ref: 'TIA-942-C §UPS', rated: 2 },
        { sub: 'Eléctrico', code: 'ELE-03', q: '¿La puesta a tierra de telecomunicaciones dispone de barra TMGB conectada a electrodo principal?', ref: 'TIA-607 / TIA-942-C', rated: 1 },
        { sub: 'Mecánico', code: 'MEC-01', q: '¿El sistema de climatización cuenta con redundancia mínima N+1 para la carga térmica total?', ref: 'TIA-942-C / ASHRAE', rated: 2 },
        { sub: 'Mecánico', code: 'MEC-02', q: '¿Existen bandejas recolectoras de condensado bajo equipos de aire con drenaje independiente?', ref: 'TIA-942-C §Drenajes', rated: 2 },
        { sub: 'Telecomunicaciones', code: 'TEL-01', q: '¿Se mantiene separación física entre canalizaciones de energía (bajo piso) y datos/fibra (sobre racks)?', ref: 'TIA-942-C §Canalizaciones', rated: 2 },
        { sub: 'Seguridad', code: 'SEG-01', q: '¿Se cuenta con sistema de detección temprana de humo por aspiración (VESDA) y extinción limpia?', ref: 'NFPA 75 / 2001', rated: 3 },
      ];

      for (let i = 0; i < items.length; i++) {
        const it = items[i]!;
        db.run(
          `INSERT INTO checklist_template_items (id, template_id, subsystem, item_code, question, tia_ref, min_rated, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), tplId, it.sub, it.code, it.q, it.ref, it.rated, i + 1]
        );
      }
    }
  });

  console.log('✅ Semilla completada exitosamente.');
}

if (process.argv[1] === __filename) {
  runSeeds();
}
