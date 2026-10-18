import { type FieldGroup, opts } from '../field.types';

export const CLOSING_STEPS: Record<string, FieldGroup[]> = {
  'step-13': [
    {
      title: 'Parámetros comerciales',
      fields: [
        { key: 'currency', label: 'Moneda', type: 'select', options: opts('USD', 'EUR', 'PEN', 'COP', 'MXN'), defaultValue: 'USD' },
        { key: 'laborPct', label: 'Mano de obra', type: 'number', unit: '%', defaultValue: 20 },
        { key: 'marginPct', label: 'Margen', type: 'number', unit: '%', defaultValue: 25 },
        { key: 'taxPct', label: 'Impuestos', type: 'number', unit: '%', defaultValue: 12 },
        { key: 'pricingScenario', label: 'Escenario a cotizar', type: 'select', options: opts('Base', '+25 %', '+50 %'), defaultValue: 'Base' },
      ],
    },
  ],
  'step-14': [
    {
      title: 'Contenido de la propuesta',
      fields: [
        { key: 'sections', label: 'Secciones', type: 'checklist',
          items: ['Portada', 'Resumen ejecutivo', 'Cumplimiento TIA-942', 'Cálculos', 'Planos 2D', 'Vistas 3D', 'Lista de materiales y precios', 'Anexo fotográfico'] },
        { key: 'executiveSummary', label: 'Resumen ejecutivo', type: 'textarea' },
        { key: 'validityDays', label: 'Validez de la oferta', type: 'number', unit: 'días', defaultValue: 30 },
      ],
    },
  ],
  'step-15': [
    {
      title: 'Diseño 2D / 3D',
      description: 'El plano 2D se genera desde el Paso 3. La vista 3D sincronizada se habilita en la fase F9.',
      fields: [
        { key: 'layoutOrientation', label: 'Orientación de filas', type: 'select', options: opts('Paralela al largo', 'Paralela al ancho') },
        { key: 'designNotes', label: 'Notas de diseño', type: 'textarea' },
      ],
    },
  ],
  'step-16': [
    {
      title: 'Cierre',
      fields: [
        { key: 'finalObservations', label: 'Observaciones finales', type: 'textarea' },
        { key: 'approvedBy', label: 'Aprobado por', type: 'text' },
        { key: 'issueVersion', label: 'Emitir versión final', type: 'boolean' },
      ],
    },
  ],
};
