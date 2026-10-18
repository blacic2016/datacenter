import type { CalcNode, Scenario } from '../types';
import type { ItLoadResult } from './it-load';
import { num } from '../read';

export interface GrowthPoint {
  factor: number;
  racks: number;
  itKw: number;
  usedU: number;
}

export interface ThermalPoint {
  heatKw: number;
  btuH: number;
  tons: number;
}

/** Escenarios base, +25 % y +50 % (parámetros growthLow / growthHigh). */
export const growthNode: CalcNode<Scenario<GrowthPoint>> = {
  id: 'growth',
  inputs: ['itLoad'],
  compute(_data, deps, p) {
    const it = deps.itLoad as ItLoadResult;
    const point = (g: number): GrowthPoint => ({
      factor: g,
      racks: Math.ceil(it.rackCount * (1 + g)),
      itKw: it.totalKw * (1 + g),
      usedU: Math.ceil(it.usedU * (1 + g)),
    });
    return { base: point(0), g25: point(p.growthLow), g50: point(p.growthHigh) };
  },
};

/** Carga térmica: IT + pérdidas UPS + cargas no-IT + personas. */
export const thermalNode: CalcNode<Scenario<ThermalPoint>> = {
  id: 'thermal',
  inputs: ['growth'],
  compute(data, deps, p) {
    const growth = deps.growth as Scenario<GrowthPoint>;
    const nonItKw = num(data, 'step-04', 'nonItLoadKw', 0);
    const peopleKw = (num(data, 'step-05', 'peopleInRoom', 1) * p.btuPerPerson) / (p.wattsToBtu * 1000);
    const point = (g: GrowthPoint): ThermalPoint => {
      const upsLossKw = g.itKw * (1 / p.upsEfficiency - 1);
      const heatKw = g.itKw + upsLossKw + nonItKw + peopleKw;
      const btuH = heatKw * 1000 * p.wattsToBtu;
      return { heatKw, btuH, tons: btuH / p.btuPerTon };
    };
    return { base: point(growth.base), g25: point(growth.g25), g50: point(growth.g50) };
  },
};
