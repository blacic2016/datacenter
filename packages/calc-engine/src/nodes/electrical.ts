import type { CalcNode, Scenario } from '../types';
import type { ItLoadResult } from './it-load';
import type { GrowthPoint } from './growth';
import type { NormativeParams } from '../params';
import { bool, mapScenario, num, str } from '../read';

const COPPER_RESISTIVITY = 0.0175; // Ω·mm²/m

export interface CircuitSizing {
  currentA: number;
  breakerA: number;
  conductorMm2: number;
  voltageDropPct: number;
}

export interface ElectricalResult {
  rackCircuit: CircuitSizing;
  mainFeed: Scenario<CircuitSizing>;
  pdus: Scenario<number>;
  outlets110: number;
  outlets220: number;
  dualFeed: boolean;
}

function dropPct(currentA: number, mm2: number, lengthM: number, voltage: number, threePhase: boolean): number {
  const k = threePhase ? Math.sqrt(3) : 2;
  return ((k * lengthM * currentA * COPPER_RESISTIVITY) / mm2 / voltage) * 100;
}

/** Selecciona el calibre por ampacidad y luego lo aumenta hasta cumplir caída de tensión. */
export function sizeCircuit(
  currentA: number, voltage: number, lengthM: number, maxDrop: number, threePhase: boolean, p: NormativeParams,
): CircuitSizing {
  const breakerA = Math.ceil(currentA * p.breakerFactor);
  const table = p.conductorTable;
  let idx = table.findIndex(([, amp]) => amp >= breakerA);
  if (idx < 0) idx = table.length - 1;
  while (idx < table.length - 1 && dropPct(currentA, table[idx]![0], lengthM, voltage, threePhase) > maxDrop) idx++;
  const mm2 = table[idx]![0];
  return { currentA, breakerA, conductorMm2: mm2, voltageDropPct: dropPct(currentA, mm2, lengthM, voltage, threePhase) };
}

export const electricalNode: CalcNode<ElectricalResult> = {
  id: 'electrical',
  inputs: ['itLoad', 'growth'],
  compute(data, deps, p) {
    const it = deps.itLoad as ItLoadResult;
    const growth = deps.growth as Scenario<GrowthPoint>;
    const voltage = num(data, 'step-04', 'voltage', 220);
    const pf = num(data, 'step-04', 'powerFactor', 0.9);
    const threePhase = str(data, 'step-04', 'phases', 'Trifásico') === 'Trifásico';
    const pue = num(data, 'step-04', 'targetPue', 1.6);
    const maxDrop = num(data, 'step-06', 'maxVoltageDropPct', 3);
    const length = num(data, 'step-06', 'circuitLengthM', 25);
    const feedLength = num(data, 'step-07', 'distanceToMainBoardM', 30);
    const dualFeed = bool(data, 'step-06', 'dualFeed', true);
    const rackA = (it.maxRackKw * 1000) / (220 * pf);
    const mainA = (kw: number) => (kw * pue * 1000) / ((threePhase ? Math.sqrt(3) : 1) * voltage * pf);
    return {
      rackCircuit: sizeCircuit(rackA, 220, length, maxDrop, false, p),
      mainFeed: mapScenario(growth, (g) => sizeCircuit(mainA(g.itKw), voltage, feedLength, maxDrop, threePhase, p)),
      pdus: mapScenario(growth, (g) => g.racks * (dualFeed ? 2 : 1)),
      outlets110: num(data, 'step-06', 'outlets110', 2) * it.rackCount,
      outlets220: num(data, 'step-06', 'outlets220', 1) * it.rackCount,
      dualFeed,
    };
  },
};
