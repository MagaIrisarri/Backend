import { MikroORM } from '@mikro-orm/mysql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

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
});

export const syncSchema = async () => {
  try {
    await orm.schema.update();
    console.log('Base de datos sincronizada con MikroORM y MySQL');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
};