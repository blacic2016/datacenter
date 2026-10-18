import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Trash2, Sparkles, CheckCircle, HelpCircle } from 'lucide-react';
import { api } from '../api/client';

export const TemplatePage: React.FC = () => {
  const [template, setTemplate] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [params, setParams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'params'>('checklist');

  // Formulario nuevo ítem
  const [newItem, setNewItem] = useState({
    subsystem: 'Arquitectura',
    itemCode: '',
    question: '',
    tiaRef: 'TIA-942-C',
    minRated: 2,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getDatacenterTemplate();
      setTemplate(data.template);
      setItems(data.items || []);
      setParams(data.normativeParameters || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addTemplateItem(newItem);
      setNewItem({ subsystem: 'Arquitectura', itemCode: '', question: '', tiaRef: 'TIA-942-C', minRated: 2 });
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este ítem del checklist de la plantilla?')) return;
    try {
      await api.deleteTemplateItem(id);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={24} color="var(--color-primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
              Plantilla Datacenter (TIA-942)
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Plantilla precreada y modificable. Se autollenará en el Paso 1 mediante IA basada en el requerimiento del cliente.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'checklist' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('checklist')}
          >
            Checklist de Levantamiento ({items.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'params' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('params')}
          >
            Parámetros de Cálculo ({params.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Cargando Plantilla Datacenter...
        </div>
      ) : activeTab === 'checklist' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          {/* Listado de ítems del checklist */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Ítems del Pre-Checklist Asistido</h3>
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> Autollenado con IA habilitado
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    padding: '12px',
                    background: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-info font-mono">{it.item_code}</span>
                      <span className="badge badge-success">{it.subsystem}</span>
                      <span className="badge badge-warning">Mínimo Rated {it.min_rated}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{it.tia_ref}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>
                      {it.question}
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeleteItem(it.id)}
                    title="Eliminar ítem"
                  >
                    <Trash2 size={14} color="var(--color-danger)" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario para agregar ítem nuevo a la plantilla */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
              Agregar Nuevo Ítem a la Plantilla
            </h4>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label className="form-label">Subsistema *</label>
                <select
                  className="form-select"
                  value={newItem.subsystem}
                  onChange={(e) => setNewItem({ ...newItem, subsystem: e.target.value })}
                >
                  <option value="Arquitectura">Arquitectura</option>
                  <option value="Eléctrico">Eléctrico</option>
                  <option value="Mecánico">Mecánico</option>
                  <option value="Telecomunicaciones">Telecomunicaciones</option>
                  <option value="Seguridad">Seguridad</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Código *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ELE-04"
                  className="form-input"
                  value={newItem.itemCode}
                  onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pregunta / Requerimiento *</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  placeholder="Ej. ¿Cuenta con banco de baterías en sala separada con ventilación de hidrógeno?"
                  value={newItem.question}
                  onChange={(e) => setNewItem({ ...newItem, question: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Referencia TIA-942</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItem.tiaRef}
                  onChange={(e) => setNewItem({ ...newItem, tiaRef: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rated Mínimo Requerido</label>
                <select
                  className="form-select"
                  value={newItem.minRated}
                  onChange={(e) => setNewItem({ ...newItem, minRated: Number(e.target.value) })}
                >
                  <option value={1}>Rated 1</option>
                  <option value={2}>Rated 2</option>
                  <option value={3}>Rated 3</option>
                  <option value={4}>Rated 4</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                <Plus size={16} /> Agregar a Plantilla
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Tab de Parámetros Normativos */
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
            Parámetros Normativos de Cálculo (Seed TIA-942 / ASHRAE)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Valores de referencia para pasillos, gálibos, ampacidad de conductores y factores de potencia.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 12px' }}>Parámetro (Clave)</th>
                  <th style={{ padding: '8px 12px' }}>Valor Numérico</th>
                  <th style={{ padding: '8px 12px' }}>Unidad</th>
                  <th style={{ padding: '8px 12px' }}>Fuente Normativa</th>
                </tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p.key} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }} className="font-mono">{p.key}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '700' }} className="font-mono">{p.value}</td>
                    <td style={{ padding: '8px 12px' }}>{p.unit || '-'}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{p.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
