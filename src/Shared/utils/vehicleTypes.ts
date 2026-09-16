/**
 * Módulo centralizado de clasificación y comparación de tipos de vehículo.
 *
 * Reemplaza las ~15 ocurrencias de lógica duplicada en:
 *  - Reservation.Repository.ts  (getVehicleVariants)
 *  - Reservation.Service.ts     (getVehicleVariants)
 *  - ParkingSpace.Service.ts    (matchesVehicleType)
 *  - ParkingPrice.Repository.ts (matchesType, findOfficialVehicleType)
 *  - Parking.Service.ts         (filtros inline, isMoto, isTruck)
 */

/** Categorías canónicas de vehículos */
export type VehicleCategory = 'AUTO' | 'MOTO' | 'CAMIONETA';

/**
 * Mapeo de categorías a todos los sinónimos reconocidos (UPPERCASE).
 * Si se agrega un sinónimo nuevo, hacerlo aquí y se propaga a todo el sistema.
 */
export const VEHICLE_CATEGORIES: Record<VehicleCategory, readonly string[]> = {
  MOTO: ['MOTOCICLETA', 'MOTO', 'BICICLETA', 'BICI'],
  CAMIONETA: ['CAMIONETA', 'UTILITARIO', 'VAN', 'PICKUP', 'PICK-UP', 'SUV'],
  AUTO: ['AUTO', 'AUTOMOVIL', 'AUTOMÓVIL', 'SEDAN', 'COUPÉ', 'COUPE'],
} as const;

/**
 * Devuelve la categoría canónica de un tipo de vehículo (texto libre).
 *
 * @example categorizeVehicleType('Motocicleta') // 'MOTO'
 * @example categorizeVehicleType('PICK-UP')     // 'CAMIONETA'
 * @example categorizeVehicleType('Sedan')       // 'AUTO'
 */
export function categorizeVehicleType(raw?: string): VehicleCategory {
  const upper = (raw || '').trim().toUpperCase();

  if (upper.includes('MOTO') || upper.includes('BICI')) return 'MOTO';

  if (
    upper.includes('CAMION') ||
    upper.includes('UTIL') ||
    upper.includes('VAN') ||
    upper.includes('PICK') ||
    upper.includes('SUV')
  ) {
    return 'CAMIONETA';
  }

  return 'AUTO';
}

/**
 * Devuelve todas las variantes textuales (mixed-case) de un tipo de vehículo
 * para usar en queries `{ $in: [...] }`.
 *
 * Reemplaza `getVehicleVariants` de Reservation.Repository.ts L134
 * y Reservation.Service.ts L163.
 */
export function getVehicleVariants(typeName?: string): string[] {
  const category = categorizeVehicleType(typeName);

  switch (category) {
    case 'MOTO':
      return ['MOTOCICLETA', 'Motocicleta', 'MOTO', 'Moto', 'moto', 'motocicleta'];
    case 'CAMIONETA':
      return [
        'CAMIONETA', 'Camioneta', 'camioneta',
        'UTILITARIO', 'Utilitario', 'utilitario',
        'VAN', 'Van', 'van',
        'PICKUP', 'Pickup', 'pickup',
      ];
    case 'AUTO':
    default:
      return ['AUTO', 'Auto', 'auto', 'AUTOMOVIL', 'Automovil', 'automovil'];
  }
}

/**
 * Compara dos tipos de vehículo y retorna `true` si pertenecen a la misma categoría.
 *
 * Reemplaza `matchesType` de ParkingPrice.Repository.ts L86
 * y `matchesVehicleType` de ParkingSpace.Service.ts L135.
 *
 * @example matchesVehicleType('Motocicleta', 'MOTO') // true
 * @example matchesVehicleType('AUTO', 'Camioneta')   // false
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
