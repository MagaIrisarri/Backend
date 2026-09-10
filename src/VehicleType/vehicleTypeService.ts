import { VehicleTypeRepository } from './vehicleTypeRepository.js';
import { VehicleType } from './vehicleTypeEntity.js';

export class VehicleTypeService {
  constructor(private repository: VehicleTypeRepository) {}

  findAll(): VehicleType[] | undefined {
    return this.repository.findAll();
  }

  findOne(id: string): VehicleType | undefined {
    return this.repository.findOne({ id });
  }

  add(input: Omit<VehicleType, "id">): VehicleType | undefined {
    const allVehicleTypes = this.repository.findAll() || [];
    const codeExists = allVehicleTypes.find((vt) => vt.code === input.code);

    if (codeExists) {
      return undefined;
    }

    const newVehicleType = new VehicleType(input.name, input.description, input.code);
    return this.repository.add(newVehicleType);
  }

  remove(id: string): { id: string } | undefined {
    return this.repository.remove({ id });
  }

  update(id: string, input: Partial<VehicleType>): VehicleType | undefined {
    return this.repository.update({ id, ...input } as VehicleType);
  }
}
