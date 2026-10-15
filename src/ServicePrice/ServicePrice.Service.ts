import { ServicePriceRepository } from './ServicePrice.Repository.js';
import { ServicePrice } from './ServicePrice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';
import { Reservation, reservationCode } from '../Reservation/Reservation.Entity.js';

export class ServicePriceService {
  constructor(private repo: ServicePriceRepository) {}

  async findOne(id: string): Promise<ServicePrice | null> {
    return await this.repo.findOne({ id });
  }

  async create(parkingId: string, serviceCatalogId: string, price: number): Promise<ServicePrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new AppError("Estacionamiento no encontrado", 400);

    const serviceCatalog = await this.repo.findServiceCatalog(serviceCatalogId);
    if (!serviceCatalog) throw new AppError("Servicio no encontrado", 400);

    const currentActivePrice = await this.repo.findActive(parkingId, serviceCatalogId);
    if (currentActivePrice) {
      await this.repo.remove({ id: currentActivePrice.id });
    }

    return await this.repo.add({ parking, serviceCatalog, price });
  }

  async findPricesByParking(parkingId: string): Promise<ServicePrice[]> {
    return await this.repo.findByParking(parkingId);
  }

  async findActivePrice(parkingId: string, serviceCatalogId: string): Promise<ServicePrice | null> {
    return await this.repo.findActive(parkingId, serviceCatalogId);
  }

  // Sacar el servicio de la sucursal: no con reservas pendientes o en curso que lo tienen (se cobraría igual en la salida).
  // El cambio de precio (create) vence el anterior sin esta regla: esas reservas siguen con el precio que tenían.
  async remove(id: string): Promise<boolean> {
    const price = await this.repo.findOne({ id });
    if (price && !price.expirationDate) assertNoActiveReservations(price.serviceCatalog.name, await this.repo.activeReservationsUsing(id));
    return await this.repo.remove({ id });
  }
}

// 409 con las reservas que lo usan (details.reservations), como las demás bajas con dependencias activas.
export function assertNoActiveReservations(serviceName: string, reservations: Reservation[]): void {
  if (!reservations.length) return;
  const codes = reservations.slice(0, 5).map((r) => r.code ?? reservationCode(r.id)).join(', ');
  const more = reservations.length > 5 ? ` y ${reservations.length - 5} más` : '';
  throw new AppError(
    `No se puede dar de baja "${serviceName}": lo tienen ${reservations.length} reserva(s) pendiente(s) o en curso (${codes}${more}). Quitalo de esas reservas o esperá a que terminen.`,
    409,
    { reservations: reservations.map((r) => ({ id: r.id, code: r.code ?? reservationCode(r.id), status: r.status, startTime: r.startTime, parking: r.parkingSpace?.parking?.name })) },
  );
}