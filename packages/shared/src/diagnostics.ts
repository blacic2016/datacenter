export type Severity = 'info' | 'warning' | 'error' | 'blocking';

export interface Diagnostic {
  ruleId: string;
  stepKey: string;
  severity: Severity;
  message: string;
  ref: string;
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  info: 'Información',
  warning: 'Advertencia',
  error: 'Error',
  blocking: 'Bloqueante',
};

/** Penalización por severidad para el score de cumplimiento (0–100). */
export const SEVERITY_PENALTY: Record<Severity, number> = {
  info: 0,
  warning: 10,
  error: 30,
  blocking: 60,
};
