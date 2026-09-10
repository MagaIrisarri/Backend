import { z } from "zod";

export const createServicePriceSchema = z.object({
  body: z.object({
    serviceCatalogId: z.string().uuid("ID de servicio inválido"),
    price: z.number().positive("El precio debe ser mayor a 0"),
  }),
  params: z.object({
    parkingId: z.string().uuid("ID de estacionamiento inválido"),
  }),
});

export const servicePriceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de tarifa inválido"),
  }),
});

export const activeServicePriceSchema = z.object({
  params: z.object({
    parkingId: z.string().uuid("ID de estacionamiento inválido"),
    serviceCatalogId: z.string().uuid("ID de servicio inválido"),
  }),
});