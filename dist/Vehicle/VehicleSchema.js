import { z } from "zod";
export const VehicleSchema = z.object({
    licensePlate: z.string()
        .trim()
        .toUpperCase()
        .regex(/^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/, "Patente inválida (formato esperado: ABC123 o AB123CD)"),
    brand: z.string()
        .trim()
        .min(1, "Marca es requerida"),
    model: z.string()
        .trim()
        .min(1, "Modelo es requerido"),
    insurance: z.string()
        .trim()
        .min(1, "Seguro es requerido"),
    userId: z.string()
        .trim()
        .min(1, "El usuario es requerido"),
    vehicleTypeId: z.string()
        .trim()
        .min(1, "El tipo de vehículo es requerido"),
});
//# sourceMappingURL=VehicleSchema.js.map