import { z } from 'zod';

// Esquema para crear un vehículo
export const createVehicleSchema = z.object({
  body: z.object({
    plate: z.string().min(6, "La patente debe tener al menos 6 caracteres").transform(val => val.toUpperCase().replace(/\s/g, '')),
    color: z.string().optional(),
    year: z.number().int().optional(),
    observations: z.string().optional(),
    brandId: z.string().uuid("ID de marca inválido"),
    modelId: z.string().uuid("ID de modelo inválido"),
    vehicleTypeId: z.string().uuid("ID de tipo de vehículo inválido"),
    insuranceId: z.string().uuid("ID de seguro inválido").optional(),
  })
});

// Esquema para actualizar (hace que todos los campos del body sean opcionales)
export const UpdateVehicleSchema = createVehicleSchema.partial();

// Esquema para validar que el ID que viaja en la URL sea un UUID correcto
export const VehicleIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID de la URL no es válido")
  })
});