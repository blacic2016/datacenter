import { z } from 'zod';

/** Equipo instalado dentro de un rack (Paso 3 – inventario). */
export const equipmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  units: z.coerce.number().int().min(1).max(45),
  watts: z.coerce.number().min(0),
  powerSupplies: z.coerce.number().int().min(1).max(4).default(2),
  quantity: z.coerce.number().int().min(1).default(1),
});

export const rackSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  units: z.coerce.number().int().min(24).max(52).default(42),
  row: z.coerce.number().int().min(1).default(1),
  position: z.coerce.number().int().min(1).default(1),
  equipment: z.array(equipmentSchema).default([]),
});

export const spacePlanSchema = z.object({
  racks: z.array(rackSchema).default([]),
  rackDepthM: z.coerce.number().min(0.6).max(1.4).default(1.2),
  rackWidthM: z.coerce.number().min(0.6).max(0.8).default(0.6),
  frontAisleM: z.coerce.number().min(0).default(1.2),
  rearAisleM: z.coerce.number().min(0).default(1.0),
  containment: z.enum(['ninguna', 'pasillo_frio', 'pasillo_caliente']).default('ninguna'),
  redundancy: z.enum(['N', 'N+1', '2N']).default('N+1'),
  simultaneityFactor: z.coerce.number().min(0.3).max(1).default(0.8),
});

export type Equipment = z.infer<typeof equipmentSchema>;
export type Rack = z.infer<typeof rackSchema>;
export type SpacePlan = z.infer<typeof spacePlanSchema>;
