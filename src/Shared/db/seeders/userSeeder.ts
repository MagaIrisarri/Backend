import { EntityManager } from '@mikro-orm/core';
import argon2 from 'argon2';
import { User } from '../../../User/User.Entity.js';

export const seedUsers = async (em: EntityManager): Promise<{
  adminUser: User;
  owner1: User;
  owner2: User;
  client1: User;
  client2: User;
}> => {
  const defaultPassword = await argon2.hash('password123');

  const adminUser = em.create(User, {
    dni: '30111222',
    name: 'Administrador',
    last_name: 'Sistema',
    date_of_birth: new Date('1985-05-15'),
    email: 'admin@cocheras.com',
    phone: '1140001111',
    password: defaultPassword,
    type: 'ADMINISTRADOR',
    status: 'ACTIVO',
  });

  const owner1 = em.create(User, {
    dni: '28999888',
    name: 'Carlos',
    last_name: 'Gardel',
    date_of_birth: new Date('1980-03-20'),
    email: 'dueno1@cocheras.com',
    phone: '3415001122',
    password: defaultPassword,
    type: 'DUEÑO',
    status: 'ACTIVO',
  });

  const owner2 = em.create(User, {
    dni: '27888777',
    name: 'Roberto',
    last_name: 'Arlt',
    date_of_birth: new Date('1982-07-10'),
    email: 'dueno2@cocheras.com',
    phone: '3415003344',
    password: defaultPassword,
    type: 'DUEÑO',
    status: 'ACTIVO',
  });

  em.create(User, {
    dni: '35111333',
    name: 'Lucas',
    last_name: 'Operador',
    date_of_birth: new Date('1995-11-25'),
    email: 'empleado1@cocheras.com',
    phone: '3416005566',
    password: defaultPassword,
    type: 'EMPLEADO',
    status: 'ACTIVO',
    ownerId: owner1.id,
  });

  const client1 = em.create(User, {
    dni: '38444555',
    name: 'Mariano',
    last_name: 'Moreno',
    date_of_birth: new Date('1992-09-08'),
    email: 'cliente1@cocheras.com',
    phone: '3416007788',
    password: defaultPassword,
    type: 'CLIENTE',
    status: 'ACTIVO',
  });

  const client2 = em.create(User, {
    dni: '39555666',
    name: 'Sofia',
    last_name: 'Belgrano',
    date_of_birth: new Date('1994-12-03'),
    email: 'cliente2@cocheras.com',
    phone: '3416009900',
    password: defaultPassword,
    type: 'CLIENTE',
    status: 'ACTIVO',
  });

  return { adminUser, owner1, owner2, client1, client2 };
};
