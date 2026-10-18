/** Permisos RBAC con formato `recurso:acción`. */
export const PERMISSIONS = {
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_COPY: 'project:copy',
  PROJECT_DISABLE: 'project:disable',
  STEP_EDIT: 'step:edit',
  STEP_VALIDATE: 'step:validate',
  TEMPLATE_MANAGE: 'template:manage',
  CHECKLIST_APPROVE: 'checklist:approve',
  PRICING_VIEW: 'pricing:view',
  PRICING_EDIT: 'pricing:edit',
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  NORMATIVE_MANAGE: 'normative:manage',
  REPORT_GENERATE: 'report:generate',
  SYNC_RUN: 'sync:run',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_DESCRIPTIONS: Record<PermissionCode, string> = {
  'project:create': 'Crear proyectos',
  'project:read': 'Ver proyectos',
  'project:update': 'Modificar proyectos',
  'project:delete': 'Eliminar proyectos',
  'project:copy': 'Copiar proyectos',
  'project:disable': 'Habilitar / deshabilitar proyectos',
  'step:edit': 'Editar pasos del asistente',
  'step:validate': 'Validar pasos del asistente',
  'template:manage': 'Administrar Plantilla Datacenter',
  'checklist:approve': 'Aprobar ítems del checklist',
  'pricing:view': 'Ver precios',
  'pricing:edit': 'Editar precios',
  'user:manage': 'Administrar usuarios',
  'role:manage': 'Administrar roles y permisos',
  'normative:manage': 'Administrar parámetros normativos',
  'report:generate': 'Generar reportes PDF',
  'sync:run': 'Ejecutar sincronización SQLite → PostgreSQL',
};

const ALL = Object.values(PERMISSIONS) as PermissionCode[];
const P = PERMISSIONS;

/** Roles creados por el seed inicial. */
export const DEFAULT_ROLES: { name: string; description: string; permissions: PermissionCode[] }[] = [
  { name: 'Administrador', description: 'Acceso total a la plataforma', permissions: ALL },
  {
    name: 'Gerente / Preventa',
    description: 'Crea proyectos, ve precios y genera propuestas',
    permissions: [P.PROJECT_CREATE, P.PROJECT_READ, P.PROJECT_UPDATE, P.PROJECT_COPY, P.PROJECT_DISABLE,
      P.STEP_EDIT, P.PRICING_VIEW, P.PRICING_EDIT, P.REPORT_GENERATE],
  },
  {
    name: 'Ingeniero de diseño',
    description: 'Desarrolla los pasos técnicos del diseño',
    permissions: [P.PROJECT_READ, P.PROJECT_UPDATE, P.STEP_EDIT, P.CHECKLIST_APPROVE, P.REPORT_GENERATE],
  },
  {
    name: 'Arquitecto',
    description: 'Valida obra civil y estructura',
    permissions: [P.PROJECT_READ, P.STEP_EDIT, P.STEP_VALIDATE],
  },
  {
    name: 'Revisor TIA',
    description: 'Supervisa y valida el cumplimiento TIA-942',
    permissions: [P.PROJECT_READ, P.STEP_VALIDATE, P.CHECKLIST_APPROVE],
  },
  { name: 'Visualizador', description: 'Solo lectura', permissions: [P.PROJECT_READ] },
];
