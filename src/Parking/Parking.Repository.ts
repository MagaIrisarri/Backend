import { EntityManager, LockMode, raw } from '@mikro-orm/mysql';
import { Parking } from './Parking.Entity.js';
import { User } from '../User/User.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { Invoice } from '../Invoice/Invoice.Entity.js';
import { ParkingPrice } from '../ParkingPrice/ParkingPrice.Entity.js';
import { VehicleType } from '../Vehicle/VehicleType/VehicleType.Entity.js';
import { Repository } from '../Shared/base.Repository.js';
import { likeWords } from '../Shared/utils/pagination.js';
import { ACTIVE_RESERVATION_STATUSES, ReservationStatus } from '../Shared/constants/status.js';

// Localidades con cocheras (con su provincia: hay localidades homónimas), para elegir el alcance de un listado o del panel.
export const listLocalities = (em: EntityManager): Promise<{ province: string; locality: string }[]> =>
  em.getConnection().execute('SELECT DISTINCT province, locality FROM parking WHERE province IS NOT NULL ORDER BY province, locality');

export interface ParkingPageOptions { page: number; limit: number; q?: string; province?: string; locality?: string; status?: 'on' | 'off' }

export class ParkingRepository implements Repository<Parking> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Parking[]> {
    return await this.em.find(Parking, {}, { populate: ['owner', 'parkingpriceHistory', 'parkingpriceHistory.vehicleType', 'parkingSpaces', 'parkingSpaces.vehicleType'] as any });
  }

  // Una página de cocheras con búsqueda (nombre, dirección, barrio o dueño), localidad y estado. `counts` ignora el estado para rotular sus filtros.
  async findPage(o: ParkingPageOptions): Promise<{ items: Parking[]; total: number; counts: { on: number; off: number } }> {
    const filters: any[] = [];
    if (o.province) filters.push({ province: o.province });
    if (o.locality) filters.push({ locality: o.locality });
    for (const w of likeWords(o.q)) {
      filters.push({ $or: [{ name: { $like: w } }, { address: { $like: w } }, { neighborhood: { $like: w } }, { owner: { $or: [{ name: { $like: w } }, { last_name: { $like: w } }] } }] });
    }
    const where: any = filters.length ? { $and: filters } : {};
    const [[items, total], on, off] = await Promise.all([
      this.em.findAndCount(Parking, { ...where, ...(o.status && { isActive: o.status === 'on' }) }, {
        populate: ['owner', 'parkingpriceHistory', 'parkingpriceHistory.vehicleType', 'parkingSpaces', 'parkingSpaces.vehicleType'] as any, orderBy: { name: 'ASC' }, limit: o.limit, offset: (o.page - 1) * o.limit,
      }),
      this.em.count(Parking, { ...where, isActive: true }),
      this.em.count(Parking, { ...where, isActive: false }),
    ]);
    return { items, total, counts: { on, off } };
  }

  async localities() {
    return listLocalities(this.em);
  }

  async findActive(): Promise<Parking[]> {
    return await this.em.find(Parking, { isActive: true }, { populate: ['owner', 'parkingpriceHistory', 'parkingpriceHistory.vehicleType', 'parkingSpaces', 'parkingSpaces.vehicleType'] as any });
  }

  async findOne(item: { id: string }): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: item.id }, { populate: ['owner', 'parkingpriceHistory', 'parkingpriceHistory.vehicleType', 'parkingSpaces', 'parkingSpaces.vehicleType'] as any });
  }

  async findByOwnerId(ownerId: string): Promise<Parking[]> {
    return await this.em.find(Parking, { owner: { id: ownerId } }, { populate: ['owner', 'parkingpriceHistory', 'parkingpriceHistory.vehicleType', 'parkingSpaces', 'parkingSpaces.vehicleType'] as any, orderBy: { name: 'ASC' } });
  }


  async add(data: any): Promise<Parking> {
    const parking = this.em.create(Parking, { ...data, isActive: false });
    await this.em.flush();
    return parking;
  }

  async update(id: string, data: any): Promise<Parking | null> {
    const parking = await this.findOne({ id });
    if (!parking) return null;

    this.em.assign(parking, data);
    await this.em.flush();
    return parking;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const parking = await this.findOne({ id: item.id });
    if (!parking) return false;

    parking.isActive = false;
    await this.em.flush();
    return true;
  }

  // Tipos de vehículo activos entre los pedidos (alta de cochera con plazas por tipo, R-30).
  async findVehicleTypes(ids: string[]): Promise<VehicleType[]> {
    return ids.length ? await this.em.find(VehicleType, { id: { $in: ids }, isActive: true }) : [];
  }

  async getUserById(userId: string): Promise<User | null> {
    return await this.em.findOne(User, { id: userId });
  }

  // L-42: pausa y cancela las pendientes en una transacción, con la fila bloqueada como el alta de reservas: una que se
  // está creando espera y después ve la sucursal pausada. Las que están en curso siguen hasta su salida.
  // L-44: con walkInOnly sigue activa (en el mapa y en el mostrador) y solo deja de tomar reservas online.
  async pause(id: string, cancelReason: string, walkInOnly: boolean): Promise<{ parking: Parking; cancelled: Reservation[]; inProgress: number } | null> {
    return await this.em.transactional(async (em) => {
      const parking = await em.findOne(Parking, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true });
      if (!parking) return null;
      Object.assign(parking, { isActive: walkInOnly, walkInOnly });
      const atParking = { parkingSpace: { parking: { id } } };
      const cancelled = await em.find(Reservation, { ...atParking, status: ReservationStatus.PENDIENTE },
        { populate: ['vehicle', 'vehicle.client', 'parkingSpace', 'parkingSpace.parking'] as any });
      for (const r of cancelled) Object.assign(r, { status: ReservationStatus.CANCELADA, cancelReason });
      const inProgress = await em.count(Reservation, { ...atParking, status: ReservationStatus.EN_CURSO });
      return { parking, cancelled, inProgress };
    });
  }

  async hasActivePrices(parkingId: string): Promise<boolean> {
    const count = await this.em.count(ParkingPrice, {
      parking: { id: parkingId },
      expirationDate: null,
    });
    return count > 0;
  }

  async getReservationStatusCounts(parkingId: string): Promise<Record<string, number>> {
    const counts: Record<string, number> = {
      PENDIENTE: 0,
      'EN CURSO': 0,
      FINALIZADA: 0,
      CANCELADA: 0,
    };

    const results = await this.em.createQueryBuilder(Reservation, 'r')
      .select(['r.status', raw('count(r.id) as total')])
      .join('r.parkingSpace', 'ps')
      .where({ 'ps.parking': parkingId })
      .groupBy('r.status')
      .execute<any[]>();

    for (const row of results) {
      if (counts[row.status] !== undefined) {
        counts[row.status] = Number(row.total) || 0;
      }
    }

    return counts;
  }

  async getTotalRevenue(parkingId: string): Promise<number> {
    const result = await this.em.createQueryBuilder(Invoice, 'i')
      .select(raw('coalesce(sum(i.total_amount), 0) as total'))
      .join('i.reservation', 'r')
      .join('r.parkingSpace', 'ps')
      .where({
        'ps.parking': parkingId,
        'r.status': 'FINALIZADA',
        'i.status': { $in: ['PAGADA', 'PENDIENTE'] },
      })
      .execute<any>();

    return Number(result?.[0]?.total ?? result?.total ?? 0);
  }

  // Vehículos adentro ahora: reservas EN CURSO (entre el check-in y el check-out), aunque se hayan pasado de hora.
  async findInProgressReservationsForSpaces(spaceIds: string[]): Promise<Reservation[]> {
    if (!spaceIds.length) return [];
    return await this.em.find(
      Reservation,
      { parkingSpace: { id: { $in: spaceIds } }, status: ReservationStatus.EN_CURSO },
    );
  }
}
