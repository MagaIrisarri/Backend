import { MikroORM } from '@mikro-orm/mysql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

export const orm = await MikroORM.init({
  entities: ['dist/**/*.Entity.js'], 
  entitiesTs: ['src/**/*.Entity.ts'], 

  dbName: 'parkingdb',
  driver: MySqlDriver,

  user: 'root',                         
  password: 'pass',            
  host: 'localhost',
  port: 3306,
  clientUrl: 'mysql://root:pass@localhost:3306/parkingdb', 
  highlighter: new SqlHighlighter(),
  debug: ['query', 'schema'],
  
  allowGlobalContext: true 
});

export const syncSchema = async () => {
  try {
    await orm.schema.update(); 
    console.log('Base de datos sincronizada con MikroORM y MySQL');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
};