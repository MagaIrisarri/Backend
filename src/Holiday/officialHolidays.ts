import { z } from 'zod';
import { AppError } from '../Shared/utils/AppError.js';
import { OFFICIAL_HOLIDAYS_TIMEOUT_MS, OFFICIAL_HOLIDAYS_URL } from '../Shared/constants/holidays.js';

export interface OfficialHoliday { date: string; name: string }
// null: el año todavía no está publicado.
export type OfficialSource = (year: number) => Promise<OfficialHoliday[] | null>;

// La respuesta viene de afuera: se valida antes de que llegue a la base.
const responseSchema = z.array(z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nombre: z.string().trim().min(1).max(255),
}));

export const fetchOfficialHolidays: OfficialSource = async (year) => {
  let res: Response;
  try {
    res = await fetch(`${OFFICIAL_HOLIDAYS_URL}/${year}`, { signal: AbortSignal.timeout(OFFICIAL_HOLIDAYS_TIMEOUT_MS) });
  } catch {
    throw new AppError('No se pudo consultar el calendario oficial (argentinadatos.com). Probá más tarde.', 502);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new AppError(`El calendario oficial respondió con error ${res.status}. Probá más tarde.`, 502);
  const parsed = responseSchema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) throw new AppError('El calendario oficial respondió en un formato inesperado', 502);
  return parsed.data.filter((h) => h.fecha.startsWith(`${year}-`)).map((h) => ({ date: h.fecha, name: h.nombre }));
};
