import { describe, it, expect } from 'vitest';
import { defaultEngine } from '../src/engine';
import type { ProjectData } from '../src/types';

describe('CalcEngine - Reactividad y Límites', () => {
  it('Calcula correctamente carga IT, BTU, UPS y espacio', () => {
    const data: ProjectData = {
      'step-00': { ratedTarget: 3 },
      'step-02': { lengthM: 10, widthM: 8, clearHeightM: 3.6, raisedFloor: 'Sí', raisedFloorHeightM: 0.3 },
      'step-03': {
        racks: [
          {
            id: 'rack-1',
            name: 'RACK-01',
            units: 42,
            row: 1,
            position: 1,
            equipment: [
              { id: 'srv-1', name: 'Servidor 2U', units: 2, watts: 500, powerSupplies: 2, quantity: 4 },
            ],
          },
        ],
        frontAisleM: 1.2,
        rearAisleM: 1.0,
        simultaneityFactor: 0.8,
      },
      'step-04': { voltage: '220', powerFactor: 0.9, nonItLoadKw: 1.0 },
      'step-05': { unitCapacityKw: 15, installedUnits: 2, coolingRedundancy: 'N+1' },
      'step-06': { dualFeed: true },
      'step-08': { upsCapacityKva: 20, upsUnits: 1, upsRedundancy: 'N' },
    };

    const out = defaultEngine.run(data);
    const itLoad: any = out.results.itLoad;
    expect(itLoad.rackCount).toBe(1);
    // 4 servidores * 500W = 2000W nominal * 0.8 simultaneidad = 1600W (1.6 kW)
    expect(itLoad.totalKw).toBe(1.6);

    const thermal: any = out.results.thermal;
    expect(thermal.base.heatKw).toBeGreaterThan(1.6); // IT + UPS loss + nonIt
    expect(thermal.base.btuH).toBeGreaterThan(5000);

    const room: any = out.results.room;
    expect(room.areaM2).toBe(80);

    // Debe validar sin errores bloqueantes
    const blocking = out.diagnostics.filter((d) => d.severity === 'blocking');
    expect(blocking.length).toBe(0);
  });

  it('Detecta violación de pasillo y falta de redundancia en Rated 3', () => {
    const data: ProjectData = {
      'step-00': { ratedTarget: 3 },
      'step-03': {
        racks: [{ id: 'r1', name: 'R1', units: 42, row: 1, position: 1, equipment: [] }],
        frontAisleM: 0.8, // Menor que 1.0m mínimo
        rearAisleM: 0.4,  // Menor que 0.6m mínimo
      },
      'step-06': { dualFeed: false }, // En Rated 3 requiere alimentación dual
    };

    const out = defaultEngine.run(data);
    const blocking = out.diagnostics.filter((d) => d.severity === 'blocking');
    expect(blocking.some((d) => d.ruleId === 'SPC-001')).toBe(true);
    expect(blocking.some((d) => d.ruleId === 'PWR-001')).toBe(true);
  });
});
