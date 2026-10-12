import { EntityManager } from '@mikro-orm/core';
import argon2 from 'argon2';
import { User } from '../../../User/User.Entity.js';
import { UserStatus, UserType } from '../../constants/status.js';

export const OWNER1_EMAIL = 'dueno1@cocheras.com';
export const OWNER2_EMAIL = 'dueno2@cocheras.com';
export const EMPLOYEE1_EMAIL = 'empleado1@cocheras.com';
export const CLIENT1_EMAIL = 'cliente1@cocheras.com';

// Todos con la contraseña `password123`. Los empleados se siembran en staffSeeder (necesitan su sucursal).
type Seed = { email: string; dni: string; name: string; last_name: string; birth: string; phone: string; type: UserType; status?: UserStatus };
const USERS: Seed[] = [
  { email: 'admin@cocheras.com', dni: '30111222', name: 'Administrador', last_name: 'Sistema', birth: '1985-05-15', phone: '1140001111', type: UserType.ADMINISTRADOR },
  // Dueños: 1 y 2 en Rosario y San Nicolás; 3 en Córdoba y Villa Carlos Paz; 4 en Santa Fe y Paraná; 5 en Mendoza y Rosario.
  { email: OWNER1_EMAIL, dni: '28999888', name: 'Carlos', last_name: 'Gardel', birth: '1980-03-20', phone: '3415001122', type: UserType.DUENO },
  { email: OWNER2_EMAIL, dni: '27888777', name: 'Roberto', last_name: 'Arlt', birth: '1982-07-10', phone: '3415003344', type: UserType.DUENO },
  { email: 'dueno3@cocheras.com', dni: '29444111', name: 'Lucía', last_name: 'Fernández', birth: '1984-11-02', phone: '3514002211', type: UserType.DUENO },
  { email: 'dueno4@cocheras.com', dni: '26333222', name: 'Martín', last_name: 'Gómez', birth: '1979-01-28', phone: '3424005566', type: UserType.DUENO },
  { email: 'dueno5@cocheras.com', dni: '31222333', name: 'Valeria', last_name: 'Quiroga', birth: '1986-06-14', phone: '2614007788', type: UserType.DUENO },
  // Clientes: varios vehículos y reservas en distintas sucursales (reservationSeeder). El 10 está dado de baja.
  { email: CLIENT1_EMAIL, dni: '38444555', name: 'Mariano', last_name: 'Moreno', birth: '1992-09-08', phone: '3416007788', type: UserType.CLIENTE },
  { email: 'cliente2@cocheras.com', dni: '39555666', name: 'Sofia', last_name: 'Belgrano', birth: '1994-12-03', phone: '3416009900', type: UserType.CLIENTE },
  { email: 'cliente3@cocheras.com', dni: '40111222', name: 'Ana', last_name: 'Torres', birth: '1997-04-22', phone: '3515551201', type: UserType.CLIENTE },
  { email: 'cliente4@cocheras.com', dni: '35222333', name: 'Bruno', last_name: 'Díaz', birth: '1990-08-30', phone: '3425551202', type: UserType.CLIENTE },
  { email: 'cliente5@cocheras.com', dni: '37333444', name: 'Carla', last_name: 'Méndez', birth: '1993-02-11', phone: '2615551203', type: UserType.CLIENTE },
  { email: 'cliente6@cocheras.com', dni: '33444555', name: 'Federico', last_name: 'Sosa', birth: '1988-10-05', phone: '3415551204', type: UserType.CLIENTE },
  { email: 'cliente7@cocheras.com', dni: '41555666', name: 'Gabriela', last_name: 'Ruiz', birth: '1999-07-19', phone: '3435551205', type: UserType.CLIENTE },
  { email: 'cliente8@cocheras.com', dni: '32666777', name: 'Hernán', last_name: 'Castro', birth: '1987-03-03', phone: '3365551206', type: UserType.CLIENTE },
  { email: 'cliente9@cocheras.com', dni: '42777888', name: 'Inés', last_name: 'Molina', birth: '2001-01-25', phone: '3515551207', type: UserType.CLIENTE },
  { email: 'cliente10@cocheras.com', dni: '36888999', name: 'Joaquín', last_name: 'Herrera', birth: '1991-12-12', phone: '3415551208', type: UserType.CLIENTE, status: UserStatus.BAJA },
];

export const defaultPassword = () => argon2.hash('password123');

// Idempotente por email: en una base ya sembrada solo crea los que faltan. Devuelve todos por email.
export const seedUsers = async (em: EntityManager): Promise<Map<string, User>> => {
  const existing = new Map((await em.find(User, { email: USERS.map(u => u.email) })).map(u => [u.email, u]));
  const password = await defaultPassword();
  for (const u of USERS) {
    if (existing.has(u.email)) continue;
    existing.set(u.email, em.create(User, {
      email: u.email, dni: u.dni, name: u.name, last_name: u.last_name, date_of_birth: new Date(u.birth), phone: u.phone,
      password, type: u.type, status: u.status ?? UserStatus.ACTIVO,
    }));
  }
  return existing;
};
