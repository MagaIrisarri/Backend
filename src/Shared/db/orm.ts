import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

export const orm = await MikroORM.init({
  entities: ['dist/**/*.Entity.js'],
  entitiesTs: ['src/**/*.Entity.ts'],

  dbName: 'parkingdb',
  driver: MySqlDriver,

  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'pass',

  clientUrl: 'mysql://root:pass@localhost:3306/parkingdb',

  highlighter: new SqlHighlighter(),

  debug: ['query', 'schema'],

  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
});

export const syncSchema = async () => {
  await orm.schema.update();
  // await orm.schema.drop();
  // await orm.schema.create();
};