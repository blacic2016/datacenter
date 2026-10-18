import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, CheckCircle, AlertTriangle, ArrowRight, Layers, FileEdit } from 'lucide-react';
import { STEPS } from '@daedalous/shared';
import { api } from '../api/client';

interface HistoryPageProps {
  initialProjectId?: string;
  onOpenStep: (projectId: string, stepKey: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ initialProjectId, onOpenStep }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialProjectId || '');
  const [project, setProject] = useState<any>(null);
  const [engineOut, setEngineOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProjects().then((res) => {
      setProjects(res.projects || []);
      if (!selectedId && res.projects?.length > 0) {
        setSelectedId(res.projects[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      api.getProject(selectedId).then((res) => {
        setProject(res.project);
        const stepsMap: Record<string, any> = {};
        for (const [k, v] of Object.entries(res.project.steps || {})) {
          stepsMap[k] = (v as any).data || {};
        }
        api.evalCalc(stepsMap).then(setEngineOut).catch(console.error);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [selectedId]);

  const scores = STEPS.map((s) => ({
    stepKey: s.key,
    number: s.number,
    title: s.title,
    score: engineOut?.compliance?.[s.key] ?? null,
    diagnostics: (engineOut?.diagnostics || []).filter((d: any) => d.stepKey === s.key),
  }));

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
            Historial de Creación y Cumplimiento TIA-942
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Línea de tiempo de versiones y gráfico lineal superior de verificación normativa paso a paso.
          </p>
        </div>

        <select
          className="form-select"
          style={{ width: '280px' }}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
          ))}
        </select>
      </div>

      {loading || !project ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Cargando historial de cumplimiento...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* GRÁFICO LINEAL SUPERIOR DE CUMPLIMIENTO TIA-942 */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
                  Gráfico de Cumplimiento TIA-942 por Fase (0 a 16)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Puntos destacados en terracota indican pasos que requieren revisión o corrección normativa.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)' }}>
                  ● 100% Conforme
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)' }}>
                  ● Advertencia
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}>
                  ● Incumple Norma
                </span>
              </div>
            </div>

            {/* Visualizador de Gráfico Lineal en SVG */}
            <div style={{ width: '100%', overflowX: 'auto', padding: '12px 0' }}>
              <svg viewBox="0 0 850 180" style={{ width: '100%', minWidth: '700px', height: '180px' }}>
                {/* Líneas de guía de fondo */}
                <line x1="40" y1="20" x2="820" y2="20" stroke="var(--border)" strokeDasharray="3 3" />
                <text x="10" y="24" fill="var(--text-muted)" fontSize="10">100%</text>

                <line x1="40" y1="70" x2="820" y2="70" stroke="var(--border)" strokeDasharray="3 3" />
                <text x="15" y="74" fill="var(--text-muted)" fontSize="10">50%</text>

                <line x1="40" y1="120" x2="820" y2="120" stroke="var(--border)" />
                <text x="20" y="124" fill="var(--text-muted)" fontSize="10">0%</text>

                {/* Línea conectora entre puntos evaluados */}
                <polyline
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  points={scores.map((s, idx) => {
                    const x = 50 + idx * 46;
                    const val = s.score !== null ? s.score : 100;
                    const y = 120 - (val / 100) * 100;
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {/* Nodos por paso */}
                {scores.map((s, idx) => {
                  const x = 50 + idx * 46;
                  const val = s.score !== null ? s.score : 100;
                  const y = 120 - (val / 100) * 100;
                  const isErr = val < 70;
                  const isWarn = val >= 70 && val < 100;
                  const color = isErr ? 'var(--color-danger)' : isWarn ? 'var(--color-warning)' : 'var(--color-success)';

                  return (
                    <g key={s.stepKey} style={{ cursor: 'pointer' }} onClick={() => onOpenStep(project.id, s.stepKey)}>
                      <circle cx={x} cy={y} r="5" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
                      <text x={x} y="145" textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600">
                        {s.number}
                      </text>
                      {s.score !== null && (
                        <text x={x} y={y - 10} textAnchor="middle" fill={color} fontSize="9" fontWeight="700">
                          {s.score}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Versiones y Detalle Paso a Paso */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
            {/* Lista de Versiones */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <History size={16} color="var(--color-primary)" />
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Historial de Versiones</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(project.versions || []).map((v: any) => (
                  <div
                    key={v.id}
                    style={{
                      padding: '10px',
                      background: v.id === project.activeVersion?.id ? 'var(--surface-alt)' : 'transparent',
                      borderLeft: v.id === project.activeVersion?.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>Versión {v.version_no}</span>
                      <span className="badge badge-info">{v.label}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{v.note || 'Sin notas'}</p>
                    <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>
                      {new Date(v.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Listado de Pasos con Diagnósticos y Acceso Directo */}
            <div className="card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
                Supervisión de Fases y Hallazgos TIA-942
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scores.map((s) => {
                  const hasIssues = s.diagnostics.length > 0;
                  return (
                    <div
                      key={s.stepKey}
                      style={{
                        padding: '12px',
                        background: 'var(--surface-alt)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '13px' }}>Paso {s.number} · {s.title}</span>
                          {s.score !== null ? (
                            <span className={`badge ${s.score >= 100 ? 'badge-success' : s.score >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                              Cumplimiento {s.score}%
                            </span>
                          ) : (
                            <span className="badge badge-info">Sin datos</span>
                          )}
                        </div>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenStep(project.id, s.stepKey)}
                        >
                          <FileEdit size={12} /> Modificar Fase
                        </button>
                      </div>

                      {hasIssues && (
                        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {s.diagnostics.map((d: any, idx: number) => (
                            <div key={idx} style={{ fontSize: '12px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertTriangle size={12} />
                              <span>[{d.ruleId}] {d.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
