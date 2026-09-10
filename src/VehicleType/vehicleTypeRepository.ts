import { Repository } from "../Shared/base.Repository.js";
import { VehicleType } from './vehicleTypeEntity.js';

const vehicleTypes: VehicleType[] = [];

export class VehicleTypeRepository implements Repository<VehicleType> {

  public findAll(): VehicleType[] | undefined {
    return vehicleTypes;
  }

  public findOne(item: { id: string }): VehicleType | undefined {
    return vehicleTypes.find((vt) => vt.id === item.id);
  }

  public add(item: VehicleType): VehicleType | undefined {
    vehicleTypes.push(item);
    return item;
  }

  public update(item: VehicleType): VehicleType | undefined {
    const index = vehicleTypes.findIndex((vt) => vt.id === item.id);

    if (index >= 0) {
      vehicleTypes[index] = { ...vehicleTypes[index], ...item };
    }

    return vehicleTypes[index];
  }

  public remove(item: { id: string }): { id: string } | undefined {
    const index = vehicleTypes.findIndex((vt) => vt.id === item.id);

    if (index >= 0) {
      vehicleTypes.splice(index, 1);
      return { id: item.id };
    }
    else {
      return undefined;
    }
  
  }
}