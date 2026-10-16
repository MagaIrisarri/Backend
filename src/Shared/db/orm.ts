import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

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

// safe: agrega lo que falta pero nunca borra tablas ni columnas (una rama vieja contra la base no se lleva datos).
// Si falla, el error sube a startServer y el servidor no arranca con la base a medio sincronizar.
export const syncSchema = async () => {
  await orm.schema.update({ safe: true });
  console.log('Base de datos sincronizada con MikroORM y MySQL');
};
