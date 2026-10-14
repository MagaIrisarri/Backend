import { z } from "zod";
import { PLATE_REGEX } from "../Vehicle/Vehicle.Schema.js";
import { baseUserFields } from "../User/User.Schema.js";

export const createReservationSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid("El ID de vehículo debe ser un UUID válido"),
    parkingId: z.string().uuid("El ID de estacionamiento debe ser un UUID válido"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    parkingSpaceId: z.string().uuid("El ID de plaza debe ser un UUID válido").optional(),
    serviceIds: z.array(z.string().uuid()).optional(),
  })
  .refine(data => data.startTime.getTime() >= Date.now() - 10 * 60 * 1000, {
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

// R-07: solo se cambia el empleado asignado. Horario y estado tienen sus propias acciones con reglas (extender, ingreso, salida, cancelar).
export const updateReservationSchema = z.object({
  body: z.object({
    attendedById: z.string().uuid("ID de empleado inválido"),
  }),
});

export const reservationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID de la reserva debe ser un UUID válido"),
  }),
});

export const changeSpaceSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID de la reserva debe ser un UUID válido"),
  }),
  body: z.object({
    parkingSpaceId: z.string().uuid("El ID de plaza debe ser un UUID válido"),
  }),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>['body'];
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>['body'];
const reservationId = z.object({ id: z.string().uuid("El ID de la reserva debe ser un UUID válido") });

// El empleado extiende el fin de una reserva (R-23). Que sean horas completas respecto del inicio lo valida el servicio:
// una reserva de mostrador empieza a cualquier minuto.
export const extendReservationSchema = z.object({
  params: reservationId,
  body: z.object({ endTime: z.coerce.date() }),
});

// Alta de mostrador (R-29): el inicio lo fija el servidor (ahora, sin segundos) y el fin es inicio + horas completas.
export const walkInSchema = z.object({
  body: z.object({
    parkingId: z.string().uuid("El ID de estacionamiento debe ser un UUID válido"),
    plate: z.string().transform(v => v.toUpperCase().replace(/[\s-]/g, '')).refine(v => PLATE_REGEX.test(v), "La patente no tiene un formato argentino válido"),
    brandId: z.string().uuid("ID de marca inválido"),
    modelId: z.string().uuid("ID de modelo inválido"),
    hours: z.number().int("Las horas son un número entero").min(1, "Mínimo 1 hora"),
    serviceIds: z.array(z.string().uuid()).optional(),
    // Cliente (R-29): si el email no tiene cuenta se crea con el DNI como contraseña; nacimiento y teléfono los completa él.
    name: baseUserFields.name,
    last_name: baseUserFields.last_name,
    dni: baseUserFields.dni,
    email: baseUserFields.email,
    phone: baseUserFields.phone.optional(),
  }),
});
export type WalkInInput = z.infer<typeof walkInSchema>['body'];

// Servicios de la reserva que deja el empleado (R-24): tarifas de servicio de la cochera (ServicePrice.id).
export const rateReservationSchema = z.object({
  params: reservationId,
  body: z.object({ rating: z.number().int().min(1, "La valoración va de 1 a 5").max(5, "La valoración va de 1 a 5") }),
});

export const reservationServicesSchema = z.object({
  params: reservationId,
  body: z.object({ serviceIds: z.array(z.string().uuid("ID de servicio inválido")) }),
});
