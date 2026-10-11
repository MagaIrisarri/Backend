import { z } from "zod";

export const createSpaceSchema = z.object({
  body: z.object({
    spaceCode: z.string().min(1, "El código de plaza es requerido"),
    vehicleType: z.string().min(2, "El tipo de vehículo es requerido"),
  }),
});

export const createBulkSpaceSchema = z.object({
  body: z.object({
    vehicleType: z.string().min(2, "El tipo de vehículo es requerido"),
    count: z.number().int().min(1, "Debe agregar al menos 1 plaza"),
  }),
});

// Solo el estado: cambiar el tipo o el código de una plaza no ajusta la capacidad (R-18) ni mueve sus reservas (R-19).
// Para otro tipo, se da de baja y se agrega una plaza nueva.
export const updateSpaceSchema = z.object({
  body: z.object({
    state: z.enum(["LIBRE", "OCUPADO", "MANTENIMIENTO"]),
    relocate: z.boolean().optional(), // al pasar a mantenimiento: confirma reubicar las reservas futuras (R-19)
  }),
});

export const spaceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de plaza inválido"),
  }),
});

export const parkingSpaceQuerySchema = z.object({
  params: z.object({
    parkingId: z.string().uuid("ID de estacionamiento inválido"),
  }),
  query: z.object({
    vehicleType: z.string().optional(),
  }).optional(),
});

export const parkingSpaceavailability = z.object({
  params: z.object({
    parkingId: z.string().uuid("ID de estacionamiento inválido"),
  }),
  query: z.object({
    vehicleType: z.string(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  }),
})