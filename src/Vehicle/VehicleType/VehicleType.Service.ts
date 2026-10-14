import { VehicleTypeRepository } from './VehicleType.Repository.js';
import { VehicleType } from './VehicleType.Entity.js';
import { AppError } from '../../Shared/utils/AppError.js';
import { cleanName, nameKey } from '../../Shared/utils/names.js';
import { VEHICLE_CATEGORIES, categorizeVehicleType } from '../../Shared/utils/vehicleTypes.js';

// AUTO, MOTO y CAMIONETA son la base: el catálogo del DNRPA les asigna los modelos nuevos por nombre (Catalog.Repository),
// así que no se renombran ni se dan de baja. Los demás tipos se cobran y estacionan según su categoría.
const isBase = (t: VehicleType) => (VEHICLE_CATEGORIES as readonly string[]).includes(t.name);

// Lo que devuelve la API: la categoría sale de categorizeVehicleType (una sola fuente), no se repite en el frontend.
const view = (t: VehicleType) => ({ id: t.id, name: t.name, isActive: t.isActive, category: categorizeVehicleType(t.name), isBase: isBase(t) });

const usedBy = ({ models, vehicles }: { models: number; vehicles: number }) =>
  [models && `${models} ${models === 1 ? 'modelo' : 'modelos'}`, vehicles && `${vehicles} ${vehicles === 1 ? 'vehículo' : 'vehículos'}`]
    .filter(Boolean).join(' y ');

export class VehicleTypeService {
  constructor(private readonly repository: VehicleTypeRepository) {}

  async findAll() {
    return (await this.repository.findAll()).map(view);
  }

  async findOne(id: string) {
    const type = await this.repository.findOne({ id });
    return type && view(type);
  }

  async create(data: { name: string }) {
    const name = cleanName(data.name);
    await this.assertUniqueName(name);
    return view(await this.repository.add({ name }));
  }

  async update(id: string, data: { name?: string }) {
    const current = await this.repository.findOne({ id });
    if (!current) return null;
    if (data.name === undefined) return view(current);
    const name = cleanName(data.name);
    this.assertNotBase(current, 'cambiar de nombre');
    await this.assertUniqueName(name, id);
    const from = categorizeVehicleType(current.name), to = categorizeVehicleType(name);
    if (from !== to) {
      const used = await this.repository.usage(id);
      // Cambiar de categoría cambiaría la plaza y la tarifa de vehículos que ya tienen reservas.
      if (used.models || used.vehicles) throw new AppError(`“${current.name}” lo usan ${usedBy(used)}: con el nombre “${name}” pasaría de ${from} a ${to}. Creá un tipo nuevo en su lugar.`, 409);
    }
    return view((await this.repository.update(id, { name }))!);
  }

  async remove(id: string): Promise<boolean> {
    const current = await this.repository.findOne({ id });
    if (!current) return false;
    this.assertNotBase(current, 'dar de baja');
    const used = await this.repository.usage(id);
    if (used.models || used.vehicles) throw new AppError(`No se puede dar de baja “${current.name}”: lo usan ${usedBy(used)}.`, 409);
    return await this.repository.remove({ id });
  }

  private assertNotBase(type: VehicleType, action: string) {
    if (isBase(type)) throw new AppError(`“${type.name}” es un tipo base del sistema: no se puede ${action}.`, 409);
  }

  private async assertUniqueName(name: string, exceptId?: string) {
    const key = nameKey(name);
    const same = (await this.repository.findAll()).find((t) => t.id !== exceptId && nameKey(t.name) === key);
    if (same) throw new AppError(`Ya existe el tipo “${same.name}”.`, 409);
  }
}
