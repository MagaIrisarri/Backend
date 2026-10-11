import { EntityManager } from '@mikro-orm/core';
import fs from 'fs';
import path from 'path';
import { VehicleType } from '../../../Vehicle/VehicleType/VehicleType.Entity.js';
import { Insurance } from '../../../Vehicle/Insurance/Insurance.Entity.js';
import { Brand } from '../../../Vehicle/Brand/Brand.Entity.js';
import { Model } from '../../../Vehicle/Model/Model.Entity.js';
import { VEHICLE_CATEGORIES, categorizeVehicleType, VehicleCategory } from '../../utils/vehicleTypes.js';

interface VehiculoModelo { nombre: string; tipoOriginal?: string; }
interface VehiculoMarca  { marca: string; modelos: VehiculoModelo[]; }

export const INSURANCES = ['La Caja Seguros', 'San Cristóbal', 'Sancor Seguros', 'Federación Patronal', 'Zurich Seguros'];

// vehiculos.json no trae motos: sin estos modelos ningún cliente podía cargar una y las plazas de moto no se usaban.
const MOTOS: [string, string[]][] = [
  ['HONDA', ['WAVE 110 S', 'CG 150 TITAN', 'XR 150 L']],
  ['YAMAHA', ['YBR 125', 'FZ 2.0', 'XTZ 125']],
  ['MOTOMEL', ['BLITZ 110', 'SKUA 150']],
  ['ZANELLA', ['ZB 110', 'RX 150']],
];

// Idempotente: tipos, seguros y marcas por nombre; los modelos del JSON solo en una base sin catálogo, y las motos si no hay ninguna.
export const seedVehicles = async (em: EntityManager): Promise<void> => {
  const types = new Map((await em.find(VehicleType, {})).map(t => [t.name, t]));
  for (const c of VEHICLE_CATEGORIES) if (!types.has(c)) types.set(c, em.create(VehicleType, { name: c }));
  const typeOf = (c: VehicleCategory) => types.get(c)!;

  const insurances = new Set((await em.find(Insurance, {})).map(i => i.name));
  for (const name of INSURANCES) if (!insurances.has(name)) em.create(Insurance, { name });

  const brands = new Map((await em.find(Brand, {})).map(b => [b.name, b]));
  const brand = (name: string) => brands.get(name) ?? brands.set(name, em.create(Brand, { name })).get(name)!;

  if (!(await em.count(Model, {}))) {
    const jsonPath = path.resolve(process.cwd(), 'vehiculos.json');
    if (!fs.existsSync(jsonPath)) throw new Error(`vehiculos.json no encontrado en: ${jsonPath}`);
    const data: VehiculoMarca[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    let total = 0;
    for (const item of data) {
      for (const mod of item.modelos) {
        em.create(Model, { name: mod.nombre, brand: brand(item.marca), vehicleType: typeOf(categorizeVehicleType(mod.tipoOriginal)) });
        total++;
      }
    }
    console.log(`  → ${data.length} marcas y ${total} modelos cargados desde vehiculos.json.`);
  }

  if (!(await em.count(Model, { vehicleType: { name: 'MOTO' } }))) {
    for (const [b, models] of MOTOS) for (const name of models) em.create(Model, { name, brand: brand(b), vehicleType: typeOf('MOTO') });
    console.log(`  → ${MOTOS.reduce((a, [, m]) => a + m.length, 0)} modelos de moto.`);
  }
};
