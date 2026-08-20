import { EntityManager } from '@mikro-orm/core';
import fs from 'fs';
import path from 'path';
import { VehicleType } from '../../Vehicle/VehicleType/VehicleType.Entity.js';
import { Insurance } from '../../Vehicle/Insurance/Insurance.Entity.js';
import { Brand } from '../../Vehicle/Brand/Brand.Entity.js';
import { Model } from '../../Vehicle/Model/Model.Entity.js';
import { User } from '../../User/User.Entity.js';

export const seedDatabase = async (em: EntityManager) => {
  console.log('Iniciando seeding de un usuario de prueba');
  const userExists = await em.findOne(User, { id: "550e8400-e29b-41d4-a716-446655440000" });
  
  if (!userExists) {
    em.create (User, {
      id: "550e8400-e29b-41d4-a716-446655440000",
      dni: 12345678,
      name: "Juan",
      last_name: "Pérez",
      date_of_birth: new Date("1990-01-01"),
      email: "juanperez@hotmail.com",
      phone: "1234567890",
      password: "password123",
      file: "client",
    });
  await em.flush()
  console.log('Usuario de prueba cargado');
  }

  const count = await em.count(VehicleType, {});
  if (count > 0) {
    console.log('Omitiendo seeding de vehiculos');
    return;
  }

  console.log('Iniciando seeding de Marcas, Modelos, Tipos de Vehículos y Aseguradoras');

  const tipoAuto = em.create(VehicleType, { name: 'Auto' });
  const tipoMoto = em.create(VehicleType, { name: 'Moto' });
  const tipoUtilitario = em.create(VehicleType, { name: 'Utilitario' });

  const aseguradoras = [
    'La Caja', 
    'San Cristóbal', 
    'Sancor Seguros', 
    'Federación Patronal',
  ];
  
  for (const name of aseguradoras) {
    em.create(Insurance, { name });
  }

  const jsonPath = path.resolve(process.cwd(), 'vehiculos.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const vehiculosData = JSON.parse(rawData);

  console.log(`Cargando ${vehiculosData.length} marcas a la base de datos`);

  for (const item of vehiculosData) {
    const marca = em.create(Brand, { name: item.marca });

    for (const mod of item.modelos) {
      let tipoAsignado = tipoAuto; 
      const tipoOriginal = mod.tipoOriginal?.toUpperCase() ?? '';

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