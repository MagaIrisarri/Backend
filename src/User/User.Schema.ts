import { z } from 'zod';

export const UserStatusSchema = z.enum(['ACTIVO', 'BAJA']);
export const UserTypeSchema = z.enum(['CLIENTE', 'DUEÑO', 'EMPLEADO', 'ADMIN']);

const baseUserFields = {
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
};

export const createPublicUserSchema = z.object({
  body: z.object({
    ...baseUserFields,
    type: z.enum(['CLIENTE', 'DUEÑO']).optional().default('CLIENTE'),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    ...baseUserFields,
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    dni: baseUserFields.dni.optional(),
    name: baseUserFields.name.optional(),
    last_name: baseUserFields.last_name.optional(),
    date_of_birth: z.coerce.date({ message: 'Fecha de nacimiento inválida' }).optional(),
    email: baseUserFields.email.optional(),
    phone: baseUserFields.phone.optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de usuario inválido'),
  }),
});

export const ownerIdSchema = z.object({
  params: z.object({
    ownerId: z.string().uuid('ID de dueño inválido'),
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

export type PublicUserCreateInput = z.infer<typeof createPublicUserSchema>['body'];
export type EmployeeCreateInput = z.infer<typeof createEmployeeSchema>['body'];
export type UserUpdateInput = z.infer<typeof updateUserSchema>['body'];