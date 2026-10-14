import { AppError } from '../Shared/utils/AppError.js';
import { spacePrefix } from '../Shared/utils/vehicleTypes.js';
import { ParkingSpaceRepository, type Relocation } from "./ParkingSpace.Repository.js";
import { ParkingSpace, SpaceState } from "./ParkingSpace.Entity.js";
import { ParkingRepository } from "../Parking/Parking.Repository.js";
import { VehicleType } from "../Vehicle/VehicleType/VehicleType.Entity.js";

export class ParkingSpaceService {
  constructor(
    private spaceRepo: ParkingSpaceRepository,
    private parkingRepo: ParkingRepository
  ) {}

  async findByParking(parkingId: string): Promise<ParkingSpace[]> {
    return await this.spaceRepo.findByParking(parkingId);
  }

  async findOne(id: string): Promise<ParkingSpace | null> {
    return await this.spaceRepo.findOne({ id });
  }

  // R-30: una plaza admite un tipo de vehículo activo del catálogo del administrador.
  private async vehicleType(id: string): Promise<VehicleType> {
    const type = await this.spaceRepo.findVehicleType(id);
    if (!type) throw new AppError("Tipo de vehículo no encontrado o dado de baja", 404);
    return type;
  }

  async create(parkingId: string, data: { spaceCode: string; vehicleTypeId: string }): Promise<ParkingSpace> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);

    return await this.spaceRepo.add({
      spaceCode: data.spaceCode,
      vehicleType: await this.vehicleType(data.vehicleTypeId),
      state: SpaceState.LIBRE,
      parking,
    });
  }

  // Plazas en lote con código correlativo por tipo (A-01, M-01, UTI-01…), a continuación del último usado.
  // La capacidad del tipo es la cantidad de plazas activas (R-30), así que no hay nada más que ajustar.
  async createBulkManual(
    parkingId: string,
    data: { vehicleTypeId: string; count: number }
  ): Promise<void> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);
    const vehicleType = await this.vehicleType(data.vehicleTypeId);

    const existingSpaces = await this.spaceRepo.findByParking(parkingId);
    const prefix = spacePrefix(vehicleType.name);

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
        vehicleType,
        state: SpaceState.LIBRE,
        parking,
      });
    }

    await this.spaceRepo.createBulk(spacesToCreate);
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

  async checkAvailability(parkingId: string, vehicleTypeId: string, startTime: Date, endTime: Date): Promise<(ParkingSpace & { available: boolean })[]> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);
    // Misma regla que al reservar: una plaza ocupada ahora puede estar libre en el horario pedido.
    const free = new Set((await this.spaceRepo.freeSpaces(parking, vehicleTypeId, startTime, endTime)).map((s) => s.id));
    const spacesOfSameType = (await this.spaceRepo.findByParking(parkingId)).filter((s) => s.vehicleType.id === vehicleTypeId);
    return spacesOfSameType.map((space) => ({ ...space, available: free.has(space.id) }));
  }

}
