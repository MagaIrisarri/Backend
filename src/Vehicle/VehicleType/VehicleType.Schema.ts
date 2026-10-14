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
// RA-26: claves de las descripciones del DNRPA que quedan en este tipo (las que se sacan vuelven a la sugerencia).
export const vehicleTypeDescriptionsSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de tipo de vehículo inválido'),
  }),
  body: z.object({
    descriptions: z.array(z.string().min(1).max(100)).max(1000),
    dryRun: z.boolean().default(false),
  }),
});
