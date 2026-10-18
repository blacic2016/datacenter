import { type FieldGroup, opts } from '../field.types';

const YES_NO = opts('Sí', 'No', 'No aplica');

export const CIVIL_STEPS: Record<string, FieldGroup[]> = {
  'step-01': [
    {
      title: 'Requerimiento escrito del cliente',
      fields: [
        { key: 'clientRequirement', label: 'Requerimiento del cliente', type: 'textarea', required: true,
          help: 'Describa necesidades, cargas esperadas, nivel de disponibilidad y restricciones.' },
        { key: 'expectedRacks', label: 'Racks esperados', type: 'number', min: 1, defaultValue: 4 },
        { key: 'expectedKwPerRack', label: 'Densidad esperada por rack', type: 'number', unit: 'kW', min: 0, step: 0.5, defaultValue: 5 },
        { key: 'growthHorizonYears', label: 'Horizonte de crecimiento', type: 'number', unit: 'años', min: 1, defaultValue: 5 },
      ],
    },
    {
      title: 'Registro fotográfico',
      description: 'Indique las áreas fotografiadas (la carga de imágenes se habilita en la siguiente fase).',
      fields: [
        { key: 'photoAreas', label: 'Áreas fotografiadas', type: 'checklist',
          items: ['Sala de cómputo', 'Acometida eléctrica', 'Tablero principal', 'Techo / losa', 'Piso', 'Accesos', 'Exteriores'] },
        { key: 'photoNotes', label: 'Observaciones del registro', type: 'textarea' },
      ],
    },
    {
      title: 'Propuesta base y pre-checklist TIA-942',
      fields: [
        { key: 'proposalSummary', label: 'Propuesta basada en el requerimiento', type: 'textarea' },
        { key: 'precheck', label: 'Pre-checklist', type: 'checklist',
          items: ['Ubicación alejada de riesgos de inundación', 'Acceso controlado al edificio', 'Disponibilidad de acometida eléctrica',
            'Ruta de entrada de proveedores de telecomunicaciones', 'Capacidad estructural de losa', 'Espacio para cuartos de soporte'] },
      ],
    },
  ],
  'step-02': [
    {
      title: 'Dimensiones del espacio',
      fields: [
        { key: 'lengthM', label: 'Largo', type: 'number', unit: 'm', min: 1, step: 0.1, required: true, defaultValue: 8 },
        { key: 'widthM', label: 'Ancho', type: 'number', unit: 'm', min: 1, step: 0.1, required: true, defaultValue: 6 },
        { key: 'clearHeightM', label: 'Altura libre (piso – losa)', type: 'number', unit: 'm', min: 2, step: 0.05, required: true, defaultValue: 3.5 },
        { key: 'floorLoadKpa', label: 'Capacidad de carga de piso', type: 'number', unit: 'kPa', min: 0, defaultValue: 12 },
      ],
    },
    {
      title: 'Áreas definidas (espacios TIA-942)',
      fields: [
        { key: 'areas', label: 'Áreas requeridas', type: 'checklist',
          items: ['Cuarto de entrada (ER)', 'Área de distribución principal (MDA)', 'Área de distribución horizontal (HDA)',
            'Área de equipos (EDA)', 'Cuarto eléctrico / UPS', 'Cuarto de baterías', 'Cuarto de aires', 'Centro de monitoreo (NOC)'] },
        { key: 'separateUpsRoom', label: 'UPS en cuarto separado', type: 'select', options: YES_NO },
        { key: 'upsRoomAreaM2', label: 'Área cuarto UPS / baterías', type: 'number', unit: 'm²', min: 0, defaultValue: 0 },
      ],
    },
    {
      title: 'Piso técnico elevado',
      fields: [
        { key: 'raisedFloor', label: 'Piso técnico elevado', type: 'select', options: opts('Sí', 'No'), defaultValue: 'Sí' },
        { key: 'raisedFloorHeightM', label: 'Altura del piso técnico', type: 'number', unit: 'm', min: 0, step: 0.05, defaultValue: 0.3 },
        { key: 'tileSizeM', label: 'Baldosa', type: 'number', unit: 'm', defaultValue: 0.6, step: 0.05 },
        { key: 'pedestalAnchor', label: 'Anclaje de pedestales', type: 'select', options: opts('Adhesivo epóxico', 'Mecánico (pernos)', 'Mixto') },
      ],
    },
    {
      title: 'Adecuaciones de obra civil',
      fields: [
        { key: 'civilWorks', label: 'Trabajos requeridos', type: 'checklist',
          items: ['Impermeabilización de piso', 'Pintura antiestática en piso', 'Pintura antiestática en paredes', 'Malla antiestática / SRG',
            'Bandeja de condensados bajo aires', 'Revisión de desagües', 'Tapado de ventanas', 'Reacondicionamiento de paredes',
            'Repavimentación / resane de pisos', 'Revisión de techo', 'Retiro de mampostería', 'Resane de fisuras', 'Revisión de fugas de agua',
            'Revisión planimétrica', 'Bombas de achique (subsuelo)', 'Ductos de desagüe', 'Reforzamiento de paredes / vigas', 'Levantamiento de suelo agrietado'] },
        { key: 'architectApproval', label: 'Validado por arquitecto', type: 'boolean',
          help: 'Obligatorio para trabajos estructurales.' },
        { key: 'doorWidthM', label: 'Ancho de puerta de acceso', type: 'number', unit: 'm', step: 0.05, defaultValue: 1.0 },
        { key: 'doorHeightM', label: 'Alto de puerta de acceso', type: 'number', unit: 'm', step: 0.05, defaultValue: 2.13 },
        { key: 'accessRamp', label: 'Rampa de acceso', type: 'select', options: YES_NO },
      ],
    },
  ],
};
