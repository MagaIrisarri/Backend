import { z } from "zod";

export const createParkingPriceSchema = z.object({
  body: z.object({
    vehicleType: z
      .string({
        message: 'El tipo de vehículo es requerido',
      })
      .trim()
      .min(1, 'El tipo de vehículo es requerido'),
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

export const updateParkingPriceSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de tarifa debe ser un UUID válido'),
  }),
  body: z.object({
    price: z
      .number({
        message: 'El precio debe ser un número',
      })
      .positive('El precio debe ser mayor a 0')
      .finite('El precio debe ser un número válido'),
    vehicleType: z.string().trim().min(1).optional(),
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
    vehicleType: z.string().min(1, 'El tipo de vehículo es requerido'),
  }),
});

export type CreateParkingPriceInput = z.infer<typeof createParkingPriceSchema>['body'];