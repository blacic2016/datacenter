import React, { useState, useEffect } from 'react';
import { Plus, Search, Copy, Trash2, Power, ArrowRight, History, Shield, Calendar, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

interface ProjectsPageProps {
  onOpenWizard: (projectId?: string) => void;
  onOpenHistory: (projectId: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onOpenWizard, onOpenHistory }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data.projects || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error cargando proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCopy = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.copyProject(id);
      fetchProjects();
    } catch (err: any) {
      alert(`Error al copiar: ${err.message}`);
    }
  };

  const handleToggleStatus = async (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = p.status === 'active' ? 'disabled' : 'active';
    try {
      await api.setProjectStatus(p.id, newStatus);
      fetchProjects();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Confirma que desea eliminar este proyecto? La acción se registrará en auditoría.')) return;
    try {
      await api.deleteProject(id);
      fetchProjects();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Cabecera de Diseño / Creación */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
            Diseño / Creación de Data Centers
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Proyectos registrados. Cree, modifique, copie o supervise el cumplimiento normativo.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchProjects} title="Actualizar">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => onOpenWizard()} id="btn-create-project">
            <Plus size={18} />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Buscar por nombre, código de proyecto o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'active', 'disabled'] as const).map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'all' ? 'Todos' : st === 'active' ? 'Activos' : 'Deshabilitados'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Proyectos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Cargando proyectos desde SQLite...
        </div>
      ) : error ? (
        <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            No se encontraron proyectos. ¡Comience creando su primer Data Center!
          </p>
          <button className="btn btn-primary" onClick={() => onOpenWizard()}>
            <Plus size={16} /> Crear Data Center Inicial
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filtered.map((p) => {
            const isDisabled = p.status === 'disabled';
            return (
              <div
                key={p.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  opacity: isDisabled ? 0.65 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onClick={() => onOpenWizard(p.id)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-info font-mono" style={{ fontSize: '10px' }}>
                      {p.code}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="badge badge-info">Rated {p.ratedTarget}</span>
                      <span className={`badge ${isDisabled ? 'badge-warning' : 'badge-success'}`}>
                        {isDisabled ? 'Deshabilitado' : 'Activo'}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Cliente: <strong>{p.clientName}</strong> ({p.clientCode})
                  </p>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={12} /> Versión {p.currentVersion || 1}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Acciones de Tarjeta */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '12px',
                  marginTop: '12px',
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="Copiar proyecto"
                      onClick={(e) => handleCopy(p.id, e)}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      title={isDisabled ? 'Habilitar proyecto' : 'Deshabilitar proyecto'}
                      onClick={(e) => handleToggleStatus(p, e)}
                    >
                      <Power size={14} color={isDisabled ? 'var(--color-success)' : 'var(--color-warning)'} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="Ver Historial y Cumplimiento TIA-942"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenHistory(p.id);
                      }}
                    >
                      <History size={14} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="Eliminar proyecto"
                      onClick={(e) => handleDelete(p.id, e)}
                    >
                      <Trash2 size={14} color="var(--color-danger)" />
                    </button>
                  </div>

                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Abrir Asistente <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
