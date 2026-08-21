import { z } from "zod";

export const ParkingPriceSchema = z.object({

  vehicleType: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(
      z.enum(['AUTO', 'MOTOCICLETA'], {
        message: 'Invalid vehicle type'
      })
    ),

  price: z
    .number({
      message: 'The price must be a number'
    })
    .positive('The price must be greater than 0')
    .finite('The price must be a valid number'),

});

export const ParkingPriceIdSchema = z.object({

  id: z.string()

});

export const ActivePriceSchema = z.object({

  id: z.string(),

  vehicleType: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(
      z.enum(['AUTO', 'MOTOCICLETA'], {
        message: 'Invalid vehicle type'
      })
    ),
    
});

