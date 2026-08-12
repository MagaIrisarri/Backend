import { z } from "zod";

export const VehicleSchema = z.object({
  patente: z.string({
    message: "La patente es requerida y debe ser un texto",
  })
    .min(6, 'La patente debe tener al menos 6 caracteres')
    .max(7, 'La patente no puede tener más de 7 caracteres'),

  marca: z.string({
    message: "La marca es requerida",
  })
    .min(2, 'La marca debe tener al menos 2 caracteres'),

  modelo: z.string({
    message: "El modelo es requerido",
  })
    .min(2, 'El modelo debe tener al menos 2 caracteres'),

  seguro: z.string({
    message: "El seguro es requerido",
  })
    .min(2, 'El seguro debe tener al menos 2 caracteres'),

  id_tipoVehiculo: z.string({
    message: "El ID del tipo de vehículo es requerido",
  })
    .min(1, 'El ID del tipo de vehículo no puede estar vacío')
});

export const VehicleIdSchema = z.object({
  id: z.string({
    message: "El ID  texto",
  })
});

// Reutilizamos el esquema principal pero hacemos todos sus campos opcionales para los métodos PUT/PATCH
export const UpdateVehicleSchema = VehicleSchema.partial();

// Exportamos los tipos inferidos por si los necesitas en el Servicio o Controlador
export type VehicleInput = z.infer<typeof VehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;