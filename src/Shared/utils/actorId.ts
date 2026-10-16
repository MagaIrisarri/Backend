import { Request } from 'express';
import { AppError } from './AppError.js';

// Quién hace la acción: el usuario del token, que deja el middleware auth (Shared/middlewares/auth.ts).
export const actorId = (req: Request, action: string): string => {
  if (!req.user) throw new AppError(`Iniciá sesión para ${action}`, 401);
  return req.user.id;
};
