import { z } from "zod";

export const ParkingSchema = z.object({
  id: z.string()
    .min(1, 'ID is required')
    .regex(/^\d+$/),

  locality: z.string()
    .min(3, 'Locality must have at least 3 characters'),

  postalCode: z.string()
    .min(4, 'Postal Code must have at least 4 characters')
    .max(10, 'Postal Code must have at most 10 characters')
    .regex(/^\d+$/),
  
  address: z.string()
    .min(5, 'Address must have at least 5 characters')
    .max(100, 'Address must have at most 100 characters'),
  
  carCapacity: z.union([
      z.number().int().min(1),
      z.string().regex(/^\d+$/).transform(Number),
    ]),

  motorcycleCapacity: z.union([
      z.number().int().min(0),
      z.string().regex(/^\d+$/).transform(Number),
    ])
});

export const ParkingIdSchema = z.object({
  id: z.string()
    .min(1, 'ID is required')
    .regex(/^\d+$/)
  });

export type Parking = z.infer<typeof ParkingSchema>;