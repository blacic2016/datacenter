import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/sqlite.js';

const JWT_SECRET = process.env.JWT_SECRET || 'daedalous-secret-key-2026';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  permissions: string[];
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: { id: string; email: string }): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autorización requerido' });
    return;
  }

  const token = authHeader.split(' ')[1]!;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const userRow = db.get<{ id: string; email: string; full_name: string; active: number }>(
      'SELECT id, email, full_name, active FROM users WHERE id = ?',
      [payload.id]
    );

    if (!userRow || !userRow.active) {
      res.status(401).json({ error: 'Usuario no válido o deshabilitado' });
      return;
    }

    // Obtener roles y permisos efectivos
    const roles = db.query<{ name: string }>(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [userRow.id]
    ).map((r) => r.name);

    const permissions = db.query<{ permission_code: string }>(
      `SELECT DISTINCT rp.permission_code FROM role_permissions rp
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`,
      [userRow.id]
    ).map((p) => p.permission_code);

    req.user = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      roles,
      permissions,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requirePermission(permissionCode: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    // Administrador tiene acceso total
    if (req.user.roles.includes('Administrador') || req.user.permissions.includes(permissionCode)) {
      next();
      return;
    }
    res.status(403).json({ error: `Permiso denegado: requiere ${permissionCode}` });
  };
}
