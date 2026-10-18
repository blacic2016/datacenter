import { type FieldGroup, opts } from '../field.types';

export const ELECTRICAL_STEPS: Record<string, FieldGroup[]> = {
  'step-04': [
    {
      title: 'Parámetros eléctricos',
      fields: [
        { key: 'voltage', label: 'Tensión de distribución', type: 'select', options: opts('120', '208', '220', '380', '480'), defaultValue: '220' },
        { key: 'phases', label: 'Sistema', type: 'select', options: opts('Monofásico', 'Trifásico'), defaultValue: 'Trifásico' },
        { key: 'powerFactor', label: 'Factor de potencia', type: 'number', min: 0.7, max: 1, step: 0.01, defaultValue: 0.9 },
        { key: 'nonItLoadKw', label: 'Otras cargas no-IT (iluminación, seguridad)', type: 'number', unit: 'kW', min: 0, step: 0.1, defaultValue: 1.5 },
        { key: 'targetPue', label: 'PUE objetivo', type: 'number', min: 1, max: 3, step: 0.05, defaultValue: 1.6 },
      ],
    },
  ],
  'step-06': [
    {
      title: 'Tomas por rack y alimentación A/B',
      fields: [
        { key: 'outlets110', label: 'Tomas 110 V por rack', type: 'number', min: 0, defaultValue: 2 },
        { key: 'outlets220', label: 'Tomas 220 V por rack', type: 'number', min: 0, defaultValue: 1 },
        { key: 'dualFeed', label: 'Alimentación redundante A/B', type: 'boolean', defaultValue: true,
          help: 'Línea A alimenta la PDU-A y línea B la PDU-B; equipos con doble fuente toman energía del lado sano.' },
        { key: 'serviceOutlets', label: 'Tomas de servicio en sala', type: 'number', min: 0, defaultValue: 4 },
        { key: 'coolingElectricalRedundancy', label: 'Redundancia eléctrica de aires', type: 'select', options: opts('N', 'N+1', '2N') },
        { key: 'maxVoltageDropPct', label: 'Caída de tensión máxima del circuito', type: 'number', unit: '%', step: 0.5, defaultValue: 3 },
        { key: 'circuitLengthM', label: 'Longitud típica de circuito', type: 'number', unit: 'm', min: 1, defaultValue: 25 },
      ],
    },
  ],
  'step-07': [
    {
      title: 'Acometidas y tableros',
      fields: [
        { key: 'mainFeedInfo', label: 'Acometida eléctrica existente', type: 'textarea' },
        { key: 'groundFeedInfo', label: 'Acometida / sistema de tierra', type: 'textarea' },
        { key: 'distanceToMainBoardM', label: 'Distancia al tablero principal', type: 'number', unit: 'm', min: 0, defaultValue: 30 },
        { key: 'boards', label: 'Tableros a diseñar', type: 'checklist',
          items: ['Tablero general', 'Tableros secundarios', 'Tablero de entrada UPS', 'Tablero de salida UPS', 'Tablero de aires',
            'Tablero de iluminación', 'Barra de tierra principal (TMGB)', 'Barras de tierra de telecomunicaciones (TGB)'] },
        { key: 'pduType', label: 'Tipo de PDU', type: 'select', options: opts('Básica', 'Medida', 'Monitoreable', 'Conmutada') },
        { key: 'singleLineNotes', label: 'Notas del diagrama unifilar', type: 'textarea' },
      ],
    },
  ],
  'step-08': [
    {
      title: 'Sistema UPS',
      fields: [
        { key: 'upsTopology', label: 'Topología', type: 'select',
          options: opts('Online doble conversión', 'Línea interactiva', 'Standby'), defaultValue: 'Online doble conversión' },
        { key: 'upsBrand', label: 'Marca / modelo', type: 'text' },
        { key: 'upsCapacityKva', label: 'Capacidad por UPS', type: 'number', unit: 'kVA', min: 1, defaultValue: 40 },
        { key: 'upsUnits', label: 'Cantidad de UPS', type: 'number', min: 1, defaultValue: 1 },
        { key: 'upsRedundancy', label: 'Redundancia', type: 'select', options: opts('N', 'N+1', '2N'), defaultValue: 'N' },
        { key: 'autonomyMin', label: 'Autonomía requerida', type: 'number', unit: 'min', min: 1, defaultValue: 15 },
        { key: 'maintenanceBypass', label: 'Bypass de mantenimiento', type: 'boolean', defaultValue: true },
      ],
    },
  ],
};
