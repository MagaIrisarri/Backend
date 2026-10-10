import { EntityManager, raw } from '@mikro-orm/mysql';
import { User } from '../User/User.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { Invoice } from '../Invoice/Invoice.Entity.js';
import { ReservationStatus, UserStatus } from '../Shared/constants/status.js';

// Conteos y sumas para el panel del administrador: todo se calcula en la base (COUNT/SUM), sin traer filas.
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

  async parkings(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([this.em.count(Parking, {}), this.em.count(Parking, { isActive: true })]);
    return { total, active };
  }

  async spaces(): Promise<{ total: number; occupied: number; maintenance: number }> {
    const [total, occupied, maintenance] = await Promise.all([
      this.em.count(ParkingSpace, { isActive: true }),
      this.em.count(Reservation, { status: ReservationStatus.EN_CURSO }),
      this.em.count(ParkingSpace, { isActive: true, state: SpaceState.MANTENIMIENTO }),
    ]);
    return { total, occupied, maintenance };
  }

  // Reservas por estado según su fecha de inicio dentro del período.
  async reservationsByStatus(from: Date, to: Date): Promise<Record<string, number>> {
    const rows = await this.em.createQueryBuilder(Reservation, 'r')
      .select(['r.status', raw('count(r.id) as total')])
      .where({ startTime: { $gte: from, $lt: to } })
      .groupBy('r.status')
      .execute<any[]>();
    return Object.fromEntries(rows.map(r => [r.status, Number(r.total)]));
  }

  // Facturas vigentes (no anuladas) emitidas en el período: total, cobrado y cantidad. createdAt es una columna date.
  async billing(from: string, to: string): Promise<{ total: number; paid: number; count: number }> {
    const [row] = await this.em.createQueryBuilder(Invoice, 'i')
      .select([
        raw('coalesce(sum(i.total_amount), 0) as total'),
        raw("coalesce(sum(case when i.status = 'PAGADA' then i.total_amount else 0 end), 0) as paid"),
        raw('count(i.id) as count'),
      ])
      .where({ status: { $ne: 'ANULADA' }, createdAt: { $gte: from, $lt: to } })
      .execute<any[]>();
    return { total: Number(row?.total ?? 0), paid: Number(row?.paid ?? 0), count: Number(row?.count ?? 0) };
  }

  async topParkingsByBilling(from: string, to: string, limit: number): Promise<{ id: string; name: string; total: number; count: number }[]> {
    // SQL directo: el query builder no tipa columnas de tablas unidas en el select.
    const rows: any[] = await this.em.getConnection().execute(
      `SELECT p.id, p.name, SUM(i.total_amount) AS total, COUNT(i.id) AS count
         FROM invoice i
         JOIN reservation r ON r.id = i.reservation_id
         JOIN parking_space ps ON ps.id = r.parking_space_id
         JOIN parking p ON p.id = ps.parking_id
        WHERE i.status <> 'ANULADA' AND i.created_at >= ? AND i.created_at < ?
        GROUP BY p.id, p.name
        ORDER BY total DESC
        LIMIT ?`,
      [from, to, limit],
    );
    return rows.map(r => ({ id: r.id, name: r.name, total: Number(r.total), count: Number(r.count) }));
  }
}
