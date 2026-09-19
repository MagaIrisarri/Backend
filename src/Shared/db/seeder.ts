import { EntityManager } from '@mikro-orm/core';
import { User } from '../../User/User.Entity.js';
import { seedUsers } from './seeders/userSeeder.js';
import { seedVehicles } from './seeders/vehicleSeeder.js';
import { seedParkings } from './seeders/parkingSeeder.js';

export const seedDatabaseAdmi = async (_em: EntityManager) => {};

export const seedDatabase = async (em: EntityManager) => {
  const usersCount = await em.count(User, {});
  if (usersCount > 0) {
    console.log('Omitiendo seeding: ya existen datos en la base de datos.');
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
    console.log('✅ Seeding completado.');
  });
};