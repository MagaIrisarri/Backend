// Carga la demo de la presentación (demo/data/*.json) en la base de siempre (DB_NAME, parkingdb por defecto).
//   pnpm build && pnpm demo:load --yes           todo: borra lo que no es catálogo (reset.ts) y carga usuarios, sucursales,
//                                                personal, vehículos y reservas. Se corre una vez.
//   pnpm build && pnpm demo:reservations --yes   solo las reservas de la demo (con sus facturas y avisos), el día de la exposición.
// El estado de cada reserva sale de la hora de carga: las que ya terminaron, finalizadas (o canceladas); las que están
// pasando, en curso; las que vienen, pendientes. Entre una carga y otra el backend cancela las pendientes sin ingreso (R-17),
// así que antes de presentar se recargan las reservas; el resto de la base queda como estaba.
// Todo va en una transacción y se verifican las reglas antes de confirmar: si algo no cumple, no cambia nada.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { EntityManager } from '@mikro-orm/core';
import { orm, syncSchema } from '../orm.js';
import { seedDatabase } from '../seeder.js';

import { resetDemoData, txConnection } from './reset.js';
import type { DemoMeta, DemoParking, DemoReservation, DemoServiceCatalog, DemoStaff, DemoUsers, DemoVehicle } from './data.js';
import { User } from '../../../User/User.Entity.js';
import { Parking } from '../../../Parking/Parking.Entity.js';
import { ParkingSpace, SpaceState } from '../../../ParkingSpace/ParkingSpace.Entity.js';
import { ParkingPrice } from '../../../ParkingPrice/ParkingPrice.Entity.js';
import { ServiceCatalog } from '../../../ServiceCatalog/ServiceCatalog.Entity.js';
import { ServicePrice } from '../../../ServicePrice/ServicePrice.Entity.js';
import { DayOfWeek, EmployeeShift } from '../../../EmployeeShift/EmployeeShift.Entity.js';
import { DayException } from '../../../EmployeeShift/DayException.Entity.js';
import { Holiday } from '../../../Holiday/Holiday.Entity.js';
import { HolidayAdhesion } from '../../../Holiday/HolidayAdhesion.Entity.js';
import { VehicleType } from '../../../Vehicle/VehicleType/VehicleType.Entity.js';
import { Model } from '../../../Vehicle/Model/Model.Entity.js';
import { Insurance } from '../../../Vehicle/Insurance/Insurance.Entity.js';
import { Vehicle } from '../../../Vehicle/Vehicle.Entity.js';
import { Reservation, reservationCode } from '../../../Reservation/Reservation.Entity.js';
import { Invoice } from '../../../Invoice/Invoice.Entity.js';
import { Notification } from '../../../Notification/Notification.Entity.js';
import { NotificationType, ReservationStatus, UserStatus, UserType } from '../../constants/status.js';
import { ARRIVAL_TOLERANCE_MINUTES } from '../../constants/schedule.js';
import { defaultPassword } from '../seeders/userSeeder.js';
import { nameKey } from '../../utils/names.js';
import { spacePrefix, type VehicleCategory } from '../../utils/vehicleTypes.js';
import { formatTimeHHMM } from '../../utils/dateUtils.js';

const DIR = path.resolve(process.env.DEMO_DIR ?? 'demo/data');
const MIN = 60_000, H = 60 * MIN, DAY = 24 * H;
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf-8'));
const DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const toMin = (t: string) => (t === '23:59' ? 1440 : +t.slice(0, 2) * 60 + +t.slice(3, 5));
const onlyReservations = process.argv.includes('--reservations');
const dbName = String(orm.config.get('dbName'));

if (!process.argv.includes('--yes')) {
  console.error(onlyReservations
    ? `Esto BORRA y vuelve a cargar las reservas de la demo en "${dbName}". Repetir con --yes para confirmar.`
    : `Esto BORRA usuarios, cocheras, reservas y todo lo que no es catálogo de "${dbName}". Repetir con --yes para confirmar.`);
  await orm.close();
  process.exit(1);
}
orm.config.set('debug', false); // miles de reservas: sin el log de cada consulta

const meta = read<DemoMeta>('meta.json');
const [AY, AM, AD] = meta.anchor.split('-').map(Number) as [number, number, number];
// Día relativo al ancla y hora local de la sucursal (el proceso corre en America/Argentina/Buenos_Aires, orm.ts).
const dateAt = (day: number, time = '00:00') => new Date(AY, AM - 1, AD + day, +time.slice(0, 2), +time.slice(3, 5));
const isoAt = (day: number) => { const d = dateAt(day); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// Id fijo por reserva de la demo (semilla + posición): así la recarga encuentra y reemplaza exactamente las suyas.
const fixedId = (i: number, attempt = 0) => {
  const h = crypto.createHash('sha1').update(`demo|${meta.seed}|${meta.anchor}|${i}|${attempt}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

type Loaded = { data: DemoParking; parking: Parking; spaces: Map<string, ParkingSpace>; services: Map<string, ServicePrice>; staff: DemoStaff[] };
type Ctx = { byEmail: Map<string, User>; parkings: Map<string, Loaded>; vehicles: Map<string, Vehicle> };

try {
  await orm.schema.ensureDatabase();
  await syncSchema();
  await seedDatabase(orm.em.fork()); // catálogo: feriados, tipos, seguros, marcas y modelos
  const t0 = Date.now();
  const summary = await orm.em.fork().transactional<object>((em) => (onlyReservations ? reloadReservations(em) : loadAll(em)));
  console.log(`✅ ${onlyReservations ? 'Reservas de la demo recargadas' : 'Demo cargada'} en "${dbName}" en ${((Date.now() - t0) / 1000).toFixed(0)} s (ancla ${meta.anchor}):`, summary);
} finally {
  await orm.close();
}

// ---------- todo ----------
async function loadAll(em: EntityManager) {
  const reset = await resetDemoData(em);
  const users = read<DemoUsers>('users.json');
  const parkingsData = read<DemoParking[]>('parkings.json');
  const staffData = read<DemoStaff[]>('staff.json');
  const vehiclesData = read<DemoVehicle[]>('vehicles.json');
  const catalogData = read<DemoServiceCatalog>('services.json');

  const types = new Map((await em.find(VehicleType, {})).map((t) => [t.name as VehicleCategory, t]));
  const models = new Map((await em.find(Model, { isActive: true }, { populate: ['brand', 'vehicleType'] })).map((m) => [`${nameKey(m.brand.name)}|${nameKey(m.name)}`, m]));
  const insurances = new Map((await em.find(Insurance, {})).map((i) => [i.name, i]));
  const catalog = new Map((await em.find(ServiceCatalog, {})).map((s) => [s.name, s]));
  for (const s of catalogData) {
    const found = catalog.get(s.name);
    if (found) found.isActive = true;
    else catalog.set(s.name, em.create(ServiceCatalog, { name: s.name, description: s.description, isActive: true }));
  }

  // Usuarios
  const password = await defaultPassword();
  const byEmail = new Map<string, User>();
  const createUser = (p: DemoUsers['admin'], type: UserType, extra: Partial<User> = {}) => {
    const u = em.create(User, {
      email: p.email, dni: p.dni, name: p.name, last_name: p.last_name, date_of_birth: new Date(p.birth), phone: p.phone,
      password, type, status: UserStatus.ACTIVO, mustChangePassword: false, ...extra,
    });
    byEmail.set(p.email, u);
    return u;
  };
  createUser(users.admin, UserType.ADMINISTRADOR);
  for (const o of users.owners) createUser(o, UserType.DUENO);
  for (const c of users.clients) createUser(c, UserType.CLIENTE);

  const holidays = new Map((await em.find(Holiday, { owner: null })).map((h) => [h.date, h]));
  const ownHolidays = new Map<string, Holiday>(); // `${dueño}|fecha`
  for (const o of users.owners) for (const h of o.holidays ?? []) {
    ownHolidays.set(`${o.email}|${isoAt(h.day)}`, em.create(Holiday, { date: isoAt(h.day), name: h.name, origin: 'manual', owner: byEmail.get(o.email)! }));
  }

  // Sucursales
  const parkings = new Map<string, Loaded>();
  for (const d of parkingsData) {
    const parking = em.create(Parking, {
      name: d.name, owner: byEmail.get(d.owner)!, province: d.province, locality: d.locality, neighborhood: d.neighborhood, postalCode: d.postalCode,
      address: d.address, latitude: d.latitude, longitude: d.longitude, openingTime: d.openingTime, closingTime: d.closingTime,
      minReservationHours: d.minReservationHours, maxReservationHours: d.maxReservationHours, reservationMargin: d.reservationMargin,
      isActive: d.isActive, imageUrl: d.imageUrl,
    });
    const spaces = new Map<string, ParkingSpace>();
    for (const type of ['AUTO', 'MOTO', 'CAMIONETA'] as const) {
      for (let i = 1; i <= d.spaces[type]; i++) {
        const spaceCode = `${spacePrefix(type)}-${String(i).padStart(2, '0')}`;
        spaces.set(spaceCode, em.create(ParkingSpace, {
          parking, spaceCode, vehicleType: types.get(type)!, isActive: true,
          state: d.maintenance.includes(spaceCode) ? SpaceState.MANTENIMIENTO : SpaceState.LIBRE,
        }));
      }
    }
    for (const p of d.prices) {
      em.create(ParkingPrice, { parking, vehicleType: types.get(p.type)!, price: p.price, startDate: dateAt(p.from), expirationDate: p.to === null ? null : dateAt(p.to) });
    }
    const services = new Map(d.services.map((s) => [s.name, em.create(ServicePrice, { parking, serviceCatalog: catalog.get(s.name)!, price: s.price, startDate: dateAt(-150) })]));
    for (const day of d.closedOn) {
      const holiday = holidays.get(isoAt(day)) ?? ownHolidays.get(`${d.owner}|${isoAt(day)}`);
      if (!holiday) throw new Error(`${d.name} se adhiere a un feriado que no existe el ${isoAt(day)}`);
      em.create(HolidayAdhesion, { holiday, parking });
    }
    parkings.set(d.name, { data: d, parking, spaces, services, staff: [] });
  }

  // Personal
  for (const s of staffData) {
    const loaded = parkings.get(s.parking)!;
    const employee = createUser(s, UserType.EMPLEADO, { ownerId: loaded.parking.owner.id, parkingId: loaded.parking.id });
    loaded.staff.push(s);
    for (const shift of s.shifts) {
      for (const day of shift.days) em.create(EmployeeShift, { parking: loaded.parking, employee, dayOfWeek: day as DayOfWeek, startTime: shift.from, endTime: shift.to, isActive: true });
    }
  }
  for (const { data, parking } of parkings.values()) {
    for (const e of data.exceptions) {
      em.create(DayException, {
        parking, date: isoAt(e.day), closures: e.closures,
        shifts: e.shifts.map((s) => ({ employeeId: byEmail.get(s.employee)!.id, from: s.from, to: s.to })),
      });
    }
  }

  // Vehículos
  const vehicles = new Map<string, Vehicle>();
  for (const v of vehiclesData) {
    const model = models.get(`${nameKey(v.brand)}|${nameKey(v.model)}`);
    if (!model) throw new Error(`Sin el modelo ${v.brand} ${v.model} en el catálogo (patente ${v.plate})`);
    if (model.vehicleType.name !== v.type) throw new Error(`${v.brand} ${v.model} es ${model.vehicleType.name}, no ${v.type} (patente ${v.plate})`);
    vehicles.set(v.plate, em.create(Vehicle, {
      plate: v.plate, color: v.color, year: v.year, brand: model.brand, model, vehicleType: model.vehicleType,
      insurance: v.insurance ? insurances.get(v.insurance) : undefined, client: byEmail.get(v.client)!, isActive: true,
      createdAt: dateAt(v.since), updatedAt: dateAt(v.since),
    } as any));
  }
  await em.flush();

  const result = await insertReservations(em, { byEmail, parkings, vehicles });
  return { borrado: reset.deleted, tiposBorrados: reset.types, usuarios: byEmail.size, sucursales: parkings.size, vehiculos: vehicles.size, ...result };
}

// ---------- solo las reservas ----------
// Borra las reservas de la demo (por su id fijo), sus facturas, servicios y avisos, y las vuelve a cargar con la hora de ahora.
// Las reservas que no son de la demo (las hechas en un ensayo) quedan.
async function reloadReservations(em: EntityManager) {
  const parkingsData = read<DemoParking[]>('parkings.json');
  const staffData = read<DemoStaff[]>('staff.json');
  const count = read<DemoReservation[]>('reservations.json').length;
  const conn = txConnection(em);

  // Las de la demo pueden haber cambiado de id si su código chocaba: se buscan con los mismos intentos que al cargarlas.
  const candidates = Array.from({ length: count }, (_, i) => [0, 1, 2, 3].map((a) => fixedId(i, a))).flat();
  let removed = 0;
  for (let i = 0; i < candidates.length; i += 1000) {
    const ids = candidates.slice(i, i + 1000), marks = ids.map(() => '?').join(',');
    await conn.execute(`DELETE FROM notification WHERE reservation_id IN (${marks})`, ids, 'run');
    await conn.execute(`DELETE FROM reservation_services WHERE reservation_id IN (${marks})`, ids, 'run');
    await conn.execute(`DELETE FROM invoice WHERE reservation_id IN (${marks})`, ids, 'run');
    removed += (await conn.execute<{ affectedRows?: number }>(`DELETE FROM reservation WHERE id IN (${marks})`, ids, 'run')).affectedRows ?? 0;
  }
  if (!removed) throw new Error('No hay reservas de la demo en esta base: primero, pnpm demo:load --yes');

  const emails = [...new Set([...parkingsData.map((p) => p.owner), ...staffData.map((s) => s.email)])];
  const byEmail = new Map((await em.find(User, { email: emails })).map((u) => [u.email, u]));
  const found = await em.find(Parking, { name: parkingsData.map((p) => p.name) }, { populate: ['parkingSpaces', 'owner'] });
  const prices = await em.find(ServicePrice, { parking: found, expirationDate: null }, { populate: ['serviceCatalog'] });
  const parkings = new Map<string, Loaded>();
  for (const d of parkingsData) {
    const parking = found.find((p) => p.name === d.name);
    if (!parking) throw new Error(`Falta la sucursal ${d.name}: primero, pnpm demo:load --yes`);
    parkings.set(d.name, {
      data: d, parking,
      spaces: new Map(parking.parkingSpaces.getItems().map((s) => [s.spaceCode, s])),
      services: new Map(prices.filter((s) => s.parking.id === parking.id).map((s) => [s.serviceCatalog.name, s])),
      staff: staffData.filter((s) => s.parking === d.name),
    });
  }
  const plates = read<DemoVehicle[]>('vehicles.json').map((v) => v.plate);
  const vehicles = new Map((await em.find(Vehicle, { plate: plates, isActive: true }, { populate: ['vehicleType', 'client'] })).map((v) => [v.plate, v]));

  const result = await insertReservations(em, { byEmail, parkings, vehicles });
  // Plazas: ocupadas exactamente las que tienen un vehículo adentro (de la demo o no); las de mantenimiento no cambian.
  await conn.execute(`UPDATE parking_space SET state = 'LIBRE' WHERE state = 'OCUPADO'`, [], 'run');
  await conn.execute(`UPDATE parking_space SET state = 'OCUPADO' WHERE state <> 'MANTENIMIENTO' AND id IN (SELECT parking_space_id FROM reservation WHERE status = ?)`, [ReservationStatus.EN_CURSO], 'run');
  return { reservasBorradas: removed, ...result };
}

// ---------- reservas ----------
async function insertReservations(em: EntityManager, { byEmail, parkings, vehicles }: Ctx) {
  const now = Date.now();
  const reservationsData = read<DemoReservation[]>('reservations.json');

  // Quién está de turno en la sucursal ese día y a esa hora (excepción de la fecha o semana tipo).
  const shiftsOf = (l: Loaded, day: number) => {
    const ex = l.data.exceptions.find((e) => e.day === day);
    if (ex) return ex.shifts.map((s) => ({ email: s.employee, from: toMin(s.from), to: toMin(s.to) }));
    const dow = DOW[dateAt(day).getDay()]!;
    return l.staff.flatMap((s) => s.shifts.filter((x) => x.days.includes(dow)).map((x) => ({ email: s.email, from: toMin(x.from), to: toMin(x.to) })));
  };
  const onShift = (l: Loaded, at: Date) => {
    const day = Math.round((new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime() - dateAt(0).getTime()) / DAY);
    const minute = at.getHours() * 60 + at.getMinutes();
    const list = shiftsOf(l, day).sort((a, b) => a.from - b.from);
    const s = list.find((x) => x.from <= minute && minute < x.to) ?? list.filter((x) => x.from <= minute).pop() ?? list[0];
    return s ? byEmail.get(s.email)! : null;
  };
  const priceAt = (d: DemoParking, type: string, day: number) =>
    d.prices.find((p) => p.type === type && p.from <= day && (p.to === null || day < p.to))?.price;
  const staffIds = (l: Loaded) => [l.parking.owner.id, ...l.staff.map((s) => byEmail.get(s.email)!.id)];

  const counts: Record<string, number> = {};
  const notes: { to: string[]; type: NotificationType; title: string; message: string; reservationId: string; at: Date; read: boolean }[] = [];
  const created: { r: Reservation; d: DemoReservation; l: Loaded; occupiedTo: Date }[] = [];
  const codes = new Set((await txConnection(em).execute<{ code: string }[]>('SELECT code FROM reservation WHERE code IS NOT NULL')).map((x: { code: string }) => x.code));

  reservationsData.forEach((d, i) => {
    const l = parkings.get(d.parking), vehicle = vehicles.get(d.plate), space = l?.spaces.get(d.space);
    if (!l || !vehicle || !space) throw new Error(`Reserva con datos que no existen: ${JSON.stringify(d)}`);
    const start = dateAt(d.day, d.start), end = new Date(start.getTime() + d.hours * H);
    const client = vehicle.client;
    if (d.walkIn && start.getTime() > now) return; // un ingreso por mostrador que todavía no pasó no existe (se carga antes del ancla o más tarde ese día)
    // Alta: `lead` antes del inicio, nunca después de ahora (las lejanas, en algún momento de las últimas dos semanas).
    const createdAt = new Date(d.walkIn ? start.getTime() : Math.min(start.getTime() - d.lead * MIN, now - (1 + (i * 7919) % (14 * 1440)) * MIN));
    // El código son 6 caracteres del id: con miles de reservas alguno se repite. Como al reservar (Repository), otro id.
    let attempt = 0, id = fixedId(i);
    while (codes.has(reservationCode(id))) id = fixedId(i, ++attempt);
    codes.add(reservationCode(id));
    const r = em.create(Reservation, { id, code: reservationCode(id), startTime: start, endTime: end, status: ReservationStatus.PENDIENTE, vehicle, parkingSpace: space, createdAt });
    if (d.walkIn) { r.contactName = `${client.name} ${client.last_name}`; r.contactPhone = client.phone ?? null; }
    const code = r.code!;
    const when = `${start.toLocaleDateString('es-AR')} de ${formatTimeHHMM(start)} a ${formatTimeHHMM(end)}`;
    let occupiedTo = end;

    if (d.outcome === 'done' || d.outcome === 'overstay') {
      const checkIn = new Date(start.getTime() + (d.arrive ?? 0) * MIN);
      const exit = new Date(end.getTime() + (d.exit ?? 0) * MIN);
      if (now < checkIn.getTime()) {
        r.attendedBy = onShift(l, start); // R-07: toda reserva tiene empleado asignado
      } else if (d.outcome === 'overstay' || now < exit.getTime()) {
        r.status = ReservationStatus.EN_CURSO;
        r.attendedBy = r.checkedInBy = onShift(l, checkIn);
        space.state = SpaceState.OCUPADO;
      } else {
        r.status = ReservationStatus.FINALIZADA;
        r.checkedInBy = onShift(l, checkIn);
        r.attendedBy = r.checkedOutBy = onShift(l, exit) ?? r.checkedInBy;
        r.endTime = exit;
        r.checkedOutAt = exit;
        r.rating = d.rating ?? null;
        occupiedTo = exit;
      }
      const chosen = (d.services ?? []).map((n) => l.services.get(n)!).filter(Boolean);
      if (chosen.length) r.services.set(chosen);
      if (r.status === ReservationStatus.FINALIZADA) {
        const rate = priceAt(l.data, vehicle.vehicleType.name, d.day);
        if (rate === undefined) throw new Error(`${l.data.name} no tiene tarifa de ${vehicle.vehicleType.name} el ${isoAt(d.day)}`);
        const extra = d.extra ?? 0, servicesAmount = chosen.reduce((a, s) => a + Number(s.price), 0);
        const totalAmount = (d.hours + extra) * rate + servicesAmount;
        const unpaid = d.unpaid && exit.getTime() > now - 2 * DAY;
        const cash = d.pay === 'EFECTIVO';
        em.create(Invoice, {
          reservation: r, reservedHours: d.hours, extraHours: extra, hourlyRate: rate, servicesAmount, totalAmount, createdAt: exit,
          status: unpaid ? 'PENDIENTE' : 'PAGADA', paymentMethod: unpaid ? 'EFECTIVO' : d.pay!,
          paymentDate: unpaid ? null : new Date(exit.getTime() + (2 + (i % 5)) * MIN),
          amountReceived: !unpaid && cash ? String(Math.ceil(totalAmount / 1000) * 1000) as any : null,
          receiptNumber: unpaid || cash ? null : `${d.pay === 'MERCADO_PAGO' ? 'MP' : d.pay === 'TRANSFERENCIA' ? 'TRF' : 'POS'}-${String(10_000_000 + (i * 104_729) % 89_999_999)}`,
        });
        if (exit.getTime() > now - 10 * DAY) {
          notes.push({ to: [client.id], type: NotificationType.SALIDA, title: `Salida registrada ${code}`, message: `Total a pagar: $${totalAmount.toLocaleString('es-AR')} (${l.data.name})`, reservationId: r.id, at: exit, read: exit.getTime() < now - DAY });
        }
      }
    } else if (d.outcome === 'cancel') {
      const cancelAt = new Date(start.getTime() - (d.cancelLead ?? 60) * MIN);
      if (r.createdAt! >= cancelAt) r.createdAt = new Date(cancelAt.getTime() - 30 * MIN); // se reservó antes de cancelarla
      if (now >= cancelAt.getTime()) {
        r.status = ReservationStatus.CANCELADA;
        if (cancelAt.getTime() > now - 3 * DAY) {
          notes.push({ to: staffIds(l), type: NotificationType.RESERVA_CANCELADA, title: `Reserva cancelada ${code}`, message: `El cliente canceló la reserva de ${vehicle.plate} del ${start.toLocaleDateString('es-AR')} a las ${formatTimeHHMM(start)} (${l.data.name})`, reservationId: r.id, at: cancelAt, read: false });
        }
      }
    } else if (now >= start.getTime() + ARRIVAL_TOLERANCE_MINUTES * MIN) { // noshow: vence (R-17)
      r.status = ReservationStatus.CANCELADA;
      const at = new Date(start.getTime() + (ARRIVAL_TOLERANCE_MINUTES + 3) * MIN);
      notes.push({ to: [client.id], type: NotificationType.RESERVA_VENCIDA, title: `Reserva vencida ${code}`, message: `Se canceló porque no se registró el ingreso hasta ${ARRIVAL_TOLERANCE_MINUTES} min después del inicio (${formatTimeHHMM(start)})`, reservationId: r.id, at, read: at.getTime() < now - 2 * DAY });
    }
    if (r.status !== ReservationStatus.CANCELADA && !d.walkIn && r.createdAt!.getTime() > now - DAY / 2) { // las de las últimas 12 h, sin leer
      notes.push({ to: staffIds(l), type: NotificationType.RESERVA_NUEVA, title: `Reserva nueva ${code}`, message: `${vehicle.plate} · ${when} (${l.data.name})`, reservationId: r.id, at: r.createdAt!, read: false });
    }
    counts[r.status!] = (counts[r.status!] ?? 0) + 1;
    created.push({ r, d, l, occupiedTo });
  });

  for (const n of notes) for (const to of n.to) {
    em.create(Notification, { recipient: em.getReference(User, to), type: n.type, title: n.title, message: n.message, reservationId: n.reservationId, createdAt: n.at, readAt: n.read ? n.at : null });
  }

  verify(created, now, shiftsOf);
  await em.flush();
  return { reservas: counts, notificaciones: notes.reduce((a, n) => a + n.to.length, 0) };
}

// Las reglas de la API sobre las reservas de la demo: si algo no cumple, la transacción se deshace.
function verify(created: { r: Reservation; d: DemoReservation; l: Loaded; occupiedTo: Date }[], now: number, shiftsOf: (l: Loaded, day: number) => { from: number; to: number }[]) {
  const problems: string[] = [];
  const active = created.filter((c) => c.r.status !== ReservationStatus.CANCELADA);
  const bySpace = new Map<string, typeof active>(), byVehicle = new Map<string, typeof active>();
  for (const c of active) {
    const s = `${c.d.parking}|${c.d.space}`, v = c.d.plate;
    bySpace.set(s, [...(bySpace.get(s) ?? []), c]);
    byVehicle.set(v, [...(byVehicle.get(v) ?? []), c]);
  }
  // Una plaza: sin dos reservas a la vez, con el margen de la sucursal (R-22). El que se pasó de hora cuenta hasta su fin reservado.
  for (const [key, list] of bySpace) {
    list.sort((a, b) => a.r.startTime.getTime() - b.r.startTime.getTime());
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]!, cur = list[i]!, margin = Number(cur.l.data.reservationMargin) * MIN;
      const prevEnd = prev.d.outcome === 'overstay' ? prev.r.startTime.getTime() + prev.d.hours * H : prev.occupiedTo.getTime();
      if (cur.r.startTime.getTime() - margin < prevEnd) problems.push(`Plaza ${key}: ${prev.r.code} y ${cur.r.code} se superponen`);
    }
  }
  for (const [plate, list] of byVehicle) {
    list.sort((a, b) => a.r.startTime.getTime() - b.r.startTime.getTime());
    for (let i = 1; i < list.length; i++) {
      if (list[i]!.r.startTime < list[i - 1]!.occupiedTo && list[i - 1]!.d.outcome !== 'overstay') problems.push(`Vehículo ${plate}: ${list[i - 1]!.r.code} y ${list[i]!.r.code} a la vez`);
    }
  }
  // Horario, duración y empleado de turno (R-01); sin reservas en un feriado al que la sucursal se adhiere.
  for (const { r, d, l } of created) {
    const p = l.data;
    const from = toMin(d.start), to = from + d.hours * 60;
    if (d.hours < p.minReservationHours || d.hours > p.maxReservationHours) problems.push(`${r.code}: duración ${d.hours} h fuera de ${p.minReservationHours}-${p.maxReservationHours}`);
    if (from < toMin(p.openingTime) || to > toMin(p.closingTime)) problems.push(`${r.code}: fuera del horario de ${p.name}`);
    if (p.closedOn.includes(d.day)) problems.push(`${r.code}: ${p.name} cierra ese día (feriado)`);
    const shifts = shiftsOf(l, d.day).sort((a, b) => a.from - b.from);
    let reach = from;
    for (const s of shifts) if (s.from <= reach && s.to > reach) reach = s.to;
    if (reach < to) problems.push(`${r.code}: sin empleado de turno de ${d.start} a ${d.hours} h en ${p.name}`);
    const ex = p.exceptions.find((e) => e.day === d.day);
    if (ex?.closures.some((c) => toMin(c.from) < to && from < toMin(c.to))) problems.push(`${r.code}: cae en un cierre de ${p.name}`);
  }
  if (problems.length) throw new Error(`La demo no cumple ${problems.length} regla(s):\n  ${problems.slice(0, 15).join('\n  ')}`);
  console.log(`  → Verificadas ${created.length} reservas (${active.length} activas o finalizadas) a las ${new Date(now).toLocaleTimeString('es-AR')}.`);
}
