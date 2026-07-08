import { z } from "zod";
export const UserSchema = z.object({
    dni: z.string()
        .regex(/^\d{7,8}$/, "DNI debe contener solo números y tener 7 u 8 dígitos"),
    name: z.string()
        .trim()
        .min(1, "Nombre es requerido"),
    last_name: z.string()
        .trim()
        .min(1, "Apellido es requerido"),
    date_of_brthdate: z.string()
        .trim()
        .min(1, "Fecha de nacimiento es requerida"),
    email: z.string()
        .trim()
        .email("Email inválido"),
    phone: z.string()
        .regex(/^\d+$/, "Teléfono debe contener solo números"),
    password: z.string()
        .trim()
        .min(1, "Contraseña es requerida"),
    file: z.string().optional(),
    type: z.string().optional(),
});
//# sourceMappingURL=UserSchema.js.map