import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Lock } from 'lucide-react';
import { api } from '../api/client';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario nuevo usuario
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      if (data.roles?.length > 0 && !newUser.roleId) {
        setNewUser((prev) => ({ ...prev, roleId: data.roles[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setNewUser({ fullName: '', email: '', password: '', roleId: roles[0]?.id || '' });
      fetchData();
      alert('Usuario creado exitosamente.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
          Gestión de Usuarios, Roles y Permisos (RBAC)
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Control de acceso a la plataforma con roles especializados: Arquitecto, Revisor TIA, Ingeniero, Preventa y Administrador.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Tabla de Usuarios Registrados */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Usuarios Registrados</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px' }}>Nombre</th>
                  <th style={{ padding: '10px 12px' }}>Correo</th>
                  <th style={{ padding: '10px 12px' }}>Rol Asignado</th>
                  <th style={{ padding: '10px 12px' }}>Estado</th>
                  <th style={{ padding: '10px 12px' }}>Último Acceso</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>{u.full_name}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="badge badge-info">
                        {u.roles?.[0]?.name || 'Sin rol'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-subtle)' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Nunca'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulario Nuevo Usuario */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Plus size={18} color="var(--color-primary)" />
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Crear Nuevo Usuario</h4>
          </div>

          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Ej. Ing. Patricia Morales"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="pmorales@empresa.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rol Inicial *</label>
              <select
                className="form-select"
                value={newUser.roleId}
                onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              <Plus size={16} /> Crear Usuario
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
