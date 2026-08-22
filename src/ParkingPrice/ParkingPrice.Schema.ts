import { z } from "zod";

const vehicleTypeEnum = z.enum(['AUTO', 'MOTOCICLETA'], {
  message: 'Tipo de vehículo no válido',
});

export const createParkingPriceSchema = z.object({
  body: z.object({
    vehicleType: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(vehicleTypeEnum),
    price: z
      .number({
        message: 'El precio debe ser un número',
      })
      .positive('El precio debe ser mayor a 0')
      .finite('El precio debe ser un número válido'),
  }),
  params: z.object({
    id: z.string().uuid('El ID de estacionamiento debe ser un UUID válido'),
  }),
});

export const parkingPriceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de tarifa debe ser un UUID válido'),
  }),
});

export const parkingIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de estacionamiento debe ser un UUID válido'),
  }),
});

export const activeParkingPriceSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de estacionamiento debe ser un UUID válido'),
    vehicleType: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(vehicleTypeEnum),
  }),
});

export type CreateParkingPriceInput = z.infer<typeof createParkingPriceSchema>['body'];