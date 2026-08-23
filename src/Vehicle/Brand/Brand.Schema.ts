import { z } from 'zod';

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string({
      message: 'La marca es obligatoria',
    }).min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede superar los 100 caracteres'),
  })
});

export const updateBrandSchema = createBrandSchema.partial();

export const brandIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de la marca no es válido')
  })
});