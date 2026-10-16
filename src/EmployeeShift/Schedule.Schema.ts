import { z } from 'zod';
import { TIME_REGEX } from '../Shared/utils/validation.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const time = z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:mm)');
const dayParams = z.object({
  parkingId: z.string().uuid('ID de estacionamiento inválido'),
  date: z.string().regex(DATE_REGEX, 'Fecha inválida (YYYY-MM-DD)'),
});

export const dayParamsSchema = z.object({ params: dayParams });

export const saveDaySchema = z.object({
  params: dayParams,
  body: z.object({
    shifts: z.array(z.object({ employeeId: z.string().uuid(), from: time, to: time })),
    closures: z.array(z.object({ from: time, to: time })).default([]),
    // R-06: reemplazo de un empleado por otro, las reservas se transfieren en el mismo paso.
    transfers: z.array(z.object({ fromEmployeeId: z.string().uuid(), toEmployeeId: z.string().uuid() })).default([]),
  }),
});

const DayEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
const dayBody = saveDaySchema.shape.body;

export const rangeSchema = z.object({
  params: z.object({ parkingId: z.string().uuid() }),
  query: z.object({
    from: z.string().regex(DATE_REGEX, 'Fecha inválida (YYYY-MM-DD)'),
    to: z.string().regex(DATE_REGEX, 'Fecha inválida (YYYY-MM-DD)'),
  }).refine(q => q.from <= q.to, { message: 'El rango está invertido', path: ['to'] }),
});

export const saveTemplateDaySchema = z.object({
  params: z.object({ parkingId: z.string().uuid(), dayOfWeek: DayEnum }),
  body: dayBody,
});

export const createClosureSchema = z.object({
  body: z.object({
    parkingId: z.string().uuid(),
    dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    startTime: time,
    endTime: time,
  }).refine(d => d.startTime < d.endTime, { message: 'La hora de inicio debe ser anterior a la hora de fin', path: ['endTime'] }),
});

export const closureIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const parkingIdParamSchema = z.object({ params: z.object({ parkingId: z.string().uuid() }) });

export type SaveDayInput = z.infer<typeof saveDaySchema>['body'];
