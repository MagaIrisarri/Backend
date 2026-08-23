import { EntityManager } from '@mikro-orm/core';
import { Reservation } from './Reservation.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ParkingSpace } from '../ParkingSpace/ParkingSpace.Entity.js';
import { Vehicle } from '../Vehicle/Vehicle.Entity.js';
import { User } from '../User/User.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

export class ReservationRepository implements Repository<Reservation> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Reservation[]> {
    return await this.em.find( Reservation, { status: { $ne: 'CANCELADA' } },
      { populate: ['vehicle', 'parkingSpace', 'parkingSpace.parking', 'attendedBy'] }
    );
  }

  async findOne(item: { id: string }): Promise<Reservation | null> {
    return await this.em.findOne( Reservation, { id: item.id, status: { $ne: 'CANCELADA' } },
      { populate: ['vehicle', 'parkingSpace', 'parkingSpace.parking', 'attendedBy']}
    );
  }

  async add(data: any): Promise<Reservation> {
    const reservation = this.em.create(Reservation, data);
    await this.em.flush();
    return reservation;
  }

  async update(id: string, data: any): Promise<Reservation | null> {
    const reservation = await this.findOne({ id });
    if (!reservation) return null;

    if (data.attendedById) {
      const employee = await this.em.findOne(User, { id: data.attendedById, status: 'ACTIVO' });
      if (employee) reservation.attendedBy = employee;
    }
    
    this.em.assign(reservation, {
      startTime: data.startTime ?? reservation.startTime,
      endTime: data.endTime ?? reservation.endTime,
      status: data.status ?? reservation.status
    });
    
    await this.em.flush();
    return reservation;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const reservation = await this.findOne({ id: item.id });
    if (!reservation) return false;

    reservation.status = 'CANCELADA';
    await this.em.flush();
    return true;
  }

  async getDependencies(parkingId: string, vehicleId: string) {
    const parking = await this.em.findOne(Parking, { id: parkingId, isActive: true });
    const vehicle = await this.em.findOne(Vehicle, { id: vehicleId, isActive: true }, { populate: ['vehicleType'] as any });
    return { parking, vehicle };
  }

  async createReservationAtomically( parking: Parking, vehicle: Vehicle, reqStartTime: Date, reqEndTime: Date): Promise<Reservation>{
    
    return await this.em.transactional(async (txEm) => {
      const marginMs = parking.reservationMargin * 60 * 60 * 1000;
      const startWithMargin = new Date(reqStartTime.getTime() - marginMs);
      const endWithMargin = new Date(reqEndTime.getTime() + marginMs);
      const allSpaces = await txEm.find(ParkingSpace, { parking, vehicleType: vehicle.vehicleType.name, state: 'LIBRE'});

      if (allSpaces.length === 0) {
        throw new Error("No hay plazas para este tipo de vehículo en el estacionamiento");
      }

      const conflictingReservations = await txEm.find(Reservation, { parkingSpace: { parking }, status: { $in: ['PENDIENTE', 'CONFIRMADA'] },
        $and: [
          { startTime: { $lt: endWithMargin } },
          { endTime: { $gt: startWithMargin } }
        ]
      }, { populate: ['parkingSpace'] });

      const occupiedSpaceIds = new Set(
        conflictingReservations.map(res => res.parkingSpace.id)
      );

      const availableSpace = allSpaces.find(space => !occupiedSpaceIds.has(space.id));

      if (!availableSpace) {
        throw new Error("No hay plazas disponibles en el horario seleccionado");
      }

      const reservation = txEm.create(Reservation, { startTime: reqStartTime, endTime: reqEndTime, vehicle, parkingSpace: availableSpace, status: 'PENDIENTE'});

      return reservation;
    });
  }
}