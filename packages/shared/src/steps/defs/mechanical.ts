import { type FieldGroup, opts } from '../field.types';

export const MECHANICAL_STEPS: Record<string, FieldGroup[]> = {
  'step-05': [
    {
      title: 'Equipos de climatización',
      fields: [
        { key: 'coolingType', label: 'Tipo de equipo', type: 'select',
          options: opts('Precisión perimetral (CRAC)', 'CRAH agua helada', 'In-row', 'Confort (no recomendado)') },
        { key: 'unitCapacityKw', label: 'Capacidad por unidad', type: 'number', unit: 'kW', min: 1, step: 0.5, defaultValue: 20 },
        { key: 'installedUnits', label: 'Unidades instaladas / proyectadas', type: 'number', min: 0, defaultValue: 2 },
        { key: 'coolingRedundancy', label: 'Redundancia', type: 'select', options: opts('N', 'N+1', '2N'), defaultValue: 'N+1' },
        { key: 'peopleInRoom', label: 'Personas habituales en sala', type: 'number', min: 0, defaultValue: 1 },
        { key: 'clusters', label: 'Requiere clusters de alta densidad', type: 'boolean' },
      ],
    },
    {
      title: 'Canalizaciones',
      description: 'Eléctrica bajo piso técnico; datos y fibra sobre racks si la altura lo permite.',
      fields: [
        { key: 'copperTray', label: 'Bandeja de cobre sobre racks', type: 'boolean', defaultValue: true },
        { key: 'fiberTray', label: 'Bandeja de fibra sobre racks', type: 'boolean', defaultValue: true },
        { key: 'trayHeightM', label: 'Alto de cada bandeja', type: 'number', unit: 'm', step: 0.01, defaultValue: 0.15 },
        { key: 'powerUnderFloor', label: 'Canalización eléctrica bajo piso', type: 'boolean', defaultValue: true },
        { key: 'condensateTray', label: 'Bandeja de condensado bajo equipos', type: 'boolean', defaultValue: true },
      ],
    },
  ],
};
