import { CatalogRepository, CatalogPlan } from './Catalog.Repository.js';
import { AppError } from '../../Shared/utils/AppError.js';
import { UserStatus, UserType } from '../../Shared/constants/status.js';
import { categorizeVehicleType } from '../../Shared/utils/vehicleTypes.js';
import { cleanName as clean, descKey, nameKey as key } from '../../Shared/utils/names.js';
import { suggestType } from './typeMap.js';

export interface CatalogItem { brand: string; model: string; type: string }

const SAMPLE_SIZE = 20;
const MIN_NAME = 2;

// shortcut: L-33, lista fija de palabras de tipos que no son de pasajeros; revisarla si el DNRPA cambia sus descripciones.
const NOT_PASSENGER = /ACOPLADO|SEMIRREMOLQUE|TRACTOR|CHASIS|OMNIBUS|MIDIBUS|MINIBUS|TRANS\.? ?DE PASAJEROS/;

export class CatalogService {
  constructor(private repository: CatalogRepository) {}

  // RA-14: solo agrega marcas y modelos que faltan (y reactiva los dados de baja); de lo existente solo completa la descripción
  // del DNRPA si no la tiene. Con dryRun solo cuenta.
  // RA-26: el tipo de cada modelo nuevo sale de la tabla descripción → tipo. Una descripción que no está en la tabla:
  // si ya tiene modelos, toma el tipo que tienen; si es nueva, el que eligió el administrador en la vista previa (`typeMap`,
  // descripción → id de tipo) o el sugerido. Al confirmar, toda descripción nueva queda en la tabla.
  async importItems(actorId: string, items: CatalogItem[], dryRun: boolean, typeMap: Record<string, string> = {}) {
    const actor = await this.repository.findUser(actorId);
    if (actor?.type !== UserType.ADMINISTRADOR || actor.status !== UserStatus.ACTIVO) {
      throw new AppError('Solo un administrador puede actualizar el catálogo', 403);
    }

    const { brands, models, types, rows } = await this.repository.snapshot();
    const typeById = new Map(types.map((t) => [t.id, t]));
    const chosen = new Map(Object.entries(typeMap).map(([d, id]) => [descKey(d), id]));
    if ([...chosen.values()].some((id) => !typeById.has(id))) throw new AppError('Tipo de vehículo no encontrado o dado de baja', 404);

    const brandByKey = new Map(brands.map((b) => [key(b.name), b]));
    const modelByKey = new Map(models.map((m) => [`${key(m.brand.name)}|${key(m.name)}`, m]));
    const rowByKey = new Map(rows.map((r) => [r.descriptionKey, r.vehicleType.id]));
    // Descripciones sin fila que ya tienen modelos (en la base o que se describen ahora): el tipo que tienen, el más común.
    const existing = new Map<string, Map<string, number>>();
    const count = (k: string, typeId: string) => {
      const c = existing.get(k) ?? new Map<string, number>();
      c.set(typeId, (c.get(typeId) ?? 0) + 1);
      existing.set(k, c);
    };
    for (const m of models) if (m.dnrpaDescription && !rowByKey.has(descKey(m.dnrpaDescription))) count(descKey(m.dnrpaDescription), m.vehicleType.id);

    const plan: CatalogPlan = { brandsToCreate: [], brandsToReactivate: [], modelsToCreate: [], modelsToReactivate: [], modelsToDescribe: [], rowsToCreate: [] };
    const valid = (item: CatalogItem) => key(item.brand).length >= MIN_NAME && key(item.model).length >= MIN_NAME && !NOT_PASSENGER.test(key(item.type));
    for (const item of items) {
      const model = valid(item) ? modelByKey.get(`${key(item.brand)}|${key(item.model)}`) : undefined;
      const description = clean(item.type);
      if (model && !model.dnrpaDescription && description && !plan.modelsToDescribe.some((d) => d.model === model)) {
        plan.modelsToDescribe.push({ model, description });
        if (!rowByKey.has(descKey(description))) count(descKey(description), model.vehicleType.id);
      }
    }

    // Descripciones nuevas de esta importación: las que no están en la tabla ni tienen modelos.
    const fresh = new Map<string, { description: string; models: number; suggested?: string; typeId: string | null; category: ReturnType<typeof categorizeVehicleType> }>();
    const typeFor = (description: string) => {
      const k = descKey(description);
      if (rowByKey.has(k)) return rowByKey.get(k)!;
      const had = existing.get(k);
      if (had) return [...had].sort((a, b) => b[1] - a[1])[0][0];
      const entry = fresh.get(k) ?? (() => {
        const suggested = suggestType(description, types)?.id;
        const e = { description, models: 0, suggested, typeId: chosen.get(k) ?? suggested ?? null, category: categorizeVehicleType(description) };
        fresh.set(k, e);
        return e;
      })();
      entry.models++;
      return entry.typeId;
    };

    const seen = new Set<string>();
    const newBrands = new Set<string>();
    const reactivatedBrands = new Set<string>();
    let existingModels = 0, skipped = 0;

    for (const item of items) {
      const brandKey = key(item.brand), modelKey = key(item.model);
      if (!valid(item)) { skipped++; continue; }
      const pair = `${brandKey}|${modelKey}`;
      if (seen.has(pair)) continue;
      seen.add(pair);

      const brand = brandByKey.get(brandKey);
      if (!brand && !newBrands.has(brandKey)) { newBrands.add(brandKey); plan.brandsToCreate.push({ key: brandKey, name: clean(item.brand) }); }
      if (brand && !brand.isActive && !reactivatedBrands.has(brandKey)) { reactivatedBrands.add(brandKey); plan.brandsToReactivate.push(brand); }

      const model = modelByKey.get(pair);
      if (!model) {
        const description = clean(item.type);
        plan.modelsToCreate.push({
          brand, brandKey, name: clean(item.model), description: description || null,
          typeId: description ? typeFor(description) : null, category: categorizeVehicleType(item.type),
        });
      }
      else if (!model.isActive) plan.modelsToReactivate.push(model);
      else existingModels++;
    }
    plan.rowsToCreate = [...fresh].map(([k, e]) => ({ key: k, description: e.description, typeId: e.typeId, category: e.category }));

    if (!dryRun) await this.repository.apply(plan);

    const brandName = (k: string) => brandByKey.get(k)?.name ?? plan.brandsToCreate.find((b) => b.key === k)!.name;
    const typeName = (m: { typeId: string | null; category: string }) => (m.typeId && typeById.get(m.typeId)?.name) || m.category;
    return {
      unique: seen.size,
      brandsNew: plan.brandsToCreate.length,
      modelsNew: plan.modelsToCreate.length,
      reactivated: plan.brandsToReactivate.length + plan.modelsToReactivate.length,
      described: plan.modelsToDescribe.length,
      existing: existingModels,
      skipped,
      // Descripciones nuevas: la vista previa le pregunta al administrador a qué tipo va cada una.
      descriptions: [...fresh.values()].map((e) => ({
        description: e.description, models: e.models,
        suggested: e.suggested ? { id: e.suggested, name: typeById.get(e.suggested)!.name } : null,
      })),
      sample: plan.modelsToCreate.slice(0, SAMPLE_SIZE).map((m) => ({ brand: brandName(m.brandKey), model: m.name, type: typeName(m) })),
    };
  }
}
