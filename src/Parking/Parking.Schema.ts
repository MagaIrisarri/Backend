import { z } from "zod";
import { TIME_REGEX } from "../Shared/utils/validation.js";
import { pageQuery } from "../Shared/utils/pagination.js";

const parkingBodyBaseSchema = z.object({
  ownerId: z.string().uuid("El ID del dueño debe ser un UUID válido"),
  province: z.string().trim().min(4, "Elegí la provincia").max(60),
  locality: z.string().min(3, "La localidad debe tener al menos 3 caracteres"),
  neighborhood: z.string().trim().max(60, "El barrio no puede superar los 60 caracteres").optional().nullable(),
  // 4 dígitos (2000) o formato CPA (S2000ABC); se guarda en mayúsculas.
  postalCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^(\d{4}|[A-Z]\d{4}[A-Z]{3})$/, "Código postal inválido: usá 4 dígitos (2000) o formato CPA (S2000ABC)"),
  address: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(100, "La dirección no puede superar los 100 caracteres"),
  // R-30: plazas iniciales por tipo de vehículo; después se gestionan desde Plazas (R-18).
  spaces: z.array(z.object({
    vehicleTypeId: z.string().uuid("Elegí el tipo de vehículo de las plazas"),
    quantity: z.number().int().min(1, "Cada tipo lleva al menos 1 plaza").max(500, "Hasta 500 plazas por tipo"),
  })).default([])
    .refine((list) => new Set(list.map((s) => s.vehicleTypeId)).size === list.length, "Cada tipo de vehículo va una sola vez"),
  openingTime: z.string().regex(TIME_REGEX, "Formato de hora de apertura inválido (HH:mm)"),
  closingTime: z.string().regex(TIME_REGEX, "Formato de hora de cierre inválido (HH:mm)"),
  minReservationHours: z.number().int().min(1).default(1),
  maxReservationHours: z.number().int().min(1),
  reservationMargin: z.number().int().min(0).default(1),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(80),
  latitude: z.number().min(-90).max(90, "Latitud inválida"),
  longitude: z.number().min(-180).max(180, "Longitud inválida"),
  imageUrl: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
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

// Sin plazas: después del alta, la capacidad sigue a las plazas que se agregan o dan de baja (R-18).
// Si llegan, zod las descarta.
export const updateParkingSchema = z.object({
  body: parkingBodyBaseSchema
    .omit({ spaces: true })
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

// Listado paginado del administrador (todos los campos son opcionales; sin `page` devuelve todas).
export const listParkingsQuerySchema = z.object({
  query: z.object({
    ...pageQuery,
    q: z.string().trim().max(100).optional(),
    province: z.string().trim().max(60).optional(),
    locality: z.string().trim().max(100).optional(),
    status: z.enum(['on', 'off']).optional(),
  }),
});

export const parkingIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID de estacionamiento debe ser un UUID válido"),
  }),
});

export const parkingIdOwnerSchema = z.object({
  params: z.object({
    ownerId: z.string().uuid("El ID del dueño debe ser un UUID válido"),
  }),
});

export type CreateParkingInput = z.infer<typeof parkingBodyBaseSchema>;
export type UpdateParkingInput = z.infer<typeof updateParkingSchema>['body'];