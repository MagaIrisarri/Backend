import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)');

export const listHolidaysSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    parkingId: z.string().uuid().optional(),
  }),
});
export const createHolidaySchema = z.object({ body: z.object({ date, name: z.string().trim().min(1, 'Nombre requerido') }) });
// L-12: sin dryRun agrega las fechas nuevas del calendario oficial y quita las de `remove` (ids que la vista previa listó como faltantes).
export const importHolidaysSchema = z.object({
  body: z.object({ dryRun: z.boolean().default(false), remove: z.array(z.string().uuid()).max(100).default([]) }),
});
export const holidayIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const holidayOpenSchema = z.object({
  params: z.object({ id: z.string().uuid(), parkingId: z.string().uuid() }),
  body: z.object({ open: z.boolean() }),
});
