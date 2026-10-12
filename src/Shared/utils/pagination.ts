import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/pagination.js';

// Campos de `query` de un listado paginado. Sin `page` el endpoint devuelve todo, como antes de paginar.
export const pageQuery = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

// Cada palabra de la búsqueda como patrón LIKE (con % y _ escapados): el listado exige que todas aparezcan, en cualquier campo.
export const likeWords = (q?: string): string[] =>
  (q ?? '').trim().split(/\s+/).filter(Boolean).map((w) => `%${w.replace(/[\\%_]/g, '\\$&')}%`);

export interface PageMeta { page: number; limit: number; total: number }
