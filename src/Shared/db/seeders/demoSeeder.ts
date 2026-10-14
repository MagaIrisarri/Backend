import { EntityManager } from '@mikro-orm/core';
import { Parking } from '../../../Parking/Parking.Entity.js';
import { Reservation } from '../../../Reservation/Reservation.Entity.js';
import { User } from '../../../User/User.Entity.js';
import { Notification } from '../../../Notification/Notification.Entity.js';
import { Holiday } from '../../../Holiday/Holiday.Entity.js';
import { HolidayAdhesion } from '../../../Holiday/HolidayAdhesion.Entity.js';
import { DayException } from '../../../EmployeeShift/DayException.Entity.js';
import { NotificationType, ReservationStatus, UserStatus, UserType } from '../../constants/status.js';
import { formatTimeHHMM, isoDate } from '../../utils/dateUtils.js';
import { EMPLOYEE1_EMAIL, OWNER1_EMAIL } from './userSeeder.js';

const DAY = 86_400_000;
const inDays = (n: number) => isoDate(new Date(Date.now() + n * DAY));

// Material para mostrar en la defensa lo que no sale de las reservas: los avisos de la campana y un poco de agenda del dueño
// (un día especial, un feriado propio y la adhesión de una sucursal a un feriado nacional). Cada parte se siembra una sola vez.
export const seedDemo = async (em: EntityManager): Promise<void> => {
  await seedNotifications(em);
  await seedAgenda(em);
};

// Lo que habrían generado las acciones sembradas (mismos tipos y textos que ReservationService): nueva y cancelada sin leer, salida leída.
const seedNotifications = async (em: EntityManager): Promise<void> => {
  if (await em.count(Notification, {})) return;
  const reservations = await em.find(Reservation, {}, { populate: ['vehicle.client', 'parkingSpace.parking.owner'] });
  const staff = new Map<string, string[]>(); // sucursal → dueño y empleados activos
  for (const e of await em.find(User, { type: UserType.EMPLEADO, status: UserStatus.ACTIVO })) {
    if (e.parkingId) staff.set(e.parkingId, [...(staff.get(e.parkingId) ?? []), e.id]);
  }

  for (const r of reservations) {
    const parking = r.parkingSpace.parking, client = r.vehicle.client;
    const code = r.code ?? r.id.slice(0, 8);
    const when = `${r.startTime.toLocaleDateString('es-AR')} de ${formatTimeHHMM(r.startTime)} a ${formatTimeHHMM(r.endTime)}`;
    const notify = (to: string, type: NotificationType, title: string, message: string, read: boolean) =>
      em.create(Notification, { recipient: em.getReference(User, to), type, title: `${title} ${code}`, message: `${message} (${parking.name})`,
        reservationId: r.id, createdAt: r.createdAt, readAt: read ? r.endTime : null } as any);

    if (r.status === ReservationStatus.PENDIENTE) {
      for (const to of [parking.owner.id, ...(staff.get(parking.id) ?? [])]) notify(to, NotificationType.RESERVA_NUEVA, 'Reserva nueva', `${r.vehicle.plate} · ${when}`, false);
    } else if (r.status === ReservationStatus.CANCELADA) {
      notify(client.id, NotificationType.RESERVA_CANCELADA, 'Reserva cancelada', 'La reserva se canceló', false);
    } else if (r.status === ReservationStatus.FINALIZADA) {
      notify(client.id, NotificationType.SALIDA, 'Salida registrada', 'Ya podés ver la factura', true);
    }
  }
};

const seedAgenda = async (em: EntityManager): Promise<void> => {
  const owner = await em.findOne(User, { email: OWNER1_EMAIL });
  const lucas = await em.findOne(User, { email: EMPLOYEE1_EMAIL });
  const central = await em.findOne(Parking, { name: 'Estacionamiento Central Plaza' });
  const cordoba = await em.findOne(Parking, { name: 'Cochera Nueva Córdoba' });
  const holidays = new Set((await em.find(Holiday, {})).map(h => h.date));

  // Día especial (D-02): Central Plaza atiende un solo empleado de corrido, con un cierre al mediodía. Lejos de las reservas sembradas.
  const special = inDays(30);
  if (central && lucas && !holidays.has(special) && !(await em.count(DayException, { parking: central }))) {
    em.create(DayException, { parking: central, date: special, shifts: [{ employeeId: lucas.id, from: '07:00', to: '23:00' }], closures: [{ from: '12:00', to: '13:00' }] });
  }

  // Feriado propio del dueño 1 (R-10): solo lo ve él; las sucursales trabajan salvo que se adhieran.
  const own = inDays(21);
  if (owner && !holidays.has(own) && !(await em.count(Holiday, { owner }))) {
    em.create(Holiday, { date: own, name: 'Aniversario de la empresa', origin: 'manual', owner });
  }

  // Nueva Córdoba se adhiere al feriado nacional del 23/11 y cierra ese día (si todavía no pasó).
  const national = await em.findOne(Holiday, { date: '2026-11-23', owner: null });
  if (cordoba && national && national.date >= inDays(0) && !(await em.count(HolidayAdhesion, { parking: cordoba }))) {
    em.create(HolidayAdhesion, { holiday: national, parking: cordoba });
  }
};
