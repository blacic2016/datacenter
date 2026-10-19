import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, Activity, Shield, AlertTriangle, Layers, Plus, Trash2, Sparkles } from 'lucide-react';
import { STEPS, STEP_STATUS_LABEL } from '@daedalous/shared';
import { api } from '../api/client';
import { LivePreviewModal } from '../components/LivePreviewModal';
import { Step01Survey } from './wizard/Step01Survey';

interface WizardPageProps {
  projectId?: string;
  onBack: () => void;
  onOpenHistory: (projectId: string) => void;
}

export const WizardPage: React.FC<WizardPageProps> = ({ projectId, onBack, onOpenHistory }) => {
  const [project, setProject] = useState<any>(null);
  const [activeStepKey, setActiveStepKey] = useState<string>('step-00');
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [allStepsData, setAllStepsData] = useState<Record<string, any>>({});
  const [calcOutput, setCalcOutput] = useState<any>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario de Paso 0 para proyectos nuevos
  const [step0Form, setStep0Form] = useState({
    projectName: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    presales: '',
    people: '',
    clientManager: '',
    address: '',
    phone: '',
    email: '',
    ratedTarget: 2,
  });

  // Cargar proyecto existente si hay projectId
  useEffect(() => {
    if (projectId) {
      setLoading(true);
      api.getProject(projectId).then((res) => {
        const p = res.project;
        setProject(p);
        const stepsMap: Record<string, any> = {};
        for (const [k, v] of Object.entries(p.steps || {})) {
          stepsMap[k] = (v as any).data || {};
        }
        setAllStepsData(stepsMap);
        setStepData(stepsMap['step-01'] || {});
        setActiveStepKey('step-01');
        // Evaluar cálculos en vivo iniciales
        api.evalCalc(stepsMap).then(setCalcOutput).catch(console.error);
      }).catch((err) => {
        setMsg({ type: 'error', text: err.message });
      }).finally(() => setLoading(false));
    }
  }, [projectId]);

  // Ejecutar cálculo en caliente cuando cambie el paso actual
  const triggerLiveEval = (newData: any) => {
    const updatedAll = { ...allStepsData, [activeStepKey]: newData };
    setAllStepsData(updatedAll);
    api.evalCalc(updatedAll).then(setCalcOutput).catch(console.error);
  };

  const handleFieldChange = (key: string, value: any) => {
    const updated = { ...stepData, [key]: value };
    setStepData(updated);
    triggerLiveEval(updated);
  };

  const handleSaveStep = async () => {
    if (!project?.activeVersion?.id) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.saveStep(project.activeVersion.id, activeStepKey, stepData);
      setMsg({ type: 'success', text: `Avance guardado para ${activeStepKey}. Score: ${res.complianceScore}%` });
      setCalcOutput(res.fullEngineOutput);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleValidateStep = async () => {
    if (!project?.activeVersion?.id) return;
    try {
      await api.validateStep(project.activeVersion.id, activeStepKey);
      setMsg({ type: 'success', text: 'Paso validado exitosamente.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleCreateStep0 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.createProject(step0Form);
      setMsg({ type: 'success', text: `Proyecto creado con ID ${res.code}. Paso 0 sellado.` });
      // Cargar el nuevo proyecto
      const projRes = await api.getProject(res.id);
      setProject(projRes.project);
      setActiveStepKey('step-01');
      setStepData({});
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const renderRequirementBanner = () => {
    if (activeStepKey === 'step-00' || activeStepKey === 'step-01') return null;

    const surveyData = allStepsData['step-01'] || (project?.steps as any)?.['step-01']?.data || {};
    const recs = surveyData.stepRecommendations || {};
    const clientReq = surveyData.clientRequirement || '';
    const specificRec = recs[activeStepKey];

    const defaultRecs: Record<string, string> = {
      'step-02': 'Obra Civil: Dimensionar sala con altura de losa ≥ 3.5m, piso técnico elevado a 30 cm con resistencia de carga ≥ 12 kPa y puerta hermética ≥ 1.0m x 2.13m según TIA-942.',
      'step-03': 'Espacio y Racks: Respetar pasillos frontales ≥ 1.2m y posteriores ≥ 1.0m con separación clara de pasillo frío y caliente o contención.',
      'step-04': 'Carga Eléctrica: Dimensionar alimentadores con factor de potencia 0.9 y holgura de crecimiento del 25% a 5 años según la densidad requerida por el cliente.',
      'step-05': 'Climatización: Garantizar redundancia N+1 en unidades de precisión perimetral y bandejas de condensado bajo piso.',
      'step-06': 'Tomas Eléctricas: Cada rack debe disponer de doble alimentación A/B independiente con tomas C13/C19 alimentadas desde PDUs separadas.',
      'step-07': 'Tableros: Tablero general con bypass de mantenimiento, transferencia automática ATS y malla a tierra TMGB.',
      'step-08': 'UPS: Configuración de UPS redundante con autonomía calculada para soportar transferencia al grupo electrógeno (mínimo 15 minutos).',
      'step-09': 'Extinción de Incendios: Detección por aspiración tipo VESDA y descarga de agente limpio certificado NFPA 2001 sin residuo conductor.',
      'step-10': 'Iluminación: Nivel mínimo de 500 lux a 1 metro de altura con respaldo de circuito de emergencia.',
      'step-11': 'CCTV y Accesos: Cobertura total de pasillos y esclusa con control de acceso por doble factor y retención de 90 días.',
      'step-12': 'Monitoreo Zabbix: Monitoreo continuo de temperatura, humedad relativa, estado de UPS, PDUs y fallas de ATS.',
      'step-13': 'Cableado Estructurado: Canalizaciones superiores separadas para fibra óptica y cobre con curvaturas normalizadas TIA-568/942.',
      'step-14': 'Generador Eléctrico: Grupo electrógeno diésel con tanque de combustible de autonomía continua de al menos 24 a 48 horas.',
      'step-15': 'Puesta a Tierra: Malla de tierra equipotencial mallada (MCG) con resistencia menor a 5 Ohms conforme a TIA-607-D.',
      'step-16': 'Comisionamiento: Protocolo de pruebas con banco de carga resistiva y validación de conmutación sin corte.',
    };

    const currentRec = specificRec || defaultRecs[activeStepKey] || 'Verificar los criterios de diseño TIA-942 correspondientes a este subsistema.';

    return (
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        background: 'var(--surface-alt)',
        borderLeft: '4px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <strong style={{ fontSize: '13px', color: 'var(--text)' }}>
              Criterio de Preanálisis del Requerimiento del Cliente (ANSI/TIA-942):
            </strong>
          </div>
          <span className="badge badge-info" style={{ fontSize: '11px' }}>
            {specificRec ? 'Analizado por IA' : 'Norma TIA-942 Guía'}
          </span>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>
          {currentRec}
        </p>

        {clientReq && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            <strong>Requerimiento base del cliente:</strong> "{clientReq.substring(0, 160)}{clientReq.length > 160 ? '...' : ''}"
          </div>
        )}

        <div style={{ marginTop: '4px' }}>
          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
            Observación técnica de diseño para esta fase (Tomando en cuenta este requerimiento):
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            style={{ fontSize: '12px' }}
            placeholder="Registre las observaciones, justificaciones o adaptaciones técnicas específicas para este paso..."
            value={stepData.stepObservation || ''}
            onChange={(e) => handleFieldChange('stepObservation', e.target.value)}
          />
        </div>
      </div>
    );
  };

  const activeStepMeta = STEPS.find((s) => s.key === activeStepKey);

  return (
    <div>
      {/* Barra de cabecera del asistente */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>
              {project ? project.generalData?.projectName : 'Creación de Nuevo Data Center'}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              {project && <span className="font-mono badge badge-info">{project.code}</span>}
              {project && <span>Cliente: {project.client_name}</span>}
              {project && <span className="badge badge-info">Rated {project.rated_target}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsLiveModalOpen(true)}
            title="Abrir Pop-up de diagnóstico reactivo en vivo"
          >
            <Activity size={16} color="var(--color-primary)" />
            <span>Pop-up en Vivo</span>
          </button>

          {project && (
            <>
              <button className="btn btn-secondary" onClick={() => onOpenHistory(project.id)}>
                <Shield size={16} />
                <span>Historial TIA-942</span>
              </button>
              <button className="btn btn-primary" onClick={handleSaveStep} disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Guardando...' : 'Guardar Avance'}</span>
              </button>
              <button className="btn btn-success" onClick={handleValidateStep}>
                <CheckCircle size={16} />
                <span>Validar Fase</span>
              </button>
            </>
          )}
        </div>
      </div>

      {msg && (
        <div
          className="card"
          style={{
            padding: '12px',
            marginBottom: '16px',
            borderLeft: `4px solid ${msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
            fontSize: '13px',
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Grid: Stepper a la izquierda (17 pasos) y Contenido de la fase a la derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
        {/* Stepper Vertical */}
        <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', height: 'fit-content' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '6px 8px' }}>
            Fases del Asistente
          </div>
          {STEPS.map((st) => {
            const isCurrent = st.key === activeStepKey;
            const isLocked = !project && st.key !== 'step-00';
            const score = calcOutput?.compliance?.[st.key];
            return (
              <button
                key={st.key}
                disabled={isLocked}
                onClick={() => {
                  setActiveStepKey(st.key);
                  const saved = allStepsData[st.key] || {};
                  setStepData(saved);
                  triggerLiveEval(saved);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isCurrent ? 'var(--surface-alt)' : 'transparent',
                  borderLeft: isCurrent ? '3px solid var(--color-primary)' : '3px solid transparent',
                  opacity: isLocked ? 0.4 : 1,
                  textAlign: 'left',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)', width: '18px' }}>
                    {st.number}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: isCurrent ? '600' : '400', color: 'var(--text)' }}>
                    {st.title}
                  </span>
                </div>
                {score !== undefined && score !== null && (
                  <span style={{ fontSize: '10px', fontWeight: '700' }} className="font-mono">
                    {score}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel Central del Paso Activo */}
        <div className="card" style={{ minHeight: '500px' }}>
          {activeStepKey === 'step-00' && !project ? (
            /* Formulario Paso 0: Creación inicial inmutable */
            <form onSubmit={handleCreateStep0}>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>
                  Paso 0 · Datos Generales del Proyecto (Inmutables)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Complete los datos iniciales. Una vez confirmado, estos parámetros quedarán sellados y no podrán ser modificados.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre del Proyecto *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={step0Form.projectName}
                    onChange={(e) => setStep0Form({ ...step0Form, projectName: e.target.value })}
                    placeholder="Ej. Datacenter Principal Sede Central"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={step0Form.clientName}
                    onChange={(e) => setStep0Form({ ...step0Form, clientName: e.target.value })}
                    placeholder="Ej. Empresa Pública de Aguas"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nivel Rated Objetivo TIA-942 *</label>
                  <select
                    className="form-select"
                    value={step0Form.ratedTarget}
                    onChange={(e) => setStep0Form({ ...step0Form, ratedTarget: Number(e.target.value) })}
                  >
                    <option value={1}>Rated 1 (Básico - Componentes N)</option>
                    <option value={2}>Rated 2 (Componentes Redundantes N+1)</option>
                    <option value={3}>Rated 3 (Mantenible Simultáneamente - Rutas Múltiples)</option>
                    <option value={4}>Rated 4 (Tolerante a Fallos - Rutas 2N)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preventa / Responsable Técnico *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={step0Form.presales}
                    onChange={(e) => setStep0Form({ ...step0Form, presales: e.target.value })}
                    placeholder="Ej. Ing. Marco Vizcaíno"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Encargado por parte del Cliente *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={step0Form.clientManager}
                    onChange={(e) => setStep0Form({ ...step0Form, clientManager: e.target.value })}
                    placeholder="Ej. Ing. Carlos Andrade"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono de Contacto *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={step0Form.phone}
                    onChange={(e) => setStep0Form({ ...step0Form, phone: e.target.value })}
                    placeholder="Ej. +593 99 999 9999"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Dirección del Levantamiento *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={step0Form.address}
                    onChange={(e) => setStep0Form({ ...step0Form, address: e.target.value })}
                    placeholder="Ej. Av. Mariana de Jesús y Occidental, Edificio Técnico"
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <CheckCircle size={16} />
                  <span>{saving ? 'Sellando...' : 'Crear Proyecto y Sellar Paso 0'}</span>
                </button>
              </div>
            </form>
          ) : activeStepKey === 'step-01' ? (
            /* Paso 1: Levantamiento Físico, Registro Fotográfico por Áreas y Análisis IA */
            <Step01Survey
              project={project}
              stepData={stepData}
              onChange={handleFieldChange}
            />
          ) : (
            <div>
              {/* Observación y Criterio de Preanálisis del Requerimiento */}
              {renderRequirementBanner()}

              {activeStepKey === 'step-03' ? (
                /* Paso 3: Planeamiento de Espacio y Racks (Especial con inventario dinámico) */
                <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Paso 3 · Planeamiento del Espacio e Inventario de Racks</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Configure pasillos, contención e inventario de racks. Al agregar o quitar servidores, se recalcula la energía, calor y límites de espacio al instante.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Pasillo Frontal (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={stepData.frontAisleM ?? 1.2}
                    onChange={(e) => handleFieldChange('frontAisleM', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pasillo Posterior (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={stepData.rearAisleM ?? 1.0}
                    onChange={(e) => handleFieldChange('rearAisleM', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contención</label>
                  <select
                    className="form-select"
                    value={stepData.containment ?? 'ninguna'}
                    onChange={(e) => handleFieldChange('containment', e.target.value)}
                  >
                    <option value="ninguna">Sin contención</option>
                    <option value="pasillo_frio">Pasillo Frío Contenido</option>
                    <option value="pasillo_caliente">Pasillo Caliente Contenido</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Factor Simultaneidad</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.3"
                    max="1"
                    className="form-input"
                    value={stepData.simultaneityFactor ?? 0.8}
                    onChange={(e) => handleFieldChange('simultaneityFactor', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Racks e inventario */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>
                  Racks en Sala ({(stepData.racks || []).length})
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const current = stepData.racks || [];
                    const newRack = {
                      id: `rack-${current.length + 1}`,
                      name: `RACK-${String(current.length + 1).padStart(2, '0')}`,
                      units: 42,
                      row: 1,
                      position: current.length + 1,
                      equipment: [
                        { id: `eq-1`, name: 'Servidor 2U Dual PSU', units: 2, watts: 450, powerSupplies: 2, quantity: 4 },
                        { id: `eq-2`, name: 'Switch ToR 1U', units: 1, watts: 150, powerSupplies: 2, quantity: 2 },
                      ],
                    };
                    handleFieldChange('racks', [...current, newRack]);
                  }}
                >
                  <Plus size={14} /> Agregar Rack a la Sala
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(stepData.racks || []).map((rack: any, rIdx: number) => {
                  const rackWatts = (rack.equipment || []).reduce((s: number, e: any) => s + (e.watts * e.quantity), 0);
                  const rackKw = (rackWatts * (stepData.simultaneityFactor ?? 0.8)) / 1000;
                  return (
                    <div key={rack.id || rIdx} className="card" style={{ padding: '12px', background: 'var(--surface-alt)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px' }}>{rack.name}</span>
                          <span className="badge badge-info">{rack.units}U</span>
                          <span className="badge badge-warning">{rackKw.toFixed(2)} kW Carga IT</span>
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const updated = (stepData.racks || []).filter((_: any, i: number) => i !== rIdx);
                            handleFieldChange('racks', updated);
                          }}
                        >
                          <Trash2 size={14} color="var(--color-danger)" />
                        </button>
                      </div>

                      {/* Equipos del rack */}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {(rack.equipment || []).map((eq: any, eIdx: number) => (
                          <div key={eIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                            <span>{eq.quantity}x {eq.name} ({eq.units}U c/u)</span>
                            <span className="font-mono">{eq.watts * eq.quantity} W</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Renderizador Declarativo de Campos para las demás fases */
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                  {activeStepMeta?.number} · {activeStepMeta?.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {activeStepMeta?.description}
                </p>
              </div>

              {activeStepMeta?.groups.map((group, gIdx) => (
                <div key={gIdx} style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-primary)' }}>
                    {group.title}
                  </h4>
                  {group.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{group.description}</p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {group.fields.map((f) => {
                      const val = stepData[f.key] !== undefined ? stepData[f.key] : f.defaultValue ?? '';
                      return (
                        <div key={f.key} className="form-group" style={{ gridColumn: f.type === 'textarea' || f.type === 'checklist' ? '1 / -1' : undefined }}>
                          <label className="form-label">
                            {f.label} {f.unit ? `(${f.unit})` : ''} {f.required ? '*' : ''}
                          </label>

                          {f.type === 'select' ? (
                            <select
                              className="form-select"
                              value={val}
                              onChange={(e) => handleFieldChange(f.key, e.target.value)}
                            >
                              {(f.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : f.type === 'textarea' ? (
                            <textarea
                              className="form-textarea"
                              value={val}
                              onChange={(e) => handleFieldChange(f.key, e.target.value)}
                            />
                          ) : f.type === 'boolean' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(val)}
                                onChange={(e) => handleFieldChange(f.key, e.target.checked)}
                              />
                              <span style={{ fontSize: '13px' }}>Habilitado / Cumple</span>
                            </div>
                          ) : f.type === 'checklist' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                              {(f.items || []).map((item, itIdx) => {
                                const selected = Array.isArray(val) && val.includes(item);
                                return (
                                  <label
                                    key={itIdx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px',
                                      background: 'var(--surface-alt)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={(e) => {
                                        const current = Array.isArray(val) ? [...val] : [];
                                        const next = e.target.checked
                                          ? [...current, item]
                                          : current.filter((x) => x !== item);
                                        handleFieldChange(f.key, next);
                                      }}
                                    />
                                    <span>{item}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <input
                              type={f.type === 'number' ? 'number' : 'text'}
                              step={f.step}
                              min={f.min}
                              max={f.max}
                              className="form-input"
                              value={val}
                              onChange={(e) => handleFieldChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                            />
                          )}

                          {f.help && <div className="form-help">{f.help}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  </div>

      {/* Pop-up en Vivo flotante reactivo */}
      <LivePreviewModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        output={calcOutput}
        projectName={project?.generalData?.projectName || 'Nuevo Proyecto'}
      />
    </div>
  );
};
