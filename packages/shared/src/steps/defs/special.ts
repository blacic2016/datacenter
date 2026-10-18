import { type FieldGroup, opts } from '../field.types';

export const SPECIAL_STEPS: Record<string, FieldGroup[]> = {
  'step-09': [
    {
      title: 'Detección',
      fields: [
        { key: 'detectionTech', label: 'Tecnología de detección', type: 'select',
          options: opts('Aspiración (VESDA)', 'Fotoeléctrica', 'Mixta') },
        { key: 'detectionZones', label: 'Zonas de detección', type: 'checklist',
          items: ['Ambiente (techo)', 'Bajo piso técnico', 'Sobre cielo falso', 'Cuarto UPS / baterías', 'Cuarto eléctrico'] },
        { key: 'controlPanelSoftware', label: 'Panel / software de control', type: 'text' },
      ],
    },
    {
      title: 'Extinción',
      fields: [
        { key: 'agent', label: 'Agente extintor', type: 'select', options: opts('Novec 1230 (FK-5-1-12)', 'FM-200 (HFC-227ea)', 'Inergen (IG-541)') },
        { key: 'dischargeDelayS', label: 'Retardo de descarga', type: 'number', unit: 's', defaultValue: 30 },
        { key: 'manualStations', label: 'Estaciones manuales', type: 'number', min: 0, defaultValue: 2 },
        { key: 'sirens', label: 'Sirenas / estrobos', type: 'number', min: 0, defaultValue: 2 },
        { key: 'pipingNotes', label: 'Tubería y boquillas', type: 'textarea' },
      ],
    },
  ],
  'step-10': [
    {
      title: 'Iluminación',
      fields: [
        { key: 'horizontalLux', label: 'Nivel horizontal', type: 'number', unit: 'lux', defaultValue: 500 },
        { key: 'verticalLux', label: 'Nivel vertical', type: 'number', unit: 'lux', defaultValue: 200 },
        { key: 'luminaireType', label: 'Tipo de luminaria', type: 'select', options: opts('Panel LED', 'Lineal LED', 'Hermética LED') },
        { key: 'luminaireLumens', label: 'Flujo por luminaria', type: 'number', unit: 'lm', defaultValue: 4000 },
        { key: 'emergencyLighting', label: 'Iluminación de emergencia', type: 'boolean', defaultValue: true },
        { key: 'overAisles', label: 'Luminarias sobre pasillos (no sobre racks)', type: 'boolean', defaultValue: true },
      ],
    },
  ],
  'step-11': [
    {
      title: 'Videovigilancia',
      fields: [
        { key: 'cameras', label: 'Cámaras', type: 'number', min: 0, defaultValue: 4 },
        { key: 'retentionDays', label: 'Retención de grabación', type: 'number', unit: 'días', defaultValue: 90 },
        { key: 'nvr', label: 'NVR / plataforma', type: 'text' },
      ],
    },
    {
      title: 'Control de acceso y monitoreo',
      fields: [
        { key: 'accessControl', label: 'Control de acceso', type: 'select', options: opts('Biométrico', 'Tarjeta', 'Biométrico + tarjeta') },
        { key: 'controlledDoors', label: 'Puertas controladas', type: 'number', min: 0, defaultValue: 2 },
        { key: 'nocDesign', label: 'Diseño de sala de monitoreo (NOC)', type: 'textarea' },
      ],
    },
  ],
  'step-12': [
    {
      title: 'Sensores y monitoreo Zabbix',
      fields: [
        { key: 'sensors', label: 'Sensores', type: 'checklist',
          items: ['Temperatura / humedad por rack', 'Detección de humo', 'Fuga de agua', 'Apertura de puertas', 'Corriente por PDU',
            'UPS vía SNMP', 'Aires vía Modbus / SNMP', 'Tableros con medidor'] },
        { key: 'zabbixServer', label: 'Servidor Zabbix', type: 'text' },
        { key: 'tempHighC', label: 'Umbral alto de temperatura', type: 'number', unit: '°C', defaultValue: 27 },
        { key: 'humidityHighPct', label: 'Umbral alto de humedad', type: 'number', unit: '%', defaultValue: 60 },
      ],
    },
  ],
};
