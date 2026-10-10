import { ReservationRepository } from './Reservation.Repository.js';
import { Reservation } from './Reservation.Entity.js';
import { CreateReservationInput, UpdateReservationInput } from './Reservation.Schema.js';
import { AppError } from '../Shared/utils/AppError.js';
import { ACTIVE_RESERVATION_STATUSES, ReservationStatus, UserStatus, UserType } from '../Shared/constants/status.js';
import { formatTimeHHMM } from '../Shared/utils/dateUtils.js';

import { InvoiceRepository } from '../Invoice/Invoice.Repository.js';

import { ParkingPriceRepository } from '../ParkingPrice/ParkingPrice.Repository.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import { SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { ScheduleService } from '../EmployeeShift/Schedule.Service.js';
import { wrap } from '@mikro-orm/core';

export class ReservationService {
  constructor(
    private repo: ReservationRepository,
    private invoiceRepo: InvoiceRepository,
    private parkingPriceRepo: ParkingPriceRepository,
    private parkingSpaceRepo: ParkingSpaceRepository,
    private scheduleService: ScheduleService
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

  await this.scheduleService.assertCovered(parking, startTime, endTime); // R-01

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

  // Suma a cada reserva `amount` (total de la factura vigente, null si no hay) y la factura con el detalle del cobro (R-14).
  private async withInvoice(reservations: Reservation[]): Promise<any[]> {
    const invoices = await this.invoiceRepo.byReservation(reservations.map(r => r.id));
    const num = (v: unknown) => (v == null ? null : Number(v));
    return reservations.map(r => {
      const inv = invoices.get(r.id);
      return Object.assign(wrap(r).toObject(), {
        amount: inv ? Number(inv.totalAmount) : null,
        invoice: inv ? {
          id: inv.id, status: inv.status, paymentMethod: inv.paymentMethod,
          reservedHours: inv.reservedHours ?? null, extraHours: inv.extraHours ?? null,
          hourlyRate: num(inv.hourlyRate), servicesAmount: num(inv.servicesAmount),
        } : null,
      });
    });
  }

  // Terminal del empleado: también usa la factura para cobrar las pendientes.
  async findByParkingId(parkingId: string): Promise<any[]> {
    return this.withInvoice(await this.repo.findByParkingId(parkingId));
  }

  async findByOwnerId(ownerId: string): Promise<any[]> {
    return this.withInvoice(await this.repo.findByOwnerId(ownerId));
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

  async changeSpace(id: string, parkingSpaceId: string, userId: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);
    await this.assertStaffOf(reservation, userId, "Solo el personal de esta sucursal puede cambiar la plaza de la reserva");

    if (!(ACTIVE_RESERVATION_STATUSES as readonly string[]).includes(reservation.status ?? '')) {
      throw new AppError("Solo se cambia la plaza de una reserva pendiente, confirmada o en curso", 400);
    }
    // Una reserva sin ingreso cuyo horario terminó se cancela sola (R-17); hasta que corra esa tarea, no se mueve.
    if (reservation.status !== ReservationStatus.EN_CURSO && reservation.endTime.getTime() <= Date.now()) {
      throw new AppError("La reserva ya venció: no se puede cambiar la plaza", 400);
    }
    if (reservation.parkingSpace?.id === parkingSpaceId) {
      throw new AppError("La reserva ya está en esa plaza", 400);
    }

    await this.repo.changeSpace(id, parkingSpaceId);
    return (await this.repo.findOne({ id }))!;
  }

  async cancelExpired(): Promise<number> {
    return await this.repo.cancelExpired(new Date());
  }

  // Ingreso, salida y cambio de plaza los hace un empleado activo de la sucursal de la reserva, o el dueño de esa sucursal.
  private async assertStaffOf(
    reservation: Reservation,
    userId: string,
    message = "Solo el personal de esta sucursal puede registrar el ingreso o la salida",
  ): Promise<void> {
    const user = await this.repo.findActiveUser(userId);
    const parking = reservation.parkingSpace?.parking;
    const isEmployee = user?.type === UserType.EMPLEADO && user.parkingId === parking?.id;
    const isOwner = user?.type === UserType.DUENO && parking?.owner?.id === user.id;
    if (!isEmployee && !isOwner) throw new AppError(message, 403);
  }

  async confirm(id: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);

    if (reservation.status !== ReservationStatus.PENDIENTE) {
      throw new AppError("La reserva no se encuentra en estado PENDIENTE", 400);
    }

    const updated = await this.repo.update(id, { status: ReservationStatus.CONFIRMADA });
    return updated!;
  }

  async checkIn(id: string, employeeId: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);
    await this.assertStaffOf(reservation, employeeId);

    if (reservation.status !== ReservationStatus.PENDIENTE && reservation.status !== ReservationStatus.CONFIRMADA) {
      throw new AppError("La reserva no se encuentra en estado válido para Check-in", 400);
    }

    // El ingreso solo se registra dentro del horario reservado (R-13, R-16): después del fin el cobro iría
    // desde un inicio muy anterior, y antes del inicio la plaza puede seguir asignada a otra reserva.
    if (reservation.endTime.getTime() <= Date.now()) {
      throw new AppError("La reserva ya venció: no se puede registrar el ingreso", 400);
    }
    if (reservation.startTime.getTime() > Date.now()) {
      throw new AppError(`La reserva empieza a las ${formatTimeHHMM(reservation.startTime)}: el ingreso se registra desde ese horario`, 400);
    }

    const updated = await this.repo.update(id, { status: ReservationStatus.EN_CURSO, attendedById: employeeId });
    if (updated?.parkingSpace) {
      await this.parkingSpaceRepo.update(updated.parkingSpace.id, { state: SpaceState.OCUPADO });
    }
    return updated!;
  }

  async checkOut(id: string, employeeId: string): Promise<any> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);
    await this.assertStaffOf(reservation, employeeId);

    if (reservation.status !== ReservationStatus.EN_CURSO) {
      throw new AppError("La reserva debe estar EN CURSO para realizar el Check-out", 400);
    }

    // Se cobran las horas reservadas aunque se retire antes; si se queda más, se suman las horas extra
    // (cada hora empezada cuenta entera).
    const endTime = new Date();
    const MS_PER_HOUR = 1000 * 60 * 60;
    const reservedHours = Math.ceil((reservation.endTime.getTime() - reservation.startTime.getTime()) / MS_PER_HOUR);
    const stayedHours = Math.ceil((endTime.getTime() - reservation.startTime.getTime()) / MS_PER_HOUR);
    const durationHours = Math.max(1, reservedHours, stayedHours);
    const extraHours = Math.max(0, durationHours - Math.max(1, reservedHours));

    // Obtener tarifa activa a través de su repositorio inyectado
    const priceRecord = await this.parkingPriceRepo.findActive(
      reservation.parkingSpace.parking.id,
      reservation.vehicle.vehicleType.name
    );

    if (!priceRecord) {
      throw new AppError("No se encontró tarifa activa para este tipo de vehículo en la cochera", 500);
    }

    const hourlyRate = Number(priceRecord.price);
    const parkingCost = durationHours * hourlyRate;
    
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

    if (updated?.parkingSpace) {
      await this.parkingSpaceRepo.update(updated.parkingSpace.id, { state: SpaceState.LIBRE });
    }

    // Generamos la factura con el detalle del cobro, para poder explicar el total después.
    const invoice = await this.invoiceRepo.add({
      reservationId: id,
      totalAmount,
      reservedHours: durationHours - extraHours,
      extraHours,
      hourlyRate,
      servicesAmount: servicesCost,
      status: 'PENDIENTE',
      paymentMethod: 'EFECTIVO' // Valor por defecto
    });

    return { reservation: updated, invoice };
  }
}