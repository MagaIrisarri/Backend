
export type VehicleCategory = 'AUTO' | 'MOTO' | 'CAMIONETA';

export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = ['AUTO', 'MOTO', 'CAMIONETA'] as const;


export function categorizeVehicleType(raw?: string): VehicleCategory {
  const upper = (raw ?? '').trim().toUpperCase();
  if (upper === 'MOTO' || upper.includes('MOTO') || upper.includes('BICI')) return 'MOTO';
  if (upper === 'CAMIONETA' || upper.includes('CAMION') || upper.includes('PICK') || upper.includes('SUV') || upper.includes('VAN') || upper.includes('UTIL')) return 'CAMIONETA';
  return 'AUTO';
}

/**
 * Retorna el tipo canónico como array para usar en queries `$in`.
 * Con los datos estandarizados en BD, esto retorna un array de un solo elemento.
 */
export function getVehicleVariants(typeName?: string): VehicleCategory[] {
  return [categorizeVehicleType(typeName)];
}

/**
 * Compara dos tipos de vehículo y retorna `true` si pertenecen a la misma categoría.
 */
export function matchesVehicleType(typeA?: string, typeB?: string): boolean {
  return categorizeVehicleType(typeA) === categorizeVehicleType(typeB);
}

export function groupSpacesByVehicleType<T extends { vehicleType?: string, isActive?: boolean }>(spaces: T[]) {
  const active = spaces.filter((s) => s.isActive);
  return {
    auto: active.filter((s) => categorizeVehicleType(s.vehicleType) === 'AUTO'),
    moto: active.filter((s) => categorizeVehicleType(s.vehicleType) === 'MOTO'),
    camioneta: active.filter((s) => categorizeVehicleType(s.vehicleType) === 'CAMIONETA'),
  };
}
