import { z } from 'zod';

// Formatos argentinos: auto vigente AB123CD, auto anterior ABC123, moto vigente A123BCD, moto anterior 123ABC.
export const PLATE_REGEX = /^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3}|[A-Z]\d{3}[A-Z]{3}|\d{3}[A-Z]{3})$/;
export const MIN_VEHICLE_YEAR = 1960; // shortcut: L-28, sin dato de años por modelo en vehiculos.json, piso fijo; cuando el catálogo traiga años, validar contra el modelo

const yearSchema = z.number().int().min(MIN_VEHICLE_YEAR, `El año no puede ser anterior a ${MIN_VEHICLE_YEAR}`).refine(y => y <= new Date().getFullYear() + 1, "El año no puede ser posterior al próximo año");

export const createVehicleSchema = z.object({
  body: z.object({
    plate: z.string().transform(val => val.toUpperCase().replace(/[\s-]/g, '')).refine(v => PLATE_REGEX.test(v), "La patente no tiene un formato argentino válido (AB123CD, ABC123, A123BCD o 123ABC)"),
    color: z.string().optional(),
    year: yearSchema.optional(),
    observations: z.string().optional(),
    brandId: z.string().uuid("ID de marca inválido"),
    modelId: z.string().uuid("ID de modelo inválido"),
    insuranceId: z.string().uuid("ID de seguro inválido").optional(),
  })
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

// Todos los campos opcionales; insuranceId en null quita el seguro.
export const UpdateVehicleSchema = z.object({
  body: createVehicleSchema.shape.body.partial().extend({
    insuranceId: z.string().uuid("ID de seguro inválido").nullable().optional(),
    year: yearSchema.nullable().optional(), // null quita el año
  }),
});

export const ClientIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid("El ID del cliente no es válido")
  })
});

export const VehicleIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID del vehículo no es válido")
  })
});