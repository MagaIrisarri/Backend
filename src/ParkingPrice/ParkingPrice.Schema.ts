import { z } from "zod";

const price = z
  .number({
    message: 'El precio debe ser un número',
  })
  .positive('El precio debe ser mayor a 0')
  .finite('El precio debe ser un número válido');

export const createParkingPriceSchema = z.object({
  body: z.object({
    vehicleTypeId: z.string({ message: 'El tipo de vehículo es requerido' }).uuid('Elegí el tipo de vehículo de la tarifa'),
    price,
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

// Solo el precio: para otro tipo de vehículo se da de alta otra tarifa.
export const updateParkingPriceSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de tarifa debe ser un UUID válido'),
  }),
  body: z.object({
    price,
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
    vehicleTypeId: z.string().uuid('El ID del tipo de vehículo no es válido'),
  }),
});

export type CreateParkingPriceInput = z.infer<typeof createParkingPriceSchema>['body'];
