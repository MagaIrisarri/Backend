import { orm } from './orm.js';

// El margen entre reservas pasó de horas enteras (`parking.reservation_margin`) a minutos (`reservation_margin_minutes`).
// Corre al arrancar, ANTES de syncSchema: si la columna nueva la creara la sincronización, todas las cocheras tomarían el
// valor por defecto y perderían el suyo. Acá se agrega y se completa con las horas × 60. Idempotente: en una base nueva o ya
// pasada no hace nada.
// shortcut: L-39, la columna parking.reservation_margin (horas) queda sin uso, borrarla con SQL a mano
export async function migrateReservationMargin(): Promise<number> {
  const conn = orm.em.getConnection();
  const cols = ((await conn.execute(
    "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parking'",
  )) as { c: string }[]).map((r) => r.c);
  if (!cols.includes('reservation_margin') || cols.includes('reservation_margin_minutes')) return 0;

  await conn.execute('ALTER TABLE parking ADD COLUMN reservation_margin_minutes INT NULL', [], 'run');
  const res: { affectedRows?: number } = await conn.execute(
    'UPDATE parking SET reservation_margin_minutes = COALESCE(reservation_margin, 0) * 60', [], 'run');
  return res.affectedRows ?? 0;
}
