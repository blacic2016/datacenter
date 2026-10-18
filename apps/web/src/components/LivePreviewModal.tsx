import React from 'react';
import { X, Activity, AlertTriangle, CheckCircle, Zap, Thermometer, Box, ShieldAlert } from 'lucide-react';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  output: any; // EngineOutput
  projectName?: string;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  isOpen,
  onClose,
  output,
  projectName = 'Proyecto Activo',
}) => {
  if (!isOpen || !output) return null;

  const res = output.results || {};
  const it = res.itLoad || {};
  const growth = res.growth || {};
  const thermal = res.thermal || {};
  const cooling = res.cooling || {};
  const ups = res.ups || {};
  const space = res.space || {};
  const diagnostics: any[] = output.diagnostics || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--color-primary)" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Pop-up en Vivo: Diagnóstico y Cálculos</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{projectName} · Evaluación reactiva en caliente</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Métricas Principales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>
                <Zap size={14} color="var(--color-warning)" /> Carga IT Total
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700' }} className="font-mono">
                {it.totalKw ? it.totalKw.toFixed(1) : 0} <span style={{ fontSize: '12px' }}>kW</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{it.rackCount || 0} racks configurados</div>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>
                <Thermometer size={14} color="var(--color-danger)" /> Carga Térmica
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700' }} className="font-mono">
                {thermal.base?.btuH ? Math.round(thermal.base.btuH).toLocaleString() : 0} <span style={{ fontSize: '12px' }}>BTU/h</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                {thermal.base?.tons ? thermal.base.tons.toFixed(1) : 0} TR requeridas
              </div>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>
                <Zap size={14} color="var(--color-primary)" /> Capacidad UPS
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700' }} className="font-mono">
                {ups.installedKva || 0} <span style={{ fontSize: '12px' }}>kVA</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                Uso: {ups.scenarios?.base?.utilization && Number.isFinite(ups.scenarios.base.utilization) ? `${(ups.scenarios.base.utilization * 100).toFixed(0)}%` : 'Sin datos'}
              </div>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>
                <Box size={14} color="var(--color-success)" /> Capacidad de Sala
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700' }} className="font-mono">
                {space.maxRacks || 0} <span style={{ fontSize: '12px' }}>racks máx</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                {space.racksPerRow || 0} por fila · {space.rowsPossible || 0} filas
              </div>
            </div>
          </div>

          {/* Tabla de Comparación de Escenarios Base vs +25% vs +50% */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Proyección de Crecimiento TIA-942 (Escenarios Base, +25% y +50%)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px' }}>Parámetro</th>
                    <th style={{ padding: '8px 12px' }}>Carga Base</th>
                    <th style={{ padding: '8px 12px' }}>+25% Crecimiento</th>
                    <th style={{ padding: '8px 12px' }}>+50% Crecimiento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>Racks Requeridos</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{growth.base?.racks ?? it.rackCount ?? 0}</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{growth.g25?.racks ?? 0}</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{growth.g50?.racks ?? 0}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>Carga IT (kW)</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{growth.base?.itKw ? growth.base.itKw.toFixed(2) : 0} kW</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{growth.g25?.itKw ? growth.g25.itKw.toFixed(2) : 0} kW</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{growth.g50?.itKw ? growth.g50.itKw.toFixed(2) : 0} kW</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>Calor Total (BTU/h)</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{thermal.base?.btuH ? Math.round(thermal.base.btuH).toLocaleString() : 0}</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{thermal.g25?.btuH ? Math.round(thermal.g25.btuH).toLocaleString() : 0}</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{thermal.g50?.btuH ? Math.round(thermal.g50.btuH).toLocaleString() : 0}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>Aire Requerido (Unidades)</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{cooling.scenarios?.base?.requiredUnits ?? 0}</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{cooling.scenarios?.g25?.requiredUnits ?? 0}</td>
                    <td style={{ padding: '8px 12px' }} className="font-mono">{cooling.scenarios?.g50?.requiredUnits ?? 0}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>¿Espacio Físico Suficiente?</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${space.fits?.base ? 'badge-success' : 'badge-danger'}`}>
                        {space.fits?.base ? 'Sí cabe' : 'Excedido'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${space.fits?.g25 ? 'badge-success' : 'badge-danger'}`}>
                        {space.fits?.g25 ? 'Sí cabe' : 'Excedido'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${space.fits?.g50 ? 'badge-success' : 'badge-warning'}`}>
                        {space.fits?.g50 ? 'Sí cabe' : 'Al límite'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnósticos y Alertas Normativas TIA-942 */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="var(--color-primary)" />
              Diagnósticos Normativos y Límites ({diagnostics.length})
            </h4>

            {diagnostics.length === 0 ? (
              <div style={{
                padding: '16px',
                background: 'rgba(94, 140, 106, 0.1)',
                border: '1px solid var(--color-success)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
              }}>
                <CheckCircle size={18} color="var(--color-success)" />
                <span>Excelente. Todos los parámetros calculados cumplen con los límites de la norma TIA-942.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {diagnostics.map((d, idx) => {
                  const isBlock = d.severity === 'blocking';
                  const isErr = d.severity === 'error';
                  const isWarn = d.severity === 'warning';
                  const badgeClass = isBlock || isErr ? 'badge-danger' : isWarn ? 'badge-warning' : 'badge-info';
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--surface-alt)',
                        borderLeft: `4px solid ${isBlock || isErr ? 'var(--color-danger)' : isWarn ? 'var(--color-warning)' : 'var(--color-primary)'}`,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <AlertTriangle size={16} color={isBlock || isErr ? 'var(--color-danger)' : 'var(--color-warning)'} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span className={`badge ${badgeClass}`}>{d.severity}</span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>{d.ruleId} · {d.ref}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text)' }}>{d.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
