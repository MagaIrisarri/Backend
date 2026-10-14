import { z } from "zod";

const vehicleTypeId = z.string().uuid("Elegí el tipo de vehículo de la plaza");

export const createSpaceSchema = z.object({
  body: z.object({
    spaceCode: z.string().min(1, "El código de plaza es requerido"),
    vehicleTypeId,
  }),
});

export const createBulkSpaceSchema = z.object({
  body: z.object({
    vehicleTypeId,
    count: z.number().int().min(1, "Debe agregar al menos 1 plaza"),
  }),
});

// Solo el estado: cambiar el tipo o el código de una plaza no mueve sus reservas (R-19).
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
});

export const parkingSpaceavailability = z.object({
  params: z.object({
    parkingId: z.string().uuid("ID de estacionamiento inválido"),
  }),
  query: z.object({
    vehicleTypeId,
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  }),
})
