import { EntityManager } from '@mikro-orm/core';
import fs from 'fs';
import path from 'path';
import { VehicleType } from '../../Vehicle/VehicleType/VehicleType.Entity.js';
import { Insurance } from '../../Vehicle/Insurance/Insurance.Entity.js';
import { Brand } from '../../Vehicle/Brand/Brand.Entity.js';
import { Model } from '../../Vehicle/Model/Model.Entity.js';

export const seedDatabase = async (em: EntityManager) => {
  const count = await em.count(VehicleType, {});
  if (count > 0) {
    console.log('Omitiendo seeding...');
    return;
  }

  console.log('Iniciando seeding...');

  // 1. Crear Tipos de Vehículo
  const tipoAuto = em.create(VehicleType, { name: 'Auto' });
  const tipoMoto = em.create(VehicleType, { name: 'Moto' });
  const tipoUtilitario = em.create(VehicleType, { name: 'Utilitario' });

  // 2. Crear Seguros
  const aseguradoras = [
    'La Caja', 
    'San Cristóbal', 
    'Sancor Seguros', 
    'Federación Patronal',
  ];
  
  for (const name of aseguradoras) {
    em.create(Insurance, { name });
  }

  // 3. Leer el archivo JSON (process.cwd() busca en la raíz de tu proyecto)
  const jsonPath = path.resolve(process.cwd(), 'vehiculos.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const vehiculosData = JSON.parse(rawData);

  console.log(`⏳ Cargando ${vehiculosData.length} marcas a la base de datos... Esto puede tardar unos segundos.`);

  
  for (const item of vehiculosData) {
    
    const marca = em.create(Brand, { name: item.marca });

    
    for (const mod of item.modelos) {
      let tipoAsignado = tipoAuto; // Por defecto es Auto
      const tipoOriginal = mod.tipoOriginal.toUpperCase();

      // Clasificador automático según el texto de la DNRPA
      if (
        tipoOriginal.includes('PICK-UP') || 
        tipoOriginal.includes('FURGON') || 
        tipoOriginal.includes('CAMION') || 
        tipoOriginal.includes('ACOPLADO') || 
        tipoOriginal.includes('CHASIS') ||
        tipoOriginal.includes('UTILITARIO')
      ) {
        tipoAsignado = tipoUtilitario;
      } else if (tipoOriginal.includes('MOTO')) {
        tipoAsignado = tipoMoto;
      }

      // Creamos el modelo y lo vinculamos a su marca y tipo
      em.create(Model, { 
        name: mod.nombre, 
        brand: marca, 
        vehicleType: tipoAsignado 
      });
    }
  }

  
  await em.flush();
  
  console.log('Parque Automotor Cargado');
};