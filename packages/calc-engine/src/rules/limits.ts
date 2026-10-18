import type { LimitRule, NodeResults, ProjectData } from '../types';
import type { RoomResult } from '../nodes/room';
import type { ItLoadResult } from '../nodes/it-load';
import type { HeightResult, SpaceResult } from '../nodes/space';
import type { CoolingResult } from '../nodes/capacity';
import type { UpsResult } from '../nodes/capacity';
import type { ElectricalResult } from '../nodes/electrical';
import { num, bool, str, hasStep } from '../read';

export const RULES: LimitRule[] = [
  // --- Paso 02: Obra civil y dimensiones ---
  {
    id: 'CIV-001',
    stepKey: 'step-02',
    ref: 'TIA-942-C §Arquitectura (Piso técnico)',
    check(r, data, p) {
      if (!hasStep(data, 'step-02')) return null;
      const room = r.room as RoomResult;
      if (room.clearHeightM >= p.tallRoomThresholdM && (!room.hasRaisedFloor || room.raisedFloorM < p.raisedFloorHeightWhenTallM)) {
        return {
          severity: 'warning',
          message: `Con altura de sala ≥ ${p.tallRoomThresholdM} m se recomienda piso técnico de al menos ${p.raisedFloorHeightWhenTallM * 100} cm.`,
        };
      }
      return null;
    },
  },
  {
    id: 'CIV-002',
    stepKey: 'step-02',
    ref: 'TIA-942-C §Accesos',
    check(_r, data, p) {
      if (!hasStep(data, 'step-02')) return null;
      const dw = num(data, 'step-02', 'doorWidthM', 1.0);
      const dh = num(data, 'step-02', 'doorHeightM', 2.13);
      if (dw < p.doorMinWidthM || dh < p.doorMinHeightM) {
        return {
          severity: 'error',
          message: `Dimensiones de puerta (${dw}m x ${dh}m) inferiores al mínimo normativo (${p.doorMinWidthM}m x ${p.doorMinHeightM}m).`,
        };
      }
      return null;
    },
  },

  // --- Paso 03: Planeamiento del espacio ---
  {
    id: 'SPC-001',
    stepKey: 'step-03',
    ref: 'TIA-942-C §Pasillos',
    check(r, data, p) {
      if (!hasStep(data, 'step-03')) return null;
      const it = r.itLoad as ItLoadResult;
      if (it.rackCount > 0) {
        if (it.plan.frontAisleM < p.frontAisleMinM) {
          return {
            severity: 'blocking',
            message: `Pasillo frontal (${it.plan.frontAisleM} m) menor al mínimo requerido (${p.frontAisleMinM} m).`,
          };
        }
        if (it.plan.rearAisleM < p.rearAisleMinM) {
          return {
            severity: 'error',
            message: `Pasillo posterior (${it.plan.rearAisleM} m) menor al mínimo requerido (${p.rearAisleMinM} m).`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'SPC-002',
    stepKey: 'step-03',
    ref: 'TIA-942-C §Capacidad de sala',
    check(r, data) {
      if (!hasStep(data, 'step-03')) return null;
      const space = r.space as SpaceResult;
      const it = r.itLoad as ItLoadResult;
      if (it.rackCount > space.maxRacks) {
        return {
          severity: 'blocking',
          message: `Cantidad de racks (${it.rackCount}) excede la capacidad máxima calculada para la sala (${space.maxRacks} racks).`,
        };
      }
      if (!space.fits.g50) {
        return {
          severity: 'warning',
          message: 'La sala no cuenta con espacio físico suficiente para soportar la proyección de crecimiento del 50%.',
        };
      }
      return null;
    },
  },
  {
    id: 'HGT-001',
    stepKey: 'step-03',
    ref: 'TIA-942-C §Gálibo y canalizaciones',
    check(r, data) {
      if (!hasStep(data, 'step-02') && !hasStep(data, 'step-03')) return null;
      const h = r.height as HeightResult;
      if (h.availableM > 0 && h.requiredM > h.availableM) {
        return {
          severity: 'error',
          message: `La altura requerida para la pila de canalizaciones y luminarias (${h.requiredM.toFixed(2)} m) supera la altura libre de sala (${h.availableM.toFixed(2)} m). Considere ductería bajo piso.`,
        };
      }
      return null;
    },
  },

  // --- Paso 05: Climatización ---
  {
    id: 'COOL-001',
    stepKey: 'step-05',
    ref: 'TIA-942-C / ASHRAE TC 9.9',
    check(r, data) {
      if (!hasStep(data, 'step-05')) return null;
      const cooling = r.cooling as CoolingResult;
      const it = r.itLoad as ItLoadResult;
      if (it.rackCount === 0) return null;
      if (cooling.scenarios.base.utilization > 1.0) {
        return {
          severity: 'error',
          message: 'Capacidad de climatización útil insuficiente para soportar la carga térmica base.',
        };
      }
      if (cooling.scenarios.g50.utilization > 1.0) {
        return {
          severity: 'warning',
          message: 'La capacidad de aire instalada quedará sobrecargada ante el crecimiento proyectado al 50%.',
        };
      }
      return null;
    },
  },

  // --- Paso 06: Redundancia y tomas eléctricas ---
  {
    id: 'PWR-001',
    stepKey: 'step-06',
    ref: 'TIA-942-C §Redundancia Eléctrica',
    check(r, data) {
      if (!hasStep(data, 'step-06')) return null;
      const elec = r.electrical as ElectricalResult;
      const rated = num(data, 'step-00', 'ratedTarget', 2);
      if (rated >= 3 && !elec.dualFeed) {
        return {
          severity: 'blocking',
          message: `Para TIA-942 Rated ${rated} es mandatorio proveer alimentación eléctrica redundante A/B por rack.`,
        };
      }
      return null;
    },
  },

  // --- Paso 08: UPS ---
  {
    id: 'UPS-001',
    stepKey: 'step-08',
    ref: 'TIA-942-C §Respaldo de Energía',
    check(r, data) {
      if (!hasStep(data, 'step-08')) return null;
      const ups = r.ups as UpsResult;
      const it = r.itLoad as ItLoadResult;
      if (it.rackCount === 0) return null;
      if (ups.scenarios.base.utilization > 1.0) {
        return {
          severity: 'error',
          message: 'La capacidad instalada del UPS es insuficiente para soportar la carga IT actual.',
        };
      }
      if (ups.scenarios.base.utilization > 0.8) {
        return {
          severity: 'warning',
          message: `Utilización del UPS al ${(ups.scenarios.base.utilization * 100).toFixed(0)}% (se recomienda no exceder el 80% en carga base).`,
        };
      }
      return null;
    },
  },
];
