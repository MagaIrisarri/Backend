import { z } from "zod";

const vehicleTypeEnum = z.enum(['AUTO', 'MOTOCICLETA'], {
  message: 'Tipo de vehículo no válido',
});

export const createParkingSpaceSchema = z.object({
  body: z.object({
    vehicleType: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(vehicleTypeEnum),
  }),
  params: z.object({
    id: z.string().uuid('El ID de estacionamiento debe ser un UUID válido'),
  }),
});

export const parkingSpaceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de la plaza debe ser un UUID válido'),
  }),
});

export const parkingIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de estacionamiento debe ser un UUID válido'),
  }),
});

export const availableSpacesByVehicleTypeSchema = z.object({
  params: z.object({
    id: z.string().uuid('El ID de estacionamiento debe ser un UUID válido'),
    vehicleType: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(vehicleTypeEnum),
  }),
});

export type CreateParkingSpaceInput = z.infer<typeof createParkingSpaceSchema>['body'];