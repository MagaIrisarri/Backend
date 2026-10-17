import { EntityManager } from '@mikro-orm/core';
import { Brand } from '../Brand/Brand.Entity.js';
import { Model } from '../Model/Model.Entity.js';
import { VehicleType } from '../VehicleType/VehicleType.Entity.js';
import { User } from '../../User/User.Entity.js';
import { VehicleCategory, findBaseType } from '../../Shared/utils/vehicleTypes.js';
import { DnrpaTypeMap } from './DnrpaTypeMap.Entity.js';
import { fillMissingRows } from './typeMap.js';
import { ExcludedModel } from './ExcludedModel.Entity.js';

// typeId null: el tipo base de `category` (se crea si falta).
interface TypeChoice { typeId: string | null; category: VehicleCategory }

export interface CatalogPlan {
  brandsToCreate: { key: string; name: string }[];
  brandsToReactivate: Brand[];
  modelsToCreate: ({ brand?: Brand; brandKey: string; name: string; description: string | null } & TypeChoice)[];
  modelsToReactivate: Model[];
  modelsToDescribe: { model: Model; description: string }[]; // modelos cargados antes sin la descripción del DNRPA
  modelsToExclude: { key: string; brand: string; model: string }[]; // destildados en la vista previa: quedan no admitidos (L-33)
  rowsToCreate: ({ key: string; description: string; rejected: boolean } & TypeChoice)[]; // descripciones nuevas de la tabla (RA-26); rejected: no admitida
}

export class CatalogRepository {
  constructor(private em: EntityManager) {}

  // L-33: los modelos no admitidos, los más recientes primero.
  findExcluded(): Promise<ExcludedModel[]> {
    return this.em.find(ExcludedModel, {}, { orderBy: { createdAt: 'DESC' } });
  }

  async removeExcluded(id: string): Promise<boolean> {
    return (await this.em.nativeDelete(ExcludedModel, { id })) > 0;
  }

  findUser(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }

  // Incluye los dados de baja: la importación los reactiva en vez de duplicarlos.
  async snapshot(): Promise<{ brands: Brand[]; models: Model[]; types: VehicleType[]; rows: DnrpaTypeMap[]; excluded: ExcludedModel[] }> {
    const [brands, models, types, rows, excluded] = await Promise.all([
      this.em.find(Brand, {}),
      this.em.find(Model, {}, { populate: ['brand'] as any }),
      this.em.find(VehicleType, { isActive: true }),
      this.em.find(DnrpaTypeMap, {}),
      this.em.find(ExcludedModel, {}),
    ]);
    return { brands, models, types, rows, excluded };
  }

  async apply(plan: CatalogPlan): Promise<void> {
    await this.em.transactional(async (em) => {
      const existing = await em.find(VehicleType, {});
      const types = new Map<VehicleCategory, VehicleType>();
      const base = (c: VehicleCategory) => types.get(c) ?? types.set(c, findBaseType(existing, c) ?? em.create(VehicleType, { name: c })).get(c)!;
      const typeOf = ({ typeId, category }: TypeChoice) => (typeId ? em.getReference(VehicleType, typeId) : base(category));

      for (const r of plan.rowsToCreate) {
        em.create(DnrpaTypeMap, { descriptionKey: r.key, description: r.description, vehicleType: r.rejected ? null : typeOf(r) });
      }
      const created = new Map<string, Brand>();
      for (const b of plan.brandsToReactivate) b.isActive = true;
      for (const m of plan.modelsToReactivate) m.isActive = true;
      for (const b of plan.brandsToCreate) created.set(b.key, em.create(Brand, { name: b.name }));
      for (const m of plan.modelsToCreate) {
        em.create(Model, { name: m.name, brand: m.brand ?? created.get(m.brandKey)!, vehicleType: typeOf(m), dnrpaDescription: m.description });
      }
      for (const { model, description } of plan.modelsToDescribe) model.dnrpaDescription = description;
      for (const m of plan.modelsToExclude) em.create(ExcludedModel, { modelKey: m.key, brand: m.brand, model: m.model, createdAt: new Date() });
      await em.flush();
      // Las descripciones que ahora tienen modelos y todavía no tienen fila la toman del tipo que ya tienen esos modelos.
      await fillMissingRows(em);
    });
  }
}
