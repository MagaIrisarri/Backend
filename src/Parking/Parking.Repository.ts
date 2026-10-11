import { EntityManager, raw } from '@mikro-orm/mysql';
import { Parking } from './Parking.Entity.js';
import { User } from '../User/User.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { Invoice } from '../Invoice/Invoice.Entity.js';
import { ParkingPrice } from '../ParkingPrice/ParkingPrice.Entity.js';
import { Repository } from '../Shared/base.Repository.js';
import { ACTIVE_RESERVATION_STATUSES, ReservationStatus } from '../Shared/constants/status.js';

export class ParkingRepository implements Repository<Parking> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Parking[]> {
    return await this.em.find(Parking, {}, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any });
  }

  async findActive(): Promise<Parking[]> {
    return await this.em.find(Parking, { isActive: true }, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any });
  }

  async findOne(item: { id: string }): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: item.id }, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any });
  }

  async findByOwnerId(ownerId: string): Promise<Parking[]> {
    return await this.em.find(Parking, { owner: { id: ownerId } }, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any, orderBy: { name: 'ASC' } });
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

  async getUserById(userId: string): Promise<User | null> {
    return await this.em.findOne(User, { id: userId });
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
      CONFIRMADA: 0,
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
