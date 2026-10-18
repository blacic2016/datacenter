import type { CalcNode, Scenario } from '../types';
import type { RoomResult } from './room';
import type { ItLoadResult } from './it-load';
import type { GrowthPoint } from './growth';
import { bool, mapScenario, num } from '../read';

export interface SpaceResult {
  rackFootprintM2: number;
  racksPerRow: number;
  rowsPossible: number;
  maxRacks: number;
  fits: Scenario<boolean>;
  occupiedAreaM2: number;
}

export interface HeightResult {
  rackHeightM: number;
  requiredM: number;
  availableM: number;
  layers: { label: string; heightM: number }[];
}

export interface LightingResult {
  luminaires: number;
  lux: number;
}

const LATERAL_CLEARANCE_M = 0.9;

export const spaceNode: CalcNode<SpaceResult> = {
  id: 'space',
  inputs: ['room', 'itLoad', 'growth'],
  compute(_data, deps) {
    const room = deps.room as RoomResult;
    const it = deps.itLoad as ItLoadResult;
    const growth = deps.growth as Scenario<GrowthPoint>;
    const { rackWidthM: w, rackDepthM: d, frontAisleM: fa, rearAisleM: ra } = it.plan;
    const racksPerRow = Math.max(Math.floor((room.lengthM - 2 * LATERAL_CLEARANCE_M) / w), 0);
    const rowModule = d + (fa + ra) / 2;
    const rowsPossible = Math.max(Math.floor((room.widthM - (fa + ra) / 2) / rowModule), 0);
    const maxRacks = racksPerRow * rowsPossible;
    return {
      rackFootprintM2: w * d,
      racksPerRow,
      rowsPossible,
      maxRacks,
      fits: mapScenario(growth, (g) => g.racks <= maxRacks),
      occupiedAreaM2: it.rackCount * w * d,
    };
  },
};

/** Pila de alturas: piso técnico + rack 45U + bandejas + luminarias. */
export const heightNode: CalcNode<HeightResult> = {
  id: 'height',
  inputs: ['room'],
  compute(data, deps, p) {
    const room = deps.room as RoomResult;
    const rackHeightM = p.rackPlannedUnits * p.rackUnitM + p.rackBaseAndTopM;
    const tray = num(data, 'step-05', 'trayHeightM', 0.15);
    const copper = bool(data, 'step-05', 'copperTray', true);
    const fiber = bool(data, 'step-05', 'fiberTray', true);
    const layers = [
      { label: 'Piso técnico', heightM: room.raisedFloorM },
      { label: `Rack ${p.rackPlannedUnits}U`, heightM: rackHeightM },
      { label: 'Separación a bandeja', heightM: copper || fiber ? p.trayClearanceAboveRackM : 0 },
      { label: 'Bandeja cobre', heightM: copper ? tray : 0 },
      { label: 'Separación entre bandejas', heightM: copper && fiber ? p.trayGapM : 0 },
      { label: 'Bandeja fibra', heightM: fiber ? tray : 0 },
      { label: 'Espacio luminarias', heightM: p.lightingClearanceM },
    ].filter((l) => l.heightM > 0);
    return {
      rackHeightM,
      requiredM: layers.reduce((s, l) => s + l.heightM, 0),
      availableM: room.clearHeightM,
      layers,
    };
  },
};

export const lightingNode: CalcNode<LightingResult> = {
  id: 'lighting',
  inputs: ['room'],
  compute(data, deps, p) {
    const room = deps.room as RoomResult;
    const lux = num(data, 'step-10', 'horizontalLux', p.minHorizontalLux);
    const lumens = num(data, 'step-10', 'luminaireLumens', 4000);
    const effective = lumens * p.lightingMaintenanceFactor * p.lightingUtilizationFactor;
    return { lux, luminaires: effective > 0 ? Math.ceil((lux * room.areaM2) / effective) : 0 };
  },
};
