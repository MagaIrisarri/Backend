import { Parking } from "./Parking.Entity.js";
import { EntityManager } from "@mikro-orm/core"; 
import { CreateParkingDto, 
  ParkingIdDto, 
  UpdateParkingDto } from "./ParkingDto.js";

export class ParkingService {
  private readonly em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  async createParking(data: CreateParkingDto): Promise<Parking> {
    const newParking = this.em.create(Parking, data);

    this.em.persist(newParking);
    await this.em.flush();
    
    return newParking;
  }

  async findAllParking(): Promise<Parking[]> {
    return this.em.findAll(Parking);
  }

  async findParkingById(id: ParkingIdDto): Promise<Parking | null> {
    return this.em.findOne(Parking, id);
  }

  async updateParking(
    id: ParkingIdDto, 
    data: UpdateParkingDto
  ): Promise<Parking | null> {

    const updatedParking = await this.em.findOne(Parking, id);

    if(!updatedParking) {
      return null;
    } 

    this.em.assign(updatedParking, data);
    await this.em.flush();
    
    return updatedParking;
  }

  async deleteParking(id: ParkingIdDto): Promise<boolean> {
    const deletedParking = await this.em.findOne(Parking, id);
    
    if (!deletedParking) {
      return false;  
    }
    
    this.em.remove(deletedParking);
    await this.em.flush()
    
    return true;
  }
}