import { MikroORM } from '@mikro-orm/mysql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

export const orm = await MikroORM.init({

  entities: ['dist/**/*.Entity.js'], 
  entitiesTs: ['src/**/*.Entity.ts'], 


  dbName: 'vehiculosdb',
  driver: MySqlDriver,

  user: 'root',                         
  password: '1234',            
  host: 'localhost',
  port: 3306,
  clientUrl: 'mysql://root:pass@localhost:3306/vehiculosdb', 
  highlighter: new SqlHighlighter(),
  debug: ['query', 'schema'],
  
  allowGlobalContext: true 
});

// Función opcional para sincronizar la base de datos automáticamente al arrancar
export const syncSchema = async () => {
  try {
    await orm.schema.update(); 
    console.log('✔️ Base de datos sincronizada con MikroORM');
  } catch (error) {
    console.error('❌ Error al sincronizar la base de datos:', error);
  }
};