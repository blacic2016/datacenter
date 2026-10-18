import { Router } from 'express';
import { db } from '../../db/sqlite.js';
import { verifyPassword } from '../../db/seed.js';
import { generateToken, requireAuth } from '../../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' });
    return;
  }

  const user = db.get<{ id: string; email: string; password_hash: string; full_name: string; active: number }>(
    'SELECT * FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );

  if (!user || !user.active) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const valid = verifyPassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  db.run("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);

  const token = generateToken({ id: user.id, email: user.email });

  const roles = db.query<{ name: string }>(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?`,
    [user.id]
  ).map((r) => r.name);

  const permissions = db.query<{ permission_code: string }>(
    `SELECT DISTINCT rp.permission_code FROM role_permissions rp
     JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = ?`,
    [user.id]
  ).map((p) => p.permission_code);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      roles,
      permissions,
    },
  });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
