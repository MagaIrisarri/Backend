import { EntityManager } from '@mikro-orm/core';
import { Parking } from '../../../Parking/Parking.Entity.js';
import { ParkingSpace, SpaceState } from '../../../ParkingSpace/ParkingSpace.Entity.js';
import { findFreeSpaces } from '../../../ParkingSpace/ParkingSpace.Repository.js';
import { Reservation } from '../../../Reservation/Reservation.Entity.js';
import { Invoice } from '../../../Invoice/Invoice.Entity.js';
import { Vehicle } from '../../../Vehicle/Vehicle.Entity.js';
import { Model } from '../../../Vehicle/Model/Model.Entity.js';
import { Insurance } from '../../../Vehicle/Insurance/Insurance.Entity.js';
import { User } from '../../../User/User.Entity.js';
import { Holiday } from '../../../Holiday/Holiday.Entity.js';
import { ServicePrice } from '../../../ServicePrice/ServicePrice.Entity.js';
import { EmployeeShift } from '../../../EmployeeShift/EmployeeShift.Entity.js';
import { covers, toMin, union, type Range } from '../../../EmployeeShift/Schedule.js';
import { ReservationStatus } from '../../constants/status.js';
import { type VehicleCategory } from '../../utils/vehicleTypes.js';
import { isoDate } from '../../utils/dateUtils.js';
import { CLIENT1_EMAIL } from './userSeeder.js';

const H = 3600_000;
const DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Vehículos de los clientes: el modelo es el primero de esa marca y tipo en el catálogo (vehicleSeeder).
type Car = { plate: string; brand: string; type: VehicleCategory; color: string; year: number; insurance?: string };
// Reserva relativa a hoy: `day` en días (negativo: pasado), `start` hora de inicio, `hours` horas reservadas.
// FINALIZADA lleva factura: `paid` es el medio de pago (sin él queda por cobrar), `extra` horas de más, `services` y `rating` opcionales.
// Con `ago` la reserva usa la hora actual: EN_CURSO, `ago` horas desde el ingreso (si supera `hours`, el vehículo se pasó de hora);
// PENDIENTE, `ago` negativo: empieza dentro de -`ago` horas, para que el empleado registre el ingreso hoy.
type Booking = {
  plate: string; parking: string; status: ReservationStatus; hours: number;
  day?: number; start?: number; ago?: number; extra?: number; paid?: string; services?: string[]; rating?: number; assigned?: boolean;
};
type Client = { email: string; cars: Car[]; bookings: Booking[] };

// Alta de una reserva sembrada: entre 1 minuto y 2 días antes del inicio (o de ahora, si todavía no empezó).
// Sale del id para que sea estable entre arranques y no repita el orden de inicio.
const bookedAt = (r: Reservation) => new Date(Math.min(r.startTime.getTime(), Date.now()) - (1 + parseInt(r.id.slice(0, 4), 16) % 2880) * 60_000);

const { FINALIZADA: FIN, CANCELADA: CAN, PENDIENTE: PEN, EN_CURSO: NOW } = ReservationStatus;
const CENTRAL = 'Estacionamiento Central Plaza', CORDOBA = 'Cochera Peatonal Córdoba', MONUMENTO = 'Parking Monumento';

const CLIENTS: Client[] = [
  {
    email: CLIENT1_EMAIL,
    cars: [
      { plate: 'AE123CD', brand: 'FIAT', type: 'AUTO', color: 'Gris', year: 2021 },
      { plate: 'AF456GH', brand: 'PEUGEOT', type: 'AUTO', color: 'Blanco', year: 2023, insurance: 'San Cristóbal' },
      { plate: 'A123BCD', brand: 'HONDA', type: 'MOTO', color: 'Rojo', year: 2022, insurance: 'Federación Patronal' },
    ],
    bookings: [
      { plate: 'AE123CD', parking: CENTRAL, status: FIN, day: -2, start: 9, hours: 2, paid: 'EFECTIVO', rating: 5 },
      { plate: 'AE123CD', parking: CENTRAL, status: FIN, day: -9, start: 14, hours: 2, extra: 1, paid: 'MERCADO_PAGO', services: ['Lavado exterior'] },
      { plate: 'AE123CD', parking: CORDOBA, status: FIN, day: -20, start: 10, hours: 3, paid: 'TARJETA_DEBITO' },
      { plate: 'AE123CD', parking: CENTRAL, status: FIN, day: -45, start: 16, hours: 4, paid: 'TRANSFERENCIA' },
      { plate: 'AF456GH', parking: MONUMENTO, status: FIN, day: -5, start: 18, hours: 3, paid: 'TARJETA_CREDITO', rating: 4 },
      { plate: 'AF456GH', parking: CENTRAL, status: PEN, day: 2, start: 10, hours: 3, assigned: true },
      { plate: 'AF456GH', parking: CENTRAL, status: PEN, ago: -1, hours: 2 }, // hoy: para mostrar el ingreso desde el panel del empleado
      { plate: 'A123BCD', parking: 'Estacionamiento Paseo del Siglo', status: FIN, day: -12, start: 10, hours: 2, paid: 'EFECTIVO' },
      { plate: 'A123BCD', parking: MONUMENTO, status: PEN, day: 4, start: 15, hours: 2 },
      { plate: 'AE123CD', parking: CORDOBA, status: CAN, day: 1, start: 12, hours: 2 },
    ],
  },
  {
    email: 'cliente2@cocheras.com',
    cars: [
      { plate: 'AD789JK', brand: 'CHEVROLET', type: 'AUTO', color: 'Negro', year: 2019, insurance: 'Zurich Seguros' },
      { plate: 'AG321LM', brand: 'FORD', type: 'CAMIONETA', color: 'Azul', year: 2024, insurance: 'La Caja Seguros' },
    ],
    bookings: [
      { plate: 'AD789JK', parking: 'Cocheras Puerto Norte', status: FIN, day: -3, start: 11, hours: 2, extra: 1 },
      { plate: 'AD789JK', parking: 'Estacionamiento Paseo del Siglo', status: FIN, day: -33, start: 15, hours: 2, paid: 'TRANSFERENCIA', rating: 3 },
      { plate: 'AD789JK', parking: CENTRAL, status: NOW, ago: 1, hours: 3 },
      { plate: 'AG321LM', parking: CENTRAL, status: FIN, day: -15, start: 10, hours: 4, paid: 'EFECTIVO', services: ['Lavado completo'], rating: 5 },
      { plate: 'AG321LM', parking: CENTRAL, status: PEN, day: 6, start: 9, hours: 4 },
    ],
  },
  {
    email: 'cliente3@cocheras.com',
    cars: [
      { plate: 'AH654NP', brand: 'CITROEN', type: 'AUTO', color: 'Rojo', year: 2020, insurance: 'Sancor Seguros' },
      { plate: 'A456EFG', brand: 'YAMAHA', type: 'MOTO', color: 'Negro', year: 2023 },
    ],
    bookings: [
      { plate: 'AH654NP', parking: 'Cochera Nueva Córdoba', status: FIN, day: -4, start: 9, hours: 3, paid: 'MERCADO_PAGO', services: ['Lavado exterior'], rating: 5 },
      { plate: 'AH654NP', parking: 'Estacionamiento Plaza San Martín', status: FIN, day: -18, start: 12, hours: 2, paid: 'TARJETA_DEBITO' },
      { plate: 'AH654NP', parking: 'Cochera Nueva Córdoba', status: PEN, day: 3, start: 8, hours: 2 },
      { plate: 'AH654NP', parking: 'Parking Güemes', status: CAN, day: -7, start: 18, hours: 2 },
      { plate: 'A456EFG', parking: 'Parking Güemes', status: FIN, day: -10, start: 10, hours: 2, paid: 'EFECTIVO' },
      { plate: 'A456EFG', parking: 'Parking Güemes', status: NOW, ago: 2, hours: 3 },
    ],
  },
  {
    email: 'cliente4@cocheras.com',
    cars: [
      { plate: 'AC987QR', brand: 'NISSAN', type: 'CAMIONETA', color: 'Gris', year: 2018, insurance: 'Federación Patronal' },
      { plate: 'AB246ST', brand: 'FIAT', type: 'AUTO', color: 'Blanco', year: 2016, insurance: 'San Cristóbal' },
    ],
    bookings: [
      { plate: 'AC987QR', parking: 'Estacionamiento Peatonal San Martín', status: FIN, day: -6, start: 9, hours: 3, extra: 2, paid: 'TRANSFERENCIA' },
      { plate: 'AC987QR', parking: 'Estacionamiento Peatonal San Martín', status: PEN, day: 5, start: 10, hours: 4 },
      { plate: 'AB246ST', parking: 'Cochera Bulevar', status: FIN, day: -22, start: 14, hours: 2, paid: 'EFECTIVO', rating: 4 },
      { plate: 'AB246ST', parking: 'Parking Plaza 1° de Mayo', status: FIN, day: -40, start: 11, hours: 3, paid: 'MERCADO_PAGO' },
      { plate: 'AB246ST', parking: 'Cochera Bulevar', status: PEN, day: 1, start: 17, hours: 2 },
      { plate: 'AB246ST', parking: 'Estacionamiento Peatonal San Martín', status: PEN, ago: -1, hours: 1 }, // hoy
    ],
  },
  {
    email: 'cliente5@cocheras.com',
    cars: [
      { plate: 'AF135UV', brand: 'JEEP', type: 'AUTO', color: 'Verde', year: 2022, insurance: 'Zurich Seguros' },
      { plate: 'A789HIJ', brand: 'MOTOMEL', type: 'MOTO', color: 'Azul', year: 2021, insurance: 'La Caja Seguros' },
    ],
    bookings: [
      { plate: 'AF135UV', parking: 'Cochera Peatonal Sarmiento', status: FIN, day: -1, start: 10, hours: 2, services: ['Carga de batería'] },
      { plate: 'AF135UV', parking: 'Estacionamiento Parque Central', status: FIN, day: -25, start: 13, hours: 3, paid: 'TARJETA_CREDITO', rating: 5 },
      { plate: 'AF135UV', parking: 'Cochera Peatonal Sarmiento', status: PEN, day: 2, start: 16, hours: 3 },
      { plate: 'A789HIJ', parking: 'Estacionamiento Parque Central', status: FIN, day: -8, start: 9, hours: 2, paid: 'EFECTIVO' },
      { plate: 'A789HIJ', parking: 'Cochera Peatonal Sarmiento', status: NOW, ago: 3, hours: 2 },
    ],
  },
  {
    email: 'cliente6@cocheras.com',
    cars: [
      { plate: 'AE864WX', brand: 'FORD', type: 'AUTO', color: 'Gris', year: 2022, insurance: 'Sancor Seguros' },
      { plate: 'AD975YZ', brand: 'CHEVROLET', type: 'CAMIONETA', color: 'Blanco', year: 2021, insurance: 'Zurich Seguros' },
      { plate: 'A321KLM', brand: 'ZANELLA', type: 'MOTO', color: 'Negro', year: 2020 },
    ],
    bookings: [
      { plate: 'AE864WX', parking: 'Cochera Barrio Lourdes', status: FIN, day: -2, start: 15, hours: 2, paid: 'EFECTIVO' },
      { plate: 'AE864WX', parking: MONUMENTO, status: FIN, day: -28, start: 20, hours: 3, paid: 'TARJETA_DEBITO' },
      { plate: 'AE864WX', parking: 'Cochera Barrio Lourdes', status: PEN, day: 3, start: 9, hours: 2 },
      { plate: 'AD975YZ', parking: CENTRAL, status: FIN, day: -50, start: 9, hours: 5, paid: 'TRANSFERENCIA' },
      { plate: 'AD975YZ', parking: MONUMENTO, status: PEN, day: 8, start: 12, hours: 4 },
      { plate: 'A321KLM', parking: CORDOBA, status: FIN, day: -11, start: 17, hours: 2, paid: 'MERCADO_PAGO' },
      { plate: 'A321KLM', parking: CENTRAL, status: CAN, day: -3, start: 10, hours: 2 },
    ],
  },
  {
    email: 'cliente7@cocheras.com',
    cars: [{ plate: 'AG112BC', brand: 'PEUGEOT', type: 'AUTO', color: 'Gris', year: 2024, insurance: 'Federación Patronal' }],
    bookings: [
      { plate: 'AG112BC', parking: 'Parking Plaza 1° de Mayo', status: FIN, day: -9, start: 10, hours: 2, paid: 'EFECTIVO', rating: 4 },
      { plate: 'AG112BC', parking: 'Parking Plaza 1° de Mayo', status: FIN, day: -38, start: 16, hours: 3, paid: 'TARJETA_CREDITO' },
      { plate: 'AG112BC', parking: 'Parking Plaza 1° de Mayo', status: NOW, ago: 0, hours: 2 },
      { plate: 'AG112BC', parking: 'Parking Plaza 1° de Mayo', status: PEN, day: 4, start: 11, hours: 2 },
    ],
  },
  {
    email: 'cliente8@cocheras.com',
    cars: [
      { plate: 'AC223DE', brand: 'CITROEN', type: 'AUTO', color: 'Azul', year: 2019, insurance: 'San Cristóbal' },
      { plate: 'AB334FG', brand: 'FORD', type: 'CAMIONETA', color: 'Negro', year: 2017, insurance: 'La Caja Seguros' },
    ],
    bookings: [
      { plate: 'AC223DE', parking: 'Parking Avenida Savio', status: FIN, day: -6, start: 10, hours: 3, paid: 'EFECTIVO' },
      { plate: 'AC223DE', parking: 'Estacionamiento Costanera San Nicolás', status: FIN, day: -19, start: 15, hours: 2 },
      { plate: 'AC223DE', parking: 'Parking Avenida Savio', status: PEN, day: 1, start: 9, hours: 2 },
      { plate: 'AB334FG', parking: 'Cochera Costanera Carlos Paz', status: FIN, day: -14, start: 10, hours: 4, paid: 'TARJETA_DEBITO' },
    ],
  },
  {
    email: 'cliente9@cocheras.com',
    cars: [
      { plate: 'AH445HI', brand: 'FIAT', type: 'AUTO', color: 'Blanco', year: 2023, insurance: 'Zurich Seguros' },
      { plate: 'A654NOP', brand: 'HONDA', type: 'MOTO', color: 'Blanco', year: 2024, insurance: 'Sancor Seguros' },
    ],
    bookings: [
      { plate: 'AH445HI', parking: 'Cochera Costanera Carlos Paz', status: FIN, day: -3, start: 11, hours: 3, paid: 'MERCADO_PAGO', services: ['Control de neumáticos'], rating: 5 },
      { plate: 'AH445HI', parking: 'Cochera Costanera Carlos Paz', status: FIN, day: -31, start: 18, hours: 4, paid: 'EFECTIVO' },
      { plate: 'AH445HI', parking: 'Cochera Costanera Carlos Paz', status: PEN, day: 7, start: 10, hours: 3 },
      { plate: 'A654NOP', parking: 'Cochera Nueva Córdoba', status: FIN, day: -16, start: 9, hours: 2, paid: 'TRANSFERENCIA' },
      { plate: 'A654NOP', parking: 'Estacionamiento Plaza San Martín', status: PEN, day: 2, start: 14, hours: 2 },
    ],
  },
  {
    // Dado de baja (R-20): solo reservas terminadas o canceladas.
    email: 'cliente10@cocheras.com',
    cars: [{ plate: 'AA556JK', brand: 'NISSAN', type: 'AUTO', color: 'Gris', year: 2015 }],
    bookings: [
      { plate: 'AA556JK', parking: 'Estacionamiento Paseo del Siglo', status: FIN, day: -27, start: 10, hours: 2, paid: 'EFECTIVO' },
      { plate: 'AA556JK', parking: 'Estacionamiento Paseo del Siglo', status: CAN, day: -20, start: 12, hours: 2 },
    ],
  },
];

// Siembra los vehículos que falten (por patente) y las reservas de cada cliente que todavía no tiene ninguna.
// Las reservas respetan las mismas reglas que la API: horario y duración de la sucursal, sin feriados, con empleado de turno
// (R-01), plaza del tipo sin choque de horario (con el margen) y un vehículo sin dos reservas a la vez.
export const seedReservations = async (em: EntityManager): Promise<void> => {
  const clients = new Map((await em.find(User, { email: CLIENTS.map(c => c.email) })).map(u => [u.email, u]));
  const vehicles = new Map((await em.find(Vehicle, { plate: CLIENTS.flatMap(c => c.cars.map(v => v.plate)) })).map(v => [v.plate, v]));
  const insurances = new Map((await em.find(Insurance, {})).map(i => [i.name, i]));
  const models = await em.find(Model, { isActive: true }, { populate: ['brand', 'vehicleType'], orderBy: { name: 'ASC' } });

  for (const c of CLIENTS) {
    const client = clients.get(c.email);
    if (!client) continue;
    for (const car of c.cars) {
      if (vehicles.has(car.plate)) continue;
      const model = models.find(m => m.brand.name === car.brand && m.vehicleType.name === car.type);
      if (!model) { console.warn(`  ! Sin modelo ${car.brand} ${car.type} para ${car.plate}`); continue; }
      vehicles.set(car.plate, em.create(Vehicle, {
        plate: car.plate, color: car.color, year: car.year, brand: model.brand, model, vehicleType: model.vehicleType,
        insurance: car.insurance ? insurances.get(car.insurance) : undefined, client,
      } as any)); // isActive y las fechas salen de los valores por defecto de la entidad
    }
  }
  await em.flush();

  const pending = CLIENTS.filter(c => clients.has(c.email));
  const withReservations = new Set((await em.find(Reservation, { vehicle: { client: { email: pending.map(c => c.email) } } }, { populate: ['vehicle.client'] }))
    .map(r => r.vehicle.client.email));
  const toSeed = pending.filter(c => !withReservations.has(c.email));
  if (!toSeed.length) return;

  const parkings = new Map((await em.find(Parking, { name: [...new Set(toSeed.flatMap(c => c.bookings.map(b => b.parking)))] },
    { populate: ['parkingSpaces', 'parkingpriceHistory', 'owner'] })).map(p => [p.name, p]));
  const holidays = new Set((await em.find(Holiday, {})).map(h => h.date));
  const shifts = await em.find(EmployeeShift, { isActive: true, parking: [...parkings.values()] });
  const services = await em.find(ServicePrice, { parking: [...parkings.values()], expirationDate: null }, { populate: ['serviceCatalog'] });
  const taken = new Map<string, Range[]>(); // horarios ya sembrados por plaza y por vehículo (en ms)
  const busy = (key: string, a: number, b: number) => (taken.get(key) ?? []).some(([x, y]) => x < b && y > a);
  const mark = (key: string, a: number, b: number) => taken.set(key, [...(taken.get(key) ?? []), [a, b]]);

  // R-01: el horario tiene que quedar cubierto por algún empleado ese día de la semana (sin turnos, no hay reserva).
  const covered = (parking: Parking, start: Date, end: Date) => {
    const day = shifts.filter(s => s.parking.id === parking.id && s.dayOfWeek === DOW[start.getDay()]).map((s): Range => [toMin(s.startTime), toMin(s.endTime)]);
    return covers(union(day), [start.getHours() * 60, end.getHours() * 60 || 1440]);
  };
  const fits = (p: Parking, start: Date, end: Date, hours: number) =>
    hours >= p.minReservationHours && hours <= p.maxReservationHours && isoDate(start) === isoDate(new Date(end.getTime() - 1))
    && start.getHours() * 60 >= toMin(p.openingTime.slice(0, 5)) && (end.getHours() * 60 || 1440) <= toMin(p.closingTime.slice(0, 5))
    && !holidays.has(isoDate(start)) && covered(p, start, end);

  let created = 0, skipped = 0;
  for (const c of toSeed) {
    for (const b of c.bookings) {
      const parking = parkings.get(b.parking), vehicle = vehicles.get(b.plate);
      if (!parking || !vehicle) { skipped++; continue; }
      const typeId = vehicle.vehicleType.id; // R-30: plazas y tarifas del mismo tipo

      // El día pedido o el más cercano que cumpla las reglas, alejándose de hoy (en curso: hoy, con la hora actual).
      let start: Date | undefined;
      if (b.ago !== undefined) {
        const s = new Date(); s.setMinutes(0, 0, 0); s.setHours(s.getHours() - b.ago);
        if (fits(parking, s, new Date(s.getTime() + b.hours * H), b.hours)) start = s;
      } else {
        for (let i = 0; i < 14 && !start; i++) {
          const s = new Date(); s.setDate(s.getDate() + b.day! + Math.sign(b.day!) * i); s.setHours(b.start!, 0, 0, 0);
          if (fits(parking, s, new Date(s.getTime() + b.hours * H), b.hours)) start = s;
        }
      }
      if (!start) { skipped++; continue; }
      const end = new Date(start.getTime() + b.hours * H);
      const margin = Number(parking.reservationMargin ?? 0) * H;
      if (busy(vehicle.id, start.getTime(), end.getTime())) { skipped++; continue; }

      // Plaza: para las activas, la regla de la API (ve las reservas que ya había en la base); además, sin choque con lo sembrado.
      const active = b.status === PEN || b.status === NOW;
      const pool = active
        ? await findFreeSpaces(em, parking, typeId, start, end)
        : parking.parkingSpaces.getItems().filter(s => s.isActive && s.state !== SpaceState.MANTENIMIENTO && s.vehicleType.id === typeId)
          .sort((x, y) => x.spaceCode.localeCompare(y.spaceCode));
      const space = pool.find(s => !busy(s.id, start!.getTime() - margin, end.getTime() + margin)) as ParkingSpace | undefined;
      const rate = parking.parkingpriceHistory.getItems().find(p => !p.expirationDate && p.vehicleType.id === typeId);
      if (!space || (b.status === FIN && !rate)) { skipped++; continue; }

      // Atiende el empleado de turno al inicio; las online quedan sin asignar hasta el ingreso (R-07).
      const minute = start.getHours() * 60;
      const attendant = shifts.find(s => s.parking.id === parking.id && s.dayOfWeek === DOW[start.getDay()]
        && toMin(s.startTime) <= minute && minute < toMin(s.endTime))!.employee;
      const chosen = (b.services ?? []).map(name => services.find(sp => sp.parking.id === parking.id && sp.serviceCatalog.name === name)).filter(Boolean) as ServicePrice[];
      const exit = new Date(end.getTime() + (b.extra ? (b.extra - 1) * H + 20 * 60_000 : -15 * 60_000));
      const reservation = em.create(Reservation, {
        startTime: start, endTime: b.status === FIN ? exit : end, status: b.status, vehicle, parkingSpace: space,
        attendedBy: b.status === FIN || b.status === NOW || b.assigned ? attendant : null,
        rating: b.rating ?? null,
      });
      reservation.createdAt = bookedAt(reservation);
      reservation.services.set(chosen);
      if (b.status === NOW) space.state = SpaceState.OCUPADO;
      if (b.status === FIN) {
        const hourlyRate = Number(rate!.price), servicesAmount = chosen.reduce((a, s) => a + Number(s.price), 0);
        em.create(Invoice, {
          reservation, reservedHours: b.hours, extraHours: b.extra ?? 0, hourlyRate, servicesAmount,
          totalAmount: (b.hours + (b.extra ?? 0)) * hourlyRate + servicesAmount,
          status: b.paid ? 'PAGADA' : 'PENDIENTE', paymentMethod: b.paid ?? 'EFECTIVO', paymentDate: b.paid ? exit : null, createdAt: exit,
        });
      }
      mark(vehicle.id, start.getTime(), end.getTime());
      mark(space.id, start.getTime(), (b.status === NOW ? Math.max(end.getTime(), Date.now()) : end.getTime()));
      created++;
    }
  }
  console.log(`  → Reservas de ${toSeed.length} cliente(s): ${created} creadas${skipped ? `, ${skipped} omitidas (fuera de horario o sin plaza a esta hora)` : ''}.`);
};
