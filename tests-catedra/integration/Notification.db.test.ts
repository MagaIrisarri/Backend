// Notificaciones dentro de la aplicación: quién recibe cada aviso de reserva, lectura propia y que un fallo del aviso no rompa la acción, contra MySQL en una base descartable.
// Correr: DB_NAME=parkingdb_notif_test npx tsx tests-catedra/integration/Notification.db.test.ts
import assert from 'node:assert/strict';

if (!process.env.DB_NAME?.endsWith('_test')) throw new Error('Usar una base *_test: esta prueba la borra al terminar');

const { orm } = await import('../../src/Shared/db/orm.js');
const { reservationService: svc } = await import('../../src/Reservation/Reservation.Route.js');
const { notificationService: notifications } = await import('../../src/Notification/Notification.Route.js');
const { User } = await import('../../src/User/User.Entity.js');
const { Parking } = await import('../../src/Parking/Parking.Entity.js');
const { ParkingSpace, SpaceState } = await import('../../src/ParkingSpace/ParkingSpace.Entity.js');
const { ParkingPrice } = await import('../../src/ParkingPrice/ParkingPrice.Entity.js');
const { VehicleType } = await import('../../src/Vehicle/VehicleType/VehicleType.Entity.js');
const { Brand } = await import('../../src/Vehicle/Brand/Brand.Entity.js');
const { Model } = await import('../../src/Vehicle/Model/Model.Entity.js');
const { Vehicle } = await import('../../src/Vehicle/Vehicle.Entity.js');
const { Reservation } = await import('../../src/Reservation/Reservation.Entity.js');
const { EmployeeShift, DayOfWeek } = await import('../../src/EmployeeShift/EmployeeShift.Entity.js');
const { AppError } = await import('../../src/Shared/utils/AppError.js');
const { ParkingSpaceService } = await import('../../src/ParkingSpace/ParkingSpace.Service.js');
const { ParkingSpaceRepository } = await import('../../src/ParkingSpace/ParkingSpace.Repository.js');
const { ParkingRepository } = await import('../../src/Parking/Parking.Repository.js');

const H = 3600_000;
const em = orm.em;

try {
  await orm.schema.ensureDatabase();
  await orm.schema.refresh();

  const person = (dni: string, type: string, extra = {}) => em.create(User, {
    dni, name: type, last_name: 'Test', email: `${dni}@test.com`, phone: dni, date_of_birth: new Date('1990-01-01'),
    password: 'x', type, status: 'ACTIVO', ...extra,
  } as any);
  const owner = person('91000001', 'DUEÑO');
  const parking = em.create(Parking, {
    name: 'Prueba', address: 'Calle 1', province: 'Santa Fe', locality: 'Rosario', postalCode: '2000', latitude: 0, longitude: 0,
    openingTime: '00:00', closingTime: '23:59', minReservationHours: 1, maxReservationHours: 12, reservationMargin: 0,
    owner, isActive: true,
  } as any);
  await em.flush();
  const employee = person('91000002', 'EMPLEADO', { parkingId: parking.id });
  const retired = person('91000003', 'EMPLEADO', { parkingId: parking.id, status: 'BAJA' });
  const stranger = person('91000004', 'EMPLEADO', { parkingId: 'otra-sucursal' });
  const client = person('91000005', 'CLIENTE');
  const auto = em.create(VehicleType, { name: 'AUTO' } as any);
  const brand = em.create(Brand, { name: 'FIAT' } as any);
  const model = em.create(Model, { name: 'Cronos', brand, vehicleType: auto } as any);
  const mkVehicle = (plate: string) => em.create(Vehicle, { plate, brand, model, vehicleType: auto, client } as any);
  const [a01, a02] = ['A-01', 'A-02'].map((spaceCode) => em.create(ParkingSpace, { parking, spaceCode, vehicleType: auto, state: SpaceState.LIBRE, isActive: true } as any));
  em.create(ParkingPrice, { parking, vehicleType: auto, price: 1000 } as any);
  const v1 = mkVehicle('NOTI001'), v2 = mkVehicle('NOTI002'), v3 = mkVehicle('NOTI003'), v4 = mkVehicle('NOTI004'), v5 = mkVehicle('NOTI005');
  // R-01: sin empleado de turno no se reserva.
  for (const dayOfWeek of Object.values(DayOfWeek)) em.create(EmployeeShift, { parking, employee, dayOfWeek, startTime: '00:00', endTime: '23:59' } as any);
  await em.flush();

  const rejects = (p: Promise<unknown>, status: number) => assert.rejects(p, (e: any) => e instanceof AppError && e.statusCode === status);
  const types = async (u: { id: string }) => (await notifications.list(u.id)).data.map((n) => n.type).sort();

  const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
  const book = (vehicleId: string) => svc.create({ vehicleId, parkingId: parking.id, startTime: start, endTime: new Date(start.getTime() + 2 * H) } as any);

  // Reserva nueva → el dueño y los empleados activos de esa sucursal; no el cliente, ni un empleado de baja o de otra sucursal.
  em.clear();
  const first = await book(v1.id);
  assert.deepEqual(await types(owner), ['RESERVA_NUEVA']);
  assert.deepEqual(await types(employee), ['RESERVA_NUEVA']);
  for (const nobody of [client, retired, stranger]) assert.deepEqual(await types(nobody), []);
  const [created] = (await notifications.list(owner.id)).data;
  assert.deepEqual([created!.reservationId, created!.readAt ?? null], [first.id, null]);
  assert.ok(created!.title.includes(first.code!) && created!.message.includes('NOTI001'));
  assert.equal(first.attendedBy?.id, employee.id, 'R-07: la reserva nace con el empleado de turno');

  // Cambios del personal → el cliente.
  em.clear();
  await svc.changeSpace(first.id, a02.id, employee.id);
  em.clear();
  await svc.extend(first.id, new Date(start.getTime() + 3 * H), employee.id);
  assert.deepEqual(await types(client), ['PLAZA_CAMBIADA', 'RESERVA_EXTENDIDA']);

  // Cancela el cliente → lo sabe el personal (no el propio cliente).
  em.clear();
  assert.equal(await svc.remove(first.id, client.id), true);
  assert.deepEqual(await types(owner), ['RESERVA_CANCELADA', 'RESERVA_NUEVA']);
  assert.deepEqual(await types(employee), ['RESERVA_CANCELADA', 'RESERVA_NUEVA']);
  assert.equal((await types(client)).length, 2);

  // Cancela el personal → lo sabe el cliente, no el personal.
  em.clear();
  const second = await book(v2.id);
  em.clear();
  await rejects(svc.remove(second.id, employee.id), 400); // el personal dice el motivo
  em.clear();
  await svc.remove(second.id, employee.id, 'Corte de luz');
  const cancelled = (await notifications.list(client.id)).data.filter((n) => n.type === 'RESERVA_CANCELADA');
  assert.equal(cancelled.length, 1);
  assert.match(cancelled[0]!.message, /Motivo: Corte de luz/);
  assert.equal((await em.fork().findOneOrFail(Reservation, { id: second.id })).cancelReason, 'Corte de luz');
  assert.deepEqual(await types(owner), ['RESERVA_CANCELADA', 'RESERVA_NUEVA', 'RESERVA_NUEVA']);

  // L-29: extender reubica la reserva siguiente de la plaza: se enteran su cliente y su empleado, no quien extendió (el dueño).
  em.clear();
  const third = await book(v1.id);
  em.clear();
  const next = await svc.create({ vehicleId: v4.id, parkingId: parking.id, startTime: new Date(start.getTime() + 2 * H), endTime: new Date(start.getTime() + 4 * H), parkingSpaceId: third.parkingSpace.id } as any);
  em.clear();
  const { moved } = await svc.extend(third.id, new Date(start.getTime() + 3 * H), owner.id);
  assert.deepEqual(moved.map((m) => m.id), [next.id]);
  assert.equal((await types(client)).filter((t) => t === 'PLAZA_CAMBIADA').length, 2);
  assert.deepEqual((await types(employee)).filter((t) => t === 'PLAZA_CAMBIADA'), ['PLAZA_CAMBIADA']);
  assert.ok(!(await types(owner)).includes('PLAZA_CAMBIADA'));

  // Ingreso → el cliente.
  em.clear();
  const arriving = em.create(Reservation, { vehicle: v5, parkingSpace: a02, status: 'PENDIENTE', startTime: new Date(Date.now() - 5 * 60_000), endTime: new Date(Date.now() + H) } as any);
  await em.flush();
  em.clear();
  await svc.checkIn(arriving.id, employee.id);
  assert.equal((await types(client)).filter((t) => t === 'INGRESO').length, 1);

  // Salida con factura → el cliente, con el total.
  em.clear();
  const inside = em.create(Reservation, {
    vehicle: v3, parkingSpace: a01, status: 'EN CURSO', startTime: new Date(Date.now() - H / 2), endTime: new Date(Date.now() + H),
  } as any);
  await em.flush();
  await svc.checkOut(inside.id, employee.id);
  const exit = (await notifications.list(client.id)).data.find((n) => n.type === 'SALIDA');
  assert.match(exit?.message ?? '', /\$2\.?000/, 'el aviso trae el total cobrado (1,5 h reservadas = 2 h a $1000)');

  // R-28: el recordatorio también deja el aviso, una sola vez.
  em.clear();
  const base = new Date(Date.now() + 10 * 24 * H); base.setMinutes(0, 0, 0);
  em.create(Reservation, { vehicle: v1, parkingSpace: a01, status: 'PENDIENTE', startTime: new Date(base.getTime() + H), endTime: new Date(base.getTime() + 2 * H) } as any);
  await em.flush();
  assert.equal(await svc.sendReminders(base), 1);
  assert.equal(await svc.sendReminders(base), 0);
  assert.equal((await types(client)).filter((t) => t === 'RECORDATORIO').length, 1);

  // R-17: sin ingreso pasados 15 min del inicio se cancela y avisa al cliente, aunque el horario siga; dentro de la tolerancia, no.
  em.clear();
  em.create(Reservation, { vehicle: v2, parkingSpace: a01, status: 'PENDIENTE', startTime: new Date(Date.now() - 20 * 60_000), endTime: new Date(Date.now() + 2 * H) } as any);
  em.create(Reservation, { vehicle: v2, parkingSpace: a01, status: 'PENDIENTE', startTime: new Date(Date.now() - 10 * 60_000), endTime: new Date(Date.now() + 2 * H) } as any);
  await em.flush();
  assert.equal(await svc.cancelExpired(), 1);
  assert.equal(await svc.cancelExpired(), 0);
  assert.equal((await types(client)).filter((t) => t === 'RESERVA_VENCIDA').length, 1);

  // R-07: las activas que quedaron sin empleado (anteriores a la asignación al reservar) toman el de turno.
  em.clear();
  const loose = em.create(Reservation, { vehicle: v4, parkingSpace: a01, status: 'PENDIENTE', startTime: new Date(base.getTime() + 5 * H), endTime: new Date(base.getTime() + 6 * H) } as any);
  await em.flush();
  assert.ok(await svc.fillMissingEmployees() >= 1);
  assert.equal((await em.fork().findOneOrFail(Reservation, { id: loose.id })).attendedBy?.id, employee.id);

  // Perfil: el dueño apagó "reserva nueva" → no le llega; al empleado sí.
  const count = async (u: { id: string }, type: string) => (await types(u)).filter((t) => t === type).length;
  await em.nativeUpdate(User, { id: owner.id }, { mutedNotifications: ['RESERVA_NUEVA'] } as any);
  em.clear();
  const [ownerNew, staffNew] = [await count(owner, 'RESERVA_NUEVA'), await count(employee, 'RESERVA_NUEVA')];
  await svc.create({ vehicleId: v4.id, parkingId: parking.id, startTime: new Date(base.getTime() + 8 * H), endTime: new Date(base.getTime() + 9 * H) } as any);
  assert.deepEqual([await count(owner, 'RESERVA_NUEVA'), await count(employee, 'RESERVA_NUEVA')], [ownerNew, staffNew + 1]);

  // Sucursal llena: el ingreso que ocupa la última plaza libre le avisa al dueño (A-02 ya tiene adentro a NOTI005).
  const arrive = async (vehicle: { id: string }) => {
    em.clear();
    const r = em.create(Reservation, { vehicle, parkingSpace: a01, status: 'PENDIENTE', startTime: new Date(Date.now() - 5 * 60_000), endTime: new Date(Date.now() + H) } as any);
    await em.flush(); em.clear();
    await svc.checkIn(r.id, employee.id);
    return r.id;
  };
  const filled = await arrive(v3);
  assert.equal(await count(owner, 'SUCURSAL_LLENA'), 1);
  assert.equal(await count(employee, 'SUCURSAL_LLENA'), 0, 'solo al dueño');
  // Con el aviso apagado no le llega.
  em.clear();
  await svc.checkOut(filled, employee.id);
  await em.nativeUpdate(User, { id: owner.id }, { mutedNotifications: ['RESERVA_NUEVA', 'SUCURSAL_LLENA'] } as any);
  await arrive(v3);
  assert.equal(await count(owner, 'SUCURSAL_LLENA'), 1);

  // R-19: sacar de servicio una plaza con reservas futuras. Sin confirmar responde 409 y no avisa; confirmado, avisa al cliente y
  // al empleado asignado, no al dueño que la sacó.
  const spaces = new ParkingSpaceService(new ParkingSpaceRepository(em), new ParkingRepository(em), notifications);
  const moves = async () => [await count(client, 'PLAZA_CAMBIADA'), await count(employee, 'PLAZA_CAMBIADA'), await count(owner, 'PLAZA_CAMBIADA')];
  em.clear();
  const a03 = em.create(ParkingSpace, { parking: parking.id, spaceCode: 'A-03', vehicleType: auto.id, state: SpaceState.LIBRE, isActive: true } as any);
  const later = em.create(Reservation, {
    vehicle: v5.id, parkingSpace: a03, attendedBy: employee.id, status: 'PENDIENTE',
    startTime: new Date(base.getTime() + 12 * H), endTime: new Date(base.getTime() + 13 * H),
  } as any);
  await em.flush();
  const [clientMoves, staffMoves, ownerMoves] = await moves();
  em.clear();
  await rejects(spaces.update(a03.id, { state: SpaceState.MANTENIMIENTO } as any, owner.id), 409);
  assert.deepEqual(await moves(), [clientMoves, staffMoves, ownerMoves]);
  em.clear();
  const { moved: relocated } = await spaces.update(a03.id, { state: SpaceState.MANTENIMIENTO, relocate: true } as any, owner.id);
  assert.deepEqual(relocated.map((m) => m.reservationId), [later.id]);
  assert.deepEqual(await moves(), [clientMoves + 1, staffMoves + 1, ownerMoves]);
  const toEmployee = (await notifications.list(employee.id)).data.find((n) => n.type === 'PLAZA_CAMBIADA' && n.reservationId === later.id);
  assert.match(toEmployee?.message ?? '', /de la plaza A-03 a la A-0[12] porque la plaza pasó a mantenimiento/);

  // Cambio de plaza a mano del dueño → también el empleado asignado (como al extender).
  em.clear();
  await svc.changeSpace(later.id, relocated[0]!.toSpaceId === a01.id ? a02.id : a01.id, owner.id);
  assert.deepEqual(await moves(), [clientMoves + 2, staffMoves + 2, ownerMoves]);

  // R-07: asignar otro empleado a mano → el que la recibe y el que la deja, salvo quien hizo el cambio; al mismo, nada.
  const relief = person('91000006', 'EMPLEADO', { parkingId: parking.id });
  await em.flush();
  const transfers = async () => [await count(employee, 'RESERVA_TRANSFERIDA'), await count(relief, 'RESERVA_TRANSFERIDA')];
  em.clear();
  await svc.assignEmployee(later.id, relief.id, owner.id);
  assert.deepEqual(await transfers(), [1, 1]);
  em.clear();
  await svc.assignEmployee(later.id, relief.id, owner.id);
  assert.deepEqual(await transfers(), [1, 1], 'asignar al mismo no avisa');
  em.clear();
  await svc.assignEmployee(later.id, employee.id, relief.id);
  assert.deepEqual(await transfers(), [2, 1], 'quien se la pasa a otro no recibe su propio aviso');
  assert.equal((await em.fork().findOneOrFail(Reservation, { id: later.id })).attendedBy?.id, employee.id);

  // Lectura: solo la propia (403 la ajena, 404 la que no existe); "todas" deja el contador en 0.
  const { data: mine, unread } = await notifications.list(client.id);
  assert.equal(unread, mine.length);
  await rejects(notifications.markRead(mine[0]!.id, owner.id), 403);
  await rejects(notifications.markRead('00000000-0000-4000-8000-000000000000', client.id), 404);
  await notifications.markRead(mine[0]!.id, client.id);
  const afterOne = await notifications.list(client.id);
  assert.equal(afterOne.unread, mine.length - 1);
  assert.ok(afterOne.data.find((n) => n.id === mine[0]!.id)!.readAt, 'queda con la hora de lectura');
  await notifications.markAllRead(client.id);
  assert.equal((await notifications.list(client.id)).unread, 0);
  assert.ok((await notifications.list(owner.id)).unread > 0, 'leer las propias no toca las de otro');

  // L-31: ventana de 30 días, de a páginas de 30 y con el contador sobre la misma ventana; purga a los 90 días.
  const { Notification } = await import('../../src/Notification/Notification.Entity.js');
  const reader = person('91000099', 'CLIENTE');
  await em.flush();
  const DAY = 86_400_000, now = Date.now();
  const mk = (i: number, ageMs: number) => em.create(Notification, { recipient: reader, type: 'RECORDATORIO', title: `n${i}`, message: 'x', createdAt: new Date(now - ageMs) } as any);
  for (let i = 0; i < 35; i++) mk(i, (i + 1) * 60_000); // dentro de la ventana, sin leer
  mk(100, 31 * DAY); mk(101, 40 * DAY); // fuera de la ventana, sin leer: no cuentan ni se ven
  mk(102, 95 * DAY); // para la purga
  await em.flush();
  const p1 = await notifications.list(reader.id);
  assert.equal(p1.unread, 35, 'el contador no cuenta las de más de 30 días');
  assert.equal(p1.data.length, 30);
  assert.ok(p1.next, 'hay más');
  assert.equal(p1.data[0]!.title, 'n0', 'de la más nueva a la más vieja');
  const p2 = await notifications.list(reader.id, { cursor: p1.next! });
  assert.deepEqual(p2.data.map((n) => n.title), ['n30', 'n31', 'n32', 'n33', 'n34']);
  assert.equal(p2.next, null, 'la ventana termina ahí: no aparecen las de más de 30 días');
  await notifications.markRead(p1.data[0]!.id, reader.id);
  const unreadOnly = await notifications.list(reader.id, { unreadOnly: true });
  assert.ok(unreadOnly.data.every((n) => !n.readAt) && unreadOnly.data.length === 30 && unreadOnly.unread === 34);
  await rejects(notifications.list(reader.id, { cursor: 'basura' }), 400);
  assert.equal(await notifications.purgeOld(now), 1, 'borra solo las de más de 90 días');
  assert.equal(await em.fork().count(Notification, { recipient: reader.id }), 37);

  // Un fallo del aviso (destinatario inexistente) no lanza: la acción que lo origina ya se guardó.
  await notifications.notify(['no-existe'], { type: 'RESERVA_NUEVA', title: 'x', message: 'x' });

  console.log('✓ Notificaciones: reserva nueva → personal, cambios → cliente, cancelación según quién cancela, salida, recordatorio (R-28), vencidas (R-17), reubicación al sacar una plaza (R-19), cambio de plaza y de empleado a mano (R-07), lectura propia, ventana de 30 días con paginación y purga (L-31) y fallo del aviso sin romper la acción');
} finally {
  await orm.schema.dropDatabase(process.env.DB_NAME).catch(() => {});
  await orm.close(true);
}
