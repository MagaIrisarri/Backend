// Ingreso y salida de una reserva y el monto real (R-13, R-14, R-16, R-21) y los servicios que se cobran, contra MySQL en una base descartable.
// Correr: DB_NAME=parkingdb_checkout_test npx tsx tests-catedra/integration/Reservation.db.test.ts
import assert from 'node:assert/strict';
import argon2 from 'argon2';

if (!process.env.DB_NAME?.endsWith('_test')) throw new Error('Usar una base *_test: esta prueba la borra al terminar');

const { orm } = await import('../../src/Shared/db/orm.js');
orm.config.set('debug', false); // sin el log de cada consulta: la salida queda legible
const { reservationService: svc } = await import('../../src/Reservation/Reservation.Route.js');
const { User } = await import('../../src/User/User.Entity.js');
const { Parking } = await import('../../src/Parking/Parking.Entity.js');
const { ParkingSpace, SpaceState } = await import('../../src/ParkingSpace/ParkingSpace.Entity.js');
const { ParkingSpaceRepository } = await import('../../src/ParkingSpace/ParkingSpace.Repository.js');
const { ParkingPrice } = await import('../../src/ParkingPrice/ParkingPrice.Entity.js');
const { VehicleType } = await import('../../src/Vehicle/VehicleType/VehicleType.Entity.js');
const { Brand } = await import('../../src/Vehicle/Brand/Brand.Entity.js');
const { Model } = await import('../../src/Vehicle/Model/Model.Entity.js');
const { Vehicle } = await import('../../src/Vehicle/Vehicle.Entity.js');
const { Reservation } = await import('../../src/Reservation/Reservation.Entity.js');
const { EmployeeShift, DayOfWeek } = await import('../../src/EmployeeShift/EmployeeShift.Entity.js');
const { ServiceCatalog } = await import('../../src/ServiceCatalog/ServiceCatalog.Entity.js');
const { ServicePrice } = await import('../../src/ServicePrice/ServicePrice.Entity.js');
const { AppError } = await import('../../src/Shared/utils/AppError.js');
const { Invoice } = await import('../../src/Invoice/Invoice.Entity.js');
const { ReservationRepository } = await import('../../src/Reservation/Reservation.Repository.js');
const { rateReservationSchema } = await import('../../src/Reservation/Reservation.Schema.js');

const H = 3600_000, MIN = 60_000;
const em = orm.em;

try {
  await orm.schema.ensureDatabase();
  await orm.schema.refresh();

  const person = (dni: string, type: string, extra = {}) => em.create(User, {
    dni, name: type, last_name: 'Test', email: `${dni}@test.com`, phone: dni, date_of_birth: new Date('1990-01-01'),
    password: 'x', type, status: 'ACTIVO', ...extra,
  } as any);
  const owner = person('90000001', 'DUEÑO');
  const parking = em.create(Parking, {
    name: 'Prueba', address: 'Calle 1', province: 'Santa Fe', locality: 'Rosario', postalCode: '2000', latitude: 0, longitude: 0,
    openingTime: '00:00', closingTime: '23:59', minReservationHours: 1, maxReservationHours: 12, reservationMargin: 0,
    owner, isActive: true,
  } as any);
  await em.flush();
  const employee = person('90000002', 'EMPLEADO', { parkingId: parking.id });
  const client = person('90000003', 'CLIENTE');
  const auto = em.create(VehicleType, { name: 'AUTO' } as any);
  const brand = em.create(Brand, { name: 'FIAT' } as any);
  const model = em.create(Model, { name: 'Cronos', brand, vehicleType: auto } as any);
  const mkVehicle = (plate: string) => em.create(Vehicle, { plate, brand, model, vehicleType: auto, client } as any);
  const [a01, a02, a03] = ['A-01', 'A-02', 'A-03'].map((spaceCode) => em.create(ParkingSpace, { parking, spaceCode, vehicleType: auto, state: SpaceState.LIBRE, isActive: true } as any));
  em.create(ParkingPrice, { parking, vehicleType: auto, price: 1000 } as any);
  // R-01: sin empleado de turno no se reserva.
  for (const dayOfWeek of Object.values(DayOfWeek)) em.create(EmployeeShift, { parking, employee, dayOfWeek, startTime: '00:00', endTime: '23:59' } as any);
  const mkRes = (vehicle: any, space: any, startAgo: number, hours: number, status = 'PENDIENTE') => em.create(Reservation, {
    vehicle, parkingSpace: space, status, startTime: new Date(Date.now() - startAgo), endTime: new Date(Date.now() - startAgo + hours * H),
  } as any);

  // Se quedó de más: reservó 2 h, entró hace 3 h 20 min → descontada la gracia (CHECKOUT_GRACE_MINUTES = 10) son 3 h 10 min,
  // y cada hora empezada cuenta: 4 h = 2 reservadas + 2 extra.
  const late = mkRes(mkVehicle('LATE001'), a01, 3 * H + 20 * MIN, 2, 'EN CURSO');
  // Se fue antes: reservó 3 h, entró hace 50 min → se cobran las 3 reservadas.
  const early = mkRes(mkVehicle('EARLY01'), a02, 50 * MIN, 3, 'EN CURSO');
  await em.flush();

  let out = await svc.checkOut(late.id, employee.id);
  assert.deepEqual([out.invoice.reservedHours, out.invoice.extraHours, Number(out.invoice.totalAmount)], [2, 2, 4000]);
  assert.equal(out.reservation.status, 'FINALIZADA');
  assert.ok(Math.abs(out.reservation.endTime.getTime() - Date.now()) < MIN, 'el fin pasa a ser la salida real');
  out = await svc.checkOut(early.id, employee.id);
  assert.deepEqual([out.invoice.reservedHours, out.invoice.extraHours, Number(out.invoice.totalAmount)], [3, 0, 3000]);

  // Gracia de salida (R-14): reservó 1 h y sale 5 min tarde → sin hora extra.
  const grace = mkRes(mkVehicle('GRACE01'), a02, H + 5 * MIN, 1, 'EN CURSO');
  await em.flush();
  out = await svc.checkOut(grace.id, employee.id);
  assert.deepEqual([out.invoice.reservedHours, out.invoice.extraHours], [1, 0]);

  // R-14: si el dueño dio de baja la tarifa con el vehículo adentro, la salida se cobra con la última que tuvo ese tipo (antes: 500).
  const priceGone = mkRes(mkVehicle('GONE001'), a03, 30 * MIN, 1, 'EN CURSO');
  await em.flush();
  await em.nativeUpdate(ParkingPrice, { parking: parking.id, expirationDate: null }, { expirationDate: new Date() });
  out = await svc.checkOut(priceGone.id, employee.id);
  assert.equal(Number(out.invoice.hourlyRate), 1000);
  // Sin tarifa vigente para el tipo no se reserva (antes se aceptaba y el cliente veía "A consultar" con total $0).
  const noRateStart = new Date(); noRateStart.setDate(noRateStart.getDate() + 1); noRateStart.setHours(10, 0, 0, 0);
  await assert.rejects(svc.create({ vehicleId: priceGone.vehicle.id, parkingId: parking.id, startTime: noRateStart, endTime: new Date(noRateStart.getTime() + H) } as any),
    (e: any) => e instanceof AppError && e.statusCode === 409 && /no tiene tarifa/.test(e.message));
  await em.nativeUpdate(ParkingPrice, { parking: parking.id }, { expirationDate: null });

  // R-14: salida, plaza y factura van en una sola transacción: si algo falla no queda una reserva finalizada sin cobrar.
  const atomic = mkRes(mkVehicle('ATOM001'), a03, 30 * MIN, 1, 'EN CURSO');
  await em.flush();
  await em.nativeUpdate(ParkingSpace, { id: a03.id }, { state: SpaceState.OCUPADO });
  const charge = { totalAmount: 1000, reservedHours: 1, extraHours: 0, hourlyRate: 1000, servicesAmount: 0 };
  await assert.rejects(new ReservationRepository(em).finishWithInvoice(atomic.id, crypto.randomUUID(), new Date(), charge)); // empleado inexistente: falla la FK
  em.clear();
  assert.equal((await em.findOneOrFail(Reservation, { id: atomic.id })).status, 'EN CURSO');
  assert.equal((await em.findOneOrFail(ParkingSpace, { id: a03.id })).state, SpaceState.OCUPADO);
  assert.equal(await em.count(Invoice, { reservation: atomic.id }), 0);
  assert.equal((await svc.checkOut(atomic.id, employee.id)).reservation?.status, 'FINALIZADA'); // y se puede reintentar
  em.clear();

  // Ingreso: solo dentro del horario reservado (R-13, R-16) y solo el personal de la sucursal.
  const rejects = (p: Promise<unknown>, status: number) => assert.rejects(p, (e: any) => e instanceof AppError && e.statusCode === status);
  const future = mkRes(mkVehicle('FUTU001'), a01, -2 * H, 1);
  const expired = mkRes(mkVehicle('EXPI001'), a01, 3 * H, 1);
  const now = mkRes(mkVehicle('NOW0001'), a01, 5 * MIN, 2);
  await em.flush();
  await rejects(svc.checkIn(future.id, employee.id), 400);
  await rejects(svc.checkIn(expired.id, employee.id), 400);
  await rejects(svc.checkIn(now.id, client.id), 403);
  assert.equal((await svc.checkIn(now.id, employee.id)).status, 'EN CURSO');
  em.clear();

  // R-16/R-17: 15 min de tolerancia de llegada. Antes, solo dentro del margen de la sucursal (con margen 0, desde el inicio);
  // después del inicio + 15 min ya venció aunque el horario siga.
  const noShowRes = mkRes(mkVehicle('ARRL001'), a03, 20 * MIN, 2);
  const earlyRes = mkRes(mkVehicle('ARRE001'), a03, -10 * MIN, 2);
  await em.flush();
  await rejects(svc.checkIn(noShowRes.id, employee.id), 400);
  await rejects(svc.checkIn(earlyRes.id, employee.id), 400); // margen 0
  await em.nativeUpdate(Parking, { id: parking.id }, { reservationMargin: 30 });
  em.clear();
  assert.equal((await svc.checkIn(earlyRes.id, employee.id)).status, 'EN CURSO');
  const tooEarly = mkRes(mkVehicle('ARRE002'), a01, -20 * MIN, 2);
  await em.flush();
  await assert.rejects(svc.checkIn(tooEarly.id, employee.id), (e: any) => e.statusCode === 400 && /desde las \d\d:\d\d/.test(e.message));
  await em.nativeUpdate(Parking, { id: parking.id }, { reservationMargin: 5 }); // margen menor que la tolerancia: manda el margen
  em.clear();
  const tightEarly = mkRes(mkVehicle('ARRE003'), a02, -10 * MIN, 1);
  await em.flush();
  await rejects(svc.checkIn(tightEarly.id, employee.id), 400);
  await em.nativeUpdate(Parking, { id: parking.id }, { reservationMargin: 0 });
  await svc.checkOut(earlyRes.id, employee.id);
  await em.nativeUpdate(Reservation, { id: { $in: [noShowRes.id, tooEarly.id, tightEarly.id] } }, { status: 'CANCELADA' }); // no ocupan plazas en lo que sigue
  em.clear();

  // R-21: el cliente anterior se quedó de más en A-02 → quien llega con A-02 entra en la primera plaza libre (A-03).
  const stayed = mkRes(mkVehicle('STAY001'), a02, 3 * H, 2, 'EN CURSO');
  const next = mkRes(mkVehicle('NEXT001'), a02, 5 * MIN, 2);
  await em.flush();
  await em.nativeUpdate(ParkingSpace, { id: a02.id }, { state: SpaceState.OCUPADO });
  const entered = await svc.checkIn(next.id, employee.id);
  assert.deepEqual([entered.status, entered.parkingSpace.spaceCode], ['EN CURSO', 'A-03']);
  em.clear();
  // Sin otra plaza libre (A-01, A-02 y A-03 con un vehículo adentro), no entra.
  const third = mkRes(mkVehicle('THRD001'), a02, 5 * MIN, 2);
  await em.flush();
  await assert.rejects(svc.checkIn(third.id, employee.id),
    (e: any) => e.statusCode === 409 && /sigue ocupada por STAY001, que se pasó de hora, y no hay otra plaza libre/.test(e.message));
  // La salida no deja libre una plaza con otro vehículo adentro (datos viejos con dos en curso en la misma plaza).
  const other = mkRes(mkVehicle('OTHR001'), a02, 4 * H, 1, 'EN CURSO');
  await em.flush();
  await svc.checkOut(other.id, employee.id);
  em.clear();
  assert.equal((await em.findOneOrFail(ParkingSpace, { id: a02.id })).state, SpaceState.OCUPADO, 'STAY001 sigue adentro');

  // Servicios: se asocian por la tarifa vigente de la cochera (ServicePrice.id) y se cobran en la salida.
  const catalog = em.create(ServiceCatalog, { name: 'Lavado', description: 'Lavado exterior' } as any);
  const wash = em.create(ServicePrice, { parking: parking.id, serviceCatalog: catalog, price: 2500 } as any);
  const old = em.create(ServicePrice, { parking: parking.id, serviceCatalog: catalog, price: 2000, expirationDate: new Date() } as any);
  const plain = mkVehicle('SERV001');
  await em.flush();
  const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
  const book = (serviceIds: string[]) => svc.create({ vehicleId: plain.id, parkingId: parking.id, startTime: start, endTime: new Date(start.getTime() + 2 * H), serviceIds } as any);
  await rejects(book([catalog.id]), 400); // el id del catálogo no es una tarifa
  await rejects(book([old.id]), 400); // tarifa vencida
  // Las tres plazas tienen un vehículo adentro ahora, pero mañana están libres: se reserva igual (antes: "No hay plazas habilitadas").
  const booked = await book([wash.id]);
  em.clear();
  assert.equal(booked.parkingSpace.spaceCode, 'A-01'); // ocupada ahora por NOW0001
  // Y se puede pasar a otra plaza ocupada hoy (R-15), porque en su horario está libre.
  await svc.changeSpace(booked.id, a03.id, employee.id);
  em.clear();
  assert.equal((await em.findOneOrFail(Reservation, { id: booked.id })).parkingSpace.spaceCode, 'A-03');
  em.clear();
  const withServices = await em.findOneOrFail(Reservation, { id: booked.id }, { populate: ['services'] as any });
  assert.deepEqual(withServices.services.getItems().map((s) => Number(s.price)), [2500]);
  await em.nativeUpdate(Reservation, { id: booked.id }, { status: 'EN CURSO', startTime: new Date(Date.now() - 90 * MIN), endTime: new Date(Date.now() + 30 * MIN) });
  em.clear();
  out = await svc.checkOut(booked.id, employee.id);
  assert.deepEqual([out.invoice.reservedHours, out.invoice.extraHours, Number(out.invoice.servicesAmount), Number(out.invoice.totalAmount)], [2, 0, 2500, 4500]);

  // R-19 con la misma regla: la reserva de mañana de una plaza que se saca de servicio va a una ocupada hoy pero libre mañana.
  const a04 = em.create(ParkingSpace, { parking: parking.id, spaceCode: 'A-04', vehicleType: a01.vehicleType, state: SpaceState.LIBRE, isActive: true } as any);
  const tomorrow = mkRes(mkVehicle('TMRW001'), a04, -(24 * H), 1);
  await em.flush();
  await assert.rejects(new ParkingSpaceRepository(em).takeOutOfService(a04.id, 'MANTENIMIENTO', false),
    (e: any) => e.statusCode === 409 && e.details?.conflicts?.[0]?.reservationId === tomorrow.id && e.details.conflicts[0].toSpaceCode === 'A-01');

  // R-23: extender. Pasado mañana: X 10–12 y Y 12–14 en A-01 (margen 0). Extender X hasta las 13 pasa Y a la primera libre.
  em.clear();
  const at = (h: number) => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(h, 0, 0, 0); return d; };
  const mkAt = (plate: string, space: any, from: number, to: number) => em.create(Reservation, {
    vehicle: mkVehicle(plate), parkingSpace: space.id, status: 'PENDIENTE', startTime: at(from), endTime: at(to),
  } as any);
  const x = mkAt('EXTX001', a01, 10, 12), y = mkAt('EXTY001', a01, 12, 14);
  await em.flush();
  const ext = await svc.extend(x.id, at(13), employee.id);
  assert.equal(ext.reservation!.endTime.getTime(), at(13).getTime());
  assert.deepEqual(ext.moved, [{ id: y.id, code: 'R-' + y.id.slice(0, 6).toUpperCase(), from: 'A-01', to: 'A-02' }]);
  // Si la que choca no tiene otra plaza, no se cambia nada (la transacción vuelve atrás).
  mkAt('EXTZ001', a01, 14, 16);
  for (const [plate, s] of [['BLK2001', a02], ['BLK3001', a03], ['BLK4001', a04]] as const) mkAt(plate, s, 14, 16);
  await em.flush();
  await assert.rejects(svc.extend(x.id, at(15), employee.id), (e: any) => e.statusCode === 409 && /no hay otra plaza libre para pasarla/.test(e.message));
  em.clear();
  assert.equal((await em.findOneOrFail(Reservation, { id: x.id })).endTime.getTime(), at(13).getTime());
  await rejects(svc.extend(x.id, at(23), employee.id), 400); // 13 h > máximo de 12
  await rejects(svc.extend(x.id, at(11), employee.id), 400); // no es posterior al fin actual
  await rejects(svc.extend(x.id, at(14), client.id), 403);

  // R-24: agregar y quitar servicios (tarifas vigentes de la cochera); no se acepta una vencida ni ajena.
  em.clear();
  assert.deepEqual((await svc.setServices(x.id, [wash.id], employee.id)).services.getItems().map((s) => s.id), [wash.id]);
  em.clear();
  assert.equal((await svc.setServices(x.id, [], employee.id)).services.length, 0);
  em.clear();
  await rejects(svc.setServices(x.id, [old.id], employee.id), 400);
  await rejects(svc.setServices(x.id, [wash.id], client.id), 403);

  // R-26: el código se guarda al reservar, y las reservas sin código lo reciben al arrancar con el mismo que ya se veía.
  em.clear();
  assert.equal((await em.findOneOrFail(Reservation, { id: booked.id })).code, 'R-' + booked.id.slice(0, 6).toUpperCase());
  await em.nativeUpdate(Reservation, { id: x.id }, { code: null });
  assert.equal(await svc.fillMissingCodes(), 1);
  em.clear();
  assert.equal((await em.findOneOrFail(Reservation, { id: x.id })).code, 'R-' + x.id.slice(0, 6).toUpperCase());

  // R-27: valoración opcional de 1 a 5, solo del cliente, solo de una reserva finalizada y una sola vez.
  em.clear();
  await rejects(svc.rate(late.id, 4, employee.id), 403);
  await rejects(svc.rate(x.id, 4, client.id), 400); // pendiente, todavía no terminó
  assert.equal((await svc.rate(late.id, 4, client.id)).rating, 4);
  em.clear();
  assert.equal((await em.findOneOrFail(Reservation, { id: late.id })).rating, 4);
  await rejects(svc.rate(late.id, 5, client.id), 400);
  const rating = (n: number) => rateReservationSchema.safeParse({ params: { id: late.id }, body: { rating: n } }).success;
  assert.deepEqual([0, 1, 5, 6, 2.5].map(rating), [false, true, true, false, false]);

  // R-28: recordatorio una sola vez dentro de la ventana; no a las de más adelante ni a las canceladas.
  em.clear();
  const base = new Date(Date.now() + 10 * 24 * H); base.setMinutes(0, 0, 0);
  const mkLater = (plate: string, offset: number, status = 'PENDIENTE') => em.create(Reservation, {
    vehicle: mkVehicle(plate), parkingSpace: a01.id, status, startTime: new Date(base.getTime() + offset), endTime: new Date(base.getTime() + offset + H),
  } as any);
  mkLater('MAIL001', H);
  mkLater('MAIL002', 5 * H);
  mkLater('MAIL003', H, 'CANCELADA');
  await em.flush();
  assert.equal(await svc.sendReminders(base), 1);
  assert.equal(await svc.sendReminders(base), 0);

  // Cliente de mostrador (R-29): inicio = ahora sin segundos, fin = inicio + N h, EN CURSO con quien lo registró.
  // El email sin cuenta crea un cliente con el DNI como contraseña; nacimiento y teléfono quedan para que los complete él.
  const counter = { parkingId: parking.id, brandId: brand.id, modelId: model.id, name: 'Pepe', last_name: 'Mostrador', dni: '30111222', email: 'pepe@test.com' };
  await assert.rejects(svc.walkIn({ ...counter, plate: 'ZZ999ZZ', hours: 1, dni: '90000003' }, employee.id), /DNI ya está registrado/);
  await assert.rejects(svc.walkIn({ ...counter, plate: 'ZZ999ZZ', hours: 1, email: '90000003@test.com' }, employee.id), /otro DNI/);
  const { reservation: wi, accountCreated } = await svc.walkIn({ ...counter, plate: 'AB123CD', hours: 2 }, employee.id);
  assert.equal(accountCreated, true); // cliente nuevo: se creó la cuenta con el DNI como contraseña (R-29)
  assert.equal(wi.status, 'EN CURSO');
  assert.equal(wi.startTime.getSeconds(), 0);
  assert.equal(wi.endTime.getTime() - wi.startTime.getTime(), 2 * H);
  assert.equal(wi.checkedInBy?.id, employee.id);
  const created = await em.fork().findOneOrFail(User, { email: 'pepe@test.com' });
  assert.ok(await argon2.verify(created.password, '30111222'), 'la contraseña inicial es el DNI');
  assert.equal(created.date_of_birth, null);
  assert.equal(wi.vehicle.client.id, created.id);
  // Con el DNI como contraseña no carga vehículos ni reserva; el DNI no sirve como contraseña nueva; al cambiarla, sí.
  const { UserService } = await import('../../src/User/User.Service.js');
  const { UserRepository } = await import('../../src/User/User.Repository.js');
  const { VehicleService } = await import('../../src/Vehicle/Vehicle.Service.js');
  const { VehicleRepository } = await import('../../src/Vehicle/Vehicle.Repository.js');
  const users = new UserService(new UserRepository(em)), vehicles = new VehicleService(new VehicleRepository(em));
  assert.equal(created.mustChangePassword, true);
  const nextHour = new Date(); nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  await assert.rejects(svc.create({ parkingId: parking.id, vehicleId: wi.vehicle.id, startTime: nextHour, endTime: new Date(nextHour.getTime() + H) }), /contraseña temporal/);
  await assert.rejects(vehicles.create({ plate: 'AD789CE', brandId: brand.id, modelId: model.id }, created.id), /contraseña temporal/);
  await assert.rejects(users.updatePassword(created.id, '30111222', '30111222'), /no puede ser tu DNI/);
  assert.equal(await users.updatePassword(created.id, '30111222', 'nueva123'), true);
  assert.equal((await em.fork().findOneOrFail(User, { id: created.id })).mustChangePassword, false);
  // El mismo vehículo no entra de nuevo mientras sigue adentro.
  await assert.rejects(svc.walkIn({ ...counter, plate: 'AB123CD', hours: 1 }, employee.id), /figura adentro/);
  // Extender: horas completas desde el inicio, aunque el inicio no sea en punto.
  await assert.rejects(svc.extend(wi.id, new Date(wi.endTime.getTime() + 30 * MIN), employee.id), /horas completas/);
  // Un fin después de medianoche se rechaza aunque su HH:MM sea anterior al cierre (23:59).
  const midnight = new Date(wi.startTime); midnight.setHours(24, 0, 0, 0);
  const pastMidnight = Math.ceil((midnight.getTime() - wi.startTime.getTime()) / H) + 1;
  if (pastMidnight <= 12) await assert.rejects(svc.extend(wi.id, new Date(wi.startTime.getTime() + pastMidnight * H), employee.id), /fuera del horario/);
  await svc.extend(wi.id, new Date(wi.endTime.getTime() + H), employee.id);
  // La salida deja quién y cuándo.
  out = await svc.checkOut(wi.id, employee.id);
  assert.equal(out.reservation.checkedOutBy?.id, employee.id);
  assert.ok(out.reservation.checkedOutAt);
  // Un cliente con cuenta: el vehículo nuevo queda a su nombre, sin crear otro usuario.
  const { reservation: known, accountCreated: knownCreated } = await svc.walkIn({ ...counter, plate: 'AC456BD', hours: 1, dni: '90000003', email: '90000003@test.com' }, employee.id);
  assert.equal(knownCreated, false);
  assert.equal(known.vehicle.client.id, client.id);

  // Cobro en efectivo: tiene que cubrir el total y guarda lo recibido (una columna decimal se asigna como string; antes devolvía 500).
  const { InvoiceService } = await import('../../src/Invoice/Invoice.Service.js');
  const { InvoiceRepository } = await import('../../src/Invoice/Invoice.Repository.js');
  const invSvc = new InvoiceService(new InvoiceRepository(em));
  const due = Number(out.invoice.totalAmount);
  await rejects(invSvc.pay(out.invoice.id, { paymentMethod: 'EFECTIVO', amountReceived: due - 1 }), 400);
  const paid = await invSvc.pay(out.invoice.id, { paymentMethod: 'EFECTIVO', amountReceived: due + 500 });
  assert.equal(paid?.status, 'PAGADA');
  assert.equal(Number(paid?.amountReceived), due + 500);

  console.log('✓ Ingreso (con cambio de plaza si sigue el anterior), salida, reservas con la cochera llena hoy, extender, servicios, monto real, código (R-26), valoración (R-27) y recordatorio (R-28)');
} finally {
  await orm.schema.dropDatabase(process.env.DB_NAME).catch(() => {});
  await orm.close(true);
}
