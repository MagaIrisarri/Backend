import { DateType, type Platform } from '@mikro-orm/core';
import { isoDate } from '../utils/dateUtils.js';

// Columna `date` que guarda el día local (America/Argentina/Buenos_Aires, ver orm.ts). MikroORM escribe los Date en UTC
// (forceUtcTimezone) y uno asignado después de las 21 h quedaba con la fecha del día siguiente. Se lee igual: 'YYYY-MM-DD'.
export class LocalDateType extends DateType {
  override convertToDatabaseValue(value: unknown, platform: Platform): string | null | undefined {
    return value instanceof Date ? isoDate(value) : super.convertToDatabaseValue(value as string | null | undefined, platform);
  }
}
