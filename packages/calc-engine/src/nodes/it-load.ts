import { spacePlanSchema, type SpacePlan } from '@daedalous/shared';
import type { CalcNode, ProjectData } from '../types';

export interface RackLoad {
  id: string;
  name: string;
  kw: number;
  usedU: number;
  totalU: number;
  dualPsu: boolean;
}

export interface ItLoadResult {
  plan: SpacePlan;
  rackCount: number;
  racks: RackLoad[];
  nominalKw: number;
  totalKw: number;
  usedU: number;
  totalU: number;
  maxRackKw: number;
  avgRackKw: number;
}

export function readSpacePlan(data: ProjectData): SpacePlan {
  const parsed = spacePlanSchema.safeParse(data['step-03'] ?? {});
  return parsed.success ? parsed.data : spacePlanSchema.parse({});
}

export const itLoadNode: CalcNode<ItLoadResult> = {
  id: 'itLoad',
  inputs: [],
  compute(data) {
    const plan = readSpacePlan(data);
    const factor = plan.simultaneityFactor;
    const racks: RackLoad[] = plan.racks.map((r) => {
      const watts = r.equipment.reduce((s, e) => s + e.watts * e.quantity, 0);
      return {
        id: r.id,
        name: r.name,
        kw: (watts * factor) / 1000,
        usedU: r.equipment.reduce((s, e) => s + e.units * e.quantity, 0),
        totalU: r.units,
        dualPsu: r.equipment.every((e) => e.powerSupplies >= 2),
      };
    });
    const nominalW = plan.racks.flatMap((r) => r.equipment).reduce((s, e) => s + e.watts * e.quantity, 0);
    const totalKw = racks.reduce((s, r) => s + r.kw, 0);
    return {
      plan,
      rackCount: racks.length,
      racks,
      nominalKw: nominalW / 1000,
      totalKw,
      usedU: racks.reduce((s, r) => s + r.usedU, 0),
      totalU: racks.reduce((s, r) => s + r.totalU, 0),
      maxRackKw: racks.reduce((m, r) => Math.max(m, r.kw), 0),
      avgRackKw: racks.length ? totalKw / racks.length : 0,
    };
  },
};
