import { EntityManager } from '@mikro-orm/core';
import { User } from '../../../User/User.Entity.js';
import { Parking } from '../../../Parking/Parking.Entity.js';
import { DayOfWeek, EmployeeShift } from '../../../EmployeeShift/EmployeeShift.Entity.js';
import { UserStatus, UserType } from '../../constants/status.js';
import { EMPLOYEE1_EMAIL, defaultPassword } from './userSeeder.js';

const ALL = Object.values(DayOfWeek);
const MON_SAT = ALL.filter(d => d !== DayOfWeek.SUNDAY);

// Un empleado pertenece a una sola sucursal (L-25) y solo el personal de esa sucursal registra ingreso y salida.
// `shifts`: su semana tipo. Central Plaza queda cubierta todos los días (dos turnos); Nueva Córdoba solo de lunes a sábado
// a la mañana, así el panel muestra "Turnos incompletos" y R-01 rechaza reservas sin empleado. El 8 está dado de baja.
type Staff = {
  email: string; dni: string; name: string; last_name: string; birth: string; phone: string; owner: string; parking: string;
  shifts?: { days: DayOfWeek[]; from: string; to: string }; status?: UserStatus;
};
const STAFF: Staff[] = [
  { email: EMPLOYEE1_EMAIL, dni: '35111333', name: 'Lucas', last_name: 'Operador', birth: '1995-11-25', phone: '3416005566', owner: 'dueno1', parking: 'Estacionamiento Central Plaza', shifts: { days: ALL, from: '07:00', to: '15:00' } },
  { email: 'empleado2@cocheras.com', dni: '36222444', name: 'Julieta', last_name: 'Paz', birth: '1996-05-09', phone: '3416005567', owner: 'dueno1', parking: 'Estacionamiento Central Plaza', shifts: { days: ALL, from: '15:00', to: '23:00' } },
  { email: 'empleado3@cocheras.com', dni: '34333555', name: 'Diego', last_name: 'Ríos', birth: '1993-09-17', phone: '3416005568', owner: 'dueno1', parking: 'Parking Monumento' },
  { email: 'empleado4@cocheras.com', dni: '37444666', name: 'Rocío', last_name: 'Luna', birth: '1998-02-03', phone: '3416005569', owner: 'dueno2', parking: 'Estacionamiento Paseo del Siglo' },
  { email: 'empleado5@cocheras.com', dni: '38555777', name: 'Tomás', last_name: 'Bustos', birth: '1997-12-21', phone: '3516005570', owner: 'dueno3', parking: 'Cochera Nueva Córdoba', shifts: { days: MON_SAT, from: '07:00', to: '15:00' } },
  { email: 'empleado6@cocheras.com', dni: '39666888', name: 'Camila', last_name: 'Ortiz', birth: '2000-08-14', phone: '3426005571', owner: 'dueno4', parking: 'Estacionamiento Peatonal San Martín' },
  { email: 'empleado7@cocheras.com', dni: '33777999', name: 'Nicolás', last_name: 'Vera', birth: '1992-04-27', phone: '2616005572', owner: 'dueno5', parking: 'Cochera Peatonal Sarmiento' },
  { email: 'empleado8@cocheras.com', dni: '35888000', name: 'Pablo', last_name: 'Acosta', birth: '1994-10-30', phone: '3416005573', owner: 'dueno1', parking: 'Cochera Pichincha', status: UserStatus.BAJA },
];

// Idempotente por email: crea los que faltan y completa la sucursal si está vacía. La semana tipo solo en sucursales sin turnos.
export const seedStaff = async (em: EntityManager, users: Map<string, User>): Promise<void> => {
  const parkings = new Map((await em.find(Parking, { name: STAFF.map(s => s.parking) })).map(p => [p.name, p]));
  const existing = new Map((await em.find(User, { email: STAFF.map(s => s.email) })).map(u => [u.email, u]));
  const withShifts = new Set((await em.find(EmployeeShift, { isActive: true }, { fields: ['parking'] })).map(s => s.parking.id));
  const password = await defaultPassword();

  for (const s of STAFF) {
    const parking = parkings.get(s.parking);
    const owner = users.get(`${s.owner}@cocheras.com`);
    if (!parking || !owner) continue;
    let employee = existing.get(s.email);
    if (!employee) {
      employee = em.create(User, {
        email: s.email, dni: s.dni, name: s.name, last_name: s.last_name, date_of_birth: new Date(s.birth), phone: s.phone,
        password, type: UserType.EMPLEADO, status: s.status ?? UserStatus.ACTIVO, ownerId: owner.id, parkingId: parking.id,
      });
    }
    if (!employee.parkingId) employee.parkingId = parking.id;
    if (!employee.ownerId) employee.ownerId = owner.id;
    if (s.shifts && !withShifts.has(parking.id)) {
      for (const dayOfWeek of s.shifts.days) {
        em.create(EmployeeShift, { parking, employee, dayOfWeek, startTime: s.shifts.from, endTime: s.shifts.to, isActive: true });
      }
    }
  }
};
