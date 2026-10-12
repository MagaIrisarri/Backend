import { Request } from 'express';
import { AppError } from './AppError.js';

// Quién hace la acción: el frontend lo manda siempre en x-user-id (sin autenticación, ver revision-alcance).
export const actorId = (req: Request, action: string): string => {
  const id = req.headers['x-user-id'];
  if (typeof id !== 'string' || !id) throw new AppError(`Falta el usuario (x-user-id) para ${action}`, 400);
  return id;
};
