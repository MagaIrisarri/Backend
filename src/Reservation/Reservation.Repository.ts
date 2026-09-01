import { EntityManager } from '@mikro-orm/core';
import { Reservation } from './Reservation.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
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

  async createReservationAtomically( parking: Parking, vehicle: Vehicle, reqStartTime: Date, reqEndTime: Date, parkingSpaceId: string): Promise<Reservation>{
    
    return await this.em.transactional(async (txEm) => {
      const marginMs = parking.reservationMargin * 60 * 60 * 1000;
      const startWithMargin = new Date(reqStartTime.getTime() - marginMs);
      const endWithMargin = new Date(reqEndTime.getTime() + marginMs);
      const space = await txEm.findOne(ParkingSpace, { id: parkingSpaceId, parking, vehicleType: vehicle.vehicleType.name, state: SpaceState.LIBRE, isActive: true});

      if (!space) {
        throw new Error("La plaza seleccionada no existe o no corresponde a este vehículo");
      }

      const conflictingReservations = await txEm.find(Reservation, { parkingSpace:  space, status: { $in: ['PENDIENTE', 'CONFIRMADA'] },
        $and: [
          { startTime: { $lt: endWithMargin } },
          { endTime: { $gt: startWithMargin } }
        ]
      }, { populate: ['parkingSpace'] });

      if(conflictingReservations.length > 0){
        throw new Error("La plaza seleccionada ya no está disponible para el horario elegido");
      }

      const reservation = txEm.create(Reservation, { startTime: reqStartTime, endTime: reqEndTime, vehicle, parkingSpace: space, status: 'PENDIENTE'});

      return reservation;
    });
  }

    async findConflictingSpaceIds(parking:Parking, startWithMargin: Date, endWithMargin: Date){
  
      const conflictingReservations =await this.em.find (Reservation, { parkingSpace: { parking }, status: { $in: ['PENDIENTE', 'CONFIRMADA'] },
          $and: [
            { startTime: { $lt: endWithMargin } },
            { endTime: { $gt: startWithMargin } }
          ]
        }, { populate: ['parkingSpace'] });
  
        const occupiedSpaceIds = new Set(
          conflictingReservations.map(res => res.parkingSpace.id)
        );
  
        return occupiedSpaceIds;
      };

  }

