import type { FieldGroup } from './field.types';
import { CIVIL_STEPS } from './defs/civil';
import { MECHANICAL_STEPS } from './defs/mechanical';
import { ELECTRICAL_STEPS } from './defs/electrical';
import { SPECIAL_STEPS } from './defs/special';
import { CLOSING_STEPS } from './defs/closing';

export type StepKind = 'general' | 'space' | 'fields';

export interface StepMeta {
  key: string;
  number: number;
  title: string;
  subsystem: 'General' | 'Arquitectura' | 'Telecomunicaciones' | 'Eléctrico' | 'Mecánico' | 'Seguridad' | 'Comercial';
  description: string;
  dependsOn: string[];
  kind: StepKind;
  groups: FieldGroup[];
}

type StepBase = Omit<StepMeta, 'groups'>;

const BASE: StepBase[] = [
  { key: 'step-00', number: 0, title: 'Datos generales', subsystem: 'General', kind: 'general', dependsOn: [],
    description: 'Datos primarios del proyecto y cliente. Inmutables tras la creación.' },
  { key: 'step-01', number: 1, title: 'Levantamiento físico', subsystem: 'General', kind: 'fields', dependsOn: ['step-00'],
    description: 'Requerimiento escrito, registro fotográfico y pre-checklist TIA-942.' },
  { key: 'step-02', number: 2, title: 'Edificación y obra civil', subsystem: 'Arquitectura', kind: 'fields', dependsOn: ['step-01'],
    description: 'Dimensiones, áreas TIA-942, piso técnico y adecuaciones civiles.' },
  { key: 'step-03', number: 3, title: 'Planeamiento del espacio', subsystem: 'Telecomunicaciones', kind: 'space', dependsOn: ['step-02'],
    description: 'Racks, inventario de equipos, pasillos y crecimiento 25 % / 50 %.' },
  { key: 'step-04', number: 4, title: 'Carga eléctrica', subsystem: 'Eléctrico', kind: 'fields', dependsOn: ['step-03'],
    description: 'Análisis de carga IT y no-IT, factor de potencia y escenarios.' },
  { key: 'step-05', number: 5, title: 'Climatización y canalizaciones', subsystem: 'Mecánico', kind: 'fields', dependsOn: ['step-03', 'step-04'],
    description: 'Carga térmica, equipos de aire, contención y bandejas.' },
  { key: 'step-06', number: 6, title: 'Requerimiento eléctrico y redundancia', subsystem: 'Eléctrico', kind: 'fields', dependsOn: ['step-04'],
    description: 'Tomas por rack, alimentación A/B y calibre de conductores.' },
  { key: 'step-07', number: 7, title: 'Diseño eléctrico', subsystem: 'Eléctrico', kind: 'fields', dependsOn: ['step-06'],
    description: 'Acometidas, unifilares, tableros, PDUs y puesta a tierra.' },
  { key: 'step-08', number: 8, title: 'UPS', subsystem: 'Eléctrico', kind: 'fields', dependsOn: ['step-07'],
    description: 'Topología, capacidad, autonomía y redundancia de UPS.' },
  { key: 'step-09', number: 9, title: 'Detección y extinción de incendios', subsystem: 'Seguridad', kind: 'fields', dependsOn: ['step-03'],
    description: 'Tecnología de detección, agente extintor y cobertura.' },
  { key: 'step-10', number: 10, title: 'Iluminación', subsystem: 'Arquitectura', kind: 'fields', dependsOn: ['step-03'],
    description: 'Niveles de iluminación, luminarias y emergencia.' },
  { key: 'step-11', number: 11, title: 'Videovigilancia y control de acceso', subsystem: 'Seguridad', kind: 'fields', dependsOn: ['step-03'],
    description: 'Cámaras, NVR, control de acceso y sala de monitoreo.' },
  { key: 'step-12', number: 12, title: 'Monitoreo (Zabbix)', subsystem: 'Seguridad', kind: 'fields', dependsOn: ['step-04', 'step-05', 'step-08'],
    description: 'Sensores ambientales, PDUs monitoreables e integración Zabbix.' },
  { key: 'step-13', number: 13, title: 'Precios', subsystem: 'Comercial', kind: 'fields', dependsOn: ['step-02', 'step-12'],
    description: 'Lista de materiales, mano de obra y márgenes.' },
  { key: 'step-14', number: 14, title: 'Propuesta PDF', subsystem: 'Comercial', kind: 'fields', dependsOn: ['step-13'],
    description: 'Contenido y generación de la propuesta en PDF.' },
  { key: 'step-15', number: 15, title: 'Diseño 2D / 3D', subsystem: 'Telecomunicaciones', kind: 'fields', dependsOn: ['step-03'],
    description: 'Plano 2D sincronizado con vista 3D.' },
  { key: 'step-16', number: 16, title: 'Cierre y observaciones', subsystem: 'Comercial', kind: 'fields', dependsOn: ['step-14', 'step-15'],
    description: 'Guardado final, observaciones y emisión de la versión.' },
];

const GROUPS: Record<string, FieldGroup[]> = {
  ...CIVIL_STEPS,
  ...MECHANICAL_STEPS,
  ...ELECTRICAL_STEPS,
  ...SPECIAL_STEPS,
  ...CLOSING_STEPS,
};

export const STEPS: StepMeta[] = BASE.map((s) => ({ ...s, groups: GROUPS[s.key] ?? [] }));

export const STEP_KEYS = STEPS.map((s) => s.key);

export function getStep(key: string): StepMeta | undefined {
  return STEPS.find((s) => s.key === key);
}

/** Pasos que dependen (directa o indirectamente) de `key`. */
export function downstreamOf(key: string): string[] {
  const result = new Set<string>();
  const visit = (k: string) => {
    for (const s of STEPS) {
      if (s.dependsOn.includes(k) && !result.has(s.key)) {
        result.add(s.key);
        visit(s.key);
      }
    }
  };
  visit(key);
  return [...result];
}
