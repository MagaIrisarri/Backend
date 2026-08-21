import { EntityManager } from "@mikro-orm/core";
import { ParkingPrice } from "./ParkingPrice.Entity.js";
import { Parking } from "../Parking/Parking.Entity.js";
import { CreateParkingPriceDto, ParkingPriceIdDto } from "./ParkingPrice.Dto.js";
import { ParkingIdDto } from "../Parking/Parking.Dto.js";

export class ParkingPriceService {
  private readonly em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  async createParkingPrice(
    parkingId: ParkingIdDto,
    data: CreateParkingPriceDto
  ): Promise<ParkingPrice> {

    const parking = await this.em.findOne(Parking, {
      id: parkingId.id
    });

    if (!parking) {
      throw new Error('Parking not found');
    }

    const currentPrice = await this.em.findOne(ParkingPrice, {
      parking,
      vehicleType: data.vehicleType,
      expirationDate: null
    });

    if (currentPrice) {
      currentPrice.expirationDate = new Date();
    }

    const newParkingPrice = this.em.create(ParkingPrice, {
      ...data,
      parking,
      expirationDate: null
    });

    this.em.persist(newParkingPrice);
    await this.em.flush();

    return newParkingPrice;
  }

  async findPricesByParking(
    parkingId: ParkingIdDto
  ): Promise<ParkingPrice[]> {

    const parking = await this.em.findOne(Parking, {
      id: parkingId.id
    });

    if (!parking) {
      throw new Error('Parking not found');
    }

    return this.em.find(ParkingPrice, {
      parking
    });
  }

  async findPrice(
    priceId: ParkingPriceIdDto
  ): Promise<ParkingPrice | null> {

    return this.em.findOne(ParkingPrice, {
      id: priceId.id
    });
  }

  async findActivePrice(
    parkingId: ParkingIdDto,
    vehicleType: string
  ): Promise<ParkingPrice | null> {

    const parking = await this.em.findOne(Parking, {
      id: parkingId.id
    });
    
    if (!parking) {
      throw new Error('Parking not found');
    }

    return this.em.findOne(ParkingPrice, {
      parking,
      vehicleType,
      expirationDate: null
    });
  }
  
}
