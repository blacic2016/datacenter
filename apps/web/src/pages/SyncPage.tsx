import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Server } from 'lucide-react';
import { api } from '../api/client';

export const SyncPage: React.FC = () => {
  const [syncData, setSyncData] = useState<any>(null);
  const [targetUrl, setTargetUrl] = useState('postgres://daedalous:daedalous@localhost:5432/daedalous');
  const [syncing, setSyncing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getSyncStatus();
      setSyncData(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setReport(null);
    try {
      const res = await api.triggerSync(targetUrl);
      setReport(res);
      fetchStatus();
    } catch (err: any) {
      setReport({ success: false, message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const state = syncData?.syncState || {};

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={24} color="var(--color-primary)" />
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
            Sincronización de Base de Datos (SQLite 3 → PostgreSQL)
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Almacenamiento local en SQLite 3 con réplica y sincronización de copia fiel hacia PostgreSQL para puesta en producción.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Estado Local */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Server size={18} color="var(--color-success)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Base de Datos Local (Activa)</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Motor SQLite 3 nativo de alta velocidad, libre de configuración, ejecutándose en modo WAL (Write-Ahead Logging).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Motor:</span>
              <strong className="font-mono">SQLite 3 (node:sqlite)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Ubicación:</span>
              <span className="font-mono" style={{ fontSize: '11px' }}>./data/daedalous.sqlite</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>Estado:</span>
              <span className="badge badge-success">Operativa (Fuente de Verdad)</span>
            </div>
          </div>
        </div>

        {/* Estado PostgreSQL Remoto / Producción */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Database size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Destino de Réplica (PostgreSQL)</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Servidor PostgreSQL de producción que recibe la copia fiel con tipos JSONB y restricciones referenciales.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Última Sincronización:</span>
              <span>{state.last_synced_at ? new Date(state.last_synced_at).toLocaleString() : 'Pendiente'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Registros Sincronizados:</span>
              <strong className="font-mono">{state.records_synced || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>Estado Último Sync:</span>
              <span className={`badge ${state.status === 'success' ? 'badge-success' : 'badge-warning'}`}>
                {state.status || 'No ejecutado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Disparador de Sincronización */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
          Ejecutar Sincronización SQLite → PostgreSQL
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Inicia la replicación de todas las tablas (proyectos, versiones inmutables, diagnósticos y plantillas).
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input font-mono"
            style={{ flex: 1, minWidth: '320px' }}
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="postgres://usuario:clave@servidor:5432/daedalous"
          />

          <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'spin' : ''} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Copia Fiel'}</span>
          </button>
        </div>

        {report && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: report.success ? 'rgba(94, 140, 106, 0.1)' : 'rgba(166, 86, 75, 0.1)',
            borderLeft: `4px solid ${report.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '4px' }}>
              {report.success ? <CheckCircle size={16} color="var(--color-success)" /> : <AlertTriangle size={16} color="var(--color-danger)" />}
              <span>{report.success ? 'Sincronización Exitosa' : 'Aviso de Conexión'}</span>
            </div>
            <p>{report.message}</p>
            {report.tablesSynced && (
              <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(report.tablesSynced).map(([tbl, cnt]) => (
                  <span key={tbl} className="badge badge-info">{tbl}: {cnt as number}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
