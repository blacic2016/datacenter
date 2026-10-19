import React from 'react';
import { X, Home, FolderKanban, Eye, History, FileSpreadsheet, Users, Database, Settings } from 'lucide-react';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  activeView,
  onNavigate,
}) => {
  const items = [
    { id: 'home', label: 'Inicio (Descripción)', icon: Home, desc: 'Plataforma y pilares normativos' },
    { id: 'projects', label: 'Diseño / Creación', icon: FolderKanban, desc: 'Gestión de proyectos y nuevo Data Center' },
    { id: 'visualization', label: 'Visualización', icon: Eye, desc: 'Planos 2D en baldosas 0.6m y proyección 3D' },
    { id: 'history', label: 'Historial y TIA-942', icon: History, desc: 'Línea de tiempo y gráfico de cumplimiento' },
    { id: 'template', label: 'Plantilla Datacenter', icon: FileSpreadsheet, desc: 'Checklist editable y parámetros IA' },
    { id: 'users', label: 'Usuarios y Roles', icon: Users, desc: 'Control de accesos y permisos RBAC' },
    { id: 'sync', label: 'Sincronización BD', icon: Database, desc: 'SQLite local → PostgreSQL en producción' },
    { id: 'settings', label: 'Configuraciones', icon: Settings, desc: 'Configuración IA (Gemini / Ollama)' },
  ];

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Navegación</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Módulos de la Plataforma Daedalous</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <div
                key={item.id}
                className={`drawer-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                style={{ cursor: 'pointer' }}
              >
                <div style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--color-primary)' : 'var(--surface-hover)',
                  color: isActive ? '#FFFFFF' : 'var(--text)',
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-alt)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Daedalous v0.1.0 · TIA-942-C Engineering Suite
        </div>
      </div>
    </>
  );
};
