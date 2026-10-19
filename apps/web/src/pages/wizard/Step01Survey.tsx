import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Upload, Trash2, Tag, Calendar, User, Folder, CheckCircle, AlertTriangle, Layers, Cpu, Zap, Thermometer, Shield } from 'lucide-react';
import { api } from '../../api/client';

const SURVEY_AREAS = [
  'Sala de cómputo (EDA)',
  'Acometida eléctrica y tableros',
  'Piso técnico y suelo base',
  'Techo, losa y bajantes de agua',
  'Accesos, puertas y rutas de ingreso',
  'Cuarto de climatización / aires',
  'Cuarto UPS y baterías',
  'Exteriores y patio de generadores',
];

interface Step01SurveyProps {
  project: any;
  stepData: any;
  onChange: (key: string, value: any) => void;
}

export const Step01Survey: React.FC<Step01SurveyProps> = ({ project, stepData, onChange }) => {
  const [selectedArea, setSelectedArea] = useState<string>(SURVEY_AREAS[0]!);
  const [photos, setPhotos] = useState<any[]>([]);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [groupObservation, setGroupObservation] = useState('');
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [bottomTab, setBottomTab] = useState<'preanalysis' | 'photos' | 'checklist'>('preanalysis');

  const loadPhotos = async () => {
    if (!project?.id) return;
    setLoadingPhotos(true);
    try {
      const res = await api.getProjectPhotos(project.id, selectedArea);
      setPhotos(res.photos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [project?.id, selectedArea]);

  const handleAnalyzeWithAi = async () => {
    const text = stepData.clientRequirement;
    if (!text || text.trim().length < 5) {
      alert('Por favor ingrese primero el texto del requerimiento del cliente.');
      return;
    }
    setAnalyzingAi(true);
    setAiNotice(null);
    try {
      const res = await api.analyzeRequirement(text, project?.generalData?.projectName, project?.client_name);
      const a = res.analysis;
      if (a) {
        if (a.proposalSummary) onChange('proposalSummary', a.proposalSummary);
        if (a.expectedRacks) onChange('expectedRacks', a.expectedRacks);
        if (a.expectedKwPerRack) onChange('expectedKwPerRack', a.expectedKwPerRack);
        if (a.precheckItems) onChange('aiExplanations', a.precheckItems);
        if (a.stepRecommendations) onChange('stepRecommendations', a.stepRecommendations);
        setBottomTab('preanalysis');
      }
      if (res.notice) setAiNotice(res.notice);
    } catch (err: any) {
      alert(`Error al invocar IA: ${err.message}`);
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !project?.id) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          await api.uploadPhoto(project.id, {
            area: selectedArea,
            filename: file.name,
            url: base64,
            tag: `${selectedArea.split(' ')[0]} - General`,
            observation: groupObservation || '',
          });
          loadPhotos();
        } catch (err: any) {
          alert(`Error subiendo foto: ${err.message}`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('¿Eliminar esta fotografía?')) return;
    try {
      await api.deletePhoto(photoId);
      loadPhotos();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const recs = stepData.stepRecommendations || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Requerimiento escrito con botón de análisis IA */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>1. Requerimiento Escrito del Cliente</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Describa las necesidades del cliente y use la IA para generar el preanálisis de diseño.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyzeWithAi}
            disabled={analyzingAi}
          >
            <Sparkles size={16} />
            <span>{analyzingAi ? 'Analizando con IA...' : 'Analizar Requerimiento con IA (Gemini/Ollama)'}</span>
          </button>
        </div>

        <div className="form-group">
          <textarea
            className="form-textarea"
            rows={4}
            value={stepData.clientRequirement || ''}
            onChange={(e) => onChange('clientRequirement', e.target.value)}
            placeholder="Ingrese el requerimiento del cliente. Ej: Se requiere un Data Center para 6 racks con densidad de 5 kW por rack, climatización redundante N+1 y UPS con 15 minutos de autonomía..."
          />
        </div>

        {aiNotice && (
          <div style={{ padding: '8px 12px', background: 'rgba(184, 150, 62, 0.1)', borderLeft: '3px solid var(--color-warning)', fontSize: '12px', marginBottom: '12px' }}>
            {aiNotice}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Racks Esperados (Estimado IA)</label>
            <input
              type="number"
              className="form-input"
              value={stepData.expectedRacks ?? 4}
              onChange={(e) => onChange('expectedRacks', Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Densidad por Rack (kW)</label>
            <input
              type="number"
              step="0.5"
              className="form-input"
              value={stepData.expectedKwPerRack ?? 5}
              onChange={(e) => onChange('expectedKwPerRack', Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Horizonte Crecimiento (Años)</label>
            <input
              type="number"
              className="form-input"
              value={stepData.growthHorizonYears ?? 5}
              onChange={(e) => onChange('growthHorizonYears', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Propuesta Técnica Fundamentada en TIA-942</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={stepData.proposalSummary || ''}
            onChange={(e) => onChange('proposalSummary', e.target.value)}
            placeholder="La IA redactará aquí la propuesta preliminar..."
          />
        </div>
      </div>

      {/* Pestañas Inferiores: Preanálisis de Diseño vs Registro Fotográfico vs Pre-Checklist */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <button
          type="button"
          className={`btn btn-sm ${bottomTab === 'preanalysis' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setBottomTab('preanalysis')}
        >
          <Layers size={14} /> Preanálisis de Diseño (Distribución por Subsistemas)
        </button>
        <button
          type="button"
          className={`btn btn-sm ${bottomTab === 'photos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setBottomTab('photos')}
        >
          <Camera size={14} /> Registro Fotográfico por Áreas ({photos.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${bottomTab === 'checklist' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setBottomTab('checklist')}
        >
          <CheckCircle size={14} /> Pre-Checklist TIA-942 Explicado
        </button>
      </div>

      {/* PESTAÑA A: Preanálisis de Diseño (Distribución de lo Requerido por el Cliente) */}
      {bottomTab === 'preanalysis' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                Preanálisis de Diseño · Distribución Cuantitativa del Requerimiento
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Desglose analítico de lo solicitado por el cliente. Estos criterios se presentarán automáticamente en cada fase de diseño como observación guía.
              </p>
            </div>
            <span className="badge badge-success">TIA-942-C · Rated {stepData.suggestedRated || project?.rated_target || 2}</span>
          </div>

          {/* Métricas clave calculadas del requerimiento */}
          {(() => {
            const rCount = Number(stepData.expectedRacks || 4);
            const rKw = Number(stepData.expectedKwPerRack || 5.0);
            const netItKw = rCount * rKw;
            const facilityKw = netItKw * 1.6;
            const btuTotal = Math.round(netItKw * 3412 * 1.3);
            const tonsTotal = (btuTotal / 12000).toFixed(1);
            const suggestedArea = rCount * 5.5;

            return (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)', borderLeft: '3px solid var(--color-primary)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Carga Neta IT</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{netItKw.toFixed(1)} kW</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rCount} racks @ {rKw} kW/rack</div>
                  </div>

                  <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)', borderLeft: '3px solid var(--color-info)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Climatización Total</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{btuTotal.toLocaleString()} BTU/h</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>~{tonsTotal} TR (Esquema N+1)</div>
                  </div>

                  <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)', borderLeft: '3px solid var(--color-warning)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Potencia Acometida (PUE 1.6)</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{facilityKw.toFixed(1)} kW</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>~{(facilityKw / 0.8).toFixed(1)} kVA demanda</div>
                  </div>

                  <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)', borderLeft: '3px solid var(--color-success)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Superficie Sala Estimada</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{suggestedArea.toFixed(0)} m²</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Losa libre + pasillos</div>
                  </div>
                </div>

                {/* Barra de Distribución Energética Estimada */}
                <div style={{ padding: '12px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                    <span>Distribución de Potencia Estimada de la Instalación:</span>
                    <span>PUE Proyectado: 1.6</span>
                  </div>
                  <div style={{ display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', background: 'var(--border)' }}>
                    <div style={{ width: '62.5%', background: 'var(--color-primary)' }} title="Equipos IT: 62.5%" />
                    <div style={{ width: '28%', background: 'var(--color-info)' }} title="Climatización: 28%" />
                    <div style={{ width: '9.5%', background: 'var(--color-warning)' }} title="Pérdidas UPS e Iluminación: 9.5%" />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} /> Carga IT (62.5%)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-info)' }} /> Climatización N+1 (28%)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)' }} /> UPS / Auxiliares (9.5%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Criterios por Subsistema a ser heredados a cada paso */}
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>
            Criterios de Diseño por Fase y Subsistema (Se mostrarán en cada paso):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 02</span>
                <strong style={{ fontSize: '12px' }}>Edificación y Obra Civil</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-02'] || 'Definir dimensiones de sala, piso técnico de 30 cm con capacidad de carga y adecuaciones civiles (impermeabilización, accesos).'}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 03</span>
                <strong style={{ fontSize: '12px' }}>Espacio y Racks</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-03'] || `Distribución de ${stepData.expectedRacks || 4} racks IT con pasillo frontal 1.2m y contención térmica.`}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 04</span>
                <strong style={{ fontSize: '12px' }}>Carga Eléctrica IT</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-04'] || `Demanda neta estimada en ${(Number(stepData.expectedRacks || 4) * Number(stepData.expectedKwPerRack || 5)).toFixed(1)} kW IT.`}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 05</span>
                <strong style={{ fontSize: '12px' }}>Climatización y Canalización</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-05'] || 'Capacidad térmica requerida en BTU/h con esquema N+1 y bandejas superiores de cobre y fibra.'}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 06</span>
                <strong style={{ fontSize: '12px' }}>Alimentación A/B y Tomas</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-06'] || 'Alimentación redundante A/B por rack (2 tomas 110V + 1 toma 220V) con líneas separadas.'}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 07</span>
                <strong style={{ fontSize: '12px' }}>Tableros y Acometida</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-07'] || 'Tablero principal con bypass de mantenimiento, tableros secundarios de clima y malla a tierra.'}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 08</span>
                <strong style={{ fontSize: '12px' }}>Sistema UPS y Baterías</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-08'] || 'Sistema UPS Online Doble Conversión con 15 minutos de autonomía mínima.'}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 09</span>
                <strong style={{ fontSize: '12px' }}>Extinción de Incendios</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-09'] || 'Detección temprana por aspiración tipo VESDA y descarga de agente limpio certificado NFPA 2001.'}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 10</span>
                <strong style={{ fontSize: '12px' }}>Iluminación en Sala</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-10'] || 'Luminarias LED herméticas sobre pasillos garantizando 500 lux a 1m de altura y respaldo.'}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 11</span>
                <strong style={{ fontSize: '12px' }}>CCTV y Control de Acceso</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-11'] || 'Cámaras IP cubriendo pasillos fríos/calientes con 90 días de grabación y control biométrico.'}
              </p>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-info">Paso 12</span>
                <strong style={{ fontSize: '12px' }}>Monitoreo Zabbix y DCIM</strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                {recs['step-12'] || 'Monitoreo continuo de temperatura, humedad, fuga de agua, fallas de UPS y conmutación ATS.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA B: Registro Fotográfico por Áreas */}
      {bottomTab === 'photos' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Camera size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Registro Fotográfico por Áreas a Documentar</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {SURVEY_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                className={`btn btn-sm ${selectedArea === area ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedArea(area)}
              >
                {area}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>
                Subir fotografías para: <span style={{ color: 'var(--color-primary)' }}>{selectedArea}</span>
              </span>
              <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Seleccionar Fotos del Equipo / Servidor
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Observación general para este grupo de fotos..."
              value={groupObservation}
              onChange={(e) => setGroupObservation(e.target.value)}
            />
          </div>

          {loadingPhotos ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Cargando fotos del área...</div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '13px' }}>
              No se han cargado fotografías para {selectedArea}.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {photos.map((p) => (
                <div key={p.id} className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000', position: 'relative' }}>
                    <img src={p.url} alt={p.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button className="btn btn-danger btn-sm" style={{ position: 'absolute', top: '6px', right: '6px', padding: '4px 6px' }} onClick={() => handleDeletePhoto(p.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '10px' }}>
                    <span className="badge badge-info"><Folder size={10} /> {p.autoTags?.projectCode}</span>
                    <span className="badge badge-info"><User size={10} /> {p.autoTags?.clientName}</span>
                    <span className="badge badge-info"><Calendar size={10} /> {p.autoTags?.uploadDate}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} color="var(--color-primary)" />
                    <input type="text" className="form-input" style={{ fontSize: '12px', padding: '4px 8px' }} defaultValue={p.tag} />
                  </div>
                  <input type="text" className="form-input" style={{ fontSize: '11px', padding: '4px 8px' }} defaultValue={p.observation} placeholder="Observación..." />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA C: Pre-Checklist TIA-942 Explicado */}
      {bottomTab === 'checklist' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
            Pre-Checklist TIA-942 Explicado por la IA
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {(stepData.aiExplanations || []).map((it: any, idx: number) => (
              <div key={idx} style={{ padding: '12px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-success)' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{it.question}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}><strong>Explicación IA:</strong> {it.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
