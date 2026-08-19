import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    plate: z.string().min(6, "La patente debe tener al menos 6 caracteres").transform(val => val.toUpperCase().replace(/\s/g, '')),
    color: z.string().optional(),
    year: z.number().int().optional(),
    observations: z.string().optional(),
    brandId: z.string().uuid("ID de marca inválido"),
    modelId: z.string().uuid("ID de modelo inválido"),
    insuranceId: z.string().uuid("ID de seguro inválido").optional(),
  })
});

export const UpdateVehicleSchema = createVehicleSchema.partial();


export const VehicleIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID de la URL no es válido")
  })
});