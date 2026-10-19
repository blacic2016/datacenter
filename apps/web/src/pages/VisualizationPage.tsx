import React, { useState, useEffect } from 'react';
import { Eye, Box, Grid, Save, RefreshCw, Settings, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { DataCenter2DEditor } from '../components/datacenter/DataCenter2DEditor';
import { DataCenter3DViewer } from '../components/datacenter/DataCenter3DViewer';
import { DCElement, DCRoomConfig } from '../components/datacenter/dc-types';

export const VisualizationPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectData, setProjectData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'both' | '2d' | '3d'>('both');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Configuración de dimensiones de la sala
  const [roomConfig, setRoomConfig] = useState<DCRoomConfig>({
    name: 'Sala de Cómputo Principal',
    lengthM: 8.4,
    widthM: 6.0,
    heightM: 3.6,
    raisedFloorHeightM: 0.3,
  });

  // Lista de elementos en el Data Center
  const [elements, setElements] = useState<DCElement[]>([]);

  useEffect(() => {
    api.getProjects().then((res) => {
      setProjects(res.projects || []);
      if (res.projects?.length > 0) {
        setSelectedProjectId(res.projects[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    api.getProject(selectedProjectId).then((res) => {
      const p = res.project;
      setProjectData(p);

      const step02 = p.steps?.['step-02']?.data || {};
      const step03 = p.steps?.['step-03']?.data || {};
      const step15 = p.steps?.['step-15']?.data || {};

      // Si ya existía un layout guardado en el paso 15
      if (step15.elements && Array.isArray(step15.elements) && step15.elements.length > 0) {
        setElements(step15.elements);
        if (step15.room) setRoomConfig(step15.room);
      } else {
        // Inicializar dimensiones desde el paso 02
        const rLen = Number(step02.lengthM) || 8.4;
        const rWid = Number(step02.widthM) || 6.0;
        const rH = Number(step02.freeHeightM) || 3.6;
        const rFloorH = Number(step02.raisedFloorHeightCm) ? Number(step02.raisedFloorHeightCm) / 100 : 0.3;

        setRoomConfig({
          name: p.generalData?.projectName || 'Sala de Cómputo',
          lengthM: rLen,
          widthM: rWid,
          heightM: rH,
          raisedFloorHeightM: rFloorH,
        });

        // Crear elementos iniciales basados en los racks del Paso 03
        const stepRacks: any[] = step03.racks || [];
        const initElements: DCElement[] = [];

        if (stepRacks.length > 0) {
          stepRacks.forEach((r, idx) => {
            initElements.push({
              id: `rack-${idx + 1}`,
              type: 'rack',
              name: r.name || `RACK-${String(idx + 1).padStart(2, '0')}`,
              x: 1.8 + idx * 0.6,
              y: 2.4,
              width: 0.6,
              depth: 1.0,
              height: 2.0,
              rotation: 0,
              kw: 5.0,
              units: r.units || 42,
            });
          });
        } else {
          // 4 racks de demostración por defecto
          for (let i = 0; i < 4; i++) {
            initElements.push({
              id: `rack-${i + 1}`,
              type: 'rack',
              name: `RACK-${String(i + 1).padStart(2, '0')}`,
              x: 2.4 + i * 0.6,
              y: 2.4,
              width: 0.6,
              depth: 1.0,
              height: 2.0,
              rotation: 0,
              kw: 5.0,
              units: 42,
            });
          }
        }

        // Agregar unidad de aire acondicionado perimetral CRAC
        initElements.push({
          id: 'crac-01',
          type: 'crac',
          name: 'CRAC-01 (N+1)',
          x: 0.6,
          y: 1.8,
          width: 1.2,
          depth: 0.8,
          height: 2.2,
          rotation: 90,
          btu: 120000,
        });

        // Agregar módulo UPS
        initElements.push({
          id: 'ups-01',
          type: 'ups',
          name: 'UPS 60kVA',
          x: rLen - 1.8,
          y: rWid - 1.4,
          width: 0.8,
          depth: 0.9,
          height: 2.0,
          rotation: 0,
          kva: 60,
        });

        // Agregar puerta de acceso
        initElements.push({
          id: 'door-01',
          type: 'door',
          name: 'Puerta Principal TIA-942',
          x: rLen / 2 - 0.5,
          y: 0,
          width: 1.0,
          depth: 0.2,
          height: 2.13,
          rotation: 0,
        });

        setElements(initElements);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [selectedProjectId]);

  const handleSaveLayout = async () => {
    if (!projectData?.activeVersion?.id) {
      alert('Seleccione un proyecto válido con versión activa');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.saveStep(projectData.activeVersion.id, 'step-15', {
        room: roomConfig,
        elements,
        updatedAt: new Date().toISOString(),
      });
      setMsg({ type: 'success', text: 'Distribución 2D y modelo 3D guardados exitosamente en la versión del proyecto.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Cabecera de la Página */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>
            Diseño e Ingeniería Visual (Plano 2D CAD y Modelo 3D Three.js)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Coloque racks, aires CRAC, UPS y puertas a voluntad sobre baldosas de 0.60 m. Los cambios en 2D se proyectan al modelo 3D orbital con texturas y cotas reales TIA-942.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

          {/* Selector de modo de vista */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-alt)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            <button
              className={`btn btn-sm ${viewMode === '2d' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('2d')}
            >
              <Grid size={14} /> Plano 2D
            </button>
            <button
              className={`btn btn-sm ${viewMode === '3d' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('3d')}
            >
              <Box size={14} /> Modelo 3D
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'both' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('both')}
            >
              Ambos (Split)
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSaveLayout}
            disabled={saving || loading}
          >
            <Save size={16} />
            <span>{saving ? 'Guardando...' : 'Guardar Plano 2D/3D'}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: msg.type === 'success' ? 'rgba(94, 140, 106, 0.15)' : 'rgba(166, 86, 75, 0.15)',
          borderLeft: `4px solid ${msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
        }}>
          <CheckCircle size={16} color={msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'} />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Barra de Ajuste de Dimensiones de Sala */}
      <div className="card" style={{ padding: '12px 16px', background: 'var(--surface-alt)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
            <Settings size={15} color="var(--color-primary)" />
            <span>Dimensiones Reales de la Sala (Metros):</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Largo:</span>
              <input
                type="number"
                step="0.6"
                min="3.0"
                max="30.0"
                className="form-input"
                style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}
                value={roomConfig.lengthM}
                onChange={(e) => setRoomConfig({ ...roomConfig, lengthM: Number(e.target.value) })}
              />
              <span style={{ fontSize: '11px' }}>m</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ancho:</span>
              <input
                type="number"
                step="0.6"
                min="3.0"
                max="30.0"
                className="form-input"
                style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}
                value={roomConfig.widthM}
                onChange={(e) => setRoomConfig({ ...roomConfig, widthM: Number(e.target.value) })}
              />
              <span style={{ fontSize: '11px' }}>m</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Altura Losa:</span>
              <input
                type="number"
                step="0.1"
                min="2.8"
                max="6.0"
                className="form-input"
                style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}
                value={roomConfig.heightM}
                onChange={(e) => setRoomConfig({ ...roomConfig, heightM: Number(e.target.value) })}
              />
              <span style={{ fontSize: '11px' }}>m</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Piso Técnico:</span>
              <input
                type="number"
                step="0.05"
                min="0.15"
                max="1.2"
                className="form-input"
                style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}
                value={roomConfig.raisedFloorHeightM}
                onChange={(e) => setRoomConfig({ ...roomConfig, raisedFloorHeightM: Number(e.target.value) })}
              />
              <span style={{ fontSize: '11px' }}>m</span>
            </div>

            <div className="badge badge-info" style={{ fontSize: '11px' }}>
              {(roomConfig.lengthM * roomConfig.widthM).toFixed(1)} m² de Sala
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Cargando entorno CAD 2D/3D...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'both' ? '1fr 1fr' : '1fr',
          gap: '20px',
          alignItems: 'start',
        }}>
          {/* Panel 2D: Plano CAD Interactivo */}
          {(viewMode === 'both' || viewMode === '2d') && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Grid size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Editor CAD 2D · Plano de Distribución</h3>
                </div>
                <span className="badge badge-info">{elements.length} Elementos en Sala</span>
              </div>

              <DataCenter2DEditor
                room={roomConfig}
                elements={elements}
                onElementsChange={setElements}
                onRoomChange={setRoomConfig}
              />
            </div>
          )}

          {/* Panel 3D: Visor Three.js Fotorrealista */}
          {(viewMode === 'both' || viewMode === '3d') && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Visor 3D Three.js · Renderizado Orbital</h3>
                </div>
                <span className="badge badge-success">Sincronizado en Vivo</span>
              </div>

              <DataCenter3DViewer
                room={roomConfig}
                elements={elements}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
