import { EntityManager } from '@mikro-orm/core';
import { ServiceCatalog } from '../../../ServiceCatalog/ServiceCatalog.Entity.js';
import { ServicePrice } from '../../../ServicePrice/ServicePrice.Entity.js';
import { Parking } from '../../../Parking/Parking.Entity.js';

// Catálogo del administrador y el precio que cada dueño le pone en sus cocheras (R-24: se piden al reservar y se cobran en la salida).
const CATALOG: [string, string][] = [
  ['Lavado exterior', 'Lavado a mano de carrocería, llantas y vidrios'],
  ['Lavado completo', 'Lavado exterior e interior con aspirado'],
  ['Control de neumáticos', 'Control de presión e inflado de las cuatro ruedas'],
  ['Carga de batería', 'Carga lenta de batería mientras el vehículo está estacionado'],
];
const PRICES: Record<string, Record<string, number>> = {
  'Estacionamiento Central Plaza': { 'Lavado exterior': 6000, 'Lavado completo': 11000, 'Control de neumáticos': 1500 },
  'Parking Monumento': { 'Lavado exterior': 5500, 'Carga de batería': 4000 },
  'Estacionamiento Paseo del Siglo': { 'Lavado completo': 10500, 'Control de neumáticos': 1500 },
  'Cochera Nueva Córdoba': { 'Lavado exterior': 5000, 'Lavado completo': 9500 },
  'Cochera Costanera Carlos Paz': { 'Lavado exterior': 5500, 'Control de neumáticos': 1200 },
  'Estacionamiento Peatonal San Martín': { 'Lavado completo': 9000, 'Carga de batería': 3500 },
  'Cochera Peatonal Sarmiento': { 'Lavado exterior': 5200, 'Lavado completo': 9800, 'Carga de batería': 3800 },
};

// Idempotente: el catálogo por nombre (aunque esté dado de baja) y cada precio solo si esa cochera no tiene uno vigente para ese servicio.
export const seedServices = async (em: EntityManager): Promise<void> => {
  const catalog = new Map((await em.find(ServiceCatalog, { name: CATALOG.map(([n]) => n) })).map(c => [c.name, c]));
  for (const [name, description] of CATALOG) if (!catalog.has(name)) catalog.set(name, em.create(ServiceCatalog, { name, description }));

  const parkings = await em.find(Parking, { name: Object.keys(PRICES) });
  const active = await em.find(ServicePrice, { parking: parkings, expirationDate: null });
  for (const parking of parkings) {
    for (const [service, price] of Object.entries(PRICES[parking.name]!)) {
      const serviceCatalog = catalog.get(service)!;
      if (serviceCatalog.isActive === false) continue; // el administrador lo dio de baja: no se vuelve a ofrecer
      if (active.some(p => p.parking.id === parking.id && p.serviceCatalog.id === serviceCatalog.id)) continue;
      em.create(ServicePrice, { parking, serviceCatalog, price });
    }
  }
};
