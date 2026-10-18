import React from 'react';
import { Menu, Sun, Moon, Database, Shield } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenDrawer: () => void;
  user: any;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenDrawer,
  user,
  onNavigate,
}) => {
  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => onNavigate('home')}>
        <div style={{
          background: 'var(--color-primary)',
          color: '#FFFFFF',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '18px',
          letterSpacing: '1px',
        }}>
          D
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px', color: 'var(--text)' }}>
              Daedalous
            </span>
            <span className="badge badge-info" style={{ fontSize: '10px' }}>
              TIA-942-C
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Diseño, Ingeniería y Supervisión de Data Centers
          </p>
        </div>
      </div>

      {/* Controles de la cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Indicador de BD SQLite sincronizada */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('sync')}
          title="Base de datos local SQLite sincronizada con PostgreSQL"
        >
          <Database size={14} color="var(--color-success)" />
          <span style={{ fontSize: '12px', fontWeight: '500' }}>SQLite / PG</span>
        </button>

        {/* Switch Tema Claro / Oscuro */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          style={{ width: '34px', height: '34px', padding: 0 }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Info de usuario logueado */}
        {user && (
          <div
            onClick={() => onNavigate('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <Shield size={14} color="var(--color-primary)" />
            <span style={{ fontWeight: '600' }}>{user.fullName || user.email}</span>
            <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 4px' }}>
              {user.roles?.[0] || 'Admin'}
            </span>
          </div>
        )}

        {/* Botón de Menú desplegable a la derecha */}
        <button
          className="btn btn-primary"
          onClick={onOpenDrawer}
          style={{ padding: '8px 14px' }}
          id="btn-main-menu"
        >
          <Menu size={18} />
          <span>Menú</span>
        </button>
      </div>
    </header>
  );
};
