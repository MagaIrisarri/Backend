import { CHECKOUT_GRACE_MINUTES } from '../Shared/constants/schedule.js';

const MS_PER_HOUR = 1000 * 60 * 60;

// R-14: horas que se cobran en la salida. Las reservadas se cobran aunque se retire antes (mínimo 1); si se queda más,
// cada hora empezada cuenta entera, con CHECKOUT_GRACE_MINUTES de gracia antes de la primera hora extra.
export function billHours(start: Date, end: Date, exit: Date): { reserved: number; extra: number; total: number } {
  const reserved = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_PER_HOUR));
  const stayed = Math.ceil((exit.getTime() - CHECKOUT_GRACE_MINUTES * 60 * 1000 - start.getTime()) / MS_PER_HOUR);
  const total = Math.max(reserved, stayed);
  return { reserved, extra: total - reserved, total };
}
