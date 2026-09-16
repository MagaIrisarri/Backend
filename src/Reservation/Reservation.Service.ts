import { ReservationRepository } from './Reservation.Repository.js';
import { Reservation } from './Reservation.Entity.js';
import { CreateReservationInput, UpdateReservationInput } from './Reservation.Schema.js';
import { AppError } from '../Shared/utils/AppError.js';
import { ReservationStatus, UserStatus, UserType } from '../Shared/constants/status.js';
import { formatTimeHHMM } from '../Shared/utils/dateUtils.js';
import { getVehicleVariants } from '../Shared/utils/vehicleTypes.js';

import { InvoiceRepository } from '../Invoice/Invoice.Repository.js';

import { ParkingPriceRepository } from '../ParkingPrice/ParkingPrice.Repository.js';

export class ReservationService {
  constructor(
    private repo: ReservationRepository,
    private invoiceRepo: InvoiceRepository,
    private parkingPriceRepo: ParkingPriceRepository
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

  const requestedStartTimeString = formatTimeHHMM(startTime);
  const requestedEndTimeString = formatTimeHHMM(endTime);
  const openTime = parking.openingTime.slice(0, 5);
  const closeTime = parking.closingTime.slice(0, 5);

  if (requestedStartTimeString < openTime || requestedEndTimeString > closeTime) {
    throw new AppError(`El horario de reserva está fuera del horario de atención (${openTime} a ${closeTime})`, 400);
  }

  const conflictingVehicleReservation = await this.repo.findConflictingVehicleReservation(
    data.vehicleId,
    startTime,
    endTime
  );

  if (conflictingVehicleReservation) {
    const parkingName = conflictingVehicleReservation.parkingSpace?.parking?.name
      ? ` en "${conflictingVehicleReservation.parkingSpace.parking.name}"`
      : '';
    const startStr = formatTimeHHMM(conflictingVehicleReservation.startTime);
    const endStr = formatTimeHHMM(conflictingVehicleReservation.endTime);
    throw new AppError(
      `Este vehículo ya posee una reserva activa${parkingName} en ese horario (${startStr} a ${endStr} hs)`,
      400
    );
  }

  return await this.repo.createReservationAtomically({
    parking,
    vehicle,
    reqStartTime: startTime,
    reqEndTime: endTime,
    parkingSpaceId: data.parkingSpaceId,
    serviceIds: data.serviceIds
  });
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

  async findByOwnerId(ownerId: string): Promise<Reservation[]> {
    return await this.repo.findByOwnerId(ownerId);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) return false;

    const entityManager = (this.repo as any).entityManager;
    const { User } = await import('../User/User.Entity.js');
    const user = await entityManager.findOne(User, { id: userId, status: UserStatus.ACTIVO });

    const isClient = reservation.vehicle?.client?.id === userId;
    const isOwner = reservation.parkingSpace?.parking?.owner?.id === userId;
    const isAdminOrStaff = user?.type === UserType.ADMINISTRADOR || user?.type === UserType.EMPLEADO;

    const canCancelReservation = isClient || isOwner || isAdminOrStaff;
    if (!canCancelReservation) {
      throw new AppError("No tienes permiso para dar de baja esta reserva", 403);
    }

    if (reservation.status === ReservationStatus.CANCELADA || reservation.status === ReservationStatus.FINALIZADA) {
      throw new AppError("No puedes dar de baja una reserva que ya está cancelada o finalizada", 400);
    }

    if (isClient && !isOwner && !isAdminOrStaff) {
      if (reservation.status === ReservationStatus.EN_CURSO) {
        throw new AppError("No puedes dar de baja una reserva que ya está en curso", 400);
      }
    }

    // Anular factura si estuviera pendiente
    const invoice = await this.invoiceRepo.findByReservationId(id);
    if (invoice && invoice.status === 'PENDIENTE') {
      await this.invoiceRepo.remove({ id: invoice.id });
    }

    return await this.repo.remove({ id });
  }

  async checkIn(id: string, employeeId: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);

    if (reservation.status !== ReservationStatus.PENDIENTE && reservation.status !== ReservationStatus.CONFIRMADA) {
      throw new AppError("La reserva no se encuentra en estado válido para Check-in", 400);
    }

    const updated = await this.repo.update(id, { status: ReservationStatus.EN_CURSO, attendedById: employeeId });
    return updated!;
  }

  async checkOut(id: string, employeeId: string): Promise<any> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);

    if (reservation.status !== ReservationStatus.EN_CURSO) {
      throw new AppError("La reserva debe estar EN CURSO para realizar el Check-out", 400);
    }

    // Calcular horas (mínimo 1 hora, redondeo hacia arriba)
    const endTime = new Date();
    const durationMs = endTime.getTime() - reservation.startTime.getTime();
    const MS_PER_HOUR = 1000 * 60 * 60;
    const durationHours = Math.max(1, Math.ceil(durationMs / MS_PER_HOUR));

    // Obtener tarifa activa a través de su repositorio inyectado
    const priceRecord = await this.parkingPriceRepo.findActive(
      reservation.parkingSpace.parking.id,
      reservation.vehicle.vehicleType.name
    );

    if (!priceRecord) {
      throw new AppError("No se encontró tarifa activa para este tipo de vehículo en la cochera", 500);
    }

    const parkingCost = durationHours * priceRecord.price;
    
    // Sumar servicios adicionales usando el repo
    await this.repo.populateServices(reservation);
    let servicesCost = 0;
    for (const service of reservation.services) {
      servicesCost += Number(service.price);
    }

    const totalAmount = parkingCost + servicesCost;

    const updated = await this.repo.update(id, { 
      status: ReservationStatus.FINALIZADA, 
      attendedById: employeeId,
      endTime 
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