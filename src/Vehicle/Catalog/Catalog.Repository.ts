import { EntityManager } from '@mikro-orm/core';
import { Brand } from '../Brand/Brand.Entity.js';
import { Model } from '../Model/Model.Entity.js';
import { VehicleType } from '../VehicleType/VehicleType.Entity.js';
import { User } from '../../User/User.Entity.js';
import { VehicleCategory } from '../../Shared/utils/vehicleTypes.js';

export interface CatalogPlan {
  brandsToCreate: { key: string; name: string }[];
  brandsToReactivate: Brand[];
  modelsToCreate: { brand?: Brand; brandKey: string; name: string; category: VehicleCategory }[];
  modelsToReactivate: Model[];
}

export class CatalogRepository {
  constructor(private em: EntityManager) {}

  findUser(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }

  // Incluye los dados de baja: la importación los reactiva en vez de duplicarlos.
  async snapshot(): Promise<{ brands: Brand[]; models: Model[] }> {
    const [brands, models] = await Promise.all([this.em.find(Brand, {}), this.em.find(Model, {}, { populate: ['brand'] as any })]);
    return { brands, models };
  }

  async apply(plan: CatalogPlan): Promise<void> {
    await this.em.transactional(async (em) => {
      const types = new Map((await em.find(VehicleType, {})).map((t) => [t.name, t]));
      const typeOf = (c: VehicleCategory) => types.get(c) ?? types.set(c, em.create(VehicleType, { name: c })).get(c)!;
      const created = new Map<string, Brand>();
      for (const b of plan.brandsToReactivate) b.isActive = true;
      for (const m of plan.modelsToReactivate) m.isActive = true;
      for (const b of plan.brandsToCreate) created.set(b.key, em.create(Brand, { name: b.name }));
      for (const m of plan.modelsToCreate) {
        em.create(Model, { name: m.name, brand: m.brand ?? created.get(m.brandKey)!, vehicleType: typeOf(m.category) });
      }
    });
  }
}
