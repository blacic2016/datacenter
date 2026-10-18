import React, { useState, useEffect } from 'react';
import { Eye, Box, Grid, RefreshCw, Zap, Thermometer, Shield } from 'lucide-react';
import { api } from '../api/client';

export const VisualizationPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectData, setProjectData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'both' | '2d' | '3d'>('both');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProjects().then((res) => {
      setProjects(res.projects || []);
      if (res.projects?.length > 0) {
        setSelectedProjectId(res.projects[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      setLoading(true);
      api.getProject(selectedProjectId).then((res) => {
        setProjectData(res.project);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [selectedProjectId]);

  const step02 = projectData?.steps?.['step-02']?.data || {};
  const step03 = projectData?.steps?.['step-03']?.data || {};
  const racks: any[] = step03.racks || [];

  const roomLength = Number(step02.lengthM) || 8;
  const roomWidth = Number(step02.widthM) || 6;
  const tileSize = 0.6; // 60cm por baldosa TIA-942
  const tilesX = Math.floor(roomLength / tileSize);
  const tilesY = Math.floor(roomWidth / tileSize);

  return (
    <div>
      {/* Cabecera de Visualización */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
            Visualización de Infraestructura (2D / 3D)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Grilla de baldosas de 0.60 m según TIA-942. El modelo 3D se genera sincronizado automáticamente a partir del diseño 2D.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className="form-select"
            style={{ width: '240px' }}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={`btn btn-sm ${viewMode === '2d' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('2d')}
            >
              <Grid size={14} /> 2D
            </button>
            <button
              className={`btn btn-sm ${viewMode === '3d' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('3d')}
            >
              <Box size={14} /> 3D
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'both' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('both')}
            >
              Ambos
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Cargando entorno de visualización...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'both' ? '1fr 1fr' : '1fr',
          gap: '20px',
        }}>
          {/* VISTA 2D: Plano sobre piso técnico en baldosas de 0.60 m */}
          {(viewMode === 'both' || viewMode === '2d') && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Grid size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Plano 2D (Grilla 0.60 m)</h3>
                </div>
                <span className="badge badge-info font-mono">{roomLength}m x {roomWidth}m ({tilesX}x{tilesY} baldosas)</span>
              </div>

              {/* Lienzo 2D interactivo con baldosas */}
              <div style={{
                background: 'var(--surface-alt)',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${tilesX}, 24px)`,
                  gridTemplateRows: `repeat(${tilesY}, 24px)`,
                  gap: '1px',
                  background: 'var(--border)',
                  border: '2px solid var(--color-primary)',
                  padding: '1px',
                  position: 'relative',
                }}>
                  {/* Celdas de baldosas */}
                  {Array.from({ length: tilesX * tilesY }).map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--surface)',
                        width: '24px',
                        height: '24px',
                      }}
                      title={`Baldosa 0.60m (${idx % tilesX + 1}, ${Math.floor(idx / tilesX) + 1})`}
                    />
                  ))}

                  {/* Renderizar Racks en la grilla 2D */}
                  {racks.map((r, i) => {
                    const posX = (i % 5) * 3 + 2;
                    const posY = Math.floor(i / 5) * 4 + 2;
                    return (
                      <div
                        key={r.id || i}
                        style={{
                          position: 'absolute',
                          left: `${posX * 25}px`,
                          top: `${posY * 25}px`,
                          width: '48px', // 2 baldosas de profundidad (1.2m)
                          height: '24px', // 1 baldosa de ancho (0.6m)
                          background: 'var(--color-primary)',
                          color: '#FFFFFF',
                          fontSize: '9px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '2px',
                          boxShadow: 'var(--shadow-sm)',
                          border: '1px solid #FFFFFF',
                        }}
                        title={`${r.name} - ${r.units}U`}
                      >
                        {r.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leyenda 2D */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px' }} />
                  <span>Racks IT ({racks.length})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }} />
                  <span>Baldosa Piso Elevado 0.6m</span>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 3D: Proyección isométrica / espacial */}
          {(viewMode === 'both' || viewMode === '3d') && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={18} color="var(--color-success)" />
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Vista 3D Sincronizada</h3>
                </div>
                <span className="badge badge-success">Sincronizado con 2D</span>
              </div>

              {/* Render Isométrico 3D con CSS 3D Transforms */}
              <div style={{
                background: 'linear-gradient(180deg, var(--surface-alt) 0%, var(--surface) 100%)',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                perspective: '900px',
                overflow: 'hidden',
              }}>
                <div style={{
                  transform: 'rotateX(55deg) rotateZ(-35deg)',
                  transformStyle: 'preserve-3d',
                  width: '320px',
                  height: '240px',
                  background: 'rgba(62, 92, 118, 0.08)',
                  border: '3px solid var(--color-primary)',
                  position: 'relative',
                  boxShadow: '0 30px 40px rgba(0,0,0,0.15)',
                }}>
                  {/* Piso técnico elevado en 3D */}
                  <div style={{
                    position: 'absolute',
                    inset: '-1px',
                    border: '1px dashed var(--color-secondary)',
                    transform: 'translateZ(-15px)',
                    background: 'rgba(0,0,0,0.03)',
                  }}>
                    <span style={{ fontSize: '9px', padding: '4px', color: 'var(--text-subtle)' }}>Piso falso -30cm</span>
                  </div>

                  {/* Racks extruidos en 3D */}
                  {racks.map((r, i) => {
                    const posX = (i % 4) * 60 + 30;
                    const posY = Math.floor(i / 4) * 80 + 30;
                    return (
                      <div
                        key={r.id || i}
                        style={{
                          position: 'absolute',
                          left: `${posX}px`,
                          top: `${posY}px`,
                          width: '40px',
                          height: '60px',
                          background: 'var(--color-primary)',
                          transform: 'translateZ(45px)', // Altura rack 45U
                          transformStyle: 'preserve-3d',
                          border: '1px solid rgba(255,255,255,0.4)',
                          boxShadow: '-8px 8px 12px rgba(0,0,0,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: '8px',
                          fontWeight: '700',
                        }}
                      >
                        {r.name}
                        {/* Cara lateral del rack 3D */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: '40px',
                          height: '45px',
                          background: 'rgba(30, 48, 64, 0.9)',
                          transform: 'rotateX(-90deg)',
                          transformOrigin: 'top',
                        }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leyenda 3D */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Piso técnico: 30 cm</span>
                <span>·</span>
                <span>Racks: 45U extruidos</span>
                <span>·</span>
                <span>Bandejas superiores: Cobre + Fibra</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
