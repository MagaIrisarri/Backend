import { EntityManager } from '@mikro-orm/core';
import { User } from '../../User/User.Entity.js';
import { seedUsers, OWNER1_EMAIL, OWNER2_EMAIL } from './seeders/userSeeder.js';
import { seedVehicles } from './seeders/vehicleSeeder.js';
import { seedParkings } from './seeders/parkingSeeder.js';
import { seedHolidays } from './seeders/holidaySeeder.js';
import { seedReservations } from './seeders/reservationSeeder.js';

export const seedDatabaseAdmi = async (_em: EntityManager) => {};

export const seedDatabase = async (em: EntityManager) => {
  await seedHolidays(em);

  const usersCount = await em.count(User, {});
  if (usersCount > 0) {
    // Base ya sembrada: solo completa las cocheras que falten (por nombre) para no duplicar nada.
    const owner1 = await em.findOne(User, { email: OWNER1_EMAIL });
    const owner2 = await em.findOne(User, { email: OWNER2_EMAIL });
    if (owner1 && owner2) {
      await seedParkings(em, owner1, owner2);
      await em.flush();
      await seedReservations(em);
      await em.flush();
    }
    console.log('Omitiendo seeding de usuarios: ya existen datos en la base de datos.');
    return;
  }

  console.log('Iniciando seeding...');

  await em.transactional(async (forkEm) => {
    console.log('→ Creando usuarios...');
    const { owner1, owner2 } = await seedUsers(forkEm);

    console.log('→ Cargando vehículos desde vehiculos.json...');
    await seedVehicles(forkEm);

    console.log('→ Creando parkings, tarifas y plazas...');
    await seedParkings(forkEm, owner1, owner2);
    await forkEm.flush();

    console.log('→ Asignando el empleado 1 y cargando el historial del cliente 1...');
    await seedReservations(forkEm);

    await forkEm.flush();
    console.log('✅ Seeding completado.');
  });
};