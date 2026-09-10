import { ReservationRepository } from './Reservation.Repository.js';
import { Reservation } from './Reservation.Entity.js';
import { CreateReservationInput, UpdateReservationInput } from './Reservation.Schema.js';
import { AppError } from '../Shared/utils/AppError.js';

import { InvoiceRepository } from '../Invoice/Invoice.Repository.js';

export class ReservationService {
  constructor(
    private repo: ReservationRepository,
    private invoiceRepo: InvoiceRepository
  ) {}

  async findAll(): Promise<Reservation[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<Reservation | null> {
    return await this.repo.findOne({ id });
  }

  async create(data: CreateReservationInput): Promise<Reservation> {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  const { parking, vehicle } = await this.repo.getDependencies(data.parkingId, data.vehicleId);
  
  if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 404);
  if (!vehicle) throw new AppError("Vehículo no encontrado o inactivo", 404);

  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  
  if (durationHours < parking.minReservationHours) {
    throw new AppError(`La duración mínima de la reserva es de ${parking.minReservationHours} hora(s)`, 400);
  }
  if (durationHours > parking.maxReservationHours) {
    throw new AppError(`La duración máxima de la reserva es de ${parking.maxReservationHours} hora(s)`, 400);
  }

  const requestedStartTimeString = startTime.toTimeString().split(' ')[0];
  const requestedEndTimeString = endTime.toTimeString().split(' ')[0];

  if (requestedStartTimeString < parking.openingTime || requestedEndTimeString > parking.closingTime) {
    throw new AppError(`El horario de reserva está fuera del horario de atención (${parking.openingTime} a ${parking.closingTime})`, 400);
  }

  return await this.repo.createReservationAtomically(
    parking,
    vehicle,
    startTime,
    endTime,
    data.parkingSpaceId,
    data.serviceIds
  );
}

  async update(id: string, data: UpdateReservationInput): Promise<Reservation | null> {
    return await this.repo.update(id, data);
  }

  async findByClientId(clientId: string): Promise<Reservation[]> {
    return await this.repo.findByClientId(clientId);
  }

  async findByParkingId(parkingId: string): Promise<Reservation[]> {
    return await this.repo.findByParkingId(parkingId);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) return false;

    if (reservation.vehicle.client.id !== userId) {
      throw new AppError("No tienes permiso para cancelar esta reserva", 403);
    }

    if (reservation.status === 'CANCELADA' || reservation.status === 'FINALIZADA') {
      throw new AppError("No puedes cancelar una reserva que ya está cancelada o finalizada", 400);
    }

    if (reservation.startTime < new Date()) {
      throw new AppError("No puedes cancelar una reserva pasada o en curso", 400);
    }

    return await this.repo.remove({ id });
  }

  async checkIn(id: string, employeeId: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);

    if (reservation.status !== 'PENDIENTE' && reservation.status !== 'CONFIRMADA') {
      throw new AppError("La reserva no se encuentra en estado válido para Check-in", 400);
    }

    const updated = await this.repo.update(id, { status: 'EN CURSO', attendedById: employeeId });
    return updated!;
  }

  async checkOut(id: string, employeeId: string): Promise<any> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);

    if (reservation.status !== 'EN CURSO') {
      throw new AppError("La reserva debe estar EN CURSO para realizar el Check-out", 400);
    }

    // Calcular horas (mínimo 1 hora, redondeo hacia arriba)
    const endTime = new Date();
    const durationMs = endTime.getTime() - reservation.startTime.getTime();
    const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));

    // Obtener tarifa activa
    const { ParkingPrice } = await import('../ParkingPrice/ParkingPrice.Entity.js');
    // Acceso al EM a través del repositorio (forma rápida)
    const em = (this.repo as any).em;
    const priceRecord = await em.findOne(ParkingPrice, { 
      parking: { id: reservation.parkingSpace.parking.id }, 
      vehicleType: reservation.vehicle.vehicleType.name,
      expirationDate: null 
    });

    if (!priceRecord) {
      throw new AppError("No se encontró tarifa activa para este tipo de vehículo en la cochera", 500);
    }

    const parkingCost = durationHours * priceRecord.price;
    
    // Sumar servicios adicionales (requiere popular collections)
    await em.populate(reservation, ['services']);
    let servicesCost = 0;
    for (const service of reservation.services) {
      servicesCost += Number(service.price);
    }

    const totalAmount = parkingCost + servicesCost;

    const updated = await this.repo.update(id, { 
      status: 'FINALIZADA', 
      attendedById: employeeId,
      endTime // actualizamos el endTime a la fecha real de checkout
    });

    // Generamos la factura
    const invoice = await this.invoiceRepo.add({
      reservationId: id,
      totalAmount,
      status: 'PENDIENTE',
      paymentMethod: 'EFECTIVO' // Valor por defecto
    });

    return { reservation: updated, invoice };
  }
}