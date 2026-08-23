import { ReservationRepository } from './Reservation.Repository.js';
import { Reservation } from './Reservation.Entity.js';
import { CreateReservationInput, UpdateReservationInput } from './Reservation.Schema.js';

export class ReservationService {
  constructor(private repo: ReservationRepository) {}

  async findAll(): Promise<Reservation[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<Reservation | null> {
    return await this.repo.findOne({ id });
  }

  async create(data: CreateReservationInput): Promise<Reservation> {
    const { parking, vehicle } = await this.repo.getDependencies(data.parkingId, data.vehicleId);
    
    if (!parking) throw new Error("Estacionamiento no encontrado");
    if (!vehicle) throw new Error("Vehículo no encontrado");

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

    return await this.repo.createReservationAtomically( parking, vehicle, data.startTime, data.endTime );
  }

  async update(id: string, data: UpdateReservationInput): Promise<Reservation | null> {
    return await this.repo.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.repo.remove({ id });
  }
}