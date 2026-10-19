import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Upload, Trash2, Tag, Calendar, User, Folder, CheckCircle, AlertTriangle } from 'lucide-react';
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

  // Cargar fotos del proyecto
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

  // Analizar requerimiento escrito con IA
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
      }
      if (res.notice) setAiNotice(res.notice);
    } catch (err: any) {
      alert(`Error al invocar IA: ${err.message}`);
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Subir fotos para el área seleccionada
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

  const handleUpdatePhotoMeta = async (photoId: string, tag: string, observation: string) => {
    try {
      await api.updatePhoto(photoId, { tag, observation });
      loadPhotos();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Requerimiento escrito con botón de análisis IA */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>1. Requerimiento Escrito del Cliente</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Describa las necesidades del cliente y use la IA para generar el pre-diseño.</p>
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
            placeholder="Ingrese el requerimiento del cliente. Ej: Se requiere un Data Center para 6 racks con densidad de 6 kW por rack, con sistema de climatización redundante N+1 y UPS en sala separada..."
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

      {/* 2. Registro Fotográfico por Áreas */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Camera size={20} color="var(--color-primary)" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>2. Registro Fotográfico por Áreas a Documentar</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Seleccione el área del levantamiento, cargue fotos con tags automáticos (proyecto, cliente, fecha) y observaciones.
            </p>
          </div>
        </div>

        {/* Selector de Áreas */}
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

        {/* Barra de Subida de Fotos para el Área Elegida */}
        <div style={{
          padding: '16px',
          background: 'var(--surface-alt)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700' }}>
              Subir fotografías para: <span style={{ color: 'var(--color-primary)' }}>{selectedArea}</span>
            </span>
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Seleccionar Fotos del Equipo / Servidor
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Observación general para este grupo de fotos (opcional)..."
              value={groupObservation}
              onChange={(e) => setGroupObservation(e.target.value)}
            />
          </div>
        </div>

        {/* Galería de Fotos del Área */}
        {loadingPhotos ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Cargando fotos del área...</div>
        ) : photos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}>
            No se han cargado fotografías para {selectedArea}.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {photos.map((p) => (
              <div key={p.id} className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000', position: 'relative' }}>
                  <img src={p.url} alt={p.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ position: 'absolute', top: '6px', right: '6px', padding: '4px 6px' }}
                    onClick={() => handleDeletePhoto(p.id)}
                    title="Eliminar foto"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Tags Automáticos Solicitados por el Usuario */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '10px' }}>
                  <span className="badge badge-info" title="Tag de Proyecto">
                    <Folder size={10} /> {p.autoTags?.projectCode}
                  </span>
                  <span className="badge badge-info" title="Tag de Cliente">
                    <User size={10} /> {p.autoTags?.clientName}
                  </span>
                  <span className="badge badge-info" title="Tag de Fecha de Subida">
                    <Calendar size={10} /> {p.autoTags?.uploadDate}
                  </span>
                </div>

                {/* Tag Identificador Editable */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={12} color="var(--color-primary)" />
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    defaultValue={p.tag}
                    onBlur={(e) => handleUpdatePhotoMeta(p.id, e.target.value, p.observation)}
                    placeholder="Etiqueta identificadora..."
                  />
                </div>

                {/* Observación Individual */}
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  defaultValue={p.observation}
                  onBlur={(e) => handleUpdatePhotoMeta(p.id, p.tag, e.target.value)}
                  placeholder="Observación de la imagen..."
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Pre-checklist con explicaciones provistas por la IA */}
      {stepData.aiExplanations && stepData.aiExplanations.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
            3. Pre-Checklist TIA-942 Explicado por la IA
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Cada verificación ha sido evaluada y explicada conforme a la norma TIA-942.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stepData.aiExplanations.map((it: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  background: 'var(--surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '4px solid var(--color-success)',
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                  {it.question}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong>Explicación IA:</strong> {it.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
