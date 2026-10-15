import { EntityManager } from '@mikro-orm/core';
import { seedUsers } from './seeders/userSeeder.js';
import { seedVehicles } from './seeders/vehicleSeeder.js';
import { seedHolidays } from './seeders/holidaySeeder.js';

// Solo el catálogo, para que una base vacía funcione: feriados nacionales, tipos de vehículo, seguros, marcas, modelos y el
// administrador. Los datos de uso (dueños, cocheras, reservas…) salen de la demo: pnpm demo:load (src/Shared/db/demo).
// Cada paso es idempotente y van en una transacción: corre igual en una base vacía o ya cargada y solo agrega lo que falta.
export const seedDatabase = async (em: EntityManager) => {
  await em.transactional(async (tx) => {
    await seedHolidays(tx);
    await seedUsers(tx);
    await seedVehicles(tx);
  });
  console.log('✅ Catálogo al día.');
};
