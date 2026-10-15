import { EntityManager } from '@mikro-orm/core';
import argon2 from 'argon2';
import { User } from '../../../User/User.Entity.js';
import { UserStatus, UserType } from '../../constants/status.js';

// El administrador no se crea por la API ni por la interfaz: sale de acá. Contraseña `password123`, como los usuarios de la demo.
export const ADMIN_EMAIL = 'admin@cocheras.com';

export const defaultPassword = () => argon2.hash('password123');

// Idempotente por email: si ya está (por ejemplo, cargado por la demo), no lo toca.
export const seedUsers = async (em: EntityManager): Promise<void> => {
  if (await em.count(User, { email: ADMIN_EMAIL })) return;
  em.create(User, {
    email: ADMIN_EMAIL, dni: '30111222', name: 'Administrador', last_name: 'Sistema', date_of_birth: new Date('1985-05-15'), phone: '3414001111',
    password: await defaultPassword(), type: UserType.ADMINISTRADOR, status: UserStatus.ACTIVO,
  });
};
