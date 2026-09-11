import { ParkingPriceRepository } from './ParkingPrice.Repository.js';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingPriceService {
  constructor(private repo: ParkingPriceRepository) {}

  async create(parkingId: string, data: { vehicleType: string; price: number }): Promise<ParkingPrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new AppError('Estacionamiento no encontrado', 404);

    const officialType = await this.repo.findOfficialVehicleType(data.vehicleType);
    if (!officialType) {
      throw new AppError(
        `El tipo de vehículo "${data.vehicleType}" no es válido. Debe ser uno de los tipos oficiales registrados por el administrador.`,
        400
      );
    }

    // Expirar cualquier tarifa activa previa de este tipo oficial
    await this.repo.expireActiveByVehicleType(parkingId, officialType.name);

    return await this.repo.add({ 
      parking, 
      vehicleType: officialType.name, 
      price: data.price 
    });
  }

  async update(id: string, data: { price: number; vehicleType?: string }): Promise<ParkingPrice> {
    const price = await this.repo.findOne({ id });
    if (!price || price.expirationDate !== null) {
      throw new AppError('Tarifa no encontrada o inactiva', 404);
    }

    let officialName: string | undefined;
    if (data.vehicleType) {
      const officialType = await this.repo.findOfficialVehicleType(data.vehicleType);
      if (!officialType) {
        throw new AppError(
          `El tipo de vehículo "${data.vehicleType}" no es válido. Debe ser uno de los tipos oficiales registrados por el administrador.`,
          400
        );
      }
      officialName = officialType.name;
    }

    const updated = await this.repo.update(id, {
      price: data.price,
      ...(officialName ? { vehicleType: officialName } : {}),
    });

    if (!updated) throw new AppError('No se pudo actualizar la tarifa', 400);
    return updated;
  }

  async findOne(id: string): Promise<ParkingPrice | null> {
    return await this.repo.findOne({ id });
  }

  async remove(id: string): Promise<boolean> {
    return await this.repo.remove({ id });
  }

  async findByParking(parkingId: string): Promise<ParkingPrice[]> {
    return await this.repo.findByParking(parkingId);
  }

  async findActive(parkingId: string, vehicleType: string): Promise<ParkingPrice | null> {
    return await this.repo.findActive(parkingId, vehicleType);
  }
}