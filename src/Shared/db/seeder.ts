import { EntityManager } from '@mikro-orm/core';
import fs from 'fs';
import path from 'path';
import { VehicleType } from '../../Vehicle/VehicleType/VehicleType.Entity.js';
import { Insurance } from '../../Vehicle/Insurance/Insurance.Entity.js';
import { Brand } from '../../Vehicle/Brand/Brand.Entity.js';
import { Model } from '../../Vehicle/Model/Model.Entity.js';
import { User } from '../../User/User.Entity.js';

export const seedDatabase = async (em: EntityManager) => {
  const count = await em.count(VehicleType, {});
  if (count > 0) {
    console.log('Omitiendo seeding: datos ya existentes.');
    return;
  }

  console.log('Iniciando seeding general...');

  await em.transactional(async (forkEm) => {
    // 1. Usuario de prueba
/*    const userExists = await forkEm.findOne(User, { id: '550e8400-e29b-41d4-a716-446655440000' });
    if (!userExists) {
      forkEm.create(User, {
        id: '550e8400-e29b-41d4-a716-446655440000',
        dni: 12345678,
        name: 'Juan',
        last_name: 'Pérez',
        date_of_birth: new Date('1990-01-01'),
        email: 'juanperez@hotmail.com',
        phone: '1234567890',
        password: 'password123',
        file: 'client',
      });
    }
*/
    // 2. Tipos de vehículos
    const tipoAuto = forkEm.create(VehicleType, { name: 'Auto' });
    const tipoMoto = forkEm.create(VehicleType, { name: 'Moto' });
    const tipoUtilitario = forkEm.create(VehicleType, { name: 'Utilitario' });

    // 3. Aseguradoras
    const aseguradoras = ['La Caja', 'San Cristóbal', 'Sancor Seguros', 'Federación Patronal'];
    for (const name of aseguradoras) {
      forkEm.create(Insurance, { name });
    }

    // 4. Marcas y Modelos desde JSON
    const jsonPath = path.resolve(process.cwd(), 'vehiculos.json');
    if (fs.existsSync(jsonPath)) {
      const rawData = fs.readFileSync(jsonPath, 'utf-8');
      const vehiculosData = JSON.parse(rawData);

      for (const item of vehiculosData) {
        const marca = forkEm.create(Brand, { name: item.marca });

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

          forkEm.create(Model, {
            name: mod.nombre,
            brand: marca,
            vehicleType: tipoAsignado,
          });
        }
      }
    }

    await forkEm.flush();
    console.log('Seeding completado con éxito.');
  });
};