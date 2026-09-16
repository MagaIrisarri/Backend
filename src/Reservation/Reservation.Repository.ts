import { EntityManager } from '@mikro-orm/core';
import { Reservation } from './Reservation.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { Vehicle } from '../Vehicle/Vehicle.Entity.js';
import { User } from '../User/User.Entity.js';
import { Repository } from '../Shared/base.Repository.js';
import { AppError } from '../Shared/utils/AppError.js';
import { ACTIVE_RESERVATION_STATUSES, ReservationStatus } from '../Shared/constants/status.js';
import { formatTimeHHMM } from '../Shared/utils/dateUtils.js';
import { getVehicleVariants } from '../Shared/utils/vehicleTypes.js';

export interface CreateReservationParams {
  parking: Parking;
  vehicle: Vehicle;
  reqStartTime: Date;
  reqEndTime: Date;
  parkingSpaceId?: string;
  serviceIds?: string[];
}

export class ReservationRepository implements Repository<Reservation> {
  constructor(private entityManager: EntityManager) {}

  async findAll(): Promise<Reservation[]> {
    return await this.entityManager.find( Reservation, { status: { $ne: ReservationStatus.CANCELADA } },
      { populate: ['vehicle', 'parkingSpace', 'parkingSpace.parking', 'attendedBy'] }
    );
  }

  async findOne(item: { id: string }): Promise<Reservation | null> {
    return await this.entityManager.findOne( Reservation, { id: item.id, status: { $ne: ReservationStatus.CANCELADA } },
      { populate: ['vehicle', 'vehicle.client', 'vehicle.vehicleType', 'parkingSpace', 'parkingSpace.parking', 'parkingSpace.parking.owner', 'attendedBy'] as any}
    );
  }

  async populateServices(reservation: Reservation): Promise<void> {
    await this.entityManager.populate(reservation, ['services']);
  }

  async findByClientId(clientId: string): Promise<Reservation[]> {
    return await this.entityManager.find(
      Reservation,
      { vehicle: { client: { id: clientId } } },
      { populate: ['vehicle', 'vehicle.client', 'parkingSpace', 'parkingSpace.parking', 'attendedBy'] }
    );
  }

  async findByParkingId(parkingId: string): Promise<Reservation[]> {
    return await this.entityManager.find(
      Reservation,
      { parkingSpace: { parking: { id: parkingId } } },
      { populate: ['vehicle', 'vehicle.client', 'vehicle.brand', 'vehicle.model', 'vehicle.vehicleType', 'parkingSpace', 'parkingSpace.parking', 'services', 'services.serviceCatalog', 'attendedBy'] as any,
        orderBy: { startTime: 'DESC' }
      }
    );
  }

  async findByOwnerId(ownerId: string): Promise<Reservation[]> {
    return await this.entityManager.find(
      Reservation,
      { parkingSpace: { parking: { owner: { id: ownerId } } } },
      { populate: ['vehicle', 'vehicle.client', 'vehicle.brand', 'vehicle.model', 'vehicle.vehicleType', 'parkingSpace', 'parkingSpace.parking', 'services', 'services.serviceCatalog', 'attendedBy'] as any,
        orderBy: { startTime: 'DESC' }
      }
    );
  }

  async add(data: any): Promise<Reservation> {
    const reservation = this.entityManager.create(Reservation, data);
    await this.entityManager.flush();
    return reservation;
  }

  async update(id: string, data: any): Promise<Reservation | null> {
    const reservation = await this.findOne({ id });
    if (!reservation) return null;

    if (data.attendedById) {
      const employee = await this.entityManager.findOne(User, { id: data.attendedById, status: 'ACTIVO' });
      if (employee) reservation.attendedBy = employee;
    }
    
    this.entityManager.assign(reservation, {
      startTime: data.startTime ?? reservation.startTime,
      endTime: data.endTime ?? reservation.endTime,
      status: data.status ?? reservation.status
    });
    
    await this.entityManager.flush();
    return reservation;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const res = await this.findOne(item);
    if (!res) return false;
    res.status = ReservationStatus.CANCELADA;
    await this.entityManager.flush();
    return true;
  }

  async findActiveBySpaceId(spaceId: string): Promise<Reservation[]> {
    return this.entityManager.find(Reservation, {
      parkingSpace: { id: spaceId },
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      endTime: { $gte: new Date() },
    });
  }

  async getDependencies(parkingId: string, vehicleId: string) {
    const parking = await this.entityManager.findOne(Parking, { id: parkingId, isActive: true });
    const vehicle = await this.entityManager.findOne(Vehicle, { id: vehicleId, isActive: true }, { populate: ['vehicleType'] as any });
    return { parking, vehicle };
  }

  async createReservationAtomically(params: CreateReservationParams): Promise<Reservation> {
    const { parking, vehicle, reqStartTime, reqEndTime, parkingSpaceId, serviceIds } = params;
    return await this.entityManager.transactional(async (transactionalEntityManager) => {
      await this.validateVehicleOverlap(transactionalEntityManager, vehicle, reqStartTime, reqEndTime);

      const marginMs = parking.reservationMargin * 60 * 60 * 1000;
      const startWithMargin = new Date(reqStartTime.getTime() - marginMs);
      const endWithMargin = new Date(reqEndTime.getTime() + marginMs);

      const targetSpace = parkingSpaceId 
        ? await this.getManualSpace(transactionalEntityManager, parkingSpaceId, parking, vehicle, startWithMargin, endWithMargin)
        : await this.getAutomaticSpace(transactionalEntityManager, parking, vehicle, startWithMargin, endWithMargin);

      const reservation = transactionalEntityManager.create(Reservation, {
        startTime: reqStartTime,
        endTime: reqEndTime,
        vehicle,
        parkingSpace: targetSpace,
        status: ReservationStatus.PENDIENTE
      });

      if (serviceIds && serviceIds.length > 0) {
        await this.attachServices(transactionalEntityManager, reservation, serviceIds, parking);
      }

      return reservation;
    });
  }

  private async validateVehicleOverlap(em: EntityManager, vehicle: Vehicle, reqStartTime: Date, reqEndTime: Date) {
    const conflictingVehicleReservations = await em.find(Reservation, {
      vehicle,
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      $and: [
        { startTime: { $lt: reqEndTime } },
        { endTime: { $gt: reqStartTime } }
      ]
    }, { populate: ['parkingSpace', 'parkingSpace.parking'] as any });

    if (conflictingVehicleReservations.length > 0) {
      const existing = conflictingVehicleReservations[0];
      const parkingName = existing.parkingSpace?.parking?.name
        ? ` en "${existing.parkingSpace.parking.name}"`
        : '';
      throw new AppError(
        `Este vehículo ya posee una reserva activa${parkingName} en ese horario (${formatTimeHHMM(existing.startTime)} a ${formatTimeHHMM(existing.endTime)} hs)`,
        400
      );
    }
  }

  private async getManualSpace(em: EntityManager, parkingSpaceId: string, parking: Parking, vehicle: Vehicle, startWithMargin: Date, endWithMargin: Date): Promise<ParkingSpace> {
    const allowedVariants = getVehicleVariants(vehicle.vehicleType?.name);
    const space = await em.findOne(ParkingSpace, {
      id: parkingSpaceId,
      parking,
      vehicleType: { $in: allowedVariants },
      state: SpaceState.LIBRE,
      isActive: true
    });

    if (!space) {
      throw new Error("La plaza seleccionada no existe o no corresponde a este vehículo");
    }

    const conflictingReservations = await em.find(Reservation, {
      parkingSpace: space,
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      $and: [
        { startTime: { $lt: endWithMargin } },
        { endTime: { $gt: startWithMargin } }
      ]
    });

    if (conflictingReservations.length > 0) {
      throw new Error("La plaza seleccionada ya no está disponible para el horario elegido");
    }

    return space;
  }

  private async getAutomaticSpace(em: EntityManager, parking: Parking, vehicle: Vehicle, startWithMargin: Date, endWithMargin: Date): Promise<ParkingSpace> {
    const allowedVariants = getVehicleVariants(vehicle.vehicleType?.name);
    const candidateSpaces = await em.find(ParkingSpace, {
      parking,
      vehicleType: { $in: allowedVariants },
      state: SpaceState.LIBRE,
      isActive: true
    }, { orderBy: { spaceCode: 'ASC' } });

    if (candidateSpaces.length === 0) {
      throw new Error("No hay plazas habilitadas para este tipo de vehículo en la cochera");
    }

    const conflictingReservations = await em.find(Reservation, {
      parkingSpace: { $in: candidateSpaces },
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      $and: [
        { startTime: { $lt: endWithMargin } },
        { endTime: { $gt: startWithMargin } }
      ]
    }, { populate: ['parkingSpace'] });

    const occupiedSpaceIds = new Set(conflictingReservations.map(r => r.parkingSpace.id));

    const targetSpace = candidateSpaces.find(s => !occupiedSpaceIds.has(s.id));

    if (!targetSpace) {
      throw new Error("No hay plazas disponibles para este tipo de vehículo en el horario seleccionado");
    }

    return targetSpace;
  }

  private async attachServices(em: EntityManager, reservation: Reservation, serviceIds: string[], parking: Parking) {
    const { ServicePrice } = await import('../ServicePrice/ServicePrice.Entity.js');
    const services = await em.find(ServicePrice, { id: { $in: serviceIds }, parking });
    reservation.services.add(services);
  }

  async findConflictingSpaceIds(parking: Parking, startWithMargin: Date, endWithMargin: Date) {
    const conflictingReservations = await this.entityManager.find(Reservation, {
      parkingSpace: { parking },
      status: { $in: ACTIVE_RESERVATION_STATUSES },
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
    return await this.entityManager.findOne(Reservation, {
      vehicle: { id: vehicleId },
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    }, { populate: ['parkingSpace', 'parkingSpace.parking'] as any });
  }
}
