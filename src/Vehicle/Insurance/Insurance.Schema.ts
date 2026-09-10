import { z } from 'zod';

export const createInsuranceSchema = z.object({
  body: z.object({
    name: z.string({
      message: 'El nombre de la aseguradora es obligatorio',
    }).min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede superar los 100 caracteres'),
  })
});

export const updateInsuranceSchema = createInsuranceSchema.partial();

export const insuranceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de la aseguradora no es válido')
  })
});