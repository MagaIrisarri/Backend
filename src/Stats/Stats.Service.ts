import { StatsRepository } from './Stats.Repository.js';
import { STATS_PERIOD_DAYS, STATS_TOP_PARKINGS } from '../Shared/constants/stats.js';
import { isoDate } from '../Shared/utils/dateUtils.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export class StatsService {
  constructor(private repo: StatsRepository) {}

  // Resumen del panel del administrador: estado actual (usuarios, cocheras, plazas) y el período con el anterior para comparar.
  async summary() {
    const now = new Date();
    const from = new Date(now.getTime() - STATS_PERIOD_DAYS * DAY_MS);
    const prevFrom = new Date(from.getTime() - STATS_PERIOD_DAYS * DAY_MS);
    // Las facturas se filtran por fecha (columna date): el período incluye hoy.
    const tomorrow = isoDate(new Date(now.getTime() + DAY_MS)), fromDay = isoDate(from), prevFromDay = isoDate(prevFrom);

    const [users, parkings, spaces, reservations, prevReservations, billing, prevBilling, topParkings] = await Promise.all([
      this.repo.activeUsersByRole(),
      this.repo.parkings(),
      this.repo.spaces(),
      this.repo.reservationsByStatus(from, now),
      this.repo.reservationsByStatus(prevFrom, from),
      this.repo.billing(fromDay, tomorrow),
      this.repo.billing(prevFromDay, fromDay),
      this.repo.topParkingsByBilling(fromDay, tomorrow, STATS_TOP_PARKINGS),
    ]);
    const sum = (r: Record<string, number>) => Object.values(r).reduce((a, n) => a + n, 0);

    return {
      periodDays: STATS_PERIOD_DAYS,
      users: { total: sum(users), byRole: users },
      parkings,
      spaces,
      reservations: { total: sum(reservations), byStatus: reservations, previousTotal: sum(prevReservations) },
      billing: { ...billing, previousTotal: prevBilling.total },
      topParkings,
    };
  }
}
