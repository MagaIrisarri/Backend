import { z } from "zod";

export const ParkingSpaceSchema = z.object({

  vehicleType: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(
      z.enum(['AUTO', 'MOTOCICLETA'], {
        message: 'Invalid vehicle type'
      })
    )

});

export const AvailableSpacesByVehicleTypeSchema = z.object({

  id: z.string(),
  
  vehicleType: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(
      z.enum(['AUTO', 'MOTOCICLETA'], {
        message: 'Invalid vehicle type'
      })
    )

});