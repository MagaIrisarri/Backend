import { ParkingPriceRepository } from './ParkingPrice.Repository.js';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingPriceService {
  constructor(private repo: ParkingPriceRepository) {}

  // R-30: una tarifa por tipo de vehículo; la nueva vence la vigente de ese tipo (precios versionados).
  async create(parkingId: string, data: { vehicleTypeId: string; price: number }): Promise<ParkingPrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new AppError('Estacionamiento no encontrado', 404);

    const vehicleType = await this.repo.findVehicleType(data.vehicleTypeId);
    if (!vehicleType) throw new AppError('Tipo de vehículo no encontrado o dado de baja', 404);

    return await this.repo.lockedFor(parkingId, async (repo, locked) => {
      // El mismo precio que la vigente no abre otra versión: el historial solo guarda cambios.
      const active = await repo.findActive(parkingId, vehicleType.id);
      if (active && Number(active.price) === data.price) return active;

      await repo.expireActiveByVehicleType(parkingId, vehicleType.id);
      return await repo.add({ parking: locked, vehicleType: await repo.findVehicleType(vehicleType.id), price: data.price });
    });
  }

  // Modificar una tarifa vence la vigente y crea una versión nueva (fecha de vigencia): el historial no se pisa.
  // Cada PUT devuelve otro id; un id ya vencido sigue sirviendo y cambia la vigente de su tipo en esa cochera.
  async update(id: string, data: { price: number }): Promise<ParkingPrice> {
    const current = await this.repo.findOne({ id });
    if (!current) throw new AppError('Tarifa no encontrada', 404);
    return await this.create(current.parking.id, { vehicleTypeId: current.vehicleType.id, price: data.price });
  }

  async findOne(id: string): Promise<ParkingPrice | null> {
    return await this.repo.findOne({ id });
  }

  // Sin ninguna tarifa vigente, la sucursal sale del mapa y rechaza reservas aunque siga activa: la última no se da de baja.
  async remove(id: string): Promise<boolean> {
    const price = await this.repo.findOne({ id });
    if (!price || price.expirationDate !== null) return false;
    return await this.repo.lockedFor(price.parking.id, async (repo, parking) => {
      const active = await repo.findByParking(parking.id);
      if (parking.isActive && active.length === 1 && active[0].id === id) {
        throw new AppError('Es la última tarifa de la sucursal: sin tarifas sale del mapa y no acepta reservas. Cargá otra antes o pausá la sucursal.', 409);
      }
      return await repo.remove({ id });
    });
  }

  async findByParking(parkingId: string): Promise<ParkingPrice[]> {
    return await this.repo.findByParking(parkingId);
  }

  async findActive(parkingId: string, vehicleTypeId: string): Promise<ParkingPrice | null> {
    return await this.repo.findActive(parkingId, vehicleTypeId);
  }
}
