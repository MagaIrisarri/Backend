import { EntityManager } from '@mikro-orm/core';
import { Reservation } from './Reservation.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ParkingSpace } from '../ParkingSpace/ParkingSpace.Entity.js';
import { Vehicle } from '../Vehicle/Vehicle.Entity.js';
import { User } from '../User/User.Entity.js';
import { UpdateReservationInput } from './Reservation.Schema.js';

export class ReservationRepository {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Reservation[]> {
    return await this.em.find(
      Reservation,
      { status: { $ne: 'CANCELADA' } },
      { populate: ['vehicle', 'parkingSpace', 'parkingSpace.parking', 'attendedBy'] as any }
    );
  }

  async findById(id: string): Promise<Reservation | null> {
    return await this.em.findOne(
      Reservation,
      { id, status: { $ne: 'CANCELADA' } },
      { populate: ['vehicle', 'parkingSpace', 'parkingSpace.parking', 'attendedBy'] as any }
    );
  }

  async getDependencies(parkingId: string, vehicleId: string) {
    const parking = await this.em.findOne(Parking, { id: parkingId, isActive: true });
    const vehicle = await this.em.findOne(Vehicle, { id: vehicleId, isActive: true }, { populate: ['vehicleType'] as any });
    return { parking, vehicle };
  }

  async findAvailableSpace(
    parking: Parking, 
    vehicleTypeName: string, 
    reqStartTime: Date, 
    reqEndTime: Date
  ): Promise<ParkingSpace | null> {
    const marginMs = parking.reservationMargin * 60 * 60 * 1000;
    const startWithMargin = new Date(reqStartTime.getTime() - marginMs);
    const endWithMargin = new Date(reqEndTime.getTime() + marginMs);

    const allSpaces = await this.em.find(ParkingSpace, {
      parking,
      vehicleType: vehicleTypeName,
      state: 'LIBRE',
    });

    if (allSpaces.length === 0) return null;

    const conflictingReservations = await this.em.find(Reservation, {
      parkingSpace: { parking },
      status: { $in: ['PENDIENTE', 'CONFIRMADA'] },
      $and: [
        { startTime: { $lt: endWithMargin } },
        { endTime: { $gt: startWithMargin } }
      ]
    }, { populate: ['parkingSpace'] as any });

    const occupiedSpaceIds = new Set(
      conflictingReservations.map(res => res.parkingSpace.id)
    );

    return allSpaces.find(space => !occupiedSpaceIds.has(space.id)) || null;
  }

  async create(data: {
    startTime: Date;
    endTime: Date;
    vehicle: Vehicle;
    parkingSpace: ParkingSpace;
    status?: string;
  }): Promise<Reservation> {
    const reservation = this.em.create(Reservation, data);
    await this.em.flush();
    return reservation;
  }

  async update(reservation: Reservation, data: UpdateReservationInput): Promise<Reservation> {
    if (data.attendedById) {
      const employee = await this.em.findOne(User, { id: data.attendedById, status: 'ACTIVO' });
      if (employee) reservation.attendedBy = employee;
    }
    this.em.assign(reservation, {
      startTime: data.startTime ?? reservation.startTime,
      endTime: data.endTime ?? reservation.endTime,
      status: data.status ?? reservation.status,
    });
    await this.em.flush();
    return reservation;
  }

  async deactivate(reservation: Reservation): Promise<void> {
    reservation.status = 'CANCELADA';
    await this.em.flush();
  }
}