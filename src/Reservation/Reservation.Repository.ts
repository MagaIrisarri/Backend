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
import { matchesVehicleType } from '../Shared/utils/vehicleTypes.js';
import { findFreeSpaces } from '../ParkingSpace/ParkingSpace.Repository.js';

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
      { populate: ['vehicle', 'vehicle.client', 'parkingSpace', 'parkingSpace.parking', 'services', 'services.serviceCatalog', 'attendedBy'] as any }
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

  // R-17: pendientes o confirmadas cuyo horario terminó sin ingreso. No tienen factura ni ocupan la plaza
  // (eso pasa recién en el check-in), así que alcanza con cambiar el estado.
  async cancelExpired(now: Date): Promise<number> {
    return await this.entityManager.fork().nativeUpdate(
      Reservation,
      { status: { $in: [ReservationStatus.PENDIENTE, ReservationStatus.CONFIRMADA] }, endTime: { $lte: now } },
      { status: ReservationStatus.CANCELADA },
    );
  }

  async findActiveUser(id: string): Promise<User | null> {
    return await this.entityManager.findOne(User, { id, status: 'ACTIVO' });
  }

  // Otro vehículo adentro de la plaza: una reserva en curso, aunque ya se haya pasado de su horario (R-21).
  async findInProgressOnSpace(spaceId: string, exceptReservationId: string): Promise<Reservation | null> {
    return await this.entityManager.findOne(Reservation, {
      parkingSpace: { id: spaceId }, status: ReservationStatus.EN_CURSO, id: { $ne: exceptReservationId },
    });
  }

  // Plazas libres para esta reserva (sin contarla a ella). Con el vehículo adentro, la ocupa al menos hasta ahora.
  freeSpacesFor(reservation: Reservation, em: EntityManager = this.entityManager): Promise<ParkingSpace[]> {
    const end = new Date(Math.max(reservation.endTime.getTime(), Date.now()));
    return findFreeSpaces(em, reservation.parkingSpace.parking, reservation.vehicle.vehicleType?.name, reservation.startTime, end, reservation.id);
  }

  // La plaza elegida si está entre las libres; si no, por qué: no existe o es de otro tipo (400) o está tomada en ese horario (409).
  private async chosenSpace(em: EntityManager, free: ParkingSpace[], spaceId: string, parking: Parking, vehicleType?: string): Promise<ParkingSpace> {
    const space = free.find((s) => s.id === spaceId);
    if (space) return space;
    const exists = await em.findOne(ParkingSpace, { id: spaceId, parking, isActive: true });
    if (!exists || !matchesVehicleType(exists.vehicleType, vehicleType)) throw new AppError('La plaza elegida no existe o no corresponde a este vehículo', 400);
    throw new AppError(`La plaza ${exists.spaceCode} no está libre en ese horario`, 409);
  }

  // Cambia la plaza (R-15) con la misma regla que al reservar (findFreeSpaces). Si el vehículo ya está adentro,
  // libera la plaza anterior y ocupa la nueva.
  async changeSpace(id: string, parkingSpaceId: string): Promise<void> {
    await this.entityManager.transactional(async (em) => {
      const reservation = await em.findOneOrFail(Reservation, { id },
        { populate: ['parkingSpace', 'parkingSpace.parking', 'vehicle', 'vehicle.vehicleType'] as any });
      const space = await this.chosenSpace(em, await this.freeSpacesFor(reservation, em), parkingSpaceId,
        reservation.parkingSpace.parking, reservation.vehicle.vehicleType?.name);

      if (reservation.status === ReservationStatus.EN_CURSO) {
        reservation.parkingSpace.state = SpaceState.LIBRE;
        space.state = SpaceState.OCUPADO;
      }
      reservation.parkingSpace = space;
    });
  }

  async remove(item: { id: string }): Promise<boolean> {
    const res = await this.findOne(item);
    if (!res) return false;
    res.status = ReservationStatus.CANCELADA;
    await this.entityManager.flush();
    return true;
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

      // La elegida si está libre en el horario, o la primera libre del tipo del vehículo (findFreeSpaces).
      const free = await findFreeSpaces(transactionalEntityManager, parking, vehicle.vehicleType?.name, reqStartTime, reqEndTime);
      const targetSpace = parkingSpaceId
        ? await this.chosenSpace(transactionalEntityManager, free, parkingSpaceId, parking, vehicle.vehicleType?.name)
        : free[0];
      if (!targetSpace) throw new AppError("No hay plazas disponibles para este tipo de vehículo en el horario seleccionado", 409);

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

  // Tarifas vigentes de servicios de esta cochera (ServicePrice.id, no el id del catálogo); un id ajeno o vencido es un 400.
  private async activeServicePrices(em: EntityManager, parking: Parking, serviceIds: string[]) {
    const { ServicePrice } = await import('../ServicePrice/ServicePrice.Entity.js');
    const ids = [...new Set(serviceIds)];
    const services = ids.length ? await em.find(ServicePrice, { id: { $in: ids }, parking, expirationDate: null }) : [];
    if (services.length !== ids.length) throw new AppError('Alguno de los servicios elegidos no está disponible en esta cochera', 400);
    return services;
  }

  private async attachServices(em: EntityManager, reservation: Reservation, serviceIds: string[], parking: Parking) {
    reservation.services.add(await this.activeServicePrices(em, parking, serviceIds));
  }

  // R-24: deja la reserva con estos servicios. Los que ya tenía se conservan con su precio aunque la tarifa haya cambiado después.
  async setServices(reservation: Reservation, serviceIds: string[]): Promise<void> {
    await this.entityManager.populate(reservation, ['services']);
    const ids = [...new Set(serviceIds)];
    const kept = reservation.services.getItems().filter((s) => ids.includes(s.id));
    const added = await this.activeServicePrices(this.entityManager, reservation.parkingSpace.parking, ids.filter((i) => !kept.some((s) => s.id === i)));
    reservation.services.set([...kept, ...added]);
    await this.entityManager.flush();
  }

  /**
   * R-23: extiende el fin de la reserva. Las reservas de la misma plaza que todavía no entraron y chocan con el horario nuevo
   * (con el margen) pasan a la primera plaza libre de su tipo (findFreeSpaces). Si alguna no tiene lugar, o hay otro vehículo
   * adentro, no se cambia nada (409). Devuelve las que se movieron.
   */
  async extend(id: string, endTime: Date): Promise<{ code: string; from: string; to: string }[]> {
    return await this.entityManager.transactional(async (em) => {
      const reservation = await em.findOneOrFail(Reservation, { id }, { populate: ['parkingSpace', 'parkingSpace.parking'] as any });
      const space = reservation.parkingSpace, margin = Number(space.parking.reservationMargin ?? 0) * 60 * 60 * 1000;
      const clashes = await em.find(Reservation, {
        id: { $ne: id }, parkingSpace: space, status: { $in: ACTIVE_RESERVATION_STATUSES },
        startTime: { $lt: new Date(endTime.getTime() + margin) }, endTime: { $gt: new Date(reservation.endTime.getTime() - margin) },
      }, { populate: ['vehicle', 'vehicle.vehicleType'] as any, orderBy: { startTime: 'ASC' } });
      const code = (r: Reservation) => 'R-' + r.id.slice(0, 6).toUpperCase();
      const inside = clashes.find((r) => r.status === ReservationStatus.EN_CURSO);
      if (inside) throw new AppError(`La plaza ${space.spaceCode} tiene otro vehículo adentro (${code(inside)}): no se puede extender hasta las ${formatTimeHHMM(endTime)}`, 409);

      reservation.endTime = endTime;
      await em.flush(); // el horario nuevo ya cuenta como ocupado al buscarles plaza a las que chocan
      const moved = [];
      for (const other of clashes) {
        const [to] = await findFreeSpaces(em, space.parking, other.vehicle.vehicleType?.name, other.startTime, other.endTime, other.id);
        if (!to) throw new AppError(`La reserva ${code(other)} de la plaza ${space.spaceCode} empieza a las ${formatTimeHHMM(other.startTime)} y no hay otra plaza libre para pasarla: no se puede extender hasta las ${formatTimeHHMM(endTime)}`, 409);
        other.parkingSpace = to;
        await em.flush();
        moved.push({ code: code(other), from: space.spaceCode, to: to.spaceCode });
      }
      return moved;
    });
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
