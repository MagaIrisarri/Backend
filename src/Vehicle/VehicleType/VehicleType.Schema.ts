import { z } from 'zod';

export const createVehicleTypeSchema = z.object({
  body: z.object({
    name: z.string({
      message: 'El nombre es obligatorio',
    }).min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede superar los 50 caracteres'),
  })
});

export const updateVehicleTypeSchema = createVehicleTypeSchema.partial();

export const vehicleTypeIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de tipo de vehículo inválido'),
  }),
});