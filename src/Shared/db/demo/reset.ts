import { EntityManager } from '@mikro-orm/core';
import type { EntityManager as SqlEntityManager } from '@mikro-orm/mysql';
import { VehicleType } from '../../../Vehicle/VehicleType/VehicleType.Entity.js';
import { Model } from '../../../Vehicle/Model/Model.Entity.js';
import { DnrpaTypeMap } from '../../../Vehicle/Catalog/DnrpaTypeMap.Entity.js';
import { VEHICLE_CATEGORIES, categorizeVehicleType, findBaseType, type VehicleCategory } from '../../utils/vehicleTypes.js';
import { descKey } from '../../utils/names.js';

// Todo lo que no es catálogo, en orden de dependencias (cada tabla antes que las que referencia).
// Se conservan: feriados nacionales, marcas, modelos, tipos de vehículo, descripciones del DNRPA, seguros y servicios del catálogo.
const TABLES = [
  'notification', 'reservation_services', 'invoice', 'reservation', 'vehicle',
  'day_exception', 'shift_closure', 'employee_shift', 'holiday_adhesion', 'holiday_parking',
  'service_price', 'parking_price', 'parking_space', 'parking', 'user',
];

// SQL dentro de la transacción del em: em.getConnection() va por otra conexión, y lo que borra no se desharía si algo falla.
export const txConnection = (em: EntityManager) => ({
  execute: <T = any>(query: string, params: unknown[] = [], method: 'all' | 'run' = 'all'): Promise<T> =>
    (em as unknown as SqlEntityManager).execute(query, params as any[], method) as Promise<T>,
});

// Tipo de la demo para una descripción del DNRPA: la regla general, más furgones y todo terreno como camioneta.
export const demoCategory = (description: string): VehicleCategory =>
  /FURG|TODOTERRENO/.test(descKey(description)) ? 'CAMIONETA' : categorizeVehicleType(description);

// Deja la base sin datos de uso y con tres tipos de vehículo: AUTO, MOTO y CAMIONETA.
export async function resetDemoData(em: EntityManager): Promise<{ deleted: Record<string, number>; types: number }> {
  const conn = txConnection(em);
  const present = new Set((await conn.execute<{ t: string }[]>(
    'SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')).map((r: { t: string }) => r.t));

  const deleted: Record<string, number> = {};
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0', [], 'run');
  try {
    for (const table of TABLES) {
      if (!present.has(table)) continue;
      const res = await conn.execute<{ affectedRows?: number }>(`DELETE FROM \`${table}\``, [], 'run');
      deleted[table] = res.affectedRows ?? 0;
    }
    // Feriados propios de los dueños (se borraron sus dueños); los nacionales quedan.
    deleted.holiday = (await conn.execute<{ affectedRows?: number }>('DELETE FROM holiday WHERE owner_id IS NOT NULL', [], 'run')).affectedRows ?? 0;
  } finally {
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1', [], 'run');
  }

  const types = await normalizeVehicleTypes(em);
  return { deleted, types };
}

// Cada modelo y cada descripción del DNRPA pasan al tipo base que les corresponde; los demás tipos se borran.
// Corre con plazas, tarifas y vehículos ya borrados, así que solo los modelos y la tabla de descripciones apuntan a un tipo.
async function normalizeVehicleTypes(em: EntityManager): Promise<number> {
  const all = await em.find(VehicleType, {});
  const base = new Map<VehicleCategory, VehicleType>();
  for (const c of VEHICLE_CATEGORIES) {
    // Si hay "AUTO" y "Auto", queda el escrito exacto; si solo hay "Auto", se renombra.
    const t = all.find((x) => x.name === c) ?? findBaseType(all, c) ?? em.create(VehicleType, { name: c });
    t.name = c;
    t.isActive = true;
    base.set(c, t);
  }
  await em.flush();

  const models = await em.find(Model, {}, { populate: ['vehicleType'] });
  for (const m of models) {
    const category = m.dnrpaDescription ? demoCategory(m.dnrpaDescription) : categorizeVehicleType(m.vehicleType?.name);
    m.vehicleType = base.get(category)!;
  }
  // Las no admitidas (sin tipo) siguen así.
  for (const row of await em.find(DnrpaTypeMap, { vehicleType: { $ne: null } })) row.vehicleType = base.get(demoCategory(row.description))!;
  await em.flush();

  const keep = new Set([...base.values()].map((t) => t.id));
  const extra = all.filter((t) => !keep.has(t.id));
  if (extra.length) await em.nativeDelete(VehicleType, { id: { $in: extra.map((t) => t.id) } });
  return extra.length;
}
