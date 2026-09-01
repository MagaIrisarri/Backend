import { z } from "zod";

export const reservationStatusEnum = z.enum(['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'], {
  message: 'Estado de reserva no válido',
});

export const createReservationSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid("El ID de vehículo debe ser un UUID válido"),
    parkingId: z.string().uuid("El ID de estacionamiento debe ser un UUID válido"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    parkingSpaceId: z.string().uuid("El ID de plaza debe ser un UUID válido")
  })
  .refine(data => data.startTime >= new Date(), {
    message: "La fecha y hora de inicio no puede estar en el pasado",
    path: ["startTime"],
  })
  .refine(data => data.startTime.getMinutes() === 0 && data.startTime.getSeconds() === 0, {
    message: "El inicio de la reserva debe ser en horas enteras",
    path: ["startTime"],
  })
  .refine(data => data.endTime.getMinutes() === 0 && data.endTime.getSeconds() === 0, {
    message: "El fin de la reserva debe ser en horas enteras",
    path: ["endTime"],
  })
  .refine(data => data.startTime < data.endTime, {
    message: "La hora de inicio debe ser anterior a la de finalización",
    path: ["endTime"],
  }),
});

export const updateReservationSchema = z.object({
  body: z.object({
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    status: reservationStatusEnum.optional(),
    attendedById: z.string().uuid("ID de empleado inválido").optional(),
  }),
});

export const reservationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID de la reserva debe ser un UUID válido"),
  }),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>['body'];
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>['body'];