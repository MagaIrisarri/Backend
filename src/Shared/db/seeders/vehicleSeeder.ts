import { EntityManager } from '@mikro-orm/core';
import fs from 'fs';
import path from 'path';
import { VehicleType } from '../../../Vehicle/VehicleType/VehicleType.Entity.js';
import { Insurance } from '../../../Vehicle/Insurance/Insurance.Entity.js';
import { Brand } from '../../../Vehicle/Brand/Brand.Entity.js';
import { Model } from '../../../Vehicle/Model/Model.Entity.js';
import { categorizeVehicleType, VehicleCategory } from '../../utils/vehicleTypes.js';

interface VehiculoModelo { nombre: string; tipoOriginal?: string; }
interface VehiculoMarca  { marca: string; modelos: VehiculoModelo[]; }

export const seedVehicles = async (em: EntityManager): Promise<void> => {
  // 1. Tipos canónicos
  const tipoAuto      = em.create(VehicleType, { name: 'AUTO' });
  const tipoMoto      = em.create(VehicleType, { name: 'MOTO' });
  const tipoCamioneta = em.create(VehicleType, { name: 'CAMIONETA' });

  const tipoByCategory: Record<VehicleCategory, VehicleType> = {
    AUTO:      tipoAuto,
    MOTO:      tipoMoto,
    CAMIONETA: tipoCamioneta,
  };

  // 2. Aseguradoras
  const insuranceNames = ['La Caja Seguros', 'San Cristóbal', 'Sancor Seguros', 'Federación Patronal', 'Zurich Seguros'];
  insuranceNames.forEach((name) => em.create(Insurance, { name }));

  // 3. Lectura del JSON
  const jsonPath = path.resolve(process.cwd(), 'vehiculos.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`vehiculos.json no encontrado en: ${jsonPath}`);
  }

  const vehiculosData: VehiculoMarca[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const brandsMap = new Map<string, Brand>();
  let totalModelos = 0;

  for (const item of vehiculosData) {
    let brand = brandsMap.get(item.marca);
    if (!brand) {
      brand = em.create(Brand, { name: item.marca });
      brandsMap.set(item.marca, brand);
    }

    for (const mod of item.modelos) {
      const category    = categorizeVehicleType(mod.tipoOriginal);
      const vehicleType = tipoByCategory[category];

      em.create(Model, { name: mod.nombre, brand, vehicleType });
      totalModelos++;
    }
  }

  console.log(`  → ${brandsMap.size} marcas y ${totalModelos} modelos cargados exitosamente desde el JSON.`);
};
