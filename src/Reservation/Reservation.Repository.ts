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

  // NUEVO MÉTODO: Ejecuta la búsqueda y la creación en una misma transacción
  async createReservationAtomically(
    parking: Parking,
    vehicle: Vehicle,
    reqStartTime: Date,
    reqEndTime: Date
  ): Promise<Reservation> {
    // txEm es el EntityManager transaccional aislado para esta operación
    return await this.em.transactional(async (txEm) => {
      const marginMs = parking.reservationMargin * 60 * 60 * 1000;
      const startWithMargin = new Date(reqStartTime.getTime() - marginMs);
      const endWithMargin = new Date(reqEndTime.getTime() + marginMs);

      // 1. Buscar todos los espacios del tipo requerido
      const allSpaces = await txEm.find(ParkingSpace, {
        parking,
        vehicleType: vehicle.vehicleType.name,
        state: 'LIBRE',
      });

      if (allSpaces.length === 0) {
        throw new Error("No hay plazas para este tipo de vehículo en el estacionamiento");
      }

      // 2. Buscar reservas conflictivas
      const conflictingReservations = await txEm.find(Reservation, {
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

      // 3. Seleccionar un espacio libre
      const availableSpace = allSpaces.find(space => !occupiedSpaceIds.has(space.id));

      if (!availableSpace) {
        throw new Error("No hay plazas disponibles en el horario seleccionado");
      }

      // 4. Crear la reserva (El flush se hace automático al terminar la transacción)
      const reservation = txEm.create(Reservation, {
        startTime: reqStartTime,
        endTime: reqEndTime,
        vehicle,
        parkingSpace: availableSpace,
        status: 'PENDIENTE',
      });

      return reservation;
    });
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