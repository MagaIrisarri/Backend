import { EntityManager } from '@mikro-orm/core';
import { seedUsers } from './seeders/userSeeder.js';
import { seedVehicles } from './seeders/vehicleSeeder.js';
import { seedParkings } from './seeders/parkingSeeder.js';
import { seedHolidays } from './seeders/holidaySeeder.js';
import { seedStaff } from './seeders/staffSeeder.js';
import { seedServices } from './seeders/serviceSeeder.js';
import { seedReservations } from './seeders/reservationSeeder.js';

// Cada paso es idempotente (por email, nombre, patente o "si todavía no tiene"): corre igual en una base vacía o ya sembrada
// y solo agrega lo que falta. Va en una transacción: si un paso falla, no queda una siembra a medias.
export const seedDatabase = async (em: EntityManager) => {
  await em.transactional(async (tx) => {
    await seedHolidays(tx);
    const users = await seedUsers(tx);
    await seedVehicles(tx);
    await seedParkings(tx, users);
    await tx.flush();
    await seedStaff(tx, users);
    await seedServices(tx);
    await tx.flush();
    await seedReservations(tx);
  });
  console.log('✅ Datos de prueba al día.');
};
