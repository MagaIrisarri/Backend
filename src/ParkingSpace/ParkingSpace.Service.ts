import { EntityManager } from "@mikro-orm/core";

import { CreateParkingSpaceDto } from "./ParkingSpace.Dto.js";
import { ParkingIdDto } from "../Parking/Parking.Dto.js";

import { ParkingSpace } from "./ParkingSpace.Entity.js";
import { Parking } from "../Parking/Parking.Entity.js";

export class ParkingSpaceService {

  private readonly em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  async createParkingSpace(
    parkingId: ParkingIdDto,
    data: CreateParkingSpaceDto
  ): Promise <ParkingSpace> {

    const parking = await this.em.findOne(Parking, {
      id: parkingId.id
    });

    if (!parking) {
      throw new Error('Parking not found');
    }

    const spacesCount = await this.em.count(ParkingSpace, {
      parking,
      vehicleType: data.vehicleType
    });

    if (
      data.vehicleType === 'AUTO' &&
      spacesCount >= parking.carCapacity 
    ) {
      throw new Error('Maximun car capacity reached');
    }

    if (
      data.vehicleType === 'MOTOCICLETA' &&
      spacesCount >= parking.motorcycleCapacity
    ) {
      throw new Error('Maximun motorcycle capacity reached');
    }

    const prefix = data.vehicleType === 'AUTO' ? 'A' : 'M';

    let number = 1;
    let spaceCode = `${prefix}-${String(number).padStart(2, '0')}`;

    while (
      await this.em.findOne(ParkingSpace, {
        parking,
        spaceCode
      })
    
    ) {
      number++;
      spaceCode = `${prefix}-${String(number).padStart(2, '0')}`;
    }

    const newParkingSpace = this.em.create(ParkingSpace, {
      spaceCode,
      state: 'LIBRE',
      vehicleType: data.vehicleType ,
      parking
    });

    this.em.persist(newParkingSpace);
    await this.em.flush();

    return newParkingSpace;
  }

  async findSpacesByParking(
    parkingId: ParkingIdDto
  ): Promise<ParkingSpace[]> {

    const parking = await this.em.findOne(Parking, {
      id: parkingId.id
    });

    if (!parking) {
      throw new Error('Parking not found');
    }

    return this.em.find(ParkingSpace, {
      parking
    });
  }

  async findAvailableSpaces(
    parkingId: ParkingIdDto
  ): Promise<ParkingSpace[]> {

    const parking = await this.em.findOne(Parking, {
      id: parkingId.id
    });

    if (!parking) {
      throw new Error('Parking not found');
    }

    return this.em.find(ParkingSpace, {
      parking,
      state: 'LIBRE'
    })
  }

  async findAvailableSpacesByVehicleType(
    parkingId: ParkingIdDto,
    vehicleType: string
  ): Promise<ParkingSpace[]> {

    const parking = await this.em.findOne(Parking, {
      id: parkingId.id
    });

    if (!parking) {
      throw new Error('Parking not found');
    }

    return this.em.find(ParkingSpace, {
      parking,
      state: 'LIBRE',
      vehicleType
    });
  }

}