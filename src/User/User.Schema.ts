import { z } from 'zod';
import { pageQuery } from '../Shared/utils/pagination.js';

export const UserStatusSchema = z.enum(['ACTIVO', 'BAJA']);
export const UserTypeSchema = z.enum(['CLIENTE', 'DUEÑO', 'EMPLEADO', 'ADMINISTRADOR']);

// Solo texto: `z.coerce.date` convertiría `null`, `0` o `true` en una fecha de 1970 y pasaría la regla de edad.
const dateOfBirthSchema = z
  .string({ message: 'Fecha de nacimiento inválida' })
  .pipe(z.coerce.date({ message: 'Fecha de nacimiento inválida' }))
  .refine((date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age >= 18;
  }, { message: 'Debés ser mayor de 18 años para registrarte' });

export const baseUserFields = {
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, 'El DNI debe contener solo números (7 u 8 dígitos)'),
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres'),
  date_of_birth: dateOfBirthSchema,
  email: z.string().trim().email('Formato de email inválido'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, 'El teléfono debe contener solo dígitos numéricos'),
  password: z.string().trim().min(6, 'La contraseña debe tener al menos 6 caracteres'),
};

// Listado paginado del administrador (todos los campos son opcionales; sin `page` devuelve todos).
export const listUsersQuerySchema = z.object({
  query: z.object({
    ...pageQuery,
    q: z.string().trim().max(100).optional(),
    role: UserTypeSchema.optional(),
    status: UserStatusSchema.optional(),
  }),
});

export const createPublicUserSchema = z.object({
  body: z.object({
    ...baseUserFields,
    type: z.enum(['CLIENTE', 'DUEÑO']).optional().default('CLIENTE'),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    ...baseUserFields,
    parkingId: z.string().uuid('Estacionamiento inválido'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    dni: baseUserFields.dni.optional(),
    name: baseUserFields.name.optional(),
    last_name: baseUserFields.last_name.optional(),
    date_of_birth: dateOfBirthSchema.optional(),
    email: baseUserFields.email.optional(),
    phone: baseUserFields.phone.optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    ownerId: z.string().uuid('ID de dueño inválido'),
    id: z.string().uuid('ID de empleado inválido'),
  }),
  body: updateUserSchema.shape.body.extend({
    parkingId: z.string().uuid('Estacionamiento inválido').optional(),
  }),
});

export const employeeIdSchema = z.object({
  params: updateEmployeeSchema.shape.params,
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