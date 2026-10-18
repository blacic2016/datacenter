/**
 * Parámetros normativos por defecto (TIA-942-C, ASHRAE TC 9.9, NEC).
 * Valores de referencia: deben verificarse con la copia licenciada de cada norma.
 * En producción se sobrescriben con la tabla `normative_parameters`.
 */
export interface NormativeParams {
  frontAisleMinM: number;
  rearAisleMinM: number;
  raisedFloorHeightWhenTallM: number;
  tallRoomThresholdM: number;
  rackUnitM: number;
  rackBaseAndTopM: number;
  rackPlannedUnits: number;
  trayClearanceAboveRackM: number;
  trayGapM: number;
  lightingClearanceM: number;
  doorMinWidthM: number;
  doorMinHeightM: number;
  floorLoadMinKpa: number;
  wattsToBtu: number;
  btuPerTon: number;
  btuPerPerson: number;
  upsEfficiency: number;
  upsMaxUtilization: number;
  coolingWarnUtilization: number;
  highDensityKwPerRack: number;
  breakerFactor: number;
  lightingMaintenanceFactor: number;
  lightingUtilizationFactor: number;
  minHorizontalLux: number;
  growthLow: number;
  growthHigh: number;
  /** Tabla de ampacidad de conductores de cobre [mm², A]. */
  conductorTable: [number, number][];
}

export const DEFAULT_PARAMS: NormativeParams = {
  frontAisleMinM: 1.0,
  rearAisleMinM: 0.6,
  raisedFloorHeightWhenTallM: 0.3,
  tallRoomThresholdM: 3.0,
  rackUnitM: 0.04445,
  rackBaseAndTopM: 0.1,
  rackPlannedUnits: 45,
  trayClearanceAboveRackM: 0.4,
  trayGapM: 0.15,
  lightingClearanceM: 0.4,
  doorMinWidthM: 1.0,
  doorMinHeightM: 2.13,
  floorLoadMinKpa: 7.2,
  wattsToBtu: 3.412,
  btuPerTon: 12000,
  btuPerPerson: 400,
  upsEfficiency: 0.95,
  upsMaxUtilization: 0.8,
  coolingWarnUtilization: 0.8,
  highDensityKwPerRack: 8,
  breakerFactor: 1.25,
  lightingMaintenanceFactor: 0.8,
  lightingUtilizationFactor: 0.6,
  minHorizontalLux: 500,
  growthLow: 0.25,
  growthHigh: 0.5,
  conductorTable: [
    [1.5, 15], [2.5, 21], [4, 28], [6, 36], [10, 50], [16, 68], [25, 89],
    [35, 111], [50, 134], [70, 171], [95, 207], [120, 239], [150, 275], [185, 314],
  ],
};

export function mergeParams(overrides: Partial<NormativeParams> = {}): NormativeParams {
  return { ...DEFAULT_PARAMS, ...overrides };
}
