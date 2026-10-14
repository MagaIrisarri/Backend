import { CatalogRepository, CatalogPlan } from './Catalog.Repository.js';
import { AppError } from '../../Shared/utils/AppError.js';
import { UserStatus, UserType } from '../../Shared/constants/status.js';
import { categorizeVehicleType } from '../../Shared/utils/vehicleTypes.js';
import { cleanName as clean, nameKey as key } from '../../Shared/utils/names.js';

export interface CatalogItem { brand: string; model: string; type: string }

const SAMPLE_SIZE = 20;
const MIN_NAME = 2;

// shortcut: L-33, lista fija de palabras de tipos que no son de pasajeros; revisarla si el DNRPA cambia sus descripciones.
const NOT_PASSENGER = /ACOPLADO|SEMIRREMOLQUE|TRACTOR|CHASIS|OMNIBUS|MIDIBUS|MINIBUS|TRANS\.? ?DE PASAJEROS/;

export class CatalogService {
  constructor(private repository: CatalogRepository) {}

  // RA-14: solo agrega marcas y modelos que faltan (y reactiva los dados de baja); nunca borra ni edita. Con dryRun solo cuenta.
  async importItems(actorId: string, items: CatalogItem[], dryRun: boolean) {
    const actor = await this.repository.findUser(actorId);
    if (actor?.type !== UserType.ADMINISTRADOR || actor.status !== UserStatus.ACTIVO) {
      throw new AppError('Solo un administrador puede actualizar el catálogo', 403);
    }

    const { brands, models } = await this.repository.snapshot();
    const brandByKey = new Map(brands.map((b) => [key(b.name), b]));
    const modelByKey = new Map(models.map((m) => [`${key(m.brand.name)}|${key(m.name)}`, m]));

    const plan: CatalogPlan = { brandsToCreate: [], brandsToReactivate: [], modelsToCreate: [], modelsToReactivate: [] };
    const seen = new Set<string>();
    const newBrands = new Set<string>();
    const reactivatedBrands = new Set<string>();
    let existing = 0, skipped = 0;

    for (const item of items) {
      const brandKey = key(item.brand), modelKey = key(item.model);
      if (brandKey.length < MIN_NAME || modelKey.length < MIN_NAME || NOT_PASSENGER.test(key(item.type))) { skipped++; continue; }
      const pair = `${brandKey}|${modelKey}`;
      if (seen.has(pair)) continue;
      seen.add(pair);

      const brand = brandByKey.get(brandKey);
      if (!brand && !newBrands.has(brandKey)) { newBrands.add(brandKey); plan.brandsToCreate.push({ key: brandKey, name: clean(item.brand) }); }
      if (brand && !brand.isActive && !reactivatedBrands.has(brandKey)) { reactivatedBrands.add(brandKey); plan.brandsToReactivate.push(brand); }

      const model = modelByKey.get(pair);
      if (!model) plan.modelsToCreate.push({ brand, brandKey, name: clean(item.model), category: categorizeVehicleType(item.type) });
      else if (!model.isActive) plan.modelsToReactivate.push(model);
      else existing++;
    }

    if (!dryRun) await this.repository.apply(plan);

    const brandName = (k: string) => brandByKey.get(k)?.name ?? plan.brandsToCreate.find((b) => b.key === k)!.name;
    return {
      unique: seen.size,
      brandsNew: plan.brandsToCreate.length,
      modelsNew: plan.modelsToCreate.length,
      reactivated: plan.brandsToReactivate.length + plan.modelsToReactivate.length,
      existing,
      skipped,
      sample: plan.modelsToCreate.slice(0, SAMPLE_SIZE).map((m) => ({ brand: brandName(m.brandKey), model: m.name, type: m.category })),
    };
  }
}
