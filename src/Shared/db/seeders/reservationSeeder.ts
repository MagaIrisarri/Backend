import { EntityManager } from '@mikro-orm/core';
import { Parking } from '../../../Parking/Parking.Entity.js';
import { ParkingPrice } from '../../../ParkingPrice/ParkingPrice.Entity.js';
import { Reservation } from '../../../Reservation/Reservation.Entity.js';
import { Invoice } from '../../../Invoice/Invoice.Entity.js';
import { Vehicle } from '../../../Vehicle/Vehicle.Entity.js';
import { Model } from '../../../Vehicle/Model/Model.Entity.js';
import { User } from '../../../User/User.Entity.js';
import { ReservationStatus } from '../../constants/status.js';
import { categorizeVehicleType } from '../../utils/vehicleTypes.js';
import { CLIENT1_EMAIL, EMPLOYEE1_EMAIL, OWNER1_EMAIL } from './userSeeder.js';

const PLATE = 'AE123CD'; // auto del cliente 1; si ya tiene reservas, no se siembra de nuevo
const CENTRAL = 'Estacionamiento Central Plaza'; // sucursal del empleado 1
const CORDOBA = 'Cochera Peatonal Córdoba';

// Historial del cliente 1: reservas finalizadas y cobradas, como las deja el check-out (R-14) y el pago.
// `extra`: horas que se quedó de más; con 0 se fue antes del fin reservado y se cobran igual las reservadas.
const FINISHED = [
  { parking: CENTRAL, daysAgo: 2, start: 9, hours: 2, extra: 0, method: 'EFECTIVO' },
  { parking: CENTRAL, daysAgo: 9, start: 14, hours: 2, extra: 1, method: 'MERCADO_PAGO' },
  { parking: CORDOBA, daysAgo: 20, start: 10, hours: 3, extra: 0, method: 'TARJETA_DEBITO' },
  { parking: CENTRAL, daysAgo: 45, start: 16, hours: 4, extra: 0, method: 'TRANSFERENCIA' },
];

export const seedReservations = async (em: EntityManager): Promise<void> => {
  const [client, employee, owner] = await Promise.all([CLIENT1_EMAIL, EMPLOYEE1_EMAIL, OWNER1_EMAIL].map((email) => em.findOne(User, { email })));
  const parkings = await em.find(Parking, { name: [CENTRAL, CORDOBA] }, { populate: ['parkingSpaces'] });
  const central = parkings.find((p) => p.name === CENTRAL);
  if (!client || !employee || !owner || !central) return;

  // Un empleado pertenece a una sucursal (L-25) y solo el personal de esa sucursal registra ingreso y salida.
  if (!employee.parkingId) employee.parkingId = central.id;

  let vehicle = await em.findOne(Vehicle, { plate: PLATE });
  if (vehicle && (await em.count(Reservation, { vehicle }))) return;
  if (!vehicle) {
    const model = await em.findOne(Model, { vehicleType: { name: 'AUTO' }, brand: { name: 'FIAT' } }, { populate: ['brand', 'vehicleType'] })
      ?? await em.findOneOrFail(Model, { vehicleType: { name: 'AUTO' } }, { populate: ['brand', 'vehicleType'] });
    vehicle = em.create(Vehicle, { plate: PLATE, color: 'Gris', year: 2021, brand: model.brand, model, vehicleType: model.vehicleType, client } as any); // isActive y las fechas salen de los valores por defecto de la entidad
  }

  let created = 0;
  for (const r of FINISHED) {
    const parking = parkings.find((p) => p.name === r.parking);
    const space = parking?.parkingSpaces.getItems().find((s) => categorizeVehicleType(s.vehicleType) === 'AUTO' && s.isActive !== false);
    const rate = parking && await em.findOne(ParkingPrice, { parking, vehicleType: 'AUTO', expirationDate: null });
    if (!parking || !space || !rate) continue;

    const startTime = new Date();
    startTime.setDate(startTime.getDate() - r.daysAgo);
    startTime.setHours(r.start, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + r.hours * 3600_000);
    // El check-out guarda la salida real como fin: 20 min dentro de la última hora extra, o 15 min antes si se fue temprano.
    const exit = new Date(endTime.getTime() + (r.extra ? (r.extra - 1) * 3600_000 + 20 * 60_000 : -15 * 60_000));

    const reservation = em.create(Reservation, {
      startTime, endTime: exit, status: ReservationStatus.FINALIZADA, vehicle, parkingSpace: space,
      attendedBy: parking === central ? employee : owner, // en otra sucursal lo atiende su dueño
    });
    const hourlyRate = Number(rate.price);
    em.create(Invoice, {
      reservation, reservedHours: r.hours, extraHours: r.extra, hourlyRate, servicesAmount: 0,
      totalAmount: (r.hours + r.extra) * hourlyRate, status: 'PAGADA', paymentMethod: r.method, paymentDate: exit, createdAt: exit,
    });
    created++;
  }
  console.log(`  → Cliente 1: ${created} reservas finalizadas y cobradas (${PLATE}).`);
};
