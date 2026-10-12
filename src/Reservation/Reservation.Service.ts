import { ReservationRepository } from './Reservation.Repository.js';
import { Reservation, reservationCode } from './Reservation.Entity.js';
import { CreateReservationInput, WalkInInput } from './Reservation.Schema.js';
import { AppError } from '../Shared/utils/AppError.js';
import { ACTIVE_RESERVATION_STATUSES, NotificationType, ReservationStatus, UserType } from '../Shared/constants/status.js';
import { formatTimeHHMM, isoDate } from '../Shared/utils/dateUtils.js';
import { sendMail, type SendMail } from '../Shared/utils/mailer.js';
import { CHECKOUT_GRACE_MINUTES, REMINDER_HOURS_BEFORE } from '../Shared/constants/schedule.js';

import { InvoiceRepository } from '../Invoice/Invoice.Repository.js';

import { ParkingPriceRepository } from '../ParkingPrice/ParkingPrice.Repository.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import { SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import type { Parking } from '../Parking/Parking.Entity.js';
import { ScheduleService } from '../EmployeeShift/Schedule.Service.js';
import { NotificationService } from '../Notification/Notification.Service.js';
import { wrap } from '@mikro-orm/core';
import argon2 from 'argon2';
import { MUST_CHANGE_PASSWORD } from '../User/User.Entity.js';

const MS_PER_HOUR = 1000 * 60 * 60;

export class ReservationService {
  constructor(
    private repo: ReservationRepository,
    private invoiceRepo: InvoiceRepository,
    private parkingPriceRepo: ParkingPriceRepository,
    private parkingSpaceRepo: ParkingSpaceRepository,
    private scheduleService: ScheduleService,
    private notifications: NotificationService
  ) {}

  // Avisa al cliente de la reserva (ya guardada la acción: un fallo del aviso no la revierte, ver NotificationService.notify).
  private notifyClient(r: Reservation, type: NotificationType, title: string, message: string): Promise<void> {
    const parking = r.parkingSpace?.parking?.name;
    return this.notifications.notify([r.vehicle.client.id], {
      type, title: `${title} ${r.code ?? reservationCode(r.id)}`, message: parking ? `${message} (${parking})` : message, reservationId: r.id,
    });
  }

  async findAll(): Promise<Reservation[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<Reservation | null> {
    return await this.repo.findOne({ id });
  }

  // Duración, horario de atención y un empleado de turno (R-01): al reservar y al extender (R-23).
  private async assertSchedule(parking: Parking, startTime: Date, endTime: Date): Promise<void> {
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours < parking.minReservationHours) {
      throw new AppError(`La duración mínima de la reserva es de ${parking.minReservationHours} hora(s)`, 400);
    }
    if (durationHours > parking.maxReservationHours) {
      throw new AppError(`La duración máxima de la reserva es de ${parking.maxReservationHours} hora(s)`, 400);
    }
    const openTime = parking.openingTime.slice(0, 5);
    const closeTime = parking.closingTime.slice(0, 5);
    // Comparar solo HH:MM deja pasar un fin después de medianoche ("00:30" < "23:59"): tiene que terminar el mismo día.
    if (formatTimeHHMM(startTime) < openTime || formatTimeHHMM(endTime) > closeTime || isoDate(endTime) !== isoDate(startTime)) {
      throw new AppError(`El horario de reserva está fuera del horario de atención (${openTime} a ${closeTime})`, 400);
    }
    await this.scheduleService.assertCovered(parking, startTime, endTime); // R-01
  }

  // R-23: el empleado extiende el fin (p. ej. el cliente avisa que se queda más). Mismas reglas que al reservar, y la plaza
  // tiene que quedar libre hasta el nuevo fin: las reservas siguientes que todavía no entraron pasan a otra plaza.
  async extend(id: string, endTime: Date, userId: string) {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);
    await this.assertStaffOf(reservation, userId, "Solo el personal de esta sucursal puede modificar la reserva");
    if (!(ACTIVE_RESERVATION_STATUSES as readonly string[]).includes(reservation.status ?? '')) {
      throw new AppError("Solo se extiende una reserva pendiente, confirmada o en curso", 400);
    }
    if (endTime.getTime() <= Math.max(reservation.endTime.getTime(), Date.now())) {
      throw new AppError(`El nuevo fin tiene que ser posterior al actual (${formatTimeHHMM(reservation.endTime)}) y a la hora actual`, 400);
    }
    if ((endTime.getTime() - reservation.startTime.getTime()) % MS_PER_HOUR !== 0) {
      throw new AppError("La reserva se extiende en horas completas desde su inicio", 400);
    }
    await this.assertSchedule(reservation.parkingSpace.parking, reservation.startTime, endTime);
    const clash = await this.repo.findConflictingVehicleReservation(reservation.vehicle.id, reservation.endTime, endTime);
    if (clash && clash.id !== id) {
      throw new AppError(`Este vehículo tiene otra reserva desde las ${formatTimeHHMM(clash.startTime)}: no se puede extender hasta las ${formatTimeHHMM(endTime)}`, 400);
    }
    // shortcut: L-29, las reservas que se reubican por la extensión (moved) no avisan a sus clientes, avisarles cuando se pida
    const moved = await this.repo.extend(id, endTime);
    await this.notifyClient(reservation, NotificationType.RESERVA_EXTENDIDA, 'Reserva extendida', `Ahora termina a las ${formatTimeHHMM(endTime)}`);
    return { reservation: await this.repo.findOne({ id }), moved };
  }

  // R-24: el empleado agrega o quita servicios mientras la reserva no terminó; se cobran en la salida (R-14).
  async setServices(id: string, serviceIds: string[], userId: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);
    await this.assertStaffOf(reservation, userId, "Solo el personal de esta sucursal puede modificar la reserva");
    if (!(ACTIVE_RESERVATION_STATUSES as readonly string[]).includes(reservation.status ?? '')) {
      throw new AppError("Los servicios se cambian solo en una reserva pendiente, confirmada o en curso", 400);
    }
    await this.repo.setServices(reservation, serviceIds);
    return reservation;
  }

  async create(data: CreateReservationInput): Promise<Reservation> {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  const { parking, vehicle } = await this.repo.getDependencies(data.parkingId, data.vehicleId);
  
  if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 404);
  if (!vehicle) throw new AppError("Vehículo no encontrado o inactivo", 404);
  if (vehicle.client.mustChangePassword) throw new AppError(MUST_CHANGE_PASSWORD, 403);

  await this.assertSchedule(parking, startTime, endTime);

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

  const reservation = await this.repo.createReservationAtomically({
    parking,
    vehicle,
    reqStartTime: startTime,
    reqEndTime: endTime,
    parkingSpaceId: data.parkingSpaceId,
    serviceIds: data.serviceIds
  });
  await this.notifications.notifyStaff(parking, {
    type: NotificationType.RESERVA_NUEVA,
    title: `Reserva nueva ${reservation.code ?? reservationCode(reservation.id)}`,
    message: `${vehicle.plate} · ${startTime.toLocaleDateString('es-AR')} de ${formatTimeHHMM(startTime)} a ${formatTimeHHMM(endTime)} (${parking.name})`,
    reservationId: reservation.id,
  });
  return reservation;
}

  // Un vehículo que sigue EN CURSO (aunque pasado de hora) no entra de nuevo, ni acá ni en otra sucursal.
  private async assertNotInsideElsewhere(plate: string, vehicleId: string, exceptReservationId: string): Promise<void> {
    const inside = await this.repo.findVehicleInside(vehicleId, exceptReservationId);
    if (inside) {
      throw new AppError(`${plate} figura adentro en "${inside.parkingSpace.parking.name}" desde las ${formatTimeHHMM(inside.startTime)}. Registrá su salida allá primero`, 409);
    }
  }

  // Cliente de mostrador: el inicio es ahora sin segundos y el fin, inicio + horas completas; nace EN CURSO con la plaza ocupada.
  async walkIn(data: WalkInInput, userId: string): Promise<Reservation> {
    const { parking } = await this.repo.getDependencies(data.parkingId, userId); // el vehículo no existe: solo interesa la sucursal
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 404);
    const user = await this.repo.findActiveUser(userId);
    const isEmployee = user?.type === UserType.EMPLEADO && user.parkingId === parking.id;
    const isOwner = user?.type === UserType.DUENO && parking.owner?.id === user.id;
    if (!isEmployee && !isOwner) throw new AppError("Solo el personal de esta sucursal puede registrar el ingreso", 403);

    const model = await this.repo.findModel(data.brandId, data.modelId);
    if (!model) throw new AppError("Marca y modelo no coinciden o no existen", 404);

    const start = new Date();
    start.setSeconds(0, 0);
    const end = new Date(start.getTime() + data.hours * MS_PER_HOUR);
    await this.assertSchedule(parking, start, end);
    const { parkingId, plate, brandId, modelId, hours, serviceIds, ...client } = data;
    const reservation = await this.repo.createWalkIn({
      parking, plate, model, start, end, employeeId: userId, serviceIds,
      client: { ...client, passwordHash: await argon2.hash(client.dni) }, // R-29: el DNI es la contraseña inicial
    });
    return (await this.repo.findOne({ id: reservation.id }))!;
  }

  // R-07: el personal de la sucursal cambia el empleado asignado mientras la reserva está activa; tiene que ser de esa sucursal.
  async assignEmployee(id: string, employeeId: string, userId: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);
    await this.assertStaffOf(reservation, userId, "Solo el personal de esta sucursal puede asignar el empleado de la reserva");
    if (!(ACTIVE_RESERVATION_STATUSES as readonly string[]).includes(reservation.status ?? '')) {
      throw new AppError("Solo se asigna el empleado de una reserva pendiente, confirmada o en curso", 400);
    }
    const employee = await this.repo.findActiveUser(employeeId);
    if (employee?.type !== UserType.EMPLEADO || employee.parkingId !== reservation.parkingSpace?.parking?.id) {
      throw new AppError("El empleado no existe, está dado de baja o no trabaja en esta sucursal", 400);
    }
    return (await this.repo.update(id, { attendedById: employeeId }))!;
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
          amountReceived: num(inv.amountReceived), receiptNumber: inv.receiptNumber ?? null,
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

    // Cancela el cliente de la reserva, el administrador o el personal de esa sucursal (misma regla que assertStaffOf).
    const user = await this.repo.findActiveUser(userId);
    const parking = reservation.parkingSpace?.parking;
    const isClient = reservation.vehicle?.client?.id === userId;
    const isOwner = user?.type === UserType.DUENO && parking?.owner?.id === userId;
    const isAdminOrStaff = user?.type === UserType.ADMINISTRADOR || (user?.type === UserType.EMPLEADO && user.parkingId === parking?.id);

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

    const removed = await this.repo.remove({ id });
    // Cancela el cliente → lo sabe el personal; cancela el personal, el dueño o el administrador → lo sabe el cliente.
    if (removed && isClient) {
      await this.notifications.notifyStaff(parking!, {
        type: NotificationType.RESERVA_CANCELADA,
        title: `Reserva cancelada ${reservation.code ?? reservationCode(reservation.id)}`,
        message: `El cliente canceló la reserva de ${reservation.vehicle.plate} del ${reservation.startTime.toLocaleDateString('es-AR')} a las ${formatTimeHHMM(reservation.startTime)} (${parking!.name})`,
        reservationId: reservation.id,
      });
    } else if (removed) {
      await this.notifyClient(reservation, NotificationType.RESERVA_CANCELADA, 'Reserva cancelada', 'La sucursal canceló tu reserva');
    }
    return removed;
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
    const updated = (await this.repo.findOne({ id }))!;
    await this.notifyClient(updated, NotificationType.PLAZA_CAMBIADA, 'Cambio de plaza', `Tu reserva pasó a la plaza ${updated.parkingSpace.spaceCode}`);
    return updated;
  }

  // R-27: el cliente valora una sola vez, si quiere, una reserva finalizada.
  async rate(id: string, rating: number, userId: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);
    if (reservation.vehicle?.client?.id !== userId) throw new AppError("Solo el cliente de la reserva puede valorarla", 403);
    if (reservation.status !== ReservationStatus.FINALIZADA) throw new AppError("Solo se valora una reserva finalizada", 400);
    if (reservation.rating != null) throw new AppError("Esta reserva ya está valorada", 400);
    return await this.repo.setRating(reservation, rating);
  }

  // R-28: recordatorio por email antes del inicio. Si el envío falla queda sin marcar y se reintenta en la próxima vuelta.
  async sendReminders(now = new Date(), send: SendMail = sendMail): Promise<number> {
    const due = await this.repo.findDueReminders(now, new Date(now.getTime() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000));
    let sent = 0;
    for (const r of due) {
      const client = r.vehicle?.client, parking = r.parkingSpace?.parking;
      if (!client?.email || !parking) continue;
      try {
        await send({
          to: client.email,
          subject: `Recordatorio de tu reserva ${r.code} en ${parking.name}`,
          text: [
            `Hola ${client.name}:`,
            `Te recordamos tu reserva ${r.code} en ${parking.name} (${[parking.address, parking.locality].filter(Boolean).join(', ')}).`,
            `Día: ${r.startTime.toLocaleDateString('es-AR')}, de ${formatTimeHHMM(r.startTime)} a ${formatTimeHHMM(r.endTime)}.`,
            `Plaza ${r.parkingSpace.spaceCode} · Vehículo ${r.vehicle.plate}.`,
            'Si no vas a usarla, cancelala desde Mis reservas.',
          ].join('\n'),
        });
        await this.repo.markReminderSent(r.id, now);
        // shortcut: L-32, el aviso en la app sale con el mail: sin email o con el envío fallando no hay aviso, separarlos si hace falta
        await this.notifyClient(r, NotificationType.RECORDATORIO, 'Recordatorio de tu reserva', `Empieza a las ${formatTimeHHMM(r.startTime)} en la plaza ${r.parkingSpace.spaceCode}`);
        sent++;
      } catch (err) {
        console.error(`No se pudo enviar el recordatorio de la reserva ${r.code}:`, err);
      }
    }
    return sent;
  }

  async fillMissingCodes(): Promise<number> {
    return await this.repo.fillMissingCodes();
  }

  async cancelExpired(): Promise<number> {
    const expired = await this.repo.cancelExpired(new Date());
    for (const r of expired) {
      await this.notifyClient(r, NotificationType.RESERVA_VENCIDA, 'Reserva vencida', `Se canceló porque pasó su horario (${formatTimeHHMM(r.endTime)}) sin registrar el ingreso`);
    }
    return expired.length;
  }

  // Confirmación, ingreso, salida y cambio de plaza los hace un empleado activo de la sucursal de la reserva, o el dueño de esa sucursal.
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

  async confirm(id: string, userId: string): Promise<Reservation> {
    const reservation = await this.repo.findOne({ id });
    if (!reservation) throw new AppError("Reserva no encontrada", 404);
    await this.assertStaffOf(reservation, userId, "Solo el personal de esta sucursal puede confirmar la reserva");

    if (reservation.status !== ReservationStatus.PENDIENTE) {
      throw new AppError("La reserva no se encuentra en estado PENDIENTE", 400);
    }

    const updated = (await this.repo.update(id, { status: ReservationStatus.CONFIRMADA }))!;
    await this.notifyClient(updated, NotificationType.RESERVA_CONFIRMADA, 'Reserva confirmada', `Te esperamos el ${updated.startTime.toLocaleDateString('es-AR')} a las ${formatTimeHHMM(updated.startTime)}`);
    return updated;
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
    await this.assertNotInsideElsewhere(reservation.vehicle.plate, reservation.vehicle.id, id);
    // R-21: si el cliente anterior de la plaza se quedó de más, su vehículo sigue adentro: la reserva pasa a la primera
    // plaza libre del mismo tipo (misma regla que al reservar) y el ingreso se registra ahí. Si no hay ninguna, no entra.
    const originalSpaceId = reservation.parkingSpace.id;
    const inside = await this.repo.findInProgressOnSpace(reservation.parkingSpace.id, id);
    if (inside) {
      const [to] = await this.repo.freeSpacesFor(reservation);
      if (!to) {
        const overdue = inside.endTime.getTime() < Date.now() ? ', que se pasó de hora' : '';
        throw new AppError(`La plaza ${reservation.parkingSpace.spaceCode} sigue ocupada por ${inside.vehicle?.plate ?? 'otro vehículo'}${overdue}, y no hay otra plaza libre para este vehículo.`, 409);
      }
      reservation.parkingSpace = to; // se guarda con el cambio de estado
    }

    const updated = await this.repo.update(id, { status: ReservationStatus.EN_CURSO, attendedById: employeeId, checkedInById: employeeId });
    if (updated?.parkingSpace) {
      await this.parkingSpaceRepo.update(updated.parkingSpace.id, { state: SpaceState.OCUPADO });
    }
    if (updated && updated.parkingSpace.id !== originalSpaceId) {
      await this.notifyClient(updated, NotificationType.PLAZA_CAMBIADA, 'Cambio de plaza', `La plaza reservada seguía ocupada: ingresás a la plaza ${updated.parkingSpace.spaceCode}`);
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
    const reservedHours = Math.ceil((reservation.endTime.getTime() - reservation.startTime.getTime()) / MS_PER_HOUR);
    const graceMs = CHECKOUT_GRACE_MINUTES * 60 * 1000;
    const stayedHours = Math.ceil((endTime.getTime() - graceMs - reservation.startTime.getTime()) / MS_PER_HOUR);
    const durationHours = Math.max(1, reservedHours, stayedHours);
    const extraHours = Math.max(0, durationHours - Math.max(1, reservedHours));

    const priceRecord = await this.parkingPriceRepo.findForCheckout(
      reservation.parkingSpace.parking.id,
      reservation.vehicle.vehicleType.name
    );

    if (!priceRecord) {
      throw new AppError("La cochera nunca tuvo una tarifa para este tipo de vehículo: cargala para registrar la salida", 409);
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

    // Salida, plaza y factura (con el detalle del cobro) en una sola transacción.
    const invoice = await this.repo.finishWithInvoice(id, employeeId, endTime, {
      totalAmount,
      reservedHours: durationHours - extraHours,
      extraHours,
      hourlyRate,
      servicesAmount: servicesCost,
    });

    const finished = await this.repo.findOne({ id });
    if (finished) await this.notifyClient(finished, NotificationType.SALIDA, 'Salida registrada', `Total a pagar: $${totalAmount.toLocaleString('es-AR')}`);
    return { reservation: finished, invoice };
  }
}