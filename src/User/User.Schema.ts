import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    dni: z.number({ message: 'El DNI es obligatorio' }),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    date_of_birth: z.coerce.date({ message: 'Fecha de nacimiento inválida' }),
    email: z.string().email('Formato de email inválido'),
    phone: z.string().min(6, 'El teléfono es obligatorio'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    file: z.string().default('client'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    dni: z.number().optional(),
    name: z.string().min(2).optional(),
    last_name: z.string().min(2).optional(),
    date_of_birth: z.coerce.date().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
    password: z.string().min(6).optional(),
    file: z.string().optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de usuario inválido'),
  }),
});