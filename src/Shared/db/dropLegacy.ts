// L-39: borra las columnas y la tabla que quedaron sin uso (la sincronización `safe` nunca borra nada).
//   pnpm build && pnpm db:drop-legacy          muestra qué borraría en la base de DB_NAME
//   pnpm build && pnpm db:drop-legacy --yes    lo borra (no se puede deshacer)
// - parking_space.vehicle_type y parking_price.vehicle_type: el tipo en texto, reemplazado por vehicle_type_id (R-30).
// - parking.car_capacity, motorcycle_capacity y truck_capacity: la capacidad es la cantidad de plazas activas (R-30).
// - parking.reservation_margin: el margen en horas, reemplazado por reservation_margin_minutes.
// - holiday_parking: el "abre" de los feriados, reemplazado por holiday_adhesion (D-09).
// Una columna vieja solo se borra si ya existe la que la reemplaza: así no se pierde un dato que todavía no se pasó.
import { orm } from './orm.js';

const DROPS: { table: string; column?: string; needs?: [string, string] }[] = [
  { table: 'parking_space', column: 'vehicle_type', needs: ['parking_space', 'vehicle_type_id'] },
  { table: 'parking_price', column: 'vehicle_type', needs: ['parking_price', 'vehicle_type_id'] },
  { table: 'parking', column: 'car_capacity' },
  { table: 'parking', column: 'motorcycle_capacity' },
  { table: 'parking', column: 'truck_capacity' },
  { table: 'parking', column: 'reservation_margin', needs: ['parking', 'reservation_margin_minutes'] },
  { table: 'holiday_parking', needs: ['holiday_adhesion', 'id'] },
];

const confirmed = process.argv.includes('--yes');
const conn = orm.em.getConnection();
try {
  const present: { t: string; c: string }[] = await conn.execute(
    'SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()');
  const has = (t: string, c?: string) => present.some((r) => r.t === t && (!c || r.c === c));
  const todo = DROPS.filter((d) => has(d.table, d.column));
  const name = (d: (typeof DROPS)[number]) => (d.column ? `${d.table}.${d.column}` : `tabla ${d.table}`);

  const blocked = todo.filter((d) => d.needs && !has(...d.needs));
  if (blocked.length) throw new Error(`Falta lo que reemplaza a ${blocked.map(name).join(', ')}: esta base es anterior a R-30 o D-09. Recreala o cargá la demo.`);
  if (!todo.length) console.log(`"${orm.config.get('dbName')}" no tiene columnas viejas.`);
  else if (!confirmed) console.log(`Se borrarían de "${orm.config.get('dbName')}": ${todo.map(name).join(', ')}. Repetir con --yes para confirmar.`);
  else {
    for (const d of todo) {
      await conn.execute(d.column ? `ALTER TABLE \`${d.table}\` DROP COLUMN \`${d.column}\`` : `DROP TABLE \`${d.table}\``, [], 'run');
      console.log(`Borrado: ${name(d)}`);
    }
  }
} finally {
  await orm.close();
}
