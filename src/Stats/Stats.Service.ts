import { StatsRepository } from './Stats.Repository.js';
import { STATS_PERIOD_DAYS, STATS_TOP_PARKINGS } from '../Shared/constants/stats.js';
import { isoDate } from '../Shared/utils/dateUtils.js';
import type { LocalityScope } from './Stats.Schema.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export class StatsService {
  constructor(private repo: StatsRepository) {}

  // Resumen del panel del administrador: estado actual (usuarios, cocheras, plazas) y el período con el anterior para comparar.
  // Con `scope`, todo menos los usuarios se limita a las cocheras de esa localidad.
  async summary(scope?: LocalityScope) {
    const now = new Date();
    const from = new Date(now.getTime() - STATS_PERIOD_DAYS * DAY_MS);
    const prevFrom = new Date(from.getTime() - STATS_PERIOD_DAYS * DAY_MS);
    // Las facturas se filtran por fecha (columna date): el período incluye hoy.
    const tomorrow = isoDate(new Date(now.getTime() + DAY_MS)), fromDay = isoDate(from), prevFromDay = isoDate(prevFrom);

    const [users, localities, parkings, spaces, reservations, prevReservations, billing, prevBilling, topParkings] = await Promise.all([
      this.repo.activeUsersByRole(),
      this.repo.localities(),
      this.repo.parkings(scope),
      this.repo.spaces(scope),
      this.repo.reservationsByStatus(from, now, scope),
      this.repo.reservationsByStatus(prevFrom, from, scope),
      this.repo.billing(fromDay, tomorrow, scope),
      this.repo.billing(prevFromDay, fromDay, scope),
      this.repo.topParkingsByBilling(fromDay, tomorrow, STATS_TOP_PARKINGS, scope),
    ]);
    const sum = (r: Record<string, number>) => Object.values(r).reduce((a, n) => a + n, 0);

    return {
      periodDays: STATS_PERIOD_DAYS,
      scope: scope ?? null,
      localities,
      users: { total: sum(users), byRole: users },
      parkings,
      spaces,
      reservations: { total: sum(reservations), byStatus: reservations, previousTotal: sum(prevReservations) },
      billing: { ...billing, previousTotal: prevBilling.total },
      topParkings,
    };
  }
}
