import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

// Todas las fechas/horas de la app (parseo de strings, columnas datetime, validaciones
// de horario de atención) asumen la hora local de Argentina. Sin esto, el proceso de
// Node usa la zona horaria del sistema, que puede no coincidir y desfasar los horarios.
process.env.TZ = 'America/Argentina/Buenos_Aires';

export const orm = await MikroORM.init({
  entities: ['dist/**/*.Entity.js'],
  entitiesTs: ['src/**/*.Entity.ts'],
  driver: MySqlDriver,
  
  dbName: process.env.DB_NAME || 'parkingdb',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'pass',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  
  highlighter: new SqlHighlighter(),
  debug: process.env.NODE_ENV !== 'production' ? ['query', 'schema'] : false,
  allowGlobalContext: true,
  
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
  });

export const syncSchema = async () => {
  try {
    await orm.schema.update();
    console.log('Base de datos sincronizada con MikroORM y MySQL');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
};
