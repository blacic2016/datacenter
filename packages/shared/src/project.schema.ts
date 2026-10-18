import { z } from 'zod';

/** Paso 0 – datos primarios del proyecto (inmutables tras la creación). */
export const generalDataSchema = z.object({
  projectName: z.string().trim().min(3, 'Mínimo 3 caracteres'),
  clientName: z.string().trim().min(2, 'Cliente requerido'),
  date: z.string().min(8, 'Fecha requerida'),
  presales: z.string().trim().min(2, 'Preventa requerida'),
  people: z.string().trim().default(''),
  clientManager: z.string().trim().min(2, 'Encargado del cliente requerido'),
  address: z.string().trim().min(3, 'Dirección requerida'),
  phone: z.string().trim().min(6, 'Teléfono requerido'),
  email: z.string().trim().email('Correo inválido').or(z.literal('')).default(''),
  ratedTarget: z.coerce.number().int().min(1).max(4),
  extra: z.record(z.string()).default({}),
});

export type GeneralData = z.infer<typeof generalDataSchema>;

export const projectStatusSchema = z.enum(['active', 'disabled']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const stepStatusSchema = z.enum([
  'pending', 'in_progress', 'observations', 'validated', 'blocked', 'needs_review',
]);
export type StepStatus = z.infer<typeof stepStatusSchema>;

export const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  observations: 'Con observaciones',
  validated: 'Validado',
  blocked: 'Bloqueado',
  needs_review: 'Requiere revisión',
};

export const saveStepSchema = z.object({
  data: z.record(z.unknown()),
  note: z.string().max(500).optional(),
});

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  clientCode: string;
  clientName: string;
  status: ProjectStatus;
  ratedTarget: number;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}
