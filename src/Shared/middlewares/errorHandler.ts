import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err.name === 'UniqueConstraintViolationException' || err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      status: 'error',
      message: 'El registro ya existe o hay un dato duplicado',
    });
  }

  console.error('ERROR:', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  return res.status(status).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? message : 'Algo salió mal, por favor intente nuevamente',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
};