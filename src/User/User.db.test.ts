// Usuarios del administrador: email, DNI y teléfono únicos en alta y edición (RA-08) y cambio de sucursal del empleado (RA-18).
// Correr: DB_NAME=parkingdb_user_test npx tsx src/User/User.db.test.ts
import assert from 'node:assert/strict';

if (!process.env.DB_NAME?.endsWith('_test')) throw new Error('Usar una base *_test: esta prueba la borra al terminar');

const { orm } = await import('../Shared/db/orm.js');
const { UserService } = await import('./User.Service.js');
const { UserRepository } = await import('./User.Repository.js');
const { User } = await import('./User.Entity.js');
const { Parking } = await import('../Parking/Parking.Entity.js');
const { EmployeeShift, DayOfWeek } = await import('../EmployeeShift/EmployeeShift.Entity.js');
const { AppError } = await import('../Shared/utils/AppError.js');

const em = orm.em.fork();

const rejects = (p: Promise<unknown>, status: number, text: RegExp) =>
  assert.rejects(p, (e: any) => e instanceof AppError && e.statusCode === status && text.test(e.message));

const person = (n: number, extra: object = {}) => ({
  dni: `9100000${n}`, name: 'Persona', last_name: `N${n}`, email: `p${n}@test.com`, phone: `9100000${n}`,
  date_of_birth: new Date('1990-01-01'), password: 'secreto1', ...extra,
});

try {
  await orm.schema.ensureDatabase();
  await orm.schema.refresh();

  const owner = em.create(User, { ...person(1), type: 'DUEÑO', status: 'ACTIVO' } as any);
  const mkParking = (name: string) => em.create(Parking, {
    name, address: 'Calle 1', province: 'Santa Fe', locality: 'Rosario', postalCode: '2000', latitude: 0, longitude: 0,
    openingTime: '00:00', closingTime: '23:59', minReservationHours: 1, maxReservationHours: 12, reservationMargin: 0,
    carCapacity: 1, owner, isActive: true,
  } as any);
  const p1 = mkParking('Centro');
  const p2 = mkParking('Norte');
  await em.flush();

  const svc = () => new UserService(new UserRepository(orm.em.fork()));

  // RA-08: alta con email, DNI o teléfono repetido.
  await svc().addPublicUser({ ...person(2), type: 'CLIENTE' } as any);
  await rejects(svc().addPublicUser({ ...person(3), email: 'p2@test.com', type: 'CLIENTE' } as any), 409, /email/);
  await rejects(svc().addPublicUser({ ...person(3), dni: '91000002', type: 'CLIENTE' } as any), 409, /DNI/);
  await rejects(svc().addPublicUser({ ...person(3), phone: '91000002', type: 'CLIENTE' } as any), 409, /teléfono/);
  const c3 = await svc().addPublicUser({ ...person(3), type: 'CLIENTE' } as any);

  // RA-08: la edición general también lo rechaza, pero conservar el propio dato no es un duplicado.
  await rejects(svc().update({ id: c3.id }, { email: 'P2@test.com' }), 409, /email/);
  await rejects(svc().update({ id: c3.id }, { dni: '91000002' }), 409, /DNI/);
  await rejects(svc().update({ id: c3.id }, { phone: '91000002' }), 409, /teléfono/);
  await svc().update({ id: c3.id }, { email: 'p3@test.com', name: 'Otro' });
  assert.equal((await orm.em.fork().findOneOrFail(User, c3.id)).name, 'Otro');

  // Empleados: alta y edición con datos repetidos.
  const e4 = await svc().addEmployee({ ...person(4), parkingId: p1.id } as any, owner.id);
  const e5 = await svc().addEmployee({ ...person(5), parkingId: p1.id } as any, owner.id);
  await rejects(svc().addEmployee({ ...person(6), dni: '91000004', parkingId: p1.id } as any, owner.id), 409, /DNI/);
  await rejects(svc().updateEmployee(owner.id, e5.id, { email: 'p4@test.com' }), 409, /email/);

  // RA-18: con un turno cargado no cambia de sucursal; sin turnos ni reservas sí; a una sucursal ajena sigue siendo 400.
  em.create(EmployeeShift, { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '12:00', employee: await em.findOneOrFail(User, e4.id), parking: p1 } as any);
  await em.flush();
  await rejects(svc().updateEmployee(owner.id, e4.id, { parkingId: p2.id }), 409, /cambiar de sucursal.*1 turno/);
  await svc().updateEmployee(owner.id, e4.id, { parkingId: p1.id, name: 'Mismo' }); // misma sucursal: no cuenta como cambio
  await svc().updateEmployee(owner.id, e5.id, { parkingId: p2.id });
  assert.equal((await orm.em.fork().findOneOrFail(User, e5.id)).parkingId, p2.id);
  await rejects(svc().remove({ id: e4.id }), 409, /dar de baja/);

  console.log('✓ Usuarios: unicidad en alta y edición (RA-08) y cambio de sucursal del empleado (RA-18)');
} finally {
  await orm.schema.dropDatabase(process.env.DB_NAME).catch(() => {});
  await orm.close(true);
}
