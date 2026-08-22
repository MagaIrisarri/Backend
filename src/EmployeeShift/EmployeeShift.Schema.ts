import { z } from 'zod';

const DaysEnum = z.enum([
  'MONDAY', 
  'TUESDAY', 
  'WEDNESDAY', 
  'THURSDAY', 
  'FRIDAY', 
  'SATURDAY', 
  'SUNDAY'
], {
  message: 'Día de la semana inválido',
});

// Formato de hora HH:mm o HH:mm:ss
const TimeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export const createShiftSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid("ID de empleado inválido"),
    parkingId: z.string().uuid("ID de estacionamiento inválido"),
    dayOfWeek: DaysEnum,
    startTime: z.string().regex(TimeRegex, "Formato de hora de inicio inválido (HH:mm)"),
    endTime: z.string().regex(TimeRegex, "Formato de hora de fin inválido (HH:mm)"),
  }).refine(data => data.startTime < data.endTime, {
    message: "La hora de inicio debe ser anterior a la hora de fin",
    path: ["endTime"],
  }),
});

export const shiftIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de turno inválido"),
  }),
});

export const parkingDaySchema = z.object({
  params: z.object({
    parkingId: z.string().uuid("ID de estacionamiento inválido"),
    dayOfWeek: DaysEnum,
  }),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>['body'];