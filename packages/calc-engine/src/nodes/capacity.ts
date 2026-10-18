import type { CalcNode, Scenario } from '../types';
import type { GrowthPoint, ThermalPoint } from './growth';
import { mapScenario, num, str, withRedundancy } from '../read';

export interface CoolingPoint {
  requiredUnits: number;
  effectiveCapacityKw: number;
  utilization: number;
}

export interface CoolingResult {
  unitCapacityKw: number;
  installedUnits: number;
  redundancy: string;
  scenarios: Scenario<CoolingPoint>;
}

/** Capacidad útil descontando unidades de respaldo. */
function effectiveUnits(installed: number, redundancy: string): number {
  if (redundancy === '2N') return Math.floor(installed / 2);
  if (redundancy === 'N+1') return Math.max(installed - 1, 0);
  return installed;
}

export const coolingNode: CalcNode<CoolingResult> = {
  id: 'cooling',
  inputs: ['thermal'],
  compute(data, deps) {
    const thermal = deps.thermal as Scenario<ThermalPoint>;
    const unitCapacityKw = num(data, 'step-05', 'unitCapacityKw', 20);
    const installedUnits = num(data, 'step-05', 'installedUnits', 0);
    const redundancy = str(data, 'step-05', 'coolingRedundancy', 'N+1');
    const capacity = effectiveUnits(installedUnits, redundancy) * unitCapacityKw;
    const scenarios = mapScenario(thermal, (t) => ({
      requiredUnits: withRedundancy(Math.ceil(t.heatKw / unitCapacityKw), redundancy),
      effectiveCapacityKw: capacity,
      utilization: capacity > 0 ? t.heatKw / capacity : Infinity,
    }));
    return { unitCapacityKw, installedUnits, redundancy, scenarios };
  },
};

export interface UpsPoint {
  requiredKva: number;
  utilization: number;
}

export interface UpsResult {
  installedKva: number;
  effectiveKva: number;
  autonomyMin: number;
  scenarios: Scenario<UpsPoint>;
}

export const upsNode: CalcNode<UpsResult> = {
  id: 'ups',
  inputs: ['growth'],
  compute(data, deps, p) {
    const growth = deps.growth as Scenario<GrowthPoint>;
    const pf = num(data, 'step-04', 'powerFactor', 0.9);
    const unitKva = num(data, 'step-08', 'upsCapacityKva', 0);
    const units = num(data, 'step-08', 'upsUnits', 1);
    const redundancy = str(data, 'step-08', 'upsRedundancy', 'N');
    const effectiveKva = effectiveUnits(units, redundancy) * unitKva;
    const scenarios = mapScenario(growth, (g) => ({
      requiredKva: g.itKw / pf / p.upsMaxUtilization,
      utilization: effectiveKva > 0 ? g.itKw / pf / effectiveKva : Infinity,
    }));
    return { installedKva: unitKva * units, effectiveKva, autonomyMin: num(data, 'step-08', 'autonomyMin', 15), scenarios };
  },
};
