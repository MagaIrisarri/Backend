import { z } from "zod";

const TimeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const parkingBodyBaseSchema = z.object({
  locality: z.string().min(3, "La localidad debe tener al menos 3 caracteres"),
  postalCode: z
    .string()
    .min(4, "El código postal debe tener al menos 4 caracteres")
    .max(10, "El código postal no puede superar los 10 caracteres")
    .regex(/^\d+$/, "El código postal debe ser numérico"),
  address: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(100, "La dirección no puede superar los 100 caracteres"),
  carCapacity: z.union([
    z.number().int().min(1, "La capacidad de autos debe ser al menos 1"),
    z.string().regex(/^\d+$/).transform(Number),
  ]),
  motorcycleCapacity: z.union([
    z.number().int().min(0, "La capacidad de motos no puede ser negativa"),
    z.string().regex(/^\d+$/).transform(Number),
  ]),
  truckCapacity: z.union([
    z.number().int().min(0),
    z.string().regex(/^\d+$/).transform(Number),
  ]).optional(),
  openingTime: z.string().regex(TimeRegex, "Formato de hora de apertura inválido (HH:mm)"),
  closingTime: z.string().regex(TimeRegex, "Formato de hora de cierre inválido (HH:mm)"),
  minReservationHours: z.number().int().min(1).default(1),
  maxReservationHours: z.number().int().min(1),
  reservationMargin: z.number().int().min(0).default(1),
});

export const createParkingSchema = z.object({
  body: parkingBodyBaseSchema.refine(
    (data) => data.openingTime < data.closingTime,
    {
      message: "El horario de apertura debe ser anterior al horario de cierre",
      path: ["closingTime"],
    }
  ),
});

export const updateParkingSchema = z.object({
  body: parkingBodyBaseSchema
    .partial()
    .refine(
      (data) => {
        if (data.openingTime && data.closingTime) {
          return data.openingTime < data.closingTime;
        }
        return true;
      },
      {
        message: "El horario de apertura debe ser anterior al horario de cierre",
        path: ["closingTime"],
      }
    ),
});

export const parkingIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID de estacionamiento debe ser un UUID válido"),
  }),
});

export type CreateParkingInput = z.infer<typeof parkingBodyBaseSchema>;
export type UpdateParkingInput = z.infer<typeof updateParkingSchema>['body'];