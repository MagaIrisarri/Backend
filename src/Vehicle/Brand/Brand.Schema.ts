import { z } from 'zod';

export const brandIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de la marca no es válido')
  })
});
