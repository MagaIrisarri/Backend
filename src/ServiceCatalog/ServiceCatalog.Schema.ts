import { z } from "zod";

export const createServiceCatalogSchema = z.object({
  body: z.object({
    name: z.string().min(2, "El nombre del servicio debe tener al menos 2 caracteres"),
    description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  }),
});

export const updateServiceCatalogSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
  }),
});

export const serviceCatalogIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de servicio inválido"),
  }),
});