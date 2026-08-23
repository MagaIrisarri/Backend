import { z } from 'zod';

export const UserStatusSchema = z.enum(['ACTIVO', 'BAJA']);
export const UserTypeSchema = z.enum(['CLIENTE', 'DUEÑO', 'EMPLEADO']);

// Schema para la creación de usuarios (dni y phone como strings limpios)
export const createUserSchema = z.object({
  body: z.object({
    dni: z
      .string()
      .trim()
      .regex(/^\d{7,8}$/, 'El DNI debe contener solo números (7 u 8 dígitos)'),
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    last_name: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres'),
    date_of_birth: z.coerce.date({ message: 'Fecha de nacimiento inválida' }),
    email: z.string().trim().email('Formato de email inválido'),
    phone: z
      .string()
      .trim()
      .regex(/^\d{6,15}$/, 'El teléfono debe contener solo dígitos numéricos'),
    password: z.string().trim().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    type: UserTypeSchema.optional().default('CLIENTE'),
    ownerId: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: createUserSchema.shape.body.partial(),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de usuario inválido'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
  }),
});

export const updatePasswordSchema = z.object({
  params: userIdSchema.shape.params,
  body: z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  }),
});

export type UserCreateInput = z.infer<typeof createUserSchema>['body'];
export type UserUpdateInput = z.infer<typeof updateUserSchema>['body'];