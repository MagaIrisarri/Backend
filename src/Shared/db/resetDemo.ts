// Deja la base lista para la defensa: la borra, la crea de nuevo y la siembra con fechas relativas a hoy (las reservas
// "en curso" y de "hoy" dependen de la hora). Correr: pnpm seed:demo --yes (con DB_NAME si no es la base por defecto).
import { orm } from './orm.js';
import { seedDatabase } from './seeder.js';

if (!process.argv.includes('--yes')) {
  console.error(`Esto BORRA todos los datos de "${process.env.DB_NAME || 'parkingdb'}". Repetir con --yes para confirmar.`);
  process.exit(1);
}
try {
  await orm.schema.ensureDatabase();
  await orm.schema.refresh();
  await seedDatabase(orm.em.fork());
} finally {
  await orm.close();
}
