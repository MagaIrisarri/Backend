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

export const updateSpaceSchema = z.object({
  body: z.object({
    spaceCode: z.string().min(1).optional(),
    vehicleType: z.string().min(2).optional(),
    state: z.enum(["LIBRE", "OCUPADO", "MANTENIMIENTO"]).optional(),
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