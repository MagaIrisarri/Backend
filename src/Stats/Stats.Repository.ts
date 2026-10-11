import { EntityManager, raw } from '@mikro-orm/mysql';
import { User } from '../User/User.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { Invoice } from '../Invoice/Invoice.Entity.js';
import { ReservationStatus, UserStatus } from '../Shared/constants/status.js';
import type { LocalityScope } from './Stats.Schema.js';

// Conteos y sumas para el panel del administrador: todo se calcula en la base (COUNT/SUM), sin traer filas.
// Con `scope`, cocheras, plazas, reservas y facturación se limitan a las cocheras de esa localidad; los usuarios son de todo el sistema.
export class StatsRepository {
  constructor(private em: EntityManager) {}

  async activeUsersByRole(): Promise<Record<string, number>> {
    const rows = await this.em.createQueryBuilder(User, 'u')
      .select(['u.type', raw('count(u.id) as total')])
      .where({ status: UserStatus.ACTIVO })
      .groupBy('u.type')
      .execute<any[]>();
    return Object.fromEntries(rows.map(r => [r.type, Number(r.total)]));
  }

  // Localidades con cocheras, para elegir el alcance del panel.
  async localities(): Promise<LocalityScope[]> {
    const rows: LocalityScope[] = await this.em.getConnection().execute(
      'SELECT DISTINCT province, locality FROM parking WHERE province IS NOT NULL ORDER BY province, locality');
    return rows.map(r => ({ province: r.province, locality: r.locality }));
  }

  async parkings(scope?: LocalityScope): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([this.em.count(Parking, { ...scope }), this.em.count(Parking, { ...scope, isActive: true })]);
    return { total, active };
  }

  async spaces(scope?: LocalityScope): Promise<{ total: number; occupied: number; maintenance: number }> {
    const parking = scope ? { parking: scope } : {};
    const [total, occupied, maintenance] = await Promise.all([
      this.em.count(ParkingSpace, { isActive: true, ...parking }),
      this.em.count(Reservation, { status: ReservationStatus.EN_CURSO, ...(scope ? { parkingSpace: parking } : {}) }),
      this.em.count(ParkingSpace, { isActive: true, state: SpaceState.MANTENIMIENTO, ...parking }),
    ]);
    return { total, occupied, maintenance };
  }

  // Reservas por estado según su fecha de inicio dentro del período.
  async reservationsByStatus(from: Date, to: Date, scope?: LocalityScope): Promise<Record<string, number>> {
    const rows = await this.em.createQueryBuilder(Reservation, 'r')
      .select(['r.status', raw('count(r.id) as total')])
      .where({ startTime: { $gte: from, $lt: to }, ...(scope ? { parkingSpace: { parking: scope } } : {}) })
      .groupBy('r.status')
      .execute<any[]>();
    return Object.fromEntries(rows.map(r => [r.status, Number(r.total)]));
  }

  // Facturas vigentes (no anuladas) emitidas en el período: total, cobrado y cantidad. createdAt es una columna date.
  async billing(from: string, to: string, scope?: LocalityScope): Promise<{ total: number; paid: number; count: number }> {
    const [row] = await this.em.createQueryBuilder(Invoice, 'i')
      .select([
        raw('coalesce(sum(i.total_amount), 0) as total'),
        raw("coalesce(sum(case when i.status = 'PAGADA' then i.total_amount else 0 end), 0) as paid"),
        raw('count(i.id) as count'),
      ])
      .where({ status: { $ne: 'ANULADA' }, createdAt: { $gte: from, $lt: to }, ...(scope ? { reservation: { parkingSpace: { parking: scope } } } : {}) })
      .execute<any[]>();
    return { total: Number(row?.total ?? 0), paid: Number(row?.paid ?? 0), count: Number(row?.count ?? 0) };
  }

  async topParkingsByBilling(from: string, to: string, limit: number, scope?: LocalityScope): Promise<{ id: string; name: string; total: number; count: number }[]> {
    // SQL directo: el query builder no tipa columnas de tablas unidas en el select.
    const rows: any[] = await this.em.getConnection().execute(
      `SELECT p.id, p.name, SUM(i.total_amount) AS total, COUNT(i.id) AS count
         FROM invoice i
         JOIN reservation r ON r.id = i.reservation_id
         JOIN parking_space ps ON ps.id = r.parking_space_id
         JOIN parking p ON p.id = ps.parking_id
        WHERE i.status <> 'ANULADA' AND i.created_at >= ? AND i.created_at < ?${scope ? ' AND p.province = ? AND p.locality = ?' : ''}
        GROUP BY p.id, p.name
        ORDER BY total DESC
        LIMIT ?`,
      [from, to, ...(scope ? [scope.province, scope.locality] : []), limit],
    );
    return rows.map(r => ({ id: r.id, name: r.name, total: Number(r.total), count: Number(r.count) }));
  }
}
