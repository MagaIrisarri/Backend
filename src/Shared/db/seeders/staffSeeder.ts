import { EntityManager } from '@mikro-orm/core';
import { User } from '../../../User/User.Entity.js';
import { Parking } from '../../../Parking/Parking.Entity.js';
import { DayOfWeek, EmployeeShift } from '../../../EmployeeShift/EmployeeShift.Entity.js';
import { UserStatus, UserType } from '../../constants/status.js';
import { EMPLOYEE1_EMAIL, defaultPassword } from './userSeeder.js';

const ALL = Object.values(DayOfWeek);
const MON_SAT = ALL.filter(d => d !== DayOfWeek.SUNDAY);
const MON_FRI = MON_SAT.filter(d => d !== DayOfWeek.SATURDAY);

// Un empleado pertenece a una sola sucursal (L-25) y solo el personal de esa sucursal registra ingreso y salida.
// `shifts`: su semana tipo. R-01: sin empleado de turno no se reserva, así que cada sucursal con reservas sembradas tiene turnos.
// Cubiertas todo el horario: Central Plaza, Monumento y Paseo del Siglo (dos turnos). Con huecos, para ver "Turnos incompletos"
// y el 409 de R-01: Nueva Córdoba (lunes a sábado a la mañana), Peatonal Córdoba (domingo a la tarde), Puerto Norte y
// Costanera San Nicolás (abren 24 h, sin noche), Bulevar y Barrio Lourdes (lunes a viernes). Sin turnos (no admiten
// reservas): Pichincha, cuyo único empleado, el 8, está de baja, y el resto de las sucursales.
type Staff = {
  email: string; dni: string; name: string; last_name: string; birth: string; phone: string; owner: string; parking: string;
  shifts?: { days: DayOfWeek[]; from: string; to: string }; status?: UserStatus;
};
const STAFF: Staff[] = [
  { email: EMPLOYEE1_EMAIL, dni: '35111333', name: 'Lucas', last_name: 'Operador', birth: '1995-11-25', phone: '3416005566', owner: 'dueno1', parking: 'Estacionamiento Central Plaza', shifts: { days: ALL, from: '07:00', to: '15:00' } },
  { email: 'empleado2@cocheras.com', dni: '36222444', name: 'Julieta', last_name: 'Paz', birth: '1996-05-09', phone: '3416005567', owner: 'dueno1', parking: 'Estacionamiento Central Plaza', shifts: { days: ALL, from: '15:00', to: '23:00' } },
  { email: 'empleado3@cocheras.com', dni: '34333555', name: 'Diego', last_name: 'Ríos', birth: '1993-09-17', phone: '3416005568', owner: 'dueno1', parking: 'Parking Monumento', shifts: { days: ALL, from: '06:00', to: '15:00' } },
  { email: 'empleado4@cocheras.com', dni: '37444666', name: 'Rocío', last_name: 'Luna', birth: '1998-02-03', phone: '3416005569', owner: 'dueno2', parking: 'Estacionamiento Paseo del Siglo', shifts: { days: ALL, from: '08:00', to: '14:00' } },
  { email: 'empleado5@cocheras.com', dni: '38555777', name: 'Tomás', last_name: 'Bustos', birth: '1997-12-21', phone: '3516005570', owner: 'dueno3', parking: 'Cochera Nueva Córdoba', shifts: { days: MON_SAT, from: '07:00', to: '15:00' } },
  { email: 'empleado6@cocheras.com', dni: '39666888', name: 'Camila', last_name: 'Ortiz', birth: '2000-08-14', phone: '3426005571', owner: 'dueno4', parking: 'Estacionamiento Peatonal San Martín', shifts: { days: ALL, from: '07:00', to: '21:00' } },
  { email: 'empleado7@cocheras.com', dni: '33777999', name: 'Nicolás', last_name: 'Vera', birth: '1992-04-27', phone: '2616005572', owner: 'dueno5', parking: 'Cochera Peatonal Sarmiento', shifts: { days: ALL, from: '08:00', to: '22:00' } },
  { email: 'empleado8@cocheras.com', dni: '35888000', name: 'Pablo', last_name: 'Acosta', birth: '1994-10-30', phone: '3416005573', owner: 'dueno1', parking: 'Cochera Pichincha', status: UserStatus.BAJA },
  { email: 'empleado9@cocheras.com', dni: '36100201', name: 'Martina', last_name: 'Sosa', birth: '1999-03-12', phone: '3416005574', owner: 'dueno1', parking: 'Parking Monumento', shifts: { days: ALL, from: '15:00', to: '23:59' } },
  { email: 'empleado10@cocheras.com', dni: '37100202', name: 'Federico', last_name: 'Molina', birth: '1996-07-30', phone: '3416005575', owner: 'dueno1', parking: 'Cochera Peatonal Córdoba', shifts: { days: ALL, from: '08:00', to: '15:00' } },
  { email: 'empleado11@cocheras.com', dni: '38100203', name: 'Agustina', last_name: 'Herrera', birth: '2001-01-19', phone: '3416005576', owner: 'dueno1', parking: 'Cochera Peatonal Córdoba', shifts: { days: MON_SAT, from: '15:00', to: '22:00' } },
  { email: 'empleado12@cocheras.com', dni: '34100204', name: 'Ramiro', last_name: 'Medina', birth: '1991-05-05', phone: '3366005577', owner: 'dueno1', parking: 'Parking Avenida Savio', shifts: { days: ALL, from: '07:00', to: '22:00' } },
  { email: 'empleado13@cocheras.com', dni: '39100205', name: 'Sofía', last_name: 'Domínguez', birth: '2000-10-08', phone: '3416005578', owner: 'dueno2', parking: 'Estacionamiento Paseo del Siglo', shifts: { days: ALL, from: '14:00', to: '21:00' } },
  { email: 'empleado14@cocheras.com', dni: '35100206', name: 'Emiliano', last_name: 'Castro', birth: '1994-12-14', phone: '3416005579', owner: 'dueno2', parking: 'Cocheras Puerto Norte', shifts: { days: ALL, from: '08:00', to: '20:00' } },
  { email: 'empleado15@cocheras.com', dni: '36100207', name: 'Valentina', last_name: 'Romero', birth: '1997-04-22', phone: '3366005580', owner: 'dueno2', parking: 'Estacionamiento Costanera San Nicolás', shifts: { days: ALL, from: '08:00', to: '20:00' } },
  { email: 'empleado16@cocheras.com', dni: '37100208', name: 'Joaquín', last_name: 'Ruiz', birth: '1998-08-03', phone: '3516005581', owner: 'dueno3', parking: 'Estacionamiento Plaza San Martín', shifts: { days: ALL, from: '08:00', to: '21:00' } },
  { email: 'empleado17@cocheras.com', dni: '38100209', name: 'Micaela', last_name: 'Álvarez', birth: '1999-11-27', phone: '3516005582', owner: 'dueno3', parking: 'Parking Güemes', shifts: { days: ALL, from: '09:00', to: '23:00' } },
  { email: 'empleado18@cocheras.com', dni: '33100210', name: 'Gonzalo', last_name: 'Benítez', birth: '1990-02-16', phone: '3546005583', owner: 'dueno3', parking: 'Cochera Costanera Carlos Paz', shifts: { days: ALL, from: '08:00', to: '23:59' } },
  { email: 'empleado19@cocheras.com', dni: '39100211', name: 'Florencia', last_name: 'Giménez', birth: '2001-06-09', phone: '3426005584', owner: 'dueno4', parking: 'Cochera Bulevar', shifts: { days: MON_FRI, from: '08:00', to: '20:00' } },
  { email: 'empleado20@cocheras.com', dni: '34100212', name: 'Ignacio', last_name: 'Peralta', birth: '1993-09-01', phone: '3436005585', owner: 'dueno4', parking: 'Parking Plaza 1° de Mayo', shifts: { days: ALL, from: '07:00', to: '22:00' } },
  { email: 'empleado21@cocheras.com', dni: '36100213', name: 'Carolina', last_name: 'Ponce', birth: '1997-01-25', phone: '2616005586', owner: 'dueno5', parking: 'Estacionamiento Parque Central', shifts: { days: ALL, from: '08:00', to: '17:00' } },
  { email: 'empleado22@cocheras.com', dni: '35100214', name: 'Santiago', last_name: 'Aguirre', birth: '1995-03-18', phone: '3416005587', owner: 'dueno5', parking: 'Cochera Barrio Lourdes', shifts: { days: MON_FRI, from: '07:00', to: '21:00' } },
];

// Idempotente por email: crea los que faltan. La semana tipo solo en sucursales sin turnos.
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
    if (s.shifts && !withShifts.has(parking.id)) {
      for (const dayOfWeek of s.shifts.days) {
        em.create(EmployeeShift, { parking, employee, dayOfWeek, startTime: s.shifts.from, endTime: s.shifts.to, isActive: true });
      }
    }
  }
};
