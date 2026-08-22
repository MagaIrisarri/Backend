import { ReservationRepository } from './Reservation.Repository.js';
import { Reservation } from './Reservation.Entity.js';
import { CreateReservationInput, UpdateReservationInput } from './Reservation.Schema.js';

export class ReservationService {
  constructor(private repo: ReservationRepository) {}

  async findAll(): Promise<Reservation[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<Reservation | null> {
    return await this.repo.findById(id);
  }

  async create(data: CreateReservationInput): Promise<Reservation> {
    const { parking, vehicle } = await this.repo.getDependencies(data.parkingId, data.vehicleId);
    
    if (!parking) throw new Error("Estacionamiento no encontrado o inactivo");
    if (!vehicle) throw new Error("Vehículo no encontrado o inactivo");

    const durationHours = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60);
    
    if (durationHours < parking.minReservationHours) {
      throw new Error(`La duración mínima de la reserva es de ${parking.minReservationHours} hora(s)`);
    }
    if (durationHours > parking.maxReservationHours) {
      throw new Error(`La duración máxima de la reserva es de ${parking.maxReservationHours} hora(s)`);
    }

    const requestedStartTimeString = data.startTime.toTimeString().split(' ')[0];
    const requestedEndTimeString = data.endTime.toTimeString().split(' ')[0];

    if (requestedStartTimeString < parking.openingTime || requestedEndTimeString > parking.closingTime) {
      throw new Error(`El horario de reserva está fuera del horario de atención (${parking.openingTime} a ${parking.closingTime})`);
    }

    const availableSpace = await this.repo.findAvailableSpace(
      parking, 
      vehicle.vehicleType.name, 
      data.startTime, 
      data.endTime
    );

    if (!availableSpace) {
      throw new Error("No hay plazas disponibles para este tipo de vehículo en el horario seleccionado");
    }

    return await this.repo.create({
      startTime: data.startTime,
      endTime: data.endTime,
      vehicle,
      parkingSpace: availableSpace,
      status: 'PENDIENTE',
    });
  }

  async update(id: string, data: UpdateReservationInput): Promise<Reservation | null> {
    const reservation = await this.repo.findById(id);
    if (!reservation) return null;

    return await this.repo.update(reservation, data);
  }

  async remove(id: string): Promise<boolean> {
    const reservation = await this.repo.findById(id);
    if (!reservation) return false;

    await this.repo.deactivate(reservation);
    return true;
  }
}