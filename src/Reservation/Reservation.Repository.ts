import { EntityManager } from '@mikro-orm/core';
import { Reservation } from './Reservation.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { Vehicle } from '../Vehicle/Vehicle.Entity.js';
import { User } from '../User/User.Entity.js';
import { Repository } from '../Shared/base.Repository.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ReservationRepository implements Repository<Reservation> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Reservation[]> {
    return await this.em.find( Reservation, { status: { $ne: 'CANCELADA' } },
      { populate: ['vehicle', 'parkingSpace', 'parkingSpace.parking', 'attendedBy'] }
    );
  }

  async findOne(item: { id: string }): Promise<Reservation | null> {
    return await this.em.findOne( Reservation, { id: item.id, status: { $ne: 'CANCELADA' } },
      { populate: ['vehicle', 'vehicle.client', 'parkingSpace', 'parkingSpace.parking', 'parkingSpace.parking.owner', 'attendedBy'] as any}
    );
  }

  async findByClientId(clientId: string): Promise<Reservation[]> {
    return await this.em.find(
      Reservation,
      { vehicle: { client: { id: clientId } } },
      { populate: ['vehicle', 'vehicle.client', 'parkingSpace', 'parkingSpace.parking', 'attendedBy'] }
    );
  }

  async findByParkingId(parkingId: string): Promise<Reservation[]> {
    return await this.em.find(
      Reservation,
      { parkingSpace: { parking: { id: parkingId } } },
      { populate: ['vehicle', 'vehicle.client', 'vehicle.brand', 'vehicle.model', 'vehicle.vehicleType', 'parkingSpace', 'parkingSpace.parking', 'services', 'services.serviceCatalog', 'attendedBy'] as any,
        orderBy: { startTime: 'DESC' }
      }
    );
  }

  async findByOwnerId(ownerId: string): Promise<Reservation[]> {
    return await this.em.find(
      Reservation,
      { parkingSpace: { parking: { owner: { id: ownerId } } } },
      { populate: ['vehicle', 'vehicle.client', 'vehicle.brand', 'vehicle.model', 'vehicle.vehicleType', 'parkingSpace', 'parkingSpace.parking', 'services', 'services.serviceCatalog', 'attendedBy'] as any,
        orderBy: { startTime: 'DESC' }
      }
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

  async createReservationAtomically(
    parking: Parking,
    vehicle: Vehicle,
    reqStartTime: Date,
    reqEndTime: Date,
    parkingSpaceId?: string,
    serviceIds?: string[]
  ): Promise<Reservation> {
    return await this.em.transactional(async (txEm) => {
      // 0. Validar que el mismo vehículo no tenga ya una reserva superpuesta en ese período
      const conflictingVehicleReservations = await txEm.find(Reservation, {
        vehicle,
        status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
        $and: [
          { startTime: { $lt: reqEndTime } },
          { endTime: { $gt: reqStartTime } }
        ]
      }, { populate: ['parkingSpace', 'parkingSpace.parking'] as any });

      if (conflictingVehicleReservations.length > 0) {
        const existing = conflictingVehicleReservations[0];
        const formatTime = (d: Date) => {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };
        const parkingName = existing.parkingSpace?.parking?.name
          ? ` en "${existing.parkingSpace.parking.name}"`
          : '';
        throw new AppError(
          `Este vehículo ya posee una reserva activa${parkingName} en ese horario (${formatTime(existing.startTime)} a ${formatTime(existing.endTime)} hs)`,
          400
        );
      }

      const marginMs = parking.reservationMargin * 60 * 60 * 1000;
      const startWithMargin = new Date(reqStartTime.getTime() - marginMs);
      const endWithMargin = new Date(reqEndTime.getTime() + marginMs);

      let targetSpace: ParkingSpace | null = null;

      const getVehicleVariants = (typeName?: string): string[] => {
        const v = (typeName || '').trim().toUpperCase();
        if (v.includes('MOTO')) return ['MOTOCICLETA', 'Motocicleta', 'MOTO', 'Moto', 'moto', 'motocicleta'];
        if (v.includes('CAMION') || v.includes('UTIL') || v.includes('VAN') || v.includes('PICK')) {
          return ['CAMIONETA', 'Camioneta', 'UTILITARIO', 'Utilitario', 'utilitario', 'camioneta', 'VAN', 'Van'];
        }
        return ['AUTO', 'Auto', 'auto', 'AUTOMOVIL', 'Automovil'];
      };

      const allowedVariants = getVehicleVariants(vehicle.vehicleType?.name);

      if (parkingSpaceId) {
        const space = await txEm.findOne(ParkingSpace, {
          id: parkingSpaceId,
          parking,
          vehicleType: { $in: allowedVariants },
          state: SpaceState.LIBRE,
          isActive: true
        });

        if (!space) {
          throw new Error("La plaza seleccionada no existe o no corresponde a este vehículo");
        }

        const conflictingReservations = await txEm.find(Reservation, {
          parkingSpace: space,
          status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
          $and: [
            { startTime: { $lt: endWithMargin } },
            { endTime: { $gt: startWithMargin } }
          ]
        });

        if (conflictingReservations.length > 0) {
          throw new Error("La plaza seleccionada ya no está disponible para el horario elegido");
        }

        targetSpace = space;
      } else {
        // ASIGNACIÓN AUTOMÁTICA DE PLAZA
        const candidateSpaces = await txEm.find(ParkingSpace, {
          parking,
          vehicleType: { $in: allowedVariants },
          state: SpaceState.LIBRE,
          isActive: true
        }, { orderBy: { spaceCode: 'ASC' } });

        if (candidateSpaces.length === 0) {
          throw new Error("No hay plazas habilitadas para este tipo de vehículo en la cochera");
        }

        const conflictingReservations = await txEm.find(Reservation, {
          parkingSpace: { $in: candidateSpaces },
          status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
          $and: [
            { startTime: { $lt: endWithMargin } },
            { endTime: { $gt: startWithMargin } }
          ]
        }, { populate: ['parkingSpace'] });

        const occupiedSpaceIds = new Set(conflictingReservations.map(r => r.parkingSpace.id));

        targetSpace = candidateSpaces.find(s => !occupiedSpaceIds.has(s.id)) || null;

        if (!targetSpace) {
          throw new Error("No hay plazas disponibles para este tipo de vehículo en el horario seleccionado");
        }
      }

      const reservation = txEm.create(Reservation, {
        startTime: reqStartTime,
        endTime: reqEndTime,
        vehicle,
        parkingSpace: targetSpace,
        status: 'PENDIENTE'
      });

      if (serviceIds && serviceIds.length > 0) {
        const { ServicePrice } = await import('../ServicePrice/ServicePrice.Entity.js');
        const services = await txEm.find(ServicePrice, { id: { $in: serviceIds }, parking });
        reservation.services.add(services);
      }

      return reservation;
    });
  }

  async findConflictingSpaceIds(parking: Parking, startWithMargin: Date, endWithMargin: Date) {
    const conflictingReservations = await this.em.find(Reservation, {
      parkingSpace: { parking },
      status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
      $and: [
        { startTime: { $lt: endWithMargin } },
        { endTime: { $gt: startWithMargin } }
      ]
    }, { populate: ['parkingSpace'] });

    const occupiedSpaceIds = new Set(
      conflictingReservations.map(res => res.parkingSpace.id)
    );

    return occupiedSpaceIds;
  }

  async findConflictingVehicleReservation(vehicleId: string, startTime: Date, endTime: Date): Promise<Reservation | null> {
    return await this.em.findOne(Reservation, {
      vehicle: { id: vehicleId },
      status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    }, { populate: ['parkingSpace', 'parkingSpace.parking'] as any });
  }
}

