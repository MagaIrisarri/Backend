import { z } from 'zod';

// Localidad del panel del administrador: van juntas porque hay localidades con el mismo nombre en distintas provincias.
export const statsSummarySchema = z.object({
  query: z.object({
    province: z.string().trim().min(1).optional(),
    locality: z.string().trim().min(1).optional(),
  }).refine(q => !q.province === !q.locality, { message: 'La localidad se filtra con su provincia', path: ['locality'] }),
});

export type LocalityScope = { province: string; locality: string };
