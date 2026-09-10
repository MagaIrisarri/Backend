import { z } from 'zod';

export const VehicleTypeSchema = z.object({
name: z.string().trim().min(1, 'The name is required'),
description: z.string().trim().min(1, 'The description is required'),
code: z.string().trim().min(1, 'The code is required'),
});

export type VehicleTypeInput = z.infer<typeof VehicleTypeSchema>;