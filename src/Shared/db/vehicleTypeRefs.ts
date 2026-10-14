import crypto from 'node:crypto';
import { orm } from './orm.js';
import { VEHICLE_CATEGORIES, categorizeVehicleType } from '../utils/vehicleTypes.js';

// R-30: plazas y tarifas pasaron de guardar el tipo como texto ('AUTO', 'MOTO', 'CAMIONETA') a apuntar al tipo de vehículo.
// Corre al arrancar, ANTES de syncSchema: la sincronización agrega vehicle_type_id como NOT NULL con su clave foránea,
// y eso falla si la columna llega vacía. Acá se agrega, se completa desde el texto y el texto queda nullable.
// Idempotente: en una base nueva o ya pasada no hace nada.
// shortcut: L-39, la columna vehicle_type (texto) de parking_space y parking_price queda sin uso, borrarla con SQL a mano
const TABLES = ['parking_space', 'parking_price'] as const;

export async function migrateVehicleTypeRefs(): Promise<number> {
  const conn = orm.em.getConnection();
  const columnsOf = async (table: string): Promise<string[]> =>
    ((await conn.execute('SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [table])) as { c: string }[])
      .map((r) => r.c);

  let moved = 0;
  for (const table of TABLES) {
    const cols = await columnsOf(table);
    if (!cols.includes('vehicle_type') || cols.includes('vehicle_type_id')) continue;
    if (!(await columnsOf('vehicle_type')).length) throw new Error('Falta la tabla vehicle_type para pasar plazas y tarifas al tipo de vehículo');

    // Los tipos base tienen que existir: cada texto viejo se reduce a uno de ellos.
    for (const name of VEHICLE_CATEGORIES) {
      const [{ n }] = await conn.execute('SELECT COUNT(*) AS n FROM vehicle_type WHERE name = ?', [name]);
      if (!Number(n)) await conn.execute('INSERT INTO vehicle_type (id, name, is_active) VALUES (?, ?, 1)', [crypto.randomUUID(), name], 'run');
    }
    // BINARY: compara el texto exacto (la columna no distingue mayúsculas y 'Camioneta' coincidiría con 'CAMIONETA').
    const texts: { t: string }[] = await conn.execute(`SELECT DISTINCT BINARY vehicle_type AS t FROM ${table} WHERE vehicle_type IS NOT NULL`);
    for (const { t } of texts) {
      const raw = String(t), base = categorizeVehicleType(raw);
      if (raw !== base) await conn.execute(`UPDATE ${table} SET vehicle_type = ? WHERE BINARY vehicle_type = ?`, [base, raw], 'run');
    }

    await conn.execute(`ALTER TABLE ${table} ADD COLUMN vehicle_type_id VARCHAR(255) NULL`, [], 'run');
    const res: { affectedRows?: number } = await conn.execute(
      `UPDATE ${table} t SET t.vehicle_type_id = (SELECT vt.id FROM vehicle_type vt WHERE vt.name = t.vehicle_type ORDER BY vt.is_active DESC, vt.id LIMIT 1)`,
      [], 'run');
    await conn.execute(`ALTER TABLE ${table} MODIFY vehicle_type VARCHAR(255) NULL`, [], 'run');
    moved += res.affectedRows ?? 0;
  }
  return moved;
}
