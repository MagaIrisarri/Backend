import { CatalogRepository, CatalogPlan } from './Catalog.Repository.js';
import { AppError } from '../../Shared/utils/AppError.js';
import { UserStatus, UserType } from '../../Shared/constants/status.js';
import { categorizeVehicleType } from '../../Shared/utils/vehicleTypes.js';
import { cleanName as clean, descKey, nameKey as key } from '../../Shared/utils/names.js';
import { suggestNotAdmitted, suggestType } from './typeMap.js';

export interface CatalogItem { brand: string; model: string; type: string }

const MIN_NAME = 2;

export class CatalogService {
  constructor(private repository: CatalogRepository) {}

  // RA-14: solo agrega marcas y modelos que faltan (y reactiva los dados de baja); de lo existente solo completa la descripción
  // del DNRPA si no la tiene. Con dryRun solo cuenta.
  // RA-26: el tipo de cada modelo nuevo sale de la tabla descripción → tipo. Una descripción que no está en la tabla:
  // si ya tiene modelos, toma el tipo que tienen; si es nueva, el que eligió el administrador en la vista previa (`typeMap`,
  // descripción → id de tipo) o el sugerido. Al confirmar, toda descripción nueva queda en la tabla.
  // L-33: una descripción no admitida (fila sin tipo, o elegida con `null` en `typeMap`) no agrega modelos: van a omitidos.
  // L-33: los modelos destildados (`exclude`) quedan no admitidos: las importaciones siguientes los omiten sin mostrarlos.
  async importItems(actorId: string, items: CatalogItem[], dryRun: boolean, typeMap: Record<string, string | null> = {}, exclude: string[] = []) {
    await this.assertAdmin(actorId);

    const { brands, models, types, rows, excluded: blocked } = await this.repository.snapshot();
    const blockedKeys = new Set(blocked.map((b) => b.modelKey));
    const typeById = new Map(types.map((t) => [t.id, t]));
    const chosen = new Map(Object.entries(typeMap).map(([d, id]) => [descKey(d), id]));
    if ([...chosen.values()].some((id) => id !== null && !typeById.has(id))) throw new AppError('Tipo de vehículo no encontrado o dado de baja', 404);

    const brandByKey = new Map(brands.map((b) => [key(b.name), b]));
    const modelByKey = new Map(models.map((m) => [`${key(m.brand.name)}|${key(m.name)}`, m]));
    const rowByKey = new Map(rows.map((r) => [r.descriptionKey, r.vehicleType?.id ?? null])); // null: no admitida
    // Descripciones sin fila que ya tienen modelos (en la base o que se describen ahora): el tipo que tienen, el más común.
    const existing = new Map<string, Map<string, number>>();
    const count = (k: string, typeId: string) => {
      const c = existing.get(k) ?? new Map<string, number>();
      c.set(typeId, (c.get(typeId) ?? 0) + 1);
      existing.set(k, c);
    };
    for (const m of models) if (m.dnrpaDescription && !rowByKey.has(descKey(m.dnrpaDescription))) count(descKey(m.dnrpaDescription), m.vehicleType.id);

    const plan: CatalogPlan = {
      brandsToCreate: [], brandsToReactivate: [], modelsToCreate: [], modelsToReactivate: [], modelsToDescribe: [], modelsToExclude: [], rowsToCreate: [],
    };
    const valid = (item: CatalogItem) => key(item.brand).length >= MIN_NAME && key(item.model).length >= MIN_NAME;
    for (const item of items) {
      const model = valid(item) ? modelByKey.get(`${key(item.brand)}|${key(item.model)}`) : undefined;
      const description = clean(item.type);
      if (model && !model.dnrpaDescription && description && !plan.modelsToDescribe.some((d) => d.model === model)) {
        plan.modelsToDescribe.push({ model, description });
        if (!rowByKey.has(descKey(description))) count(descKey(description), model.vehicleType.id);
      }
    }

    // Descripciones nuevas de esta importación: las que no están en la tabla ni tienen modelos.
    type Fresh = {
      description: string; models: number; suggested?: string; notAdmitted: boolean; rejected: boolean;
      typeId: string | null; category: ReturnType<typeof categorizeVehicleType>;
    };
    const fresh = new Map<string, Fresh>();
    const freshEntry = (description: string): Fresh | undefined => {
      const k = descKey(description);
      if (rowByKey.has(k) || existing.has(k)) return undefined;
      let e = fresh.get(k);
      if (!e) {
        const suggested = suggestType(description, types)?.id;
        const pick = chosen.get(k);
        e = {
          description, models: 0, suggested, notAdmitted: suggestNotAdmitted(description), rejected: pick === null,
          typeId: pick ?? suggested ?? null, category: categorizeVehicleType(description),
        };
        fresh.set(k, e);
      }
      return e;
    };
    // Si la descripción de un modelo nuevo no se admite. Una nueva rechazada cuenta el modelo igual: su fila se crea sin tipo.
    const rejected = (description: string) => {
      const k = descKey(description);
      if (rowByKey.has(k)) return rowByKey.get(k) === null;
      const e = freshEntry(description);
      if (e?.rejected) e.models++;
      return !!e?.rejected;
    };
    const typeFor = (description: string) => {
      const k = descKey(description);
      if (rowByKey.has(k)) return rowByKey.get(k)!;
      const had = existing.get(k);
      if (had) return [...had].sort((a, b) => b[1] - a[1])[0][0];
      const entry = freshEntry(description)!;
      entry.models++;
      return entry.typeId;
    };

    const seen = new Set<string>();
    const excluded = new Set(exclude);
    const newBrands = new Set<string>();
    const reactivatedBrands = new Set<string>();
    let existingModels = 0, skipped = 0;

    for (const item of items) {
      const brandKey = key(item.brand), modelKey = key(item.model);
      if (!valid(item)) { skipped++; continue; }
      const pair = `${brandKey}|${modelKey}`;
      if (seen.has(pair)) continue;
      seen.add(pair);

      const model = modelByKey.get(pair);
      const description = clean(item.type);
      // Un modelo nuevo destildado en la vista previa no se crea, ni su marca si no le queda otro, y queda no admitido.
      if (!model && blockedKeys.has(pair)) { skipped++; continue; }
      if (!model && excluded.has(pair)) { plan.modelsToExclude.push({ key: pair, brand: clean(item.brand), model: clean(item.model) }); continue; }
      if (!model && description && rejected(description)) { skipped++; continue; }
      const brand = brandByKey.get(brandKey);
      if (!brand && !newBrands.has(brandKey)) { newBrands.add(brandKey); plan.brandsToCreate.push({ key: brandKey, name: clean(item.brand) }); }
      if (brand && !brand.isActive && !reactivatedBrands.has(brandKey)) { reactivatedBrands.add(brandKey); plan.brandsToReactivate.push(brand); }

      if (!model) {
        plan.modelsToCreate.push({
          brand, brandKey, name: clean(item.model), description: description || null,
          typeId: description ? typeFor(description) : null, category: categorizeVehicleType(item.type),
        });
      }
      else if (!model.isActive) plan.modelsToReactivate.push(model);
      else existingModels++;
    }
    plan.rowsToCreate = [...fresh].map(([k, e]) => ({ key: k, description: e.description, typeId: e.typeId, category: e.category, rejected: e.rejected }));

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
      excluded: plan.modelsToExclude.length,
      // Descripciones nuevas: la vista previa le pregunta al administrador a qué tipo va cada una, o si no se admite
      // (`notAdmitted`: se le sugiere no admitirla).
      descriptions: [...fresh.values()].map((e) => ({
        description: e.description, models: e.models, notAdmitted: e.notAdmitted,
        suggested: e.suggested ? { id: e.suggested, name: typeById.get(e.suggested)!.name } : null,
      })),
      // Todos los modelos nuevos: la vista previa los pagina y deja destildar cualquiera (`key` va en `exclude` al confirmar).
      newModels: plan.modelsToCreate.map((m) => ({
        key: `${m.brandKey}|${key(m.name)}`, brand: brandName(m.brandKey), model: m.name, description: m.description, type: typeName(m),
      })),
    };
  }

  async excludedModels(actorId: string) {
    await this.assertAdmin(actorId);
    return (await this.repository.findExcluded()).map((e) => ({ id: e.id, brand: e.brand, model: e.model, createdAt: e.createdAt }));
  }

  // Vuelve a admitir un modelo: la próxima importación lo muestra como nuevo.
  async readmit(actorId: string, id: string): Promise<boolean> {
    await this.assertAdmin(actorId);
    return this.repository.removeExcluded(id);
  }

  private async assertAdmin(actorId: string) {
    const actor = await this.repository.findUser(actorId);
    if (actor?.type !== UserType.ADMINISTRADOR || actor.status !== UserStatus.ACTIVO) {
      throw new AppError('Solo un administrador puede actualizar el catálogo', 403);
    }
  }
}
