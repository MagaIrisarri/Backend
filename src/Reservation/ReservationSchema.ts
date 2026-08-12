import { z } from "zod";

export const ReservationStatusSchema = z.enum([
  "RESERVADA",
  "CONFIRMADA",
  "CANCELADA",
  "COMPLETADA",
], "El estado debe ser reservada, finalizada, cancelada o en completada");

export const ReservationSchema = z.object({
  startDate: z.coerce.date("La fecha de inicio es inválida"),

  endDate: z.coerce.date("La fecha de fin es inválida"),

  locationID: z.string()
    .trim()
    .min(1, "La ubicación es requerida"),

  vehicleID: z.string()
    .trim()
    .min(1, "El vehículo es requerido"),

  status: ReservationStatusSchema,
})
  .refine((data) => data.startDate < data.endDate, {
    message: "La fecha de inicio debe ser anterior a la fecha de fin",
    path: ["startDate"],
  })
  .refine((data) => data.startDate > new Date(), {
    message: "La fecha de inicio debe ser posterior a la fecha actual",
    path: ["startDate"],
  });

export type ReservationInput = z.infer<typeof ReservationSchema>;
