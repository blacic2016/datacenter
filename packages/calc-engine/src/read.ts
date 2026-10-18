import type { ProjectData, Scenario } from './types';

/** Lee un número de un paso con valor por defecto. */
export function num(data: ProjectData, step: string, key: string, fallback: number): number {
  const raw = data[step]?.[key];
  const value = typeof raw === 'string' ? Number(raw) : raw;
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function str(data: ProjectData, step: string, key: string, fallback: string): string {
  const raw = data[step]?.[key];
  return typeof raw === 'string' && raw.length > 0 ? raw : fallback;
}

export function bool(data: ProjectData, step: string, key: string, fallback: boolean): boolean {
  const raw = data[step]?.[key];
  return typeof raw === 'boolean' ? raw : fallback;
}

export function hasStep(data: ProjectData, step: string): boolean {
  const d = data[step];
  return !!d && Object.keys(d).length > 0;
}

export const round = (v: number, decimals = 2): number => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

/** Aplica una función a los tres escenarios de crecimiento. */
export function mapScenario<A, B>(s: Scenario<A>, fn: (v: A) => B): Scenario<B> {
  return { base: fn(s.base), g25: fn(s.g25), g50: fn(s.g50) };
}

/** Unidades adicionales requeridas según redundancia. */
export function withRedundancy(n: number, redundancy: string): number {
  if (n <= 0) return 0;
  if (redundancy === '2N') return n * 2;
  if (redundancy === 'N+1') return n + 1;
  return n;
}
