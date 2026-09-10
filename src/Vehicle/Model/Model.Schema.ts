import { z } from 'zod';

export const createModelSchema = z.object({
  body: z.object({
    name: z.string().min(2, "El nombre del modelo debe tener al menos 2 caracteres"),
    brandId: z.string().uuid("ID de marca inválido"),
    vehicleTypeId: z.string().uuid("ID de tipo de vehículo inválido")
  })
});

export const UpdateModelSchema = z.object({
  body: z.object({
    name: z.string().min(2, "El nombre del modelo debe tener al menos 2 caracteres").optional(),
    brandId: z.string().uuid("ID de marca inválido").optional(),
    vehicleTypeId: z.string().uuid("ID de tipo de vehículo inválido").optional()
  })
});


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

