export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'date' | 'checklist';

export interface FieldOption {
  value: string;
  label: string;
}

/** Definición declarativa de un campo de formulario de un paso del asistente. */
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: FieldOption[];
  /** Para type = 'checklist': ítems a evaluar (aplica / estado / observación). */
  items?: string[];
  help?: string;
  defaultValue?: string | number | boolean;
}

export interface FieldGroup {
  title: string;
  description?: string;
  fields: FieldDef[];
}

export const opts = (...values: string[]): FieldOption[] =>
  values.map((v) => ({ value: v, label: v }));
