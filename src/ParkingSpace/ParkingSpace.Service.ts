import { AppError } from '../Shared/utils/AppError.js';
import { categorizeVehicleType, matchesVehicleType } from '../Shared/utils/vehicleTypes.js';
import { ParkingSpaceRepository, capacityField, type Relocation } from "./ParkingSpace.Repository.js";
import { ParkingSpace, SpaceState } from "./ParkingSpace.Entity.js";
import { ParkingRepository } from "../Parking/Parking.Repository.js";

export class ParkingSpaceService {
  constructor(
    private spaceRepo: ParkingSpaceRepository,
    private parkingRepo: ParkingRepository
  ) {}

  async findByParking(parkingId: string): Promise<ParkingSpace[]> {
    return await this.spaceRepo.findByParking(parkingId);
  }

  async findAvailable(parkingId: string, vehicleType?: string): Promise<ParkingSpace[]> {
    return await this.spaceRepo.findAvailableByParking(parkingId, vehicleType);
  }

  async findOne(id: string): Promise<ParkingSpace | null> {
    return await this.spaceRepo.findOne({ id });
  }

  async create(parkingId: string, data: { spaceCode: string; vehicleType: string }): Promise<ParkingSpace> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);

    const space = await this.spaceRepo.add({
      ...data,
      state: SpaceState.LIBRE,
      parking,
    });
    await this.adjustCapacity(parkingId, data.vehicleType, 1);
    return space;
  }

  async createBulkManual(
    parkingId: string, 
    data: { vehicleType: string; count: number }
  ): Promise<void> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);

    const existingSpaces = await this.spaceRepo.findByParking(parkingId);
    const category = categorizeVehicleType(data.vehicleType);
    const prefix = category.charAt(0);

    let maxNumber = 0;
    for (const s of existingSpaces) {
      if (s.spaceCode && s.spaceCode.startsWith(`${prefix}-`)) {
        const num = parseInt(s.spaceCode.slice(prefix.length + 1), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    const startNumber = maxNumber + 1;

    const spacesToCreate: Partial<ParkingSpace>[] = [];
    for (let i = 0; i < data.count; i++) {
      spacesToCreate.push({
        spaceCode: `${prefix}-${String(startNumber + i).padStart(2, '0')}`,
        vehicleType: data.vehicleType,
        state: SpaceState.LIBRE,
        parking,
      });
    }

    await this.spaceRepo.createBulk(spacesToCreate);
    await this.adjustCapacity(parkingId, data.vehicleType, data.count);
  }

  // La capacidad de la sucursal (carCapacity, etc.) acompaña a la cantidad de plazas al agregar o dar de baja.
  private async adjustCapacity(parkingId: string, vehicleType: string, delta: number): Promise<void> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) return;
    const field = capacityField(vehicleType);
    await this.parkingRepo.update(parkingId, { [field]: Math.max(0, Number(parking[field] ?? 0) + delta) });
  }

  // Pasar a mantenimiento saca la plaza de servicio (R-18/R-19: reubica sus reservas futuras si se confirma).
  async update(id: string, data: Partial<ParkingSpace> & { relocate?: boolean }): Promise<{ space: ParkingSpace | null; moved: Relocation[] }> {
    const { relocate, ...changes } = data;
    if (changes.state === SpaceState.MANTENIMIENTO) {
      return await this.spaceRepo.takeOutOfService(id, 'MANTENIMIENTO', !!relocate);
    }
    return { space: await this.spaceRepo.update(id, changes), moved: [] };
  }

  async remove(id: string, relocate = false): Promise<{ moved: Relocation[] }> {
    const { moved } = await this.spaceRepo.takeOutOfService(id, 'BAJA', relocate);
    return { moved };
  }

  async checkAvailability(parkingId: string, vehicleType: string, startTime: Date, endTime: Date): Promise<(Omit<ParkingSpace, 'normalizeVehicleType'> & { available: boolean })[]> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);
    // Misma regla que al reservar: una plaza ocupada ahora puede estar libre en el horario pedido.
    const free = new Set((await this.spaceRepo.freeSpaces(parking, vehicleType, startTime, endTime)).map((s) => s.id));
    const spacesOfSameType = (await this.spaceRepo.findByParking(parkingId)).filter((s) => matchesVehicleType(s.vehicleType, vehicleType));
    return spacesOfSameType.map((space) => ({ ...space, available: free.has(space.id) }));
  }

}