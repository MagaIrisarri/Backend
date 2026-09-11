import { EntityManager } from '@mikro-orm/core';
import fs from 'fs';
import path from 'path';
import argon2 from 'argon2';
import { VehicleType } from '../../Vehicle/VehicleType/VehicleType.Entity.js';
import { Insurance } from '../../Vehicle/Insurance/Insurance.Entity.js';
import { Brand } from '../../Vehicle/Brand/Brand.Entity.js';
import { Model } from '../../Vehicle/Model/Model.Entity.js';
import { User } from '../../User/User.Entity.js';
import { Parking } from '../../Parking/Parking.Entity.js';
import { ParkingPrice } from '../../ParkingPrice/ParkingPrice.Entity.js';
import { ParkingSpace, SpaceState } from '../../ParkingSpace/ParkingSpace.Entity.js';
import { Vehicle } from '../../Vehicle/Vehicle.Entity.js';
import { Reservation } from '../../Reservation/Reservation.Entity.js';

export const seedDatabaseAdmi = async (em: EntityManager) => {
  // Legacy / backup admin seeder
};

export const seedDatabase = async (em: EntityManager) => {
  const usersCount = await em.count(User, {});
  if (usersCount > 0) {
    console.log('Omitiendo seeding: ya existen datos en la base de datos.');
    return;
  }

  console.log('Iniciando seeding general con datos de prueba...');

  await em.transactional(async (forkEm) => {
    const defaultPassword = await argon2.hash('password123');

    // =========================================================================
    // 1. USUARIOS (Admin, Dueños, Empleados, Clientes)
    // =========================================================================
    // Administrador Global
    const adminUser = forkEm.create(User, {
      dni: '30111222',
      name: 'Administrador',
      last_name: 'Sistema',
      date_of_birth: new Date('1985-05-15'),
      email: 'admin@cocheras.com',
      phone: '1140001111',
      password: defaultPassword,
      type: 'ADMINISTRADOR',
      status: 'ACTIVO',
    });

    // Dueño 1
    const owner1 = forkEm.create(User, {
      dni: '28999888',
      name: 'Carlos',
      last_name: 'Gardel',
      date_of_birth: new Date('1980-03-20'),
      email: 'dueno1@cocheras.com',
      phone: '3415001122',
      password: defaultPassword,
      type: 'DUEÑO',
      status: 'ACTIVO',
    });

    // Dueño 2
    const owner2 = forkEm.create(User, {
      dni: '27888777',
      name: 'Roberto',
      last_name: 'Arlt',
      date_of_birth: new Date('1982-07-10'),
      email: 'dueno2@cocheras.com',
      phone: '3415003344',
      password: defaultPassword,
      type: 'DUEÑO',
      status: 'ACTIVO',
    });

    // Empleado asignado a Dueño 1
    forkEm.create(User, {
      dni: '35111333',
      name: 'Lucas',
      last_name: 'Operador',
      date_of_birth: new Date('1995-11-25'),
      email: 'empleado1@cocheras.com',
      phone: '3416005566',
      password: defaultPassword,
      type: 'EMPLEADO',
      status: 'ACTIVO',
      ownerId: owner1.id,
    });

    // Cliente 1
    const client1 = forkEm.create(User, {
      dni: '38444555',
      name: 'Mariano',
      last_name: 'Moreno',
      date_of_birth: new Date('1992-09-08'),
      email: 'cliente1@cocheras.com',
      phone: '3416007788',
      password: defaultPassword,
      type: 'CLIENTE',
      status: 'ACTIVO',
    });

    // Cliente 2
    const client2 = forkEm.create(User, {
      dni: '39555666',
      name: 'Sofia',
      last_name: 'Belgrano',
      date_of_birth: new Date('1994-12-03'),
      email: 'cliente2@cocheras.com',
      phone: '3416009900',
      password: defaultPassword,
      type: 'CLIENTE',
      status: 'ACTIVO',
    });

    // =========================================================================
    // 2. CATÁLOGOS DE VEHÍCULOS (Tipos, Aseguradoras, Marcas y Modelos)
    // =========================================================================
    const tipoAuto = forkEm.create(VehicleType, { name: 'Auto' });
    const tipoMoto = forkEm.create(VehicleType, { name: 'Moto' });
    const tipoUtilitario = forkEm.create(VehicleType, { name: 'Utilitario' });

    const aseguradoras = [
      'La Caja Seguros',
      'San Cristóbal',
      'Sancor Seguros',
      'Federación Patronal',
      'Zurich Seguros',
    ];
    const insuranceEntities: Insurance[] = [];
    for (const name of aseguradoras) {
      insuranceEntities.push(forkEm.create(Insurance, { name }));
    }

    // Cargar marcas y modelos
    let brandFiat: Brand | null = null;
    let modelCronos: Model | null = null;
    let brandHonda: Brand | null = null;
    let modelWave: Model | null = null;
    let brandToyota: Brand | null = null;
    let modelHilux: Model | null = null;

    const jsonPath = path.resolve(process.cwd(), 'vehiculos.json');
    if (fs.existsSync(jsonPath)) {
      const rawData = fs.readFileSync(jsonPath, 'utf-8');
      const vehiculosData = JSON.parse(rawData);

      for (const item of vehiculosData) {
        const marca = forkEm.create(Brand, { name: item.marca });

        if (item.marca.toUpperCase() === 'FIAT') brandFiat = marca;
        if (item.marca.toUpperCase() === 'HONDA') brandHonda = marca;
        if (item.marca.toUpperCase() === 'TOYOTA') brandToyota = marca;

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

          const createdModel = forkEm.create(Model, {
            name: mod.nombre,
            brand: marca,
            vehicleType: tipoAsignado,
          });

          if (!modelCronos && (mod.nombre.includes('CRONOS') || mod.nombre.includes('Cronos'))) {
            modelCronos = createdModel;
          }
          if (!modelWave && (mod.nombre.includes('WAVE') || mod.nombre.includes('Wave'))) {
            modelWave = createdModel;
          }
          if (!modelHilux && (mod.nombre.includes('HILUX') || mod.nombre.includes('Hilux'))) {
            modelHilux = createdModel;
          }
        }
      }
    }

    // Fallbacks si no se encontraron en el JSON
    if (!brandFiat) brandFiat = forkEm.create(Brand, { name: 'FIAT' });
    if (!modelCronos) modelCronos = forkEm.create(Model, { name: 'Cronos 1.3 Drive', brand: brandFiat, vehicleType: tipoAuto });

    if (!brandHonda) brandHonda = forkEm.create(Brand, { name: 'HONDA' });
    if (!modelWave) modelWave = forkEm.create(Model, { name: 'Wave 110S', brand: brandHonda, vehicleType: tipoMoto });

    if (!brandToyota) brandToyota = forkEm.create(Brand, { name: 'TOYOTA' });
    if (!modelHilux) modelHilux = forkEm.create(Model, { name: 'Hilux 4x4 DC', brand: brandToyota, vehicleType: tipoUtilitario });

    // =========================================================================
    // 3. VEHÍCULOS DE CLIENTES
    // =========================================================================
    const vehicle1 = forkEm.create(Vehicle, {
      plate: 'AF123CD',
      color: 'Gris Plata',
      year: 2023,
      isActive: true,
      brand: brandFiat,
      model: modelCronos,
      vehicleType: tipoAuto,
      insurance: insuranceEntities[1] || insuranceEntities[0], // San Cristóbal
      client: client1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const vehicle2 = forkEm.create(Vehicle, {
      plate: 'A098BCD',
      color: 'Rojo',
      year: 2022,
      isActive: true,
      brand: brandHonda,
      model: modelWave,
      vehicleType: tipoMoto,
      insurance: insuranceEntities[0], // La Caja
      client: client1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const vehicle3 = forkEm.create(Vehicle, {
      plate: 'AE456GH',
      color: 'Blanco',
      year: 2021,
      isActive: true,
      brand: brandToyota,
      model: modelHilux,
      vehicleType: tipoUtilitario,
      insurance: insuranceEntities[2] || insuranceEntities[0], // Sancor
      client: client2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // =========================================================================
    // 4. ESTACIONAMIENTOS / SUCURSALES (CON COORDENADAS REALES)
    // =========================================================================
    const parkingsData = [
      {
        name: 'Estacionamiento Central Plaza',
        address: 'San Martín 750',
        locality: 'Rosario',
        postalCode: '2000',
        latitude: -32.9472,
        longitude: -60.6385,
        openingTime: '07:00',
        closingTime: '23:00',
        minReservationHours: 1,
        maxReservationHours: 12,
        reservationMargin: 1,
        carCapacity: 20,
        motorcycleCapacity: 10,
        truckCapacity: 5,
        owner: owner1,
        imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
        priceAuto: 1800,
        priceMoto: 900,
        priceUtilitario: 2600,
      },
      {
        name: 'Cochera Peatonal Córdoba',
        address: 'Córdoba 1240',
        locality: 'Rosario',
        postalCode: '2000',
        latitude: -32.9445,
        longitude: -60.6410,
        openingTime: '08:00',
        closingTime: '22:00',
        minReservationHours: 1,
        maxReservationHours: 8,
        reservationMargin: 1,
        carCapacity: 30,
        motorcycleCapacity: 15,
        truckCapacity: 0,
        owner: owner1,
        imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        priceAuto: 2000,
        priceMoto: 1000,
        priceUtilitario: 2800,
      },
      {
        name: 'Parking Monumento',
        address: 'Av. Belgrano 500',
        locality: 'Rosario',
        postalCode: '2000',
        latitude: -32.9490,
        longitude: -60.6310,
        openingTime: '06:00',
        closingTime: '23:59',
        minReservationHours: 1,
        maxReservationHours: 24,
        reservationMargin: 1,
        carCapacity: 40,
        motorcycleCapacity: 20,
        truckCapacity: 10,
        owner: owner1,
        imageUrl: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
        priceAuto: 2200,
        priceMoto: 1100,
        priceUtilitario: 3000,
      },
      {
        name: 'Estacionamiento Paseo del Siglo',
        address: 'Rioja 1820',
        locality: 'Rosario',
        postalCode: '2000',
        latitude: -32.9420,
        longitude: -60.6480,
        openingTime: '08:00',
        closingTime: '21:00',
        minReservationHours: 1,
        maxReservationHours: 10,
        reservationMargin: 1,
        carCapacity: 25,
        motorcycleCapacity: 10,
        truckCapacity: 5,
        owner: owner2,
        imageUrl: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=800&q=80',
        priceAuto: 1900,
        priceMoto: 950,
        priceUtilitario: 2700,
      },
      {
        name: 'Cocheras Puerto Norte',
        address: 'Av. Carballo 150',
        locality: 'Rosario',
        postalCode: '2000',
        latitude: -32.9230,
        longitude: -60.6650,
        openingTime: '00:00',
        closingTime: '23:59',
        minReservationHours: 1,
        maxReservationHours: 48,
        reservationMargin: 2,
        carCapacity: 50,
        motorcycleCapacity: 20,
        truckCapacity: 15,
        owner: owner2,
        imageUrl: 'https://images.unsplash.com/photo-1617886903355-93547526a666?auto=format&fit=crop&w=800&q=80',
        priceAuto: 2500,
        priceMoto: 1200,
        priceUtilitario: 3500,
      },
    ];

    const createdParkings: Parking[] = [];
    const firstParkingSpaces: ParkingSpace[] = [];

    for (const pData of parkingsData) {
      const parking = forkEm.create(Parking, {
        name: pData.name,
        address: pData.address,
        locality: pData.locality,
        postalCode: pData.postalCode,
        latitude: pData.latitude,
        longitude: pData.longitude,
        openingTime: pData.openingTime,
        closingTime: pData.closingTime,
        minReservationHours: pData.minReservationHours,
        maxReservationHours: pData.maxReservationHours,
        reservationMargin: pData.reservationMargin,
        carCapacity: pData.carCapacity,
        motorcycleCapacity: pData.motorcycleCapacity,
        truckCapacity: pData.truckCapacity,
        owner: pData.owner,
        imageUrl: pData.imageUrl,
        isActive: true,
      });

      createdParkings.push(parking);

      // Crear Tarifas activas
      forkEm.create(ParkingPrice, {
        parking,
        vehicleType: 'AUTO',
        price: pData.priceAuto,
      });

      forkEm.create(ParkingPrice, {
        parking,
        vehicleType: 'MOTO',
        price: pData.priceMoto,
      });

      forkEm.create(ParkingPrice, {
        parking,
        vehicleType: 'CAMIONETA',
        price: pData.priceUtilitario,
      });

      // Crear Plazas para cada estacionamiento
      for (let i = 1; i <= Math.min(pData.carCapacity, 8); i++) {
        const code = `A-${i < 10 ? '0' + i : i}`;
        const space = forkEm.create(ParkingSpace, {
          parking,
          spaceCode: code,
          vehicleType: 'AUTO',
          state: i === 1 ? SpaceState.OCUPADO : SpaceState.LIBRE,
          isActive: true,
        });
        if (parking === createdParkings[0]) {
          firstParkingSpaces.push(space);
        }
      }

      for (let i = 1; i <= Math.min(pData.motorcycleCapacity, 4); i++) {
        const code = `M-${i < 10 ? '0' + i : i}`;
        const space = forkEm.create(ParkingSpace, {
          parking,
          spaceCode: code,
          vehicleType: 'MOTO',
          state: SpaceState.LIBRE,
          isActive: true,
        });
        if (parking === createdParkings[0]) {
          firstParkingSpaces.push(space);
        }
      }

      for (let i = 1; i <= Math.min(pData.truckCapacity, 2); i++) {
        const code = `C-${i < 10 ? '0' + i : i}`;
        const space = forkEm.create(ParkingSpace, {
          parking,
          spaceCode: code,
          vehicleType: 'CAMIONETA',
          state: SpaceState.LIBRE,
          isActive: true,
        });
        if (parking === createdParkings[0]) {
          firstParkingSpaces.push(space);
        }
      }
    }

    // =========================================================================
    // 5. RESERVAS DE PRUEBA (PARA LA PLANILLA DEL DUEÑO Y REPORTES)
    // =========================================================================
    if (firstParkingSpaces.length > 0) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(tomorrowStart.getTime() + 3 * 60 * 60 * 1000);

      // Reserva 1: En curso (CONFIRMADA)
      forkEm.create(Reservation, {
        vehicle: vehicle1,
        parkingSpace: firstParkingSpaces[0], // A-01
        startTime: oneHourAgo,
        endTime: twoHoursLater,
        status: 'CONFIRMADA',
      });

      // Reserva 2: Futura (PENDIENTE)
      if (firstParkingSpaces.length > 1) {
        forkEm.create(Reservation, {
          vehicle: vehicle3,
          parkingSpace: firstParkingSpaces[1], // A-02
          startTime: tomorrowStart,
          endTime: tomorrowEnd,
          status: 'PENDIENTE',
        });
      }
    }

    await forkEm.flush();
    console.log('✅ Seeding completado con éxito: Usuarios, Catálogos, Estacionamientos y Reservas listos.');
  });
};