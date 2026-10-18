import type { Diagnostic } from '@daedalous/shared';
import type { NormativeParams } from './params';

/** Datos del proyecto: un objeto por paso (`step-00` … `step-16`). */
export type ProjectData = Record<string, Record<string, unknown> | undefined>;

export type NodeResults = Record<string, unknown>;

export interface CalcNode<O = unknown> {
  id: string;
  /** Nodos de los que depende (deben evaluarse antes). */
  inputs: string[];
  compute(data: ProjectData, deps: NodeResults, params: NormativeParams): O;
}

export interface LimitRule {
  id: string;
  stepKey: string;
  ref: string;
  check(r: NodeResults, data: ProjectData, params: NormativeParams): Omit<Diagnostic, 'ruleId' | 'stepKey' | 'ref'> | null;
}

export interface Scenario<T> {
  base: T;
  g25: T;
  g50: T;
}

export interface EngineOutput {
  results: NodeResults;
  diagnostics: Diagnostic[];
  compliance: Record<string, number | null>;
}
