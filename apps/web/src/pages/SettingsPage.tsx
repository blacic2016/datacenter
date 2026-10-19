import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, CheckCircle, AlertTriangle, RefreshCw, Key, Server, Cpu } from 'lucide-react';
import { api } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState({
    provider: 'gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3',
    hasGeminiKey: false,
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getAiConfig().then((data) => {
      setConfig({
        provider: data.provider || 'gemini',
        geminiApiKey: '',
        geminiModel: data.geminiModel || 'gemini-1.5-flash',
        ollamaUrl: data.ollamaUrl || 'http://localhost:11434',
        ollamaModel: data.ollamaModel || 'llama3',
        hasGeminiKey: data.hasGeminiKey || false,
      });
    }).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.saveAiConfig({
        provider: config.provider,
        geminiApiKey: config.geminiApiKey || undefined,
        geminiModel: config.geminiModel,
        ollamaUrl: config.ollamaUrl,
        ollamaModel: config.ollamaModel,
      });
      setSaveMsg('Configuración de IA guardada exitosamente.');
      if (config.geminiApiKey) {
        setConfig((prev) => ({ ...prev, hasGeminiKey: true, geminiApiKey: '' }));
      }
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testAi();
      setTestResult({
        success: true,
        message: `Conexión exitosa con el motor de IA (${config.provider}).`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Fallo en prueba de IA: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} color="var(--color-primary)" />
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
            Configuraciones de la Plataforma
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Configure los motores de Inteligencia Artificial para el análisis de requerimientos y autollenado de pre-checklists.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Formulario de Configuración de IA */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} color="var(--color-warning)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Configuración de Motores de IA</h3>
          </div>

          <form onSubmit={handleSave}>
            {/* Selector de Proveedor */}
            <div className="form-group">
              <label className="form-label">Proveedor de IA Activo *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    border: config.provider === 'gemini' ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: config.provider === 'gemini' ? 'var(--surface-alt)' : 'var(--surface)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="provider"
                    value="gemini"
                    checked={config.provider === 'gemini'}
                    onChange={() => setConfig({ ...config, provider: 'gemini' })}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>Google Gemini</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>API en la nube (Rápido y preciso)</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    border: config.provider === 'ollama' ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: config.provider === 'ollama' ? 'var(--surface-alt)' : 'var(--surface)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="provider"
                    value="ollama"
                    checked={config.provider === 'ollama'}
                    onChange={() => setConfig({ ...config, provider: 'ollama' })}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>Ollama (Local / On-Premise)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Servidor propio sin salida a internet</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Opciones de Gemini */}
            {config.provider === 'gemini' ? (
              <div style={{ padding: '16px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontWeight: '600', fontSize: '13px' }}>
                  <Key size={14} color="var(--color-primary)" /> Parámetros de Google Gemini
                </div>

                <div className="form-group">
                  <label className="form-label">
                    API Key de Gemini {config.hasGeminiKey ? '(Clave ya guardada en servidor)' : '*'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={config.hasGeminiKey ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                    value={config.geminiApiKey}
                    onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  />
                  <div className="form-help">
                    Obtenga su clave gratuita en <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer">Google AI Studio</a>.
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Modelo Gemini</label>
                  <select
                    className="form-select"
                    value={config.geminiModel}
                    onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Recomendado - Última generación)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Ultra rápido y ligero)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Máxima capacidad de razonamiento)</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Opciones de Ollama */
              <div style={{ padding: '16px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontWeight: '600', fontSize: '13px' }}>
                  <Server size={14} color="var(--color-primary)" /> Parámetros de Servidor Ollama
                </div>

                <div className="form-group">
                  <label className="form-label">URL del Servidor Ollama *</label>
                  <input
                    type="text"
                    required
                    className="form-input font-mono"
                    value={config.ollamaUrl}
                    onChange={(e) => setConfig({ ...config, ollamaUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Modelo Descargado en Ollama *</label>
                  <input
                    type="text"
                    required
                    className="form-input font-mono"
                    value={config.ollamaModel}
                    onChange={(e) => setConfig({ ...config, ollamaModel: e.target.value })}
                    placeholder="llama3, mistral, deepseek-r1..."
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <CheckCircle size={16} />
                <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
              </button>

              <button type="button" className="btn btn-secondary" onClick={handleTest} disabled={testing}>
                <RefreshCw size={14} className={testing ? 'spin' : ''} />
                <span>{testing ? 'Probando...' : 'Probar Conexión con IA'}</span>
              </button>
            </div>
          </form>

          {saveMsg && (
            <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(94, 140, 106, 0.1)', borderLeft: '3px solid var(--color-success)', fontSize: '13px' }}>
              {saveMsg}
            </div>
          )}

          {testResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: testResult.success ? 'rgba(94, 140, 106, 0.1)' : 'rgba(166, 86, 75, 0.1)',
                borderLeft: `4px solid ${testResult.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {testResult.success ? <CheckCircle size={16} color="var(--color-success)" /> : <AlertTriangle size={16} color="var(--color-danger)" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Panel Informativo */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Cpu size={18} color="var(--color-primary)" />
            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Uso de la IA en Daedalous</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
            La IA seleccionada se encarga de:
          </p>
          <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Analizar el requerimiento escrito libre del cliente en el <strong>Paso 1</strong>.</li>
            <li>Extraer automáticamente estimaciones de racks, densidad en kW y nivel Rated TIA-942.</li>
            <li>Completar y explicar cada ítem del <strong>pre-checklist TIA-942</strong> fundamentado en la norma.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
