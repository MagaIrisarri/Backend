import { z } from 'zod';

export const ModelIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID de la URL no es válido")
  })
});


export const ModelQuerySchema = z.object({
  query: z.object({
    brandId: z.string().uuid("El ID de la marca para filtrar es inválido").optional()
  }).optional()
});
