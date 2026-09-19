import { EntityManager } from '@mikro-orm/core';
import { Parking } from '../../../Parking/Parking.Entity.js';
import { ParkingPrice } from '../../../ParkingPrice/ParkingPrice.Entity.js';
import { ParkingSpace, SpaceState } from '../../../ParkingSpace/ParkingSpace.Entity.js';
import { User } from '../../../User/User.Entity.js';

interface ParkingData {
  name:                string;
  address:             string;
  locality:            string;
  postalCode:          string;
  latitude:            number;
  longitude:           number;
  openingTime:         string;
  closingTime:         string;
  minReservationHours: number;
  maxReservationHours: number;
  reservationMargin:   number;
  carCapacity:         number;
  motorcycleCapacity:  number;
  truckCapacity:       number;
  owner:               User;
  imageUrl:            string;
  priceAuto:           number;
  priceMoto:           number;
  priceCamioneta:      number;
}

const PARKINGS_DATA = (owner1: User, owner2: User): ParkingData[] => [
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
    priceCamioneta: 2600,
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
    priceCamioneta: 2800,
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
    priceCamioneta: 3000,
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
    priceCamioneta: 2700,
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
    priceCamioneta: 3500,
  },
];

export const seedParkings = async (em: EntityManager, owner1: User, owner2: User): Promise<void> => {
  for (const pData of PARKINGS_DATA(owner1, owner2)) {
    const parking = em.create(Parking, {
      name:                pData.name,
      address:             pData.address,
      locality:            pData.locality,
      postalCode:          pData.postalCode,
      latitude:            pData.latitude,
      longitude:           pData.longitude,
      openingTime:         pData.openingTime,
      closingTime:         pData.closingTime,
      minReservationHours: pData.minReservationHours,
      maxReservationHours: pData.maxReservationHours,
      reservationMargin:   pData.reservationMargin,
      carCapacity:         pData.carCapacity,
      motorcycleCapacity:  pData.motorcycleCapacity,
      truckCapacity:       pData.truckCapacity,
      owner:               pData.owner,
      imageUrl:            pData.imageUrl,
      isActive:            true,
    });

    em.create(ParkingPrice, { parking, vehicleType: 'AUTO',      price: pData.priceAuto });
    em.create(ParkingPrice, { parking, vehicleType: 'MOTO',      price: pData.priceMoto });
    em.create(ParkingPrice, { parking, vehicleType: 'CAMIONETA', price: pData.priceCamioneta });

    for (let i = 1; i <= Math.min(pData.carCapacity, 8); i++) {
      em.create(ParkingSpace, {
        parking,
        spaceCode:   `A-${String(i).padStart(2, '0')}`,
        vehicleType: 'AUTO',
        state:       i === 1 ? SpaceState.OCUPADO : SpaceState.LIBRE,
        isActive:    true,
      });
    }

    for (let i = 1; i <= Math.min(pData.motorcycleCapacity, 4); i++) {
      em.create(ParkingSpace, {
        parking,
        spaceCode:   `M-${String(i).padStart(2, '0')}`,
        vehicleType: 'MOTO',
        state:       SpaceState.LIBRE,
        isActive:    true,
      });
    }

    for (let i = 1; i <= Math.min(pData.truckCapacity, 2); i++) {
      em.create(ParkingSpace, {
        parking,
        spaceCode:   `C-${String(i).padStart(2, '0')}`,
        vehicleType: 'CAMIONETA',
        state:       SpaceState.LIBRE,
        isActive:    true,
      });
    }
  }
};
