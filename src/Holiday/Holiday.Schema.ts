import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)');

export const listHolidaysSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    parkingId: z.string().uuid().optional(),
  }),
});
export const createHolidaySchema = z.object({ body: z.object({ date, name: z.string().trim().min(1, 'Nombre requerido') }) });
export const holidayIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const holidayOpenSchema = z.object({
  params: z.object({ id: z.string().uuid(), parkingId: z.string().uuid() }),
  body: z.object({ open: z.boolean() }),
});
