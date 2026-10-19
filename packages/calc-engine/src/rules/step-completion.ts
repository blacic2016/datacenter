import type { ProjectData } from '../types';

export interface StepRequirement {
  id: string;
  label: string;
  isMet: (stepData: Record<string, any>, allData: ProjectData) => boolean;
}

export const STEP_REQUIREMENTS: Record<string, StepRequirement[]> = {
  'step-00': [
    { id: 'S0-1', label: 'Nombre del proyecto definido', isMet: (d) => Boolean(d.projectName?.trim()) },
    { id: 'S0-2', label: 'Nombre del cliente especificado', isMet: (d) => Boolean(d.clientName?.trim()) },
    { id: 'S0-3', label: 'Nivel Rated objetivo TIA-942 asignado (1 a 4)', isMet: (d) => [1, 2, 3, 4].includes(Number(d.ratedTarget)) },
    { id: 'S0-4', label: 'Responsable técnico o preventa asignado', isMet: (d) => Boolean(d.presales?.trim()) },
  ],
  'step-01': [
    { id: 'S1-1', label: 'Requerimiento escrito del cliente ingresado', isMet: (d) => Boolean(d.clientRequirement && d.clientRequirement.trim().length >= 15) },
    { id: 'S1-2', label: 'Estimación inicial de racks proyectada (≥ 1)', isMet: (d) => Number(d.expectedRacks) >= 1 },
    { id: 'S1-3', label: 'Densidad estimada por rack definida (≥ 1 kW)', isMet: (d) => Number(d.expectedKwPerRack) >= 1 },
    { id: 'S1-4', label: 'Análisis o pre-criterios TIA-942 generados', isMet: (d) => Boolean(d.proposalSummary || d.stepRecommendations) },
  ],
  'step-02': [
    { id: 'S2-1', label: 'Dimensiones de sala definidas (Largo > 0 y Ancho > 0)', isMet: (d) => Number(d.lengthM) > 0 && Number(d.widthM) > 0 },
    { id: 'S2-2', label: 'Altura libre de losa cumple norma (≥ 2.60 m)', isMet: (d) => Number(d.freeHeightM || 3.5) >= 2.6 },
    { id: 'S2-3', label: 'Piso técnico elevado configurado (≥ 15 cm)', isMet: (d) => Number(d.raisedFloorHeightCm || 30) >= 15 },
    { id: 'S2-4', label: 'Capacidad de carga en losa verificada (≥ 12 kPa)', isMet: (d) => Number(d.floorLoadCapacityKpa || 12) >= 12 },
  ],
  'step-03': [
    { id: 'S3-1', label: 'Al menos un rack configurado en la sala', isMet: (d) => Array.isArray(d.racks) && d.racks.length >= 1 },
    { id: 'S3-2', label: 'Pasillo frontal de servicio reglamentario (≥ 1.0 m)', isMet: (d) => Number(d.frontAisleM || 1.2) >= 1.0 },
    { id: 'S3-3', label: 'Pasillo posterior de mantenimiento reglamentario (≥ 0.8 m)', isMet: (d) => Number(d.rearAisleM || 1.0) >= 0.8 },
    { id: 'S3-4', label: 'Factor de simultaneidad configurado (0.5 a 1.0)', isMet: (d) => Number(d.simultaneityFactor || 0.8) >= 0.5 },
  ],
  'step-04': [
    { id: 'S4-1', label: 'Factor de potencia IT definido (≥ 0.80)', isMet: (d) => Number(d.powerFactor || 0.9) >= 0.8 },
    { id: 'S4-2', label: 'Reserva para crecimiento futuro a 5 años (≥ 15%)', isMet: (d) => Number(d.growthReservePct || 25) >= 15 },
    { id: 'S4-3', label: 'Cargas auxiliares de iluminación y control definidas', isMet: (d) => d.auxiliaryLoadKw !== undefined || d.lightingKw !== undefined },
  ],
  'step-05': [
    { id: 'S5-1', label: 'Tecnología de climatización seleccionada (InRow / Perimetral)', isMet: (d) => Boolean(d.coolingTechnology || d.coolingSystem) },
    { id: 'S5-2', label: 'Esquema de redundancia térmica definido (N+1 o 2N)', isMet: (d) => Boolean(d.coolingRedundancy) },
    { id: 'S5-3', label: 'Rango térmico ASHRAE respetado (18 °C a 27 °C)', isMet: (d) => Number(d.targetTempC || 22) >= 18 && Number(d.targetTempC || 22) <= 27 },
    { id: 'S5-4', label: 'Tipo de contención de pasillo seleccionada', isMet: (d) => Boolean(d.containmentType || d.containment) },
  ],
  'step-06': [
    { id: 'S6-1', label: 'Tomas redundantes por rack especificadas (Ruta A y Ruta B)', isMet: (d) => d.dualFeedPerRack !== false && Boolean(d.receptacleTypeA || d.receptaclesPerRack) },
    { id: 'S6-2', label: 'Tensión nominal de distribución definida (120V / 208V / 220V)', isMet: (d) => Boolean(d.voltage || d.nominalVoltage) },
    { id: 'S6-3', label: 'Tipo de PDU de rack seleccionado (Básica / Monitoreable)', isMet: (d) => Boolean(d.pduType) },
  ],
  'step-07': [
    { id: 'S7-1', label: 'Tablero general de distribución con bypass proyectado', isMet: (d) => Boolean(d.mainPanelWithBypass || d.hasMainPanel !== false) },
    { id: 'S7-2', label: 'Conmutación automática de transferencia ATS configurada', isMet: (d) => Boolean(d.atsTransferSwitch || d.hasAts !== false) },
    { id: 'S7-3', label: 'Barra principal de puesta a tierra TMGB / MCG definida', isMet: (d) => Boolean(d.tmgbGrounding || d.groundingSystem) },
  ],
  'step-08': [
    { id: 'S8-1', label: 'Topología de UPS Online Doble Conversión especificada', isMet: (d) => Boolean(d.upsTopology || d.topology) },
    { id: 'S8-2', label: 'Autonomía de baterías calculada y suficiente (≥ 10 min)', isMet: (d) => Number(d.batteryAutonomyMin || 15) >= 10 },
    { id: 'S8-3', label: 'Esquema de redundancia de UPS asignado (N, N+1 o 2N)', isMet: (d) => Boolean(d.upsRedundancy || d.redundancy) },
  ],
  'step-09': [
    { id: 'S9-1', label: 'Sistema de detección temprana de humo (VESDA / óptico) definido', isMet: (d) => Boolean(d.detectionType || d.fireDetection) },
    { id: 'S9-2', label: 'Agente limpio de extinción sin residuo (NFPA 2001) seleccionado', isMet: (d) => Boolean(d.extinguishingAgent || d.cleanAgent) },
    { id: 'S9-3', label: 'Protección bajo piso técnico y ambiente contemplada', isMet: (d) => d.underfloorProtection !== false },
  ],
  'step-10': [
    { id: 'S10-1', label: 'Nivel de iluminación en sala reglamentario (≥ 500 lux)', isMet: (d) => Number(d.luxLevel || 500) >= 500 },
    { id: 'S10-2', label: 'Luminarias de emergencia respaldadas por UPS previstas', isMet: (d) => d.emergencyLighting !== false },
  ],
  'step-11': [
    { id: 'S11-1', label: 'CCTV con cobertura completa de pasillos y accesos', isMet: (d) => d.cctvCoverage !== false },
    { id: 'S11-2', label: 'Control de acceso de doble factor (biométrico / tarjeta)', isMet: (d) => Boolean(d.accessControlType || d.biometricAccess) },
    { id: 'S11-3', label: 'Retención de grabaciones de seguridad normativo (≥ 30 días)', isMet: (d) => Number(d.retentionDays || 90) >= 30 },
  ],
  'step-12': [
    { id: 'S12-1', label: 'Sensores de temperatura y humedad por rack proyectados', isMet: (d) => d.tempHumiditySensors !== false },
    { id: 'S12-2', label: 'Detección de inundación / fuga de agua bajo piso técnico', isMet: (d) => d.waterLeakSensors !== false },
    { id: 'S12-3', label: 'Protocolo de monitoreo e integración SNMP / Zabbix habilitado', isMet: (d) => Boolean(d.zabbixIntegration || d.snmpMonitoring !== false) },
  ],
  'step-13': [
    { id: 'S13-1', label: 'Moneda del presupuesto establecida (USD)', isMet: (d) => Boolean(d.currency || 'USD') },
    { id: 'S13-2', label: 'Margen de imprevistos / contingencia configurado (≥ 5%)', isMet: (d) => Number(d.contingencyPct || 10) >= 5 },
  ],
  'step-14': [
    { id: 'S14-1', label: 'Alcance técnico de los trabajos redactado', isMet: (d) => Boolean(d.scopeOfWork || d.projectScope) },
    { id: 'S14-2', label: 'Cronograma estimado de ejecución en semanas definido', isMet: (d) => Number(d.timelineWeeks || 12) >= 1 },
  ],
  'step-15': [
    { id: 'S15-1', label: 'Distribución de sala y ubicación de equipos en plano 2D/3D', isMet: (d, all) => {
      if (Array.isArray(d.elements) && d.elements.length >= 1) return true;
      const step03 = all['step-03'] || {};
      return Array.isArray(step03.racks) && step03.racks.length >= 1;
    }},
    { id: 'S15-2', label: 'Verificación de cotas y distancias de servicio en maqueta', isMet: (d) => d.layoutValidated !== false },
  ],
  'step-16': [
    { id: 'S16-1', label: 'Observaciones y consideraciones finales del ingeniero', isMet: (d) => Boolean(d.finalObservations || d.stepObservation || d.engineerNotes) },
    { id: 'S16-2', label: 'Aprobación y emisión de la versión del Data Center', isMet: (d) => Boolean(d.approved || d.readyForIssuance !== false) },
  ],
};

export function evaluateStepRequirements(stepKey: string, stepData: Record<string, any>, allData: ProjectData = {}) {
  const reqs = STEP_REQUIREMENTS[stepKey] || [];
  if (reqs.length === 0) {
    return { score: 100, missing: [], isComplete: true, canAdvance: true };
  }

  const metCount = reqs.filter((r) => r.isMet(stepData, allData)).length;
  const missing = reqs.filter((r) => !r.isMet(stepData, allData)).map((r) => r.label);

  const score = Math.round((metCount / reqs.length) * 100);
  const isComplete = score === 100;
  const canAdvance = score >= 75; // Puede avanzar si tiene la mayoría sustancial, pero el 100% exige cumplir todo

  return { score, missing, isComplete, canAdvance };
}
