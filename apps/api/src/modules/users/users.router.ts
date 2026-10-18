import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../../db/sqlite.js';
import { hashPassword } from '../../db/seed.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '@daedalous/shared';

export const usersRouter = Router();

usersRouter.use(requireAuth);

// 1. Listar usuarios
usersRouter.get('/', (req, res) => {
  const users = db.query(
    `SELECT u.id, u.email, u.full_name, u.active, u.created_at, u.last_login
     FROM users u ORDER BY u.created_at ASC`
  ).map((u) => {
    const roles = db.query<{ id: string; name: string }>(
      `SELECT r.id, r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [u.id]
    );
    return { ...u, roles };
  });

  const roles = db.query('SELECT * FROM roles ORDER BY name ASC');
  const permissions = db.query('SELECT * FROM permissions ORDER BY code ASC');

  res.json({ users, roles, permissions });
});

// 2. Crear usuario
usersRouter.post('/', requirePermission(PERMISSIONS.USER_MANAGE), (req, res) => {
  const { email, password, fullName, roleId } = req.body ?? {};
  if (!email || !password || !fullName) {
    res.status(400).json({ error: 'Email, contraseña y nombre completo requeridos' });
    return;
  }

  const existing = db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) {
    res.status(400).json({ error: 'Ya existe un usuario con este correo' });
    return;
  }

  const userId = crypto.randomUUID();
  const pwdHash = hashPassword(password);

  db.transaction(() => {
    db.run(
      'INSERT INTO users (id, email, password_hash, full_name, active) VALUES (?, ?, ?, ?, 1)',
      [userId, email.trim().toLowerCase(), pwdHash, fullName.trim()]
    );

    if (roleId) {
      db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
    }
  });

  res.status(201).json({ id: userId, message: 'Usuario creado exitosamente' });
});

// 3. Asignar rol a usuario
usersRouter.put('/:id/roles', requirePermission(PERMISSIONS.ROLE_MANAGE), (req, res) => {
  const { roleIds } = req.body ?? {};
  if (!Array.isArray(roleIds)) {
    res.status(400).json({ error: 'roleIds debe ser un array de identificadores' });
    return;
  }

  db.transaction(() => {
    db.run('DELETE FROM user_roles WHERE user_id = ?', [req.params.id]);
    for (const rid of roleIds) {
      db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [req.params.id, rid]);
    }
  });

  res.json({ message: 'Roles actualizados' });
});
