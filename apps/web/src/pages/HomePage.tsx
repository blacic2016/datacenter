import React from 'react';
import { Layers, ArrowRight, ShieldCheck, Zap, Activity, Cpu, Eye, FileText } from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string) => void;
  onOpenWizard: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenWizard }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Section */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)',
        padding: '40px',
        borderLeft: '6px solid var(--color-primary)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <span className="badge badge-info">Norma Internacional</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>ANSI/TIA-942-C (Rated 1 a 4)</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '12px', color: 'var(--text)' }}>
          Daedalous · Plataforma de Diseño e Ingeniería de Data Centers
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '850px', lineHeight: 1.6, marginBottom: '24px' }}>
          Plataforma modular e inteligente para el diseño de centros de datos de alta disponibilidad.
          Estructure sus proyectos a través de un asistente guiado de 17 fases interconectadas con motor reactivo de límites normativos,
          proyecciones de crecimiento al +25% y +50%, levantamiento asistido por IA, y sincronización de planos 2D y 3D.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onOpenWizard} style={{ padding: '10px 20px', fontSize: '15px' }}>
            <Zap size={18} />
            <span>Crear Nuevo Data Center</span>
            <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('projects')} style={{ padding: '10px 20px', fontSize: '15px' }}>
            <Layers size={18} />
            <span>Ver Proyectos Existentes</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('visualization')} style={{ padding: '10px 20px', fontSize: '15px' }}>
            <Eye size={18} />
            <span>Entorno 2D / 3D</span>
          </button>
        </div>
      </div>

      {/* Los Dos Pilares Clave */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Los Dos Pilares Fundamentales</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="card">
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(62, 92, 118, 0.15)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>1. Creación Asistida y Modular</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
              Asistente de 17 fases rigurosas (desde datos primarios inmutables, obra civil y levantamiento con checklist IA,
              hasta cargas eléctricas, climatización N+1, canalizaciones, UPS, extinción y monitoreo Zabbix).
              Cada fase se supervisa de manera semi-independiente con guardado parcial continuo.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
                 onClick={() => onNavigate('projects')}>
              Explorar asistente <ArrowRight size={14} />
            </div>
          </div>

          <div className="card">
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(94, 140, 106, 0.15)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Eye size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>2. Visualización e Historial Reactivo</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
              Pop-up en vivo que recalcula al instante el impacto de cada cambio (si agrega un rack, se recalcula la energía,
              BTU, espacio y calibres). Sincronización automática del plano 2D en baldosas de 0.6m con la vista 3D e historial
              con gráfico lineal superior de cumplimiento TIA-942.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-success)', fontWeight: '600', cursor: 'pointer' }}
                 onClick={() => onNavigate('visualization')}>
              Ver entorno interactivo <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Características Técnicas */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Capacidades de Ingeniería Integradas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={18} color="var(--color-primary)" />
              <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Inmutabilidad del Paso 0</h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              El código único por cliente y proyecto (`DAE-CLI0001-2026-0001`) y datos primarios quedan sellados e inalterables tras la creación.
            </p>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Activity size={18} color="var(--color-warning)" />
              <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Escenarios +25% y +50%</h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Comparativa de kW, BTU/h, unidades de clima y espacio para anticipar si la infraestructura soportará el crecimiento.
            </p>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={18} color="var(--color-success)" />
              <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Checklist IA & Plantilla</h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Plantilla Datacenter con formulario de levantamiento configurable y explicaciones fundamentadas de la norma TIA-942.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
